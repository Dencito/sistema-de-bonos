/**
 * Empresa del request, tal como la resolvio el backend.
 *
 * Sale de <meta name="tenant"> que renderiza app.blade.php, no de parsear
 * location.host ni location.pathname. Antes dos componentes deducian la empresa
 * del subdominio por su cuenta y quedaban desincronizados del backend en cuanto
 * cambiaba la forma de la URL.
 *
 * Vacio significa que no hay empresa: es el modo tickets, sobre las tablas sin
 * prefijo.
 */
export const TENANT =
  typeof document !== 'undefined'
    ? (document.querySelector('meta[name="tenant"]')?.content || '').trim()
    : '';

/** true cuando se opera sin empresa (modo tickets). */
export const IS_TICKETS_MODE = TENANT === '';

/**
 * Prefija un path absoluto con la empresa: '/users' -> '/nanu/users'.
 * Sin empresa lo devuelve igual.
 *
 * Para las rutas con nombre no hace falta: route() ya devuelve la URL con
 * prefijo porque Ziggy serializa las rutas ya registradas.
 */
export const tenantPath = (path) => {
  if (!TENANT) return path;

  const clean = path.startsWith('/') ? path : `/${path}`;

  // Idempotente: no queremos /nanu/nanu/users
  if (clean === `/${TENANT}` || clean.startsWith(`/${TENANT}/`)) {
    return clean;
  }

  return `/${TENANT}${clean}`;
};
