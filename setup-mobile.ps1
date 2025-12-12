# Setup Mobile Pasillera con Capacitor
# PowerShell Script para Windows

Write-Host "🚀 Configurando Pasillera Mobile con Capacitor..." -ForegroundColor Cyan
Write-Host ""

# Verificar si Node.js está instalado
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado. Por favor instala Node.js primero." -ForegroundColor Red
    Write-Host "Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Instalar Capacitor
Write-Host "📦 Instalando Capacitor..." -ForegroundColor Cyan
npm install @capacitor/core @capacitor/cli --save-dev

# Inicializar Capacitor
Write-Host "🔧 Inicializando Capacitor..." -ForegroundColor Cyan
npx cap init

# Instalar plataformas
Write-Host ""
Write-Host "📱 ¿Qué plataforma deseas instalar?" -ForegroundColor Yellow
Write-Host "1) Android"
Write-Host "2) iOS (requiere macOS)"
Write-Host "3) Ambas"
$platform = Read-Host "Selecciona una opción (1-3)"

switch ($platform) {
    "1" {
        Write-Host "📱 Instalando Android..." -ForegroundColor Cyan
        npm install @capacitor/android
        npx cap add android
    }
    "2" {
        if ($IsMacOS) {
            Write-Host "📱 Instalando iOS..." -ForegroundColor Cyan
            npm install @capacitor/ios
            npx cap add ios
        } else {
            Write-Host "⚠️  iOS solo está disponible en macOS" -ForegroundColor Yellow
        }
    }
    "3" {
        Write-Host "📱 Instalando Android..." -ForegroundColor Cyan
        npm install @capacitor/android
        npx cap add android
        
        if ($IsMacOS) {
            Write-Host "📱 Instalando iOS..." -ForegroundColor Cyan
            npm install @capacitor/ios
            npx cap add ios
        } else {
            Write-Host "⚠️  iOS solo está disponible en macOS (solo se instaló Android)" -ForegroundColor Yellow
        }
    }
    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
        exit 1
    }
}

# Instalar plugins opcionales
Write-Host ""
Write-Host "🔌 ¿Deseas instalar plugins adicionales?" -ForegroundColor Yellow
Write-Host "1) Solo básicos (HTTP, Storage)"
Write-Host "2) Con scanner QR"
Write-Host "3) Con notificaciones push"
Write-Host "4) Todos los plugins"
$plugins = Read-Host "Selecciona una opción (1-4)"

switch ($plugins) {
    "2" {
        Write-Host "📷 Instalando scanner QR..." -ForegroundColor Cyan
        npm install @capacitor-community/barcode-scanner
    }
    "3" {
        Write-Host "🔔 Instalando notificaciones push..." -ForegroundColor Cyan
        npm install @capacitor/push-notifications
    }
    "4" {
        Write-Host "🔌 Instalando todos los plugins..." -ForegroundColor Cyan
        npm install @capacitor-community/barcode-scanner @capacitor/push-notifications @capacitor/geolocation @capacitor/camera @capacitor/haptics
    }
}

# Copiar configuración de ejemplo
if (-not (Test-Path "capacitor.config.json")) {
    Write-Host ""
    Write-Host "📝 Copiando configuración de ejemplo..." -ForegroundColor Cyan
    Copy-Item "capacitor.config.example.json" "capacitor.config.json"
    Write-Host "⚠️  IMPORTANTE: Edita capacitor.config.json con tu dominio" -ForegroundColor Yellow
}

# Sincronizar
Write-Host ""
Write-Host "🔄 Sincronizando proyecto..." -ForegroundColor Cyan
npx cap sync

Write-Host ""
Write-Host "✅ ¡Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Edita capacitor.config.json con tu dominio"
Write-Host "2. Para Android: npx cap open android"
Write-Host "3. Para iOS (macOS): npx cap open ios"
Write-Host ""
Write-Host "📖 Lee MOBILE_PASILLERA_README.md para más información" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 URL de la app: https://tu-dominio.com/pasillera" -ForegroundColor Green
