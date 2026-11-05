package extractions

import (
	"strings"
	"testing"
)

func mustPlan(t *testing.T, tables ...string) *joinPlan {
	t.Helper()
	plan, err := buildJoinPlan(newRegistry(), tables)
	if err != nil {
		t.Fatalf("buildJoinPlan: %v", err)
	}
	return plan
}

func TestBuildSelectSQLUsesAliasesAndPreFilteredSources(t *testing.T) {
	reg := newRegistry()
	plan := mustPlan(t, "crm_accounts", "crm_account_contacts")
	req := QueryRequest{
		Tables: []string{"crm_accounts", "crm_account_contacts"},
		Columns: []FieldRef{
			{Table: "crm_accounts", Column: "name"},
			{Table: "crm_account_contacts", Column: "email"},
		},
	}

	sql, args, err := buildSelectSQL(reg, plan, req, defaultRowLimit)
	if err != nil {
		t.Fatalf("buildSelectSQL: %v", err)
	}

	checks := []string{
		`t0."name" AS "crm_accounts.name"`,
		`t1."email" AS "crm_account_contacts.email"`,
		// Base pre-filtrada por empresa y bajas (no en el WHERE).
		`FROM (SELECT * FROM "crm_accounts" WHERE company_id = $1 AND soft_delete = false) AS t0`,
		// Contactos es fuente seleccionada: FULL OUTER preserva no emparejadas.
		`FULL OUTER JOIN (SELECT * FROM "crm_account_contacts" WHERE company_id = $1 AND soft_delete = false) AS t1 ON t0."id" = t1."account_id"`,
		"LIMIT 1001",
	}
	for _, check := range checks {
		if !strings.Contains(sql, check) {
			t.Fatalf("el SQL no contiene %q:\n%s", check, sql)
		}
	}
	// Sin filtros del usuario no debe existir WHERE a nivel externo (rompería
	// el FULL OUTER). Los WHERE internos son los de las subconsultas.
	outer := sql[strings.LastIndex(sql, " ON "):]
	if strings.Contains(outer, " WHERE ") {
		t.Fatalf("no se esperaba WHERE externo sin filtros:\n%s", sql)
	}
	if len(args) == 0 || args[0] != "" {
		t.Fatalf("el primer argumento debe ser placeholder de company_id: %v", args)
	}
}

func TestClientsAndProspectsFullOuterKeepsBothSources(t *testing.T) {
	reg := newRegistry()
	plan := mustPlan(t, "crm_clients", "crm_prospects")
	req := QueryRequest{
		Tables: []string{"crm_clients", "crm_prospects"},
		Columns: []FieldRef{
			{Table: "crm_clients", Column: "nombre"},
			{Table: "crm_prospects", Column: "name"},
		},
	}

	sql, _, err := buildSelectSQL(reg, plan, req, defaultRowLimit)
	if err != nil {
		t.Fatalf("buildSelectSQL: %v", err)
	}

	// Ambas fuentes proyectadas y el FULL OUTER JOIN preserva clientes sin
	// prospecto y prospectos huérfanos (filas no emparejadas de ambos lados).
	checks := []string{
		`t0."nombre" AS "crm_clients.nombre"`,
		`t1."name" AS "crm_prospects.name"`,
		`FROM (SELECT * FROM "crm_clients" WHERE company_id = $1 AND soft_delete = false) AS t0`,
		`FULL OUTER JOIN (SELECT * FROM "crm_prospects" WHERE company_id = $1 AND soft_delete = false) AS t1 ON t0."prospect_id" = t1."id"`,
	}
	for _, check := range checks {
		if !strings.Contains(sql, check) {
			t.Fatalf("el SQL no contiene %q:\n%s", check, sql)
		}
	}
	outer := sql[strings.LastIndex(sql, " ON "):]
	if strings.Contains(outer, " WHERE ") {
		t.Fatalf("el WHERE externo filtraría las filas no emparejadas del FULL OUTER:\n%s", sql)
	}
}

