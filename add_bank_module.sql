-- ============================================================
-- Modulo Bancos Online
--
-- Reemplaza la planilla "bancos online" por tablas del sistema.
-- Las cuentas son de la empresa entera: no llevan branch_id.
--
-- Los movimientos pertenecen a un turno (bank_shifts), que alguien
-- abre y alguien cierra: queda registrado quien y cuando.
--
-- Signo del monto: positivo = entra plata a la cuenta, negativo = sale.
-- Lo define el `sign` del tipo (bank_kinds), no quien carga.
-- Un traspaso entre cuentas son dos filas con el mismo transfer_group_id.
--
-- Si Quilicura u otra empresa usa un prefijo que no esta abajo,
-- copiar un bloque completo y cambiarle el prefijo.
-- ============================================================

-- ------------------------------------------------------------
-- 888spa
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `888spa_bank_accounts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `slug` varchar(50) NOT NULL,
    `initial_balance` decimal(14,2) NOT NULL DEFAULT '0.00',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `888spa_bank_accounts_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `888spa_bank_kinds` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(60) NOT NULL,
    `slug` varchar(60) NOT NULL,
    `sign` varchar(10) NOT NULL DEFAULT 'both',
    `is_system` tinyint(1) NOT NULL DEFAULT '0',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `888spa_bank_kinds_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `888spa_bank_shifts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `opened_by` bigint unsigned DEFAULT NULL,
    `opened_at` timestamp NULL DEFAULT NULL,
    `closed_by` bigint unsigned DEFAULT NULL,
    `closed_at` timestamp NULL DEFAULT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `source` varchar(20) NOT NULL DEFAULT 'manual',
    `opening_note` varchar(255) DEFAULT NULL,
    `closing_note` varchar(255) DEFAULT NULL,
    `opening_balances` json DEFAULT NULL,
    `proposed_balances` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `888spa_bank_shifts_active_index` (`is_active`),
    KEY `888spa_bank_shifts_opened_at_index` (`opened_at`),
    CONSTRAINT `888spa_bank_shifts_opened_by_foreign` FOREIGN KEY (`opened_by`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `888spa_bank_shifts_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `888spa_bank_clients` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `external_id` varchar(30) DEFAULT NULL,
    `name` varchar(150) NOT NULL,
    `normalized_name` varchar(150) NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `notes` varchar(255) DEFAULT NULL,
    `merged_into_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `888spa_bank_clients_external_id_index` (`external_id`),
    KEY `888spa_bank_clients_normalized_name_index` (`normalized_name`),
    CONSTRAINT `888spa_bank_clients_merged_into_id_foreign` FOREIGN KEY (`merged_into_id`) REFERENCES `888spa_bank_clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `888spa_bank_imports` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `filename` varchar(255) NOT NULL,
    `rows_total` int NOT NULL DEFAULT '0',
    `rows_imported` int NOT NULL DEFAULT '0',
    `rows_skipped` int NOT NULL DEFAULT '0',
    `period_start` date DEFAULT NULL,
    `period_end` date DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `notes` text,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `888spa_bank_imports_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `888spa_bank_movements` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `date` date NOT NULL,
    `bank_shift_id` bigint unsigned DEFAULT NULL,
    `bank_account_id` bigint unsigned NOT NULL,
    `bank_client_id` bigint unsigned DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `amount` decimal(14,2) NOT NULL,
    `kind` varchar(60) NOT NULL DEFAULT 'carga',
    `description` varchar(255) DEFAULT NULL,
    `transfer_group_id` char(36) DEFAULT NULL,
    `bank_import_id` bigint unsigned DEFAULT NULL,
    `edit_history` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `888spa_bank_movements_date_index` (`date`),
    KEY `888spa_bank_movements_shift_index` (`bank_shift_id`),
    KEY `888spa_bank_movements_account_index` (`bank_account_id`),
    KEY `888spa_bank_movements_client_index` (`bank_client_id`),
    KEY `888spa_bank_movements_transfer_index` (`transfer_group_id`),
    KEY `888spa_bank_movements_import_index` (`bank_import_id`),
    CONSTRAINT `888spa_bank_movements_shift_foreign` FOREIGN KEY (`bank_shift_id`) REFERENCES `888spa_bank_shifts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `888spa_bank_movements_account_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `888spa_bank_accounts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `888spa_bank_movements_client_foreign` FOREIGN KEY (`bank_client_id`) REFERENCES `888spa_bank_clients` (`id`) ON DELETE SET NULL,
    CONSTRAINT `888spa_bank_movements_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `888spa_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `888spa_bank_accounts` (`name`, `slug`, `initial_balance`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Estado Friendly',  'friendly',   0, 1, NOW(), NOW()),
    ('BCI',              'bci',        0, 2, NOW(), NOW()),
    ('Banco Falabella',  'falabella',  0, 3, NOW(), NOW()),
    ('Banco Rentamania', 'rentamania', 0, 4, NOW(), NOW()),
    ('Cuenta RUT',       'cuenta_rut', 0, 5, NOW(), NOW()),
    ('Ahorro',           'ahorro',     0, 6, NOW(), NOW()),
    ('Menta Limon',      'chile',      0, 7, NOW(), NOW()),
    ('Efectivo',         'efectivo',   0, 8, NOW(), NOW());

INSERT IGNORE INTO `888spa_bank_kinds` (`name`, `slug`, `sign`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Carga',                  'carga',    'in',       1, 1, NOW(), NOW()),
    ('Retiro',                 'retiro',   'out',      1, 2, NOW(), NOW()),
    ('Traspaso entre cuentas', 'traspaso', 'transfer', 1, 3, NOW(), NOW()),
    ('Ajuste',                 'ajuste',   'both',     1, 4, NOW(), NOW());

-- ------------------------------------------------------------
-- chillan
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chillan_bank_accounts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `slug` varchar(50) NOT NULL,
    `initial_balance` decimal(14,2) NOT NULL DEFAULT '0.00',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `chillan_bank_accounts_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `chillan_bank_kinds` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(60) NOT NULL,
    `slug` varchar(60) NOT NULL,
    `sign` varchar(10) NOT NULL DEFAULT 'both',
    `is_system` tinyint(1) NOT NULL DEFAULT '0',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `chillan_bank_kinds_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `chillan_bank_shifts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `opened_by` bigint unsigned DEFAULT NULL,
    `opened_at` timestamp NULL DEFAULT NULL,
    `closed_by` bigint unsigned DEFAULT NULL,
    `closed_at` timestamp NULL DEFAULT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `source` varchar(20) NOT NULL DEFAULT 'manual',
    `opening_note` varchar(255) DEFAULT NULL,
    `closing_note` varchar(255) DEFAULT NULL,
    `opening_balances` json DEFAULT NULL,
    `proposed_balances` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `chillan_bank_shifts_active_index` (`is_active`),
    KEY `chillan_bank_shifts_opened_at_index` (`opened_at`),
    CONSTRAINT `chillan_bank_shifts_opened_by_foreign` FOREIGN KEY (`opened_by`) REFERENCES `chillan_users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `chillan_bank_shifts_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `chillan_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `chillan_bank_clients` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `external_id` varchar(30) DEFAULT NULL,
    `name` varchar(150) NOT NULL,
    `normalized_name` varchar(150) NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `notes` varchar(255) DEFAULT NULL,
    `merged_into_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `chillan_bank_clients_external_id_index` (`external_id`),
    KEY `chillan_bank_clients_normalized_name_index` (`normalized_name`),
    CONSTRAINT `chillan_bank_clients_merged_into_id_foreign` FOREIGN KEY (`merged_into_id`) REFERENCES `chillan_bank_clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `chillan_bank_imports` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `filename` varchar(255) NOT NULL,
    `rows_total` int NOT NULL DEFAULT '0',
    `rows_imported` int NOT NULL DEFAULT '0',
    `rows_skipped` int NOT NULL DEFAULT '0',
    `period_start` date DEFAULT NULL,
    `period_end` date DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `notes` text,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `chillan_bank_imports_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `chillan_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `chillan_bank_movements` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `date` date NOT NULL,
    `bank_shift_id` bigint unsigned DEFAULT NULL,
    `bank_account_id` bigint unsigned NOT NULL,
    `bank_client_id` bigint unsigned DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `amount` decimal(14,2) NOT NULL,
    `kind` varchar(60) NOT NULL DEFAULT 'carga',
    `description` varchar(255) DEFAULT NULL,
    `transfer_group_id` char(36) DEFAULT NULL,
    `bank_import_id` bigint unsigned DEFAULT NULL,
    `edit_history` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `chillan_bank_movements_date_index` (`date`),
    KEY `chillan_bank_movements_shift_index` (`bank_shift_id`),
    KEY `chillan_bank_movements_account_index` (`bank_account_id`),
    KEY `chillan_bank_movements_client_index` (`bank_client_id`),
    KEY `chillan_bank_movements_transfer_index` (`transfer_group_id`),
    KEY `chillan_bank_movements_import_index` (`bank_import_id`),
    CONSTRAINT `chillan_bank_movements_shift_foreign` FOREIGN KEY (`bank_shift_id`) REFERENCES `chillan_bank_shifts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `chillan_bank_movements_account_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `chillan_bank_accounts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chillan_bank_movements_client_foreign` FOREIGN KEY (`bank_client_id`) REFERENCES `chillan_bank_clients` (`id`) ON DELETE SET NULL,
    CONSTRAINT `chillan_bank_movements_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `chillan_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `chillan_bank_accounts` (`name`, `slug`, `initial_balance`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Estado Friendly',  'friendly',   0, 1, NOW(), NOW()),
    ('BCI',              'bci',        0, 2, NOW(), NOW()),
    ('Banco Falabella',  'falabella',  0, 3, NOW(), NOW()),
    ('Banco Rentamania', 'rentamania', 0, 4, NOW(), NOW()),
    ('Cuenta RUT',       'cuenta_rut', 0, 5, NOW(), NOW()),
    ('Ahorro',           'ahorro',     0, 6, NOW(), NOW()),
    ('Menta Limon',      'chile',      0, 7, NOW(), NOW()),
    ('Efectivo',         'efectivo',   0, 8, NOW(), NOW());

INSERT IGNORE INTO `chillan_bank_kinds` (`name`, `slug`, `sign`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Carga',                  'carga',    'in',       1, 1, NOW(), NOW()),
    ('Retiro',                 'retiro',   'out',      1, 2, NOW(), NOW()),
    ('Traspaso entre cuentas', 'traspaso', 'transfer', 1, 3, NOW(), NOW()),
    ('Ajuste',                 'ajuste',   'both',     1, 4, NOW(), NOW());

-- ------------------------------------------------------------
-- mini
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mini_bank_accounts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `slug` varchar(50) NOT NULL,
    `initial_balance` decimal(14,2) NOT NULL DEFAULT '0.00',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `mini_bank_accounts_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mini_bank_kinds` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(60) NOT NULL,
    `slug` varchar(60) NOT NULL,
    `sign` varchar(10) NOT NULL DEFAULT 'both',
    `is_system` tinyint(1) NOT NULL DEFAULT '0',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `mini_bank_kinds_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mini_bank_shifts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `opened_by` bigint unsigned DEFAULT NULL,
    `opened_at` timestamp NULL DEFAULT NULL,
    `closed_by` bigint unsigned DEFAULT NULL,
    `closed_at` timestamp NULL DEFAULT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `source` varchar(20) NOT NULL DEFAULT 'manual',
    `opening_note` varchar(255) DEFAULT NULL,
    `closing_note` varchar(255) DEFAULT NULL,
    `opening_balances` json DEFAULT NULL,
    `proposed_balances` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `mini_bank_shifts_active_index` (`is_active`),
    KEY `mini_bank_shifts_opened_at_index` (`opened_at`),
    CONSTRAINT `mini_bank_shifts_opened_by_foreign` FOREIGN KEY (`opened_by`) REFERENCES `mini_users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `mini_bank_shifts_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `mini_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mini_bank_clients` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `external_id` varchar(30) DEFAULT NULL,
    `name` varchar(150) NOT NULL,
    `normalized_name` varchar(150) NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `notes` varchar(255) DEFAULT NULL,
    `merged_into_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `mini_bank_clients_external_id_index` (`external_id`),
    KEY `mini_bank_clients_normalized_name_index` (`normalized_name`),
    CONSTRAINT `mini_bank_clients_merged_into_id_foreign` FOREIGN KEY (`merged_into_id`) REFERENCES `mini_bank_clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mini_bank_imports` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `filename` varchar(255) NOT NULL,
    `rows_total` int NOT NULL DEFAULT '0',
    `rows_imported` int NOT NULL DEFAULT '0',
    `rows_skipped` int NOT NULL DEFAULT '0',
    `period_start` date DEFAULT NULL,
    `period_end` date DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `notes` text,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `mini_bank_imports_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `mini_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mini_bank_movements` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `date` date NOT NULL,
    `bank_shift_id` bigint unsigned DEFAULT NULL,
    `bank_account_id` bigint unsigned NOT NULL,
    `bank_client_id` bigint unsigned DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `amount` decimal(14,2) NOT NULL,
    `kind` varchar(60) NOT NULL DEFAULT 'carga',
    `description` varchar(255) DEFAULT NULL,
    `transfer_group_id` char(36) DEFAULT NULL,
    `bank_import_id` bigint unsigned DEFAULT NULL,
    `edit_history` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `mini_bank_movements_date_index` (`date`),
    KEY `mini_bank_movements_shift_index` (`bank_shift_id`),
    KEY `mini_bank_movements_account_index` (`bank_account_id`),
    KEY `mini_bank_movements_client_index` (`bank_client_id`),
    KEY `mini_bank_movements_transfer_index` (`transfer_group_id`),
    KEY `mini_bank_movements_import_index` (`bank_import_id`),
    CONSTRAINT `mini_bank_movements_shift_foreign` FOREIGN KEY (`bank_shift_id`) REFERENCES `mini_bank_shifts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `mini_bank_movements_account_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `mini_bank_accounts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `mini_bank_movements_client_foreign` FOREIGN KEY (`bank_client_id`) REFERENCES `mini_bank_clients` (`id`) ON DELETE SET NULL,
    CONSTRAINT `mini_bank_movements_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `mini_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `mini_bank_accounts` (`name`, `slug`, `initial_balance`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Estado Friendly',  'friendly',   0, 1, NOW(), NOW()),
    ('BCI',              'bci',        0, 2, NOW(), NOW()),
    ('Banco Falabella',  'falabella',  0, 3, NOW(), NOW()),
    ('Banco Rentamania', 'rentamania', 0, 4, NOW(), NOW()),
    ('Cuenta RUT',       'cuenta_rut', 0, 5, NOW(), NOW()),
    ('Ahorro',           'ahorro',     0, 6, NOW(), NOW()),
    ('Menta Limon',      'chile',      0, 7, NOW(), NOW()),
    ('Efectivo',         'efectivo',   0, 8, NOW(), NOW());

INSERT IGNORE INTO `mini_bank_kinds` (`name`, `slug`, `sign`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Carga',                  'carga',    'in',       1, 1, NOW(), NOW()),
    ('Retiro',                 'retiro',   'out',      1, 2, NOW(), NOW()),
    ('Traspaso entre cuentas', 'traspaso', 'transfer', 1, 3, NOW(), NOW()),
    ('Ajuste',                 'ajuste',   'both',     1, 4, NOW(), NOW());

-- ------------------------------------------------------------
-- multiplay
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `multiplay_bank_accounts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `slug` varchar(50) NOT NULL,
    `initial_balance` decimal(14,2) NOT NULL DEFAULT '0.00',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `multiplay_bank_accounts_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `multiplay_bank_kinds` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(60) NOT NULL,
    `slug` varchar(60) NOT NULL,
    `sign` varchar(10) NOT NULL DEFAULT 'both',
    `is_system` tinyint(1) NOT NULL DEFAULT '0',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `multiplay_bank_kinds_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `multiplay_bank_shifts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `opened_by` bigint unsigned DEFAULT NULL,
    `opened_at` timestamp NULL DEFAULT NULL,
    `closed_by` bigint unsigned DEFAULT NULL,
    `closed_at` timestamp NULL DEFAULT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `source` varchar(20) NOT NULL DEFAULT 'manual',
    `opening_note` varchar(255) DEFAULT NULL,
    `closing_note` varchar(255) DEFAULT NULL,
    `opening_balances` json DEFAULT NULL,
    `proposed_balances` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `multiplay_bank_shifts_active_index` (`is_active`),
    KEY `multiplay_bank_shifts_opened_at_index` (`opened_at`),
    CONSTRAINT `multiplay_bank_shifts_opened_by_foreign` FOREIGN KEY (`opened_by`) REFERENCES `multiplay_users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `multiplay_bank_shifts_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `multiplay_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `multiplay_bank_clients` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `external_id` varchar(30) DEFAULT NULL,
    `name` varchar(150) NOT NULL,
    `normalized_name` varchar(150) NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `notes` varchar(255) DEFAULT NULL,
    `merged_into_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `multiplay_bank_clients_external_id_index` (`external_id`),
    KEY `multiplay_bank_clients_normalized_name_index` (`normalized_name`),
    CONSTRAINT `multiplay_bank_clients_merged_into_id_foreign` FOREIGN KEY (`merged_into_id`) REFERENCES `multiplay_bank_clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `multiplay_bank_imports` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `filename` varchar(255) NOT NULL,
    `rows_total` int NOT NULL DEFAULT '0',
    `rows_imported` int NOT NULL DEFAULT '0',
    `rows_skipped` int NOT NULL DEFAULT '0',
    `period_start` date DEFAULT NULL,
    `period_end` date DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `notes` text,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `multiplay_bank_imports_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `multiplay_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `multiplay_bank_movements` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `date` date NOT NULL,
    `bank_shift_id` bigint unsigned DEFAULT NULL,
    `bank_account_id` bigint unsigned NOT NULL,
    `bank_client_id` bigint unsigned DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `amount` decimal(14,2) NOT NULL,
    `kind` varchar(60) NOT NULL DEFAULT 'carga',
    `description` varchar(255) DEFAULT NULL,
    `transfer_group_id` char(36) DEFAULT NULL,
    `bank_import_id` bigint unsigned DEFAULT NULL,
    `edit_history` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `multiplay_bank_movements_date_index` (`date`),
    KEY `multiplay_bank_movements_shift_index` (`bank_shift_id`),
    KEY `multiplay_bank_movements_account_index` (`bank_account_id`),
    KEY `multiplay_bank_movements_client_index` (`bank_client_id`),
    KEY `multiplay_bank_movements_transfer_index` (`transfer_group_id`),
    KEY `multiplay_bank_movements_import_index` (`bank_import_id`),
    CONSTRAINT `multiplay_bank_movements_shift_foreign` FOREIGN KEY (`bank_shift_id`) REFERENCES `multiplay_bank_shifts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `multiplay_bank_movements_account_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `multiplay_bank_accounts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `multiplay_bank_movements_client_foreign` FOREIGN KEY (`bank_client_id`) REFERENCES `multiplay_bank_clients` (`id`) ON DELETE SET NULL,
    CONSTRAINT `multiplay_bank_movements_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `multiplay_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `multiplay_bank_accounts` (`name`, `slug`, `initial_balance`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Estado Friendly',  'friendly',   0, 1, NOW(), NOW()),
    ('BCI',              'bci',        0, 2, NOW(), NOW()),
    ('Banco Falabella',  'falabella',  0, 3, NOW(), NOW()),
    ('Banco Rentamania', 'rentamania', 0, 4, NOW(), NOW()),
    ('Cuenta RUT',       'cuenta_rut', 0, 5, NOW(), NOW()),
    ('Ahorro',           'ahorro',     0, 6, NOW(), NOW()),
    ('Menta Limon',      'chile',      0, 7, NOW(), NOW()),
    ('Efectivo',         'efectivo',   0, 8, NOW(), NOW());

INSERT IGNORE INTO `multiplay_bank_kinds` (`name`, `slug`, `sign`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Carga',                  'carga',    'in',       1, 1, NOW(), NOW()),
    ('Retiro',                 'retiro',   'out',      1, 2, NOW(), NOW()),
    ('Traspaso entre cuentas', 'traspaso', 'transfer', 1, 3, NOW(), NOW()),
    ('Ajuste',                 'ajuste',   'both',     1, 4, NOW(), NOW());

-- ------------------------------------------------------------
-- nanu
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `nanu_bank_accounts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `slug` varchar(50) NOT NULL,
    `initial_balance` decimal(14,2) NOT NULL DEFAULT '0.00',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `nanu_bank_accounts_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `nanu_bank_kinds` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(60) NOT NULL,
    `slug` varchar(60) NOT NULL,
    `sign` varchar(10) NOT NULL DEFAULT 'both',
    `is_system` tinyint(1) NOT NULL DEFAULT '0',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `nanu_bank_kinds_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `nanu_bank_shifts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `opened_by` bigint unsigned DEFAULT NULL,
    `opened_at` timestamp NULL DEFAULT NULL,
    `closed_by` bigint unsigned DEFAULT NULL,
    `closed_at` timestamp NULL DEFAULT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `source` varchar(20) NOT NULL DEFAULT 'manual',
    `opening_note` varchar(255) DEFAULT NULL,
    `closing_note` varchar(255) DEFAULT NULL,
    `opening_balances` json DEFAULT NULL,
    `proposed_balances` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `nanu_bank_shifts_active_index` (`is_active`),
    KEY `nanu_bank_shifts_opened_at_index` (`opened_at`),
    CONSTRAINT `nanu_bank_shifts_opened_by_foreign` FOREIGN KEY (`opened_by`) REFERENCES `nanu_users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `nanu_bank_shifts_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `nanu_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `nanu_bank_clients` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `external_id` varchar(30) DEFAULT NULL,
    `name` varchar(150) NOT NULL,
    `normalized_name` varchar(150) NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `notes` varchar(255) DEFAULT NULL,
    `merged_into_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `nanu_bank_clients_external_id_index` (`external_id`),
    KEY `nanu_bank_clients_normalized_name_index` (`normalized_name`),
    CONSTRAINT `nanu_bank_clients_merged_into_id_foreign` FOREIGN KEY (`merged_into_id`) REFERENCES `nanu_bank_clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `nanu_bank_imports` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `filename` varchar(255) NOT NULL,
    `rows_total` int NOT NULL DEFAULT '0',
    `rows_imported` int NOT NULL DEFAULT '0',
    `rows_skipped` int NOT NULL DEFAULT '0',
    `period_start` date DEFAULT NULL,
    `period_end` date DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `notes` text,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `nanu_bank_imports_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `nanu_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `nanu_bank_movements` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `date` date NOT NULL,
    `bank_shift_id` bigint unsigned DEFAULT NULL,
    `bank_account_id` bigint unsigned NOT NULL,
    `bank_client_id` bigint unsigned DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `amount` decimal(14,2) NOT NULL,
    `kind` varchar(60) NOT NULL DEFAULT 'carga',
    `description` varchar(255) DEFAULT NULL,
    `transfer_group_id` char(36) DEFAULT NULL,
    `bank_import_id` bigint unsigned DEFAULT NULL,
    `edit_history` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `nanu_bank_movements_date_index` (`date`),
    KEY `nanu_bank_movements_shift_index` (`bank_shift_id`),
    KEY `nanu_bank_movements_account_index` (`bank_account_id`),
    KEY `nanu_bank_movements_client_index` (`bank_client_id`),
    KEY `nanu_bank_movements_transfer_index` (`transfer_group_id`),
    KEY `nanu_bank_movements_import_index` (`bank_import_id`),
    CONSTRAINT `nanu_bank_movements_shift_foreign` FOREIGN KEY (`bank_shift_id`) REFERENCES `nanu_bank_shifts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `nanu_bank_movements_account_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `nanu_bank_accounts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `nanu_bank_movements_client_foreign` FOREIGN KEY (`bank_client_id`) REFERENCES `nanu_bank_clients` (`id`) ON DELETE SET NULL,
    CONSTRAINT `nanu_bank_movements_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `nanu_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `nanu_bank_accounts` (`name`, `slug`, `initial_balance`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Estado Friendly',  'friendly',   0, 1, NOW(), NOW()),
    ('BCI',              'bci',        0, 2, NOW(), NOW()),
    ('Banco Falabella',  'falabella',  0, 3, NOW(), NOW()),
    ('Banco Rentamania', 'rentamania', 0, 4, NOW(), NOW()),
    ('Cuenta RUT',       'cuenta_rut', 0, 5, NOW(), NOW()),
    ('Ahorro',           'ahorro',     0, 6, NOW(), NOW()),
    ('Menta Limon',      'chile',      0, 7, NOW(), NOW()),
    ('Efectivo',         'efectivo',   0, 8, NOW(), NOW());

INSERT IGNORE INTO `nanu_bank_kinds` (`name`, `slug`, `sign`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Carga',                  'carga',    'in',       1, 1, NOW(), NOW()),
    ('Retiro',                 'retiro',   'out',      1, 2, NOW(), NOW()),
    ('Traspaso entre cuentas', 'traspaso', 'transfer', 1, 3, NOW(), NOW()),
    ('Ajuste',                 'ajuste',   'both',     1, 4, NOW(), NOW());

-- ------------------------------------------------------------
-- sanpablo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sanpablo_bank_accounts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `slug` varchar(50) NOT NULL,
    `initial_balance` decimal(14,2) NOT NULL DEFAULT '0.00',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `sanpablo_bank_accounts_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sanpablo_bank_kinds` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(60) NOT NULL,
    `slug` varchar(60) NOT NULL,
    `sign` varchar(10) NOT NULL DEFAULT 'both',
    `is_system` tinyint(1) NOT NULL DEFAULT '0',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `sort_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `sanpablo_bank_kinds_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sanpablo_bank_shifts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `opened_by` bigint unsigned DEFAULT NULL,
    `opened_at` timestamp NULL DEFAULT NULL,
    `closed_by` bigint unsigned DEFAULT NULL,
    `closed_at` timestamp NULL DEFAULT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `source` varchar(20) NOT NULL DEFAULT 'manual',
    `opening_note` varchar(255) DEFAULT NULL,
    `closing_note` varchar(255) DEFAULT NULL,
    `opening_balances` json DEFAULT NULL,
    `proposed_balances` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `sanpablo_bank_shifts_active_index` (`is_active`),
    KEY `sanpablo_bank_shifts_opened_at_index` (`opened_at`),
    CONSTRAINT `sanpablo_bank_shifts_opened_by_foreign` FOREIGN KEY (`opened_by`) REFERENCES `sanpablo_users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `sanpablo_bank_shifts_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `sanpablo_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sanpablo_bank_clients` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `external_id` varchar(30) DEFAULT NULL,
    `name` varchar(150) NOT NULL,
    `normalized_name` varchar(150) NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `notes` varchar(255) DEFAULT NULL,
    `merged_into_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `sanpablo_bank_clients_external_id_index` (`external_id`),
    KEY `sanpablo_bank_clients_normalized_name_index` (`normalized_name`),
    CONSTRAINT `sanpablo_bank_clients_merged_into_id_foreign` FOREIGN KEY (`merged_into_id`) REFERENCES `sanpablo_bank_clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sanpablo_bank_imports` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `filename` varchar(255) NOT NULL,
    `rows_total` int NOT NULL DEFAULT '0',
    `rows_imported` int NOT NULL DEFAULT '0',
    `rows_skipped` int NOT NULL DEFAULT '0',
    `period_start` date DEFAULT NULL,
    `period_end` date DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `notes` text,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `sanpablo_bank_imports_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `sanpablo_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sanpablo_bank_movements` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `date` date NOT NULL,
    `bank_shift_id` bigint unsigned DEFAULT NULL,
    `bank_account_id` bigint unsigned NOT NULL,
    `bank_client_id` bigint unsigned DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `amount` decimal(14,2) NOT NULL,
    `kind` varchar(60) NOT NULL DEFAULT 'carga',
    `description` varchar(255) DEFAULT NULL,
    `transfer_group_id` char(36) DEFAULT NULL,
    `bank_import_id` bigint unsigned DEFAULT NULL,
    `edit_history` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `sanpablo_bank_movements_date_index` (`date`),
    KEY `sanpablo_bank_movements_shift_index` (`bank_shift_id`),
    KEY `sanpablo_bank_movements_account_index` (`bank_account_id`),
    KEY `sanpablo_bank_movements_client_index` (`bank_client_id`),
    KEY `sanpablo_bank_movements_transfer_index` (`transfer_group_id`),
    KEY `sanpablo_bank_movements_import_index` (`bank_import_id`),
    CONSTRAINT `sanpablo_bank_movements_shift_foreign` FOREIGN KEY (`bank_shift_id`) REFERENCES `sanpablo_bank_shifts` (`id`) ON DELETE SET NULL,
    CONSTRAINT `sanpablo_bank_movements_account_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `sanpablo_bank_accounts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `sanpablo_bank_movements_client_foreign` FOREIGN KEY (`bank_client_id`) REFERENCES `sanpablo_bank_clients` (`id`) ON DELETE SET NULL,
    CONSTRAINT `sanpablo_bank_movements_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `sanpablo_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `sanpablo_bank_accounts` (`name`, `slug`, `initial_balance`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Estado Friendly',  'friendly',   0, 1, NOW(), NOW()),
    ('BCI',              'bci',        0, 2, NOW(), NOW()),
    ('Banco Falabella',  'falabella',  0, 3, NOW(), NOW()),
    ('Banco Rentamania', 'rentamania', 0, 4, NOW(), NOW()),
    ('Cuenta RUT',       'cuenta_rut', 0, 5, NOW(), NOW()),
    ('Ahorro',           'ahorro',     0, 6, NOW(), NOW()),
    ('Menta Limon',      'chile',      0, 7, NOW(), NOW()),
    ('Efectivo',         'efectivo',   0, 8, NOW(), NOW());

INSERT IGNORE INTO `sanpablo_bank_kinds` (`name`, `slug`, `sign`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES
    ('Carga',                  'carga',    'in',       1, 1, NOW(), NOW()),
    ('Retiro',                 'retiro',   'out',      1, 2, NOW(), NOW()),
    ('Traspaso entre cuentas', 'traspaso', 'transfer', 1, 3, NOW(), NOW()),
    ('Ajuste',                 'ajuste',   'both',     1, 4, NOW(), NOW());
