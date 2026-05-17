-- Script para cambiar CASCADE DELETE a ON DELETE SET NULL en producción
-- Reemplaza 888spa con el nombre real de tu empresa (ej: chillan, 888spa, etc.)
-- NOTA: Ejecutar en la base de datos tickets_system

-- 1. Dropear TODAS las foreign keys de tablas 888spa_*
-- IGNORAR ERRORES de "foreign key doesn't exist" - es normal si ya no existen
ALTER TABLE `888spa_bonuses` DROP FOREIGN KEY `888spa_bonuses_user_id_foreign`;

ALTER TABLE `888spa_branches` DROP FOREIGN KEY `888spa_branches_company_id_foreign`;
ALTER TABLE `888spa_branches` DROP FOREIGN KEY `888spa_branches_status_id_foreign`;

ALTER TABLE `888spa_cash_shifts` DROP FOREIGN KEY `888spa_cash_shifts_admin_user_id_foreign`;
ALTER TABLE `888spa_cash_shifts` DROP FOREIGN KEY `888spa_cash_shifts_branch_id_foreign`;
ALTER TABLE `888spa_cash_shifts` DROP FOREIGN KEY `888spa_cash_shifts_user_id_foreign`;

ALTER TABLE `888spa_cash_transactions` DROP FOREIGN KEY `888spa_cash_transactions_cash_shift_id_foreign`;
ALTER TABLE `888spa_cash_transactions` DROP FOREIGN KEY `888spa_cash_transactions_pasillera_id_foreign`;



ALTER TABLE `888spa_companies` DROP FOREIGN KEY `888spa_companies_status_id_foreign`;

ALTER TABLE `888spa_fingerprint_logs` DROP FOREIGN KEY `888spa_fingerprint_logs_branch_id_foreign`;
ALTER TABLE `888spa_fingerprint_logs` DROP FOREIGN KEY `888spa_fingerprint_logs_user_id_foreign`;

ALTER TABLE `888spa_orders` DROP FOREIGN KEY `888spa_orders_branch_id_foreign`;
ALTER TABLE `888spa_orders` DROP FOREIGN KEY `888spa_orders_user_id_foreign`;

ALTER TABLE `888spa_pasilleras` DROP FOREIGN KEY `888spa_pasilleras_cash_shift_id_foreign`;
ALTER TABLE `888spa_pasilleras` DROP FOREIGN KEY `888spa_pasilleras_user_id_foreign`;

ALTER TABLE `888spa_products` DROP FOREIGN KEY `888spa_products_branch_id_foreign`;

ALTER TABLE `888spa_sales_withdrawals` DROP FOREIGN KEY `888spa_sales_withdrawals_branch_id_foreign`;
ALTER TABLE `888spa_sales_withdrawals` DROP FOREIGN KEY `888spa_sales_withdrawals_user_id_foreign`;

ALTER TABLE `888spa_shifts` DROP FOREIGN KEY `888spa_shifts_branch_id_foreign`;
ALTER TABLE `888spa_shifts` DROP FOREIGN KEY `888spa_shifts_closed_by_user_id_foreign`;
ALTER TABLE `888spa_shifts` DROP FOREIGN KEY `888spa_shifts_opened_by_user_id_foreign`;

ALTER TABLE `888spa_tickets` DROP FOREIGN KEY `888spa_tickets_branch_id_foreign`;
ALTER TABLE `888spa_tickets` DROP FOREIGN KEY `888spa_tickets_user_id_foreign`;

ALTER TABLE `888spa_totems` DROP FOREIGN KEY `888spa_totems_branch_id_foreign`;

ALTER TABLE `888spa_users` DROP FOREIGN KEY `888spa_users_branch_id_foreign`;
ALTER TABLE `888spa_users` DROP FOREIGN KEY `888spa_users_category_bonus_id_foreign`;
ALTER TABLE `888spa_users` DROP FOREIGN KEY `888spa_users_company_id_foreign`;
ALTER TABLE `888spa_users` DROP FOREIGN KEY `888spa_users_role_id_foreign`;
ALTER TABLE `888spa_users` DROP FOREIGN KEY `888spa_users_status_id_foreign`;

