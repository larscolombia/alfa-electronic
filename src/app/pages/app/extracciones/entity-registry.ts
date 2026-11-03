import { ExtractionEntityConfig } from "./extractions.model";

import { CrmClientsApiService } from "../../../services/crm-clients-api.service";
import { CrmEquipmentApiService } from "../../../services/crm-equipment-api.service";
import { CrmQuotesApiService } from "../../../services/crm-quotes-api.service";
import { InventoryApiService } from "../../../services/inventory-api.service";
import { FinanceBillingApiService } from "../../../services/finance-billing-api.service";
import { SuppliersApiService } from "../../../services/suppliers-api.service";
import { FinancePaymentsApiService } from "../../../services/finance-payments-api.service";

import { createClientesEntity } from "./entities/clientes.entity";
import { createEquiposEntity } from "./entities/equipos.entity";
import { createCotizacionesEntity } from "./entities/cotizaciones.entity";
import { createInventarioEntity } from "./entities/inventario.entity";
import { createFacturacionEntity } from "./entities/facturacion.entity";
import { createComprasEntity } from "./entities/compras.entity";
import { createCarteraPagosEntity } from "./entities/cartera-pagos.entity";

export interface EntityRegistryDeps {
    clientsApi: CrmClientsApiService;
    equipmentApi: CrmEquipmentApiService;
    quotesApi: CrmQuotesApiService;
    inventoryApi: InventoryApiService;
    billingApi: FinanceBillingApiService;
    suppliersApi: SuppliersApiService;
    paymentsApi: FinancePaymentsApiService;
}

export interface EntityRegistry {
    list: ExtractionEntityConfig[];
    byId: Map<string, ExtractionEntityConfig>;
}

/** Construye las 7 entidades extraíbles y un índice por id para acceso O(1). */
export function createEntityRegistry(deps: EntityRegistryDeps): EntityRegistry {
    const list = [
        createClientesEntity(deps.clientsApi),
        createEquiposEntity(deps.equipmentApi),
        createCotizacionesEntity(deps.quotesApi),
        createInventarioEntity(deps.inventoryApi),
        createFacturacionEntity(deps.billingApi),
        createComprasEntity(deps.suppliersApi),
        createCarteraPagosEntity(deps.billingApi, deps.paymentsApi),
    ];

    const byId = new Map<string, ExtractionEntityConfig>(list.map(config => [config.id, config]));
    return { list, byId };
}
