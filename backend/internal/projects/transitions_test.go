package projects

import (
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"
)

// La tabla de transiciones es la unica fuente de reglas del flujo tecnico.
// Estos casos fijan los saltos que el negocio SI permite (incluido el reverso
// del drag & drop y el auto-avance por repuestos) y los que debe bloquear:
// los saltos largos que antes nada impedía en el servidor.

func TestCanTransitionRules(t *testing.T) {
	cases := []struct {
		name string
		from string
		to   string
		want bool
	}{
		{"mismo estado es no-op", "reparacion", "reparacion", true},
		{"origen vacio se deja pasar para normalizar en la primera escritura", "", "diagnostico", true},
		{"origen fuera del catalogo se deja pasar para poder corregirlo", "estado-heredado", "recibido", true},

		// Flujo principal, ambos sentidos (correcciones y reverso de drag).
		{"recibido a diagnostico", "recibido", "diagnostico", true},
		{"diagnostico a recibido", "diagnostico", "recibido", true},
		{"diagnostico a por-cotizar (cierre de diagnostico)", "diagnostico", "por-cotizar", true},
		{"por-cotizar a pedir-reupertino (OC vinculada)", "por-cotizar", "pedir-reupertino", true},
		{"pedir-reupertino a esperando-proveedor", "pedir-reupertino", "esperando-proveedor", true},
		{"esperando-proveedor a reparacion (llego el material)", "esperando-proveedor", "reparacion", true},
		{"reparacion a listo-entrega (cierre con informe de intervencion)", "reparacion", "listo-entrega", true},
		{"listo-entrega a entregado (despacho)", "listo-entrega", "entregado", true},
		{"entregado a listo-entrega (cancelacion de despacho)", "entregado", "listo-entrega", true},

		// Auto-avance por repuestos con material disponible.
		{"diagnostico a reparacion (repuesto en stock)", "diagnostico", "reparacion", true},
		{"por-cotizar a reparacion (repuesto en stock)", "por-cotizar", "reparacion", true},

		// Garantia y su pausa visible mientras faltan repuestos.
		{"entregado a garantia (reclamo)", "entregado", "garantia", true},
		{"garantia a esperando-proveedor (repuesto de garantia)", "garantia", "esperando-proveedor", true},
		{"garantia a pausa espera-reupertino", "garantia", "garantia-espera-reupertino", true},
		{"pausa espera-reupertino a garantia", "garantia-espera-reupertino", "garantia", true},
		{"pausa espera-reupertino a reparacion (llego el material)", "garantia-espera-reupertino", "reparacion", true},

		// Prestamo: estacionamiento lateral, entra y sale de cualquier columna.
		{"reparacion a prestamo", "reparacion", "prestamo", true},
		{"prestamo regresa al flujo principal", "prestamo", "esperando-proveedor", true},

		// Saltos largos: antes nada los impedía, ahora son ilegales.
		{"recibido no salta a entregado", "recibido", "entregado", false},
		{"diagnostico no salta directo a listo-entrega", "diagnostico", "listo-entrega", false},
		{"reparacion no salta directo a entregado (va por listo)", "reparacion", "entregado", false},
		{"reparacion no cierra directo en garantia", "reparacion", "garantia", false},
		{"entregado no regresa directo a reparacion (va por garantia)", "entregado", "reparacion", false},

		// Insensible a mayusculas y espacios.
		{"mayusculas y espacios se normalizan", "  DIAGNOSTICO ", "por-cotizar", true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := canTransition(tc.from, tc.to); got != tc.want {
				t.Fatalf("canTransition(%q, %q) = %v, esperaba %v", tc.from, tc.to, got, tc.want)
			}
		})
	}
}

func TestNewTransitionErrorMessageListsLegalTargets(t *testing.T) {
	err := newTransitionError("recibido", "entregado")
	if !errors.Is(err, errProjectTransitionInvalid) {
		t.Fatalf("newTransitionError = %v, debe envolver errProjectTransitionInvalid", err)
	}

	message := err.Error()
	for _, fragment := range []string{"recibido", "entregado", "diagnostico", "prestamo"} {
		if !strings.Contains(message, fragment) {
			t.Fatalf("mensaje %q no menciona %q", message, fragment)
		}
	}
}

// Con DB: la validacion se aplica contra el estado real guardado y un PUT
// ilegal no toca la fila. Se omite sin RUN_DB_TESTS (ver openSLATestDB).
func TestUpsertProjectValidatesStatusTransitions(t *testing.T) {
	db := openSLATestDB(t)
	s := NewService(db)

	companyID := fmt.Sprintf("qa-trans-%d", time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM projects WHERE company_id = $1`, companyID)
	})

	const projectID = "proj-transition-test"

	if _, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "recibido"}); err != nil {
		t.Fatalf("crear proyecto en recibido error inesperado: %v", err)
	}

	if _, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "entregado"}); !errors.Is(err, errProjectTransitionInvalid) {
		t.Fatalf("UpsertProject entregado desde recibido = %v, esperaba errProjectTransitionInvalid", err)
	}

	got, err := s.GetProject(companyID, projectID)
	if err != nil {
		t.Fatalf("GetProject error inesperado: %v", err)
	}
	if got.Status != "recibido" {
		t.Fatalf("status tras PUT ilegal = %q, esperaba recibido intacto", got.Status)
	}

	if _, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "diagnostico"}); err != nil {
		t.Fatalf("UpsertProject diagnostico desde recibido error inesperado: %v", err)
	}

	// Reenviar el mismo estado es un no-op legal (los guardados lo hacen siempre).
	if _, err := s.UpsertProject(companyID, UpsertProjectRequest{ID: projectID, Status: "diagnostico"}); err != nil {
		t.Fatalf("re-guardar diagnostico error inesperado: %v", err)
	}

	// El unico flujo que el backend ya validaba (cierre de diagnostico) debe
	// seguir funcionando a traves de la nueva regla. CloseDiagnosis relee la
	// fila de la BD, asi la puerta se persiste antes con un upsert no-op en
	// estado (diagnostico -> diagnostico es legal).
	if _, err := s.UpsertProject(companyID, UpsertProjectRequest{
		ID:
			projectID,
		Status: "diagnostico",
		Properties: map[string]any{
			"diagnosisInspection": map[string]any{"faultIdentified": true},
			"estimatedHours":      2,
			"partsBudgetUsd":      150,
		},
	}); err != nil {
		t.Fatalf("persistir puerta de diagnostico error inesperado: %v", err)
	}

	closed, err := s.CloseDiagnosis(companyID, projectID, "qa")
	if err != nil {
		t.Fatalf("CloseDiagnosis error inesperado: %v", err)
	}
	if closed.Status != "por-cotizar" {
		t.Fatalf("CloseDiagnosis status = %q, esperaba por-cotizar", closed.Status)
	}
}
