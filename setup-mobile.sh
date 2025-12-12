#!/bin/bash

echo "🚀 Configurando Pasillera Mobile con Capacitor..."
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

echo "✅ Node.js detectado: $(node -v)"
echo ""

# Instalar Capacitor
echo "📦 Instalando Capacitor..."
npm install @capacitor/core @capacitor/cli --save-dev

# Inicializar Capacitor
echo "🔧 Inicializando Capacitor..."
npx cap init

# Instalar plataformas
echo "📱 ¿Qué plataforma deseas instalar?"
echo "1) Android"
echo "2) iOS"
echo "3) Ambas"
read -p "Selecciona una opción (1-3): " platform

case $platform in
    1)
        echo "📱 Instalando Android..."
        npm install @capacitor/android
        npx cap add android
        ;;
    2)
        echo "📱 Instalando iOS..."
        npm install @capacitor/ios
        npx cap add ios
        ;;
    3)
        echo "📱 Instalando Android e iOS..."
        npm install @capacitor/android @capacitor/ios
        npx cap add android
        npx cap add ios
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

# Instalar plugins opcionales
echo ""
echo "🔌 ¿Deseas instalar plugins adicionales?"
echo "1) Solo básicos (HTTP, Storage)"
echo "2) Con scanner QR"
echo "3) Con notificaciones push"
echo "4) Todos los plugins"
read -p "Selecciona una opción (1-4): " plugins

case $plugins in
    2)
        echo "📷 Instalando scanner QR..."
        npm install @capacitor-community/barcode-scanner
        ;;
    3)
        echo "🔔 Instalando notificaciones push..."
        npm install @capacitor/push-notifications
        ;;
    4)
        echo "🔌 Instalando todos los plugins..."
        npm install @capacitor-community/barcode-scanner @capacitor/push-notifications @capacitor/geolocation @capacitor/camera @capacitor/haptics
        ;;
esac

# Copiar configuración de ejemplo
if [ ! -f "capacitor.config.json" ]; then
    echo ""
    echo "📝 Copiando configuración de ejemplo..."
    cp capacitor.config.example.json capacitor.config.json
    echo "⚠️  IMPORTANTE: Edita capacitor.config.json con tu dominio"
fi

# Sincronizar
echo ""
echo "🔄 Sincronizando proyecto..."
npx cap sync

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita capacitor.config.json con tu dominio"
echo "2. Para Android: npx cap open android"
echo "3. Para iOS: npx cap open ios"
echo ""
echo "📖 Lee MOBILE_PASILLERA_README.md para más información"
