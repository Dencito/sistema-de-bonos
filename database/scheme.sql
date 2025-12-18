-- Para la tabla 888spa_pasilleras
ALTER TABLE `888spa_pasilleras` 
ADD COLUMN `user_id` BIGINT UNSIGNED NULL AFTER `cash_shift_id`,
ADD CONSTRAINT `888spa_pasilleras_user_id_foreign` 
FOREIGN KEY (`user_id`) REFERENCES `888spa_users` (`id`) ON DELETE CASCADE;

ALTER TABLE `888spa_pasilleras` DROP COLUMN `name`;