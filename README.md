# ChatGuard Enterprise

A communication risk management platform that protects organizations from accidental data leaks, wrong-recipient messages, and sensitive content exposure in real-time chat.

---

## What it does

- **Sensitive content detection** — scans messages for credit card numbers, SSNs, API keys, and passwords before they're sent
- **Wrong recipient protection** — warns users when sending to external or unexpected recipients
- **Forward & bulk message controls** — requires confirmation before forwarding sensitive content or mass-messaging
- **Real-time protection dialogs** — intercepts risky actions and prompts the user to confirm or cancel
- **Risk scoring** — assigns each user a risk score based on their behavior over time
- **Audit logs** — full tamper-evident history of every action in the organization
- **Analytics dashboard** — message volume, risk trends, protection events, and user risk scores
- **Admin panel** — manage users, roles, and organization settings
- **WebSocket support** — live message delivery and presence indicators

---

## Tech stack

### Frontend
| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| State | Zustand 5 |
| Routing | React Router 7 |
| Charts | Recharts |
| Animations | Framer Motion |
| HTTP client | Native `fetch` (custom typed wrapper in `src/lib/api.ts`) |

### Backend
| | |
|---|---|
| Framework | Spring Boot 3.2.1 |
| Language | Java 21 |
| Auth | JWT (jjwt 0.12.3) — stateless, Bearer token |
| Database | MySQL 8.0 + Spring Data JPA + Hibernate |
| Cache | Redis 7 (Lettuce) |
| Messaging | Apache Kafka (Confluent 7.5) |
| WebSockets | Spring WebSocket + STOMP |
| API docs | SpringDoc OpenAPI 2.3 (Swagger UI) |
| Metrics | Micrometer + Prometheus |
| Monitoring | Grafana |

---

## Project structure

```
project/
├── src/                        # React frontend
│   ├── lib/
│   │   └── api.ts              # Typed API client for the backend
│   ├── hooks/
│   │   └── useAuth.ts          # Auth hook (login, register, logout, session restore)
│   ├── pages/
│   │   ├── AuthPage.tsx        # Login + Register
│   │   ├── DashboardPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── ProtectionPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── AuditPage.tsx
│   │   └── AdminPage.tsx
│   ├── store/
│   │   └── index.ts            # Zustand stores (auth, chat, notifications, UI)
│   └── types/
│       └── index.ts            # Shared TypeScript types
│
└── backend/                    # Spring Boot API
    ├── src/main/java/com/chatguard/
    │   ├── controller/         # REST endpoints
    │   ├── service/            # Business logic
    │   ├── entity/             # JPA entities
    │   ├── dto/                # Request / response shapes
    │   ├── repository/         # Spring Data repositories
    │   ├── security/           # JWT filter, entry point, user details
    │   ├── config/             # Security, WebSocket, OpenAPI config
    │   ├── kafka/              # Producers and consumers
    │   └── websocket/          # WebSocketMessageSender
    ├── docker-compose.yml
    ├── Dockerfile
    └── pom.xml
```

---

## Getting started

### Prerequisites

- Node.js 18+
- Java 21
- Maven 3.9+
- Docker + Docker Compose

---

### Run with Docker (recommended)

This starts MySQL, Redis, Kafka, Zookeeper, the Spring Boot API, Prometheus, and Grafana all at once.

```bash
cd backend
docker compose up -d
```

Wait about 30 seconds for all services to become healthy, then:

```bash
# Check everything is running
docker compose ps

# Tail the API logs
docker logs chatguard-api -f
```

---

### Run locally (without Docker)

**Backend**

Make sure MySQL is running on port 3306 and Redis on port 6379 locally, then:

```bash
cd backend
mvn spring-boot:run
```

The API starts on `http://localhost:8080/api`.

**Frontend**

```bash
# From the project root
npm install
npm run dev
```

The frontend starts on `http://localhost:5173`.

---

## Environment variables

### Frontend — `.env`

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### Backend — environment or `application.yml` overrides

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `chatguard` | Database name |
| `DB_USERNAME` | `chatguard` | DB user |
| `DB_PASSWORD` | `chatguard123` | DB password |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `KAFKA_BROKERS` | `localhost:9092` | Kafka bootstrap servers |
| `JWT_SECRET` | *(see below)* | HS256 signing key — **change in production** |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed frontend origins |
| `SERVER_PORT` | `8080` | API port |

> The JWT secret must be at least 32 characters. In Docker, it's set in `docker-compose.yml` under the `chatguard-api` service environment.

---

## API

Base URL: `http://localhost:8080/api`

### Auth (public)

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user + organization |
| `POST` | `/auth/login` | Login, returns access + refresh tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Logout |
| `GET` | `/auth/me` | Get current user profile |
| `POST` | `/auth/password/reset` | Request password reset |
| `PUT` | `/auth/password` | Change password |

All other endpoints require `Authorization: Bearer <token>`.

### Channels

