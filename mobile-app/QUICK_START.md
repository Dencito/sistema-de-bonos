# 🚀 Inicio Rápido - Pasillera Mobile

## Para Desarrollo (5 minutos)

### 1. Instalar dependencias
```bash
cd mobile-app
npm install
```

### 2. Configurar API
```bash
cp .env.example .env
```

Edita `.env` y cambia la URL:
```
VITE_API_URL=http://localhost:8000/api/mobile
```

### 3. Probar en navegador
```bash
npm run dev
```

Abre http://localhost:3001

**Credenciales de prueba:**
- Username: trabajador01
- Password: tu_password

---

## Para Android (Primera vez)

### 1. Instalar Android Studio
Descarga de: https://developer.android.com/studio

### 2. Configurar API para Android
Edita `.env`:
```
# Para emulador Android
VITE_API_URL=http://10.0.2.2:8000/api/mobile

# Para dispositivo físico (usa tu IP local)
VITE_API_URL=http://192.168.1.X:8000/api/mobile
```

### 3. Inicializar Capacitor
```bash
npx cap init
```
- App name: **Pasillera**
- App ID: **com.casino.pasillera**
- Web directory: **dist**

### 4. Agregar plataforma Android
```bash
npx cap add android
```

### 5. Compilar y abrir
```bash
npm run android
```

Esto abrirá Android Studio. Presiona el botón ▶️ para ejecutar.

---

## Para iOS (Primera vez - Solo macOS)

### 1. Instalar Xcode
Descarga de: Mac App Store

### 2. Configurar API para iOS
Edita `.env`:
```
# Para simulador iOS (usa tu IP local)
VITE_API_URL=http://192.168.1.X:8000/api/mobile
```

### 3. Agregar plataforma iOS
```bash
npx cap add ios
```

### 4. Compilar y abrir
```bash
npm run ios
```

Esto abrirá Xcode. Presiona el botón ▶️ para ejecutar.

---

## Comandos Útiles

```bash
# Desarrollo web
npm run dev

# Compilar para producción
npm run build

# Sincronizar cambios con plataformas nativas
npm run sync

# Abrir Android Studio
npx cap open android

# Abrir Xcode
npx cap open ios
```

---

## Solución Rápida de Problemas

### ❌ Error de conexión a API
1. Verifica que el backend Laravel esté corriendo
2. Verifica la URL en `.env`
3. Para Android emulador, usa `10.0.2.2` no `localhost`

### ❌ Error "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### ❌ Error en Android
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### ❌ Error en iOS
```bash
cd ios/App
pod install
cd ../..
npx cap sync ios
```

---

## 📱 Flujo de Uso

1. **Login** - Ingresa con tu email y contraseña
2. **Dashboard** - Ve tu balance disponible
3. **Registrar Gasto** - Selecciona máquina y monto
4. **Historial** - Revisa tus transacciones

---

## 🔑 Usuarios de Prueba

Solo usuarios con rol **trabajador** (role_id 5 o 6) pueden usar la app móvil.

Asegúrate de tener un usuario trabajador creado en el sistema.

---

## 📞 ¿Necesitas Ayuda?

Revisa el archivo `README.md` para documentación completa.
