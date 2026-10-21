package mailer

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Estados del outbox. 'desactivado' NO es un estado terminal de éxito: es la
// marca de que el correo no salió porque no hay SMTP configurado, y existe
// para que la ausencia de correo sea visible en vez de parecer un envío.
const (
	StatusPending  = "pendiente"
	StatusSent     = "enviado"
	StatusFailed   = "fallido"
	StatusDisabled = "desactivado"
)

// MaxAttempts acota los reintentos. Sin tope, una fila con un destinatario
// inválido se reintentaría para siempre y taparía el outbox.
const MaxAttempts = 5

// Message es una fila del outbox, tal como la ve `GET /emails`.
type Message struct {
	CompanyID string  `json:"companyId"`
	ID        string  `json:"id"`
	Kind      string  `json:"kind"`
	ToEmail   string  `json:"toEmail"`
	Subject   string  `json:"subject"`
	BodyHTML  string  `json:"bodyHtml"`
	RefType   string  `json:"refType"`
	RefID     string  `json:"refId"`
	Status    string  `json:"status"`
	Attempts  int     `json:"attempts"`
	LastError string  `json:"lastError"`
	CreatedBy string  `json:"createdBy"`
	CreatedAt string  `json:"createdAt"`
	SentAt    string  `json:"sentAt"`
	NextTry   *string `json:"nextAttemptAt"`
}

// ErrNoRecipient lo devuelven los disparadores cuando el cliente/prospecto no
// tiene correo en BD. Es un error de negocio visible: la UI debe mostrarlo en
// vez de reportar un envío exitoso que no ocurrió.
var ErrNoRecipient = errors.New("el cliente no tiene correo registrado: no se puede enviar")

// ErrNotEnqueued cubre el caso de un disparador sin outbox cableado (servicio
// construido sin SetOutbox, p. ej. en tests antiguos). También es visible.
var ErrNotEnqueued = errors.New("el envio de correos no esta disponible en el servidor")

// Outbox es el almacén durable de correos. Lo comparten los disparadores
// (cotizaciones, despacho, recepción) y el worker.
type Outbox struct {
	db     *sql.DB
	cfg    Config
	sender Sender
}

// NewOutbox construye el almacén. sender puede ser nil: eso ES el modo
// desactivado y se maneja explícitamente, no como un fallo.
func NewOutbox(db *sql.DB, cfg Config, sender Sender) *Outbox {
	return &Outbox{db: db, cfg: cfg, sender: sender}
}

// Config expone la configuración (los disparadores la usan para armar links).
func (o *Outbox) Config() Config { return o.cfg }

// Enabled reporta si hay SMTP real detrás.
func (o *Outbox) Enabled() bool { return o.sender != nil }

// EnqueueRequest es lo que pide un disparador.
type EnqueueRequest struct {
	CompanyID string
	Kind      string
	ToEmail   string
	Subject   string
	BodyHTML  string
	RefType   string
	RefID     string
	CreatedBy string
}

// Enqueue registra un correo pendiente y lo devuelve tal como quedó.
//
// Tres comportamientos deliberados:
//
//  1. Sin destinatario NO se encola y se devuelve ErrNoRecipient: encolar un
//     correo sin `to_email` sería registrar algo que jamás puede salir y
//     ocultar el problema real (falta el correo del cliente).
//  2. En modo desactivado la fila nace ya marcada 'desactivado' con
//     last_error="SMTP no configurado". El worker llegaría a la misma
//     conclusión en su siguiente pasada, pero marcarla de entrada hace que la
//     respuesta HTTP del disparador diga la verdad EN EL MOMENTO: la UI puede
//     mostrar "no se envió" en vez de un éxito falso.
//  3. Con referente (ref_type+ref_id) es un UPSERT: reenviar la misma
//     cotización actualiza la fila existente y la devuelve a 'pendiente' en
//     vez de apilar duplicados. Por eso el índice uq_email_outbox_ref existe y
//     por eso un doble clic no genera dos correos.
func (o *Outbox) Enqueue(req EnqueueRequest) (Message, error) {
	to := strings.TrimSpace(req.ToEmail)
	if to == "" {
		return Message{}, ErrNoRecipient
	}

	status := StatusPending
	lastError := ""
	if o.sender == nil {
		status = StatusDisabled
		lastError = DisabledError
	}

	companyID := strings.TrimSpace(req.CompanyID)
	id := "em-" + uuid.NewString()
	now := time.Now().UTC()
	subject := truncate(req.Subject, 300)

	row := o.db.QueryRow(`
INSERT INTO email_outbox (
	company_id, id, kind, to_email, subject, body_html,
	ref_type, ref_id, status, attempts, last_error, next_attempt_at,
	created_by, created_at, updated_at, sent_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12, $13, $13, NULL)
ON CONFLICT (company_id, kind, ref_type, ref_id)
	WHERE ref_type <> '' AND ref_id <> ''
DO UPDATE SET
	to_email = EXCLUDED.to_email,
	subject = EXCLUDED.subject,
	body_html = EXCLUDED.body_html,
	status = EXCLUDED.status,
	attempts = 0,
	last_error = EXCLUDED.last_error,
	next_attempt_at = EXCLUDED.next_attempt_at,
	created_by = EXCLUDED.created_by,
	updated_at = EXCLUDED.updated_at,
	sent_at = NULL
RETURNING id, created_at`,
		companyID, id,
		strings.TrimSpace(req.Kind), to,
		subject, req.BodyHTML,
		strings.TrimSpace(req.RefType), strings.TrimSpace(req.RefID),
		status, lastError, now,
		strings.TrimSpace(req.CreatedBy), now,
	)

	var createdAt time.Time
	if err := row.Scan(&id, &createdAt); err != nil {
		return Message{}, fmt.Errorf("encolar correo: %w", err)
	}

	return Message{
		CompanyID: companyID,
		ID:        id,
		Kind:      strings.TrimSpace(req.Kind),
		ToEmail:   to,
		Subject:   subject,
		BodyHTML:  req.BodyHTML,
		RefType:   strings.TrimSpace(req.RefType),
		RefID:     strings.TrimSpace(req.RefID),
		Status:    status,
		Attempts:  0,
		LastError: lastError,
		CreatedBy: strings.TrimSpace(req.CreatedBy),
		CreatedAt: createdAt.UTC().Format(time.RFC3339),
	}, nil
}

