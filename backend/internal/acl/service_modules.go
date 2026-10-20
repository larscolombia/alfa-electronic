package acl

import (
	"context"
	"strings"
)

func (s *Service) ListModules() ([]Module, error) {
	ctx := context.Background()
	if err := s.ensureStaticData(ctx); err != nil {
		return nil, err
	}

	rows, err := s.db.QueryContext(ctx, `
SELECT id, slug, name, description, sort_order
FROM acl_modules
WHERE is_active = true
ORDER BY sort_order ASC;
`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	modules := make([]Module, 0)
	moduleIndexByID := make(map[string]int)
	for rows.Next() {
		var row Module
		if err := rows.Scan(&row.ID, &row.Slug, &row.Name, &row.Description, &row.SortOrder); err != nil {
			return nil, err
		}
		row.Fields = make([]ModuleField, 0)
		moduleIndexByID[row.ID] = len(modules)
		modules = append(modules, row)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	fieldRows, err := s.db.QueryContext(ctx, `
SELECT id, module_id, slug, label, sort_order
FROM acl_module_fields
WHERE is_active = true
ORDER BY module_id ASC, sort_order ASC;
`)
	if err != nil {
		return nil, err
	}
	defer fieldRows.Close()

	for fieldRows.Next() {
		var field ModuleField
		if err := fieldRows.Scan(&field.ID, &field.ModuleID, &field.Slug, &field.Label, &field.SortOrder); err != nil {
			return nil, err
		}

		idx, ok := moduleIndexByID[field.ModuleID]
		if !ok {
			continue
		}
		modules[idx].Fields = append(modules[idx].Fields, field)
	}

	if err := fieldRows.Err(); err != nil {
		return nil, err
	}

	return modules, nil
}

func defaultModules() []Module {
	type moduleSeed struct {
		id          string
		slug        string
		name        string
		description string
		fields      []string
	}

	seeds := []moduleSeed{
		{
			id:          "mod-horarios",
			slug:        "horarios",
			name:        "Modulo de horarios",
			description: "Configuracion de horas semanales base y dias habiles realmente trabajados.",
			fields: []string{
				"Horas semanales base",
				"Contador de dias habiles trabajados",
				"Plazo de reparacion (14 dias habiles configurable)",
				"Evaluacion de horas extra (horario vs registros)",
			},
		},
		{
			id:          "mod-registro-horas",
			slug:        "registro-horas",
			name:        "Modulo de registro de horas",
			description: "Control operativo de tareas y trazabilidad de tiempo por equipo.",
			fields: []string{
				"Inicio y finalizacion de cada tarea",
				"Justificacion de tareas vs horas semanales",
				"Detalle diario de uso de horas por equipo",
				"Algoritmo de prediccion de tiempo de reparacion",
				"Filtros de tiempo para tareas realizadas",
				"Modal obligatorio para seleccionar equipo al iniciar tiempo",
				"Evolucion anual de clientes y facturacion",
			},
		},
		{
			id:          "mod-gastos-caja-menor",
			slug:        "gastos-caja-menor",
			name:        "Modulo de registro de gastos de caja menor",
			description: "Seguimiento de presupuesto, movimientos y disponibilidad.",
			fields: []string{
				"Presupuesto mensual",
				"Fecha del gasto",
				"Concepto del gasto",
				"Valor",
				"Saldo",
				"Contador de billetes por denominacion",
			},
		},
		{
			id:          "mod-tecnico",
			slug:        "tecnico",
			name:        "Modulo tecnico",
			description: "Tablero de proyectos, diagnostico, reparacion e informes tecnicos.",
			fields: []string{
				"Tablero kanban de proyectos",
				"Memo de diagnostico",
				"Memo de reparacion",
				"Informes tecnicos de intervencion",
				"Notificaciones al cliente",
				"Historial de despacho",
			},
		},
		{
			id:          "mod-cotizaciones",
			slug:        "cotizaciones",
			name:        "Modulo cotizaciones",
			description: "Creacion, seguimiento y conversion de cotizaciones comerciales.",
			fields: []string{
				"Consecutivo de cotizacion",
				"Lineas de servicio y precios",
				"Descuentos",
				"Estado de decision del cliente",
				"Firma del cliente",
			},
		},
		{
			id:          "mod-compras",
			slug:        "compras",
			name:        "Modulo compras",
			description: "Ordenes de compra, proveedores, lineas de compra y trazabilidad.",
			fields: []string{
				"Ordenes de compra",
				"Lineas de compra",
				"Trazabilidad de pedidos",
				"Consolidado de compras",
				"Vinculacion orden-proyecto",
			},
		},
		{
			id:          "mod-crm",
			slug:        "crm",
			name:        "Modulo CRM",
			description: "Prospectos, clientes, contactos, seguimientos y zonas.",
			fields: []string{
				"Prospectos",
				"Clientes",
				"Contactos",
				"Seguimientos",
				"Zonas comerciales",
			},
		},
		{
			id:          "mod-inventario",
			slug:        "inventario",
			name:        "Modulo inventario",
			description: "Stock, movimientos, reservas, reaprovisionamiento y conciliacion.",
			fields: []string{
				"Fichas de stock",
				"Movimientos de entrada y salida",
				"Ajustes de inventario",
				"Reservas",
				"Reaprovisionamiento",
				"Conciliacion y bolsas",
			},
		},
		{
			id:          "mod-remisiones",
			slug:        "remisiones",
			name:        "Modulo remisiones",
			description: "Remisiones de despacho, consecutivos y adjuntos.",
			fields: []string{
				"Consecutivo de remision",
				"Lineas de remision",
				"Fotos de despacho",
				"Enlace de compra",
			},
		},
		{
			id:          "mod-finanzas",
			slug:        "finanzas",
			name:        "Modulo finanzas",
			description: "Bancos, pagos, facturacion, cuentas, creditos y garantias.",
			fields: []string{
				"Cuentas bancarias",
				"Pagos",
				"Facturacion",
				"Facturas recurrentes",
				"Clientes con credito",
				"Garantias",
			},
		},
		{
			id:          "mod-administracion",
			slug:        "administracion",
			name:        "Modulo administracion",
			description: "Roles y permisos, fichas de empleados y catalogos de RRHH. Los slugs de campo sensibles coinciden con las claves JSON de la ficha del empleado para permitir enmascarado en respuestas.",
			fields: []string{
				"documentNumber",
				"birthday",
				"residentialAddress",
				"emergencyContact",
				"emergencyRelationship",
				"allergies",
				"bloodType",
				"eps",
				"compensationFund",
				"hourlyRate",
				"terminationReason",
				"photoData",
			},
		},
		{
			id:          "mod-proveedores",
			slug:        "proveedores",
			name:        "Modulo proveedores",
			description: "Ficha maestra, clasificacion ABCD e informacion contable y de calidad.",
			fields: []string{
				"Clasificacion de proveedores ABCD",
				"Numero de proveedor (ID interno)",
				"Razon social",
				"Direccion principal y datos adicionales",
				"Codigo postal y ciudad",
				"Pais",
				"Identificacion fiscal (NIT/RUT/RFC)",
				"Numero IVA intracomunitario",
				"Idioma y moneda",
				"Contacto principal",
				"Trato / Apellido / Nombre",
				"Telefono celular",
				"Cargo / especialidad tecnica",
				"Dominio o sector de actividad",
				"RSE",
				"Suscripcion",
				"Observaciones",
				"Numero contable",
				"Terminos de pago",
				"Gastos de envio",
				"Pedido minimo",
				"Tasa de impuesto",
				"Responsable",
				"Grado de confianza",
				"Notas de desempeno",
			},
		},
	}

	modules := make([]Module, 0, len(seeds))
	for moduleIdx, seed := range seeds {
		fields := make([]ModuleField, 0, len(seed.fields))
		for fieldIdx, label := range seed.fields {
			slug := slugify(label)
			fields = append(fields, ModuleField{
				ID:        "field-" + seed.slug + "-" + slug,
				ModuleID:  seed.id,
				Slug:      slug,
				Label:     label,
				SortOrder: fieldIdx + 1,
			})
		}

		modules = append(modules, Module{
			ID:          seed.id,
			Slug:        seed.slug,
			Name:        seed.name,
			Description: seed.description,
			SortOrder:   moduleIdx + 1,
			Fields:      fields,
		})
	}

	return modules
}

func slugify(raw string) string {
	replacer := strings.NewReplacer(
		"á", "a",
		"é", "e",
		"í", "i",
		"ó", "o",
		"ú", "u",
		"ñ", "n",
	)

	normalized := strings.ToLower(strings.TrimSpace(raw))
	normalized = replacer.Replace(normalized)
	normalized = nonAlphaNum.ReplaceAllString(normalized, "-")
	normalized = strings.Trim(normalized, "-")
	if normalized == "" {
		return "field"
	}
	return normalized
}
