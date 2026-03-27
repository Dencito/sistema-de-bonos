-- ============================================================================
-- SCRIPT CRÍTICO: Corregir CASCADE DELETE en totem_id de tablas relacionadas
-- ============================================================================
-- PROBLEMA: Al eliminar un tótem, se eliminaban todos los tickets y fingerprint_logs
-- SOLUCIÓN: Cambiar onDelete('cascade') a onDelete('set null')
-- 
-- IMPORTANTE: Ejecutar este script EN PRODUCCIÓN lo antes posible
-- ============================================================================

-- ⚙️ CONFIGURACIÓN: Cambia este prefijo según tu empresa
-- Ejemplos: '888spa', 'empresa', etc.
SET @prefix = '888spa';

-- ============================================================================
-- NO MODIFICAR DEBAJO DE ESTA LÍNEA
-- ============================================================================

SET @table_tickets = CONCAT(@prefix, '_tickets');
SET @table_fingerprint_logs = CONCAT(@prefix, '_fingerprint_logs');
SET @table_totems = CONCAT(@prefix, '_totems');

-- ============================================================================
-- PARTE 1: Modificar tabla de TICKETS
-- ============================================================================

SELECT CONCAT('🔍 Verificando foreign keys en: ', @table_tickets) as 'Paso 1';

-- 1.1. Verificar constraint actual de tickets
SELECT 
    CONCAT('✓ Constraint encontrada: ', CONSTRAINT_NAME) as Info,
    COLUMN_NAME as 'Columna',
    REFERENCED_TABLE_NAME as 'Referencia a',
    DELETE_RULE as 'Regla DELETE Actual'
FROM 
    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
    JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
        ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
        AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
WHERE 
    rc.CONSTRAINT_SCHEMA = DATABASE()
    AND kcu.TABLE_NAME = @table_tickets
    AND kcu.COLUMN_NAME = 'totem_id';

-- 1.2. Hacer totem_id nullable en tickets
SET @sql_alter_tickets = CONCAT('ALTER TABLE `', @table_tickets, '` MODIFY COLUMN `totem_id` BIGINT UNSIGNED NULL');
PREPARE stmt_alter_tickets FROM @sql_alter_tickets;
EXECUTE stmt_alter_tickets;
DEALLOCATE PREPARE stmt_alter_tickets;

SELECT CONCAT('✓ Columna totem_id en ', @table_tickets, ' ahora es NULLABLE') as 'Paso 1.2 Completado';

-- 1.3. Eliminar foreign key existente de tickets
SET @sql_drop_tickets = CONCAT('ALTER TABLE `', @table_tickets, '` DROP FOREIGN KEY `', @table_tickets, '_totem_id_foreign`');
PREPARE stmt_drop_tickets FROM @sql_drop_tickets;
EXECUTE stmt_drop_tickets;
DEALLOCATE PREPARE stmt_drop_tickets;

SELECT CONCAT('✓ Foreign key eliminada de: ', @table_tickets) as 'Paso 1.3 Completado';

-- 1.4. Recrear foreign key con SET NULL en tickets
SET @sql_add_tickets = CONCAT(
    'ALTER TABLE `', @table_tickets, '` ',
    'ADD CONSTRAINT `', @table_tickets, '_totem_id_foreign` ',
    'FOREIGN KEY (`totem_id`) ',
    'REFERENCES `', @table_totems, '` (`id`) ',
    'ON DELETE SET NULL ',
    'ON UPDATE CASCADE'
);
PREPARE stmt_add_tickets FROM @sql_add_tickets;
EXECUTE stmt_add_tickets;
DEALLOCATE PREPARE stmt_add_tickets;

SELECT CONCAT('✓ Foreign key recreada en: ', @table_tickets, ' con SET NULL') as 'Paso 1.4 Completado';

-- ============================================================================
-- PARTE 2: Modificar tabla de FINGERPRINT_LOGS
-- ============================================================================

SELECT CONCAT('🔍 Verificando foreign keys en: ', @table_fingerprint_logs) as 'Paso 2';

-- 2.1. Verificar constraint actual de fingerprint_logs
SELECT 
    CONCAT('✓ Constraint encontrada: ', CONSTRAINT_NAME) as Info,
    COLUMN_NAME as 'Columna',
    REFERENCED_TABLE_NAME as 'Referencia a',
    DELETE_RULE as 'Regla DELETE Actual'
FROM 
    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
    JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
        ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
        AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
WHERE 
    rc.CONSTRAINT_SCHEMA = DATABASE()
    AND kcu.TABLE_NAME = @table_fingerprint_logs
    AND kcu.COLUMN_NAME = 'totem_id';

-- 2.2. Hacer totem_id nullable en fingerprint_logs
SET @sql_alter_fp = CONCAT('ALTER TABLE `', @table_fingerprint_logs, '` MODIFY COLUMN `totem_id` BIGINT UNSIGNED NULL');
PREPARE stmt_alter_fp FROM @sql_alter_fp;
EXECUTE stmt_alter_fp;
DEALLOCATE PREPARE stmt_alter_fp;

SELECT CONCAT('✓ Columna totem_id en ', @table_fingerprint_logs, ' ahora es NULLABLE') as 'Paso 2.2 Completado';

-- 2.3. Eliminar foreign key existente de fingerprint_logs
SET @sql_drop_fp = CONCAT('ALTER TABLE `', @table_fingerprint_logs, '` DROP FOREIGN KEY `', @table_fingerprint_logs, '_totem_id_foreign`');
PREPARE stmt_drop_fp FROM @sql_drop_fp;
EXECUTE stmt_drop_fp;
DEALLOCATE PREPARE stmt_drop_fp;

SELECT CONCAT('✓ Foreign key eliminada de: ', @table_fingerprint_logs) as 'Paso 2.3 Completado';

-- 2.4. Recrear foreign key con SET NULL en fingerprint_logs
SET @sql_add_fp = CONCAT(
    'ALTER TABLE `', @table_fingerprint_logs, '` ',
    'ADD CONSTRAINT `', @table_fingerprint_logs, '_totem_id_foreign` ',
    'FOREIGN KEY (`totem_id`) ',
    'REFERENCES `', @table_totems, '` (`id`) ',
    'ON DELETE SET NULL ',
    'ON UPDATE CASCADE'
);
PREPARE stmt_add_fp FROM @sql_add_fp;
EXECUTE stmt_add_fp;
DEALLOCATE PREPARE stmt_add_fp;

SELECT CONCAT('✓ Foreign key recreada en: ', @table_fingerprint_logs, ' con SET NULL') as 'Paso 2.4 Completado';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT '📊 VERIFICACIÓN FINAL - Constraints actualizadas:' as 'RESULTADO';

SELECT 
    TABLE_NAME as 'Tabla',
    CONSTRAINT_NAME as 'Foreign Key',
    DELETE_RULE as 'Regla DELETE (debe ser SET NULL)',
    UPDATE_RULE as 'Regla UPDATE (debe ser CASCADE)'
FROM 
    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
    JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
        ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
        AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
WHERE 
    rc.CONSTRAINT_SCHEMA = DATABASE()
    AND kcu.COLUMN_NAME = 'totem_id'
    AND kcu.TABLE_NAME IN (@table_tickets, @table_fingerprint_logs);

SELECT '✅ SCRIPT COMPLETADO EXITOSAMENTE' as 'RESULTADO FINAL';
SELECT 'Ahora al eliminar un tótem, los tickets y fingerprint_logs mantendrán sus registros con totem_id = NULL' as 'IMPORTANTE';
