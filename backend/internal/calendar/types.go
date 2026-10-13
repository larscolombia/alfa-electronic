package calendar

type Event struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Start       string  `json:"start"`
	End         *string `json:"end,omitempty"`
	AllDay      bool    `json:"allDay"`
	Description string  `json:"description"`
	ClassName   string  `json:"className"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

type CreateEventRequest struct {
	Title       string `json:"title"`
	Start       string `json:"start"`
	End         string `json:"end,omitempty"`
	AllDay      bool   `json:"allDay"`
	Description string `json:"description"`
	ClassName   string `json:"className"`
}

type ListEventsQuery struct {
	From  string
	To    string
	Limit int
}
