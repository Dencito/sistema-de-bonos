# 📱 Sistema de Pasillera Mobile

Sistema mobile para gestión de gastos de pasillera, optimizado para ser usado con Capacitor.

## 🎯 Funcionalidades

### Dashboard Web (Administrador)
- ✅ Asignar montos iniciales a pasilleras
- ✅ Crear y gestionar pasilleras por usuario
- ✅ Ver reportes y estadísticas
- ✅ Cerrar turnos y balances

### App Mobile (Trabajador)
- ✅ Ver saldo disponible en tiempo real
- ✅ Registrar gastos por máquina
- ✅ Historial de transacciones
- ✅ Interfaz táctil optimizada
- ✅ Validación de saldo antes de registrar

## 🚀 Acceso Rápido

**URL Mobile:** `https://tu-dominio.com/pasillera`

Los trabajadores pueden acceder directamente desde el navegador móvil o instalar la app con Capacitor.

## 📦 Integración con Capacitor

### Opción 1: Usar la URL directamente (Más Rápido)

1. **Instalar Capacitor en tu proyecto:**

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

2. **Configurar `capacitor.config.json`:**

```json
{
  "appId": "com.tuempresa.pasillera",
  "appName": "Pasillera Mobile",
  "webDir": "public",
  "server": {
    "url": "https://tu-dominio.com/pasillera",
    "cleartext": true
  },
  "android": {
    "allowMixedContent": true
  }
}
```

3. **Agregar plataformas:**

```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

4. **Abrir en Android Studio / Xcode:**

```bash
npx cap open android
npx cap open ios
```

### Opción 2: Build completo con assets locales

1. **Crear build de producción:**

```bash
npm run build
```

2. **Configurar `capacitor.config.json`:**

```json
{
  "appId": "com.tuempresa.pasillera",
  "appName": "Pasillera Mobile",
  "webDir": "public/build",
  "bundledWebRuntime": false
}
```

3. **Sincronizar y abrir:**

```bash
npx cap sync
npx cap open android
```

## 🔐 Autenticación

La app usa la sesión de Laravel existente. Los usuarios deben:

1. Iniciar sesión en el sistema web
2. Acceder a `/pasillera` desde mobile
3. La sesión se mantiene automáticamente

### Para Capacitor (Sesión Persistente):

Instalar plugin de cookies:

```bash
npm install @capacitor/preferences
```

## 📱 Plugins Capacitor Recomendados

### Básicos (Ya funcionan sin plugins)
- ✅ HTTP Requests
- ✅ Storage (LocalStorage)
- ✅ Sesiones

### Opcionales (Para funcionalidades extra)

```bash
# Scanner QR para máquinas
npm install @capacitor-community/barcode-scanner

# Notificaciones push
npm install @capacitor/push-notifications

# Geolocalización
npm install @capacitor/geolocation

# Cámara para evidencias
npm install @capacitor/camera

# Haptic feedback
npm install @capacitor/haptics
```

## 🎨 Personalización UI Mobile

El componente está en:
```
resources/js/Pages/Mobile/Pasillera/Index.jsx
```

### Colores principales:
- Gradiente: `#667eea` → `#764ba2`
- Éxito: `#52c41a`
- Advertencia: `#faad14`
- Peligro: `#ff4d4f`

### Responsive:
- Optimizado para pantallas 360px - 428px
- Touch targets mínimo 44px
- Fuentes escalables

## 🔧 API Endpoints

### GET `/pasillera/api/my-active`
Obtiene la pasillera activa del usuario autenticado.

**Response:**
```json
{
  "success": true,
  "data": {
    "pasillera": {
      "id": 1,
      "initial_balance": 100000,
      "current_balance": 75000,
      "total_payments": 25000,
      "is_active": true,
      "transactions": [...]
    }
  }
}
```

### POST `/pasillera/api/expense`
Registra un nuevo gasto.

**Request:**
```json
{
  "amount": 5000,
  "machine": "M001",
  "description": "Reparación urgente"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gasto registrado correctamente",
  "data": {
    "pasillera": {...},
    "transaction": {...}
  }
}
```

### GET `/pasillera/api/history`
Obtiene historial de gastos (últimos 50).

### GET `/pasillera/api/machines`
Lista de máquinas disponibles.

### GET `/pasillera/api/balance`
Saldo actual simplificado.

## 🔒 Seguridad

- ✅ Autenticación requerida (middleware `auth`)
- ✅ Validación de saldo antes de registrar
- ✅ Transacciones con DB::transaction
- ✅ Validación de permisos por usuario
- ✅ CSRF protection

## 📊 Flujo de Trabajo

### Administrador (Dashboard Web)
1. Inicia turno en `/cash-management`
2. Crea pasillera para trabajador
3. Asigna monto inicial
4. Trabajador recibe notificación

### Trabajador (Mobile)
1. Abre app `/pasillera`
2. Ve su saldo disponible
3. Selecciona máquina
4. Ingresa monto del gasto
5. Confirma transacción
6. Saldo se actualiza en tiempo real

### Cierre (Dashboard Web)
1. Administrador revisa gastos
2. Cierra pasillera
3. Cierra turno
4. Genera reporte

## 🧪 Testing

### Probar en navegador móvil:
```
https://tu-dominio.com/pasillera
```

### Probar con Chrome DevTools:
1. F12 → Toggle device toolbar
2. Seleccionar dispositivo móvil
3. Navegar a `/pasillera`

### Probar en dispositivo real:
1. Conectar dispositivo por USB
2. Habilitar depuración USB
3. `npx cap run android`

## 🐛 Troubleshooting

### "No tienes una pasillera activa"
- Verificar que el administrador haya creado la pasillera
- Verificar que `is_active = true` en la BD
- Verificar que el usuario esté autenticado

### "Error al cargar datos"
- Verificar conexión a internet
- Verificar que las rutas estén registradas
- Revisar logs de Laravel: `storage/logs/laravel.log`

### Sesión expira en mobile
- Aumentar `SESSION_LIFETIME` en `.env`
- Usar Capacitor Preferences para persistencia
- Implementar refresh token

## 📝 Notas Importantes

1. **Permisos**: Solo usuarios con `role_id` 5 o 6 (trabajadores) pueden tener pasilleras
2. **Una pasillera por usuario**: Un trabajador solo puede tener una pasillera activa a la vez
3. **Saldo en tiempo real**: El saldo se actualiza inmediatamente después de cada gasto
4. **Offline**: Actualmente requiere conexión. Para modo offline, implementar Service Worker

## 🚀 Próximas Mejoras

- [ ] Modo offline con sincronización
- [ ] Scanner QR para máquinas
- [ ] Notificaciones push
- [ ] Firma digital para confirmación
- [ ] Fotos de evidencia
- [ ] Geolocalización de gastos
- [ ] Exportar PDF de gastos
- [ ] Dark mode

## 📞 Soporte

Para problemas o consultas, contactar al equipo de desarrollo.

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2024
