# Módulo ACL — Roles y Permisos de Usuario

> Stack: **Go + Echo + PostgreSQL**
> Contexto: sistema multi-tenant (una instancia, múltiples empresas)
> Fuente analizada: `src/app/pages/app/company/company-user-roles.component.ts`

---

## 1. Resumen del módulo

Este módulo gestiona la asignación de roles a usuarios dentro de una empresa
y los permisos granulares que cada rol tiene sobre cada módulo **y sobre cada
campo individual** de esos módulos.

La vista `/app/company-user-roles` opera en **tres niveles de granularidad**:

| Nivel | Qué controla | Tipo de valor |
|---|---|---|
| **Módulo habilitado** | Toggle on/off del módulo completo para el rol | `boolean` |
| **Módulo → Acción → Scope** | Alcance del rol sobre `Agregar / Ver / Actualizar` del módulo | `Ninguno / Propio / Anadido / Todo` |
| **Módulo → Campo → Permiso** | Permiso individual sobre un campo de la vista del módulo | `Ver / Editar / Actualizar / Oculto` |

### 1.1 Política de persistencia crítica

- La fuente de verdad para **roles, permisos ACL, catálogos HR, empleados y soft-delete** debe ser **backend + base de datos**.
- `localStorage` no se debe usar para datos críticos, de autorización o de seguridad.
- `localStorage` solo es aceptable para preferencias no críticas de UI (por ejemplo, estado visual temporal).

---

## 2. Catálogos (tablas de referencia, seed inmutable)

### 2.1 Scopes de acción — `acl_permission_scopes`

Opciones del `<select>` por cada columna de acción en la tabla de permisos.
Extraídas directamente del template:

```html
<option selected>Ninguno</option>
<option>Propio</option>
<option>Anadido</option>
<option>Todo</option>
```

| `id` | `name` | `label` | Default seleccionado en UI |
|---|---|---|---|
| 0 | `ninguno` | Ninguno | Sí (Agregar y Actualizar) |
| 1 | `propio` | Propio | Sí (Ver) |
| 2 | `anadido` | Anadido | — |
| 3 | `todo` | Todo | — |

```sql
CREATE TABLE acl_permission_scopes (
    id    SMALLINT     PRIMARY KEY,
    name  VARCHAR(20)  NOT NULL UNIQUE,
    label VARCHAR(50)  NOT NULL
);

INSERT INTO acl_permission_scopes (id, name, label) VALUES
    (0, 'ninguno', 'Ninguno'),
    (1, 'propio',  'Propio'),
    (2, 'anadido', 'Anadido'),
    (3, 'todo',    'Todo');
```

---

### 2.2 Acciones de módulo — `acl_actions`

Las tres columnas de la tabla `Permisos por modulo` en UI:

```html
<th>Agregar</th>
<th>Ver</th>
<th>Actualizar</th>
```

| `id` | `name` | `label` | Default scope en UI |
|---|---|---|---|
| 1 | `agregar` | Agregar | `ninguno` (id=0) |
| 2 | `ver` | Ver | `propio` (id=1) |
| 3 | `actualizar` | Actualizar | `ninguno` (id=0) |

```sql
CREATE TABLE acl_actions (
    id         SMALLINT     PRIMARY KEY,
    name       VARCHAR(20)  NOT NULL UNIQUE,
    label      VARCHAR(50)  NOT NULL,
    sort_order SMALLINT     NOT NULL DEFAULT 0
);

INSERT INTO acl_actions (id, name, label, sort_order) VALUES
    (1, 'agregar',    'Agregar',    1),
    (2, 'ver',        'Ver',        2),
    (3, 'actualizar', 'Actualizar', 3);
```

---

### 2.3 Permisos de campo — `acl_field_permission_types`

Opciones del `<select>` de la subtabla expandida al hacer clic en "Mas":

```html
<option selected>Ver</option>
<option>Editar</option>
<option>Actualizar</option>
<option>Oculto</option>
```

> **Importante:** el default de campo es `Ver` (id=1), **no** `Oculto`.
> El campo `Oculto` significa sin acceso — es el valor más restrictivo.

| `id` | `name` | `label` | Default en UI |
|---|---|---|---|
| 1 | `ver` | Ver | **Sí** (selected) |
| 2 | `editar` | Editar | — |
| 3 | `actualizar` | Actualizar | — |
| 4 | `oculto` | Oculto | — |

```sql
CREATE TABLE acl_field_permission_types (
    id    SMALLINT     PRIMARY KEY,
    name  VARCHAR(20)  NOT NULL UNIQUE,
    label VARCHAR(50)  NOT NULL
);

INSERT INTO acl_field_permission_types (id, name, label) VALUES
    (1, 'ver',        'Ver'),
    (2, 'editar',     'Editar'),
    (3, 'actualizar', 'Actualizar'),
    (4, 'oculto',     'Oculto');
```

