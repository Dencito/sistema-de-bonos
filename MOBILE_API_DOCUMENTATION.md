# API Móvil - Documentación

## Base URL
```
http://tu-dominio.com/api/mobile
```

## Autenticación

Todas las rutas protegidas requieren el header:
```
Authorization: Bearer {token}
```

---

## 1. Login

**POST** `/api/mobile/login`

### Request Body
```json
{
  "username": "trabajador01",
  "password": "password123",
  "device_name": "iPhone 13"
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": 7,
      "name": "Juan Pérez García",
      "email": "trabajador@example.com",
      "role_id": 5,
      "branch_id": 1
    },
    "token": "1|abc123def456..."
  }
}
```

### Response Error (403)
```json
{
  "success": false,
  "message": "No tienes permisos para acceder a la aplicación móvil."
}
```

---

## 2. Obtener Usuario Autenticado

**GET** `/api/mobile/me`

### Headers
```
Authorization: Bearer {token}
```

### Response Success (200)
```json
{
  "success": true,
  "data": {
    "id": 7,
    "name": "Juan Pérez García",
    "email": "trabajador@example.com",
    "role_id": 5,
    "branch_id": 1,
    "status_id": 1
  }
}
```

---

## 3. Logout

**POST** `/api/mobile/logout`

### Headers
```
Authorization: Bearer {token}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Sesión cerrada correctamente"
}
```

---

## 4. Obtener Pasillera Activa

**GET** `/api/mobile/pasillera/my-active`

### Headers
```
Authorization: Bearer {token}
```

### Response Success (200)
```json
{
  "success": true,
  "data": {
    "pasillera": {
      "id": 1,
      "cash_shift_id": 2,
      "user_id": 7,
      "initial_balance": 100000,
      "total_payments": 25000,
      "current_balance": 75000,
      "is_active": true,
      "created_at": "2025-12-18T02:00:00.000000Z",
      "transactions": [
        {
          "id": 5,
          "amount": 5000,
          "machine": "Máquina 3",
          "description": "Pago Pasillera - Máquina: Máquina 3",
          "created_at": "2025-12-18T02:15:00.000000Z"
        }
      ]
    },
    "user": {
      "id": 7,
      "name": "Juan Pérez García"
    }
  }
}
```

### Response No Active (200)
```json
{
  "success": false,
  "message": "No tienes una pasillera activa",
  "data": null
}
```

---

## 5. Registrar Gasto

**POST** `/api/mobile/pasillera/expense`

### Headers
```
Authorization: Bearer {token}
```

### Request Body
```json
{
  "amount": 5000,
  "machine": "Máquina 3",
  "description": "Pago premio" // opcional
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Gasto registrado correctamente",
  "data": {
    "pasillera": {
      "id": 1,
      "initial_balance": 100000,
      "total_payments": 30000,
      "current_balance": 70000,
      "transactions": [...]
    },
    "transaction": {
      "id": 6,
      "amount": 5000,
      "machine": "Máquina 3",
      "description": "Pago Pasillera - Máquina: Máquina 3 - Pago premio",
      "created_at": "2025-12-18T02:20:00.000000Z"
    }
  }
}
```

### Response Error - Saldo Insuficiente (400)
```json
{
  "success": false,
  "message": "Saldo insuficiente. Saldo disponible: $70.000"
}
```

---

## 6. Obtener Balance

**GET** `/api/mobile/pasillera/balance`

### Headers
```
Authorization: Bearer {token}
```

### Response Success (200)
```json
{
  "success": true,
  "data": {
    "initial_balance": 100000,
    "current_balance": 70000,
    "total_payments": 30000
  }
}
```

---

## 7. Obtener Historial de Gastos

**GET** `/api/mobile/pasillera/history?limit=50`

### Headers
```
Authorization: Bearer {token}
```

### Query Parameters
- `limit` (opcional): Número de registros a retornar (default: 50)

### Response Success (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 6,
      "cash_shift_id": 2,
      "pasillera_id": 1,
      "type": "pasillera_payment",
      "amount": 5000,
      "machine": "Máquina 3",
      "description": "Pago Pasillera - Máquina: Máquina 3",
      "created_at": "2025-12-18T02:20:00.000000Z",
      "pasillera": {
        "id": 1,
        "user_id": 7
      },
      "cashShift": {
        "id": 2,
        "started_at": "2025-12-18T01:00:00.000000Z"
      }
    }
  ]
}
```

---

## 8. Obtener Lista de Máquinas

**GET** `/api/mobile/pasillera/machines`

### Headers
```
Authorization: Bearer {token}
```

### Response Success (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Máquina 1",
      "code": "M001"
    },
    {
      "id": 2,
      "name": "Máquina 2",
      "code": "M002"
    }
  ]
}
```

---

## Códigos de Error Comunes

- **401 Unauthorized**: Token inválido o expirado
- **403 Forbidden**: Usuario sin permisos
- **400 Bad Request**: Datos de entrada inválidos
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error del servidor

---

## Ejemplo de Uso con cURL

### Login
```bash
curl -X POST http://tu-dominio.com/api/mobile/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "trabajador01",
    "password": "password123",
    "device_name": "iPhone 13"
  }'
```

### Obtener Pasillera Activa
```bash
curl -X GET http://tu-dominio.com/api/mobile/pasillera/my-active \
  -H "Authorization: Bearer 1|abc123def456..." \
  -H "Accept: application/json"
```

### Registrar Gasto
```bash
curl -X POST http://tu-dominio.com/api/mobile/pasillera/expense \
  -H "Authorization: Bearer 1|abc123def456..." \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "machine": "Máquina 3",
    "description": "Pago premio"
  }'
```

---

## Notas Importantes

1. **Tokens**: Los tokens son permanentes hasta que se revoquen con logout
2. **Roles permitidos**: Solo usuarios con `role_id` 5 o 6 (trabajadores) pueden usar la app móvil
3. **Estados**: Solo usuarios con `status_id` 1 (activos) pueden iniciar sesión
4. **Pasillera activa**: Un usuario solo puede tener una pasillera activa a la vez
5. **Validación de saldo**: El sistema valida que haya saldo suficiente antes de registrar gastos
