Inventario de Funciones: ACL Handler
1. NewHandler
Descripción: Constructor que inicializa el controlador de acceso.

Qué puedes hacer: Crear una instancia del handler inyectándole el servicio de lógica de negocio para empezar a procesar peticiones.

2. RegisterRoutes
Descripción: Registrador de rutas principales de seguridad.

Qué puedes hacer: Definir todos los puntos de acceso (endpoints) para la gestión de módulos, roles y permisos en el router de Echo.

3. RegisterUserRoutes
Descripción: Registrador de rutas administrativas de usuarios.

Qué puedes hacer: Habilitar endpoints específicos para acciones sobre cuentas de usuario, como la eliminación lógica.

4. listModules
Descripción: Listado de módulos del sistema.

Qué puedes hacer: Obtener un catálogo de todas las áreas o funcionalidades del backend que están bajo el control de permisos.

5. listRoles
Descripción: Listado de roles por empresa.

Qué puedes hacer: Consultar qué perfiles de seguridad (ej: "Admin", "Vendedor") existen dentro de una organización específica.

6. createRole
Descripción: Creador de nuevos roles.

Qué puedes hacer: Registrar un nuevo perfil de seguridad validando que el nombre sea único y cumpla con las reglas de longitud de la empresa.

7. getRolePermissions
Descripción: Consultor de permisos de un rol.

Qué puedes hacer: Leer exactamente qué acciones tiene permitidas un rol específico (usando su ID) sobre los distintos módulos.

8. updateRolePermissions
Descripción: Actualizador de matriz de permisos.

Qué puedes hacer: Modificar masivamente lo que un rol puede ver, crear o editar, validando que los módulos y acciones existan en el sistema.

9. softDeleteUsers
Descripción: Borrado lógico de usuarios.

Qué puedes hacer: Desactivar múltiples usuarios a la vez sin eliminarlos permanentemente de la base de datos, manteniendo la integridad referencial.