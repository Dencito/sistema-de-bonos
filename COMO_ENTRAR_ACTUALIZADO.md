# 🔐 Cómo Entrar al Sistema - Path-Based Multi-Tenancy

## ✅ **3 Formas de Entrar**

---

## **Opción 1: Login Simple (Empresa por Defecto)** ⭐ Recomendado

```
http://localhost/login
```

1. Ingresa usuario y contraseña
2. **Deja el campo "Empresa" vacío**
3. El sistema te redirige a tu empresa por defecto

**Resultado:**
```
→ http://localhost/{tu-empresa-por-defecto}/
```

---

## **Opción 2: Login con Empresa Específica** 🎯

```
http://localhost/login
```

1. Ingresa usuario y contraseña
2. **Escribe el nombre de la empresa** en el campo "Empresa"
   - Ejemplo: `888spa`
   - Ejemplo: `tickets`
3. El sistema te redirige a esa empresa

**Resultado:**
```
→ http://localhost/888spa/
→ http://localhost/tickets/
```

---

## **Opción 3: URL con Empresa Pre-seleccionada** 🚀

```
http://localhost/{empresa}/login
```

Ejemplos:
```
http://localhost/888spa/login
http://localhost/tickets/login
```

1. La empresa se detecta automáticamente de la URL
2. El campo "Empresa" se llena solo
3. Solo ingresas usuario y contraseña

**Resultado:**
```
→ http://localhost/888spa/
→ http://localhost/tickets/
```

---

## 📋 **Estructura Completa de URLs**

### **Login (Público)**
```
/login                    → Login genérico
/{empresa}/login          → Login pre-seleccionado para empresa
```

### **Dashboard (Privado)**
```
/{empresa}/               → Dashboard
/{empresa}/users          → Usuarios
/{empresa}/branches       → Sucursales
/{empresa}/tickets        → Tickets
```

---

## 🎯 **Ejemplos Prácticos**

### **Ejemplo 1: Usuario con Empresa por Defecto**
```
1. Ir a: http://localhost/login
2. Usuario: admin
3. Contraseña: ****
4. Empresa: (dejar vacío)
5. → Redirige a: http://localhost/888spa/
```

### **Ejemplo 2: Cambiar de Empresa**
```
1. Ir a: http://localhost/login
2. Usuario: admin
3. Contraseña: ****
4. Empresa: tickets
5. → Redirige a: http://localhost/tickets/
```

### **Ejemplo 3: URL Directa**
```
1. Ir a: http://localhost/tickets/login
2. Usuario: admin
3. Contraseña: ****
4. Empresa: (ya detectada: tickets)
5. → Redirige a: http://localhost/tickets/
```

---

## ⚙️ **Cómo Funciona Internamente**

### **Flujo del Login**

```
1. Usuario ingresa credenciales
   ↓
2. Frontend envía: { login, password, company }
   ↓
3. Backend valida credenciales
   ↓
4. Backend determina empresa:
   - Si viene "company" en request → usa esa
   - Si no → usa user.company_id (empresa por defecto)
   ↓
5. Redirige a: /{empresa}/
```

### **Código Backend**
```php
// AuthenticatedSessionController.php
$companyName = $request->input('company') ?? $this->getDefaultCompany($user);
return redirect("/{$companyName}/");
```

### **Código Frontend**
```javascript
// Login.jsx
const response = await authService.login({
  login,
  password,
  company: company || companyFromUrl
});
```

---

## 🔧 **Configuración de Usuario**

Cada usuario debe tener una **empresa por defecto**:

```sql
-- Ver empresa del usuario
SELECT id, username, company_id FROM users WHERE username = 'admin';

-- Asignar empresa por defecto
UPDATE users SET company_id = 1 WHERE id = 123;
```

**Importante:** Si `company_id` es NULL, el usuario **debe** especificar la empresa en el login.

---

## 🐛 **Solución de Problemas**

### **Error: "No se pudo determinar la empresa"**

**Causa:** Usuario sin `company_id` y no especificó empresa en login.

**Solución:**
1. Asignar `company_id` al usuario:
   ```sql
   UPDATE users SET company_id = 1 WHERE id = {user_id};
   ```
2. O especificar empresa en el login

### **Redirige a empresa incorrecta**

**Causa:** El campo "Empresa" tiene un valor incorrecto.

**Solución:**
1. Verificar que el nombre de la empresa sea correcto
2. Ver empresas disponibles:
   ```sql
   SELECT id, name FROM companies;
   ```

### **Campo "Empresa" no aparece**

**Causa:** Caché del navegador.

**Solución:**
1. Limpiar caché: `Ctrl + Shift + R`
2. O abrir en ventana incógnita

---

## 💡 **Tips y Mejores Prácticas**

### **1. Bookmark por Empresa**
```
Favorito 1: http://localhost/888spa/
Favorito 2: http://localhost/tickets/
```

### **2. Múltiples Sesiones**
Puedes tener **múltiples tabs** abiertas con diferentes empresas:
```
Tab 1: http://localhost/888spa/users
Tab 2: http://localhost/tickets/dashboard
```

### **3. Desarrollo Local**
```
# No necesitas configurar nada especial
http://localhost/cualquier-empresa/
```

### **4. URLs Limpias**
```
✅ localhost/888spa/users
❌ 888spa.localhost/users (ya no)
```

---

## 🚀 **Ventajas del Nuevo Sistema**

| Característica | Antes (Subdominios) | Ahora (Paths) |
|----------------|---------------------|---------------|
| **Configuración DNS** | ✅ Requerida | ❌ No necesaria |
| **Localhost** | ⚠️ Complicado | ✅ Simple |
| **Cambiar empresa** | 🔄 Nuevo login | ✅ Solo cambiar URL |
| **Múltiples empresas** | ⚠️ Subdominios | ✅ Tabs |
| **URLs** | `empresa.dom.com` | `dom.com/empresa` |

---

## 📝 **Resumen Rápido**

**Para entrar:**
1. Ve a `/login`
2. Ingresa credenciales
3. (Opcional) Especifica empresa
4. ✨ Listo!

**URLs importantes:**
- Login: `/login` o `/{empresa}/login`
- Dashboard: `/{empresa}/`
- Cualquier ruta: `/{empresa}/ruta`

**¿Problemas?**
- Verifica que el usuario tenga `company_id`
- Limpia cache: `php artisan route:clear`
- Revisa logs: `storage/logs/laravel.log`

---

## 🎉 **¡Eso es Todo!**

El sistema ahora es **más simple, más rápido y más flexible**.

¿Dudas? Revisa los logs o contacta al equipo de desarrollo.
