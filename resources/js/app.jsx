import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ConfigProvider } from 'antd';
import esES from 'antd/es/locale/es_ES';
import { MessageProvider } from './Contexts/MessageShow';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ConfigProvider locale={esES}>
                <MessageProvider>
                    <App {...props} />
                </MessageProvider>
            </ConfigProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
