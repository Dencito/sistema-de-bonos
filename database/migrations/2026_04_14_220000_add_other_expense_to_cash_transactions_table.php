<?php

/*
=============================================
SQL MANUAL - Ejecutar directamente en MySQL:
=============================================

1) Agregar tipo 'other' al ENUM y columna expense_type:

```sql
ALTER TABLE cash_transactions
  MODIFY COLUMN type ENUM('transfer','payment','giro','pasillera_payment','pasillera_return','other') NOT NULL;

ALTER TABLE cash_transactions
  ADD COLUMN expense_type VARCHAR(255) NULL AFTER type;
```

2) (Opcional) Si la tabla ya tiene datos con type='other' por soft-delete:
```sql
UPDATE cash_transactions SET type = 'payment' WHERE type = 'other';
```

3) Verificar:
```sql
SHOW COLUMNS FROM cash_transactions;
```

Esperado:
+------------------+----------------------------------------------------------+
| Field            | Type                                                     |
+------------------+----------------------------------------------------------+
| id               | bigint unsigned                                          |
| cash_shift_id    | bigint unsigned                                          |
| pasillera_id     | bigint unsigned (nullable)                               |
| type             | enum('transfer','payment','giro','pasillera_payment',...)|
| expense_type     | varchar(255)                                             |
| amount           | decimal(10,2)                                            |
| ...              | ...                                                      |
+------------------+----------------------------------------------------------+

=============================================
*/

// Esta migration ya no debe correr si ejecutaste el SQL manual.
// Deja el archivo vacío para evitar que `php artisan migrate` falle.

