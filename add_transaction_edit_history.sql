-- ============================================================
-- Historial de ediciones de los movimientos de caja
-- ============================================================
--
-- La pasillera puede corregir un movimiento suyo desde la app (monto, cliente,
-- maquina, tipo de gasto). Hasta ahora el valor viejo se pisaba y no quedaba
-- rastro de que se habia cambiado, quien lo cambio ni cuando.
--
-- Esta columna guarda esa historia dentro del propio movimiento:
--
--   [
--     {
--       "at": "2026-08-20 12:26:03",
--       "user_id": 6,
--       "user": "Yohana Marquez",
--       "changes": {
--         "amount":  { "from": "1000.00", "to": "2000.00" },
--         "machine": { "from": "1", "to": "5" }
--       }
--     }
--   ]
--
-- Solo se anotan los campos que realmente cambiaron. Si se edita y se deja todo
-- igual, no se agrega ninguna entrada.
--
-- Se guarda en el mismo movimiento y no en una tabla aparte porque siempre se
-- lee junto con el, es historia acotada (unas pocas correcciones por
-- movimiento) y evita un join y una tabla nueva por cada tenant.
--
-- Ojo: correr este script dos veces da error "Duplicate column name".
-- Es esperable y significa que ya estaba aplicado.
-- ============================================================

ALTER TABLE `888spa_cash_transactions`
  ADD COLUMN `edit_history` JSON NULL DEFAULT NULL AFTER `description`;

ALTER TABLE `chillan_cash_transactions`
  ADD COLUMN `edit_history` JSON NULL DEFAULT NULL AFTER `description`;

-- ============================================================
-- Verificacion
-- ============================================================
--
-- SHOW COLUMNS FROM `888spa_cash_transactions` LIKE 'edit_history';
--
-- Las empresas nuevas ya nacen con la columna: se agrego tambien a
-- CompanyDatabaseService.
