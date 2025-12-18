# Pasillera Mobile App

Aplicación móvil para el sistema de gestión de pasilleras del casino. Desarrollada con React + Capacitor.

## 🚀 Características

- ✅ Autenticación con email/password
- ✅ Dashboard con balance en tiempo real
- ✅ Registro de gastos por máquina
- ✅ Historial de transacciones
- ✅ Feedback háptico
- ✅ Diseño responsive y optimizado para móviles
- ✅ Soporte para Android e iOS

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Android Studio (para desarrollo Android)
- Xcode (para desarrollo iOS, solo en macOS)

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
cd mobile-app
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura la URL de tu API:

```bash
cp .env.example .env
```

Edita `.env`:
```
VITE_API_URL=http://tu-servidor.com/api/mobile
```

**Importante para desarrollo local:**
- Si estás probando en un emulador Android, usa: `http://10.0.2.2:8000/api/mobile`
- Si estás probando en un dispositivo físico, usa la IP de tu computadora: `http://192.168.1.X:8000/api/mobile`

### 3. Inicializar Capacitor

```bash
npx cap init
```

Cuando te pregunte:
- **App name**: Pasillera
- **App ID**: com.casino.pasillera
- **Web directory**: dist

### 4. Agregar plataformas

```bash
# Para Android
npx cap add android

# Para iOS (solo en macOS)
npx cap add ios
```

## 🏃 Desarrollo

### Modo Web (desarrollo rápido)

```bash
npm run dev
```

Abre http://localhost:3001 en tu navegador.

### Modo Android

```bash
# Compilar y sincronizar
npm run android

# O manualmente:
npm run build
npx cap sync android
npx cap open android
```

Esto abrirá Android Studio. Desde ahí puedes:
1. Conectar un dispositivo físico o iniciar un emulador
2. Presionar el botón "Run" (▶️)

### Modo iOS (solo macOS)

```bash
# Compilar y sincronizar
npm run ios

# O manualmente:
npm run build
npx cap sync ios
npx cap open ios
```

Esto abrirá Xcode. Desde ahí puedes:
1. Seleccionar un simulador o dispositivo
2. Presionar el botón "Run" (▶️)

## 📱 Estructura del Proyecto

```
mobile-app/
├── src/
│   ├── pages/              # Pantallas de la app
│   │   ├── Login.jsx       # Pantalla de inicio de sesión
│   │   ├── Dashboard.jsx   # Dashboard principal
│   │   ├── RegisterExpense.jsx  # Registro de gastos
│   │   └── History.jsx     # Historial de transacciones
│   ├── contexts/           # Contextos de React
│   │   └── AuthContext.jsx # Manejo de autenticación
│   ├── services/           # Servicios API
│   │   └── api.js          # Cliente API y servicios
│   ├── App.jsx             # Componente principal
│   ├── main.jsx            # Punto de entrada
│   └── index.css           # Estilos globales
├── capacitor.config.json   # Configuración de Capacitor
├── vite.config.js          # Configuración de Vite
└── package.json            # Dependencias
```

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo web
- `npm run build` - Compila la aplicación para producción
- `npm run preview` - Preview de la build de producción
- `npm run android` - Compila y abre en Android Studio
- `npm run ios` - Compila y abre en Xcode
- `npm run sync` - Sincroniza código web con plataformas nativas
- `npm run copy` - Copia archivos web a plataformas nativas

## 🔐 Autenticación

La app usa Laravel Sanctum para autenticación:

1. El usuario ingresa email y password
2. Se envía a `/api/mobile/login`
3. El backend retorna un token
4. El token se guarda en Capacitor Preferences
5. Todas las peticiones subsecuentes incluyen el token en el header `Authorization`

## 📡 API Endpoints Utilizados

- `POST /api/mobile/login` - Iniciar sesión
- `POST /api/mobile/logout` - Cerrar sesión
- `GET /api/mobile/me` - Obtener usuario autenticado
- `GET /api/mobile/pasillera/my-active` - Obtener pasillera activa
- `POST /api/mobile/pasillera/expense` - Registrar gasto
- `GET /api/mobile/pasillera/balance` - Obtener balance
- `GET /api/mobile/pasillera/history` - Obtener historial
- `GET /api/mobile/pasillera/machines` - Obtener lista de máquinas

## 🎨 Personalización

### Colores

Los colores principales se configuran en `tailwind.config.js`:

```js
colors: {
  primary: {
    500: '#0ea5e9',  // Color principal
    600: '#0284c7',  // Color hover
    700: '#0369a1',  // Color active
  },
}
```

### Icono y Splash Screen

1. Reemplaza los iconos en:
   - `android/app/src/main/res/` (varios tamaños)
   - `ios/App/App/Assets.xcassets/` (varios tamaños)

2. Configura el splash screen en `capacitor.config.json`

## 🐛 Troubleshooting

### Error de conexión a la API

Si ves errores de red:
1. Verifica que el backend esté corriendo
2. Verifica la URL en `.env`
3. Para Android emulador, usa `10.0.2.2` en lugar de `localhost`
4. Para dispositivo físico, asegúrate de estar en la misma red WiFi

### Error al compilar Android

```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Error al compilar iOS

```bash
cd ios/App
pod install
cd ../..
npx cap sync ios
```

### Limpiar todo y empezar de nuevo

```bash
rm -rf node_modules
rm -rf android
rm -rf ios
npm install
npx cap add android
npx cap add ios
```

## 📦 Build para Producción

### Android APK

1. Abre Android Studio
2. Build > Generate Signed Bundle / APK
3. Sigue el wizard para crear/usar una keystore
4. El APK estará en `android/app/release/`

### iOS App Store

1. Abre Xcode
2. Product > Archive
3. Sigue el proceso de distribución de Apple

## 🔒 Seguridad

- Los tokens se almacenan de forma segura usando Capacitor Preferences
- Las contraseñas nunca se almacenan localmente
- Todas las peticiones usan HTTPS en producción
- Los tokens expiran y requieren re-login

## 📄 Licencia

Propiedad del Casino - Uso interno solamente

## 👥 Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.