func TestFiltersOnFullOuterSourcesApplyInWhere(t *testing.T) {
	reg := newRegistry()
	plan := mustPlan(t, "crm_clients", "crm_prospects")
	req := QueryRequest{
		Tables: []string{"crm_clients", "crm_prospects"},
		Columns: []FieldRef{
			{Table: "crm_clients", Column: "nombre"},
			{Table: "crm_prospects", Column: "name"},
		},
		Filters: []Filter{
			{Table: "crm_prospects", Column: "status", Op: "equals", Value: "Pendiente"},
		},
	}

	sql, _, err := buildSelectSQL(reg, plan, req, defaultRowLimit)
	if err != nil {
		t.Fatalf("buildSelectSQL: %v", err)
	}
	if !strings.Contains(sql, ` WHERE t1."status"::text = $2`) {
		t.Fatalf("el filtro sobre prospectos debe aplicar en el WHERE:\n%s", sql)
	}
}

func TestBuildSelectSQLFiltersByType(t *testing.T) {
	reg := newRegistry()
	plan := mustPlan(t, "finance_invoices")
	req := QueryRequest{
		Tables:  []string{"finance_invoices"},
		Columns: []FieldRef{{Table: "finance_invoices", Column: "total"}},
		Filters: []Filter{
			{Table: "finance_invoices", Column: "total", Op: "equals", Value: "1000000"},
			{Table: "finance_invoices", Column: "issue_date", Op: "between", From: "2026-01-01", To: "2026-12-31"},
			{Table: "finance_invoices", Column: "status", Op: "contains", Value: "pagado"},
		},
	}

	sql, _, err := buildSelectSQL(reg, plan, req, defaultRowLimit)
	if err != nil {
		t.Fatalf("buildSelectSQL: %v", err)
	}

	for _, check := range []string{
		`t0."total" = $2::double precision`,
		`t0."issue_date"::date >= $3::date`,
		`t0."issue_date"::date <= $4::date`,
	} {
		if !strings.Contains(sql, check) {
			t.Fatalf("el SQL no contiene %q:\n%s", check, sql)
		}
	}
}

func TestContainsFilterNormalizesBothSides(t *testing.T) {
	reg := newRegistry()
	plan := mustPlan(t, "crm_accounts")
	req := QueryRequest{
		Tables:  []string{"crm_accounts"},
		Columns: []FieldRef{{Table: "crm_accounts", Column: "name"}},
		Filters: []Filter{{Table: "crm_accounts", Column: "name", Op: "contains", Value: "COMERCIALIZADORA, ANDINA S.A.S."}},
	}

	sql, args, err := buildSelectSQL(reg, plan, req, defaultRowLimit)
	if err != nil {
		t.Fatalf("buildSelectSQL: %v", err)
	}

	checks := []string{
		// Acentos eliminados con translate (sin extensiones de PostgreSQL).
		`translate(lower(t0."name"::text)`,
		`translate(lower($2::text)`,
		// Puntuación convertida en espacio y espacios colapsados.
		`'[^a-z0-9]+'`,
		`'\s+'`,
		// LIKE sobre ambas expresiones normalizadas (sin ILIKE cruzado).
		`)) LIKE '%' || trim(both ' ' from regexp_replace(regexp_replace(translate(lower($2::text)`,
	}
	for _, check := range checks {
		if !strings.Contains(sql, check) {
			t.Fatalf("el SQL no contiene %q:\n%s", check, sql)
		}
	}
	if len(args) != 2 || args[1] != "COMERCIALIZADORA, ANDINA S.A.S." {
		t.Fatalf("el valor del filtro debe llegar tal cual como parámetro: %v", args)
	}
}

func TestBuildSelectSQLRejectsUnknownColumn(t *testing.T) {
	reg := newRegistry()
	plan := mustPlan(t, "crm_accounts")
	req := QueryRequest{
		Tables:  []string{"crm_accounts"},
		Columns: []FieldRef{{Table: "crm_accounts", Column: "password"}},
	}
	if _, _, err := buildSelectSQL(reg, plan, req, defaultRowLimit); err == nil {
		t.Fatal("se esperaba error por columna fuera del registro")
	}
}

func TestBuildSelectSQLRejectsBadDate(t *testing.T) {
	reg := newRegistry()
	plan := mustPlan(t, "finance_invoices")
	req := QueryRequest{
		Tables:  []string{"finance_invoices"},
		Columns: []FieldRef{{Table: "finance_invoices", Column: "total"}},
		Filters: []Filter{{Table: "finance_invoices", Column: "issue_date", Op: "between", From: "31/12/2026"}},
	}
	if _, _, err := buildSelectSQL(reg, plan, req, defaultRowLimit); err == nil {
		t.Fatal("se esperaba error por fecha inválida")
	}
}

