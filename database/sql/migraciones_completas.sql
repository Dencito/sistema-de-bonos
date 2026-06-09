-- Script completo de migraciones para sistema de bonos
-- Ejecutar en la base de datos tickets_system
-- Orden: primero alterar tablas existentes, luego crear nuevas tablas

-- =====================================================
-- PASO 1: Modificar campo cargo de users (STRING a JSON)
-- =====================================================

-- Para 888spa
-- Primero limpiar datos que no son JSON válido
UPDATE `888spa_users` SET cargo = NULL WHERE cargo IS NOT NULL AND JSON_VALID(cargo) = 0;
-- Luego modificar el tipo de columna
ALTER TABLE `888spa_users`
MODIFY COLUMN cargo JSON NULL AFTER role_id;

-- Para chillan
-- Primero limpiar datos que no son JSON válido
UPDATE `chillan_users` SET cargo = NULL WHERE cargo IS NOT NULL AND JSON_VALID(cargo) = 0;
-- Luego modificar el tipo de columna
ALTER TABLE `chillan_users`
MODIFY COLUMN cargo JSON NULL AFTER role_id;

-- =====================================================
-- PASO 2: Agregar campo image a cash_transactions
-- =====================================================

-- Para 888spa
ALTER TABLE `888spa_cash_transactions`
ADD COLUMN image VARCHAR(255) NULL AFTER description;

-- Para chillan
ALTER TABLE `chillan_cash_transactions`
ADD COLUMN image VARCHAR(255) NULL AFTER description;

-- =====================================================
-- PASO 3: Agregar admin_user_id a cash_transactions
-- =====================================================

-- Para 888spa
ALTER TABLE `888spa_cash_transactions`
ADD COLUMN admin_user_id BIGINT UNSIGNED NULL AFTER image,
ADD FOREIGN KEY (admin_user_id) REFERENCES 888spa_users(id) ON DELETE SET NULL;

-- Para chillan
ALTER TABLE `chillan_cash_transactions`
ADD COLUMN admin_user_id BIGINT UNSIGNED NULL AFTER image,
ADD FOREIGN KEY (admin_user_id) REFERENCES chillan_users(id) ON DELETE SET NULL;

