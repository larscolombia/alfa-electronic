package crm

import (
	"fmt"
	"math"
	"strings"
	"time"
)

func (s *Service) normalizeClientPayload(req UpsertClientRequest) (normalizedClientInput, error) {
	nombre := strings.TrimSpace(req.Nombre)
	if nombre == "" {
		return normalizedClientInput{}, errClientNameRequired
	}
	if len(nombre) > 180 {
		return normalizedClientInput{}, newValidationError("el nombre del cliente no puede superar 180 caracteres")
	}

	correo := strings.TrimSpace(req.Correo)
	if correo != "" {
		if len(correo) > 180 {
			return normalizedClientInput{}, newValidationError("el correo no puede superar 180 caracteres")
		}
		if !reEmail.MatchString(correo) {
			return normalizedClientInput{}, newValidationError("el formato del correo no es valido")
		}
	}

	empresa := strings.TrimSpace(req.Empresa)
	if empresa == "" {
		return normalizedClientInput{}, errClientCompanyRequired
	}
	if len(empresa) > 180 {
		return normalizedClientInput{}, newValidationError("la empresa no puede superar 180 caracteres")
	}

	nit := strings.TrimSpace(req.Nit)
	if len(nit) > 80 {
		return normalizedClientInput{}, newValidationError("el NIT no puede superar 80 caracteres")
	}

	website := strings.TrimSpace(req.Website)
	if website != "" {
		if len(website) > 255 {
			return normalizedClientInput{}, newValidationError("el sitio web no puede superar 255 caracteres")
		}
		if !strings.HasPrefix(website, "http://") && !strings.HasPrefix(website, "https://") {
			return normalizedClientInput{}, newValidationError("el sitio web debe iniciar con http:// o https://")
		}
	}

	officePhone := strings.TrimSpace(req.OfficePhone)
	if officePhone != "" {
		if len(officePhone) > 40 {
			return normalizedClientInput{}, newValidationError("el telefono de oficina no puede superar 40 caracteres")
		}
		if !rePhone.MatchString(officePhone) {
			return normalizedClientInput{}, newValidationError("el telefono de oficina contiene caracteres no validos")
		}
	}

	country := strings.TrimSpace(req.Country)
	if len(country) > 120 {
		return normalizedClientInput{}, newValidationError("el pais no puede superar 120 caracteres")
	}

	city := strings.TrimSpace(req.City)
	if len(city) > 120 {
		return normalizedClientInput{}, newValidationError("la ciudad no puede superar 120 caracteres")
	}

	address := strings.TrimSpace(req.Address)
	if len(address) > 500 {
		return normalizedClientInput{}, newValidationError("la direccion no puede superar 500 caracteres")
	}

	zona := strings.TrimSpace(req.Zona)
	if zona == "" {
		return normalizedClientInput{}, errClientZoneRequired
	}
	if len(zona) > 120 {
		return normalizedClientInput{}, newValidationError("la zona no puede superar 120 caracteres")
	}

	estado, err := normalizeClientStatus(req.Estado)
	if err != nil {
		return normalizedClientInput{}, err
	}

	creditLimit := normalizeMoney(req.Credito.CreditLimit)
	creditConsumed := normalizeMoney(req.Credito.Consumed)
	if creditConsumed > creditLimit {
		return normalizedClientInput{}, errClientCreditUsageInvalid
	}

	if req.Credito.Enabled && creditLimit <= 0 {
		return normalizedClientInput{}, errClientCreditLimitInvalid
	}

	paymentTermDays := req.Credito.PaymentTermDays
	if paymentTermDays < 0 {
		paymentTermDays = 0
	}
	if paymentTermDays > 3650 {
		return normalizedClientInput{}, newValidationError("el plazo de pago no puede superar 3650 dias")
	}

	lastPaymentDate := strings.TrimSpace(req.Credito.LastPaymentDate)
	if lastPaymentDate != "" {
		if _, err := time.Parse("2006-01-02", lastPaymentDate); err != nil {
			return normalizedClientInput{}, newValidationError("la fecha de ultimo pago debe tener formato YYYY-MM-DD")
		}
	}

	branches, err := normalizeBranchesInput(req.Branches)
	if err != nil {
		return normalizedClientInput{}, err
	}

	return normalizedClientInput{
		Nombre:          nombre,
		Correo:          correo,
		Empresa:         empresa,
		Nit:             nit,
		Zona:            zona,
		Estado:          estado,
		Website:         website,
		OfficePhone:     officePhone,
		Country:         country,
		City:            city,
		Address:         address,
		CreditEnabled:   req.Credito.Enabled,
		CreditLimit:     creditLimit,
		CreditConsumed:  creditConsumed,
		LastPaymentDate: lastPaymentDate,
		PaymentTermDays: paymentTermDays,
		Branches:        branches,
	}, nil
}

func normalizeClientStatus(raw string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "", "activo", "active":
		return ClientStatusActive, nil
	case "inactivo", "inactive":
		return ClientStatusInactive, nil
	default:
		return "", errClientStatusInvalid
	}
}

func buildClientsListStatement(filters []string, limitArg int) string {
	statement := fmt.Sprintf(`
SELECT id, nombre, correo, empresa, nit, zona, estado, website, office_phone, country, city, address,
	credit_enabled, credit_limit, credit_consumed, last_payment_date, payment_term_days, created_at
FROM crm_clients
WHERE %s
ORDER BY created_at DESC`, strings.Join(filters, " AND "))

	if limitArg > 0 {
		statement = fmt.Sprintf("%s\nLIMIT $%d", statement, limitArg)
	}

	return statement + ";"
}

func normalizeMoney(value float64) float64 {
	if !isFinite(value) || value < 0 {
		return 0
	}
	return math.Round(value*100) / 100
}

func isFinite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}
