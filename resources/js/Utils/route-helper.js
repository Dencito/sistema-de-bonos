import { getCurrentCompany } from './tenant';

/**
 * Generate route with company prefix
 * This is a wrapper around the global route() function
 * that automatically adds the company parameter
 * 
 * @param {string} name - Route name
 * @param {object|array} params - Route parameters
 * @param {boolean} absolute - Generate absolute URL
 * @returns {string} URL with company prefix
 */
export function companyRoute(name, params = {}, absolute = false) {
  const company = getCurrentCompany();
  
  // Si params es un objeto, agregar company
  if (typeof params === 'object' && !Array.isArray(params)) {
    params = { company, ...params };
  } 
  // Si params es un array, agregar company al inicio
  else if (Array.isArray(params)) {
    params = [company, ...params];
  }
  // Si params es un valor simple, convertir a array
  else {
    params = [company, params];
  }
  
  return route(name, params, absolute);
}

/**
 * Check if we're on a specific route
 * @param {string} name - Route name
 * @returns {boolean}
 */
export function isRoute(name) {
  return route().current(name);
}

/**
 * Get current route name
 * @returns {string}
 */
export function currentRoute() {
  return route().current();
}
