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
    createBonusCategory: ['duenio', 'super-admin'],
    allowedDuringWorkHours: ['trabajador', 'supervisor'],
};

export const roleNames = {
    duenio: 'duenio',
    'super-admin': 'super-admin',
    admin: 'admin',
    supervisor: 'supervisor',
    trabajador: 'trabajador',
    jugador: 'jugador',
};
