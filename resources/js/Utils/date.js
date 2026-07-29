/**
 * El sistema opera en Chile, pero el backend serializa las fechas en UTC y los
 * metodos nativos (getHours, toLocaleString) usan la zona del navegador: una
 * maquina en Argentina muestra los turnos una hora adelantados. Todo lo que se
 * muestre al usuario tiene que pasar por los helpers *CL.
 */
export const CHILE_TIMEZONE = 'America/Santiago';

const chileFormatter = (options) =>
  new Intl.DateTimeFormat('es-CL', { timeZone: CHILE_TIMEZONE, ...options });

const parseDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

// es-CL separa la fecha con guiones (28-07-2026) y mete una coma antes de la
// hora. El sistema las muestra con barra y sin coma: 28/07/2026 19:42.
const withSlashes = (formatted) => formatted.replace(/-/g, '/').replace(',', '');

/**
 * Format a date in Chilean time as "DD/MM/YYYY HH:mm" ("28/07/2026 19:42").
 * @param {Date | string} date - The date to format.
 * @param {{ seconds?: boolean }} [options] - Include seconds in the output.
 * @returns {string} The formatted date string, or "—" if the date is invalid.
 */
export const formatDateTimeCL = (date, { seconds = false } = {}) => {
  const d = parseDate(date);
  if (!d) return '—';

  return withSlashes(
    chileFormatter({
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(seconds ? { second: '2-digit' } : {}),
      hourCycle: 'h23',
    }).format(d),
  );
};

/**
 * Format a date in Chilean time as "DD/MM/YYYY".
 * @param {Date | string} date - The date to format.
 * @returns {string} The formatted date string, or "—" if the date is invalid.
 */
export const formatDateCL = (date) => {
  const d = parseDate(date);
  if (!d) return '—';

  return withSlashes(
    chileFormatter({ day: '2-digit', month: '2-digit', year: 'numeric' }).format(d),
  );
};

/**
 * Format a date in Chilean time as "HH:mm".
 * @param {Date | string} date - The date to format.
 * @returns {string} The formatted time string, or "—" if the date is invalid.
 */
export const formatTimeCL = (date) => {
  const d = parseDate(date);
  if (!d) return '—';

  return chileFormatter({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
};

/**
 * Format a date as "DD-MM-YYYY"
 * @param {Date | string} date - The date to format.
 * @returns {string} The formatted date string.
 */

export const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate());
  const month = String(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Format a date as "DD-MM-YYYY HH:mm:ss"
 * @param {Date | string} date - The date to format.
 * @returns {string} The formatted date string with time.
 */
export const formatDateTime = (date) => {
  // Return a placeholder if date is undefined or null
  if (!date) {
    return 'N/A';
  }

  const d = new Date(date);

  // Check if date is valid
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  // Format the date using the constructed values instead of relying on toString()
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Get the current date and time in "DD-MM-YYYY HH:mm:ss" format.
 * @returns {string} The current formatted date and time string.
 */
export const getCurrentDateTime = () => {
  return formatDateTime(new Date());
};

/**
 * Get the current date in "DD-MM-YYYY" format.
 * @returns {string} The current formatted date string.
 */
export const getCurrentDate = () => {
  return formatDate(new Date());
};

/**
 * Get the current time in "HH:mm:ss" format.
 * @returns {string} The current formatted time string.
 */
export const getCurrentTime = () => {
  const d = new Date();
  const hours = String(d.getHours());
  const minutes = String(d.getMinutes());
  const seconds = String(d.getSeconds());
  return `${hours}:${minutes}:${seconds}`;
};
