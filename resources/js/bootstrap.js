import axios from 'axios';
import { TENANT } from '@/Utils/tenant';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;

if (TENANT) {
  // Los componentes llaman a rutas absolutas del tenant ('/cash-management/...').
  // Con la empresa en la URL esas rutas viven bajo /{empresa}, asi que el
  // baseURL las reescribe todas de una vez. Las llamadas a /api pasan
  // baseURL:'' para saltearse esto, porque /api no lleva prefijo.
  window.axios.defaults.baseURL = `/${TENANT}`;

  // La identidad de la empresa va tambien en un header: es la primera cosa que
  // mira TenantResolver, y es lo que permite que las rutas /api sepan de que
  // empresa son sin llevarla en la URL.
  window.axios.defaults.headers.common['X-Company-Prefix'] = TENANT;
}

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allow your team to quickly build robust real-time web applications.
 */

import './echo';
