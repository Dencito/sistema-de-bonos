-- Agregar columnas de totales por tipo de transacción a cash_shifts
-- Para base de datos 888spa
ALTER TABLE 888spa_cash_shifts 
ADD COLUMN total_other DECIMAL(15,2) DEFAULT 0 AFTER total_payments,
ADD COLUMN total_sorteo DECIMAL(15,2) DEFAULT 0 AFTER total_other,
ADD COLUMN total_bonus_especial DECIMAL(15,2) DEFAULT 0 AFTER total_sorteo,
ADD COLUMN total_prestamo DECIMAL(15,2) DEFAULT 0 AFTER total_bonus_especial,
ADD COLUMN total_deposit DECIMAL(15,2) DEFAULT 0 AFTER total_prestamo,
ADD COLUMN total_withdrawal DECIMAL(15,2) DEFAULT 0 AFTER total_deposit;

-- Para base de datos chillan
ALTER TABLE chillan_cash_shifts 
ADD COLUMN total_other DECIMAL(15,2) DEFAULT 0 AFTER total_payments,
ADD COLUMN total_sorteo DECIMAL(15,2) DEFAULT 0 AFTER total_other,
ADD COLUMN total_bonus_especial DECIMAL(15,2) DEFAULT 0 AFTER total_sorteo,
ADD COLUMN total_prestamo DECIMAL(15,2) DEFAULT 0 AFTER total_bonus_especial,
ADD COLUMN total_deposit DECIMAL(15,2) DEFAULT 0 AFTER total_prestamo,
ADD COLUMN total_withdrawal DECIMAL(15,2) DEFAULT 0 AFTER total_deposit;
