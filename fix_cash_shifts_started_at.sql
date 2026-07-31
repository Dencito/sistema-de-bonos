-- ============================================================
-- started_at de los turnos de caja se reescribe solo
-- ============================================================
--
-- La columna quedo definida asi:
--
--   started_at timestamp NOT NULL
--     DEFAULT CURRENT_TIMESTAMP
--     ON UPDATE CURRENT_TIMESTAMP
--
-- El "ON UPDATE CURRENT_TIMESTAMP" hace que MySQL le reescriba la hora CADA VEZ
-- que se modifica la fila del turno. Y como el turno se actualiza en cada
-- transaccion (los acumuladores y el saldo viven ahi), started_at deja de ser
-- "cuando se abrio la caja" y pasa a ser "la ultima vez que se toco el turno".
--
-- Ademas ese CURRENT_TIMESTAMP lo pone MySQL con SU reloj, que corre en horario
-- del sistema, mientras que la app escribe en horario de Chile. Por eso los
-- turnos aparecen con started_at una hora adelantado respecto de ended_at, al
-- punto de figurar cerrados ANTES de abiertos.
--
-- Que se rompe por esto:
--   * El "Turno abierto desde ..." muestra cualquier cosa.
--   * Los tickets del turno se buscan con
--     whereBetween('created_at', [started_at, ended_at]): con started_at
--     corrido, la ventana queda mal y se pierden o sobran tickets.
--   * findActiveShift ordena por started_at, o sea por ultima modificacion.
--
-- La app siempre setea started_at explicitamente (esta en $fillable de
-- CashShift), asi que no hace falta ningun default: alcanza con sacarle el
-- automatismo. Se deja igual que en los tenants nuevos, que ya nacen bien
-- porque los crea CompanyDatabaseService con Laravel.
--
-- OJO: esto arregla de acá en adelante. Los started_at ya reescritos no se
-- pueden recuperar, se perdio el dato original.
-- ============================================================

ALTER TABLE `888spa_cash_shifts`
  MODIFY COLUMN `started_at` TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE `chillan_cash_shifts`
  MODIFY COLUMN `started_at` TIMESTAMP NULL DEFAULT NULL;

-- ============================================================
-- Verificacion: la columna Extra tiene que quedar vacia
-- ============================================================
--
-- SHOW COLUMNS FROM `888spa_cash_shifts` LIKE 'started_at';
-- SHOW COLUMNS FROM `chillan_cash_shifts` LIKE 'started_at';
--
-- Conviene revisar tambien el resto de las tablas por si arrastran lo mismo:
--
--   SELECT TABLE_NAME, COLUMN_NAME, EXTRA
--   FROM information_schema.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE()
--     AND EXTRA LIKE '%on update%'
--     AND COLUMN_NAME <> 'updated_at';
