package extractions

import (
	"errors"
	"testing"
)

func TestBuildJoinPlanSingleTable(t *testing.T) {
	plan, err := buildJoinPlan(newRegistry(), []string{"crm_accounts"})
	if err != nil {
		t.Fatalf("single table: %v", err)
	}
	if plan.base != "crm_accounts" || len(plan.steps) != 0 {
		t.Fatalf("plan inesperado: %+v", plan)
	}
}

func TestBuildJoinPlanConnectedChain(t *testing.T) {
	// Cuentas → contactos/sucursales: árbol real del dominio CRM.
	plan, err := buildJoinPlan(newRegistry(), []string{"crm_accounts", "crm_account_contacts", "crm_account_branches"})
	if err != nil {
		t.Fatalf("cadena conectada: %v", err)
	}
	if len(plan.steps) != 2 {
		t.Fatalf("se esperaban 2 joins, hay %d", len(plan.steps))
	}
	for _, step := range plan.steps {
		if step.edge.From == "" || step.edge.To == "" {
			t.Fatalf("paso sin arista: %+v", step)
		}
		if len(step.edge.FromCols) != len(step.edge.ToCols) {
			t.Fatalf("arista con columnas desbalanceadas: %+v", step.edge)
		}
	}
}

func TestBuildJoinPlanProspectsChain(t *testing.T) {
	// Prospectos → contactos → clientes → recepciones: cadena real del CRM.
	plan, err := buildJoinPlan(newRegistry(), []string{"crm_prospects", "crm_prospect_contacts", "crm_clients", "crm_equipment_records"})
	if err != nil {
		t.Fatalf("cadena prospectos: %v", err)
	}
	if len(plan.steps) != 3 {
		t.Fatalf("se esperaban 3 joins, hay %d", len(plan.steps))
	}
}

func TestBuildJoinPlanUnconnectedIsBlocked(t *testing.T) {
	// finance_accounts no tiene relación con crm_accounts: debe bloquearse.
	_, err := buildJoinPlan(newRegistry(), []string{"crm_accounts", "finance_accounts"})
	if err == nil {
		t.Fatal("se esperaba error por tablas sin relación")
	}
	var unconnected *unconnectedError
	if !errors.As(err, &unconnected) {
		t.Fatalf("error de tipo inesperado: %v", err)
	}
	found := false
	for _, name := range unconnected.tables {
		if name == "finance_accounts" {
			found = true
		}
	}
	if !found {
		t.Fatalf("las tablas desconectadas deben nombrar finance_accounts: %v", unconnected.tables)
	}
	if !errors.Is(err, errUnconnectedTables) {
		t.Fatalf("el error debe envolver errUnconnectedTables: %v", err)
	}
}

func TestBuildJoinPlanUnknownTable(t *testing.T) {
	if _, err := buildJoinPlan(newRegistry(), []string{"no_existe"}); err == nil {
		t.Fatal("se esperaba error por tabla desconocida")
	}
}

func TestBuildJoinPlanCrossModuleChain(t *testing.T) {
	// inventario → compras → proveedores: la cadena real del esquema.
	plan, err := buildJoinPlan(newRegistry(), []string{"inventory_references", "inventory_purchase_lines", "suppliers"})
	if err != nil {
		t.Fatalf("cadena inventario/proveedores: %v", err)
	}
	if len(plan.steps) != 2 {
		t.Fatalf("se esperaban 2 joins, hay %d", len(plan.steps))
	}
}

func TestBuildJoinPlanClientsProspectsByEmpresa(t *testing.T) {
	// La relación real Clientes↔Prospectos es empresa=company (1 paso);
	// la FK prospect_id no se usa porque ningún flujo la escribe.
	plan, err := buildJoinPlan(newRegistry(), []string{"crm_clients", "crm_prospects"})
	if err != nil {
		t.Fatalf("clientes/prospectos por empresa: %v", err)
	}
	if len(plan.steps) != 1 || !plan.steps[0].edge.NormalizeText {
		t.Fatalf("se esperaba 1 paso por la arista de empresa normalizada: %+v", plan.steps)
	}
}

func TestBuildJoinPlanAccountsProspectsLegacyBridge(t *testing.T) {
	// Cuentas y prospectos se conectan por el puente real crm_account_legacy_ids.
	plan, err := buildJoinPlan(newRegistry(), []string{"crm_accounts", "crm_prospects", "crm_account_contacts"})
	if err != nil {
		t.Fatalf("cuentas/prospectos por puente legacy: %v", err)
	}
	if len(plan.steps) != 3 {
		t.Fatalf("se esperaban 3 joins, hay %d", len(plan.steps))
	}
}
