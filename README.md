# CouponBook - Sistema de Gestión de Cupones

Sistema completo de gestión de cupones con arquitectura de microservicios, incluyendo generación masiva de códigos, asignación automática, proceso de canje en dos pasos y monitoreo en tiempo real.

## 🏗️ Arquitectura

### Backend (couponBook-back)
- **Framework**: Express.js con Node.js
- **Base de Datos**: PostgreSQL con Sequelize ORM
- **Cache**: Redis para locks temporales
- **Jobs**: BullMQ para procesamiento en background
- **Autenticación**: JWT
- **Validación**: Express-validator
- **Documentación**: Express-list-routes

### Frontend (couponBook-front)
- **Framework**: Vue.js 3 con Composition API
- **UI**: Vuetify 3
- **HTTP Client**: Axios
- **Estado**: Pinia
- **Build Tool**: Vite

## 📊 Base de Datos

### Esquema Principal

```sql
-- Usuarios del sistema
users (
  id (PK),
  name,
  email,
  password_hash,
  role,
  created_at, updated_at, deleted_at
)

-- Libros de cupones
coupon_books (
  id (PK),
  name,
  description,
  code_pattern,
  total_codes,
  allow_multiple_redemptions_per_user,
  per_user_max_assigned_codes,
  per_user_max_redemptions,
  start_at, end_at, status,
  created_at, updated_at, deleted_at
)

-- Códigos de cupones
coupon_codes (
  id (PK),
  book_id (FK),
  code,
  status,
  assigned_at,
  used_at,
  created_at, updated_at, deleted_at
)

-- Asignaciones de cupones
coupon_assignments (
  id (PK),
  coupon_id (FK),
  user_id (FK),
  assigned_at,
  created_at, updated_at, deleted_at
)

-- Canjes de cupones
coupon_redemptions (
  id (PK),
  coupon_id (FK),
  assignment_id (FK),
  redeemed_at,
  created_at, updated_at, deleted_at
)
```

### Estados de Cupones
- **AVAILABLE**: Disponible para asignación
- **ASSIGNED**: Asignado a un usuario
- **TEMP_LOCKED**: Bloqueado temporalmente para canje
- **REDEEMED**: Canjeado exitosamente

### Estados de Libros
- **ACTIVE**: Activo y disponible
- **INACTIVE**: Inactivo
- **EXPIRED**: Expirado

## 🚀 API Endpoints

### Autenticación
```
POST /v1/auth/login          - Iniciar sesión
GET  /v1/auth/me             - Obtener usuario actual
```

### Libros de Cupones
```
GET    /v1/coupon-books      - Listar libros (con paginación)
GET    /v1/coupon-books/:id  - Obtener libro por ID
POST   /v1/coupon-books      - Crear nuevo libro
PUT    /v1/coupon-books/:id  - Actualizar libro
DELETE /v1/coupon-books/:id  - Eliminar libro
```

### Códigos de Cupones
```
GET  /v1/coupon-codes                    - Listar códigos (con filtros)
GET  /v1/coupon-codes/:id                - Obtener código por ID
POST /v1/coupon-codes/generate           - Generar códigos (background job)
```

### Asignaciones de Cupones
```
GET    /v1/coupon-assignments/user/:userId - Listar asignaciones por usuario
GET    /v1/coupon-assignments/:id          - Obtener asignación por ID
POST   /v1/coupon-assignments/random        - Asignación aleatoria masiva
POST   /v1/coupon-assignments/specific      - Asignación específica
DELETE /v1/coupon-assignments/:id          - Desasignar cupón
```

### Canjes de Cupones
```
GET  /v1/coupon-redemptions                    - Listar canjes (con filtros)
POST /v1/coupon-redemptions/lock/:code         - Bloquear cupón temporalmente
POST /v1/coupon-redemptions/redeem/:code       - Canjear cupón
DELETE /v1/coupon-redemptions/lock/:code       - Liberar bloqueo
```

### Usuarios
```
GET    /v1/users      - Listar usuarios (con paginación)
GET    /v1/users/:id  - Obtener usuario por ID
POST   /v1/users      - Crear usuario
PUT    /v1/users/:id  - Actualizar usuario
DELETE /v1/users/:id  - Eliminar usuario
```

### Sistema
```
GET /health      - Health check con estadísticas de conexión
GET /api-routes  - Lista completa de endpoints
GET /            - Información de la API
```

## 🔧 Características Principales

### Proceso de Canje en Dos Pasos
1. **Lock**: Bloqueo temporal del cupón (3 minutos) con validaciones
2. **Redeem**: Canje definitivo con transacciones atómicas

### Generación Masiva de Códigos
- Procesamiento en background con BullMQ
- Generación optimizada con `bulkCreate`
- Manejo de duplicados con fallback
- Concurrencia configurable

