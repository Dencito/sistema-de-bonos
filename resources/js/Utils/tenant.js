/**
 * Utility functions for path-based multi-tenancy
 */

/**
 * Get the current company/tenant from the URL path
 * @returns {string} Company name from URL path
 */
export function getCurrentCompany() {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  
  // El primer segmento es el nombre de la empresa
  return segments[0] || '';
}

/**
 * Check if current path is for a specific company
 * @param {string} companyName 
 * @returns {boolean}
 */
export function isCompany(companyName) {
  return getCurrentCompany() === companyName;
}

/**
 * Build a URL with the current company prefix
 * @param {string} path - Path without company prefix
 * @returns {string} Full path with company prefix
 */
export function companyUrl(path) {
  const company = getCurrentCompany();
  if (!company) {
    return path;
  }
  
  // Asegurar que path empiece con /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${company}${cleanPath}`;
}

/**
 * Get company from localStorage (fallback)
 * @returns {string}
 */
export function getStoredCompany() {
  return localStorage.getItem('current_company') || '';
}

/**
 * Store company in localStorage
 * @param {string} company 
 */
export function storeCompany(company) {
  localStorage.setItem('current_company', company);
}
