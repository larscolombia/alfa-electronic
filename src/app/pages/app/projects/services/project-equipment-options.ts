import type { ProspectEquipmentRepairStatus } from '../../crm/crm-prospect-equipment.store';

export interface ProjectRepairStatusOption { id: ProspectEquipmentRepairStatus; label: string }

/** Static status catalog must be available before the equipment API is needed. */
export const PROJECT_REPAIR_STATUS_OPTIONS: ProjectRepairStatusOption[] = [
  { id: 'recibido', label: 'Recibido' },
  { id: 'diagnostico', label: 'Diagnostico' },
  { id: 'por-cotizar', label: 'Por cotizar' },
  { id: 'pedir-repuestos', label: 'Pedir componentes' },
  { id: 'esperando-proveedor', label: 'Esperando proveedor' },
  { id: 'reparacion', label: 'En reparacion' },
  { id: 'garantia', label: 'Garantia' },
  { id: 'garantia-espera-repuestos', label: 'Garantia esp. repuestos' },
  { id: 'prestamo', label: 'Material en prestamo' },
  { id: 'listo-entrega', label: 'Listo para entrega' },
  { id: 'entregado', label: 'Entregado' },
];
