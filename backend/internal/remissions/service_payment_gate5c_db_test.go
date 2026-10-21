package remissions

import (
	"database/sql"
	"errors"
	"strings"
	"testing"
)

// FASE 5c — Puente pago → despacho, POR MODALIDAD.
//
// Palabras del cliente (transcripción 9-mar, ~min 28):
//
//	"despachos Servientrega son solo los clientes créditos, los que sí tienen
//	 30 o 45 días, eso se puede empacar y se despacha de una… si son contra
//	 entregas, se quedan ahí empacaditos en la oficina hasta que el cliente
//	 paga primero."
//
// Cada caso de aquí es una rama de esa frase. El importante es el último de
// los de "despacha": un cliente a crédito NO pasa por la puerta, porque
// convertir la regla en "todo despacho espera pago" habría roto el flujo de
// los clientes de 30/45 días.

const contraEntrega = "contra-entrega"

// seedClient registra un cliente y devuelve su id. creditEnabled=false es el
// caso contra-entrega ("paga primero"); true es el cliente de 30/45 días.
func seedClient(t *testing.T, db *sql.DB, companyID, nit, name string, creditEnabled bool) string {
	t.Helper()
	clientID := "cli-" + nit + "-" + name
	_, err := db.Exec(`
INSERT INTO crm_clients (company_id, id, nombre, empresa, nit, estado, credit_enabled, soft_delete, created_at, updated_at)
VALUES ($1, $2, $3, $3, $4, 'Activo', $5, false, NOW(), NOW())
ON CONFLICT (company_id, id) DO UPDATE SET credit_enabled = EXCLUDED.credit_enabled, updated_at = NOW()`,
		companyID, clientID, name, nit, creditEnabled)
	if err != nil {
		t.Fatalf("sembrar cliente: %v", err)
	}
	return clientID
}

func createRemission(t *testing.T, s *Service, companyID, dispatchType string) Remission {
	t.Helper()
	req := sampleRequest()
	req.DispatchType = dispatchType
	created, err := s.Create(companyID, req, "tester")
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	return created
}

