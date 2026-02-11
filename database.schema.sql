-- Tablas Independientes (sin dependencias de claves foráneas)
-- Estas tablas no dependen de otras y se crean primero.

DROP TABLE IF EXISTS `empresa_category_bonuses`;

CREATE TABLE `empresa_category_bonuses` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `base_amount` int NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_roles`;

CREATE TABLE `empresa_roles` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `empresa_roles_name_unique` (`name`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO
    `empresa_roles` (
        name,
        description,
        created_at,
        updated_at
    )
VALUES (
        'duenio',
        'Dueño del sistema con acceso total',
        '2025-07-23 10:29:22',
        '2025-07-23 10:29:22'
    ),
    (
        'super-admin',
        'Super administrador con acceso elevado',
        '2025-07-23 10:29:22',
        '2025-07-23 10:29:22'
    ),
    (
        'admin',
        'Administrador del sistema',
        '2025-07-23 10:29:22',
        '2025-07-23 10:29:22'
    ),
    (
        'supervisor',
        'Supervisor con acceso a gestión',
        '2025-07-23 10:29:22',
        '2025-07-23 10:29:22'
    ),
    (
        'trabajador',
        'Trabajador con acceso básico',
        '2025-07-23 10:29:22',
        '2025-07-23 10:29:22'
    ),
    (
        'jugador',
        'Jugador del sistema',
        '2025-07-23 10:29:22',
        '2025-07-23 10:29:22'
    );

DROP TABLE IF EXISTS `empresa_statuses`;

CREATE TABLE `empresa_statuses` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO
    empresa_statuses (name, created_at, updated_at)
VALUES (
        'Activo',
        '2025-07-23 22:06:28',
        '2025-07-23 22:06:28'
    ),
    (
        'Inactivo',
        '2025-07-23 22:06:28',
        '2025-07-23 22:06:28'
    ),
    (
        'En revisión',
        '2025-07-23 22:06:28',
        '2025-07-23 22:06:28'
    ),
    (
        'Borrado',
        '2025-07-23 22:06:28',
        '2025-07-23 22:06:28'
    );

DROP TABLE IF EXISTS `empresa_companies`;

CREATE TABLE `empresa_companies` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `db_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `status_id` bigint unsigned NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `creationDate` date DEFAULT NULL,
    `rutNumbers` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `rutDv` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `business` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `prefix` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `legalRepresentativeNames` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `legalRepresentativeLastNames` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `rutNumbersLegalRepresentative` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `rutDvLegalRepresentative` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `contactNames` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `contactLastNames` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `rutNumbersContact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `rutDvContact` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `prefixContact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `contactPhone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `contactEmail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `companyAddressCountry` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `companyAddressRegion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `companyAddressProvince` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `companyAddressCommune` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `companyAddressStreet` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `companyAddressNumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `max_branches` int NOT NULL DEFAULT '0',
    `domain` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `schema_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `trial_ends_at` timestamp NULL DEFAULT NULL,
    `subscription_ends_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `empresa_companies_slug_unique` (`slug`),
    UNIQUE KEY `empresa_companies_schema_name_unique` (`schema_name`),
    KEY `empresa_companies_status_id_foreign` (`status_id`),
    CONSTRAINT `empresa_companies_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `empresa_statuses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_companies_chk_1` CHECK (json_valid(`settings`))
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO
    empresa_companies (
        name,
        db_name,
        status_id,
        created_at,
        updated_at,
        creationDate,
        rutNumbers,
        rutDv,
        business,
        prefix,
        phone,
        email,
        legalRepresentativeNames,
        legalRepresentativeLastNames,
        rutNumbersLegalRepresentative,
        rutDvLegalRepresentative,
        contactNames,
        contactLastNames,
        rutNumbersContact,
        rutDvContact,
        prefixContact,
        contactPhone,
        contactEmail,
        companyAddressCountry,
        companyAddressRegion,
        companyAddressProvince,
        companyAddressCommune,
        companyAddressStreet,
        companyAddressNumber,
        max_branches,
        domain,
        slug,
        schema_name,
        settings,
        is_active,
        trial_ends_at,
        subscription_ends_at
    )
VALUES (
        'empresa',
        'db_empresa',
        1,
        '2025-07-23 22:06:28',
        '2025-07-23 22:06:28',
        '2025-07-23',
        '1',
        '9',
        'Tickets',
        '+56',
        '1153101688',
        'gonzalo@gmail.com',
        'Gonzalo',
        'Pena',
        '1',
        '9',
        'Gonzalo',
        'Pena',
        '1',
        '9',
        '+56',
        '1153101688',
        'gonazalo@gmail.com',
        'Chile',
        'Región Metropolitana de Santiago',
        '1234r5123412',
        'sgtdfgsdga',
        'sdfg1231',
        '123',
        10,
        'empresa.rentamania.cl',
        'empresa',
        'empresa',
        '[]',
        1,
        NULL,
        NULL
    );

-- Tablas Dependientes (con dependencias de claves foráneas)
-- Estas tablas dependen de las anteriores y se crean después.

DROP TABLE IF EXISTS `empresa_branches`;

CREATE TABLE `empresa_branches` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `creationDate` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `numberOfEmployees` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `branchAddressCountry` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `branchAddressRegion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `branchAddressProvince` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `branchAddressCommune` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `branchAddressStreet` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `branchAddressNumber` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `branchAddressLocal` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `branchAddressDeptOrHouse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `available_schedules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `bonus_schedules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `birthday_amount` decimal(10, 2) NOT NULL DEFAULT '0.00',
    `status_id` bigint unsigned NOT NULL,
    `company_id` bigint unsigned NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `ticketNumber` int DEFAULT '0',
    PRIMARY KEY (`id`),
    KEY `empresa_branches_status_id_foreign` (`status_id`),
    KEY `empresa_branches_company_id_foreign` (`company_id`),
    CONSTRAINT `empresa_branches_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `empresa_companies` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_branches_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `empresa_statuses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_branches_chk_1` CHECK (
        json_valid(`available_schedules`)
    ),
    CONSTRAINT `empresa_branches_chk_2` CHECK (json_valid(`bonus_schedules`))
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_users`;

CREATE TABLE `empresa_users` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `first_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `second_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `first_last_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `second_last_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `birth_date` date DEFAULT NULL,
    `entry_date` date DEFAULT '2025-07-23',
    `has_fingerprint` tinyint(1) NOT NULL DEFAULT '0',
    `fingerprints` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `email_verified_at` timestamp NULL DEFAULT NULL,
    `nationality` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `marital_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `pension` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `health` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `afp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `childrens` int DEFAULT NULL,
    `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `prefix` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `rutNumbers` int DEFAULT NULL,
    `rutDv` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `code` int DEFAULT NULL,
    `role_id` bigint unsigned NOT NULL,
    `status_id` bigint unsigned NOT NULL,
    `branch_id` bigint unsigned DEFAULT NULL,
    `company_id` bigint unsigned DEFAULT NULL,
    `category_bonus_id` bigint unsigned DEFAULT NULL,
    `cargo` enum(
        'PASILLER@',
        'CAJER@',
        'GUARDIA',
        'ANFITRION',
        'RECAUDADOR',
        'ASISTENTE',
        'OTRO'
    ) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `levels` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `empresa_users_phone_unique` (`phone`),
    UNIQUE KEY `empresa_users_email_unique` (`email`),
    UNIQUE KEY `empresa_users_username_unique` (`username`),
    KEY `empresa_users_role_id_foreign` (`role_id`),
    KEY `empresa_users_status_id_foreign` (`status_id`),
    KEY `empresa_users_branch_id_foreign` (`branch_id`),
    KEY `empresa_users_company_id_foreign` (`company_id`),
    KEY `empresa_users_category_bonus_id_foreign` (`category_bonus_id`),
    CONSTRAINT `empresa_users_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `empresa_branches` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_users_category_bonus_id_foreign` FOREIGN KEY (`category_bonus_id`) REFERENCES `empresa_category_bonuses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_users_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `empresa_companies` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `empresa_roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_users_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `empresa_statuses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_users_chk_1` CHECK (json_valid(`fingerprints`)),
    CONSTRAINT `empresa_users_chk_2` CHECK (json_valid(`levels`))
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_bonuses`;

CREATE TABLE `empresa_bonuses` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `amount` decimal(10, 2) NOT NULL DEFAULT '0.00',
    `user_id` bigint unsigned NOT NULL,
    `active` tinyint(1) NOT NULL DEFAULT '1',
    `start_datetime` datetime DEFAULT NULL,
    `end_datetime` datetime DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `empresa_bonuses_user_id_foreign` (`user_id`),
    CONSTRAINT `empresa_bonuses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `empresa_users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_totems`;

