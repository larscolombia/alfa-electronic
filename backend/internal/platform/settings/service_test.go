package settings

import (
	"errors"
	"strings"
	"testing"
)

// NewService(nil): la BD solo se toca DESPUES de que toda la validacion pase.
// Si una regla deja escapar un payload invalido, el test explota con panico en
// *sql.DB — exactamente lo que queremos detectar sin levantar PostgreSQL.
func validationService() *Service {
	return NewService(nil)
}

func TestGetRejectsEmptyCompanyID(t *testing.T) {
	if _, err := validationService().Get("  "); err == nil {
		t.Fatal("esperaba error con company_id vacio, no lo hubo")
	}
}

func TestUpdateValidationRules(t *testing.T) {
	valid := DefaultsALFA() // nombre + tagline validos; el resto opcional
	cases := []struct {
		name    string
		mutate  func(p *Profile)
		wantErr error
	}{
		{"nombre vacio", func(p *Profile) { p.Name = "   " }, errNameRequired},
		{"nombre demasiado largo", func(p *Profile) { p.Name = strings.Repeat("a", 151) }, errNameTooLong},
		{"tagline demasiado larga", func(p *Profile) { p.Tagline = strings.Repeat("ñ", 301) }, errTaglineTooLong}, // runas, no bytes
		{"NIT demasiado largo", func(p *Profile) { p.NIT = strings.Repeat("9", 21) }, errNITTooLong},
		{"email invalido", func(p *Profile) { p.Email = "no-es-un-correo" }, errEmailInvalid},
		{"website sin protocolo", func(p *Profile) { p.Website = "www.ejemplo.com" }, errURLInvalid},
		{"red social sin URL completa", func(p *Profile) { p.YouTube = "youtube.com/@x" }, errSocialURL},
		{"logo que no es imagen data-URL", func(p *Profile) { p.LogoDataURL = "/assets/logo.png" }, errLogoInvalid},
		{"logo demasiado grande", func(p *Profile) { p.LogoDataURL = "data:image/png;base64," + strings.Repeat("A", maxLogoBytes+1) }, errLogoTooLarge},
		{"titulo de pestaña demasiado largo", func(p *Profile) { p.PageTitle = strings.Repeat("t", 81) }, errPageTitleLong},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			p := valid
			tc.mutate(&p)
			err := validationService().Update("demo-company", p)
			if err == nil {
				t.Fatalf("esperaba %v, el payload invalido paso de largo (y toco la BD)", tc.wantErr)
			}
			var ve *ValidationError
			if !errors.As(err, &ve) || !errors.Is(err, tc.wantErr) {
				t.Fatalf("error = %v; esperado %v envuelto en ValidationError", err, tc.wantErr)
			}
		})
	}
}


