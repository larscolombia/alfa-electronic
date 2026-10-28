package crm

import (
	"fmt"
	"strings"
	"time"
)

func (s *Service) normalizeProspectPayload(req UpsertProspectRequest) (normalizedProspectInput, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return normalizedProspectInput{}, errProspectNameRequired
	}
	if len(name) > 180 {
		return normalizedProspectInput{}, newValidationError("el nombre del prospecto no puede superar 180 caracteres")
	}

	email := strings.TrimSpace(req.Email)
	if email != "" {
		if len(email) > 180 {
			return normalizedProspectInput{}, newValidationError("el correo no puede superar 180 caracteres")
		}
		if !reEmail.MatchString(email) {
			return normalizedProspectInput{}, newValidationError("el formato del correo no es valido")
		}
	}

	mobile := strings.TrimSpace(req.Mobile)
	if mobile != "" {
		if len(mobile) > 40 {
			return normalizedProspectInput{}, newValidationError("el movil no puede superar 40 caracteres")
		}
		if !rePhone.MatchString(mobile) {
			return normalizedProspectInput{}, newValidationError("el movil contiene caracteres no validos")
		}
	}

	officePhone := strings.TrimSpace(req.OfficePhone)
	if officePhone != "" {
		if len(officePhone) > 40 {
			return normalizedProspectInput{}, newValidationError("el telefono de oficina no puede superar 40 caracteres")
		}
		if !rePhone.MatchString(officePhone) {
			return normalizedProspectInput{}, newValidationError("el telefono de oficina contiene caracteres no validos")
		}
	}

	website := strings.TrimSpace(req.Website)
	if website != "" {
		if len(website) > 255 {
			return normalizedProspectInput{}, newValidationError("el sitio web no puede superar 255 caracteres")
		}
		if !strings.HasPrefix(website, "http://") && !strings.HasPrefix(website, "https://") {
			return normalizedProspectInput{}, newValidationError("el sitio web debe iniciar con http:// o https://")
		}
	}

	company := strings.TrimSpace(req.Company)
	if len(company) > 180 {
		return normalizedProspectInput{}, newValidationError("el nombre de la compania no puede superar 180 caracteres")
	}

	nit := strings.TrimSpace(req.Nit)
	if len(nit) > 80 {
		return normalizedProspectInput{}, newValidationError("el NIT no puede superar 80 caracteres")
	}

	note := strings.TrimSpace(req.Note)
	if len(note) > 5000 {
		return normalizedProspectInput{}, newValidationError("la nota no puede superar 5000 caracteres")
	}

	address := strings.TrimSpace(req.Address)
	if len(address) > 500 {
		return normalizedProspectInput{}, newValidationError("la direccion no puede superar 500 caracteres")
	}

	country := strings.TrimSpace(req.Country)
	if len(country) > 120 {
		return normalizedProspectInput{}, newValidationError("el pais no puede superar 120 caracteres")
	}

	city := strings.TrimSpace(req.City)
	if len(city) > 120 {
		return normalizedProspectInput{}, newValidationError("la ciudad no puede superar 120 caracteres")
	}

	if req.ProspectValue < 0 {
		return normalizedProspectInput{}, errProspectValueInvalid
	}
	if req.ProspectValue > 9_999_999_999_999 {
		return normalizedProspectInput{}, newValidationError("el valor del prospecto no puede superar 9,999,999,999,999")
	}

	status, err := normalizeProspectStatus(req.Status)
	if err != nil {
		return normalizedProspectInput{}, err
	}

	quotations := 0
	if req.Quotations != nil {
		if *req.Quotations < 0 {
			return normalizedProspectInput{}, errProspectQuotationsInvalid
		}
		quotations = *req.Quotations
	}

	allowFollowUp := boolValueOrDefault(req.AllowFollowUp, true)
	assignedEmployee := normalizeCatalogSelection(req.AssignedEmployee, CatalogTypeEmployees)
	source := normalizeCatalogSelection(req.Source, CatalogTypeSources)
	category := normalizeCatalogSelection(req.Category, CatalogTypeCategories)
	zone := normalizeCatalogSelection(req.Zone, CatalogTypeZones)
	service := normalizeCatalogSelection(req.Service, CatalogTypeServices)
	salutation := trimOrDefault(req.Salutation, "--")
	branches, err := normalizeBranchesInput(req.Branches)
	if err != nil {
		return normalizedProspectInput{}, err
	}

	return normalizedProspectInput{
		Salutation:       salutation,
		Name:             name,
		Email:            email,
		Mobile:           mobile,
		Company:          company,
		Nit:              nit,
		AssignedEmployee: assignedEmployee,
		Source:           source,
		Category:         category,
		Zone:             zone,
		ProspectValue:    req.ProspectValue,
		AllowFollowUp:    allowFollowUp,
		Status:           status,
		Service:          service,
		Note:             note,
		Website:          website,
		OfficePhone:      officePhone,
		Country:          country,
		City:             city,
		Address:          address,
		Branches:         branches,
		Quotations:       quotations,
	}, nil
}

func normalizeProspectStatus(raw string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "", "pending", "pendiente":
		return ProspectStatusPending, nil
	case "en proceso", "in process", "in-process", "process":
		return ProspectStatusInProcess, nil
	case "cerrado", "closed":
		return ProspectStatusClosed, nil
	default:
		return "", errProspectStatusInvalid
	}
}

func buildProspectsListStatement(filters []string, limitArg int) string {
	statement := fmt.Sprintf(`
SELECT %s
FROM crm_prospects
WHERE %s
ORDER BY created_at DESC`, prospectSelectColumns, strings.Join(filters, " AND "))

	if limitArg > 0 {
		statement = fmt.Sprintf("%s\nLIMIT $%d", statement, limitArg)
	}

	return statement + ";"
}

func boolValueOrDefault(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
}

func formatCRMDateTime(value time.Time) string {
	// RFC3339 con "Z": el navegador convierte a la zona horaria del usuario.
	return value.UTC().Format(time.RFC3339)
}

func scanProspect(scanner interface{ Scan(dest ...any) error }) (Prospect, error) {
	var (
		item      Prospect
		createdAt time.Time
		updatedAt time.Time
	)

	if err := scanner.Scan(
		&item.ID,
		&item.Salutation,
		&item.Name,
		&item.Email,
		&item.Mobile,
		&item.Company,
		&item.Nit,
		&item.AssignedEmployee,
		&item.Source,
		&item.Category,
		&item.Zone,
		&item.ProspectValue,
		&item.AllowFollowUp,
		&item.Status,
		&item.Service,
		&item.Note,
		&item.Website,
		&item.OfficePhone,
		&item.Country,
		&item.City,
		&item.Address,
		&item.Quotations,
		&createdAt,
		&updatedAt,
	); err != nil {
		return Prospect{}, err
	}

	item.CreatedAt = formatCRMDateTime(createdAt)
	item.UpdatedAt = formatCRMDateTime(updatedAt)
	return item, nil
}
