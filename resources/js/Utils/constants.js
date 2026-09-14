export const roleDisplayNames = {
  duenio: 'Dueño',
  'super-admin': 'Super Admin',
  admin: 'Admin',
  supervisor: 'Supervisor',
  trabajador: 'Trabajador',
  jugador: 'Jugador',
};

export const allowedRoles = {
  companies: ['duenio'],
  branches: ['duenio', 'super-admin', 'admin'],
  roles: ['duenio', 'super-admin'],
  status: ['duenio', 'super-admin'],
  createBonusCategory: ['duenio', 'super-admin', 'admin', 'supervisor', 'trabajador'],
  allowedDuringWorkHours: ['trabajador', 'supervisor'],
  totems: ['duenio', 'super-admin', 'admin'],
  tickets: ['duenio', 'super-admin', 'admin', 'supervisor', 'trabajador'],
  fingerprintLogs: ['duenio', 'super-admin', 'admin', 'supervisor'],
  shiftControl: ['trabajador'],
  shifts: ['duenio', 'super-admin', 'admin', 'supervisor', 'trabajador'],
  createBonus: ['duenio', 'super-admin', 'admin', 'supervisor'],
  systemBank: ['duenio', 'super-admin', 'admin', 'supervisor', 'trabajador'],
  // Consulta por maquina. Un trabajador entra solo si tiene el cargo
  // RECAUDADOR, cosa que se chequea aparte porque el cargo no es el rol.
  machines: ['duenio', 'super-admin', 'admin', 'supervisor'],
  // Bancos online. Las cuentas son de la empresa entera, asi que entran solo
  // los roles superiores a trabajador. Espeja RoleId::BANK_MANAGERS.
  banks: ['duenio', 'super-admin', 'admin', 'supervisor'],
  // Roles sin sucursal asignada: eligen una para operar
  branchSelectors: ['duenio', 'super-admin', 'admin'],
};

/**
 * Cuerpo scrolleable para modales con formularios largos.
 *
 * Un modal de antd arranca a 100px del borde y crece con su contenido: en una
 * pantalla de 1366x768 un form de seis campos mide 746px y el footer termina en
 * 798px, o sea 30px fuera de la pantalla. Los botones Cancelar y Guardar quedan
 * afuera y no se ve que haya que scrollear.
 *
 * Con esto el cuerpo scrollea por dentro y, junto con `centered`, el modal
 * entero entra siempre en pantalla.
 */
export const MODAL_SCROLL_BODY = {
  body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' },
};

/**
 * Cargos que entran a Bancos Online aunque por rol no entrarían.
 * Espeja App\Constants\BankAccess::CARGOS.
 */
export const BANK_CARGOS = ['CAJER@', 'RECAUDADOR'];

export const roleNames = {
  duenio: 'duenio',
  'super-admin': 'super-admin',
  admin: 'admin',
  supervisor: 'supervisor',
  trabajador: 'trabajador',
  jugador: 'jugador',
};
