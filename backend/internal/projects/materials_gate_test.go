package projects

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"testing"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// execer es la porcion de *sql.DB que los helpers de prueba necesitan.
type execer interface {
	Exec(query string, args ...any) (sql.Result, error)
}

// La puerta de materiales es una regla de negocio: no se entra a Reparacion si
// el proyecto tiene obligaciones de material abiertas (reservas sin consumir,
// lineas de compra pendientes o solicitudes sin revisar). Estos casos fijan
// los bloqueos y, sobre todo, las SALIDAS legales: consumir/liberar la reserva
// o cerrar la linea desbloquean. Se omite sin RUN_DB_TESTS (openSLATestDB).

// cleanupGateRows borra las filas de prueba en las cuatro tablas que la
// puerta toca.
func cleanupGateRows(t *testing.T, db execer, companyID string) {
	t.Helper()
	tables := []string{
		"projects",
		"inventory_reservations",
		"inventory_purchase_lines",
		"purchase_requests",
	}
	for _, table := range tables {
		if _, err := db.Exec(fmt.Sprintf(`DELETE FROM %s WHERE company_id = $1`, table), companyID); err != nil {
			t.Fatalf("cleanup de %s: %v", table, err)
		}
	}
}

func insertGateReservation(t *testing.T, db execer, companyID, reservationID, reference, workOrder, status string) {
	t.Helper()
	_, err := db.Exec(`
		INSERT INTO inventory_reservations (company_id, id, reference, quantity, assigned_to, purpose,
			work_order, equipment_tag, customer_site, priority, commitment_date, reserved_at, expires_at, status)
		VALUES ($1,$2,$3,1,'qa','prueba de puerta',$4,'','','media','', now(), now() + interval '30 days', $5)`,
		companyID, reservationID, reference, workOrder, status)
	if err != nil {
		t.Fatalf("insertar reserva de prueba: %v", err)
	}
}

func insertGatePurchaseLine(t *testing.T, db execer, companyID, lineID, reference, projectID, lineStatus string) {
	t.Helper()
	_, err := db.Exec(`
		INSERT INTO inventory_purchase_lines (company_id, id, reference, component, type, brand, description, supplier,
			quantity, unit_price, needed_by, source, expected_date, request_reason, generated_at, generated_by, status,
			project_id, equipment_tag, approval_status)
		VALUES ($1,$2,$3,'','','','prueba de puerta','', 1,0,'','manual','','razon qa', now(), 'qa', $4, $5, '', 'aprobada')`,
		companyID, lineID, reference, lineStatus, projectID)
	if err != nil {
		t.Fatalf("insertar linea de compra de prueba: %v", err)
	}
}

func insertGatePurchaseRequest(t *testing.T, db execer, companyID, requestID, reference, projectID string) {
	t.Helper()
	_, err := db.Exec(`
		INSERT INTO purchase_requests (company_id, id, reference, description, quantity, supplier,
			estimated_cost, lead_time_days, urgency, memo, project_id, equipment_tag,
			requested_by, requested_at, status, reviewed_by, review_notes, purchase_line_id)
		VALUES ($1,$2,$3,'prueba de puerta',1,'', 0, 1, 'normal', '', $4, '', 'qa', now(), 'pendiente', '', '', '')`,
		companyID, requestID, reference, projectID)
	if err != nil {
		t.Fatalf("insertar solicitud de compra de prueba: %v", err)
	}
}

// approveGateRequest simula el efecto en BD de ReviewPurchaseRequest(aprobar):
// la solicitud deja de ser pendiente y nace una linea ABIERTA que NO hereda
// project_id (solo se vincula por purchase_line_id). Ese hueco es exactamente
// lo que la puerta debe cubrir con su join.
func approveGateRequest(t *testing.T, db execer, companyID, requestID, lineID, reference string) {
	t.Helper()
	res, err := db.Exec(`UPDATE purchase_requests SET status = 'aprobada', reviewed_by = 'qa', reviewed_at = now(), review_notes = '' WHERE company_id = $1 AND id = $2`, companyID, requestID)
	if err != nil {
		t.Fatalf("aprobar solicitud de prueba: %v", err)
	}
	if affected := mustAffected(t, res); affected != 1 {
		t.Fatalf("aprobacion de solicitud afecto %d filas, esperaba 1", affected)
	}

	insertGatePurchaseLine(t, db, companyID, lineID, reference, "", "pendiente")

	res2, err := db.Exec(`UPDATE purchase_requests SET purchase_line_id = $3 WHERE company_id = $1 AND id = $2`, companyID, requestID, lineID)
	if err != nil {
		t.Fatalf("vincular linea a solicitud de prueba: %v", err)
	}
	if affected := mustAffected(t, res2); affected != 1 {
		t.Fatalf("vinculacion afecto %d filas, esperaba 1", affected)
	}
}

