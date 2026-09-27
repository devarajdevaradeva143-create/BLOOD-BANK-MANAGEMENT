# Blood Bank API (backend)

Express + Mongoose backend for the Blood Bank Management System. ESM (`"type": "module"`).

## Setup

```bash
cd backend
cp .env.example .env   # fill in secrets
npm install
npm run dev            # nodemon src/index.js
```

Production:

```bash
npm start              # node src/index.js
npm run seed           # node src/seed.js (seed district admin/super admin users)
```

## Env

| Var | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `5000` | HTTP port |
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | — | Access-token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | — | Refresh-token secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES` | No | `7d` | Refresh token TTL |
| `CORS_ORIGINS` | No | `http://localhost:5173,http://localhost:3000` | CSV whitelist, `credentials: true` |
| `OTP_PROVIDER` | No | `log` | `log` (dev) or SMS provider name |
| `OTP_PROVIDER_KEY` | No | — | SMS provider API key |
| `SEED_DISTRICT_ADMIN_ID` | No | `DIST-001` | Seed district admin login id |
| `SEED_DISTRICT_ADMIN_PIN` | No | `1234` | Seed district admin PIN |
| `SEED_DISTRICT_ADMIN_DISTRICT` | No | `` | Seed district admin district (empty = all) |
| `SEED_SUPER_ADMIN_ID` | No | `SUPER001` | Seed super admin login id |
| `SEED_SUPER_ADMIN_PIN` | No | `Admin@123` | Seed super admin PIN |
| `SEED_SUPER_ADMIN_DISTRICT` | No | `` | Seed super admin district (empty = all) |

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| `npm run dev` | `nodemon src/index.js` | Dev with auto-reload |
| `npm start` | `node src/index.js` | Production start |
| `npm run seed` | `node src/seed.js` | Seed initial users |

## API

| Method & Path | Auth | Description |
| --- | --- | --- |
| `GET /healthz` | No | Health check |
| `POST /api/auth/login` | No (rate-limited) | Login, sets refresh cookie |
| `POST /api/auth/refresh` | Cookie | Rotate tokens |
| `POST /api/auth/logout` | Optional | Clear refresh cookie |
| `GET /api/donors` | `DistrictAdmin, SuperAdmin` | List donors |
| `POST /api/donors` | `DistrictAdmin, SuperAdmin` | Register donor |
| `GET /api/requests` | `DistrictAdmin, SuperAdmin` | List blood requests |
| `POST /api/requests` | Public/OTP | Create blood request |
| `GET /api/inventory` | `DistrictAdmin, SuperAdmin` | Blood stock |
| `GET /api/admin/audit` | `DistrictAdmin, SuperAdmin` | Audit logs |

Auth: `Authorization: Bearer <accessToken>` or `accessToken` cookie. Roles via `requireRole()`.
