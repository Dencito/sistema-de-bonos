-- Script para migrar de totem_id a branch_id en 888spa_tickets y 888spa_fingerprint_logs
-- Este script debe ejecutarse en cada base de datos de empresa (888spa_*, etc.)

-- =====================================================
-- IMPORTANTE: Ejecutar este script en cada base de datos de empresa
-- Ejemplo: USE 888spa_user; SOURCE migrate_totem_to_branch.sql;
-- =====================================================

-- 1. TICKETS: Agregar columna branch_id y migrar datos
ALTER TABLE 888spa_tickets ADD COLUMN branch_id BIGINT UNSIGNED NULL AFTER user_id;

-- Migrar datos: obtener branch_id desde el totem
UPDATE 888spa_tickets t
INNER JOIN 888spa_totems tm ON t.totem_id = tm.id
SET t.branch_id = tm.branch_id
WHERE t.totem_id IS NOT NULL;

-- Agregar foreign key constraint
ALTER TABLE 888spa_tickets 
ADD CONSTRAINT 888spa_tickets_branch_id_foreign 
FOREIGN KEY (branch_id) REFERENCES 888spa_branches(id) ON DELETE SET NULL;

-- Eliminar foreign key de totem_id
ALTER TABLE 888spa_tickets DROP FOREIGN KEY 888spa_tickets_totem_id_foreign;

-- Eliminar columna totem_id
ALTER TABLE 888spa_tickets DROP COLUMN totem_id;

-- =====================================================

-- 2. FINGERPRINT_LOGS: Agregar columna branch_id y migrar datos
ALTER TABLE 888spa_fingerprint_logs ADD COLUMN branch_id BIGINT UNSIGNED NULL AFTER user_id;

-- Migrar datos: obtener branch_id desde el totem
UPDATE 888spa_fingerprint_logs fl
INNER JOIN 888spa_totems tm ON fl.totem_id = tm.id
SET fl.branch_id = tm.branch_id
WHERE fl.totem_id IS NOT NULL;

-- Agregar foreign key constraint
ALTER TABLE 888spa_fingerprint_logs 
ADD CONSTRAINT 888spa_fingerprint_logs_branch_id_foreign 
FOREIGN KEY (branch_id) REFERENCES 888spa_branches(id) ON DELETE SET NULL;

-- Eliminar foreign key de totem_id
ALTER TABLE 888spa_fingerprint_logs DROP FOREIGN KEY 888spa_fingerprint_logs_totem_id_foreign;

-- Eliminar columna totem_id
ALTER TABLE 888spa_fingerprint_logs DROP COLUMN totem_id;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- VERIFICACIÓN (ejecutar después de la migración):
-- SELECT COUNT(*) as 888spa_tickets_sin_branch FROM 888spa_tickets WHERE branch_id IS NULL;
-- SELECT COUNT(*) as logs_sin_branch FROM 888spa_fingerprint_logs WHERE branch_id IS NULL;
