-- ============================================================
-- Marcar que sucursales operan con caja
-- ============================================================
--
-- No todas las sucursales manejan caja. Hasta ahora no habia forma de saberlo,
-- asi que la entrega de bonos no podia exigir que hubiera una caja abierta: en
-- las sucursales sin caja habria bloqueado todo.
--
-- Con esta bandera:
--
--   has_cash_register = 0  ->  la sucursal no usa caja. Los bonos se entregan
--                              como siempre, sin mirar turnos de caja.
--   has_cash_register = 1  ->  la sucursal opera con caja. No se entregan bonos
--                              si no hay un turno de caja abierto, porque el
--                              ticket descuenta del saldo y sin caja abierta ese
--                              dinero no queda registrado en ningun lado.
--
-- Por defecto queda en 0 para no cambiarle el comportamiento a ninguna sucursal
-- existente: hay que encenderla a mano en las que corresponda.
--
-- Se agrega en todos los tenants, tengan o no la funcion de tickets, para que
-- el esquema quede parejo.
--
-- Ojo: correr este script dos veces da error "Duplicate column name".
-- Es esperable y significa que ya estaba aplicado.
-- ============================================================

ALTER TABLE `888spa_branches`
  ADD COLUMN `has_cash_register` TINYINT(1) NOT NULL DEFAULT 0 AFTER `tickets_enabled`;

ALTER TABLE `chillan_branches`
  ADD COLUMN `has_cash_register` TINYINT(1) NOT NULL DEFAULT 0 AFTER `tickets_enabled`;

-- ============================================================
-- Despues de aplicarlo: encender la bandera donde corresponda.
-- Estas son las sucursales que ya tienen turnos de caja registrados,
-- o sea las que efectivamente la usan:
--
--   SELECT DISTINCT b.id, b.name
--   FROM `888spa_branches` b
--   JOIN `888spa_cash_shifts` s ON s.branch_id = b.id;
--
--   UPDATE `888spa_branches` SET `has_cash_register` = 1 WHERE id IN (...);
--
-- Verificacion:
--   SHOW COLUMNS FROM `888spa_branches` LIKE 'has_cash_register';
-- ============================================================
