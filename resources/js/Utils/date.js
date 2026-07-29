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
 * @param {{ seconds?: boolean }} [options] - Include seconds in the output.
 * @returns {string} The formatted time string, or "—" if the date is invalid.
 */
export const formatTimeCL = (date, { seconds = false } = {}) => {
  const d = parseDate(date);
  if (!d) return '—';

  return chileFormatter({
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
    hourCycle: 'h23',
  }).format(d);
};

/**
 * Format a date in Chilean time as "28 jul 2026" or "28 jul 2026 19:42".
 * Para listados donde el mes escrito se lee mejor que el numerico.
 * @param {Date | string} date - The date to format.
 * @param {{ time?: boolean }} [options] - Append the time.
 * @returns {string} The formatted date string, or "—" if the date is invalid.
 */
export const formatDateLongCL = (date, { time = false } = {}) => {
  const d = parseDate(date);
  if (!d) return '—';

  return chileFormatter({
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : {}),
  })
    .format(d)
    .replace(',', '');
};

/**
 * Estos cuatro helpers son los originales del proyecto. Armaban la fecha a
 * mano con getDate/getHours, o sea en la zona del navegador, y cada uno con un
 * formato distinto. Ahora delegan en los helpers *CL para que toda la app
 * muestre lo mismo: DD/MM/YYYY en horario de Chile.
 */

/**
 * Format a date as "DD/MM/YYYY" in Chilean time.
 * @param {Date | string} date - The date to format.
 * @returns {string} The formatted date string.
 */
export const formatDate = (date) => formatDateCL(date);

/**
 * Format a date as "DD/MM/YYYY HH:mm" in Chilean time.
 * @param {Date | string} date - The date to format.
 * @returns {string} The formatted date string with time.
 */
export const formatDateTime = (date) => formatDateTimeCL(date);

/**
 * Get the current date and time in "DD/MM/YYYY HH:mm:ss" format, Chilean time.
 * @returns {string} The current formatted date and time string.
 */
export const getCurrentDateTime = () => formatDateTimeCL(new Date(), { seconds: true });

/**
 * Get the current date in "DD/MM/YYYY" format, Chilean time.
 * @returns {string} The current formatted date string.
 */
export const getCurrentDate = () => formatDateCL(new Date());

/**
 * Get the current time in "HH:mm:ss" format, Chilean time.
 * @returns {string} The current formatted time string.
 */
export const getCurrentTime = () => formatTimeCL(new Date(), { seconds: true });
