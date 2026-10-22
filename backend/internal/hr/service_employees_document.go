package hr

import (
	"context"
	"strings"
)

// documentNumberAvailable verifica que el número de documento no choque con el
// id ni con el document_number de OTRO empleado de la empresa (sin distinguir
// mayúsculas). excludeID es el empleado que se está creando o editando, para
// que pueda conservar su propio documento al actualizarse.
//
// Sin esta guarda, un default del frontend queda guardado como documento de un
// empleado distinto: pasó en producción cuando el formulario de "Agregar
// empleado" abrió pre-cargado con una ficha demo y guardó su "EMP-001" como
// document_number de un empleado nuevo.
func (s *Service) documentNumberAvailable(ctx context.Context, companyID, documentNumber, excludeID string) (bool, error) {
	normalized := strings.TrimSpace(documentNumber)
	if normalized == "" {
		return true, nil
	}

	var conflicts int
	err := s.db.QueryRowContext(ctx, `
SELECT COUNT(*)
FROM hr_employees
WHERE company_id = $1
  AND id <> $3
  AND (
    LOWER(id) = LOWER($2)
    OR (COALESCE(document_number, '') <> '' AND LOWER(document_number) = LOWER($2))
  );
`, companyID, normalized, strings.TrimSpace(excludeID)).Scan(&conflicts)
	if err != nil {
		return false, err
	}
	return conflicts == 0, nil
}
