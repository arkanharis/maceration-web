# Backend

Node.js + Express + Socket.IO + PostgreSQL + MQTT bridge.

## Getting started

```bash
npm install
cp ../.env.example .env   # then fill in real values
npm run dev
```

Health check: `GET /api/v1/health`

## Database migrations

Uses [`node-pg-migrate`](https://github.com/salsita/node-pg-migrate). Make sure
`DATABASE_URL` is set in `.env` (or exported in your shell) and that the
target PostgreSQL database already exists.

```bash
# apply all pending migrations
npm run migrate:up

# roll back the most recent migration
npm run migrate:down

# create a new migration file
npm run migrate:create -- some_migration_name
```

Migration files live in `migrations/` and run in this order:
1. `create_users_table` — `users` table + `global_role` enum
2. `create_devices_table` — `devices` table + `device_status`/`connection_status` enums
3. `create-device-access-table` — `device_access` table + `device_access_role` enum, unique `(device_id, user_id)`
4. `create-device-logs-table` — `device_logs` table, indexed on `(device_id, recorded_at)`
5. `create-device-events-table` — `device_events` table, indexed on `(device_id, created_at)` and `event_type`
