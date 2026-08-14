-- ============================================================
-- Excepciones al "no entregar tickets" por sucursal
-- ============================================================
--
-- Hoy tickets_enabled es todo o nada: si esta en 0, la sucursal no entrega
-- tickets a nadie. Esta columna guarda la lista de usuarios que SI los reciben
-- aunque la sucursal los tenga apagados.
--
--   tickets_enabled = 1  ->  todos reciben, la lista se ignora
--   tickets_enabled = 0  ->  no recibe nadie, salvo los ids de esta lista
--
-- Se guarda como JSON con los ids de usuario, por ejemplo: [5, 6, 12]
-- NULL o [] significa que no hay excepciones: no recibe nadie.
--
-- Se usa JSON y no una tabla pivote a proposito: es una lista corta, se lee
-- entera siempre y se edita completa desde el formulario de la sucursal. Una
-- tabla aparte agregaria un join y una migracion mas por cada tenant.
--
-- Aplica a los tres tenants que tienen tickets_enabled. Los que no lo tienen
-- (mini, multiplay, sanpablo) todavia no usan la funcion de tickets.
--
-- Ojo: correr este script dos veces da error "Duplicate column name".
-- Es esperable y significa que ya estaba aplicado.
-- ============================================================

ALTER TABLE `888spa_branches`
  ADD COLUMN `tickets_allowed_users` JSON NULL DEFAULT NULL AFTER `tickets_enabled`;

ALTER TABLE `chillan_branches`
  ADD COLUMN `tickets_allowed_users` JSON NULL DEFAULT NULL AFTER `tickets_enabled`;

-- ============================================================
-- Verificacion
-- ============================================================
--
-- SHOW COLUMNS FROM `888spa_branches`  LIKE 'tickets_allowed_users';
-- SHOW COLUMNS FROM `chillan_branches` LIKE 'tickets_allowed_users';
--
-- Las sucursales nuevas ya nacen con la columna: se agrego tambien a
-- CompanyDatabaseService, que es el que crea las tablas de cada empresa.
