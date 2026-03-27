-- ============================================================================
-- SCRIPT CRÍTICO: Corregir CASCADE DELETE en branch_id de la tabla 888spa_users
-- ============================================================================
-- PROBLEMA: Al eliminar una sucursal, se eliminaban todos los usuarios
-- SOLUCIÓN: Cambiar onDelete('cascade') a onDelete('set null')
-- 
-- IMPORTANTE: Ejecutar este script EN PRODUCCIÓN lo antes posible
-- ============================================================================

-- 1. Primero, verificar el nombre exacto de la foreign key constraint
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = '888spa_users'
    AND COLUMN_NAME = 'branch_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 2. Eliminar la foreign key existente (ajusta el nombre si es diferente)
-- El nombre puede ser: 888spa_users_branch_id_foreign o similar
ALTER TABLE `888spa_users` 
DROP FOREIGN KEY `888spa_users_branch_id_foreign`;

-- 3. Recrear la foreign key con SET NULL en lugar de CASCADE
ALTER TABLE `888spa_users` 
ADD CONSTRAINT `888spa_users_branch_id_foreign` 
FOREIGN KEY (`branch_id`) 
REFERENCES `888spa_branches` (`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- 4. Verificar que el cambio se aplicó correctamente
SELECT 
    CONSTRAINT_NAME,
    DELETE_RULE,
    UPDATE_RULE
FROM 
    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
WHERE 
    CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = '888spa_users'
    AND CONSTRAINT_NAME = '888spa_users_branch_id_foreign';

-- Resultado esperado: DELETE_RULE = 'SET NULL', UPDATE_RULE = 'CASCADE'