### Asignación Inteligente
- Asignación aleatoria masiva
- Asignación específica por código
- Validación de límites por usuario
- Soporte para múltiples redenciones

### Monitoreo y Observabilidad
- Health check con estadísticas de DB
- Lista automática de endpoints
- Logs estructurados
- Dashboard de BullMQ

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- PostgreSQL 13+
- Redis 6+

### Variables de Entorno
```env
# Backend (.env)
NODE_ENV=development
PORT=3009
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coupons
DB_USER=postgres
DB_PASS=password
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
CODE_GENERATION_CONCURRENCY=3
```

## 🚀 Cómo Correr el Proyecto

### 1. Configurar Base de Datos
```bash
# Crear base de datos PostgreSQL
createdb coupons

# O usando psql
psql -U postgres
CREATE DATABASE coupons;
\q
```

### 2. Configurar Redis
```bash
# Instalar Redis (macOS)
brew install redis

# Iniciar Redis
redis-server

# Verificar que esté corriendo
redis-cli ping
# Debe responder: PONG
```

### 3. Configurar Backend
```bash
# Navegar al directorio backend
cd couponBook-back

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de DB

# Ejecutar migraciones
npm run db:migrate

# Ejecutar seeders (datos de prueba)
npm run db:seed:all

# Iniciar servidor
npm start
```

**El backend estará disponible en:** `http://localhost:3009`

### 4. Configurar Frontend
```bash
# Navegar al directorio frontend
cd couponBook-front

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**El frontend estará disponible en:** `http://localhost:3000`

## 🧪 Testing del Proyecto

### Credenciales de Prueba
```
Email: admin@couponbook.com
Password: admin123
```

### 1. Testing con Frontend
1. **Acceder al frontend**: `http://localhost:3000`
2. **Login**: Usar las credenciales de prueba
3. **Crear un libro de cupones**:
   - Nombre: "Test Book"
   - Patrón: "TEST-{random}"
   - Total: 100 códigos
   - Fechas: Actual a +30 días
4. **Generar códigos**: Usar el botón "Generar Códigos"
5. **Asignar cupones**: 
   - Asignación aleatoria masiva
   - Asignación específica por código
6. **Probar canjes**:
   - Lock de cupón
   - Redeem de cupón

### 2. Testing con Postman
1. **Importar collection**: `CouponBook_API.postman_collection.json`
2. **Configurar variables**:
   - `base_url`: `http://localhost:3009`
   - `auth_token`: (obtener del login)
3. **Flujo de testing**:
   ```
   1. POST /v1/auth/login
   2. GET /v1/coupon-books
   3. POST /v1/coupon-books (crear libro)
   4. POST /v1/coupon-codes/generate (generar códigos)
   5. POST /v1/coupon-assignments/random (asignar cupones)
   6. POST /v1/coupon-redemptions/lock/:code (lock cupón)
   7. POST /v1/coupon-redemptions/redeem/:code (redeem cupón)
   ```

### 3. Testing con cURL
```bash
# 1. Login
curl -X POST "http://localhost:3009/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@couponbook.com", "password": "admin123"}'

# 2. Crear libro (usar token del login)
curl -X POST "http://localhost:3009/v1/coupon-books" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Book",
    "code_pattern": "TEST-{random}",
    "total_codes": 50,
    "start_at": "2025-01-01T00:00:00.000Z",
    "end_at": "2025-12-31T23:59:59.000Z"
  }'

# 3. Generar códigos
curl -X POST "http://localhost:3009/v1/coupon-codes/generate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookId": 1, "quantity": 10}'

# 4. Asignar cupón aleatorio
curl -X POST "http://localhost:3009/v1/coupon-assignments/random" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookId": 1, "userId": 1, "quantity": 5}'

# 5. Lock cupón
curl -X POST "http://localhost:3009/v1/coupon-redemptions/lock/TEST-ABC123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Redeem cupón
curl -X POST "http://localhost:3009/v1/coupon-redemptions/redeem/TEST-ABC123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Verificar Funcionamiento
```bash
# Health check
curl http://localhost:3009/health

# Lista de endpoints
curl http://localhost:3009/api-routes

# Verificar Redis
redis-cli KEYS "coupon_lock:*"

# Verificar base de datos
psql -U postgres -d coupons -c "SELECT COUNT(*) FROM coupon_codes;"
psql -U postgres -d coupons -c "SELECT COUNT(*) FROM coupon_assignments;"
psql -U postgres -d coupons -c "SELECT COUNT(*) FROM coupon_redemptions;"
```

### 5. Monitoreo en Tiempo Real
- **Frontend Dashboard**: `http://localhost:3000` - Estadísticas y gráficos
- **BullMQ Dashboard**: `http://localhost:3009/bull-monitor` - Jobs en cola
- **API Health**: `http://localhost:3009/health` - Estado del sistema
- **Logs del Backend**: Terminal donde corre `npm start`

