package crm

import (
	"strings"
	"time"
)

func normalizeFollowupStatus(raw string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "", "pendiente", "pending":
		return "Pendiente", nil
	case "completado", "completed", "done":
		return "Completado", nil
	default:
		return "", errFollowupStatusInvalid
	}
}

func validateFollowupPayload(tipo, fecha, hora, recordatorio, observacion, contactoNombre string) error {
	if len(tipo) > 140 {
		return newValidationError("el tipo de seguimiento no puede superar 140 caracteres")
	}
	if _, err := time.Parse("2006-01-02", fecha); err != nil {
		return newValidationError("la fecha del seguimiento debe tener formato YYYY-MM-DD")
	}
	if _, err := time.Parse("15:04", hora); err != nil {
		return newValidationError("la hora del seguimiento debe tener formato HH:MM")
	}
	if len(recordatorio) > 60 {
		return newValidationError("el recordatorio no puede superar 60 caracteres")
	}
	if len(observacion) > 5000 {
		return newValidationError("la observacion del seguimiento no puede superar 5000 caracteres")
	}
	if len(contactoNombre) > 180 {
		return newValidationError("el nombre del contacto responsable no puede superar 180 caracteres")
	}
	return nil
}