---

## 3. Módulos del sistema — `acl_modules`

Definidos en el array `modulePermissions` del componente TypeScript.
Son globales (no pertenecen a ninguna empresa). Los slugs son los `key` del componente.

```typescript
// Tipo del componente:
key: "horarios" | "registro-horas" | "gastos-caja-menor" | "proveedores"
```

| `id` | `slug` | `name` | `sort_order` |
|---|---|---|---|
| — | `horarios` | Modulo de horarios | 1 |
| — | `registro-horas` | Modulo de registro de horas | 2 |
| — | `gastos-caja-menor` | Modulo de registro de gastos de caja menor | 3 |
| — | `proveedores` | Modulo proveedores | 4 |

```sql
CREATE TABLE acl_modules (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    name        VARCHAR(120) NOT NULL,
    description TEXT,
    icon        VARCHAR(80),
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_acl_modules_slug ON acl_modules (slug);

INSERT INTO acl_modules (slug, name, description, sort_order) VALUES
    ('horarios',
     'Modulo de horarios',
     'Configuracion de horas semanales base y dias habiles realmente trabajados.', 1),
    ('registro-horas',
     'Modulo de registro de horas',
     'Control operativo de tareas y trazabilidad de tiempo por equipo.', 2),
    ('gastos-caja-menor',
     'Modulo de registro de gastos de caja menor',
     'Seguimiento de presupuesto, movimientos y disponibilidad.', 3),
    ('proveedores',
     'Modulo proveedores',
     'Ficha maestra, clasificacion ABCD e informacion contable y de calidad.', 4);
```

---

## 4. Campos por módulo — `acl_module_fields`

Cada string del array `fields` del componente es el `label` de un campo.
Los `slug`s son derivados para uso interno del backend.

```typescript
// Estructura del componente:
modulePermissions: Array<{
    key: string;
    name: string;
    description: string;
    fields: string[];   // ← etiquetas de los campos
}>
```

```sql
CREATE TABLE acl_module_fields (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id  UUID         NOT NULL REFERENCES acl_modules(id) ON DELETE CASCADE,
    slug       VARCHAR(120) NOT NULL,
    label      VARCHAR(255) NOT NULL,
    sort_order SMALLINT     NOT NULL DEFAULT 0,
    is_active  BOOLEAN      NOT NULL DEFAULT true,

    CONSTRAINT uq_acl_module_fields_module_slug UNIQUE (module_id, slug)
);

CREATE INDEX idx_acl_module_fields_module_id ON acl_module_fields (module_id);
```

### Seed completo de campos (extraídos del array `fields` del componente)

