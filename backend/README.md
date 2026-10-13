# Backend ACL + HR (Go + Echo + PostgreSQL)

## Requisitos

- Go 1.24+
- PostgreSQL 15+

## Variables de entorno

- `DATABASE_URL` (recomendado)
- `PORT` (opcional, default `8080`)
- `JWT_SECRET` (recomendado)
- `AUTH_ADMIN_EMAIL` (opcional, default `admin@alfa.com`)
- `AUTH_ADMIN_PASSWORD` (opcional, default `1234`)
- `AUTH_ADMIN_NAME` (opcional)
- `AUTH_ADMIN_ROLE` (opcional)

Headers de request relevantes:

- `X-Company-Id` para segmentar reglas por empresa (default `demo-company`)
- `X-Client-Mac` opcional para evaluacion por MAC (si no llega, solo aplica coincidencia por IP)

Usando `.env` (recomendado):

```bash
cp .env.example .env
```

El servidor carga `.env` automaticamente al iniciar.

Ejemplo manual con `export`:

```bash
export DATABASE_URL='postgres://postgres:TU_PASSWORD@localhost:5432/pika?sslmode=disable'
export PORT=8080
export JWT_SECRET='cambia-esto-en-produccion'
export AUTH_ADMIN_EMAIL='admin@alfa.com'
export AUTH_ADMIN_PASSWORD='1234'
export AUTH_ADMIN_NAME='Administrador PIKA'
export AUTH_ADMIN_ROLE='admin'
```

## Crear base local (referencia)

```sql
CREATE DATABASE pika;
```

## Ejecutar servidor

```bash
go run ./cmd/server
```

## Endpoints principales

- `GET /health`
- `GET /api/v1/acl/modules`
- `GET /api/v1/acl/roles`
- `POST /api/v1/acl/roles`
- `PATCH /api/v1/users/soft-delete`
- `GET /api/v1/hr/employees`
- `PATCH /api/v1/hr/employees/soft-delete`
- `GET /api/v1/hr/positions`
- `GET /api/v1/hr/departments`
- `POST /api/v1/hr/catalogs/sync`
- `POST /api/v1/hr/catalogs/restore-defaults`
- `GET /api/v1/security/restrictions`
- `PUT /api/v1/security/restrictions`

## Reglas de seguridad avanzada

- Las reglas se evaluan globalmente en login y en todas las rutas protegidas por JWT.
- Si un usuario/rol tiene regla activa en `globalAccess`, puede entrar desde cualquier red.
- Si tiene reglas activas en `restrictedAccess`, debe coincidir con al menos una IP o MAC permitida.
- Si no existe ninguna regla para el usuario/rol, el acceso se permite por defecto.
