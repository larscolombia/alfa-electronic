package mailer

import (
	"fmt"
	"html"
	"strings"
)

// Kinds de correo transaccional. Son texto fijo porque `GET /emails` los
// muestra y porque el índice único de idempotencia se apoya en ellos.
const (
	KindQuoteSent       = "cotizacion-enviada"
	KindDispatchNotice  = "aviso-despacho"
	KindReceptionAcknow = "acuse-recepcion"
)

func esc(value string) string { return html.EscapeString(strings.TrimSpace(value)) }

func layout(title, intro string, rows []string, footer string) string {
	var body strings.Builder
	body.WriteString(`<!doctype html><html lang="es"><head><meta charset="utf-8">`)
	body.WriteString(`<meta name="viewport" content="width=device-width, initial-scale=1">`)
	body.WriteString(`<title>` + esc(title) + `</title></head>`)
	body.WriteString(`<body style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2430;">`)
	body.WriteString(`<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e5ea;border-radius:8px;overflow:hidden;">`)
	body.WriteString(`<div style="padding:20px 24px;background:#0f2740;color:#ffffff;">`)
	body.WriteString(`<div style="font-size:18px;font-weight:bold;">ALFA ELECTRONIC</div>`)
	body.WriteString(`<div style="font-size:13px;opacity:.85;margin-top:2px;">` + esc(title) + `</div></div>`)
	body.WriteString(`<div style="padding:24px;">`)
	if intro != "" {
		body.WriteString(`<p style="margin:0 0 16px;font-size:14px;line-height:1.5;">` + esc(intro) + `</p>`)
	}
	if len(rows) > 0 {
		body.WriteString(`<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">`)
		for _, row := range rows {
			body.WriteString(`<tr>` + row + `</tr>`)
		}
		body.WriteString(`</table>`)
	}
	body.WriteString(`</div>`)
	if footer != "" {
		body.WriteString(`<div style="padding:16px 24px;background:#f8f9fb;border-top:1px solid #e2e5ea;font-size:12px;color:#5b6472;">` + footer + `</div>`)
	}
	body.WriteString(`</div></body></html>`)
	return body.String()
}

func row(label, value string) string {
	return `<td style="padding:8px 12px 8px 0;border-bottom:1px solid #eef0f3;color:#5b6472;width:38%;vertical-align:top;">` +
		esc(label) + `</td><td style="padding:8px 0;border-bottom:1px solid #eef0f3;vertical-align:top;">` + value + `</td>`
}

// QuoteSentEmail arma el correo de la cotización "Guardar y enviar", con el
// link público de aprobación (`/estimate/:token`) para que el cliente firme
// sin pedir credenciales.
type QuoteSentEmail struct {
	Codigo      string
	Prospecto   string
	Empresa     string
	ValidoHasta string
	Total       float64
	Moneda      string
	ApprovalURL string
}

func (d QuoteSentEmail) Subject() string {
	code := strings.TrimSpace(d.Codigo)
	if code == "" {
		code = "su cotización"
	}
	return "Cotización " + code + " — ALFA ELECTRONIC"
}

func (d QuoteSentEmail) Body() string {
	name := strings.TrimSpace(d.Prospecto)
	if name == "" {
		name = strings.TrimSpace(d.Empresa)
	}
	intro := "Cordial saludo"
	if name != "" {
		intro = "Cordial saludo, " + name
	}
	intro += ". Adjuntamos el enlace para revisar y aprobar la cotización en línea."

	rows := []string{
		row("Cotización", esc(d.Codigo)),
		row("Cliente", esc(firstNonEmpty(d.Empresa, d.Prospecto))),
		row("Válida hasta", esc(d.ValidoHasta)),
		row("Total", esc(formatMoney(d.Total, d.Moneda))),
	}

	link := ""
	if strings.TrimSpace(d.ApprovalURL) != "" {
		url := esc(d.ApprovalURL)
		link = `<p style="margin:20px 0 0;"><a href="` + url +
			`" style="display:inline-block;padding:12px 20px;background:#0f6b3f;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">Revisar y aprobar cotización</a></p>` +
			`<p style="margin:10px 0 0;font-size:12px;color:#5b6472;">Si el botón no funciona, copie este enlace en su navegador:<br>` + url + `</p>`
	}

	return layout(d.Subject(), intro, rows, link+
		`<div style="margin-top:12px;">Si no reconoce esta cotización, responda este correo y la revisamos.</div>`)
}

