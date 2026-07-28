-- =====================================================
-- Migracion: Separar tipos de pago por origen (Caja/Pasillera)
-- Cambiar ENUM a VARCHAR + agregar columna source
-- Compatible con MySQL 5.7+
-- =====================================================
-- IMPORTANTE: Ejecutar archivo por archivo ostatement por statement
-- Si un statement falla, verificar si la columna ya existe antes de continuar

-- =====================================================
-- EMPRESA: 888spa
-- =====================================================

-- PASO 1: Cambiar tipo de columna 'type' de ENUM a VARCHAR
ALTER TABLE 888spa_cash_transactions MODIFY COLUMN type VARCHAR(50) NOT NULL;

-- PASO 2: Agregar columna 'source'
ALTER TABLE 888spa_cash_transactions ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'caja';

-- PASO 3: Migrar datos existentes (pasillera_id NO NULL = source pasillera)
UPDATE 888spa_cash_transactions SET source = 'pasillera' WHERE pasillera_id IS NOT NULL;

-- PASO 4: Agregar columnas _pasillera a cash_shifts (una por una)
ALTER TABLE 888spa_cash_shifts ADD COLUMN total_transfers_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE 888spa_cash_shifts ADD COLUMN total_giros_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE 888spa_cash_shifts ADD COLUMN total_payments_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE 888spa_cash_shifts ADD COLUMN total_other_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE 888spa_cash_shifts ADD COLUMN total_sorteo_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE 888spa_cash_shifts ADD COLUMN total_bonus_especial_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE 888spa_cash_shifts ADD COLUMN total_prestamo_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE 888spa_cash_shifts ADD COLUMN total_deposit_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE 888spa_cash_shifts ADD COLUMN total_withdrawal_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;

-- PASO 5: Poblar totales _pasillera desde transacciones existentes
UPDATE 888spa_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM 888spa_cash_transactions
  WHERE type = 'transfer' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_transfers_pasillera = t.total;

UPDATE 888spa_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM 888spa_cash_transactions
  WHERE type = 'giro' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_giros_pasillera = t.total;

UPDATE 888spa_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM 888spa_cash_transactions
  WHERE type = 'payment' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_payments_pasillera = t.total;

UPDATE 888spa_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM 888spa_cash_transactions
  WHERE type = 'other' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_other_pasillera = t.total;

UPDATE 888spa_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM 888spa_cash_transactions
  WHERE type = 'sorteo' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_sorteo_pasillera = t.total;

UPDATE 888spa_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM 888spa_cash_transactions
  WHERE type = 'bonus_especial' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_bonus_especial_pasillera = t.total;

UPDATE 888spa_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM 888spa_cash_transactions
  WHERE type = 'prestamo' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_prestamo_pasillera = t.total;

UPDATE 888spa_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM 888spa_cash_transactions
  WHERE type = 'deposit' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_deposit_pasillera = t.total;

UPDATE 888spa_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM 888spa_cash_transactions
  WHERE type = 'withdrawal' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_withdrawal_pasillera = t.total;

-- =====================================================
-- EMPRESA: chillan
-- =====================================================

-- PASO 1: Cambiar tipo de columna 'type' de ENUM a VARCHAR
ALTER TABLE chillan_cash_transactions MODIFY COLUMN type VARCHAR(50) NOT NULL;

-- PASO 2: Agregar columna 'source'
ALTER TABLE chillan_cash_transactions ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'caja';

-- PASO 3: Migrar datos existentes
UPDATE chillan_cash_transactions SET source = 'pasillera' WHERE pasillera_id IS NOT NULL;

-- PASO 4: Agregar columnas _pasillera a cash_shifts
ALTER TABLE chillan_cash_shifts ADD COLUMN total_transfers_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE chillan_cash_shifts ADD COLUMN total_giros_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE chillan_cash_shifts ADD COLUMN total_payments_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE chillan_cash_shifts ADD COLUMN total_other_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE chillan_cash_shifts ADD COLUMN total_sorteo_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE chillan_cash_shifts ADD COLUMN total_bonus_especial_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE chillan_cash_shifts ADD COLUMN total_prestamo_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE chillan_cash_shifts ADD COLUMN total_deposit_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE chillan_cash_shifts ADD COLUMN total_withdrawal_pasillera DECIMAL(15,2) NOT NULL DEFAULT 0;

-- PASO 5: Poblar totales _pasillera desde transacciones existentes
UPDATE chillan_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM chillan_cash_transactions
  WHERE type = 'transfer' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_transfers_pasillera = t.total;

UPDATE chillan_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM chillan_cash_transactions
  WHERE type = 'giro' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_giros_pasillera = t.total;

UPDATE chillan_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM chillan_cash_transactions
  WHERE type = 'payment' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_payments_pasillera = t.total;

UPDATE chillan_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM chillan_cash_transactions
  WHERE type = 'other' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_other_pasillera = t.total;

UPDATE chillan_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM chillan_cash_transactions
  WHERE type = 'sorteo' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_sorteo_pasillera = t.total;

UPDATE chillan_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM chillan_cash_transactions
  WHERE type = 'bonus_especial' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_bonus_especial_pasillera = t.total;

UPDATE chillan_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM chillan_cash_transactions
  WHERE type = 'prestamo' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_prestamo_pasillera = t.total;

UPDATE chillan_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM chillan_cash_transactions
  WHERE type = 'deposit' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_deposit_pasillera = t.total;

UPDATE chillan_cash_shifts s
INNER JOIN (
  SELECT cash_shift_id, SUM(amount) AS total
  FROM chillan_cash_transactions
  WHERE type = 'withdrawal' AND source = 'pasillera'
  GROUP BY cash_shift_id
) t ON s.id = t.cash_shift_id
SET s.total_withdrawal_pasillera = t.total;

-- =====================================================
-- VERIFICACION
-- =====================================================
SELECT id, type, source, pasillera_id FROM 888spa_cash_transactions LIMIT 10;
SELECT id, total_transfers, total_transfers_pasillera FROM 888spa_cash_shifts LIMIT 10;
