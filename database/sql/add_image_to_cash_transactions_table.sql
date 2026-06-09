-- Script para agregar campo image a cash_transactions
-- Ejecutar en la base de datos tickets_system

-- Para 888spa
ALTER TABLE 888spa_cash_transactions
ADD COLUMN image VARCHAR(255) NULL AFTER description;

-- Para chillan
ALTER TABLE chillan_cash_transactions
ADD COLUMN image VARCHAR(255) NULL AFTER description;
