package mailer

import (
	"log"
	"time"
)

// DefaultInterval es la cadencia del barrido del outbox.
const DefaultInterval = 30 * time.Second

// batchSize limita cuántas filas se intentan por pasada: sin esto un outbox
// acumulado convertiría cada tick en una transacción larguísima.
const batchSize = 25

// Worker barre el outbox y envía lo pendiente.
//
// Se arranca como goroutine desde main.go. En modo desactivado (SMTP_HOST
// vacío) NO se queda ocioso: marca las filas pendientes como 'desactivado'
// con last_error="SMTP no configurado". Esa es la garantía de que un correo
// nunca se descarta en silencio ni se reporta como enviado sin haberlo sido.
type Worker struct {
	outbox   *Outbox
	interval time.Duration
}

// NewWorker construye el worker. interval <= 0 usa DefaultInterval; los tests
// pasan uno corto para no esperar 30 s.
func NewWorker(outbox *Outbox, interval time.Duration) *Worker {
	if interval <= 0 {
		interval = DefaultInterval
	}
	return &Worker{outbox: outbox, interval: interval}
}

// Run bloquea hasta que stop se cierre. Hace una pasada inmediata al arrancar
// (no espera el primer tick) para que el outbox no quede estancado tras un
// reinicio del servidor.
func (w *Worker) Run(stop <-chan struct{}) {
	w.ProcessOnce()

	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()

	for {
		select {
		case <-stop:
			return
		case <-ticker.C:
			w.ProcessOnce()
		}
	}
}

// ProcessOnce hace un barrido. Devuelve cuántas filas procesó; los errores se
// registran por fila y no detienen el barrido (una fila mala no debe bloquear
// las demás).
func (w *Worker) ProcessOnce() int {
	// Modo desactivado: marcar todo lo pendiente y terminar. No se reintenta
	// porque no hay nada contra qué reintentar.
	if !w.outbox.Enabled() {
		affected, err := w.outbox.markDisabled(time.Now())
		if err != nil {
			log.Printf("mailer: marcar outbox desactivado: %v", err)
			return 0
		}
		if affected > 0 {
			log.Printf("mailer: SMTP no configurado, %d correo(s) marcado(s) como desactivado", affected)
		}
		return int(affected)
	}

	rows, err := w.outbox.pendingRows(batchSize)
	if err != nil {
		log.Printf("mailer: leer pendientes del outbox: %v", err)
		return 0
	}

	processed := 0
	for _, message := range rows {
		now := time.Now()
		if sendErr := w.outbox.sender.Send(message.ToEmail, message.Subject, message.BodyHTML); sendErr != nil {
			if markErr := w.outbox.markRetry(message.CompanyID, message.ID, sendErr, now); markErr != nil {
				log.Printf("mailer: registrar fallo %s: %v", message.ID, markErr)
			} else {
				log.Printf("mailer: correo %s (%s) fallo: %v", message.ID, message.Kind, sendErr)
			}
			processed++
			continue
		}

		if markErr := w.outbox.markSent(message.CompanyID, message.ID, now); markErr != nil {
			log.Printf("mailer: marcar enviado %s: %v", message.ID, markErr)
		}
		processed++
	}
	return processed
}
