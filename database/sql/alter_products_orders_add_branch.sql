-- ============================================
-- SQL para ACTUALIZAR tablas products y orders existentes
-- Agrega branch_id para filtrado por sucursal
-- Reemplaza {PREFIX} con el prefijo de cada empresa
-- ============================================

-- ============================================
-- SCRIPT COMPLETO - EJECUTAR TODO JUNTO
-- ============================================

-- TABLA PRODUCTS: Agregar branch_id
ALTER TABLE `{PREFIX}_products` ADD COLUMN `branch_id` bigint(20) UNSIGNED NULL AFTER `quantity`;
UPDATE `{PREFIX}_products` p SET p.branch_id = (SELECT id FROM `{PREFIX}_branches` LIMIT 1) WHERE p.branch_id IS NULL;
ALTER TABLE `{PREFIX}_products` MODIFY COLUMN `branch_id` bigint(20) UNSIGNED NOT NULL;
ALTER TABLE `{PREFIX}_products` ADD INDEX `{PREFIX}_products_branch_id_foreign` (`branch_id`);
ALTER TABLE `{PREFIX}_products` ADD CONSTRAINT `{PREFIX}_products_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `{PREFIX}_branches` (`id`) ON DELETE CASCADE;

-- TABLA ORDERS: Agregar user_id y branch_id
ALTER TABLE `{PREFIX}_orders` ADD COLUMN `user_id` bigint(20) UNSIGNED NULL AFTER `total`;
ALTER TABLE `{PREFIX}_orders` ADD COLUMN `branch_id` bigint(20) UNSIGNED NULL AFTER `user_id`;
UPDATE `{PREFIX}_orders` o SET o.user_id = (SELECT id FROM `{PREFIX}_users` LIMIT 1) WHERE o.user_id IS NULL;
UPDATE `{PREFIX}_orders` o SET o.branch_id = (SELECT id FROM `{PREFIX}_branches` LIMIT 1) WHERE o.branch_id IS NULL;
ALTER TABLE `{PREFIX}_orders` MODIFY COLUMN `user_id` bigint(20) UNSIGNED NOT NULL;
ALTER TABLE `{PREFIX}_orders` MODIFY COLUMN `branch_id` bigint(20) UNSIGNED NOT NULL;
ALTER TABLE `{PREFIX}_orders` ADD INDEX `{PREFIX}_orders_user_id_foreign` (`user_id`);
ALTER TABLE `{PREFIX}_orders` ADD INDEX `{PREFIX}_orders_branch_id_foreign` (`branch_id`);
ALTER TABLE `{PREFIX}_orders` ADD CONSTRAINT `{PREFIX}_orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `{PREFIX}_users` (`id`) ON DELETE CASCADE;
ALTER TABLE `{PREFIX}_orders` ADD CONSTRAINT `{PREFIX}_orders_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `{PREFIX}_branches` (`id`) ON DELETE CASCADE;

-- ============================================
-- VERIFICAR CAMBIOS
-- ============================================
-- DESCRIBE `{PREFIX}_products`;
-- DESCRIBE `{PREFIX}_orders`;

-- ============================================
-- ROLLBACK (si es necesario)
-- ============================================
-- ALTER TABLE `{PREFIX}_products` DROP FOREIGN KEY `{PREFIX}_products_branch_id_foreign`;
-- ALTER TABLE `{PREFIX}_products` DROP COLUMN `branch_id`;
-- ALTER TABLE `{PREFIX}_orders` DROP FOREIGN KEY `{PREFIX}_orders_user_id_foreign`;
-- ALTER TABLE `{PREFIX}_orders` DROP FOREIGN KEY `{PREFIX}_orders_branch_id_foreign`;
-- ALTER TABLE `{PREFIX}_orders` DROP COLUMN `user_id`;
-- ALTER TABLE `{PREFIX}_orders` DROP COLUMN `branch_id`;
