-- Script para agregar columnas de asistencia de bonos a tablas branches existentes
-- Ejecutar en la base de datos tickets_system

-- Para 888spa
ALTER TABLE `888spa_branches` ADD COLUMN `bonus_attendance_enabled` BOOLEAN DEFAULT FALSE AFTER `ticketNumber`;
ALTER TABLE `888spa_branches` ADD COLUMN `bonus_attendance_days` JSON NULL AFTER `bonus_attendance_enabled`;
ALTER TABLE `888spa_branches` ADD COLUMN `bonus_category_payout_day` VARCHAR(255) NULL AFTER `bonus_attendance_days`;

-- Para chillan
ALTER TABLE `chillan_branches` ADD COLUMN `bonus_attendance_enabled` BOOLEAN DEFAULT FALSE AFTER `ticketNumber`;
ALTER TABLE `chillan_branches` ADD COLUMN `bonus_attendance_days` JSON NULL AFTER `bonus_attendance_enabled`;
ALTER TABLE `chillan_branches` ADD COLUMN `bonus_category_payout_day` VARCHAR(255) NULL AFTER `bonus_attendance_days`;
