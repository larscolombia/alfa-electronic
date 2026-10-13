package hr

import (
	"database/sql"
	"errors"
)

var (
	errCatalogNameRequired          = errors.New("catalog name is required")
	errCatalogNameExists            = errors.New("catalog name already exists")
	errEmployeeNameMissing          = errors.New("employee name is required")
	errEmployeeNotFound             = errors.New("empleado no encontrado")
	errEmployeeStatusInvalid        = errors.New("el estado del empleado no es valido (usa Activo, Inactivo o Licencia)")
	errEmployeeEmailInvalid         = errors.New("el correo electronico del empleado no tiene un formato valido")
	errEmployeeEmailMissing         = errors.New("el empleado no tiene un correo electronico registrado; actualiza la ficha primero")
	errEmployeeAccessAccountMissing = errors.New("el correo del empleado no tiene una cuenta de acceso en la plataforma")
	errEmployeeDateInvalid          = errors.New("las fechas del empleado deben tener formato YYYY-MM-DD")
	errEmployeePhotoInvalid         = errors.New("la foto del empleado debe ser una imagen en formato data URL (data:image/...)")
	errEmployeePhotoTooLarge        = errors.New("la foto del empleado supera el tamano maximo permitido (3MB)")
	errDocumentFileNameRequired     = errors.New("el nombre del archivo del documento es obligatorio")
	errDocumentDataRequired         = errors.New("el contenido del documento es obligatorio (data URL base64)")
	errDocumentTooLarge             = errors.New("el documento supera el tamano maximo permitido (8MB)")
	errDocumentNotFound             = errors.New("documento no encontrado")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}
