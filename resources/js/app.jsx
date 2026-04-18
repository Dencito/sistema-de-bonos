import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ConfigProvider } from '@/Utils/antd';
import esES from 'antd/locale/es_ES';
import { MessageProvider } from './Contexts/MessageShow';
import { VITE_APP_NAME } from '@utils/env';
import { ThemeProvider } from './Contexts/DarkModeProvider';

createInertiaApp({
  title: (title) => `${title} - ${VITE_APP_NAME}`,
  resolve: (name) =>
    resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(
      <ConfigProvider 
        locale={esES}
        theme={{
          token: {
            colorPrimary: '#0f172a', // Minimalist dark slate
            colorInfo: '#3b82f6',
            colorSuccess: '#10b981',
            colorWarning: '#f59e0b',
            colorError: '#ef4444',
            borderRadius: 8,
            wireframe: false,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            colorText: '#1e293b',
            colorTextSecondary: '#64748b',
            colorBgContainer: '#ffffff',
            colorBorder: '#e2e8f0',
          },
          components: {
            Button: {
              borderRadius: 8,
              controlHeight: 40,
              fontWeight: 500,
              paddingInline: 20,
            },
            Input: {
              borderRadius: 8,
              controlHeight: 40,
              colorBgContainer: '#f8fafc',
            },
            Select: {
              borderRadius: 8,
              controlHeight: 40,
              colorBgContainer: '#f8fafc',
            },
            Card: {
              borderRadiusLG: 16,
              boxShadowTertiary: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
            },
            Table: {
              borderRadiusLG: 12,
              colorHeaderBg: '#f8fafc',
              paddingContentVerticalLG: 16,
            },
            Modal: {
              borderRadiusLG: 16,
              paddingContentHorizontalLG: 32,
              paddingMD: 24,
            }
          }
        }}
      >
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <MessageProvider>
            <App {...props} />
          </MessageProvider>
        </ThemeProvider>
      </ConfigProvider>,
    );
  },
  progress: {
    color: '#4B5563',
  },
});
