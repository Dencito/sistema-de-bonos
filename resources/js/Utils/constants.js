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
    systemBank: [/* 'duenio', 'super-admin', 'admin', */ 'supervisor', 'trabajador'],
};

export const roleNames = {
    duenio: 'duenio',
    'super-admin': 'super-admin',
    admin: 'admin',
    supervisor: 'supervisor',
    trabajador: 'trabajador',
    jugador: 'jugador',
};
