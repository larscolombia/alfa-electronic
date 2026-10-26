package projects

import (
	"encoding/json"
	"strings"
)

// applyEquipmentAssignee propaga el técnico responsable del ítem de recepción
// (crm_equipment_records.items_json[].assignedTo) al proyecto de reparación que
// nace de él.
//
// Por qué: el wizard de recepción permite asignar "Técnico responsable" por
// ítem, pero el proyecto se generaba con el responsable por defecto de la
// ficha (assignee quemado en el cliente), así el tablero nacía desasignado o
// con la persona equivocada aunque el ítem sí guardara el técnico elegido.
//
// Regla deliberada: SÓLO aplica en la CREACIÓN del proyecto y SÓLO cuando el
// ítem tiene técnico asignado. Una reasignación manual posterior en la ficha
// del tablero es una actualización sobre un proyecto existente y no se toca:
// el ítem de recepción no es fuente de verdad después de la recepción.
//
// Es best-effort: cualquier fallo de lectura deja el assignee que vino en la
// petición, porque bloquear el guardado del proyecto por una regla derivada
// sería peor que un assignee vacío.
func (s *Service) applyEquipmentAssignee(companyID string, properties map[string]any) {
	if properties == nil {
		return
	}
	recordID := strings.TrimSpace(asString(properties["equipmentRecordId"]))
	if recordID == "" {
		return
	}

	var rawItems []byte
	err := s.db.QueryRow(
		`SELECT items_json FROM crm_equipment_records WHERE company_id = $1 AND id = $2`,
		strings.TrimSpace(companyID), recordID,
	).Scan(&rawItems)
	if err != nil {
		return
	}

	var items []map[string]any
	if json.Unmarshal(rawItems, &items) != nil {
		return
	}

	itemID := strings.TrimSpace(asString(properties["equipmentItemId"]))
	serie := strings.TrimSpace(asString(properties["equipmentSerie"]))
	for _, item := range items {
		if itemID != "" {
			if strings.TrimSpace(asString(item["id"])) != itemID {
				continue
			}
		} else if serie != "" {
			if strings.TrimSpace(asString(item["serie"])) != serie {
				continue
			}
		}
		if name := strings.TrimSpace(asString(item["assignedTo"])); name != "" {
			properties["assignee"] = name
		}
		return
	}
}
