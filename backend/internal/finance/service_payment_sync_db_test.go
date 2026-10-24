package finance

import (
	"database/sql"
	"errors"
	"testing"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// F1/F2 — tests de integración contra Postgres real (RUN_DB_TESTS=1).
// Verifican que el CRUD de pagos mantenga paid_amount / balance_amount / status /
// received_payment de la factura consistente, y que el guardrail bloquee sobre-pagos.
// Reutiliza openTestDB / testCompany / seedOasisInvoice de service_gaps_db_test.go.

func paymentRequest(invoiceNumber string, amount float64) UpsertPaymentRequest {
	return UpsertPaymentRequest{
		Project:       "Proyecto QA",
		InvoiceNumber: invoiceNumber,
		Client:        "Cliente QA",
		Amount:        amount,
		PaidAt:        "2026-10-23",
		Status:        string(PaymentStatusCompleted),
		CurrencyCode:  "COP",
		ExchangeRate:  1,
	}
}

func almostEqual(a, b float64) bool { return a >= b-moneyEpsilon && a <= b+moneyEpsilon }

type invoiceState struct {
	status   InvoiceStatus
	paid     float64
	total    float64
	balance  float64
	received bool
}

func readInvoice(t *testing.T, db *sql.DB, companyID string) invoiceState {
	t.Helper()
	var st invoiceState
	err := db.QueryRow(`
SELECT status, paid_amount, total, balance_amount, COALESCE(received_payment, false)
FROM finance_invoices
WHERE company_id = $1 AND soft_delete = false
ORDER BY id LIMIT 1;`, companyID).Scan(&st.status, &st.paid, &st.total, &st.balance, &st.received)
	if err != nil {
		t.Fatalf("leer factura: %v", err)
	}
	return st
}

func paymentCount(t *testing.T, db *sql.DB, companyID string) int {
	t.Helper()
	var n int
	if err := db.QueryRow(
		`SELECT COUNT(*) FROM finance_payments WHERE company_id = $1 AND soft_delete = false;`,
		companyID).Scan(&n); err != nil {
		t.Fatalf("contar pagos: %v", err)
	}
	return n
}

func seedInvoiceTotal(t *testing.T, db *sql.DB, companyID string, status string, total float64) {
	t.Helper()
	items := []InvoiceItem{{ID: "i1", Name: "Reparacion", Description: "QA", Quantity: 1, UnitPrice: total, TaxRate: 0}}
	seedOasisInvoice(t, db, companyID, "cli-qa-pagosync", "FAC-2026", 31, "2026-10-01", status, total, items)
}

// 1. Crear un pago del 50% → la factura pasa a Pago parcial con paid/balance correctos.
func TestPaymentCreatePartialSyncsInvoice(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "pagosync-parcial")

	seedInvoiceTotal(t, db, companyID, string(InvoiceStatusDraft), 1000000)

	if _, err := s.CreatePayment(companyID, paymentRequest("FAC-2026-31", 500000)); err != nil {
		t.Fatalf("CreatePayment: %v", err)
	}

	st := readInvoice(t, db, companyID)
	if st.status != InvoiceStatusPartial {
		t.Errorf("status = %q, esperaba %q", st.status, InvoiceStatusPartial)
	}
	if !almostEqual(st.paid, 500000) {
		t.Errorf("paid_amount = %v, esperaba 500000", st.paid)
	}
	if !almostEqual(st.balance, 500000) {
		t.Errorf("balance_amount = %v, esperaba 500000", st.balance)
	}
	if !st.received {
		t.Error("received_payment debía ser true tras un pago contado")
	}
}

// 2. Acumulación de pagos: 40% + 60% → Pagado, balance cero.
func TestPaymentCreateCompletesInvoice(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "pagosync-completo")

	seedInvoiceTotal(t, db, companyID, string(InvoiceStatusPending), 1000000)

	if _, err := s.CreatePayment(companyID, paymentRequest("FAC-2026-31", 400000)); err != nil {
		t.Fatalf("CreatePayment 40%%: %v", err)
	}
	if st := readInvoice(t, db, companyID); st.status != InvoiceStatusPartial {
		t.Fatalf("tras el primer pago status = %q, esperaba %q", st.status, InvoiceStatusPartial)
	}

	if _, err := s.CreatePayment(companyID, paymentRequest("FAC-2026-31", 600000)); err != nil {
		t.Fatalf("CreatePayment 60%%: %v", err)
	}

	st := readInvoice(t, db, companyID)
	if st.status != InvoiceStatusPaid {
		t.Errorf("status = %q, esperaba %q", st.status, InvoiceStatusPaid)
	}
	if !almostEqual(st.paid, 1000000) {
		t.Errorf("paid_amount = %v, esperaba 1000000 (suma de ambos pagos)", st.paid)
	}
	if !almostEqual(st.balance, 0) {
		t.Errorf("balance_amount = %v, esperaba 0", st.balance)
	}
	if paymentCount(t, db, companyID) != 2 {
		t.Error("esperaba 2 pagos registrados")
	}
}

