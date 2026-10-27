package inventory

import "errors"

type UsedTestRecord struct {
	TestedBy string `json:"testedBy"`
	TestedAt string `json:"testedAt"`
	Result   string `json:"result"`
	Note     string `json:"note"`
}

type RecordUsedTestRequest struct {
	Result string `json:"result"`
	Note   string `json:"note"`
}

type BagItem struct {
	Reference string `json:"reference"`
	Quantity  int    `json:"quantity"`
}

type ReleaseTechnicianBagRequest struct {
	LeftoverQty *int `json:"leftoverQty"`
}

type CreateDiscrepancyRequest struct {
	Reference  string `json:"referenceId"`
	CountedQty int    `json:"countedQty"`
	Reason     string `json:"reason"`
	RootCause  string `json:"rootCause"`
}

type ReplenishmentDecisionRequest struct {
	Action   string `json:"action"`
	Reason   string `json:"reason"`
	Provider string `json:"provider"`
}

const (
	conditionNew  = "nuevo"
	conditionUsed = "usado"

	usedTestApproved = "aprobada"
	usedTestRejected = "rechazada"

	usedTestMaxAgeDays = 90
)

var (
	errDiscrepancyAlreadyApproved = errors.New("diferencia ya aprobada")
	errReplenishmentEscalated     = errors.New("item escalado requiere decision")
	errInvalidCondition           = errors.New("condicion de componente invalida")
)
