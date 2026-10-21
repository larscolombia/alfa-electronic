package finance

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"pika.software.net.co/backend/internal/platform/database"
)

func openTestDB(t *testing.T) *sql.DB {
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

func testCompany(t *testing.T, db *sql.DB, name string) string {
	t.Helper()
	companyID := fmt.Sprintf("qa-fin-%s-%d", name, time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM finance_expenses WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM finance_cash_counts WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM finance_warranty_records WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM company_settings WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM finance_payments WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM finance_invoices WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM crm_clients WHERE company_id = $1`, companyID)
	})
	return companyID
}

func sampleExpense() UpsertExpenseRequest {
	return UpsertExpenseRequest{
		ItemName:     "Teclado inalambrico",
		Concept:      "Compra de suministros",
		Category:     "Papeleria",
		Description:  "Teclado para el puesto de contabilidad",
		Employee:     "Ana Perez",
		Project:      "Operaciones",
		Vendor:       "Corporacion Acme",
		Amount:       10000,
		CurrencyCode: "COP",
		ExchangeRate: 1,
		PaidAt:       "2026-10-01",
	}
}

func TestExpensesCrudIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gastos")

	created, err := s.CreateExpense(companyID, "tester", sampleExpense())
	if err != nil {
		t.Fatalf("CreateExpense: %v", err)
	}
	if created.ItemName != "Teclado inalambrico" || created.Category != "Papeleria" {
		t.Errorf("campos no persistieron: %+v", created)
	}
	if created.ValueInCop != 10000 {
		t.Errorf("ValueInCop = %v, esperaba 10000", created.ValueInCop)
	}
	if created.CreatedBy != "tester" {
		t.Errorf("CreatedBy = %q, esperaba tester", created.CreatedBy)
	}
	if created.PaidAt != "2026-10-01" {
		t.Errorf("PaidAt = %q", created.PaidAt)
	}

	got, err := s.GetExpense(companyID, created.ID)
	if err != nil {
		t.Fatalf("GetExpense: %v", err)
	}
	if got.Concept != "Compra de suministros" || got.Vendor != "Corporacion Acme" {
		t.Errorf("lectura no coincide: %+v", got)
	}

	req := sampleExpense()
	req.Amount = 25000
	req.CurrencyCode = "USD"
	req.ExchangeRate = 3900
	updated, err := s.UpdateExpense(companyID, "tester", created.ID, req)
	if err != nil {
		t.Fatalf("UpdateExpense: %v", err)
	}
	if updated.Amount != 25000 || updated.ValueInCop != 25000*3900 {
		t.Errorf("update no recalculo valor COP: %+v", updated)
	}

	items, err := s.ListExpenses(companyID, ListExpensesQuery{})
	if err != nil {
		t.Fatalf("ListExpenses: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("ListExpenses devolvio %d, esperaba 1", len(items))
	}

	deleted, err := s.DeleteExpense(companyID, created.ID)
	if err != nil || !deleted {
		t.Fatalf("DeleteExpense: %v (%v)", deleted, err)
	}
	if _, err := s.GetExpense(companyID, created.ID); err == nil {
		t.Error("GetExpense despues de borrar debe fallar")
	}

	// Validaciones.
	bad := sampleExpense()
	bad.Amount = 0
	if _, err := s.CreateExpense(companyID, "tester", bad); err == nil {
		t.Error("esperaba error con amount 0")
	}
	bad = sampleExpense()
	bad.Category = ""
	if _, err := s.CreateExpense(companyID, "tester", bad); err == nil {
		t.Error("esperaba error sin categoria")
	}
	bad = sampleExpense()
	bad.PaidAt = "2026-13-45"
	if _, err := s.CreateExpense(companyID, "tester", bad); err == nil {
		t.Error("esperaba error con fecha invalida")
	}
}

func TestCashCountsIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "arqueo")

	initial, err := s.GetCashCounts(companyID)
	if err != nil {
		t.Fatalf("GetCashCounts inicial: %v", err)
	}
	if len(initial) != 0 {
		t.Fatalf("esperaba arqueo vacio, llegaron %d filas", len(initial))
	}

	saved, err := s.SaveCashCounts(companyID, "contador", SaveCashCountsRequest{
		Entries: []CashCountEntry{
			{Kind: "billete", Denomination: 100000, Quantity: 3},
			{Kind: "billete", Denomination: 50000, Quantity: 2},
			{Kind: "moneda", Denomination: 500, Quantity: 10},
		},
	})
	if err != nil {
		t.Fatalf("SaveCashCounts: %v", err)
	}
	if len(saved) != 3 {
		t.Fatalf("esperaba 3 denominaciones, llegaron %d", len(saved))
	}
	total := 0.0
	for _, row := range saved {
		total += row.Total
		if row.CountedBy != "contador" {
			t.Errorf("CountedBy = %q", row.CountedBy)
		}
	}
	if total != 300000+100000+5000 {
		t.Errorf("total contado = %v, esperaba 405000", total)
	}

	// Un segundo arqueo reemplaza al anterior en la lectura.
	replaced, err := s.SaveCashCounts(companyID, "contador", SaveCashCountsRequest{
		Entries: []CashCountEntry{{Kind: "billete", Denomination: 20000, Quantity: 1}},
	})
	if err != nil {
		t.Fatalf("SaveCashCounts 2: %v", err)
	}
	if len(replaced) != 1 || replaced[0].Total != 20000 {
		t.Errorf("el GET debe devolver solo el ultimo arqueo: %+v", replaced)
	}

	if _, err := s.SaveCashCounts(companyID, "contador", SaveCashCountsRequest{
		Entries: []CashCountEntry{{Kind: "billete", Denomination: -5, Quantity: 1}},
	}); err == nil {
		t.Error("esperaba error con denominacion negativa")
	}
	if _, err := s.SaveCashCounts(companyID, "contador", SaveCashCountsRequest{Entries: nil}); err == nil {
		t.Error("esperaba error con arqueo vacio")
	}
}

func TestPaymentRetentionsRoundTripIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "retenciones")

	payment, err := s.CreatePayment(companyID, UpsertPaymentRequest{
		InvoiceNumber:     "LARS#9001",
		Client:            "Cliente de prueba",
		Amount:            1000000,
		PaidAt:            "2026-10-01",
		Status:            "Completado",
		CurrencyCode:      "COP",
		ExchangeRate:      1,
		ReteFuente:        25000,
		ReteIVA:           15000,
		ReteICA:           6900,
		RetentionComments: "Retenciones aplicadas por el cliente",
		PaymentDate:       "2026-10-02",
	})
	if err != nil {
		t.Fatalf("CreatePayment: %v", err)
	}

	// Releer desde la BD (round-trip completo).
	got, err := s.GetPayment(companyID, payment.ID)
	if err != nil {
		t.Fatalf("GetPayment: %v", err)
	}
	if got.ReteFuente != 25000 || got.ReteIVA != 15000 || got.ReteICA != 6900 {
		t.Errorf("retenciones no persistieron: %+v", got)
	}
	if got.RetentionComments != "Retenciones aplicadas por el cliente" || got.PaymentDate != "2026-10-02" {
		t.Errorf("comentarios/fecha real no persistieron: %+v", got)
	}
	net := got.Amount - got.ReteFuente - got.ReteIVA - got.ReteICA
	if net != 1000000-25000-15000-6900 {
		t.Errorf("neto mal calculado: %v", net)
	}

	// El listado tambien debe traer las retenciones.
	items, err := s.ListPayments(companyID, ListPaymentsQuery{})
	if err != nil {
		t.Fatalf("ListPayments: %v", err)
	}
	if len(items) != 1 || items[0].ReteFuente != 25000 {
		t.Errorf("ListPayments sin retenciones: %+v", items)
	}

	// Un pago antiguo (insertado sin las columnas nuevas) debe leer 0.
	var legacyID int64
	if err := db.QueryRow(`
INSERT INTO finance_payments (company_id, invoice_number, amount, paid_at, status, currency_code, exchange_rate, soft_delete, created_at, updated_at)
VALUES ($1, 'LARS#0001', 500000, '2025-01-01', 'Completado', 'COP', 1, false, NOW(), NOW())
RETURNING id;
`, companyID).Scan(&legacyID); err != nil {
		t.Fatalf("insert legado: %v", err)
	}
	legacy, err := s.GetPayment(companyID, legacyID)
	if err != nil {
		t.Fatalf("GetPayment legado: %v", err)
	}
	if legacy.ReteFuente != 0 || legacy.ReteIVA != 0 || legacy.ReteICA != 0 || legacy.RetentionComments != "" {
		t.Errorf("pago antiguo debe leer retenciones en 0: %+v", legacy)
	}

	// Retenciones que superan el monto: rechazadas.
	if _, err := s.CreatePayment(companyID, UpsertPaymentRequest{
		InvoiceNumber: "LARS#9002", Amount: 1000, PaidAt: "2026-10-01",
		Status: "Completado", CurrencyCode: "COP", ExchangeRate: 1, ReteFuente: 900, ReteIVA: 200,
	}); err == nil {
		t.Error("esperaba error con retenciones mayores al monto")
	}
	if _, err := s.CreatePayment(companyID, UpsertPaymentRequest{
		InvoiceNumber: "LARS#9003", Amount: 1000, PaidAt: "2026-10-01",
		Status: "Completado", CurrencyCode: "COP", ExchangeRate: 1, ReteFuente: -5,
	}); err == nil {
		t.Error("esperaba error con retencion negativa")
	}

	// Update también persiste retenciones.
	updateReq := UpsertPaymentRequest{
		InvoiceNumber: "LARS#9001", Client: "Cliente de prueba", Amount: 1000000,
		PaidAt: "2026-10-01", Status: "Completado", CurrencyCode: "COP", ExchangeRate: 1,
		ReteFuente: 10000,
	}
	updated, err := s.UpdatePayment(companyID, payment.ID, updateReq)
	if err != nil {
		t.Fatalf("UpdatePayment: %v", err)
	}
	if updated.ReteFuente != 10000 || updated.ReteIVA != 0 {
		t.Errorf("update no persistio retenciones: %+v", updated)
	}
}

func sampleWarranty(expires string) UpsertWarrantyRequest {
	return UpsertWarrantyRequest{
		ClientName:          "Impresos Norte SAS",
		EquipmentIdentifier: "Fuente industrial 24V",
		StartAt:             "2026-01-20",
		EndAt:               expires,
		FollowUpAt:          "2026-04-25",
		Owner:               "Equipo Comercial",
		Phase:               "en-revision",
		Notes:               "Cobertura por cambio de componente",
	}
}

func TestWarrantiesAndExpiringIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "garantias")

	today := time.Now().UTC()
	in10Days := today.AddDate(0, 0, 10).Format("2006-01-02")
	in90Days := today.AddDate(0, 0, 90).Format("2006-01-02")
	yesterday := today.AddDate(0, 0, -1).Format("2006-01-02")

	req := sampleWarranty(in10Days)
	req.Phase = "en-reparacion"
	soon, err := s.CreateWarranty(companyID, "tester", req)
	if err != nil {
		t.Fatalf("CreateWarranty por vencer: %v", err)
	}
	if soon.Code == "" {
		t.Error("el codigo debe generarse en el servidor")
	}

	far, err := s.CreateWarranty(companyID, "tester", sampleWarranty(in90Days))
	if err != nil {
		t.Fatalf("CreateWarranty lejana: %v", err)
	}
	expired, err := s.CreateWarranty(companyID, "tester", sampleWarranty(yesterday))
	if err != nil {
		t.Fatalf("CreateWarranty vencida: %v", err)
	}

	expiring, err := s.ListExpiringWarranties(companyID, 30)
	if err != nil {
		t.Fatalf("ListExpiringWarranties: %v", err)
	}
	if len(expiring) != 1 || expiring[0].ID != soon.ID {
		t.Errorf("esperaba solo la garantia que vence en 10 dias: %+v", expiring)
	}

	if _, err := s.ListExpiringWarranties(companyID, 0); err == nil {
		t.Error("esperaba error con days=0")
	}

	// Cerrada no entra en el reporte.
	closedReq := sampleWarranty(in10Days)
	closedReq.Status = "Cerrada"
	closed, err := s.CreateWarranty(companyID, "tester", closedReq)
	if err != nil {
		t.Fatalf("CreateWarranty cerrada: %v", err)
	}
	expiring, err = s.ListExpiringWarranties(companyID, 30)
	if err != nil {
		t.Fatalf("ListExpiringWarranties 2: %v", err)
	}
	for _, item := range expiring {
		if item.ID == closed.ID {
			t.Error("una garantia cerrada no debe aparecer en por-vencer")
		}
	}

	all, err := s.ListWarranties(companyID, ListWarrantiesQuery{})
	if err != nil {
		t.Fatalf("ListWarranties: %v", err)
	}
	if len(all) != 4 {
		t.Errorf("ListWarranties devolvio %d, esperaba 4", len(all))
	}

	// Update + Delete.
	updateReq := sampleWarranty(in90Days)
	updateReq.ClientName = "Cliente Editado"
	updateReq.Phase = "lista"
	updated, err := s.UpdateWarranty(companyID, far.ID, updateReq)
	if err != nil {
		t.Fatalf("UpdateWarranty: %v", err)
	}
	if updated.ClientName != "Cliente Editado" || updated.Code != far.Code {
		t.Errorf("update incorrecto: %+v", updated)
	}

	deleted, err := s.DeleteWarranty(companyID, expired.ID)
	if err != nil || !deleted {
		t.Fatalf("DeleteWarranty: %v (%v)", deleted, err)
	}
	if _, err := s.GetWarranty(companyID, expired.ID); err == nil {
		t.Error("GetWarranty despues de borrar debe fallar")
	}

	// Validaciones.
	bad := sampleWarranty(in10Days)
	bad.ClientName = ""
	if _, err := s.CreateWarranty(companyID, "tester", bad); err == nil {
		t.Error("esperaba error sin cliente")
	}
	bad = sampleWarranty(in10Days)
	bad.EndAt = "2025-01-01" // anterior al inicio
	if _, err := s.CreateWarranty(companyID, "tester", bad); err == nil {
		t.Error("esperaba error con vencimiento anterior al inicio")
	}
}

func TestCompanySettingsIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "settings")

	// Sin fila: not found, el frontend aplica su fallback.
	if _, found, err := s.GetSetting(companyID, "finance.hourlyRate"); err != nil || found {
		t.Fatalf("GetSetting ausente: found=%v err=%v", found, err)
	}

	saved, err := s.PutSetting(companyID, "finance.hourlyRate", json.RawMessage(`155000`))
	if err != nil {
		t.Fatalf("PutSetting: %v", err)
	}
	if string(saved.Value) != "155000" {
		t.Errorf("valor guardado = %s", saved.Value)
	}

	setting, found, err := s.GetSetting(companyID, "finance.hourlyRate")
	if err != nil || !found {
		t.Fatalf("GetSetting: found=%v err=%v", found, err)
	}
	var rate float64
	if err := json.Unmarshal(setting.Value, &rate); err != nil || rate != 155000 {
		t.Errorf("tarifa leida = %v (err %v)", rate, err)
	}

	// Upsert: sobrescribe.
	if _, err := s.PutSetting(companyID, "finance.hourlyRate", json.RawMessage(`160000`)); err != nil {
		t.Fatalf("PutSetting 2: %v", err)
	}
	setting, _, _ = s.GetSetting(companyID, "finance.hourlyRate")
	if string(setting.Value) != "160000" {
		t.Errorf("upsert no sobrescribio: %s", setting.Value)
	}

	// Aislamiento por empresa.
	other := testCompany(t, db, "settings-otra")
	if _, found, err := s.GetSetting(other, "finance.hourlyRate"); err != nil || found {
		t.Error("otra empresa no debe ver la configuracion ajena")
	}

	// Valor inválido.
	if _, err := s.PutSetting(companyID, "finance.hourlyRate", json.RawMessage(``)); err == nil {
		t.Error("esperaba error con valor vacio")
	}
	if _, err := s.PutSetting(companyID, "finance.hourlyRate", json.RawMessage(`{invalido`)); err == nil {
		t.Error("esperaba error con JSON invalido")
	}
}

func seedOasisInvoice(t *testing.T, db *sql.DB, companyID, clientID, prefix string, sequence int, issueDate, status string, total float64, items []InvoiceItem) {
	t.Helper()
	itemsJSON, err := json.Marshal(items)
	if err != nil {
		t.Fatalf("marshal items: %v", err)
	}
	_, err = db.Exec(`
INSERT INTO finance_invoices (
	company_id, reference_code, series_prefix, sequence_number, client_id, client_name,
	billing_address, issue_date, due_date, currency_code, exchange_rate, items_json,
	subtotal, tax_total, total, paid_amount, balance_amount, status, soft_delete, created_at, updated_at
)
VALUES ($1, '--', $2, $3, $4, 'Series SAS', 'Carrera 7 #10-20', $5::date, ($5::date + 30), 'COP', 1, $6::jsonb,
	$7, $7*0.19, $7, 0, $7, $8, false, NOW(), NOW());
`, companyID, prefix, sequence, clientID, issueDate, itemsJSON, total, status)
	if err != nil {
		t.Fatalf("seed invoice: %v", err)
	}
}

func TestOasisExportAndPortfolioIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "oasis")

	if _, err := db.Exec(`
INSERT INTO crm_clients (company_id, id, nombre, correo, empresa, nit, estado, office_phone, address, credit_enabled)
VALUES ($1, 'cli-1', 'Juan Perez', 'facturacion@series.com', 'Series SAS', '86511911-8', 'Activo', '7036681', 'Carrera 7 #10-20', true);
`, companyID); err != nil {
		t.Fatalf("seed cliente: %v", err)
	}

	items := []InvoiceItem{
		{ID: "i1", Name: "Reparacion", Description: "Reparacion variador Siemens", Quantity: 1, UnitPrice: 1000000, TaxRate: 19},
		{ID: "i2", Name: "Diagnostico", Description: "Diagnostico urgente", Quantity: 1, UnitPrice: 300000, TaxRate: 19},
	}
	seedOasisInvoice(t, db, companyID, "crm-client-cli-1", "LARS", 101, "2026-09-01", "Pendiente", 1554000, items)
	seedOasisInvoice(t, db, companyID, "crm-client-cli-1", "LARS", 102, "2026-10-05", "Pagado", 1190000, items[:1])
	seedOasisInvoice(t, db, companyID, "crm-client-cli-1", "LARS", 103, "2026-10-06", "Cancelado", 1190000, items[:1])

	// Sin filtro: facturas no canceladas, una fila por ítem (2 + 1).
	all, err := s.GetOasisExport(companyID, OasisExportQuery{})
	if err != nil {
		t.Fatalf("GetOasisExport: %v", err)
	}
	if len(all) != 3 {
		t.Fatalf("esperaba 3 lineas, llegaron %d: %+v", len(all), all)
	}
	for _, record := range all {
		if record.BuyerNIT != "86511911" || record.BuyerDV != "8" {
			t.Errorf("NIT/DV mal mapeados: %+v", record)
		}
		if record.BuyerBillingEmail != "facturacion@series.com" {
			t.Errorf("correo de facturacion perdido: %+v", record)
		}
		if record.CreditFlag != "0" || record.CreditMarker != "99" {
			t.Errorf("flags de credito mal: %+v", record)
		}
	}

	// Filtro por rango de fechas: solo octubre.
	october, err := s.GetOasisExport(companyID, OasisExportQuery{From: "2026-10-01", To: "2026-10-31"})
	if err != nil {
		t.Fatalf("GetOasisExport filtrado: %v", err)
	}
	if len(october) != 1 {
		t.Fatalf("esperaba 1 linea en octubre, llegaron %d", len(october))
	}
	if october[0].InvoiceNumber != "LARS102" {
		t.Errorf("factura filtrada incorrecta: %s", october[0].InvoiceNumber)
	}
	if october[0].IVAPercent != 19 || october[0].IVAValue != 190000 {
		t.Errorf("IVA mal calculado: %+v", october[0])
	}

	// Rango inválido.
	if _, err := s.GetOasisExport(companyID, OasisExportQuery{From: "2026-10-31", To: "2026-10-01"}); err == nil {
		t.Error("esperaba error con from > to")
	}
	if _, err := s.GetOasisExport(companyID, OasisExportQuery{From: "malo"}); err == nil {
		t.Error("esperaba error con fecha invalida")
	}

	// Cartera: la factura Pendiente vencida o no, con overdue real.
	portfolio, err := s.GetPortfolio(companyID, "")
	if err != nil {
		t.Fatalf("GetPortfolio: %v", err)
	}
	if len(portfolio) != 1 {
		t.Fatalf("esperaba 1 item en cartera, llegaron %d", len(portfolio))
	}
	if portfolio[0].ClientName != "Series SAS" || portfolio[0].Balance != 1554000 {
		t.Errorf("item de cartera incorrecto: %+v", portfolio[0])
	}
	if !portfolio[0].Overdue { // vence 2026-10-01, hoy es despues
		t.Errorf("esperaba overdue=true: %+v", portfolio[0])
	}
}
