import { z } from 'zod';

const requiredEnvVars = [
    'VITE_APP_NAME',
    'VITE_COUNTRIES_API_URL',
    'VITE_COUNTRIES_API_KEY',
    'VITE_PRIMARY_SUBDOMAIN'
];

const missingVars = requiredEnvVars.filter((varName) => !import.meta.env[varName]);

if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const envSchema = z.object({
    VITE_APP_NAME: z.string(),
    VITE_COUNTRIES_API_URL: z.string().url(),
    VITE_COUNTRIES_API_KEY: z.string(),
    VITE_PRIMARY_SUBDOMAIN: z.string(),
});

const env = envSchema.safeParse(import.meta.env);

if (!env.success) {
    throw new Error(`Invalid environment variables: ${env.error.errors.map(e => e.message).join(', ')}`);
}

export const {
    VITE_APP_NAME,
    VITE_COUNTRIES_API_URL,
    VITE_COUNTRIES_API_KEY,
    VITE_PRIMARY_SUBDOMAIN
} = env.data;