### 6. Casos de Prueba Específicos

#### Test de Concurrencia
```bash
# Lock múltiples cupones simultáneamente
for i in {1..5}; do
  curl -X POST "http://localhost:3009/v1/coupon-redemptions/lock/TEST-CODE$i" \
    -H "Authorization: Bearer YOUR_TOKEN" &
done
wait
```

#### Test de Límites
```bash
# Intentar asignar más cupones de los permitidos
curl -X POST "http://localhost:3009/v1/coupon-assignments/random" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookId": 1, "userId": 1, "quantity": 100}'
```

#### Test de Validaciones
```bash
# Intentar canjear cupón no asignado
curl -X POST "http://localhost:3009/v1/coupon-redemptions/lock/INVALID-CODE" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Intentar canjear cupón ya canjeado
curl -X POST "http://localhost:3009/v1/coupon-redemptions/redeem/ALREADY-REDEEMED" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Troubleshooting

#### Backend no inicia
```bash
# Verificar puerto
lsof -i :3009

# Verificar base de datos
psql -U postgres -d coupons -c "SELECT 1;"

# Verificar Redis
redis-cli ping
```

#### Frontend no carga
```bash
# Verificar puerto
lsof -i :3000

# Limpiar cache
rm -rf node_modules package-lock.json
npm install
```

#### Errores de base de datos
```bash
# Resetear base de datos
npm run db:migrate:undo:all
npm run db:migrate
npm run db:seed:all
```

## 📈 Optimizaciones Implementadas

### Base de Datos
- **Connection Pooling**: Reutilización de conexiones
- **Índices Optimizados**: Para consultas frecuentes
- **Soft Deletes**: Eliminación lógica con `paranoid`
- **Transacciones**: Operaciones atómicas críticas

### Performance
- **Consultas Eficientes**: Includes anidados optimizados
- **Paginación Server-Side**: Para grandes volúmenes
- **Cache Redis**: Para locks temporales
- **Background Jobs**: Para operaciones pesadas

### Escalabilidad
- **Microservicios Ready**: Arquitectura preparada
- **Queue System**: BullMQ para procesamiento asíncrono
- **Concurrencia**: Configurable por worker
- **Monitoreo**: Health checks y métricas

## 🔒 Seguridad

- **JWT Authentication**: Tokens seguros
- **Password Hashing**: bcrypt
- **Input Validation**: Sanitización de datos
- **Rate Limiting**: Protección contra abuso
- **CORS**: Configuración segura

## 📱 Frontend Features

### Dashboard Principal
- Estadísticas en tiempo real
- Gráficos de rendimiento
- Monitoreo de jobs

### Gestión de Libros
- CRUD completo
- Validaciones en tiempo real
- Fechas de vigencia

### Asignaciones
- Asignación masiva aleatoria
- Asignación específica
- Vista de asignaciones por usuario

### Canjes
- Proceso de dos pasos
- Validación de locks
- Historial completo

## 🚀 Deployment

### AWS Architecture (Recomendada)
- **ECS Fargate**: Contenedores sin servidor
- **RDS PostgreSQL**: Base de datos gestionada
- **ElastiCache Redis**: Cache distribuido
- **API Gateway**: Proxy y rate limiting
- **SQS/SNS**: Mensajería asíncrona
- **CloudWatch**: Monitoreo y logs
- **X-Ray**: Tracing distribuido

### Docker
```bash
# Backend
docker build -t couponbook-back ./couponBook-back
docker run -p 3009:3009 couponbook-back

# Frontend
docker build -t couponbook-front ./couponBook-front
docker run -p 3000:3000 couponbook-front
```

## 📊 Monitoreo

### Métricas Disponibles
- Conexiones de base de datos activas
- Jobs en cola y procesados
- Tiempo de respuesta de endpoints
- Uso de memoria y CPU

### Logs
- Estructurados en JSON
- Niveles configurables
- Rotación automática
- Integración con CloudWatch

## 🔄 Flujo de Trabajo

1. **Crear Libro**: Define patrones y límites
2. **Generar Códigos**: Procesamiento en background
3. **Asignar Cupones**: Aleatorio o específico
4. **Lock Cupón**: Validación y bloqueo temporal
5. **Redeem Cupón**: Canje definitivo con transacciones
6. **Monitorear**: Dashboard en tiempo real

## 📚 Documentación Adicional

- **Postman Collection**: `CouponBook_API.postman_collection.json`
- **Database Schema**: `coupon_service_erm.svg`
- **API Routes**: `GET /api-routes`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para gestión eficiente de cupones**
