-- ============================================================
-- Cierre de pasillera: cuánto devolvió de verdad
--
-- Hasta ahora, al finalizar el turno la pasillera devolvía automáticamente
-- todo el saldo que decía el sistema. En la práctica no siempre coincide:
-- el sistema dice $300 y la pasillera le entrega $250 a la cajera.
--
-- Estas columnas guardan las dos cifras por separado y la diferencia, para
-- que el faltante quede a la vista en lugar de desaparecer. La cajera puede
-- corregir lo entregado después, y cada corrección queda en return_history
-- con quién la hizo y cuándo.
--
-- Empresas que tienen la tabla hoy: 888spa, chillan, nanu.
-- Si aparece otra, copiar un bloque y cambiarle el prefijo.
-- ============================================================

-- ------------------------------------------------------------
-- 888spa
-- ------------------------------------------------------------
ALTER TABLE `888spa_pasilleras`
    ADD COLUMN `expected_return`   decimal(14,2) DEFAULT NULL COMMENT 'Lo que el sistema decia al cerrar' AFTER `force_closed`,
    ADD COLUMN `returned_amount`   decimal(14,2) DEFAULT NULL COMMENT 'Lo que entrego de verdad' AFTER `expected_return`,
    ADD COLUMN `return_difference` decimal(14,2) DEFAULT NULL COMMENT 'Entregado - esperado. Negativo = faltante' AFTER `returned_amount`,
    ADD COLUMN `return_note`       varchar(255)  DEFAULT NULL AFTER `return_difference`,
    ADD COLUMN `closed_by`         bigint unsigned DEFAULT NULL COMMENT 'Quien cerro: la pasillera o la cajera' AFTER `return_note`,
    ADD COLUMN `closed_at`         timestamp     NULL DEFAULT NULL AFTER `closed_by`,
    ADD COLUMN `return_history`    json          DEFAULT NULL COMMENT 'Correcciones de la cajera: quien, cuando, de cuanto a cuanto' AFTER `closed_at`,
    ADD CONSTRAINT `888spa_pasilleras_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- chillan
-- ------------------------------------------------------------
ALTER TABLE `chillan_pasilleras`
    ADD COLUMN `expected_return`   decimal(14,2) DEFAULT NULL COMMENT 'Lo que el sistema decia al cerrar' AFTER `force_closed`,
    ADD COLUMN `returned_amount`   decimal(14,2) DEFAULT NULL COMMENT 'Lo que entrego de verdad' AFTER `expected_return`,
    ADD COLUMN `return_difference` decimal(14,2) DEFAULT NULL COMMENT 'Entregado - esperado. Negativo = faltante' AFTER `returned_amount`,
    ADD COLUMN `return_note`       varchar(255)  DEFAULT NULL AFTER `return_difference`,
    ADD COLUMN `closed_by`         bigint unsigned DEFAULT NULL COMMENT 'Quien cerro: la pasillera o la cajera' AFTER `return_note`,
    ADD COLUMN `closed_at`         timestamp     NULL DEFAULT NULL AFTER `closed_by`,
    ADD COLUMN `return_history`    json          DEFAULT NULL COMMENT 'Correcciones de la cajera: quien, cuando, de cuanto a cuanto' AFTER `closed_at`,
    ADD CONSTRAINT `chillan_pasilleras_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `chillan_users` (`id`) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- nanu
-- ------------------------------------------------------------
ALTER TABLE `nanu_pasilleras`
    ADD COLUMN `expected_return`   decimal(14,2) DEFAULT NULL COMMENT 'Lo que el sistema decia al cerrar' AFTER `force_closed`,
    ADD COLUMN `returned_amount`   decimal(14,2) DEFAULT NULL COMMENT 'Lo que entrego de verdad' AFTER `expected_return`,
    ADD COLUMN `return_difference` decimal(14,2) DEFAULT NULL COMMENT 'Entregado - esperado. Negativo = faltante' AFTER `returned_amount`,
    ADD COLUMN `return_note`       varchar(255)  DEFAULT NULL AFTER `return_difference`,
    ADD COLUMN `closed_by`         bigint unsigned DEFAULT NULL COMMENT 'Quien cerro: la pasillera o la cajera' AFTER `return_note`,
    ADD COLUMN `closed_at`         timestamp     NULL DEFAULT NULL AFTER `closed_by`,
    ADD COLUMN `return_history`    json          DEFAULT NULL COMMENT 'Correcciones de la cajera: quien, cuando, de cuanto a cuanto' AFTER `closed_at`,
    ADD CONSTRAINT `nanu_pasilleras_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `nanu_users` (`id`) ON DELETE SET NULL;
