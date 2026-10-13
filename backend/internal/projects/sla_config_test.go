package projects

import (
	"errors"
	"reflect"
	"testing"
)

// Nota: slaConfigStore es un mapa global de paquete (store en memoria), asi que
// cada caso usa IDs de empresa unicos para evitar contaminacion entre tests.

func TestSlaConfigReturnsDefaultWhenUnset(t *testing.T) {
	s := NewService(nil)

	got := s.GetSLAConfig("sla-company-never-configured")
	if !reflect.DeepEqual(got, defaultSLAConfig) {
		t.Fatalf("GetSLAConfig = %+v, esperaba la config por defecto %+v", got, defaultSLAConfig)
	}
}

func TestSlaConfigUpdatePersistsAndGetReflects(t *testing.T) {
	cases := []struct {
		name      string
		companyID string
		configs   []SLAConfig
		want      []SLAConfig
	}{
		{
			name:      "config personalizada por etapa",
			companyID: "sla-company-update-basic",
			configs: []SLAConfig{
				{Stage: "diagnostico", GreenDays: 5, YellowDays: 3},
				{Stage: "reparacion", GreenDays: 7, YellowDays: 2},
			},
			want: []SLAConfig{
				{Stage: "diagnostico", GreenDays: 5, YellowDays: 3},
				{Stage: "reparacion", GreenDays: 7, YellowDays: 2},
			},
		},
		{
			name:      "dias en cero son validos",
			companyID: "sla-company-update-zero",
			configs: []SLAConfig{
				{Stage: "pruebas", GreenDays: 0, YellowDays: 0},
			},
			want: []SLAConfig{
				{Stage: "pruebas", GreenDays: 0, YellowDays: 0},
			},
		},
		{
			name:      "stage con espacios se normaliza",
			companyID: "sla-company-update-trim",
			configs: []SLAConfig{
				{Stage: "  pruebas  ", GreenDays: 1, YellowDays: 1},
			},
			want: []SLAConfig{
				{Stage: "pruebas", GreenDays: 1, YellowDays: 1},
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := NewService(nil)

			if err := s.UpdateSLAConfig(tc.companyID, tc.configs); err != nil {
				t.Fatalf("UpdateSLAConfig error inesperado: %v", err)
			}

			got := s.GetSLAConfig(tc.companyID)
			if !reflect.DeepEqual(got, tc.want) {
				t.Fatalf("GetSLAConfig = %+v, esperaba %+v", got, tc.want)
			}
		})
	}
}

func TestSlaConfigIsolationPerCompany(t *testing.T) {
	s := NewService(nil)

	custom := []SLAConfig{{Stage: "diagnostico", GreenDays: 9, YellowDays: 4}}
	if err := s.UpdateSLAConfig("sla-company-isolated-a", custom); err != nil {
		t.Fatalf("UpdateSLAConfig error inesperado: %v", err)
	}

	gotA := s.GetSLAConfig("sla-company-isolated-a")
	if !reflect.DeepEqual(gotA, custom) {
		t.Fatalf("company-a GetSLAConfig = %+v, esperaba %+v", gotA, custom)
	}

	gotB := s.GetSLAConfig("sla-company-isolated-b")
	if !reflect.DeepEqual(gotB, defaultSLAConfig) {
		t.Fatalf("company-b debe seguir con la config por defecto, obtuvo %+v", gotB)
	}
}

func TestSlaConfigRejectsInvalidPayloads(t *testing.T) {
	cases := []struct {
		name      string
		companyID string
		configs   []SLAConfig
	}{
		{
			name:      "greenDays negativo",
			companyID: "sla-company-invalid-green",
			configs:   []SLAConfig{{Stage: "diagnostico", GreenDays: -1, YellowDays: 1}},
		},
		{
			name:      "yellowDays negativo",
			companyID: "sla-company-invalid-yellow",
			configs:   []SLAConfig{{Stage: "reparacion", GreenDays: 1, YellowDays: -2}},
		},
		{
			name:      "stage vacio",
			companyID: "sla-company-invalid-empty-stage",
			configs:   []SLAConfig{{Stage: "", GreenDays: 1, YellowDays: 1}},
		},
		{
			name:      "stage solo espacios",
			companyID: "sla-company-invalid-blank-stage",
			configs:   []SLAConfig{{Stage: "   ", GreenDays: 1, YellowDays: 1}},
		},
		{
			name:      "un item invalido rechaza todo el lote",
			companyID: "sla-company-invalid-batch",
			configs: []SLAConfig{
				{Stage: "diagnostico", GreenDays: 2, YellowDays: 2},
				{Stage: "pruebas", GreenDays: 1, YellowDays: -1},
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := NewService(nil)

			err := s.UpdateSLAConfig(tc.companyID, tc.configs)
			if !errors.Is(err, errSLAConfigInvalid) {
				t.Fatalf("UpdateSLAConfig error = %v, esperaba errSLAConfigInvalid", err)
			}

			// El store no debe quedar mutado cuando la validacion falla.
			got := s.GetSLAConfig(tc.companyID)
			if !reflect.DeepEqual(got, defaultSLAConfig) {
				t.Fatalf("store mutado tras error: GetSLAConfig = %+v", got)
			}
		})
	}
}
