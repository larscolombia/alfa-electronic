// Package settings guarda la identidad de la empresa: nombre, logo, datos de
// contacto y el titulo de la pestaña del navegador. Es UNA fila por empresa y
// alimenta tres superficies que antes llevaban texto hardcodeado:
//
//  1. La página pública de cotización (/estimate/:token), donde aparecía
//     "LARS Software Company" (el nombre del template comprado) en vez de la
//     empresa real.
//  2. El documento impreso de factura, que necesita razón social, NIT y datos
//     de contacto para ser válido.
//  3. El <title> y favicon de todo el SPA.
//
// El GET es público a propósito: la página de cotización la abre el CLIENTE sin
// sesión. No expone nada sensible (datos públicos de la empresa). El PUT exige
// rol admin, igual que los demás módulos administrativos.
package settings

import (
	"database/sql"
	"errors"
	"fmt"
	"net/mail"
	"net/url"
	"regexp"
	"strings"
)

const logoDataURLPrefix = "data:image/"

// maxLogoBytes equivale a ~1MB binario codificado en base64 (igual fórmula que
// la foto del empleado). Un logo no necesita más: si pesa 5MB es una foto,
// no un logo.
const maxLogoBytes = 1 * 1024 * 1024 * 4 / 3

var (
	errNameRequired   = errors.New("el nombre de la empresa es obligatorio")
	errNameTooLong    = errors.New("el nombre de la empresa no puede superar 150 caracteres")
	errTaglineTooLong = errors.New("la descripcion de la empresa no puede superar 300 caracteres")
	errNITTooLong     = errors.New("el NIT no puede superar 20 caracteres")
	errEmailInvalid   = errors.New("el correo electronico no tiene formato valido")
	errURLInvalid     = errors.New("el sitio web debe ser una URL completa (https://...)")
	errSocialURL      = errors.New("cada red social debe quedar vacia o ser una URL completa (https://...)")
	errLogoInvalid    = errors.New("el logo debe ser una imagen (data:image/...); usa el selector de archivo para cargarlo")
	errLogoTooLarge   = errors.New("el logo supera el tamano permitido (~1MB)")
	errPageTitleLong  = errors.New("el titulo de la pestaña no puede superar 80 caracteres")
	errContactTooLong = errors.New("los datos de contacto no pueden superar 200 caracteres cada uno")
)

// ValidationError marca que el payload no cumple las reglas de negocio. El
// handler la traduce a 422: el fallo es del cliente, no del servidor.
type ValidationError struct{ Err error }

func (e *ValidationError) Error() string { return e.Err.Error() }
func (e *ValidationError) Unwrap() error { return e.Err }

