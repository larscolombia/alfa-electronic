package equipment

import "testing"

// Semantica pura del filtro por contexto: la palabra clave activa depende del
// contexto normalizado; vacio o desconocido = sin filtro (todos los activos),
// que es el contrato de compatibilidad con llamadores anteriores.
func TestListTechniciansForContextKeywords(t *testing.T) {
	if got := ListTechniciansForContext("tecnica"); len(got) == 0 {
		t.Error("contexto tecnica no activa ningun filtro")
	}

	if got := ListTechniciansForContext("comercial"); len(got) == 0 {
		t.Error("contexto comercial no activa ningun filtro")
	}

	for _, raw := range []string{"", "   ", "desconocido", "TECNICA "} {
		var expectedEmpty bool
		if raw != "TECNICA " {
			expectedEmpty = true
		}
		got := ListTechniciansForContext(raw)
		if expectedEmpty && len(got) != 0 {
			t.Errorf("contexto %q debia dejar sin filtro, activo %v", raw, got)
		}
		if !expectedEmpty && len(got) == 0 {
			t.Errorf("contexto %q debia normalizarse a tecnica y activar filtro", raw)
		}
	}
}

// Integracion: el endpoint filtra de verdad por relevancia del rol/departamento.
// Se siembran tres empleados con perfiles distintos (tecnico, comercial, RRHH)
// y se verifica que cada contexto incluya al suyo y excluya a los demas. Las
// aserciones son de CONTIENE/NO CONTIENE porque la compania demo puede traer
// otros empleados activos sembrados por otras pruebas o seeds.
func TestListTechniciansRoleContextFilter(t *testing.T) {
	db := openEquipmentTestDB(t)

	seeded := []struct {
		id         string
		name       string
		role       string
		department string
	}{
		{id: "qa-ctx-tec", name: "QA Ctx Tecnico Activo", role: "Tecnico soporte", department: "Operaciones"},
		{id: "qa-ctx-com", name: "QA Ctx Comercial Activa", role: "Coordinador SST", department: "Comercial"},
		{id: "qa-ctx-hr", name: "QA Ctx RRHH Activo", role: "Analista RRHH", department: "Gestion Humana"},
	}

	for _, person := range seeded {
		if _, err := db.Exec(`
INSERT INTO hr_employees (company_id, id, name, role, department, manager, status, soft_delete, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, 'Direccion General', 'Activo', false, NOW(), NOW())
ON CONFLICT (company_id, id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, department = EXCLUDED.department;
`, testEquipmentCompanyID, person.id, person.name, person.role, person.department); err != nil {
			t.Fatalf("sembrar empleado %s: %v", person.id, err)
		}
		t.Cleanup(func() {
			if _, err := db.Exec(`DELETE FROM hr_employees WHERE company_id = $1 AND id = $2;`, testEquipmentCompanyID, person.id); err != nil {
				t.Logf("cleanup empleado %s: %v", person.id, err)
			}
		})
	}

	service := NewService(db, nil)

	namesByContext := func(roleContext string) map[string]bool {
		items, err := service.ListTechnicians(testEquipmentCompanyID, "", roleContext)
		if err != nil {
			t.Fatalf("ListTechnicians(context=%q): %v", roleContext, err)
		}
		names := make(map[string]bool, len(items))
		for _, item := range items {
			names[item.Name] = true
		}
		return names
	}

	all := namesByContext("")
	tecnica := namesByContext("tecnica")
	comercial := namesByContext("comercial")
	desconocido := namesByContext("contexto-que-no-existe")

	// Sin filtro y contexto desconocido: los tres sembrados deben estar.
	for label, names := range map[string]map[string]bool{"sin contexto": all, "contexto desconocido": desconocido} {
		for _, person := range seeded {
			if !names[person.name] {
				t.Errorf("%s no incluye a %q (debia devolver todos los activos)", label, person.name)
			}
		}
	}

	// Tecnica: incluye al tecnico, excluye comercial y RRHH.
	if !tecnica["QA Ctx Tecnico Activo"] {
		t.Error("contexto tecnica no incluyo al empleado de rol tecnico")
	}
	for _, excluded := range []string{"QA Ctx Comercial Activa", "QA Ctx RRHH Activo"} {
		if tecnica[excluded] {
			t.Errorf("contexto tecnica mostro a %q: no tiene rol/departamento tecnico", excluded)
		}
	}

	// Comercial: incluye al comercial, excluye tecnico y RRHH.
	if !comercial["QA Ctx Comercial Activa"] {
		t.Error("contexto comercial no incluyo al empleado de departamento comercial")
	}
	for _, excluded := range []string{"QA Ctx Tecnico Activo", "QA Ctx RRHH Activo"} {
		if comercial[excluded] {
			t.Errorf("contexto comercial mostro a %q: no tiene rol/departamento comercial", excluded)
		}
	}

}