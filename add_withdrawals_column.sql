-- Agregar columna withdrawals JSON a la tabla empresa_branches
ALTER TABLE `888spa_branches` 
ADD COLUMN `withdrawals` JSON DEFAULT NULL AFTER `sales_accumulator`;