const messageColumns = `company_id, id, kind, to_email, subject, body_html,
	ref_type, ref_id, status, attempts, last_error, created_by, created_at,
	sent_at, next_attempt_at`

func scanMessage(row interface{ Scan(...any) error }) (Message, error) {
	var (
		m         Message
		createdAt time.Time
		sentAt    sql.NullTime
		nextTry   sql.NullTime
	)
	err := row.Scan(
		&m.CompanyID, &m.ID, &m.Kind, &m.ToEmail, &m.Subject, &m.BodyHTML,
		&m.RefType, &m.RefID, &m.Status, &m.Attempts, &m.LastError, &m.CreatedBy,
		&createdAt, &sentAt, &nextTry,
	)
	if err != nil {
		return Message{}, err
	}
	m.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	if sentAt.Valid {
		m.SentAt = sentAt.Time.UTC().Format(time.RFC3339)
	}
	if nextTry.Valid {
		value := nextTry.Time.UTC().Format(time.RFC3339)
		m.NextTry = &value
	}
	return m, nil
}

// List devuelve el outbox de una empresa, más reciente primero. Es lo que
// consume `GET /emails`: la única ventana a un correo que no salió.
func (o *Outbox) List(companyID string, limit int) ([]Message, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	rows, err := o.db.Query(`
SELECT `+messageColumns+`
FROM email_outbox
WHERE company_id = $1
ORDER BY created_at DESC, id DESC
LIMIT $2`, strings.TrimSpace(companyID), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Message, 0)
	for rows.Next() {
		m, err := scanMessage(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, m)
	}
	return items, rows.Err()
}

// pendingRows son las filas que el worker debe intentar en esta pasada:
// pendientes cuyo backoff ya venció. 'desactivado', 'enviado' y 'fallido'
// (tope alcanzado) quedan fuera a propósito.
func (o *Outbox) pendingRows(limit int) ([]Message, error) {
	rows, err := o.db.Query(`
SELECT `+messageColumns+`
FROM email_outbox
WHERE status = $1 AND attempts < $2 AND next_attempt_at <= NOW()
ORDER BY next_attempt_at ASC, created_at ASC
LIMIT $3`, StatusPending, MaxAttempts, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Message, 0)
	for rows.Next() {
		m, err := scanMessage(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, m)
	}
	return items, rows.Err()
}

// markSent cierra la fila como enviada.
func (o *Outbox) markSent(companyID, id string, at time.Time) error {
	_, err := o.db.Exec(`
UPDATE email_outbox
SET status = $3, attempts = attempts + 1, last_error = '', sent_at = $4, updated_at = $4
WHERE company_id = $1 AND id = $2`, companyID, id, StatusSent, at.UTC())
	return err
}

// markRetry deja la fila pendiente con backoff, o 'fallido' si ya agotó los
// intentos. El tope es lo que evita un bucle infinito sobre un destinatario
// inválido.
func (o *Outbox) markRetry(companyID, id string, sendError error, at time.Time) error {
	attempts := 0
	status := StatusPending
	if err := o.db.QueryRow(
		`SELECT attempts FROM email_outbox WHERE company_id = $1 AND id = $2`,
		companyID, id,
	).Scan(&attempts); err != nil {
		return err
	}
	attempts++
	if attempts >= MaxAttempts {
		status = StatusFailed
	}

	_, err := o.db.Exec(`
UPDATE email_outbox
SET status = $3,
	attempts = $4,
	last_error = $5,
	next_attempt_at = $6,
	updated_at = $7
WHERE company_id = $1 AND id = $2`,
		companyID, id, status, attempts,
		truncate(sendError.Error(), 1000),
		at.UTC().Add(backoffFor(attempts)),
		at.UTC(),
	)
	return err
}

// markDisabled convierte pendientes en 'desactivado' cuando no hay SMTP.
// Nunca los marca 'enviado' y nunca los borra: el correo que no salió tiene
// que seguir siendo visible.
func (o *Outbox) markDisabled(at time.Time) (int64, error) {
	res, err := o.db.Exec(`
UPDATE email_outbox
SET status = $1, last_error = $2, updated_at = $3
WHERE status = $4`, StatusDisabled, DisabledError, at.UTC(), StatusPending)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

// backoffFor es un backoff simple y acotado: 30 s, 1 m, 2 m, 4 m, 8 m.
func backoffFor(attempt int) time.Duration {
	switch {
	case attempt <= 1:
		return 30 * time.Second
	case attempt == 2:
		return time.Minute
	case attempt == 3:
		return 2 * time.Minute
	case attempt == 4:
		return 4 * time.Minute
	default:
		return 8 * time.Minute
	}
}

func truncate(value string, max int) string {
	value = strings.TrimSpace(value)
	runes := []rune(value)
	if len(runes) <= max {
		return value
	}
	return string(runes[:max])
}
