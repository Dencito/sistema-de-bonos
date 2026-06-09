-- Script para agregar admin_user_id a cash_transactions
-- Ejecutar en la base de datos tickets_system

-- Para 888spa
ALTER TABLE 888spa_cash_transactions
ADD COLUMN admin_user_id BIGINT UNSIGNED NULL AFTER image,
ADD FOREIGN KEY (admin_user_id) REFERENCES 888spa_users(id) ON DELETE SET NULL;

-- Para chillan
ALTER TABLE chillan_cash_transactions
ADD COLUMN admin_user_id BIGINT UNSIGNED NULL AFTER image,
ADD FOREIGN KEY (admin_user_id) REFERENCES chillan_users(id) ON DELETE SET NULL;
