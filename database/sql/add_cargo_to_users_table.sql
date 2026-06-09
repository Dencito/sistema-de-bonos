-- Script para modificar campo cargo de users (STRING a JSON)
-- Ejecutar en la base de datos tickets_system

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
