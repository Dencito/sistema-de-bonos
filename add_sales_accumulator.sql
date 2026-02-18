-- Agregar columna sales_accumulator a la tabla empresa_branches
ALTER TABLE `empresa_branches` 
ADD COLUMN `sales_accumulator` DECIMAL(15, 2) NOT NULL DEFAULT '0.00' AFTER `birthday_amount`;
