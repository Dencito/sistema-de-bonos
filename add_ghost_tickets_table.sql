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

-- nanu
CREATE TABLE IF NOT EXISTS `nanu_ghost_tickets` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `ticket_id` bigint unsigned NOT NULL,
    `branch_id` bigint unsigned DEFAULT NULL,
    `cash_shift_id` bigint unsigned DEFAULT NULL,
    `assigned_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `nanu_ghost_tickets_ticket_id_index` (`ticket_id`),
    KEY `nanu_ghost_tickets_branch_id_index` (`branch_id`),
    KEY `nanu_ghost_tickets_cash_shift_id_index` (`cash_shift_id`),
    CONSTRAINT `nanu_ghost_tickets_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `nanu_tickets` (`id`) ON DELETE CASCADE,
    CONSTRAINT `nanu_ghost_tickets_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `nanu_branches` (`id`) ON DELETE SET NULL,
    CONSTRAINT `nanu_ghost_tickets_cash_shift_id_foreign` FOREIGN KEY (`cash_shift_id`) REFERENCES `nanu_cash_shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
