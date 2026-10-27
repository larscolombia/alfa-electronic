package equipment

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"strings"
	"time"
)

// CustodyIncident documenta el incidente de custodia cuando el remitente no
// pudo identificarse (REC-03): quien recibió y la nota de las fotos tomadas.
type CustodyIncident struct {
	PhotosNote  string `json:"photosNote"`
	Responsible string `json:"responsible"`
	CreatedAt   string `json:"createdAt"`
}

// DuplicateConfirm es la justificación que permite registrar un identificador
// ya existente en otro equipo (REC-14): motivo y tipo de relación.
type DuplicateConfirm struct {
	Reason   string `json:"reason"`
	Relation string `json:"relation"`
}

// BorrowedEquipment es un equipo prestado anclado al ítem (REC-08). El
// formato físico aún envía strings planos; UnmarshalJSON acepta ambos.
type BorrowedEquipment struct {
	Code        string `json:"code"`
	Description string `json:"description"`
}

func (b *BorrowedEquipment) UnmarshalJSON(data []byte) error {
	var plain string
	if err := json.Unmarshal(data, &plain); err == nil {
		b.Code = ""
		b.Description = plain
		return nil
	}

	type alias BorrowedEquipment
	var entry alias
	if err := json.Unmarshal(data, &entry); err != nil {
		return err
	}
	*b = BorrowedEquipment(entry)
	return nil
}

func generateBorrowedCode() string {
	var buffer [4]byte
	if _, err := rand.Read(buffer[:]); err != nil {
		return "BLD-" + time.Now().UTC().Format("15040500")
	}
	return "BLD-" + strings.ToUpper(hex.EncodeToString(buffer[:]))
}

var allowedDuplicateRelations = map[string]bool{
	"reingreso":    true,
	"garantia":     true,
	"evento_nuevo": true,
}

func duplicateConfirmValid(confirm *DuplicateConfirm) bool {
	if confirm == nil {
		return false
	}
	if strings.TrimSpace(confirm.Reason) == "" {
		return false
	}
	return allowedDuplicateRelations[strings.ToLower(strings.TrimSpace(confirm.Relation))]
}