CREATE TABLE `empresa_totems` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `branch_id` bigint unsigned NOT NULL,
    `active` tinyint(1) NOT NULL DEFAULT '1',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `empresa_totems_code_unique` (`code`),
    KEY `empresa_totems_branch_id_foreign` (`branch_id`),
    CONSTRAINT `empresa_totems_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `empresa_branches` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_cash_shifts`;

CREATE TABLE `empresa_cash_shifts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `branch_id` BIGINT UNSIGNED NOT NULL,
    `previous_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `initial_balance` DECIMAL(15, 2) NOT NULL,
    `total_initial_balance` DECIMAL(15, 2) NOT NULL,
    `current_balance` DECIMAL(15, 2) NOT NULL,
    `total_transfers` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `total_giros` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `total_payments` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `started_at` TIMESTAMP NOT NULL,
    `ended_at` TIMESTAMP NULL,
    `opening_20000` INT NOT NULL DEFAULT 0,
    `opening_10000` INT NOT NULL DEFAULT 0,
    `opening_5000` INT NOT NULL DEFAULT 0,
    `opening_2000` INT NOT NULL DEFAULT 0,
    `opening_1000` INT NOT NULL DEFAULT 0,
    `opening_coins` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `opening_total_counted` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `closing_20000` INT NOT NULL DEFAULT 0,
    `closing_10000` INT NOT NULL DEFAULT 0,
    `closing_5000` INT NOT NULL DEFAULT 0,
    `closing_2000` INT NOT NULL DEFAULT 0,
    `closing_1000` INT NOT NULL DEFAULT 0,
    `closing_coins` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `closing_total_counted` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `difference` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `closing_notes` TEXT NULL,
    `admin_initial_value` DECIMAL(15, 2) NULL,
    `admin_user_id` BIGINT UNSIGNED NULL,
    `admin_value_set_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    CONSTRAINT `empresa_cash_shifts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `empresa_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_cash_shifts_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `empresa_branches` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_cash_shifts_admin_user_id_foreign` FOREIGN KEY (`admin_user_id`) REFERENCES `empresa_users` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_pasilleras`;

CREATE TABLE `empresa_pasilleras` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `cash_shift_id` bigint unsigned NOT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `initial_balance` decimal(15, 2) NOT NULL,
    `total_payments` decimal(15, 2) NOT NULL DEFAULT '0.00',
    `current_balance` decimal(15, 2) NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `empresa_pasilleras_cash_shift_id_foreign` (`cash_shift_id`),
    KEY `empresa_pasilleras_user_id_foreign` (`user_id`),
    CONSTRAINT `empresa_pasilleras_cash_shift_id_foreign` FOREIGN KEY (`cash_shift_id`) REFERENCES `empresa_cash_shifts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_pasilleras_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `empresa_users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_cash_transactions`;

