package crm

import (
	"database/sql"
	"time"
)

func scanClient(scanner interface{ Scan(dest ...any) error }) (Client, error) {
	var (
		item            Client
		lastPaymentDate sql.NullTime
		createdAt       time.Time
	)

	if err := scanner.Scan(
		&item.ID,
		&item.Nombre,
		&item.Correo,
		&item.Empresa,
		&item.Nit,
		&item.Zona,
		&item.Estado,
		&item.Website,
		&item.OfficePhone,
		&item.Country,
		&item.City,
		&item.Address,
		&item.Credito.Enabled,
		&item.Credito.CreditLimit,
		&item.Credito.Consumed,
		&lastPaymentDate,
		&item.Credito.PaymentTermDays,
		&createdAt,
	); err != nil {
		return Client{}, err
	}

	item.Creado = createdAt.UTC().Format("2006-01-02")
	if lastPaymentDate.Valid {
		item.Credito.LastPaymentDate = lastPaymentDate.Time.UTC().Format("2006-01-02")
	}

	return item, nil
}
