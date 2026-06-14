-- Agregar campo force_closed a tabla pasilleras
-- Para 888spa
ALTER TABLE `888spa_pasilleras`
ADD COLUMN force_closed BOOLEAN DEFAULT FALSE AFTER is_active;

-- Para chillan
ALTER TABLE `chillan_pasilleras`
ADD COLUMN force_closed BOOLEAN DEFAULT FALSE AFTER is_active;

-- Agregar soft delete (deleted_at) a tabla pasilleras
-- Para 888spa
ALTER TABLE `888spa_pasilleras`
ADD COLUMN deleted_at TIMESTAMP NULL AFTER force_closed;

-- Para chillan
ALTER TABLE `chillan_pasilleras`
ADD COLUMN deleted_at TIMESTAMP NULL AFTER force_closed;