```sql
-- ── horarios ────────────────────────────────────────────────────────────────
INSERT INTO acl_module_fields (module_id, slug, label, sort_order)
SELECT m.id, f.slug, f.label, f.ord
FROM acl_modules m
CROSS JOIN (VALUES
    ('horas-semanales-base',         'Horas semanales base',                              1),
    ('contador-dias-habiles',        'Contador de dias habiles trabajados',               2),
    ('plazo-reparacion',             'Plazo de reparacion (14 dias habiles configurable)',3),
    ('evaluacion-horas-extra',       'Evaluacion de horas extra (horario vs registros)',  4)
) AS f(slug, label, ord)
WHERE m.slug = 'horarios';

-- ── registro-horas ──────────────────────────────────────────────────────────
INSERT INTO acl_module_fields (module_id, slug, label, sort_order)
SELECT m.id, f.slug, f.label, f.ord
FROM acl_modules m
CROSS JOIN (VALUES
    ('inicio-finalizacion-tarea',        'Inicio y finalizacion de cada tarea',                          1),
    ('justificacion-tareas-horas',       'Justificacion de tareas vs horas semanales',                   2),
    ('detalle-diario-horas',             'Detalle diario de uso de horas por equipo',                    3),
    ('algoritmo-prediccion-reparacion',  'Algoritmo de prediccion de tiempo de reparacion',              4),
    ('filtros-tiempo-tareas',            'Filtros de tiempo para tareas realizadas',                     5),
    ('modal-seleccion-equipo',           'Modal obligatorio para seleccionar equipo al iniciar tiempo',  6),
    ('evolucion-anual-clientes',         'Evolucion anual de clientes y facturacion',                   7)
) AS f(slug, label, ord)
WHERE m.slug = 'registro-horas';

-- ── gastos-caja-menor ───────────────────────────────────────────────────────
INSERT INTO acl_module_fields (module_id, slug, label, sort_order)
SELECT m.id, f.slug, f.label, f.ord
FROM acl_modules m
CROSS JOIN (VALUES
    ('presupuesto-mensual',   'Presupuesto mensual',                     1),
    ('fecha-gasto',           'Fecha del gasto',                         2),
    ('concepto-gasto',        'Concepto del gasto',                      3),
    ('valor',                 'Valor',                                   4),
    ('saldo',                 'Saldo',                                   5),
    ('contador-billetes',     'Contador de billetes por denominacion',   6)
) AS f(slug, label, ord)
WHERE m.slug = 'gastos-caja-menor';

-- ── proveedores ─────────────────────────────────────────────────────────────
INSERT INTO acl_module_fields (module_id, slug, label, sort_order)
SELECT m.id, f.slug, f.label, f.ord
FROM acl_modules m
CROSS JOIN (VALUES
    ('clasificacion-abcd',      'Clasificacion de proveedores ABCD',          1),
    ('numero-proveedor',        'Numero de proveedor (ID interno)',            2),
    ('razon-social',            'Razon social',                               3),
    ('direccion-principal',     'Direccion principal y datos adicionales',     4),
    ('codigo-postal-ciudad',    'Codigo postal y ciudad',                     5),
    ('pais',                    'Pais',                                       6),
    ('identificacion-fiscal',   'Identificacion fiscal (NIT/RUT/RFC)',         7),
    ('numero-iva',              'Numero IVA intracomunitario',                 8),
    ('idioma-moneda',           'Idioma y moneda',                            9),
    ('contacto-principal',      'Contacto principal',                        10),
    ('trato-apellido-nombre',   'Trato / Apellido / Nombre',                 11),
    ('telefono-celular',        'Telefono celular',                          12),
    ('cargo-especialidad',      'Cargo / especialidad tecnica',              13),
    ('dominio-sector',          'Dominio o sector de actividad',             14),
    ('rse',                     'RSE',                                       15),
    ('suscripcion',             'Suscripcion',                               16),
    ('observaciones',           'Observaciones',                             17),
    ('numero-contable',         'Numero contable',                           18),
    ('terminos-pago',           'Terminos de pago',                         19),
    ('gastos-envio',            'Gastos de envio',                           20),
    ('pedido-minimo',           'Pedido minimo',                             21),
    ('tasa-impuesto',           'Tasa de impuesto',                         22),
    ('responsable',             'Responsable',                              23),
    ('grado-confianza',         'Grado de confianza',                        24),
    ('notas-desempeno',         'Notas de desempeno',                        25)
) AS f(slug, label, ord)
WHERE m.slug = 'proveedores';
```

**Resumen:** 4 módulos, **42 campos en total** (4 + 7 + 6 + 25).

---

## 5. Roles por empresa — `acl_roles`

Un rol pertenece a una empresa específica (multi-tenant).
Los roles visibles en la UI son: `Administrador`, `Súper administrador`,
`Moderador`, `Contador`, `Desarrollador`, `Gerente`.
Estos se crean como **seed por empresa** al momento del onboarding.

```sql
CREATE TABLE acl_roles (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name        VARCHAR(80)  NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_acl_roles_company_name UNIQUE (company_id, name)
);

CREATE INDEX idx_acl_roles_company_id ON acl_roles (company_id);
```

**Seed de roles por defecto al crear empresa:**

```sql
-- Llamar al crear una nueva empresa (onboarding)
INSERT INTO acl_roles (company_id, name, description) VALUES
    ($1, 'Administrador',       'Acceso completo a todos los módulos'),
    ($1, 'Súper administrador', 'Control total incluyendo configuración de empresa'),
    ($1, 'Gerente',             'Supervisión de equipos y reportes'),
    ($1, 'Moderador',           'Gestión operativa con permisos limitados'),
    ($1, 'Contador',            'Acceso a módulos financieros y de gastos'),
    ($1, 'Desarrollador',       'Acceso a módulos operativos y de trabajo');
```

---

## 6. Toggle de módulo por rol — `acl_role_module_access`

Corresponde al switch `moduleVisibility[module.key]` del componente.

```typescript
moduleVisibility: Record<"horarios" | "registro-horas" | "gastos-caja-menor" | "proveedores", boolean> = {
    horarios: true,
    "registro-horas": true,
    "gastos-caja-menor": true,
    proveedores: true,
};
```

> Cuando el switch está en `false`: el módulo desaparece de la tabla de permisos
> y si ese módulo era el `activeModuleKey`, el acordeón se cierra (`activeModuleKey = null`).

```sql
CREATE TABLE acl_role_module_access (
    role_id    UUID        NOT NULL REFERENCES acl_roles(id)   ON DELETE CASCADE,
    module_id  UUID        NOT NULL REFERENCES acl_modules(id) ON DELETE CASCADE,
    is_enabled BOOLEAN     NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (role_id, module_id)
);

CREATE INDEX idx_acl_rma_role_id ON acl_role_module_access (role_id);
```

---

## 7. Permisos de acción por módulo — `acl_role_permissions`

Tabla central nivel módulo. Una fila por cada combinación `(rol, módulo, acción)`.

