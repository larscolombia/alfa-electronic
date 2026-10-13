package crm

import (
	"context"
	"errors"
	"testing"
)

func validBulkRow() UpsertClientRequest {
	return UpsertClientRequest{
		Nombre:  "Cliente de Prueba",
		Empresa: "Empresa SAS",
		Zona:    "Bogota",
	}
}

func TestBulkCreateClientsRejectsEmptyRows(t *testing.T) {
	svc := NewService(nil)

	_, err := svc.BulkCreateClients(context.Background(), "company-1", nil)
	if !errors.Is(err, errBulkClientsEmpty) {
		t.Fatalf("expected errBulkClientsEmpty, got %v", err)
	}
}

func TestBulkCreateClientsRejectsMoreThanMaxRows(t *testing.T) {
	svc := NewService(nil)

	rows := make([]UpsertClientRequest, maxBulkClients+1)
	for i := range rows {
		rows[i] = validBulkRow()
	}

	_, err := svc.BulkCreateClients(context.Background(), "company-1", rows)
	if !errors.Is(err, errBulkClientsLimitExceeded) {
		t.Fatalf("expected errBulkClientsLimitExceeded, got %v", err)
	}
}

func TestBulkCreateClientsAggregatesRowErrors(t *testing.T) {
	svc := NewService(nil)

	// All rows fail validation, so the DB is never touched. Each row fails
	// for a different reason to verify 1-based row indexing and aggregation.
	rows := []UpsertClientRequest{
		{Empresa: "Empresa SAS", Zona: "Bogota"},                                     // row 1: missing nombre
		{Nombre: "Cliente", Zona: "Bogota"},                                          // row 2: missing empresa
		{Nombre: "Cliente", Empresa: "Empresa SAS", Zona: "Bogota", Estado: "Congelado"}, // row 3: invalid estado
	}

	result, err := svc.BulkCreateClients(context.Background(), "company-1", rows)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.Created != 0 {
		t.Errorf("expected 0 created, got %d", result.Created)
	}

	expected := []BulkCreateRowError{
		{Row: 1, Message: errClientNameRequired.Error()},
		{Row: 2, Message: errClientCompanyRequired.Error()},
		{Row: 3, Message: errClientStatusInvalid.Error()},
	}

	if len(result.Errors) != len(expected) {
		t.Fatalf("expected %d row errors, got %d: %+v", len(expected), len(result.Errors), result.Errors)
	}
	for i, want := range expected {
		if result.Errors[i] != want {
			t.Errorf("error %d: expected %+v, got %+v", i, want, result.Errors[i])
		}
	}
}

func TestNormalizeBulkClientRow(t *testing.T) {
	svc := NewService(nil)

	tests := []struct {
		name    string
		row     UpsertClientRequest
		wantErr error
	}{
		{
			name:    "valid minimal row",
			row:     validBulkRow(),
			wantErr: nil,
		},
		{
			name:    "missing nombre",
			row:     UpsertClientRequest{Empresa: "Empresa SAS", Zona: "Bogota"},
			wantErr: errClientNameRequired,
		},
		{
			name:    "missing empresa",
			row:     UpsertClientRequest{Nombre: "Cliente", Zona: "Bogota"},
			wantErr: errClientCompanyRequired,
		},
		{
			name:    "missing zona",
			row:     UpsertClientRequest{Nombre: "Cliente", Empresa: "Empresa SAS"},
			wantErr: errClientZoneRequired,
		},
		{
			name:    "invalid estado",
			row:     UpsertClientRequest{Nombre: "Cliente", Empresa: "Empresa SAS", Zona: "Bogota", Estado: "Congelado"},
			wantErr: errClientStatusInvalid,
		},
		{
			name:    "invalid correo",
			row:     UpsertClientRequest{Nombre: "Cliente", Empresa: "Empresa SAS", Zona: "Bogota", Correo: "no-es-correo"},
			wantErr: newValidationError(""),
		},
		{
			name: "credit consumed above limit",
			row: UpsertClientRequest{
				Nombre:  "Cliente",
				Empresa: "Empresa SAS",
				Zona:    "Bogota",
				Credito: ClientCreditProfile{Enabled: true, CreditLimit: 100, Consumed: 150},
			},
			wantErr: errClientCreditUsageInvalid,
		},
		{
			name: "credit enabled without limit",
			row: UpsertClientRequest{
				Nombre:  "Cliente",
				Empresa: "Empresa SAS",
				Zona:    "Bogota",
				Credito: ClientCreditProfile{Enabled: true},
			},
			wantErr: errClientCreditLimitInvalid,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := svc.normalizeBulkClientRow(tt.row)
			if tt.wantErr == nil {
				if err != nil {
					t.Fatalf("expected no error, got %v", err)
				}
				return
			}

			if err == nil {
				t.Fatalf("expected error %v, got nil", tt.wantErr)
			}

			var ve *validationError
			if errors.As(tt.wantErr, &ve) {
				var gotVE *validationError
				if !errors.As(err, &gotVE) {
					t.Fatalf("expected validationError, got %v", err)
				}
				return
			}

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("expected %v, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestNormalizeBulkClientRowDropsBranches(t *testing.T) {
	svc := NewService(nil)

	row := validBulkRow()
	row.Branches = []UpsertBranchRequest{{Name: "Sede Principal"}}

	payload, err := svc.normalizeBulkClientRow(row)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(payload.Branches) != 0 {
		t.Fatalf("expected branches to be dropped, got %d", len(payload.Branches))
	}
}