// DispatchNoticeEmail es el aviso de despacho: transportadora y número de
// guía, que es lo que el cliente necesita para rastrear su equipo.
type DispatchNoticeEmail struct {
	ClientName    string
	DispatchCode  string
	EquipmentName string
	Carrier       string
	GuideNumber   string
	DeliveryNote  string
}

func (d DispatchNoticeEmail) Subject() string {
	code := strings.TrimSpace(d.DispatchCode)
	if code == "" {
		return "Su equipo fue despachado — ALFA ELECTRONIC"
	}
	return "Despacho " + code + " — ALFA ELECTRONIC"
}

func (d DispatchNoticeEmail) Body() string {
	name := strings.TrimSpace(d.ClientName)
	intro := "Le informamos que su equipo fue despachado."
	if name != "" {
		intro = "Estimado(a) " + name + ", le informamos que su equipo fue despachado."
	}

	rows := []string{
		row("Despacho", esc(d.DispatchCode)),
		row("Equipo", esc(d.EquipmentName)),
		row("Transportadora", esc(d.Carrier)),
		row("Número de guía", esc(d.GuideNumber)),
	}
	if strings.TrimSpace(d.DeliveryNote) != "" {
		rows = append(rows, row("Detalle", esc(d.DeliveryNote)))
	}

	return layout(d.Subject(), intro, rows,
		"Conserve el número de guía para hacer seguimiento con la transportadora.")
}

// ReceptionAckEmail es el acuse de recepción: confirma qué equipos ingresaron
// a ALFA, identificado por su código/serie, que es la prueba en caso de
// disputa (el motivo por el que Maribel pidió el acuse).
type ReceptionAckEmail struct {
	ClientName  string
	RecordID    string
	ReceptionOn string
	Identifiers []string
}

func (d ReceptionAckEmail) Subject() string {
	if len(d.Identifiers) == 1 {
		return "Acuse de recepción " + d.Identifiers[0] + " — ALFA ELECTRONIC"
	}
	return fmt.Sprintf("Acuse de recepción de %d equipo(s) — ALFA ELECTRONIC", len(d.Identifiers))
}

func (d ReceptionAckEmail) Body() string {
	name := strings.TrimSpace(d.ClientName)
	intro := "Confirmamos la recepción de los siguientes equipos en nuestras instalaciones."
	if name != "" {
		intro = "Estimado(a) " + name + ", confirmamos la recepción de los siguientes equipos."
	}

	identifiers := make([]string, 0, len(d.Identifiers))
	for _, item := range d.Identifiers {
		if strings.TrimSpace(item) != "" {
			identifiers = append(identifiers, `<li style="margin-bottom:4px;">`+esc(item)+`</li>`)
		}
	}

	list := ""
	if len(identifiers) > 0 {
		list = `<p style="margin:16px 0 6px;font-size:14px;font-weight:bold;">Equipos recibidos:</p>` +
			`<ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;">` + strings.Join(identifiers, "") + `</ul>`
	}

	rows := []string{row("Fecha de recepción", esc(d.ReceptionOn))}
	if strings.TrimSpace(d.RecordID) != "" {
		rows = append(rows, row("Radicado interno", esc(d.RecordID)))
	}

	return layout(d.Subject(), intro, rows, list+
		`<div style="margin-top:12px;">Este acuse es su comprobante de entrega. Responda este correo si falta algún equipo o accesorio.</div>`)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func formatMoney(amount float64, currency string) string {
	code := strings.TrimSpace(currency)
	if code == "" {
		code = "COP"
	}
	return fmt.Sprintf("%s %s", code, formatThousands(amount))
}

func formatThousands(amount float64) string {
	integer := int64(amount + 0.5)
	digits := fmt.Sprintf("%d", integer)

	var reversed []byte
	for i := len(digits) - 1; i >= 0; i-- {
		reversed = append(reversed, digits[i])
	}

	grouped := make([]string, 0)
	for start := 0; start < len(reversed); start += 3 {
		end := start + 3
		if end > len(reversed) {
			end = len(reversed)
		}
		grouped = append(grouped, string(reversed[start:end]))
	}

	var builder strings.Builder
	for index := len(grouped) - 1; index >= 0; index-- {
		if index != len(grouped)-1 {
			builder.WriteString(".")
		}
		builder.WriteString(grouped[index])
	}
	return builder.String()
}