```sql
CREATE TABLE acl_role_permissions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id    UUID        NOT NULL REFERENCES acl_roles(id)             ON DELETE CASCADE,
    module_id  UUID        NOT NULL REFERENCES acl_modules(id)           ON DELETE CASCADE,
    action_id  SMALLINT    NOT NULL REFERENCES acl_actions(id)           ON DELETE RESTRICT,
    scope_id   SMALLINT    NOT NULL REFERENCES acl_permission_scopes(id) ON DELETE RESTRICT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_acl_role_permissions UNIQUE (role_id, module_id, action_id)
);

CREATE INDEX idx_acl_rp_role_id   ON acl_role_permissions (role_id);
CREATE INDEX idx_acl_rp_module_id ON acl_role_permissions (module_id);
```

**Default al crear un nuevo rol** — genera 3 filas (una por acción) por cada módulo,
con scopes que replican el estado inicial de la UI:

```sql
-- Al crear un rol, insertar permisos default para todos los módulos
INSERT INTO acl_role_permissions (role_id, module_id, action_id, scope_id)
SELECT $1, m.id, a.id,
    CASE a.name
        WHEN 'ver' THEN 1   -- scope: Propio (default del select Ver en UI)
        ELSE 0              -- scope: Ninguno (default de Agregar y Actualizar)
    END
FROM acl_modules m
CROSS JOIN acl_actions a
WHERE m.is_active = true;
```

---

## 8. Permisos por campo — `acl_role_field_permissions`

Tabla de nivel campo. Una fila por cada combinación `(rol, campo)`.
Se muestra en la subtabla expandida al hacer clic en el botón **"Mas"**.

> **Default:** `Ver` (`field_perm_id = 1`), porque en el template el `<option selected>Ver</option>`
> es el primero de la lista del select de campo.

```sql
CREATE TABLE acl_role_field_permissions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       UUID        NOT NULL REFERENCES acl_roles(id)                  ON DELETE CASCADE,
    field_id      UUID        NOT NULL REFERENCES acl_module_fields(id)          ON DELETE CASCADE,
    field_perm_id SMALLINT    NOT NULL REFERENCES acl_field_permission_types(id) ON DELETE RESTRICT DEFAULT 1,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_acl_role_field_permissions UNIQUE (role_id, field_id)
);

CREATE INDEX idx_acl_rfp_role_id  ON acl_role_field_permissions (role_id);
CREATE INDEX idx_acl_rfp_field_id ON acl_role_field_permissions (field_id);
```

**Default al crear un nuevo rol** — genera una fila por cada campo de todos los módulos:

```sql
INSERT INTO acl_role_field_permissions (role_id, field_id, field_perm_id)
SELECT $1, f.id, 1   -- 1 = 'ver'
FROM acl_module_fields f
JOIN acl_modules m ON m.id = f.module_id
WHERE m.is_active = true AND f.is_active = true;
```

---

## 9. Asignación de roles a usuarios — `acl_user_roles`

```sql
CREATE TABLE acl_user_roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    role_id     UUID        NOT NULL REFERENCES acl_roles(id) ON DELETE CASCADE,
    assigned_by UUID        REFERENCES users(id)              ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_acl_user_roles UNIQUE (user_id, role_id)
);

CREATE INDEX idx_acl_ur_user_id ON acl_user_roles (user_id);
CREATE INDEX idx_acl_ur_role_id ON acl_user_roles (role_id);
```

---

## 10. Orden de creación de tablas (dependencias)

```
1.  acl_permission_scopes        (sin deps)
2.  acl_actions                  (sin deps)
3.  acl_field_permission_types   (sin deps)
4.  acl_modules                  (sin deps)
5.  acl_module_fields            (→ acl_modules)
6.  acl_roles                    (→ companies)
7.  acl_role_module_access       (→ acl_roles, acl_modules)
8.  acl_role_permissions         (→ acl_roles, acl_modules, acl_actions, acl_permission_scopes)
9.  acl_role_field_permissions   (→ acl_roles, acl_module_fields, acl_field_permission_types)
10. acl_user_roles               (→ users, acl_roles)
```

---

## 11. Structs en Go

