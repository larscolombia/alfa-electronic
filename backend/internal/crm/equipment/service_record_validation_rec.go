package equipment

import (
	"errors"
	"strings"
)

var errIntakeTransportadoraRequired = errors.New("recepcion por transportadora exige transportadora, numero de guia y fecha y hora de recibido")

// validateIntakeTransportadora (REC-05): con intake_method 'transportadora'
// son obligatorios la transportadora, el número de guía y la fecha/hora en que
// llegó el paquete. Se valida crudo (antes de normalizar) y sobre lo ya
// persistido (finalize), así que solo verifica que los tres campos existan.
func validateIntakeTransportadora(record Record) error {
	if !strings.EqualFold(strings.TrimSpace(record.IntakeMethod), "transportadora") {
		return nil
	}

	if strings.TrimSpace(record.IntakeCarrier) == "" ||
		strings.TrimSpace(record.IntakeTrackingNumber) == "" ||
		strings.TrimSpace(record.IntakeReceivedAt) == "" {
		return errIntakeTransportadoraRequired
	}

	return nil
}
