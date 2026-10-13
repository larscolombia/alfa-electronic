package crm

import (
	"context"
	"errors"
)

const maxBulkClients = 500

var (
	errBulkClientsLimitExceeded = errors.New("no se pueden importar mas de 500 clientes por solicitud")
	errBulkClientsEmpty         = errors.New("debe enviar al menos un cliente")
)

// BulkCreateRowError describes why a single row (1-based, as in the source
// Excel) failed during a bulk import.
type BulkCreateRowError struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

// BulkCreateResult summarizes a bulk import: how many clients were created
// and the per-row errors for the ones that failed (partial success allowed).
type BulkCreateResult struct {
	Created int                  `json:"created"`
	Errors  []BulkCreateRowError `json:"errors"`
}

// BulkCreateClients imports up to maxBulkClients clients. Each row is
// validated and inserted in its own transaction so a failing row does not
// roll back the ones already created. Branches are ignored on bulk import.
func (s *Service) BulkCreateClients(ctx context.Context, companyID string, rows []UpsertClientRequest) (BulkCreateResult, error) {
	if len(rows) == 0 {
		return BulkCreateResult{}, errBulkClientsEmpty
	}
	if len(rows) > maxBulkClients {
		return BulkCreateResult{}, errBulkClientsLimitExceeded
	}

	result := BulkCreateResult{Errors: make([]BulkCreateRowError, 0)}
	for i, row := range rows {
		rowNumber := i + 1

		payload, err := s.normalizeBulkClientRow(row)
		if err != nil {
			result.Errors = append(result.Errors, BulkCreateRowError{Row: rowNumber, Message: err.Error()})
			continue
		}

		if err := s.insertBulkClientRow(ctx, companyID, payload); err != nil {
			result.Errors = append(result.Errors, BulkCreateRowError{Row: rowNumber, Message: err.Error()})
			continue
		}

		result.Created++
	}

	return result, nil
}

// normalizeBulkClientRow validates a single import row, dropping any
// branches since bulk import only creates the client record.
func (s *Service) normalizeBulkClientRow(row UpsertClientRequest) (normalizedClientInput, error) {
	row.Branches = nil
	return s.normalizeClientPayload(row)
}

func (s *Service) insertBulkClientRow(ctx context.Context, companyID string, payload normalizedClientInput) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if _, err := insertClient(ctx, tx, companyID, payload); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}