```go
// internal/acl/model.go
package acl

import (
    "time"

    "github.com/google/uuid"
)

// ─── catálogos ───────────────────────────────────────────────────────────────

type PermissionScope struct {
    ID    int16  `db:"id"    json:"id"`
    Name  string `db:"name"  json:"name"`
    Label string `db:"label" json:"label"`
}

type Action struct {
    ID        int16  `db:"id"         json:"id"`
    Name      string `db:"name"       json:"name"`
    Label     string `db:"label"      json:"label"`
    SortOrder int16  `db:"sort_order" json:"sort_order"`
}

type FieldPermissionType struct {
    ID    int16  `db:"id"    json:"id"`
    Name  string `db:"name"  json:"name"`
    Label string `db:"label" json:"label"`
}

// ─── módulos y campos ────────────────────────────────────────────────────────

type Module struct {
    ID          uuid.UUID `db:"id"          json:"id"`
    Slug        string    `db:"slug"        json:"slug"`
    Name        string    `db:"name"        json:"name"`
    Description string    `db:"description" json:"description"`
    Icon        string    `db:"icon"        json:"icon"`
    IsActive    bool      `db:"is_active"   json:"is_active"`
    SortOrder   int16     `db:"sort_order"  json:"sort_order"`
    CreatedAt   time.Time `db:"created_at"  json:"created_at"`
    UpdatedAt   time.Time `db:"updated_at"  json:"updated_at"`
}

type ModuleField struct {
    ID        uuid.UUID `db:"id"         json:"id"`
    ModuleID  uuid.UUID `db:"module_id"  json:"module_id"`
    Slug      string    `db:"slug"       json:"slug"`
    Label     string    `db:"label"      json:"label"`
    SortOrder int16     `db:"sort_order" json:"sort_order"`
    IsActive  bool      `db:"is_active"  json:"is_active"`
}

// ─── roles ───────────────────────────────────────────────────────────────────

type Role struct {
    ID          uuid.UUID `db:"id"          json:"id"`
    CompanyID   uuid.UUID `db:"company_id"  json:"company_id"`
    Name        string    `db:"name"        json:"name"`
    Description string    `db:"description" json:"description"`
    IsActive    bool      `db:"is_active"   json:"is_active"`
    CreatedAt   time.Time `db:"created_at"  json:"created_at"`
    UpdatedAt   time.Time `db:"updated_at"  json:"updated_at"`
}

// ─── permisos ────────────────────────────────────────────────────────────────

type RoleModuleAccess struct {
    RoleID    uuid.UUID `db:"role_id"    json:"role_id"`
    ModuleID  uuid.UUID `db:"module_id"  json:"module_id"`
    IsEnabled bool      `db:"is_enabled" json:"is_enabled"`
    UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type RolePermission struct {
    ID        uuid.UUID `db:"id"         json:"id"`
    RoleID    uuid.UUID `db:"role_id"    json:"role_id"`
    ModuleID  uuid.UUID `db:"module_id"  json:"module_id"`
    ActionID  int16     `db:"action_id"  json:"action_id"`
    ScopeID   int16     `db:"scope_id"   json:"scope_id"`
    CreatedAt time.Time `db:"created_at" json:"created_at"`
    UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type RoleFieldPermission struct {
    ID          uuid.UUID `db:"id"            json:"id"`
    RoleID      uuid.UUID `db:"role_id"       json:"role_id"`
    FieldID     uuid.UUID `db:"field_id"      json:"field_id"`
    FieldPermID int16     `db:"field_perm_id" json:"field_perm_id"`
    CreatedAt   time.Time `db:"created_at"    json:"created_at"`
    UpdatedAt   time.Time `db:"updated_at"    json:"updated_at"`
}

// ─── usuarios ────────────────────────────────────────────────────────────────

type UserRole struct {
    ID         uuid.UUID  `db:"id"          json:"id"`
    UserID     uuid.UUID  `db:"user_id"     json:"user_id"`
    RoleID     uuid.UUID  `db:"role_id"     json:"role_id"`
    AssignedBy *uuid.UUID `db:"assigned_by" json:"assigned_by"`
    AssignedAt time.Time  `db:"assigned_at" json:"assigned_at"`
}

// ─── soft-delete de usuario ──────────────────────────────────────────────────
// Refleja el tipo UserSoftDeletePayload del componente TypeScript.

type UserSoftDeletePayload struct {
    UserEmail   string `json:"userEmail"`
    Action      string `json:"action"`      // siempre "SOFT_DELETE"
    Status      string `json:"status"`      // siempre "INACTIVE"
    SoftDelete  bool   `json:"softDelete"`  // siempre true
    RequestedAt string `json:"requestedAt"` // ISO 8601
    Source      string `json:"source"`      // "company-user-roles"
}
```

---

## 12. Queries de autorización (middleware Echo)

### 12.1 — Verificar acceso a módulo por acción y scope mínimo

```sql
-- $1 = user_id   $2 = module_slug   $3 = action_name   $4 = scope_minimo (0..3)
SELECT EXISTS (
    SELECT 1
    FROM acl_user_roles         ur
    JOIN acl_roles              r   ON r.id         = ur.role_id
    JOIN acl_role_module_access rma ON rma.role_id  = r.id
    JOIN acl_role_permissions   rp  ON rp.role_id   = r.id
                                   AND rp.module_id = rma.module_id
    JOIN acl_modules            m   ON m.id         = rma.module_id
    JOIN acl_actions            a   ON a.id         = rp.action_id
    WHERE ur.user_id      = $1
      AND m.slug          = $2
      AND a.name          = $3
      AND rp.scope_id    >= $4
      AND rma.is_enabled  = true
      AND r.is_active     = true
      AND m.is_active     = true
) AS authorized;
```