ALTER TABLE `888spa_user_branches` DROP FOREIGN KEY `888spa_user_branches_branch_id_foreign`;
ALTER TABLE `888spa_user_branches` DROP FOREIGN KEY `888spa_user_branches_user_id_foreign`;

-- 2. Cambiar columnas de NOT NULL a NULL
ALTER TABLE `888spa_companies` MODIFY `status_id` bigint unsigned DEFAULT NULL;

ALTER TABLE `888spa_branches` MODIFY `status_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_branches` MODIFY `company_id` bigint unsigned DEFAULT NULL;

ALTER TABLE `888spa_users` MODIFY `role_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_users` MODIFY `status_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_users` MODIFY `branch_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_users` MODIFY `company_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_users` MODIFY `category_bonus_id` bigint unsigned DEFAULT NULL;

ALTER TABLE `888spa_bonuses` MODIFY `user_id` bigint unsigned DEFAULT NULL;

ALTER TABLE `888spa_totems` MODIFY `branch_id` bigint unsigned DEFAULT NULL;

ALTER TABLE `888spa_cash_shifts` MODIFY `user_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_cash_shifts` MODIFY `branch_id` bigint unsigned DEFAULT NULL;

ALTER TABLE `888spa_pasilleras` MODIFY `cash_shift_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_pasilleras` MODIFY `user_id` bigint unsigned DEFAULT NULL;

ALTER TABLE `888spa_cash_transactions` MODIFY `cash_shift_id` bigint unsigned DEFAULT NULL;

ALTER TABLE `888spa_fingerprint_logs` MODIFY `user_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_fingerprint_logs` MODIFY `branch_id` bigint unsigned DEFAULT NULL;

ALTER TABLE `888spa_shifts` MODIFY `branch_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_shifts` MODIFY `opened_by_user_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_shifts` MODIFY `closed_by_user_id` bigint unsigned DEFAULT NULL;

ALTER TABLE `888spa_tickets` MODIFY `user_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_tickets` MODIFY `branch_id` bigint unsigned DEFAULT NULL;

ALTER TABLE `888spa_user_branches` MODIFY `user_id` bigint unsigned DEFAULT NULL;
ALTER TABLE `888spa_user_branches` MODIFY `branch_id` bigint unsigned DEFAULT NULL;

-- 3. Agregar foreign keys con ON DELETE SET NULL

ALTER TABLE `888spa_companies` DROP FOREIGN KEY `888spa_companies_status_id_foreign`;
ALTER TABLE `888spa_companies`
  ADD CONSTRAINT `888spa_companies_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `888spa_statuses` (`id`) ON DELETE SET NULL;



ALTER TABLE `888spa_branches` DROP FOREIGN KEY `888spa_branches_company_id_foreign`;
ALTER TABLE `888spa_branches` DROP FOREIGN KEY `888spa_branches_status_id_foreign`;
ALTER TABLE `888spa_branches`
  ADD CONSTRAINT `888spa_branches_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `888spa_companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_branches_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `888spa_statuses` (`id`) ON DELETE SET NULL;

ALTER TABLE `888spa_users` DROP FOREIGN KEY `888spa_users_branch_id_foreign`;
ALTER TABLE `888spa_users` DROP FOREIGN KEY `888spa_users_category_bonus_id_foreign`;
ALTER TABLE `888spa_users` DROP FOREIGN KEY `888spa_users_company_id_foreign`;
ALTER TABLE `888spa_users` DROP FOREIGN KEY `888spa_users_role_id_foreign`;
ALTER TABLE `888spa_users` DROP FOREIGN KEY `888spa_users_status_id_foreign`;
ALTER TABLE `888spa_users`
  ADD CONSTRAINT `888spa_users_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `888spa_branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_users_category_bonus_id_foreign` FOREIGN KEY (`category_bonus_id`) REFERENCES `888spa_category_bonuses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_users_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `888spa_companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `888spa_roles` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_users_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `888spa_statuses` (`id`) ON DELETE SET NULL;

