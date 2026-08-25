-- ============================================================
-- Tabla: ghost_tickets
-- Tickets generados sin caja abierta, pendientes de asignar
-- ============================================================

-- 888spa
CREATE TABLE IF NOT EXISTS `888spa_ghost_tickets` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `ticket_id` bigint unsigned NOT NULL,
    `branch_id` bigint unsigned DEFAULT NULL,
    `cash_shift_id` bigint unsigned DEFAULT NULL,
    `assigned_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `ghost_tickets_ticket_id_index` (`ticket_id`),
    KEY `ghost_tickets_branch_id_index` (`branch_id`),
    KEY `ghost_tickets_cash_shift_id_index` (`cash_shift_id`),
    CONSTRAINT `888spa_ghost_tickets_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `888spa_tickets` (`id`) ON DELETE CASCADE,
    CONSTRAINT `888spa_ghost_tickets_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `888spa_branches` (`id`) ON DELETE SET NULL,
    CONSTRAINT `888spa_ghost_tickets_cash_shift_id_foreign` FOREIGN KEY (`cash_shift_id`) REFERENCES `888spa_cash_shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- chillan
CREATE TABLE IF NOT EXISTS `chillan_ghost_tickets` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `ticket_id` bigint unsigned NOT NULL,
    `branch_id` bigint unsigned DEFAULT NULL,
    `cash_shift_id` bigint unsigned DEFAULT NULL,
    `assigned_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `chillan_ghost_tickets_ticket_id_index` (`ticket_id`),
    KEY `chillan_ghost_tickets_branch_id_index` (`branch_id`),
    KEY `chillan_ghost_tickets_cash_shift_id_index` (`cash_shift_id`),
    CONSTRAINT `chillan_ghost_tickets_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `chillan_tickets` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chillan_ghost_tickets_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `chillan_branches` (`id`) ON DELETE SET NULL,
    CONSTRAINT `chillan_ghost_tickets_cash_shift_id_foreign` FOREIGN KEY (`cash_shift_id`) REFERENCES `chillan_cash_shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
