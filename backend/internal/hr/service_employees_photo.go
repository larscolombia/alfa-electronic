package hr

import "strings"

// maxEmployeePhotoDataURLBytes equivale a ~3MB binarios codificados en base64.
const maxEmployeePhotoDataURLBytes = 3 * 1024 * 1024 * 4 / 3

const employeePhotoDataURLPrefix = "data:image/"

// validateEmployeePhoto exige data URL de imagen con un tope de ~3MB binarios;
// "" es valido (empleado sin foto).
func validateEmployeePhoto(photoData string) error {
	if photoData == "" {
		return nil
	}
	if !strings.HasPrefix(photoData, employeePhotoDataURLPrefix) {
		return errEmployeePhotoInvalid
	}
	if len(photoData) > maxEmployeePhotoDataURLBytes {
		return errEmployeePhotoTooLarge
	}
	return nil
}
