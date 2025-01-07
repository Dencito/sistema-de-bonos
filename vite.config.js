import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    server: {
        port: 5174,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            '@assets': path.resolve(__dirname, 'resources/assets'),
            '@styles': path.resolve(__dirname, 'resources/css'),

            '@pages': path.resolve(__dirname, 'resources/js/Pages'),
            '@layouts': path.resolve(__dirname, 'resources/js/Layouts'),
            '@components': path.resolve(__dirname, 'resources/js/Components'),
            '@components-v2': path.resolve(
                __dirname,
                'resources/js/components-v2'
            ),

            '@services': path.resolve(__dirname, 'resources/js/Services'),
            '@utils': path.resolve(__dirname, 'resources/js/Utils'),
            '@hooks': path.resolve(__dirname, 'resources/js/Hooks'),
            '@contexts': path.resolve(__dirname, 'resources/js/Contexts'),
        },
    },
});
