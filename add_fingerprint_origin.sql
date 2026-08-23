-- ============================================================
-- Motivo del registro de huella
-- ============================================================
--
-- Hoy un registro de huella solo guarda quien, donde y cuando. El "Entrada /
-- Salida" que se ve en pantalla no esta guardado: lo calcula el modelo por la
-- posicion del registro.
--
-- Falta el POR QUE. Una huella sin ticket asociado es ambigua: puede ser que el
-- jugador no tuviera bonos, que la sucursal tenga los tickets apagados, o que
-- sea la marca de asistencia de un trabajador. Los tres casos se ven igual.
--
-- Valores (ver App\Constants\FingerprintOrigin):
--
--   bono          Se entregaron bonos y se imprimieron tickets
--   sin_bono      Marco pero no le correspondia ningun bono
--   tickets_off   La sucursal tiene los tickets deshabilitados
--   asistencia    Marca directa, sin pasar por la entrega de bonos
--
-- Queda NULL en los registros viejos: no hay forma de deducir a posteriori cual
-- fue el motivo, asi que se muestran como "-" en la pantalla.
--
-- Ojo: correr este script dos veces da error "Duplicate column name".
-- ============================================================

ALTER TABLE `888spa_fingerprint_logs`
  ADD COLUMN `origin` VARCHAR(30) NULL DEFAULT NULL AFTER `branch_id`;

ALTER TABLE `chillan_fingerprint_logs`
  ADD COLUMN `origin` VARCHAR(30) NULL DEFAULT NULL AFTER `branch_id`;

-- Verificacion:
--   SHOW COLUMNS FROM `888spa_fingerprint_logs` LIKE 'origin';