// (a) Contra-entrega sin factura vinculada → rechazo con el mensaje pedido.
func TestPaymentGateContraEntregaWithoutInvoiceIsRejected(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gate-noinv")

	seedClient(t, db, companyID, "900123456", "Cliente Demo", false)
	r := createRemission(t, s, companyID, contraEntrega)

	updated, err := deliver(s, companyID, r.ID, adminActor())
	if err == nil {
		t.Fatalf("se despacho una contra-entrega sin factura vinculada: %+v", updated)
	}
	if !errors.Is(err, ErrInvoiceNotLinked) {
		t.Errorf("error = %v, esperaba ErrInvoiceNotLinked", err)
	}
	if !strings.Contains(err.Error(), "falta vincular la factura que debe pagarse antes de despachar") {
		t.Errorf("mensaje = %q, debe decir que falta vincular la factura", err.Error())
	}

	// La remisión sigue pendiente: el rechazo no debe cambiar nada.
	still, err := s.Get(companyID, r.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if still.DeliveryStatus != "pendiente" {
		t.Errorf("delivery_status = %q tras el rechazo, esperaba pendiente", still.DeliveryStatus)
	}
	// Y la UI tiene con qué mostrar "retenida por pago".
	if !still.PaymentGate || !still.PaymentHeld {
		t.Errorf("paymentGate=%v paymentHeld=%v, la contra-entrega sin credito debe estar retenida", still.PaymentGate, still.PaymentHeld)
	}
	if still.PaymentHeldReason == "" {
		t.Error("paymentHeldReason vacio: la UI no tendria que mostrar")
	}
}

// (b) Contra-entrega con factura NO pagada → rechazo que nombra el estado actual.
func TestPaymentGateUnpaidInvoiceIsRejectedNamingItsStatus(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gate-unpaid")

	clientID := seedClient(t, db, companyID, "900123456", "Cliente Demo", false)
	invoiceID := seedInvoice(t, db, companyID, clientID, "Pendiente", 850000)

	r := createRemission(t, s, companyID, contraEntrega)
	if _, err := s.LinkInvoice(companyID, r.ID, invoiceIDPtr(invoiceID)); err != nil {
		t.Fatalf("LinkInvoice: %v", err)
	}

	_, err := deliver(s, companyID, r.ID, adminActor())
	if err == nil {
		t.Fatal("se despacho con la factura en estado Pendiente")
	}
	// El diseño pide que el rechazo diga el estado actual, no un genérico.
	if !strings.Contains(err.Error(), "Pendiente") {
		t.Errorf("mensaje = %q, debe nombrar el estado actual 'Pendiente'", err.Error())
	}
	if !strings.Contains(err.Error(), "Pagado") {
		t.Errorf("mensaje = %q, debe decir que se exige 'Pagado'", err.Error())
	}

	// 'Pago parcial' tampoco libera: el cliente dijo "cuando el cliente pague".
	setInvoiceStatus(t, db, companyID, invoiceID, "Pago parcial")
	if _, err := deliver(s, companyID, r.ID, adminActor()); err == nil {
		t.Error("se despacho con la factura en Pago parcial")
	} else if !strings.Contains(err.Error(), "Pago parcial") {
		t.Errorf("mensaje = %q, debe nombrar 'Pago parcial'", err.Error())
	}
}

// Factura Pagada → despacha. Es la otra mitad de la frase del cliente:
// "cuando el cliente pague, ahí sí se le despacha".
func TestPaymentGatePaidInvoiceReleasesDispatch(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gate-paid")

	clientID := seedClient(t, db, companyID, "900123456", "Cliente Demo", false)
	invoiceID := seedInvoice(t, db, companyID, clientID, "Pendiente", 850000)

	r := createRemission(t, s, companyID, contraEntrega)
	if _, err := s.LinkInvoice(companyID, r.ID, invoiceIDPtr(invoiceID)); err != nil {
		t.Fatalf("LinkInvoice: %v", err)
	}

	// Antes de pagar sigue retenida.
	if _, err := deliver(s, companyID, r.ID, operatorActor()); err == nil {
		t.Fatal("se despacho antes del pago")
	}

	setInvoiceStatus(t, db, companyID, invoiceID, InvoiceStatusPaid)

	// Un operario (sin rol admin) ya puede despachar: la puerta la abre el
	// pago, no el privilegio.
	delivered, err := deliver(s, companyID, r.ID, operatorActor())
	if err != nil {
		t.Fatalf("tras marcar Pagada el despacho fallo: %v", err)
	}
	if delivered.DeliveryStatus != "entregado" {
		t.Errorf("delivery_status = %q, esperaba entregado", delivered.DeliveryStatus)
	}
	if delivered.InvoiceStatus != InvoiceStatusPaid {
		t.Errorf("invoiceStatus = %q, esperaba %q", delivered.InvoiceStatus, InvoiceStatusPaid)
	}
	if delivered.PaymentHeld {
		t.Errorf("sigue reportada como retenida: %q", delivered.PaymentHeldReason)
	}
	// Pagando no hizo falta ningún override, así que no debe quedar rastro de uno.
	if delivered.PaymentOverride || delivered.PaymentOverrideBy != "" {
		t.Errorf("se grabo un override sin haberlo pedido: by=%q at=%q", delivered.PaymentOverrideBy, delivered.PaymentOverrideAt)
	}
}

// (c) Cliente a crédito despacha SIN puerta, aunque no haya factura vinculada.
func TestCreditClientDispatchesWithoutGate(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gate-credit")

	seedClient(t, db, companyID, "900123456", "Cliente Demo", true)
	r := createRemission(t, s, companyID, "servientrega")

	delivered, err := deliver(s, companyID, r.ID, operatorActor())
	if err != nil {
		t.Fatalf("cliente a credito no pudo despachar: %v", err)
	}
	if delivered.DeliveryStatus != "entregado" {
		t.Errorf("delivery_status = %q, esperaba entregado", delivered.DeliveryStatus)
	}
	if delivered.PaymentGate {
		t.Error("paymentGate=true para un cliente a credito con Servientrega: la puerta no deberia aplicar")
	}
	if delivered.PaymentHeld {
		t.Errorf("cliente a credito aparece retenido: %q", delivered.PaymentHeldReason)
	}
	if !delivered.CreditClient {
		t.Error("creditClient=false: el JOIN con crm_clients no resolvio el credito")
	}
}

// La modalidad contra-entrega activa la puerta AUN con cliente de crédito: el
// diseño es un OR, no un AND. Un cliente de crédito que pide contra-entrega
// paga contra entrega.
func TestContraEntregaGatesEvenCreditClients(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gate-creditcontra")

	seedClient(t, db, companyID, "900123456", "Cliente Demo", true)
	r := createRemission(t, s, companyID, contraEntrega)

	_, err := deliver(s, companyID, r.ID, adminActor())
	if !errors.Is(err, ErrInvoiceNotLinked) {
		t.Errorf("error = %v, la contra-entrega debe exigir factura aunque el cliente tenga credito", err)
	}
}

// Un cliente sin ficha en crm_clients cae del lado seguro: puerta activada.
func TestUnknownClientFailsClosed(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gate-unknown")

	// Sin seedClient: el JOIN no encuentra fila y credit_enabled=false.
	r := createRemission(t, s, companyID, "servientrega")

	if _, err := deliver(s, companyID, r.ID, adminActor()); !errors.Is(err, ErrInvoiceNotLinked) {
		t.Errorf("error = %v, un cliente desconocido debe activar la puerta", err)
	}
}

// Override: sólo admin, y dejando rastro de quién y cuándo.
func TestPaymentOverrideIsAdminOnlyAndLeavesTrail(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gate-override")

	clientID := seedClient(t, db, companyID, "900123456", "Cliente Demo", false)
	invoiceID := seedInvoice(t, db, companyID, clientID, "Pendiente", 850000)

	r := createRemission(t, s, companyID, contraEntrega)
	if _, err := s.LinkInvoice(companyID, r.ID, invoiceIDPtr(invoiceID)); err != nil {
		t.Fatalf("LinkInvoice: %v", err)
	}

	// Un rol sin privilegios NO puede saltar la puerta, ni pidiéndolo.
	override := DeliveryStatusRequest{DeliveryStatus: "entregado", PaymentOverride: true}
	if _, err := s.UpdateDeliveryStatus(companyID, r.ID, override, operatorActor()); !errors.Is(err, ErrOverrideNotAllowed) {
		t.Errorf("error = %v, esperaba ErrOverrideNotAllowed para un rol no admin", err)
	}
	blocked, err := s.Get(companyID, r.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if blocked.DeliveryStatus != "pendiente" {
		t.Errorf("delivery_status = %q tras el override denegado, esperaba pendiente", blocked.DeliveryStatus)
	}
	if blocked.PaymentOverride {
		t.Error("payment_override quedo en true pese a que se denego")
	}

	// Admin sí puede, y queda el rastro.
	delivered, err := s.UpdateDeliveryStatus(companyID, r.ID, override, Actor{Email: "dueno@alfa.local", Role: "admin"})
	if err != nil {
		t.Fatalf("override de admin fallo: %v", err)
	}
	if delivered.DeliveryStatus != "entregado" {
		t.Errorf("delivery_status = %q, esperaba entregado", delivered.DeliveryStatus)
	}
	if !delivered.PaymentOverride {
		t.Error("payment_override = false tras un override autorizado")
	}
	if delivered.PaymentOverrideBy != "dueno@alfa.local" {
		t.Errorf("payment_override_by = %q, esperaba el email del admin del JWT", delivered.PaymentOverrideBy)
	}
	if strings.TrimSpace(delivered.PaymentOverrideAt) == "" {
		t.Error("payment_override_at vacio: el rastro quedo sin fecha")
	}

	// El rastro sobrevive a una relectura (no es un campo calculado al vuelo).
	reloaded, err := s.Get(companyID, r.ID)
	if err != nil {
		t.Fatalf("Get tras override: %v", err)
	}
	if !reloaded.PaymentOverride || reloaded.PaymentOverrideBy != "dueno@alfa.local" || reloaded.PaymentOverrideAt == "" {
		t.Errorf("el rastro del override no persistio: %+v", reloaded)
	}
	// Ya despachada con override, no sigue apareciendo como retenida.
	if reloaded.PaymentHeld {
		t.Errorf("sigue retenida tras el override: %q", reloaded.PaymentHeldReason)
	}
}

// Una factura de OTRA empresa no sirve para destrabar el despacho: si el JOIN
// no la resuelve, la puerta debe cerrarse y no abrirse.
func TestInvoiceFromAnotherCompanyDoesNotRelease(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gate-crossco")
	otherCompany := testCompany(t, db, "gate-otherco")

	otherClient := seedClient(t, db, otherCompany, "900999999", "Cliente Ajeno", false)
	otherInvoice := seedInvoice(t, db, otherCompany, otherClient, InvoiceStatusPaid, 100000)

	seedClient(t, db, companyID, "900123456", "Cliente Demo", false)
	r := createRemission(t, s, companyID, contraEntrega)

	// LinkInvoice valida existencia y empresa, así que debe rechazarla.
	if _, err := s.LinkInvoice(companyID, r.ID, invoiceIDPtr(otherInvoice)); err == nil {
		t.Fatal("se pudo vincular una factura de otra empresa")
	}
}

// InvoiceOptions devuelve sólo las facturas del cliente de la remisión, que es
// lo que alimenta el selector del panel de despacho.
func TestInvoiceOptionsAreScopedToTheRemissionClient(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gate-options")

	clientID := seedClient(t, db, companyID, "900123456", "Cliente Demo", false)
	otherClient := seedClient(t, db, companyID, "900777777", "Otro Cliente", false)

	mine := seedInvoice(t, db, companyID, clientID, "Pendiente", 850000)
	theirs := seedInvoice(t, db, companyID, otherClient, InvoiceStatusPaid, 120000)

	r := createRemission(t, s, companyID, contraEntrega)

	options, err := s.InvoiceOptions(companyID, r.ID)
	if err != nil {
		t.Fatalf("InvoiceOptions: %v", err)
	}
	if len(options) != 1 {
		t.Fatalf("InvoiceOptions devolvio %d facturas, esperaba 1 (solo las del cliente)", len(options))
	}
	if options[0].ID != mine {
		t.Errorf("devolvio la factura %d, esperaba %d", options[0].ID, mine)
	}
	if options[0].ID == theirs {
		t.Error("se filtraron facturas de otro cliente en el selector")
	}
	if options[0].Paid {
		t.Error("paid=true para una factura en estado Pendiente")
	}
	if strings.TrimSpace(options[0].ReferenceCode) == "" {
		t.Error("referenceCode vacio: el selector no tendria que mostrar")
	}

	// Remisión inexistente → error, no lista vacía que parezca "sin facturas".
	if _, err := s.InvoiceOptions(companyID, "rem-no-existe"); !errors.Is(err, errRemissionNotFound) {
		t.Errorf("error = %v, esperaba errRemissionNotFound", err)
	}
}

// LinkInvoice con null desvincula, y con un id inexistente rechaza.
func TestLinkInvoiceValidatesAndUnlinks(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gate-link")

	seedClient(t, db, companyID, "900123456", "Cliente Demo", false)
	r := createRemission(t, s, companyID, contraEntrega)

	if _, err := s.LinkInvoice(companyID, r.ID, invoiceIDPtr(99999999)); err == nil {
		t.Error("se pudo vincular una factura inexistente")
	}

	clientID := seedClient(t, db, companyID, "900123456", "Cliente Demo", false)
	invoiceID := seedInvoice(t, db, companyID, clientID, "Pendiente", 500000)

	linked, err := s.LinkInvoice(companyID, r.ID, invoiceIDPtr(invoiceID))
	if err != nil {
		t.Fatalf("LinkInvoice: %v", err)
	}
	if linked.InvoiceID == nil || *linked.InvoiceID != invoiceID {
		t.Fatalf("invoice_id = %v, esperaba %d", linked.InvoiceID, invoiceID)
	}

	// invoiceId: 0 en el JSON no debe quedar como una factura inexistente.
	zero, err := s.LinkInvoice(companyID, r.ID, invoiceIDPtr(0))
	if err != nil {
		t.Fatalf("LinkInvoice(0): %v", err)
	}
	if zero.InvoiceID != nil {
		t.Errorf("invoice_id = %v tras vincular 0, esperaba nil", *zero.InvoiceID)
	}

	unlinked, err := s.LinkInvoice(companyID, r.ID, nil)
	if err != nil {
		t.Fatalf("LinkInvoice(nil): %v", err)
	}
	if unlinked.InvoiceID != nil {
		t.Errorf("invoice_id = %v tras desvincular, esperaba nil", *unlinked.InvoiceID)
	}
}

// requirePaymentGate es la tabla de verdad de la regla POR MODALIDAD.
func TestRequiresPaymentGateByModality(t *testing.T) {
	cases := []struct {
		name         string
		dispatchType string
		creditClient bool
		want         bool
	}{
		{"contra-entrega sin credito", contraEntrega, false, true},
		{"contra-entrega con credito", contraEntrega, true, true},
		{"servientrega sin credito", "servientrega", false, true},
		{"servientrega con credito", "servientrega", true, false},
		{"dhl con credito", "dhl", true, false},
		{"recoge-cliente con credito", "recoge-cliente", true, false},
		{"sin modalidad y sin credito", "", false, true},
		{"contra-entrega en mayusculas", "CONTRA-ENTREGA", true, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := requiresPaymentGate(tc.dispatchType, tc.creditClient); got != tc.want {
				t.Errorf("requiresPaymentGate(%q, credit=%v) = %v, esperaba %v",
					tc.dispatchType, tc.creditClient, got, tc.want)
			}
		})
	}
}
