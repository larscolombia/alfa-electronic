package mailer

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"pika.software.net.co/backend/internal/platform/database"
)

// FASE 5c — outbox durable de correos transaccionales.
//
// Lo que estos tests tienen que probar no es que el SMTP funcione (eso depende
// de credenciales reales), sino las dos garantías que motivaron el diseño de
// outbox: (1) un correo NUNCA se reporta como enviado si no salió, y (2) los
// reintentos están acotados para que una fila mala no gire para siempre.

func openMailerTestDB(t *testing.T) *sql.DB {
	t.Helper()
	if os.Getenv("RUN_DB_TESTS") == "" {
		t.Skip("set RUN_DB_TESTS=1 to run database integration tests")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@127.0.0.1:5432/alfa?sslmode=disable"
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	if err := db.Ping(); err != nil {
		db.Close()
		t.Fatalf("ping test database: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		db.Close()
		t.Fatalf("migrate test database: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func mailerTestCompany(t *testing.T, db *sql.DB, name string) string {
	t.Helper()
	companyID := fmt.Sprintf("qa-mail-%s-%d", name, time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM email_outbox WHERE company_id = $1`, companyID)
	})
	return companyID
}

// failingSender simula un SMTP caído: cuenta los intentos para poder afirmar
// que el tope de reintentos se respeta.
type failingSender struct {
	calls int
	err   error
}

func (f *failingSender) Send(to, subject, bodyHTML string) error {
	f.calls++
	if f.err != nil {
		return f.err
	}
	return errors.New("conexion rechazada por el servidor SMTP")
}

type recordingSender struct {
	sent []string
}

func (r *recordingSender) Send(to, subject, bodyHTML string) error {
	r.sent = append(r.sent, to)
	return nil
}

func sampleEnqueue(companyID, kind, to string) EnqueueRequest {
	return EnqueueRequest{
		CompanyID: companyID,
		Kind:      kind,
		ToEmail:   to,
		Subject:   "Asunto de prueba",
		BodyHTML:  "<p>hola</p>",
		RefType:   "crm-quote",
		RefID:     "q-" + kind + to,
		CreatedBy: "tester@qa.local",
	}
}

// resetBackoff pone next_attempt_at en el pasado para que la siguiente pasada
// del worker tome la fila sin esperar el backoff real.
func resetBackoff(t *testing.T, db *sql.DB, companyID string) {
	t.Helper()
	if _, err := db.Exec(
		`UPDATE email_outbox SET next_attempt_at = NOW() - interval '1 hour' WHERE company_id = $1`,
		companyID,
	); err != nil {
		t.Fatalf("reiniciar backoff: %v", err)
	}
}

func readStatus(t *testing.T, db *sql.DB, companyID, id string) (string, int, string) {
	t.Helper()
	var status, lastError string
	var attempts int
	err := db.QueryRow(
		`SELECT status, attempts, last_error FROM email_outbox WHERE company_id = $1 AND id = $2`,
		companyID, id,
	).Scan(&status, &attempts, &lastError)
	if err != nil {
		t.Fatalf("leer fila del outbox: %v", err)
	}
	return status, attempts, lastError
}

// La garantía central de la Fase 5c: sin SMTP configurado el correo queda
// 'desactivado' con un error legible. Nunca 'enviado', nunca borrado.
func TestDisabledModeMarksRowsDisabledNeverSent(t *testing.T) {
	db := openMailerTestDB(t)
	companyID := mailerTestCompany(t, db, "disabled")

	// Sender nil ES el modo desactivado (SMTP_HOST vacío).
	outbox := NewOutbox(db, Config{}, nil)
	if outbox.Enabled() {
		t.Fatal("outbox con sender nil no puede reportarse habilitado")
	}

	// El enqueue ya nace marcado, para que la respuesta HTTP del disparador
	// diga la verdad en el momento en vez de prometer un envío futuro.
	message, err := outbox.Enqueue(sampleEnqueue(companyID, KindQuoteSent, "cliente@example.com"))
	if err != nil {
		t.Fatalf("Enqueue: %v", err)
	}
	if message.Status != StatusDisabled {
		t.Errorf("status al encolar = %q, esperaba %q", message.Status, StatusDisabled)
	}
	if message.LastError != DisabledError {
		t.Errorf("last_error = %q, esperaba %q", message.LastError, DisabledError)
	}

	status, _, lastError := readStatus(t, db, companyID, message.ID)
	if status != StatusDisabled {
		t.Errorf("status en BD = %q, esperaba %q", status, StatusDisabled)
	}
	if status == StatusSent {
		t.Error("REGRESION CRITICA: un correo sin SMTP quedo marcado como enviado")
	}
	if !strings.Contains(lastError, "SMTP no configurado") {
		t.Errorf("last_error = %q, debe decir que el SMTP no esta configurado", lastError)
	}

	// Una pasada del worker no debe "arreglar" la fila a enviado ni borrarla.
	worker := NewWorker(outbox, time.Second)
	worker.ProcessOnce()

	status, _, lastError = readStatus(t, db, companyID, message.ID)
	if status != StatusDisabled {
		t.Errorf("status tras el worker = %q, esperaba %q", status, StatusDisabled)
	}
	if !strings.Contains(lastError, "SMTP no configurado") {
		t.Errorf("last_error tras el worker = %q", lastError)
	}

	// Y sigue siendo visible en el listado que consume GET /emails.
	listed, err := outbox.List(companyID, 50)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(listed) != 1 {
		t.Fatalf("List devolvio %d filas, esperaba 1 (el correo no debe descartarse)", len(listed))
	}
	if listed[0].Status != StatusDisabled || listed[0].LastError != DisabledError {
		t.Errorf("fila listada = %+v", listed[0])
	}
}

// El worker también convierte a 'desactivado' las filas que quedaron
// 'pendiente' (p. ej. encoladas cuando sí había SMTP y luego se desconfiguró).
func TestWorkerSweepsPendingRowsWhenDisabled(t *testing.T) {
	db := openMailerTestDB(t)
	companyID := mailerTestCompany(t, db, "sweep")

	// Se inserta a mano como 'pendiente' para simular el cambio de modo.
	if _, err := db.Exec(`
INSERT INTO email_outbox (company_id, id, kind, to_email, subject, body_html,
	ref_type, ref_id, status, attempts, last_error, next_attempt_at, created_by)
VALUES ($1, 'em-leftover', 'aviso-despacho', 'cliente@example.com', 's', 'b',
	'remission', 'rem-1', 'pendiente', 0, '', NOW(), 'tester')`, companyID); err != nil {
		t.Fatalf("sembrar pendiente: %v", err)
	}

	NewWorker(NewOutbox(db, Config{}, nil), time.Second).ProcessOnce()

	status, _, lastError := readStatus(t, db, companyID, "em-leftover")
	if status != StatusDisabled {
		t.Errorf("status = %q, esperaba %q", status, StatusDisabled)
	}
	if lastError != DisabledError {
		t.Errorf("last_error = %q, esperaba %q", lastError, DisabledError)
	}
}

// Sin destinatario no se encola: el disparador debe devolver un error visible
// en la UI, no registrar un correo que jamás puede salir.
func TestEnqueueWithoutRecipientIsRejected(t *testing.T) {
	db := openMailerTestDB(t)
	companyID := mailerTestCompany(t, db, "norecipient")

	outbox := NewOutbox(db, Config{}, nil)
	for _, to := range []string{"", "   "} {
		req := sampleEnqueue(companyID, KindDispatchNotice, to)
		if _, err := outbox.Enqueue(req); !errors.Is(err, ErrNoRecipient) {
			t.Errorf("Enqueue(to=%q) error = %v, esperaba ErrNoRecipient", to, err)
		}
	}

	listed, err := outbox.List(companyID, 50)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(listed) != 0 {
		t.Errorf("se encolaron %d filas sin destinatario, esperaba 0", len(listed))
	}
}

// Reintentos acotados: tras MaxAttempts la fila queda 'fallido' y el worker
// deja de intentarla. Sin este tope un destinatario inválido giraría para
// siempre tapando el outbox.
func TestWorkerRetriesAreBounded(t *testing.T) {
	db := openMailerTestDB(t)
	companyID := mailerTestCompany(t, db, "retries")

	sender := &failingSender{err: errors.New("550 5.1.1 destinatario desconocido")}
	outbox := NewOutbox(db, Config{Host: "smtp.example.com", Port: 587}, sender)
	if !outbox.Enabled() {
		t.Fatal("con SMTP_HOST configurado el outbox debe reportarse habilitado")
	}

	message, err := outbox.Enqueue(sampleEnqueue(companyID, KindQuoteSent, "inexistente@example.com"))
	if err != nil {
		t.Fatalf("Enqueue: %v", err)
	}

	for attempt := 1; attempt <= MaxAttempts+3; attempt++ {
		resetBackoff(t, db, companyID)
		NewWorker(outbox, time.Second).ProcessOnce()
	}

	status, attempts, lastError := readStatus(t, db, companyID, message.ID)
	if status != StatusFailed {
		t.Errorf("status final = %q, esperaba %q", status, StatusFailed)
	}
	if attempts != MaxAttempts {
		t.Errorf("attempts = %d, esperaba el tope %d", attempts, MaxAttempts)
	}
	if !strings.Contains(lastError, "destinatario desconocido") {
		t.Errorf("last_error = %q, debe conservar el motivo del fallo", lastError)
	}

	// Tres pasadas extra más arriba ya demostraron que no se reintenta: el
	// contador no pasó de MaxAttempts. Se vuelve a afirmar explícitamente.
	callsBefore := sender.calls
	resetBackoff(t, db, companyID)
	NewWorker(outbox, time.Second).ProcessOnce()
	if sender.calls != callsBefore {
		t.Errorf("el worker siguio reintentando tras el tope: %d -> %d llamadas", callsBefore, sender.calls)
	}
}

// Con SMTP funcionando la fila pasa a 'enviado' con sent_at, y el worker deja
// de tocarla.
func TestWorkerSendsPendingRowAndMarksSent(t *testing.T) {
	db := openMailerTestDB(t)
	companyID := mailerTestCompany(t, db, "sent")

	sender := &recordingSender{}
	outbox := NewOutbox(db, Config{Host: "smtp.example.com", Port: 587}, sender)

	message, err := outbox.Enqueue(sampleEnqueue(companyID, KindReceptionAcknow, "cliente@example.com"))
	if err != nil {
		t.Fatalf("Enqueue: %v", err)
	}
	if message.Status != StatusPending {
		t.Errorf("status inicial = %q, esperaba %q", message.Status, StatusPending)
	}

	NewWorker(outbox, time.Second).ProcessOnce()

	status, attempts, lastError := readStatus(t, db, companyID, message.ID)
	if status != StatusSent {
		t.Errorf("status = %q, esperaba %q", status, StatusSent)
	}
	if attempts != 1 {
		t.Errorf("attempts = %d, esperaba 1", attempts)
	}
	if lastError != "" {
		t.Errorf("last_error = %q, esperaba vacio tras un envio exitoso", lastError)
	}
	if len(sender.sent) != 1 || sender.sent[0] != "cliente@example.com" {
		t.Errorf("destinatarios enviados = %v", sender.sent)
	}

	var sentAt sql.NullTime
	if err := db.QueryRow(
		`SELECT sent_at FROM email_outbox WHERE company_id = $1 AND id = $2`,
		companyID, message.ID,
	).Scan(&sentAt); err != nil {
		t.Fatalf("leer sent_at: %v", err)
	}
	if !sentAt.Valid {
		t.Error("sent_at quedo nulo en una fila marcada como enviada")
	}

	// Una segunda pasada no reenvía.
	NewWorker(outbox, time.Second).ProcessOnce()
	if len(sender.sent) != 1 {
		t.Errorf("el worker reenvio una fila ya enviada: %d llamadas", len(sender.sent))
	}
}

// Reenviar el mismo referente actualiza la fila existente en vez de apilar
// duplicados: un doble clic en "Guardar y enviar" no debe mandar dos correos.
func TestEnqueueIsIdempotentByReference(t *testing.T) {
	db := openMailerTestDB(t)
	companyID := mailerTestCompany(t, db, "idempotent")

	sender := &recordingSender{}
	outbox := NewOutbox(db, Config{Host: "smtp.example.com"}, sender)

	first, err := outbox.Enqueue(sampleEnqueue(companyID, KindQuoteSent, "cliente@example.com"))
	if err != nil {
		t.Fatalf("Enqueue 1: %v", err)
	}
	NewWorker(outbox, time.Second).ProcessOnce()
	if status, _, _ := readStatus(t, db, companyID, first.ID); status != StatusSent {
		t.Fatalf("status tras primer envio = %q, esperaba %q", status, StatusSent)
	}

	// Mismo kind + ref_type + ref_id, asunto distinto (la cotización se editó).
	second := sampleEnqueue(companyID, KindQuoteSent, "cliente@example.com")
	second.Subject = "Cotizacion corregida"
	resent, err := outbox.Enqueue(second)
	if err != nil {
		t.Fatalf("Enqueue 2: %v", err)
	}
	if resent.ID != first.ID {
		t.Errorf("el reenvio creo una fila nueva (%s) en vez de reutilizar %s", resent.ID, first.ID)
	}

	status, attempts, lastError := readStatus(t, db, companyID, first.ID)
	if status != StatusPending {
		t.Errorf("status tras reenviar = %q, esperaba %q (debe volver a intentarse)", status, StatusPending)
	}
	if attempts != 0 {
		t.Errorf("attempts tras reenviar = %d, esperaba 0", attempts)
	}
	if lastError != "" {
		t.Errorf("last_error tras reenviar = %q, esperaba vacio", lastError)
	}

	listed, err := outbox.List(companyID, 50)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(listed) != 1 {
		t.Errorf("el outbox tiene %d filas para el mismo referente, esperaba 1", len(listed))
	}
}

// El outbox está aislado por empresa: un admin no ve los correos de otra.
func TestListIsCompanyScoped(t *testing.T) {
	db := openMailerTestDB(t)
	companyA := mailerTestCompany(t, db, "scopea")
	companyB := mailerTestCompany(t, db, "scopeb")

	outbox := NewOutbox(db, Config{}, nil)
	if _, err := outbox.Enqueue(sampleEnqueue(companyA, KindQuoteSent, "a@example.com")); err != nil {
		t.Fatalf("Enqueue A: %v", err)
	}
	if _, err := outbox.Enqueue(sampleEnqueue(companyB, KindQuoteSent, "b@example.com")); err != nil {
		t.Fatalf("Enqueue B: %v", err)
	}

	listedA, err := outbox.List(companyA, 50)
	if err != nil {
		t.Fatalf("List A: %v", err)
	}
	if len(listedA) != 1 || listedA[0].ToEmail != "a@example.com" {
		t.Errorf("List A = %+v, esperaba solo el correo de A", listedA)
	}
}

// pendingRowsForTest fuerza la visibilidad del helper interno desde el test.
func (o *Outbox) pendingRowsForTest(t *testing.T) {
	t.Helper()
	if _, err := o.pendingRows(batchSize); err != nil {
		t.Fatalf("pendingRows: %v", err)
	}
}
