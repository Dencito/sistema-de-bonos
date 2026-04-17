# 🚀 Migración a Path-Based Multi-Tenancy

## ✅ Cambios Completados

### Backend
1. ✅ **Middleware `SetTenantFromPath`** creado
   - Extrae empresa del path URL
   - Configura prefijo de BD dinámicamente
   - Inyecta empresa en request

2. ✅ **Rutas actualizadas** (`routes/web.php`)
   - Todas las rutas ahora usan prefijo `{company}`
   - Rutas de autenticación fuera del prefijo

3. ✅ **CompanyController actualizado**
   - Eliminada lógica de sesiones
   - Método `getSelected()` usa path en lugar de sesión

4. ✅ **Middleware registrado** (`bootstrap/app.php`)
   - `SetTenantFromPath` agregado al grupo web

### Frontend
1. ✅ **Utilidades de tenant** (`Utils/tenant.js`)
   - `getCurrentCompany()` - Obtiene empresa del path
   - `companyUrl()` - Genera URLs con prefijo
   - `isCompany()` - Verifica empresa actual

2. ✅ **Helper de rutas** (`Utils/route-helper.js`)
   - `companyRoute()` - Genera rutas con empresa automáticamente

3. ✅ **Componentes actualizados**
   - `AppSideBar.jsx` - Usa `getCurrentCompany()`
   - `Links.jsx` - Usa `getCurrentCompany()`
   - `Dashboard.jsx` - Eliminada lógica de sesiones

---

## 🔧 Tareas Pendientes

### 1. Actualizar Todos los Componentes Frontend

Buscar y reemplazar en **TODOS** los archivos `.jsx`:

```javascript
// ❌ ANTES
function getSubdomain() {
  var host = document.location.host;
  var partes = host.split('.');
  return partes[0];
}

// ✅ DESPUÉS
import { getCurrentCompany } from '@/Utils/tenant';
const currentCompany = getCurrentCompany();
```

**Archivos a revisar:**
- `resources/js/Pages/**/*.jsx`
- `resources/js/Components/**/*.jsx`

### 2. Actualizar Llamadas a `route()`

Reemplazar todas las llamadas a `route()` con `companyRoute()`:

```javascript
// ❌ ANTES
import { router } from '@inertiajs/react';
router.visit(route('dashboard'));

// ✅ DESPUÉS
import { companyRoute } from '@/Utils/route-helper';
router.visit(companyRoute('dashboard'));
```

### 3. Actualizar Links de Inertia

```jsx
// ❌ ANTES
<Link href={route('users.index')}>Usuarios</Link>

// ✅ DESPUÉS
<Link href={companyRoute('users.index')}>Usuarios</Link>
```

### 4. Eliminar localStorage de Empresa

Buscar y eliminar:
```javascript
// ❌ ELIMINAR
window.localStorage.setItem('companySelect', ...);
window.localStorage.getItem('companySelect');
```

### 5. Actualizar Servicios API

En `resources/js/Services/api.js` y otros servicios:

```javascript
// ❌ ANTES
axios.get('/api/users')

// ✅ DESPUÉS
import { getCurrentCompany } from '@/Utils/tenant';
const company = getCurrentCompany();
axios.get(`/${company}/api/users`)
```

### 6. Actualizar Redirecciones después de Login

En `routes/auth.php` o donde manejes el login:

```php
// ❌ ANTES
return redirect()->route('dashboard');

// ✅ DESPUÉS
$company = $user->company->name; // o como obtengas la empresa del usuario
return redirect()->route('dashboard', ['company' => $company]);
```

### 7. Eliminar Creación de Subdominios

En `CompanyController.php`:

```php
// ❌ ELIMINAR estas líneas
if(env("APP_ENV") === "prod") {
    $this->godaddyService->createSubdomain($slug);
    $this->cpanelService->createSubdomain($slug);
}
```

### 8. Actualizar .env

```env
# ❌ ELIMINAR
SESSION_DOMAIN=.tudominio.com
APP_PRIMARY_SUBDOMAIN=empresa1

# ✅ AGREGAR (opcional)
TENANT_PATH_ENABLED=true
```

### 9. Actualizar Rutas API

En `routes/api.php`, agregar prefijo si es necesario:

```php
Route::prefix('{company}')->group(function () {
    // Rutas API que requieren tenant
});
```

### 10. Testing

Crear tests para verificar:
- ✅ Middleware extrae empresa correctamente
- ✅ BD se configura con prefijo correcto
- ✅ Rutas generan URLs correctas
- ✅ Redirecciones funcionan

---

## 📝 Ejemplos de Uso

### Generar URL con Empresa

```javascript
import { companyRoute } from '@/Utils/route-helper';

// Genera: /empresa1/users
const url = companyRoute('users.index');

// Genera: /empresa1/users/123
const url = companyRoute('users.show', { id: 123 });
```

### Obtener Empresa Actual

```javascript
import { getCurrentCompany } from '@/Utils/tenant';

const company = getCurrentCompany(); // 'empresa1'
```

### Verificar Empresa

```javascript
import { isCompany } from '@/Utils/tenant';

if (isCompany('tickets')) {
  // Lógica específica para empresa 'tickets'
}
```

---

## 🎯 Estructura de URLs

### Antes (Subdominios)
```
empresa1.tudominio.com/dashboard
empresa1.tudominio.com/users
empresa2.tudominio.com/tickets
```

### Después (Path-Based)
```
tudominio.com/empresa1/dashboard
tudominio.com/empresa1/users
tudominio.com/empresa2/tickets
```

---

## ⚠️ Consideraciones Importantes

1. **Migración Gradual**: Puedes mantener ambos sistemas temporalmente
2. **Redirecciones**: Configurar redirects de subdominios a paths
3. **SEO**: Actualizar sitemaps y robots.txt
4. **Cache**: Limpiar cache de rutas: `php artisan route:clear`
5. **Sessions**: Limpiar sesiones antiguas

---

## 🔍 Comandos Útiles

```bash
# Limpiar cache
php artisan cache:clear
php artisan route:clear
php artisan config:clear

# Ver rutas
php artisan route:list

# Buscar referencias a subdominios
grep -r "getSubdomain" resources/js/
grep -r "companySelect" resources/js/
grep -r "session.*company" app/
```

---

## 📚 Recursos

- [Laravel Multi-Tenancy](https://laravel.com/docs/multi-tenancy)
- [Inertia.js Routing](https://inertiajs.com/routing)
- [Path-based vs Subdomain Tenancy](https://tenancyforlaravel.com/docs/v3/tenant-identification/)

---

## ✨ Beneficios de Path-Based Tenancy

1. ✅ **No requiere DNS** - Más rápido de configurar
2. ✅ **Más simple** - Menos configuración de servidor
3. ✅ **Mejor para desarrollo** - Funciona en localhost
4. ✅ **Sin problemas de sesiones** - Cada empresa tiene su path
5. ✅ **Más escalable** - Fácil agregar nuevas empresas
6. ✅ **SEO friendly** - Mejor para motores de búsqueda
