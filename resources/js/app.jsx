import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ConfigProvider } from '@/Utils/antd';
import esES from 'antd/locale/es_ES';
import { MessageProvider } from './Contexts/MessageShow';
import { VITE_APP_NAME } from '@utils/env';

createInertiaApp({
    title: (title) => `${title} - ${VITE_APP_NAME}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        ),
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