// Profile es el contrato JSON del endpoint. Nombres en camelCase, como el
// resto de la API (seriesPrefix, sequenceNumber...).
type Profile struct {
	Name        string `json:"name"`
	NIT         string `json:"nit"`
	Tagline     string `json:"tagline"`
	LogoDataURL string `json:"logoDataUrl"`
	Address     string `json:"address"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	Website     string `json:"website"`
	YouTube     string `json:"youtube"`
	Instagram   string `json:"instagram"`
	Facebook    string `json:"facebook"`
	Twitter     string `json:"twitter"`
	PageTitle   string `json:"pageTitle"`
}

// DefaultsALFA es la siembra perezosa de la primera empresa. Datos tomados del
// canal oficial (YouTube @ALFAElectronicColombia) porque el dominio propio no
// está activo; cuando el cliente cargue sus datos desde /app/company-profile,
// estos se reemplazan.
func DefaultsALFA() Profile {
	return Profile{
		Name:      "ALFA Electronic Colombia SAS",
		Tagline:   "Compañía de origen francés especializada en la reparación de equipos electrónicos industriales (variadores, arrancadores, PLC, fuentes de alimentación, pantallas industriales y tarjetas electrónicas), con laboratorio de reparación en Bogotá - Colombia.",
		Website:   "https://www.electronic-colombia.com",
		YouTube:   "https://www.youtube.com/@ALFAElectronicColombia",
		PageTitle: "ALFA Electronic",
	}
}

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// Get devuelve la fila de la empresa, sembrando los valores por defecto si no
// existe todavía. INSERT ... ON CONFLICT DO NOTHING + SELECT es atómico y
// idempotente: dos arranques simultáneos no compiten.
func (s *Service) Get(companyID string) (Profile, error) {
	companyID = strings.TrimSpace(companyID)
	if companyID == "" {
		return Profile{}, errors.New("empresa no especificada")
	}

	defaults := DefaultsALFA()
	if _, err := s.db.Exec(`
		INSERT INTO company_settings (
			company_id, name, nit, tagline, logo_data_url,
			address, phone, email, website,
			youtube, instagram, facebook, twitter, page_title
		) VALUES ($1,$2,'',$3,'','','','','','',$4,'','','')
		ON CONFLICT (company_id) DO NOTHING`, companyID, defaults.Name, defaults.Tagline, defaults.YouTube); err != nil {
		return Profile{}, fmt.Errorf("sembrar company_settings: %w", err)
	}

	var p Profile
	err := s.db.QueryRow(`
		SELECT name, COALESCE(nit,''), COALESCE(tagline,''), COALESCE(logo_data_url,''),
		       COALESCE(address,''), COALESCE(phone,''), COALESCE(email,''), COALESCE(website,''),
		       COALESCE(youtube,''), COALESCE(instagram,''), COALESCE(facebook,''), COALESCE(twitter,''),
		       COALESCE(page_title,'')
		FROM company_settings WHERE company_id = $1`, companyID).Scan(
		&p.Name, &p.NIT, &p.Tagline, &p.LogoDataURL,
		&p.Address, &p.Phone, &p.Email, &p.Website,
		&p.YouTube, &p.Instagram, &p.Facebook, &p.Twitter, &p.PageTitle,
	)
	if err != nil {
		return Profile{}, fmt.Errorf("leer company_settings: %w", err)
	}

	return p, nil
}

// Update valida TODO el perfil antes de tocar la BD (nada a medias: o entra
// completo o no entra nada) y lo escribe en un solo upsert atómico.
func (s *Service) Update(companyID string, p Profile) error {
	companyID = strings.TrimSpace(companyID)
	if companyID == "" {
		return errors.New("empresa no especificada")
	}

	p.Name = strings.TrimSpace(p.Name)
	p.NIT = strings.TrimSpace(p.NIT)
	p.Tagline = strings.TrimSpace(p.Tagline)
	p.LogoDataURL = strings.TrimSpace(p.LogoDataURL)
	p.Address = strings.TrimSpace(p.Address)
	p.Phone = strings.TrimSpace(p.Phone)
	p.Email = strings.ToLower(strings.TrimSpace(p.Email))
	p.Website = strings.TrimSpace(p.Website)
	p.YouTube = strings.TrimSpace(p.YouTube)
	p.Instagram = strings.TrimSpace(p.Instagram)
	p.Facebook = strings.TrimSpace(p.Facebook)
	p.Twitter = strings.TrimSpace(p.Twitter)
	p.PageTitle = strings.TrimSpace(p.PageTitle)

	if p.Name == "" {
		return &ValidationError{Err: errNameRequired}
	}
	if utf8Len(p.Name) > 150 {
		return &ValidationError{Err: errNameTooLong}
	}
	if utf8Len(p.Tagline) > 300 {
		return &ValidationError{Err: errTaglineTooLong}
	}
	if utf8Len(p.NIT) > 20 {
		return &ValidationError{Err: errNITTooLong}
	}
	for _, value := range []struct{ field, v string }{
		{"address", p.Address}, {"phone", p.Phone}, {"website", p.Website},
	} {
		if utf8Len(value.v) > 200 {
			return &ValidationError{Err: fmt.Errorf("%s: %w", value.field, errContactTooLong)}
		}
	}
	if p.Email != "" {
		if _, err := mail.ParseAddress(p.Email); err != nil {
			return &ValidationError{Err: errEmailInvalid}
		}
	}
	if p.Website != "" && !isHTTPURL(p.Website) {
		return &ValidationError{Err: errURLInvalid}
	}
	for _, social := range []string{p.YouTube, p.Instagram, p.Facebook, p.Twitter} {
		if social == "" {
			continue
		}
		if !isHTTPURL(social) {
			return &ValidationError{Err: errSocialURL}
		}
	}
	if p.LogoDataURL != "" {
		if !strings.HasPrefix(p.LogoDataURL, logoDataURLPrefix) {
			return &ValidationError{Err: errLogoInvalid}
		}
		if len(p.LogoDataURL) > maxLogoBytes {
			return &ValidationError{Err: errLogoTooLarge}
		}
	}
	if p.PageTitle == "" {
		p.PageTitle = DefaultsALFA().PageTitle // nunca dejar el tab del navegador sin nombre
	}
	if utf8Len(p.PageTitle) > 80 {
		return &ValidationError{Err: errPageTitleLong}
	}

	if _, err := s.db.Exec(`
		INSERT INTO company_settings (
			company_id, name, nit, tagline, logo_data_url,
			address, phone, email, website,
			youtube, instagram, facebook, twitter, page_title
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		ON CONFLICT (company_id) DO UPDATE SET
			name = EXCLUDED.name,
			nit = EXCLUDED.nit,
			tagline = EXCLUDED.tagline,
			logo_data_url = EXCLUDED.logo_data_url,
			address = EXCLUDED.address,
			phone = EXCLUDED.phone,
			email = EXCLUDED.email,
			website = EXCLUDED.website,
			youtube = EXCLUDED.youtube,
			instagram = EXCLUDED.instagram,
			facebook = EXCLUDED.facebook,
			twitter = EXCLUDED.twitter,
			page_title = EXCLUDED.page_title,
			updated_at = NOW()`,
		companyID, p.Name, p.NIT, p.Tagline, p.LogoDataURL,
		p.Address, p.Phone, p.Email, p.Website,
		p.YouTube, p.Instagram, p.Facebook, p.Twitter, p.PageTitle,
	); err != nil {
		return fmt.Errorf("escribir company_settings: %w", err)
	}

	return nil
}

var httpURLPattern = regexp.MustCompile(`^https?://[^\s]+$`)

func isHTTPURL(v string) bool {
	if !httpURLPattern.MatchString(v) {
		return false
	}
	parsed, err := url.Parse(v)
	return err == nil && parsed.Host != ""
}

// utf8Len cuenta runas, no bytes: "ñ" es 1 carácter para el usuario aunque
// pese 2 en UTF-8.
func utf8Len(s string) int {
	count := 0
	for range s {
		count++
	}
	return count
}