// COMPR-02: equipo en Pos 05 (OC aprobada / pedir-repuestos) que SOLO requiere
// stock. La reserva activa NO bloquea la entrada a Reparacion; es lo que la
// habilita (el material ya esta dentro de instalaciones). Lo unico que bloquea
// son las obligaciones de compra externa (demas tests de este archivo).
func TestUpsertProjectAllowsRepairWithActiveStockReservation(t *testing.T) {
	db := openSLATestDB(t)
	s := NewService(db)

	const companyID = "qa-gate-reserva"
	t.Cleanup(func() { cleanupGateRows(t, db, companyID) })

	const projectID = "proj-gate-res"
	const shortCode = "RP·QA-GATE-RES"
	const reservationID = "res-qa-gate-res"

	if _, err := s.UpsertProject(companyID, UpsertProjectRequest{
		ID:         projectID,
		Status:     "pedir-repuestos",
		Properties: map[string]any{"shortCode": shortCode},
	}); err != nil {
		t.Fatalf("crear proyecto en pedir-repuestos: %v", err)
	}

	insertGateReservation(t, db, companyID, reservationID, "ABC-500", shortCode, "activa")

	// Legal: reserva activa + sin lineas de compra abiertas -> Reparacion (Pos 1).
	saved, err := s.UpsertProject(companyID, UpsertProjectRequest{
		ID:         projectID,
		Status:     "reparacion",
		Properties: map[string]any{"shortCode": shortCode},
	})
	if err != nil {
		t.Fatalf("COMPR-02: con reserva de stock activa y sin compras abiertas, Reparacion debe ser legal: %v", err)
	}
	if saved.Status != "reparacion" {
		t.Fatalf("status = %q, esperaba reparacion", saved.Status)
	}

	// No-op en reparacion NO se bloquea aunque aparezca una reserva nueva activa
	// (todo 'Guardar cambios' desde la ficha reenvia el mismo estado).
	insertGateReservation(t, db, companyID, "res-qa-gate-res2", "ABC-500", shortCode, "activa")
	if _, err := s.UpsertProject(companyID, UpsertProjectRequest{
		ID:         projectID,
		Status:     "reparacion",
		Properties: map[string]any{"shortCode": shortCode},
	}); err != nil {
		t.Fatalf("no-op reparacion->reparacion no debe pasar por la puerta de materiales: %v", err)
	}
}

func TestUpsertProjectBlocksRepairWithOpenPurchaseLine(t *testing.T) {
	db := openSLATestDB(t)
	s := NewService(db)

	const companyID = "qa-gate-linea"
	t.Cleanup(func() { cleanupGateRows(t, db, companyID) })

	const projectID = "proj-gate-line"
	const lineID = "po-qa-gate-line"

	// esperando-proveedor -> reparacion es transicion legal; la puerta debe ser
	// la que bloquee.
	if _, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "esperando-proveedor"}); err != nil {
		t.Fatalf("crear proyecto en esperando-proveedor: %v", err)
	}

	insertGatePurchaseLine(t, db, companyID, lineID, "BOBINA-0101", projectID, "pendiente")

	err := upsertToRepair(t, s, companyID, projectID, nil)
	if !errors.Is(err, errMaterialsPending) {
		t.Fatalf("UpsertProject con linea abierta = %v, esperaba errMaterialsPending", err)
	}
	if err == nil || !strings.Contains(err.Error(), "BOBINA-0101") {
		t.Fatalf("mensaje debe listar la referencia pendiente: %v", err)
	}

	// Salida legal: cerrar la linea (recibido en stock).
	if _, err := db.Exec(`UPDATE inventory_purchase_lines SET status = 'cerrada' WHERE company_id = $1 AND id = $2`, companyID, lineID); err != nil {
		t.Fatalf("cerrar linea de prueba: %v", err)
	}

	saved, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "reparacion"})
	if err != nil {
		t.Fatalf("tras cerrar la linea, Reparacion debe ser legal: %v", err)
	}
	if saved.Status != "reparacion" {
		t.Fatalf("status = %q, esperaba reparacion", saved.Status)
	}
}

