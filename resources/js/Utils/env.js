import { z } from 'zod';

const isLocal = import.meta.env.APP_ENV === 'local';

const requiredEnvVars = [
  'VITE_APP_NAME',
  'VITE_COUNTRIES_API_URL',
  'VITE_COUNTRIES_API_KEY',
  'VITE_PRIMARY_SUBDOMAIN',
  'VITE_PASSWORD_ENCRYPTION_KEY',
];

const missingVars = requiredEnvVars.filter((varName) => !import.meta.env[varName]);

if (missingVars.length) {
  const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
  if (isLocal) {
    throw new Error(errorMessage);
  }
}

const envSchema = z.object({
  VITE_APP_NAME: z.string(),
  VITE_COUNTRIES_API_URL: z.string().url(),
  VITE_COUNTRIES_API_KEY: z.string(),
  VITE_PRIMARY_SUBDOMAIN: z.string(),
  VITE_PASSWORD_ENCRYPTION_KEY: z.string(),
});

const env = envSchema.safeParse(import.meta.env);

if (!env.success) {
  if (isLocal) {
    throw new Error(
      `Invalid environment variables: ${env.error.errors.map((e) => e.message).join(', ')}`,
    );
  }
}

export const {
  VITE_APP_NAME,
  VITE_COUNTRIES_API_URL,
  VITE_COUNTRIES_API_KEY,
  VITE_PRIMARY_SUBDOMAIN,
  VITE_PASSWORD_ENCRYPTION_KEY,
} = env.data;
