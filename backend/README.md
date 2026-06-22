# ChatGuard Enterprise - Backend

A production-grade Spring Boot 3 backend for the ChatGuard Enterprise communication risk management platform.

## Tech Stack

- **Java 21** - Latest LTS version
- **Spring Boot 3.2.1** - Modern microservices framework
- **Spring Security** - JWT-based authentication
- **Spring Data JPA** - Hibernate ORM
- **Spring WebSocket** - Real-time messaging with STOMP
- **MySQL 8.0** - Primary database
- **Redis** - Caching layer
- **Apache Kafka** - Event streaming

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Frontend │────▶│  Spring Boot API │────▶│    MySQL DB      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Redis     │      │   Kafka     │      │  WebSocket  │
│   (Cache)   │      │ (Events)    │      │  (Real-time)│
└─────────────┘      └─────────────┘      └─────────────┘
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Java 21 (for local development)
- Maven 3.9+

### Run with Docker

```bash
cd backend
docker-compose up -d
```

This starts:
- MySQL on port 3306
- Redis on port 6379
- Kafka on port 9092/9093
- API on port 8080
- Prometheus on port 9090
- Grafana on port 3001

### Local Development

```bash
# Start infrastructure
docker-compose up -d mysql redis kafka zookeeper

# Run application
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/channel/{id}` - Get channel messages
- `PUT /api/messages/{id}` - Edit message
- `DELETE /api/messages/{id}` - Delete message

### Channels
- `GET /api/channels` - List channels
- `POST /api/channels` - Create channel
- `POST /api/channels/{id}/join` - Join channel
- `GET /api/channels/{id}/members` - Get members

### Protection
- `GET /api/protection/rules` - List rules
- `POST /api/protection/rules` - Create rule
- `PUT /api/protection/rules/{id}` - Update rule
- `GET /api/protection/events` - List events

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/risk` - Risk analytics
- `GET /api/analytics/users` - User risk scores

### Admin
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/{id}/role` - Update user role
- `PUT /api/admin/users/{id}/status` - Suspend/activate user
- `GET /api/audit/logs` - Audit logs

## WebSocket Endpoints

- `ws://localhost:8080/api/ws` - WebSocket connection
- `/topic/channel/{id}` - Channel messages
- `/user/queue/notifications` - User notifications
- `/user/queue/protection` - Protection alerts

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | MySQL host |
| `DB_PORT` | 3306 | MySQL port |
| `DB_NAME` | chatguard | Database name |
| `DB_USERNAME` | chatguard | Database user |
| `DB_PASSWORD` | chatguard123 | Database password |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `KAFKA_BROKERS` | localhost:9092 | Kafka brokers |
| `JWT_SECRET` | - | JWT signing key (min 32 chars) |

## Kafka Topics

- `chatguard.protection.events` - Protection event notifications
- `chatguard.notifications` - User notification events
- `chatguard.audit` - Audit log events

## Security

- JWT tokens with configurable expiration
- BCrypt password hashing
- Role-based access control (RBAC)
- CORS configuration
- Rate limiting support

## Monitoring

- Spring Actuator endpoints
- Prometheus metrics at `/actuator/prometheus`
- Health check at `/actuator/health`
- Grafana dashboards (pre-configured)

## API Documentation

Swagger UI: `http://localhost:8080/api/swagger-ui.html`
OpenAPI Spec: `http://localhost:8080/api/v3/api-docs`

## Building

```bash
# Build JAR
mvn clean package

# Build Docker image
docker build -t chatguard-api .
```

## Testing

```bash
mvn test
mvn verify
```
