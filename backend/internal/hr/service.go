package hr

import (
	"context"
	"database/sql"
	"errors"
)

var (
	errCatalogNameRequired            = errors.New("catalog name is required")
	errCatalogNameExists              = errors.New("catalog name already exists")
	errEmployeeNameMissing            = errors.New("employee name is required")
	errEmployeeNotFound               = errors.New("empleado no encontrado")
	errEmployeeStatusInvalid          = errors.New("el estado del empleado no es valido (usa Activo, Inactivo o Licencia)")
	errEmployeeEmailInvalid           = errors.New("el correo electronico del empleado no tiene un formato valido")
	errEmployeeEmailMissing           = errors.New("el empleado no tiene un correo electronico registrado; actualiza la ficha primero")
	errEmployeeEmailRequired          = errors.New("el correo del empleado es obligatorio: es su identidad de login")
	errEmployeePasswordRequired       = errors.New("la contrasena de acceso es obligatoria: ningun empleado existe sin cuenta de login")
	errEmployeeAccessRoleRequired     = errors.New("el rol de acceso es obligatorio para crear la cuenta de login del empleado")
	errEmployeeAccessRoleUnknown      = errors.New("el rol de acceso no existe en el ACL de la empresa")
	errEmployeeEmailExists            = errors.New("ya existe un empleado o una cuenta de acceso con ese correo")
	errEmployeeAccessAccountMissing   = errors.New("el correo del empleado no tiene una cuenta de acceso en la plataforma")
	errEmployeeDateInvalid            = errors.New("las fechas del empleado deben tener formato YYYY-MM-DD")
	errEmployeePhotoInvalid           = errors.New("la foto del empleado debe ser una imagen en formato data URL (data:image/...)")
	errEmployeePhotoTooLarge          = errors.New("la foto del empleado supera el tamano maximo permitido (3MB)")
	errEmployeeDocumentNumberConflict = errors.New("el numero de documento ya lo usa otro empleado o coincide con un id existente")
	errDocumentFileNameRequired       = errors.New("el nombre del archivo del documento es obligatorio")
	errDocumentDataRequired           = errors.New("el contenido del documento es obligatorio (data URL base64)")
	errDocumentTooLarge               = errors.New("el documento supera el tamano maximo permitido (8MB)")
	errDocumentNotFound               = errors.New("documento no encontrado")
)

type Service struct {
	db *sql.DB
	// roleReadiness asegura los roles ACL de la empresa antes de validar el rol
	// de acceso de una cuenta nueva (misma siembra perezosa que usa auth).
	roleReadiness func(ctx context.Context, companyID string) error
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}