ALTER TABLE `888spa_bonuses` DROP FOREIGN KEY `888spa_bonuses_user_id_foreign`;
ALTER TABLE `888spa_bonuses`
  ADD CONSTRAINT `888spa_bonuses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL;

ALTER TABLE `888spa_totems` DROP FOREIGN KEY `888spa_totems_branch_id_foreign`;
ALTER TABLE `888spa_totems`
  ADD CONSTRAINT `888spa_totems_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `888spa_branches` (`id`) ON DELETE SET NULL;

ALTER TABLE `888spa_cash_shifts` DROP FOREIGN KEY `888spa_cash_shifts_user_id_foreign`;
ALTER TABLE `888spa_cash_shifts` DROP FOREIGN KEY `888spa_cash_shifts_branch_id_foreign`;
ALTER TABLE `888spa_cash_shifts` DROP FOREIGN KEY `888spa_cash_shifts_admin_user_id_foreign`;
ALTER TABLE `888spa_cash_shifts`
  ADD CONSTRAINT `888spa_cash_shifts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_cash_shifts_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `888spa_branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_cash_shifts_admin_user_id_foreign` FOREIGN KEY (`admin_user_id`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL;

ALTER TABLE `888spa_pasilleras` DROP FOREIGN KEY `888spa_pasilleras_cash_shift_id_foreign`;
ALTER TABLE `888spa_pasilleras` DROP FOREIGN KEY `888spa_pasilleras_user_id_foreign`;
ALTER TABLE `888spa_pasilleras`
  ADD CONSTRAINT `888spa_pasilleras_cash_shift_id_foreign` FOREIGN KEY (`cash_shift_id`) REFERENCES `888spa_cash_shifts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_pasilleras_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL;

ALTER TABLE `888spa_cash_transactions` DROP FOREIGN KEY `888spa_cash_transactions_cash_shift_id_foreign`;
ALTER TABLE `888spa_cash_transactions` DROP FOREIGN KEY `888spa_cash_transactions_pasillera_id_foreign`;
ALTER TABLE `888spa_cash_transactions`
  ADD CONSTRAINT `888spa_cash_transactions_cash_shift_id_foreign` FOREIGN KEY (`cash_shift_id`) REFERENCES `888spa_cash_shifts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_cash_transactions_pasillera_id_foreign` FOREIGN KEY (`pasillera_id`) REFERENCES `888spa_pasilleras` (`id`) ON DELETE SET NULL;

ALTER TABLE `888spa_fingerprint_logs` DROP FOREIGN KEY `888spa_fingerprint_logs_branch_id_foreign`;
ALTER TABLE `888spa_fingerprint_logs` DROP FOREIGN KEY `888spa_fingerprint_logs_user_id_foreign`;
ALTER TABLE `888spa_fingerprint_logs`
  ADD CONSTRAINT `888spa_fingerprint_logs_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `888spa_branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_fingerprint_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL;

ALTER TABLE `888spa_shifts` DROP FOREIGN KEY `888spa_shifts_branch_id_foreign`;
ALTER TABLE `888spa_shifts` DROP FOREIGN KEY `888spa_shifts_closed_by_user_id_foreign`;
ALTER TABLE `888spa_shifts` DROP FOREIGN KEY `888spa_shifts_opened_by_user_id_foreign`;
ALTER TABLE `888spa_shifts`
  ADD CONSTRAINT `888spa_shifts_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `888spa_branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_shifts_closed_by_user_id_foreign` FOREIGN KEY (`closed_by_user_id`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_shifts_opened_by_user_id_foreign` FOREIGN KEY (`opened_by_user_id`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL;

ALTER TABLE `888spa_user_branches` DROP FOREIGN KEY `888spa_user_branches_branch_id_foreign`;
ALTER TABLE `888spa_user_branches` DROP FOREIGN KEY `888spa_user_branches_user_id_foreign`;
ALTER TABLE `888spa_user_branches`
  ADD CONSTRAINT `888spa_user_branches_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `888spa_branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_user_branches_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL;


ALTER TABLE `888spa_tickets` DROP FOREIGN KEY `888spa_tickets_branch_id_foreign`;
ALTER TABLE `888spa_tickets` DROP FOREIGN KEY `888spa_tickets_user_id_foreign`;
ALTER TABLE `888spa_tickets`
  ADD CONSTRAINT `888spa_tickets_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `888spa_branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `888spa_tickets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL;
