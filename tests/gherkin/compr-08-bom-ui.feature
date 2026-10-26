Feature: BOM para carga masiva de proveedor

  Scenario: Descargar BOM desde líneas visibles de compra
    Given que compras inicia sesión y selecciona un proveedor
    When descarga el BOM de proveedor
    Then el archivo contiene únicamente Número de parte y Cantidad con cantidades positivas