func TestBuildTotalsSQLDeduplicatesByPrimaryKey(t *testing.T) {
	reg := newRegistry()
	plan := mustPlan(t, "crm_accounts", "crm_account_contacts")
	req := QueryRequest{
		Tables: []string{"crm_accounts", "crm_account_contacts"},
		Columns: []FieldRef{
			{Table: "crm_accounts", Column: "name"},
		},
	}
	// El total es de la tabla base: debe deduplicar por su PK aunque el join
	// con contactos genere fan-out (1 cuenta : N contactos).
	sql, _, err := buildTotalsSQL(reg, plan, req, FieldRef{Table: "crm_accounts", Column: "credit_limit"})
	if err != nil {
		t.Fatalf("buildTotalsSQL: %v", err)
	}

	for _, check := range []string{
		`SELECT DISTINCT ON (t0."id")`,
		`t0."credit_limit"::double precision AS val`,
		`COALESCE(SUM(dedup.val), 0)`,
		`ORDER BY t0."id"`,
	} {
		if !strings.Contains(sql, check) {
			t.Fatalf("el SQL de totales no contiene %q:\n%s", check, sql)
		}
	}
}

func TestBuildTotalsSQLRejectsTextColumn(t *testing.T) {
	reg := newRegistry()
	plan := mustPlan(t, "crm_accounts")
	req := QueryRequest{Tables: []string{"crm_accounts"}}
	if _, _, err := buildTotalsSQL(reg, plan, req, FieldRef{Table: "crm_accounts", Column: "name"}); err == nil {
		t.Fatal("se esperaba error por total sobre columna de texto")
	}
}

func TestJoinedSoftDeleteGoesInJoinOnNotWhere(t *testing.T) {
	reg := newRegistry()
	plan := mustPlan(t, "crm_clients", "crm_prospects")
	req := QueryRequest{
		Tables:  []string{"crm_clients", "crm_prospects"},
		Columns: []FieldRef{{Table: "crm_clients", Column: "nombre"}},
	}

	sql, _, err := buildSelectSQL(reg, plan, req, defaultRowLimit)
	if err != nil {
		t.Fatalf("buildSelectSQL: %v", err)
	}

	// Prospectos es fuente seleccionada: va en subconsulta pre-filtrada con
	// FULL OUTER JOIN; el WHERE no debe referenciarla (la descartaría).
	if !strings.Contains(sql, `FULL OUTER JOIN (SELECT * FROM "crm_prospects" WHERE company_id = $1 AND soft_delete = false) AS t1 ON t0."prospect_id" = t1."id"`) {
		t.Fatalf("el FULL OUTER JOIN pre-filtrado no aparece:\n%s", sql)
	}
	outer := sql[strings.LastIndex(sql, " ON "):]
	if strings.Contains(outer, " WHERE ") {
		t.Fatalf("sin filtros del usuario no debe haber WHERE externo:\n%s", sql)
	}
}

func TestLegacyBridgeConstLandsOnCorrectAlias(t *testing.T) {
	reg := newRegistry()
	plan := mustPlan(t, "crm_prospects", "crm_accounts")
	req := QueryRequest{
		Tables: []string{"crm_prospects", "crm_accounts"},
		Columns: []FieldRef{
			{Table: "crm_prospects", Column: "name"},
			{Table: "crm_accounts", Column: "name"},
		},
	}

	sql, _, err := buildSelectSQL(reg, plan, req, defaultRowLimit)
	if err != nil {
		t.Fatalf("buildSelectSQL: %v", err)
	}

	// t1 = crm_account_legacy_ids (intermedia, LEFT); la constante aplica a
	// esa tabla aunque la arista se atraviese en dirección declarada.
	// t2 = crm_accounts (fuente seleccionada, FULL OUTER pre-filtrado).
	for _, check := range []string{
		`FROM (SELECT * FROM "crm_prospects" WHERE company_id = $1 AND soft_delete = false) AS t0`,
		`LEFT JOIN "crm_account_legacy_ids" AS t1 ON t0."company_id" = t1."company_id" AND t0."id" = t1."legacy_id" AND t1."legacy_type" = 'prospect' AND t1.company_id = $1`,
		`FULL OUTER JOIN (SELECT * FROM "crm_accounts" WHERE company_id = $1 AND soft_delete = false) AS t2 ON t1."account_id" = t2."id"`,
	} {
		if !strings.Contains(sql, check) {
			t.Fatalf("el SQL no contiene %q:\n%s", check, sql)
		}
	}
}
