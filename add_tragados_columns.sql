-- ============================================================
-- Tragados: nuevo tipo de movimiento del Sistema Caja
-- ============================================================
--
-- Sigue la misma convencion que el resto de los tipos:
--
--   total_tragados            -> acumula TODO (caja + pasillera)
--   total_tragados_pasillera  -> acumula solo la parte de pasillera
--
-- El monto de caja NO se guarda: se calcula en el modelo CashShift como
-- total_tragados - total_tragados_pasillera y viaja al front como
-- total_tragados_caja. Es el mismo esquema de total_payments.
--
-- Aplica a los dos tenants que tienen caja: 888spa y chillan.
-- Si mas adelante se habilita caja en sanpablo, multiplay o mini, hay que
-- repetir el ALTER con ese prefijo.
--
-- Ojo: correr este script dos veces da error "Duplicate column name".
-- Es esperable y no rompe nada, significa que ya estaba aplicado.
-- ============================================================

ALTER TABLE `888spa_cash_shifts`
  ADD COLUMN `total_tragados` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `total_prestamo`,
  ADD COLUMN `total_tragados_pasillera` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `total_withdrawal_pasillera`;

ALTER TABLE `chillan_cash_shifts`
  ADD COLUMN `total_tragados` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `total_prestamo`,
  ADD COLUMN `total_tragados_pasillera` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `total_withdrawal_pasillera`;

-- ============================================================
-- Verificacion: las dos consultas deben devolver 2 filas cada una
-- ============================================================
--
-- SHOW COLUMNS FROM `888spa_cash_shifts` LIKE 'total_tragados%';
-- SHOW COLUMNS FROM `chillan_cash_shifts` LIKE 'total_tragados%';
--
-- No hace falta tocar cash_transactions ni pasilleras:
--   * cash_transactions.type es varchar(50), acepta 'tragados' sin cambios,
--     y ya tiene las columnas amount, client y machine que necesita el tipo.
--   * pasilleras.total_payments y current_balance ya absorben cualquier gasto
--     de la pasillera, sea del tipo que sea.