// 3. Borrar el pago → la factura regresa: paid a cero, estado degradado, received_payment false.
func TestPaymentDeleteRevertsInvoice(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "pagosync-delete")

	seedInvoiceTotal(t, db, companyID, string(InvoiceStatusDraft), 1000000)

	created, err := s.CreatePayment(companyID, paymentRequest("FAC-2026-31", 600000))
	if err != nil {
		t.Fatalf("CreatePayment: %v", err)
	}
	if st := readInvoice(t, db, companyID); st.status != InvoiceStatusPartial {
		t.Fatalf("precondition: status = %q, esperaba Pago parcial", st.status)
	}

	ok, err := s.DeletePayment(companyID, created.ID)
	if err != nil || !ok {
		t.Fatalf("DeletePayment = (%v, %v), esperaba (true, nil)", ok, err)
	}

	st := readInvoice(t, db, companyID)
	if st.status != InvoiceStatusPending {
		t.Errorf("status = %q, esperaba %q (degradado al borrar el pago)", st.status, InvoiceStatusPending)
	}
	if !almostEqual(st.paid, 0) {
		t.Errorf("paid_amount = %v, esperaba 0", st.paid)
	}
	if !almostEqual(st.balance, 1000000) {
		t.Errorf("balance_amount = %v, esperaba el total (1000000)", st.balance)
	}
	if st.received {
		t.Error("received_payment debía volver a false")
	}
	if n := paymentCount(t, db, companyID); n != 0 {
		t.Errorf("pagos visibles = %d, esperaba 0", n)
	}

	// Idempotencia: borrar de nuevo no rompe nada y devuelve (false, nil).
	ok2, err2 := s.DeletePayment(companyID, created.ID)
	if err2 != nil || ok2 {
		t.Errorf("DeletePayment repetido = (%v, %v), esperaba (false, nil)", ok2, err2)
	}
}

// 4. Sobre-pago en creación → rechazado con el error canónico; factura intacta y sin pago insertado.
func TestOverpayCreateRejected(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "pagosync-overcreate")

	seedInvoiceTotal(t, db, companyID, string(InvoiceStatusDraft), 1000000)

	_, err := s.CreatePayment(companyID, paymentRequest("FAC-2026-31", 1200000))
	if !errors.Is(err, errPaymentExceedsBalance) {
		t.Fatalf("CreatePayment sobre-pago: error = %v, esperaba errPaymentExceedsBalance", err)
	}

	st := readInvoice(t, db, companyID)
	if st.status != InvoiceStatusDraft || !almostEqual(st.paid, 0) || st.received {
		t.Errorf("la factura debió quedar intacta: %+v", st)
	}
	if n := paymentCount(t, db, companyID); n != 0 {
		t.Errorf("pagos insertados = %d, esperaba 0 (transacción revertida)", n)
	}
}

// 5. Sobre-pago en actualización: se puede subir hasta agotar el saldo; más allá → rechazado.
func TestOverpayUpdateWithinAndBeyondCap(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "pagosync-overupdate")

	seedInvoiceTotal(t, db, companyID, string(InvoiceStatusDraft), 1000000)

	payment, err := s.CreatePayment(companyID, paymentRequest("FAC-2026-31", 400000))
	if err != nil {
		t.Fatalf("CreatePayment: %v", err)
	}

	// Subir a 90% está dentro del tope (balance 60% + el propio pago actual 40% = 100%).
	req := paymentRequest("FAC-2026-31", 900000)
	if _, err := s.UpdatePayment(companyID, payment.ID, req); err != nil {
		t.Fatalf("UpdatePayment a 90%%: %v", err)
	}
	st := readInvoice(t, db, companyID)
	if !almostEqual(st.paid, 900000) || st.status != InvoiceStatusPartial {
		t.Errorf("tras update a 90%%: paid=%v status=%q, esperaba (900000, Pago parcial)", st.paid, st.status)
	}

	// Subir a 1.2M supera el tope → rechazado y el pago conserva su monto anterior.
	req = paymentRequest("FAC-2026-31", 1200000)
	if _, err := s.UpdatePayment(companyID, payment.ID, req); !errors.Is(err, errPaymentExceedsBalance) {
		t.Fatalf("UpdatePayment sobre-pago: error = %v, esperaba errPaymentExceedsBalance", err)
	}
	st = readInvoice(t, db, companyID)
	if !almostEqual(st.paid, 900000) {
		t.Errorf("la factura debió conservar paid=900000, quedó %v", st.paid)
	}
	got, err := s.GetPayment(companyID, payment.ID)
	if err != nil || got.Amount != 900000 {
		t.Errorf("el pago debía conservar amount=900000, quedó (%v, %v)", got.Amount, err)
	}
}

