package equipment

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// Serie de códigos internos de equipo: CO + año(2) + mes(2) + secuencial(4+).
// Ejemplos: CO26100001 (1º de octubre/2026), CO26110001 (1º de noviembre/2026,
// el contador reinicia en cada mes). El contador es por empresa y periodo
// (año-mes) y se incrementa atómicamente para que recepciones simultáneas no
// repitan ni salten códigos.

const equipmentCodeMaxBatch = 500

func currentEquipmentPeriod() string {
	return time.Now().Local().Format("200601") // p.ej. "202611"
}

// formatEquipmentCode arma CO + YY + MM + secuencial con relleno mínimo de 4
// dígitos. Si un mes supera los 9999 equipos la serie simplemente crece a más
// dígitos (CO261010000), sin romper el prefijo legible.
func formatEquipmentCode(period string, sequence int) string {
	if len(period) != 6 || sequence < 1 {
		return ""
	}
	yy := period[2:4]
	mm := period[4:6]
	seq := strconv.Itoa(sequence)
	if len(seq) < 4 {
		seq = strings.Repeat("0", 4-len(seq)) + seq
	}
	return "CO" + yy + mm + seq
}

// NextEquipmentCodes emite 'count' códigos consecutivos del periodo actual, en
// orden ascendente. La reserva es una sola sentencia atómica (upsert-increment
// con RETURNING), así dos peticiones concurrentes nunca se cruzan: la segunda
// suma sobre el valor que dejó la primera.
func (s *Service) NextEquipmentCodes(companyID string, count int) ([]string, error) {
	trimmedCompany := strings.TrimSpace(companyID)
	if trimmedCompany == "" {
		return nil, errors.New("falta el identificador de empresa para asignar códigos")
	}
	if count < 1 {
		count = 1
	}
	if count > equipmentCodeMaxBatch {
		return nil, fmt.Errorf("máximo %d códigos por solicitud", equipmentCodeMaxBatch)
	}

	ctx := context.Background()
	var lastValue int
	err := s.db.QueryRowContext(ctx, `
INSERT INTO equipment_code_sequences (company_id, period, last_value)
VALUES ($1, $2, $3)
ON CONFLICT (company_id, period) DO UPDATE
	SET last_value = equipment_code_sequences.last_value + EXCLUDED.last_value
RETURNING last_value;`, trimmedCompany, currentEquipmentPeriod(), count).Scan(&lastValue)
	if err != nil {
		return nil, fmt.Errorf("no se pudo asignar el código del equipo: %w", err)
	}

	codes := make([]string, 0, count)
	for sequence := lastValue - count + 1; sequence <= lastValue; sequence++ {
		codes = append(codes, formatEquipmentCode(currentEquipmentPeriod(), sequence))
	}
	return codes, nil
}