CREATE TABLE `empresa_cash_transactions` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `cash_shift_id` bigint unsigned NOT NULL,
    `pasillera_id` bigint unsigned DEFAULT NULL,
    `type` enum(
        'transfer',
        'payment',
        'giro',
        'pasillera_payment'
    ) COLLATE utf8mb4_unicode_ci NOT NULL,
    `amount` decimal(15, 2) NOT NULL,
    `client` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `machine` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `description` text COLLATE utf8mb4_unicode_ci,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `empresa_cash_transactions_cash_shift_id_foreign` (`cash_shift_id`),
    KEY `empresa_cash_transactions_pasillera_id_foreign` (`pasillera_id`),
    CONSTRAINT `empresa_cash_transactions_cash_shift_id_foreign` FOREIGN KEY (`cash_shift_id`) REFERENCES `empresa_cash_shifts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_cash_transactions_pasillera_id_foreign` FOREIGN KEY (`pasillera_id`) REFERENCES `empresa_pasilleras` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_fingerprint_logs`;

CREATE TABLE `empresa_fingerprint_logs` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `user_id` bigint unsigned NOT NULL,
    `totem_id` bigint unsigned NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `empresa_fingerprint_logs_user_id_foreign` (`user_id`),
    KEY `empresa_fingerprint_logs_totem_id_foreign` (`totem_id`),
    CONSTRAINT `empresa_fingerprint_logs_totem_id_foreign` FOREIGN KEY (`totem_id`) REFERENCES `empresa_totems` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_fingerprint_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `empresa_users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_shifts`;

CREATE TABLE `empresa_shifts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `branch_id` bigint unsigned NOT NULL,
    `opened_by_user_id` bigint unsigned NOT NULL,
    `closed_by_user_id` bigint unsigned DEFAULT NULL,
    `opening_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `closing_time` timestamp NULL DEFAULT NULL,
    `status` enum('open', 'closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `empresa_shifts_branch_id_foreign` (`branch_id`),
    KEY `empresa_shifts_opened_by_user_id_foreign` (`opened_by_user_id`),
    KEY `empresa_shifts_closed_by_user_id_foreign` (`closed_by_user_id`),
    CONSTRAINT `empresa_shifts_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `empresa_branches` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_shifts_closed_by_user_id_foreign` FOREIGN KEY (`closed_by_user_id`) REFERENCES `empresa_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_shifts_opened_by_user_id_foreign` FOREIGN KEY (`opened_by_user_id`) REFERENCES `empresa_users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_tickets`;

CREATE TABLE `empresa_tickets` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `user_id` bigint unsigned NOT NULL,
    `totem_id` bigint unsigned NOT NULL,
    `total_amount` decimal(10, 2) NOT NULL DEFAULT '0.00',
    `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `empresa_tickets_user_id_foreign` (`user_id`),
    KEY `empresa_tickets_totem_id_foreign` (`totem_id`),
    CONSTRAINT `empresa_tickets_totem_id_foreign` FOREIGN KEY (`totem_id`) REFERENCES `empresa_totems` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_tickets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `empresa_users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_user_branches`;