### 12.2 — Verificar permiso sobre un campo específico

```sql
-- $1 = user_id   $2 = module_slug   $3 = field_slug   $4 = perm_maximo_permitido (1..3)
-- oculto = 4, queda excluido al filtrar field_perm_id != 4
-- La lógica: si el permiso asignado <= lo que se pide, tiene acceso
-- (1=ver ≤ 2=editar ≤ 3=actualizar; 4=oculto = sin acceso)
SELECT EXISTS (
    SELECT 1
    FROM acl_user_roles           ur
    JOIN acl_roles                r   ON r.id       = ur.role_id
    JOIN acl_role_field_permissions rfp ON rfp.role_id = r.id
    JOIN acl_module_fields        f   ON f.id        = rfp.field_id
    JOIN acl_modules              m   ON m.id        = f.module_id
    WHERE ur.user_id        = $1
      AND m.slug            = $2
      AND f.slug            = $3
      AND rfp.field_perm_id != 4        -- excluir oculto
      AND rfp.field_perm_id <= $4       -- tiene al menos el nivel pedido
      AND r.is_active        = true
      AND m.is_active        = true
      AND f.is_active        = true
) AS field_authorized;
```

### 12.3 — Cargar perfil completo de permisos de un usuario (para JWT / Redis)

```sql
-- $1 = user_id
SELECT
    r.id             AS role_id,
    r.name           AS role_name,
    m.slug           AS module_slug,
    m.name           AS module_name,
    rma.is_enabled   AS module_enabled,
    a.name           AS action_name,
    ps.name          AS scope_name
FROM acl_user_roles         ur
JOIN acl_roles              r   ON r.id         = ur.role_id
JOIN acl_role_module_access rma ON rma.role_id  = r.id
JOIN acl_modules            m   ON m.id         = rma.module_id
JOIN acl_role_permissions   rp  ON rp.role_id   = r.id
                               AND rp.module_id = m.id
JOIN acl_actions            a   ON a.id         = rp.action_id
JOIN acl_permission_scopes  ps  ON ps.id        = rp.scope_id
WHERE ur.user_id  = $1
  AND r.is_active = true
  AND m.is_active = true
ORDER BY m.sort_order, a.sort_order;
```

---

## 13. Flujo "Agregar rol" — botón en `/app/company-user-roles`

```typescript
// En el template:
<button routerLink="/app/company-user-roles"><i class="bi bi-plus"></i> Agregar rol</button>
```

El botón navega a la misma ruta. En la implementación real abrirá un formulario
(modal / panel inline) con los siguientes campos:

| Campo UI | Campo BD | Validación |
|---|---|---|
| Nombre del rol | `acl_roles.name` | Requerido, máx 80 chars, único por empresa |
| Descripción | `acl_roles.description` | Opcional, texto libre |

### Flujo completo al crear un rol (backend — transacción única)

```
POST /api/v1/acl/roles
Body: { "name": "Analista", "description": "..." }

Dentro de una transacción:
  1. INSERT INTO acl_roles              → obtener role_id
  2. INSERT INTO acl_role_module_access → un registro por módulo activo, is_enabled = true
  3. INSERT INTO acl_role_permissions   → 3 filas por módulo (agregar/ver/actualizar), scopes default
  4. INSERT INTO acl_role_field_permissions → 1 fila por campo, field_perm_id = 1 (Ver)
```

### Go struct del request

```go
// internal/acl/handler.go

type CreateRoleRequest struct {
    Name        string `json:"name"        validate:"required,max=80"`
    Description string `json:"description"`
}
```

### Go struct de la respuesta

```go
type CreateRoleResponse struct {
    ID          uuid.UUID `json:"id"`
    CompanyID   uuid.UUID `json:"company_id"`
    Name        string    `json:"name"`
    Description string    `json:"description"`
    IsActive    bool      `json:"is_active"`
    CreatedAt   time.Time `json:"created_at"`
}
```

---

## 14. Flujo "Agregar empleado" — botón en `/app/company-user-roles`

```typescript
// En el template:
<button routerLink="/app/company-hr-employees"><i class="bi bi-plus"></i> Agregar empleado</button>
```

Este botón navega a `/app/company-hr-employees`, que a su vez tiene su propio
botón que envía a `/app/profile-professional?source=hr-employees&new=1`.

### 14.1 Tabla de empleados — `hr_employees`

Mapeada directamente desde la interfaz `EmployeeRow` del componente
`company-hr-employees.component.ts`:

```typescript
interface EmployeeRow {
    id: string;          // "EMP-001", "EMP-002" …
    name: string;
    role: string;        // cargo / puesto (viene de positionCatalog)
    department: string;  // departamento (viene de departmentCatalog)
    manager: string;     // nombre del responsable
    status: string;      // "Activo" | "Inactivo" | "Licencia"
    fileComplete: boolean;
}
```

