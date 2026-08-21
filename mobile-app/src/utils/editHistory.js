/**
 * Lectura del edit_history de un movimiento de caja.
 *
 * La pasillera puede corregir lo que registró (monto, cliente, máquina, tipo de
 * gasto) y cada corrección queda anotada en el propio movimiento. Sin mostrarlo,
 * una edición es invisible: el valor viejo desaparece y no hay forma de saber
 * que hubo un cambio.
 *
 * El formato de cada entrada lo arma MobilePasilleraController::registrarEdicion:
 *   { at, user_id, user, changes: { campo: { from, to } } }
 */

const CAMPOS = {
  amount: 'Monto',
  client: 'Cliente',
  machine: 'Máquina',
  expense_type: 'Tipo de gasto',
};

const money = (v) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const valor = (campo, v) => {
  if (v === null || v === undefined || v === '') return '(vacío)';
  return campo === 'amount' ? money(v) : String(v);
};

/** ["Monto: $1.000 → $2.000", "Máquina: 1 → 5"] */
export const describirCambios = (changes) =>
  Object.entries(changes || {}).map(
    ([campo, { from, to }]) =>
      `${CAMPOS[campo] || campo}: ${valor(campo, from)} → ${valor(campo, to)}`,
  );

/** ¿El string trae zona horaria? "...Z" o "...-04:00" */
const TIENE_ZONA = /(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Fecha de la edición, ya lista para mostrar.
 *
 * Las entradas viejas se guardaban sin zona ("2026-08-21 08:21:42") y ya venían
 * en hora de Chile: convertirlas las corría una hora hacia atrás. Esas se
 * muestran tal cual. Las nuevas traen offset y sí se convierten.
 */
const fechaEdicion = (at) => {
  if (!at) return '';

  if (!TIENE_ZONA.test(at)) {
    const [fecha, hora = ''] = String(at).split(' ');
    const [a, m, d] = fecha.split('-');
    return d && m && a ? `${d}/${m}/${a} ${hora.slice(0, 5)}`.trim() : String(at);
  }

  const fmt = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  return fmt.format(new Date(at)).replace(/-/g, '/').replace(',', '');
};

/**
 * Aplana el historial a una lista lista para mostrar, de la más reciente a la
 * más vieja. `atLabel` ya viene formateado: así las cuatro pantallas muestran
 * la fecha igual y ninguna vuelve a convertir la zona por su cuenta.
 */
export const listarEdiciones = (history) =>
  (Array.isArray(history) ? [...history] : [])
    .reverse()
    .map((e) => ({
      at: e.at,
      atLabel: fechaEdicion(e.at),
      user: e.user,
      cambios: describirCambios(e.changes),
    }))
    .filter((e) => e.cambios.length > 0);

/** "Editado 2 veces por Yohana Marquez" */
export const resumenEdiciones = (history) => {
  const n = Array.isArray(history) ? history.length : 0;
  if (!n) return null;

  const ultima = history[n - 1];
  const quien = ultima?.user ? ` por ${ultima.user}` : '';

  return `Editado ${n} ${n === 1 ? 'vez' : 'veces'}${quien}`;
};
