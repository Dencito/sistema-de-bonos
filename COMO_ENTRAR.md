# 🔐 Cómo Entrar al Sistema (Path-Based Tenancy)

## ✅ **Sistema Actualizado**

El sistema ahora usa **paths en lugar de subdominios** para multi-tenancy.

---

## 🚀 **Formas de Entrar**

### **1. Login Normal (Recomendado)**

```
http://localhost/login
```

o

```
http://tudominio.com/login
```

**Después del login exitoso**, el sistema automáticamente te redirige a:
```
http://localhost/{nombre-empresa}/
http://tudominio.com/{nombre-empresa}/
```

Donde `{nombre-empresa}` se obtiene automáticamente de tu usuario.

---

### **2. URL Directa (Si ya estás autenticado)**

```
http://localhost/888spa/dashboard
http://localhost/tickets/users
http://localhost/{empresa}/cualquier-ruta
```

---

## 🔧 **Cómo Funciona el Login**

1. **Entras a `/login`**
2. **Ingresas credenciales**
3. **Sistema valida usuario**
4. **Sistema obtiene tu empresa** (de `user.company_id`)
5. **Redirección automática** a `/{empresa}/`

---

## 📋 **Estructura de URLs**

### **Rutas Públicas (Sin Empresa)**
```
/login
/register
/forgot-password
/reset-password
```

### **Rutas Privadas (Con Empresa)**
```
/{empresa}/                    → Dashboard
/{empresa}/users               → Usuarios
/{empresa}/branches            → Sucursales
/{empresa}/tickets             → Tickets
/{empresa}/fingerprint-logs    → Registros de Huella
/{empresa}/shifts              → Turnos
/{empresa}/reports             → Reportes
```

---

## ⚙️ **Configuración del Usuario**

Para que el login funcione correctamente, cada usuario debe tener:

```php
// En la tabla users
company_id → ID de la empresa (REQUERIDO)
branch_id  → ID de la sucursal (opcional)
```

### **Verificar en Base de Datos**

```sql
-- Ver empresa del usuario
SELECT id, username, company_id FROM users WHERE username = 'tu_usuario';

-- Ver nombre de la empresa
SELECT id, name FROM companies WHERE id = {company_id};
```

---

## 🐛 **Solución de Problemas**

### **Error: "No se pudo determinar tu empresa"**

**Causa:** El usuario no tiene `company_id` asignado.

**Solución:**
```sql
UPDATE users SET company_id = 1 WHERE id = {user_id};
```

### **Error 404 después del login**

**Causa:** La ruta no existe o el middleware no está funcionando.

**Solución:**
1. Verificar que el middleware está registrado en `bootstrap/app.php`
2. Limpiar cache de rutas: `php artisan route:clear`
3. Ver rutas disponibles: `php artisan route:list`

### **Redirección infinita**

**Causa:** El middleware está aplicándose a rutas de auth.

**Solución:**
Verificar que las rutas de auth están **fuera** del grupo `{company}` en `routes/web.php`

---

## 🧪 **Testing**

### **1. Verificar Middleware**
```bash
php artisan route:list | grep dashboard
```

Deberías ver:
```
GET|HEAD  {company}/ .......................... dashboard
```

### **2. Test Manual**

1. Ir a `/login`
2. Ingresar credenciales
3. Verificar que redirige a `/{empresa}/`
4. Verificar que puedes navegar a `/{empresa}/users`, etc.

### **3. Verificar Logs**

```bash
tail -f storage/logs/laravel.log
```

Buscar:
```
Usuario autenticado correctamente
Redirigiendo al usuario después de login exitoso
company: nombre_empresa
```

---

## 📝 **Ejemplos de Uso**

### **Empresa: 888spa**
```
Login: http://localhost/login
Dashboard: http://localhost/888spa/
Usuarios: http://localhost/888spa/users
Tickets: http://localhost/888spa/tickets
```

### **Empresa: tickets**
```
Login: http://localhost/login
Dashboard: http://localhost/tickets/
Usuarios: http://localhost/tickets/users
```

---

## 🔄 **Migración desde Subdominios**

Si antes usabas:
```
❌ 888spa.tudominio.com/dashboard
```

Ahora usa:
```
✅ tudominio.com/888spa/dashboard
```

**El login sigue siendo el mismo:**
```
tudominio.com/login
```

---

## 💡 **Tips**

1. **Bookmark**: Guarda `/{empresa}/` en favoritos para acceso rápido
2. **Múltiples empresas**: Puedes tener múltiples tabs abiertas con diferentes empresas
3. **Desarrollo local**: Funciona perfectamente en localhost sin configuración adicional
4. **Sin DNS**: No necesitas configurar subdominios en tu archivo hosts

---

## 🆘 **Soporte**

Si tienes problemas:

1. Verificar logs: `storage/logs/laravel.log`
2. Verificar que el usuario tiene `company_id`
3. Limpiar cache: `php artisan cache:clear && php artisan route:clear`
4. Verificar middleware en `bootstrap/app.php`

---

## ✨ **Ventajas del Nuevo Sistema**

✅ **Más simple** - No más configuración de DNS
✅ **Más rápido** - Sin propagación de DNS
✅ **Mejor desarrollo** - Funciona en localhost
✅ **URLs limpias** - Más fáciles de compartir
✅ **Sin sesiones** - Menos problemas de estado