func TestUpsertProjectBlocksRepairThroughApprovedRequestLine(t *testing.T) {
	db := openSLATestDB(t)
	s := NewService(db)

	const companyID = "qa-gate-solicitud"
	t.Cleanup(func() { cleanupGateRows(t, db, companyID) })

	const projectID = "proj-gate-solic"
	const requestID = "pr-qa-gate-solic"
	const lineID = "po-qa-gate-solic"
	const reference = "PANTALLA-TT"

	if _, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "diagnostico"}); err != nil {
		t.Fatalf("crear proyecto en diagnostico: %v", err)
	}

	insertGatePurchaseRequest(t, db, companyID, requestID, reference, projectID)

	// Fase 1: solicitud pendiente bloquea.
	if err := upsertToRepair(t, s, companyID, projectID, nil); !errors.Is(err, errMaterialsPending) {
		t.Fatalf("con solicitud pendiente = %v, esperaba errMaterialsPending", err)
	}

	// Fase 2: al aprobar nace una linea ABIERTA sin project_id. La puerta debe
	// seguirla por purchase_line_id, no dejar el hueco.
	approveGateRequest(t, db, companyID, requestID, lineID, reference)

	err := upsertToRepair(t, s, companyID, projectID, nil)
	if !errors.Is(err, errMaterialsPending) {
		t.Fatalf("tras aprobar (linea sin project_id) = %v, esperaba errMaterialsPending", err)
	}
	if err == nil || !strings.Contains(err.Error(), "linea de compra abierta") {
		t.Fatalf("el bloqueo debe provenir de la linea vinculada: %v", err)
	}

	// Fase 3: cerrar esa linea desbloquea.
	if _, err := db.Exec(`UPDATE inventory_purchase_lines SET status = 'cerrada' WHERE company_id = $1 AND id = $2`, companyID, lineID); err != nil {
		t.Fatalf("cerrar linea vinculada: %v", err)
	}

	saved, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "reparacion"})
	if err != nil {
		t.Fatalf("tras cerrar la linea vinculada, Reparacion debe ser legal: %v", err)
	}
	if saved.Status != "reparacion" {
		t.Fatalf("status = %q, esperaba reparacion", saved.Status)
	}
}

// La regla del usuario es por material recibido: si la totalidad ya llego
// (received_quantity cubre quantity), Reparacion debe abrirse aunque nadie le
// haya dado al boton Cerrar aun.
func TestUpsertProjectAllowsRepairWhenLineFullyReceived(t *testing.T) {
	db := openSLATestDB(t)
	s := NewService(db)

	const companyID = "qa-gate-recibido-100"
	t.Cleanup(func() { cleanupGateRows(t, db, companyID) })

	const projectID = "proj-gate-recib100"
	const lineID = "po-qa-gate-recib100"

	if _, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "esperando-proveedor"}); err != nil {
		t.Fatalf("crear proyecto en esperando-proveedor: %v", err)
	}

	insertGatePurchaseLine(t, db, companyID, lineID, "BOBINA-0101", projectID, "pendiente")
	if _, err := db.Exec(`UPDATE inventory_purchase_lines SET received_quantity = quantity WHERE company_id = $1 AND id = $2`, companyID, lineID); err != nil {
		t.Fatalf("marcar linea recibida al 100%%: %v", err)
	}

	saved, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "reparacion"})
	if err != nil {
		t.Fatalf("linea recibida al 100%% no debe bloquear Reparacion: %v", err)
	}
	if saved.Status != "reparacion" {
		t.Fatalf("status = %q, esperaba reparacion", saved.Status)
	}
}

// Recibido PARCIAL sigue bloqueando: faltan unidades por llegar.
func TestUpsertProjectBlocksRepairWhenLinePartiallyReceived(t *testing.T) {
	db := openSLATestDB(t)
	s := NewService(db)

	const companyID = "qa-gate-recibido-parcial"
	t.Cleanup(func() { cleanupGateRows(t, db, companyID) })

	const projectID = "proj-gate-recibparc"
	const lineID = "po-qa-gate-recibparc"

	if _, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "esperando-proveedor"}); err != nil {
		t.Fatalf("crear proyecto en esperando-proveedor: %v", err)
	}

	insertGatePurchaseLine(t, db, companyID, lineID, "BOBINA-0101", projectID, "pendiente")
	if _, err := db.Exec(`UPDATE inventory_purchase_lines SET quantity = 2, received_quantity = 1 WHERE company_id = $1 AND id = $2`, companyID, lineID); err != nil {
		t.Fatalf("marcar linea recibida parcialmente (1 de 2): %v", err)
	}

	err := upsertToRepair(t, s, companyID, projectID, nil)
	if !errors.Is(err, errMaterialsPending) {
		t.Fatalf("linea con faltante de material = %v, esperaba errMaterialsPending", err)
	}
}

func TestMaterialsPendingErrorMessageIsActionable(t *testing.T) {
	items := []materialsGateItem{
		{kind: "reserva activa", label: "ABC-500 x1"},
		{kind: "linea de compra abierta", label: "BOBINA-0101 x2"},
	}

	err := newMaterialsPendingError(items)
	if !errors.Is(err, errMaterialsPending) {
		t.Fatalf("el error debe envolver errMaterialsPending para el mapeo HTTP: %v", err)
	}

	message := err.Error()
	for _, fragment := range []string{"ABC-500 x1", "BOBINA-0101 x2", "Reparacion"} {
		if !strings.Contains(message, fragment) {
			t.Fatalf("mensaje %q no menciona %q", message, fragment)
		}
	}
}

func upsertToRepair(t *testing.T, s *Service, companyID, projectID string, properties map[string]any) error {
	t.Helper()
	_, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "reparacion", Properties: properties})
	return err
}

func mustAffected(t *testing.T, res sql.Result) int {
	t.Helper()
	affected, err := res.RowsAffected()
	if err != nil {
		t.Fatalf("RowsAffected: %v", err)
	}
	return int(affected)
}
