import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import path from 'path';

const antdComponents = {
    'antd-general': ['antd/es/config-provider', 'antd/locale/es_ES'],
    'antd-layout': ['antd/es/layout', 'antd/es/menu', 'antd/es/grid'],
    'antd-display': ['antd/es/table', 'antd/es/tabs', 'antd/es/card'],
    'antd-feedback': ['antd/es/modal', 'antd/es/message', 'antd/es/notification'],
    'antd-inputs': ['antd/es/form', 'antd/es/input', 'antd/es/select', 'antd/es/button'],
};

export default defineConfig({
    plugins: [
        laravel({
            input: "resources/js/app.jsx",
            refresh: true,
        }),
        react(),
    ],
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react/jsx-runtime'],
                    'vendor-utils': ['@inertiajs/react', 'lucide-react'],
                    ...antdComponents,
                },
                chunkFileNames: (chunkInfo) => {
                    const name = chunkInfo.name;
                    if (name.includes('antd-')) {
                        return 'assets/antd/[name]-[hash].js';
                    }
                    return 'assets/[name]-[hash].js';
                },
            },
        },
    },
    optimizeDeps: {
        include: Object.values(antdComponents).flat(),
    },
    server: {
        port: 5174,
    },
    resolve: {
        alias: {
            "@pages": path.resolve(
                __dirname,
                "resources/js/Pages/"
            ),
            "@components": path.resolve(
                __dirname,
                "resources/js/Components/"
            ),
            "@components-v2": path.resolve(
                __dirname,
                "resources/js/components-v2/"
            ),
            "@hooks": path.resolve(
                __dirname,
                "resources/js/Hooks/"
            ),
            "@utils": path.resolve(
                __dirname,
                "resources/js/Utils/"
            ),
            "@layouts": path.resolve(
                __dirname,
                "resources/js/Layouts/"
            ),
            "@contexts": path.resolve(
                __dirname,
                "resources/js/Contexts/"
            ),
        },
    },
});