```sql
CREATE TYPE hr_employee_status AS ENUM ('Activo', 'Inactivo', 'Licencia');

CREATE TABLE hr_employees (
    id              VARCHAR(20)         PRIMARY KEY,   -- formato EMP-NNN, generado por secuencia
    company_id      UUID                NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name            VARCHAR(120)        NOT NULL,
    position_id     UUID                REFERENCES hr_positions(id)   ON DELETE SET NULL,
    department_id   UUID                REFERENCES hr_departments(id) ON DELETE SET NULL,
    manager_id      VARCHAR(20)         REFERENCES hr_employees(id)   ON DELETE SET NULL,
    status          hr_employee_status  NOT NULL DEFAULT 'Activo',
    file_complete   BOOLEAN             NOT NULL DEFAULT false,
    soft_delete     BOOLEAN             NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hr_employees_company_id ON hr_employees (company_id);
CREATE INDEX idx_hr_employees_status     ON hr_employees (status);

-- Secuencia para generar IDs tipo EMP-001
CREATE SEQUENCE hr_employees_seq START 1;
-- Uso en Go: fmt.Sprintf("EMP-%03d", nextval('hr_employees_seq'))
```

### 14.2 Catálogo de cargos — `hr_positions`

Actualmente persiste en `localStorage` con clave `lars.hr.catalog.positions`.
Se debe migrar a BD por empresa.

```typescript
private readonly positionsStorageKey = "lars.hr.catalog.positions";

private defaultPositions(): string[] {
    return ["Coordinador SST", "Tecnico soporte", "Tecnico de campo", "Analista RRHH"];
}
```

```sql
CREATE TABLE hr_positions (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name       VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_hr_positions_company_name UNIQUE (company_id, name)
);

CREATE INDEX idx_hr_positions_company_id ON hr_positions (company_id);

-- Seed por empresa en onboarding
INSERT INTO hr_positions (company_id, name) VALUES
    ($1, 'Coordinador SST'),
    ($1, 'Tecnico soporte'),
    ($1, 'Tecnico de campo'),
    ($1, 'Analista RRHH');
```

### 14.3 Catálogo de departamentos — `hr_departments`

```typescript
private readonly departmentsStorageKey = "lars.hr.catalog.departments";

private defaultDepartments(): string[] {
    return ["Gestion Humana", "Operaciones", "Comercial", "Finanzas"];
}
```

```sql
CREATE TABLE hr_departments (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name       VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_hr_departments_company_name UNIQUE (company_id, name)
);

CREATE INDEX idx_hr_departments_company_id ON hr_departments (company_id);

-- Seed por empresa en onboarding
INSERT INTO hr_departments (company_id, name) VALUES
    ($1, 'Gestion Humana'),
    ($1, 'Operaciones'),
    ($1, 'Comercial'),
    ($1, 'Finanzas');
```

### 14.4 Datos reales de empleados (seed de ejemplo)

```typescript
// Empleados hardcodeados en el componente → migrar a BD
{ id: "EMP-001", name: "Ludwig Angarita",  role: "Coordinador SST",  department: "Gestion Humana", manager: "Direccion General", status: "Activo",   fileComplete: true  },
{ id: "EMP-002", name: "Danny Ramirez",    role: "Tecnico soporte",  department: "Operaciones",    manager: "Ludwig Angarita",  status: "Activo",   fileComplete: false },
{ id: "EMP-003", name: "Elkin Ramirez",    role: "Tecnico de campo", department: "Operaciones",    manager: "Danny Ramirez",    status: "Activo",   fileComplete: true  },
{ id: "EMP-004", name: "Maria Londono",    role: "Analista RRHH",    department: "Gestion Humana", manager: "Direccion General", status: "Licencia", fileComplete: false },
```

### 14.5 Soft-delete de empleado

El componente acumula payloads antes de enviarlos al backend:

```typescript
type EmployeeSoftDeletePayload = {
    employeeId: string;          // "EMP-001"
    action: "SOFT_DELETE";
    status: "INACTIVO";
    softDelete: true;
    requestedAt: string;         // ISO 8601
    source: "company-hr-employees";
};
```

```go
// internal/hr/model.go

type EmployeeSoftDeletePayload struct {
    EmployeeID  string `json:"employeeId"`
    Action      string `json:"action"`      // "SOFT_DELETE"
    Status      string `json:"status"`      // "INACTIVO"
    SoftDelete  bool   `json:"softDelete"`
    RequestedAt string `json:"requestedAt"` // ISO 8601
    Source      string `json:"source"`      // "company-hr-employees"
}
```

### 14.6 Métricas del directorio (calculadas, sin tabla propia)

