package acl

import "context"

// CanViewModule reporta si un rol puede "ver" un módulo del catálogo ACL.
// Es la primitiva pública que consumen otros paquetes (p. ej. extracciones)
// para el doble chequeo de permisos por módulo origen, sin duplicar la lógica
// de roleAllows ni la ruta de escape de admin/superadmin.
func (s *Service) CanViewModule(ctx context.Context, companyID, role, moduleSlug string) (bool, error) {
	if isAdminRole(role) {
		return true, nil
	}
	if err := s.ensureAccessReady(ctx, companyID); err != nil {
		return false, err
	}
	return s.roleAllows(ctx, companyID, role, moduleSlug, actionView)
}