// 6. Trampa de padding: "FAC-2026-31" y "FAC-2026-000031" son la MISMA factura;
// dos pagos con distintos paddings suman una sola vez → Pagado exacto, sin doble conteo.
func TestPaddingTrapSameInvoiceSumsOnce(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "pagosync-padding")

	seedInvoiceTotal(t, db, companyID, string(InvoiceStatusDraft), 1000000)

	if _, err := s.CreatePayment(companyID, paymentRequest("FAC-2026-31", 400000)); err != nil {
		t.Fatalf("CreatePayment código corto: %v", err)
	}
	if _, err := s.CreatePayment(companyID, paymentRequest("FAC-2026-000031", 600000)); err != nil {
		t.Fatalf("CreatePayment código padded: %v", err)
	}

	st := readInvoice(t, db, companyID)
	if st.status != InvoiceStatusPaid {
		t.Errorf("status = %q, esperaba %q (ambos códigos resuelven a la misma factura)", st.status, InvoiceStatusPaid)
	}
	if !almostEqual(st.paid, 1000000) {
		t.Errorf("paid_amount = %v, esperaba 1000000 una sola vez (sin doble conteo por código)", st.paid)
	}
	if n := paymentCount(t, db, companyID); n != 2 {
		t.Errorf("pagos registrados = %d, esperaba 2", n)
	}
}

// 7. Un pago "Pendiente" no suma al acumulado; al completarlo sí impacta la factura.
func TestPendingPaymentDoesNotCount(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "pagosync-pending")

	seedInvoiceTotal(t, db, companyID, string(InvoiceStatusDraft), 1000000)

	req := paymentRequest("FAC-2026-31", 500000)
	req.Status = string(PaymentStatusPending) // normaliza a "Pendiente"
	payment, err := s.CreatePayment(companyID, req)
	if err != nil {
		t.Fatalf("CreatePayment Pendiente: %v", err)
	}

	st := readInvoice(t, db, companyID)
	if st.status != InvoiceStatusDraft || !almostEqual(st.paid, 0) || st.received {
		t.Errorf("pago Pendiente no debe contar: %+v", st)
	}

	// Al completarlo sí impacta.
	req.Status = string(PaymentStatusCompleted)
	if _, err := s.UpdatePayment(companyID, payment.ID, req); err != nil {
		t.Fatalf("UpdatePayment a Completado: %v", err)
	}
	st = readInvoice(t, db, companyID)
	if st.status != InvoiceStatusPartial || !almostEqual(st.paid, 500000) || !st.received {
		t.Errorf("tras completar el pago debió contar (50%%): %+v", st)
	}
}

// 8. Factura Cancelada: se puede registrar un pago libre contra su número, pero la
// factura NUNCA cambia ni de estado ni de montos.
func TestCancelledInvoiceIsImmutable(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "pagosync-cancelado")

	seedInvoiceTotal(t, db, companyID, string(InvoiceStatusCancelled), 1000000)

	if _, err := s.CreatePayment(companyID, paymentRequest("FAC-2026-31", 400000)); err != nil {
		t.Fatalf("CreatePayment contra factura cancelada: %v (el guardrail debe exentarla)", err)
	}

	st := readInvoice(t, db, companyID)
	if st.status != InvoiceStatusCancelled || !almostEqual(st.paid, 0) || !almostEqual(st.balance, 1000000) || st.received {
		t.Errorf("factura Cancelada debió quedar intacta: %+v", st)
	}
	if n := paymentCount(t, db, companyID); n != 1 {
		t.Errorf("el pago sí debe existir registrado, pagos = %d", n)
	}
}
