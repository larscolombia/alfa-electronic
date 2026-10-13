package docs

type Document struct {
	ID             string `json:"id"`
	CompanyID      string `json:"companyId"`
	Title          string `json:"title"`
	Type           string `json:"type"`
	EquipmentModel string `json:"equipmentModel"`
	URL            string `json:"url"`
	FileName       string `json:"fileName"`
	Description    string `json:"description"`
	Deletable      bool   `json:"deletable"`
	CreatedAt      string `json:"createdAt"`
	CreatedBy      string `json:"createdBy"`
}

type SoftwareBackup struct {
	ID             string `json:"id"`
	CompanyID      string `json:"companyId"`
	EquipmentModel string `json:"equipmentModel"`
	FileName       string `json:"fileName"`
	FileSize       int64  `json:"fileSize"`
	URL            string `json:"url"`
	Version        string `json:"version"`
	CreatedAt      string `json:"createdAt"`
	UploadedBy     string `json:"uploadedBy"`
}