| Method | Path | Description |
|---|---|---|
| `GET` | `/channels` | List org channels |
| `GET` | `/channels/{id}` | Get channel by ID |
| `POST` | `/channels` | Create channel |
| `POST` | `/channels/{id}/join` | Join a channel |

### Messages

| Method | Path | Description |
|---|---|---|
| `POST` | `/messages` | Send message |
| `GET` | `/messages/channel/{channelId}` | Get channel messages (paginated) |
| `GET` | `/messages/direct/{userId}` | Get direct messages with a user |
| `PUT` | `/messages/{id}` | Edit message |
| `DELETE` | `/messages/{id}` | Delete message |

### Protection

| Method | Path | Description |
|---|---|---|
| `GET` | `/protection/rules` | List protection rules |
| `POST` | `/protection/rules` | Create rule (ADMIN/MANAGER) |
| `PUT` | `/protection/rules/{id}` | Update rule (ADMIN/MANAGER) |
| `DELETE` | `/protection/rules/{id}` | Delete rule (ADMIN) |
| `GET` | `/protection/events` | Paginated verification events |
| `GET` | `/protection/events/pending` | Unresolved events |
| `POST` | `/protection/events/{id}/resolve` | Resolve event |

### Analytics (ADMIN/MANAGER)

| Method | Path | Description |
|---|---|---|
| `GET` | `/analytics/dashboard` | Active users, messages sent, risk events, compliance score |
| `GET` | `/analytics/risk` | Risk distribution by level |
| `GET` | `/analytics/users` | User risk scores |

### Audit (ADMIN/MANAGER)

| Method | Path | Description |
|---|---|---|
| `GET` | `/audit/logs` | Paginated audit logs (filter by `action` prefix) |
| `GET` | `/audit/logs/{id}` | Single log entry |
| `GET` | `/audit/summary` | Action counts by type |

### Admin (ADMIN)

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/users` | Paginated users (filter by `role`) |
| `PUT` | `/admin/users/{id}/role` | Change user role |
| `PUT` | `/admin/users/{id}/status` | Suspend or activate user |
| `GET` | `/admin/users/high-risk` | Users above risk threshold |
| `GET` | `/admin/statistics` | Org-wide user counts |

Full interactive docs are available at:
```
http://localhost:8080/api/swagger-ui/index.html
```

---

## Service ports

| Service | Port | URL |
|---|---|---|
| Frontend (dev) | 5173 | `http://localhost:5173` |
| Spring Boot API | 8080 | `http://localhost:8080/api` |
| Swagger UI | 8080 | `http://localhost:8080/api/swagger-ui/index.html` |
| MySQL | 3306 | — |
| Redis | 6379 | — |
| Kafka | 9093 | (host-accessible) |
| Prometheus | 9090 | `http://localhost:9090` |
| Grafana | 3001 | `http://localhost:3001` (admin / admin) |

---

## Health checks

```bash
# API health
curl http://localhost:8080/api/actuator/health

# Prometheus metrics
curl http://localhost:8080/api/actuator/prometheus
```

---

## Rebuild after code changes

```bash
cd backend
docker compose down
mvn clean package -DskipTests
docker compose build --no-cache
docker compose up -d
```

---

## Authentication flow

1. `POST /auth/register` — returns `{ accessToken, refreshToken, user }`
2. Store tokens in `localStorage` under `chatguard-token` and `chatguard-refresh-token`
3. Attach `Authorization: Bearer <accessToken>` to every subsequent request
4. On 401, use `POST /auth/refresh` with the refresh token to get a new access token
5. On logout, call `POST /auth/logout` and clear both tokens from storage

Access tokens expire in 24 hours. Refresh tokens expire in 7 days.

---

## Protection rules

Rules are stored per-organization and evaluated on every outbound message. Each rule has:

- `ruleType` — `sensitive_content`, `wrong_recipient`, `forward_protection`, `bulk_message`, `delete_protection`, `file_upload`
- `action` — `WARN` (shows dialog, user can proceed), `BLOCK` (message is soft-deleted), `REQUIRE_APPROVAL`
- `severity` — `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `enabled` — can be toggled without deleting the rule

When a rule triggers, a `VerificationEvent` is created and a WebSocket `ProtectionAlert` is pushed to the sender.

---

## WebSocket

Connect to `ws://localhost:8080/api/ws` using STOMP.

| Destination | Direction | Description |
|---|---|---|
| `/topic/channel/{channelId}` | Subscribe | New messages in a channel |
| `/topic/channel/{channelId}/typing` | Subscribe | Typing indicators |
| `/topic/presence` | Subscribe | User online/offline status |
| `/user/queue/notifications` | Subscribe | Personal notifications |
| `/user/queue/protection` | Subscribe | Protection alerts |
| `/app/message.send` | Publish | Send a message |
| `/app/typing` | Publish | Broadcast typing indicator |

---

## License

Private — all rights reserved.