CREATE TABLE `empresa_user_branches` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `user_id` bigint unsigned NOT NULL,
    `branch_id` bigint unsigned NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `empresa_user_branches_user_id_foreign` (`user_id`),
    KEY `empresa_user_branches_branch_id_foreign` (`branch_id`),
    CONSTRAINT `empresa_user_branches_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `empresa_branches` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_user_branches_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `empresa_users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_orders`;

CREATE TABLE `empresa_orders` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `total` decimal(10, 2) NOT NULL,
    `products` json NOT NULL,
    `quantity` int DEFAULT '1',
    `payment_method` enum(
        'efectivo',
        'tarjeta',
        'transferencia'
    ) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `paid_amount` decimal(10, 2) DEFAULT NULL,
    `change` decimal(10, 2) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_products`;

CREATE TABLE `empresa_products` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `price` decimal(8, 2) NOT NULL,
    `quantity` int DEFAULT '0',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `code` (`code`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresa_sales_withdrawals`;

CREATE TABLE `empresa_sales_withdrawals` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `user_id` bigint unsigned NOT NULL,
    `branch_id` bigint unsigned NOT NULL,
    `amount` decimal(15, 2) NOT NULL,
    `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `empresa_sales_withdrawals_user_id_foreign` (`user_id`),
    KEY `empresa_sales_withdrawals_branch_id_foreign` (`branch_id`),
    CONSTRAINT `empresa_sales_withdrawals_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `empresa_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `empresa_sales_withdrawals_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `empresa_branches` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tablas independientes
-- Estas tablas son del framework laravel.

DROP TABLE IF EXISTS `cache`;

CREATE TABLE `cache` (
    `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
    `expiration` int NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cache_locks`;

CREATE TABLE `cache_locks` (
    `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `expiration` int NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `failed_jobs`;

CREATE TABLE `failed_jobs` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
    `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
    `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
    `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
    `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `job_batches`;

CREATE TABLE `job_batches` (
    `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `total_jobs` int NOT NULL,
    `pending_jobs` int NOT NULL,
    `failed_jobs` int NOT NULL,
    `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
    `options` mediumtext COLLATE utf8mb4_unicode_ci,
    `cancelled_at` int DEFAULT NULL,
    `created_at` int NOT NULL,
    `finished_at` int DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `jobs`;

CREATE TABLE `jobs` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
    `attempts` tinyint unsigned NOT NULL,
    `reserved_at` int unsigned DEFAULT NULL,
    `available_at` int unsigned NOT NULL,
    `created_at` int unsigned NOT NULL,
    PRIMARY KEY (`id`),
    KEY `jobs_queue_index` (`queue`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `migrations`;

CREATE TABLE `migrations` (
    `id` int unsigned NOT NULL AUTO_INCREMENT,
    `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `batch` int NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `password_reset_tokens`;

CREATE TABLE `password_reset_tokens` (
    `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `personal_access_tokens`;

CREATE TABLE `personal_access_tokens` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `tokenable_id` bigint unsigned NOT NULL,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
    `abilities` text COLLATE utf8mb4_unicode_ci,
    `last_used_at` timestamp NULL DEFAULT NULL,
    `expires_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sessions`;

CREATE TABLE `sessions` (
    `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `user_agent` text COLLATE utf8mb4_unicode_ci,
    `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
    `last_activity` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `sessions_user_id_index` (`user_id`),
    KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;