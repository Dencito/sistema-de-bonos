import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: "resources/js/app.jsx",
            refresh: true,
        }),
        react(),
    ],
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