```typescript
// Contadores que muestra la UI en las tres cards de resumen:
employees.length              // Total empleados
employees.filter(e => e.fileComplete).length          // Con expediente completo
employees.length - completeFiles                      // Con alerta documental
```

Queries backend equivalentes:

```sql
-- Total empleados activos de la empresa
SELECT COUNT(*) FROM hr_employees WHERE company_id = $1 AND soft_delete = false;

-- Con expediente completo
SELECT COUNT(*) FROM hr_employees WHERE company_id = $1 AND file_complete = true AND soft_delete = false;

-- Con alerta documental
SELECT COUNT(*) FROM hr_employees WHERE company_id = $1 AND file_complete = false AND soft_delete = false;
```

### 14.7 Endpoints HR (Echo)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/hr/employees` | Lista empleados de la empresa |
| `POST` | `/api/v1/hr/employees` | Crear empleado (genera ID EMP-NNN) |
| `GET` | `/api/v1/hr/employees/:id` | Ficha de un empleado |
| `PUT` | `/api/v1/hr/employees/:id` | Actualizar ficha |
| `PATCH` | `/api/v1/hr/employees/soft-delete` | Soft-delete batch (`[]EmployeeSoftDeletePayload`) |
| `GET` | `/api/v1/hr/positions` | Lista cargos de la empresa |
| `POST` | `/api/v1/hr/positions` | Crear cargo |
| `DELETE` | `/api/v1/hr/positions/:id` | Eliminar cargo |
| `POST` | `/api/v1/hr/positions/restore-defaults` | Restaurar cargos por defecto |
| `GET` | `/api/v1/hr/departments` | Lista departamentos de la empresa |
| `POST` | `/api/v1/hr/departments` | Crear departamento |
| `DELETE` | `/api/v1/hr/departments/:id` | Eliminar departamento |
| `POST` | `/api/v1/hr/departments/restore-defaults` | Restaurar departamentos por defecto |

---

## 15. Endpoints REST ACL (Echo)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/acl/modules` | Lista módulos con sus campos |
| `GET` | `/api/v1/acl/roles` | Lista roles de la empresa autenticada |
| `POST` | `/api/v1/acl/roles` | Crear rol + seed de permisos default |
| `PUT` | `/api/v1/acl/roles/:id` | Actualizar nombre / descripción |
| `DELETE` | `/api/v1/acl/roles/:id` | Eliminar rol |
| `GET` | `/api/v1/acl/roles/:id/permissions` | Permisos completos del rol (módulos + campos) |
| `PUT` | `/api/v1/acl/roles/:id/module-access` | Guardar toggles de módulos habilitados (bulk) |
| `PUT` | `/api/v1/acl/roles/:id/permissions` | Guardar scopes de acción por módulo (bulk) |
| `PUT` | `/api/v1/acl/roles/:id/field-permissions` | Guardar permisos de campo (bulk) |
| `GET` | `/api/v1/acl/roles/:id/users` | Usuarios bajo este rol |
| `POST` | `/api/v1/acl/users/:user_id/roles` | Asignar rol a usuario |
| `DELETE` | `/api/v1/acl/users/:user_id/roles/:role_id` | Remover rol de usuario |
| `PATCH` | `/api/v1/users/soft-delete` | Soft-delete en batch (payload: `[]UserSoftDeletePayload`) |

### Nota sobre el endpoint de soft-delete

El componente acumula los payloads en `pendingSoftDeletePayloads: UserSoftDeletePayload[]`
antes de enviarlos. Esto implica un **endpoint batch**, no individual:

```go
// Handler en Go
func (h *Handler) SoftDeleteUsers(c echo.Context) error {
    var payloads []UserSoftDeletePayload
    if err := c.Bind(&payloads); err != nil {
        return echo.ErrBadRequest
    }
    // procesar cada payload: marcar status = INACTIVE, soft_delete = true
    return c.JSON(http.StatusOK, map[string]int{"processed": len(payloads)})
}
```

---

## 16. Pendientes / decisiones abiertas

- [ ] **Múltiples roles por usuario:** soportado por `acl_user_roles`. Resolver conflicto si dos roles dan scopes distintos al mismo módulo (¿más permisivo gana? ¿el de mayor jerarquía?).
- [ ] **Scope `propio`:** ¿implica filtrado a nivel de fila en Postgres (RLS) o solo restricción de UI? Definir antes de implementar el middleware.
- [ ] **Caché de permisos:** evaluar JWT (estático) vs Redis con TTL corto (invalidable al cambiar permisos).
- [ ] **Auditoría:** considerar tabla `acl_audit_log` para registrar quién cambió qué permiso y cuándo.
- [ ] **Campos dinámicos:** ¿los campos de un módulo pueden variar por empresa o son siempre globales? Si varían, `acl_module_fields` necesita un `company_id` opcional.
- [ ] **Soft-delete definitivo:** definir si existe un job de limpieza que convierte `INACTIVE` en hard-delete después de N días.
