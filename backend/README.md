Backend scaffold for IT Help Desk portal (MERN stack)

Quick start

1. Configure PostgreSQL connection via environment variables: `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT`.
2. Install dependencies:

```bash
cd backend
npm install
```

3. Run migration SQL against your database (example using psql):

```bash
psql "$PGDATABASE" -f backend/migrations/001_add_is_internal_and_indexes.sql
```

4. Start server:

```bash
npm start
```

Notes

- The server expects the frontend to include `X-User-Id` and `X-Org-Id` headers on each request. These are used to set session GUCs (`app.current_user` and `app.current_org`) so Row-Level Security policies can be enforced by PostgreSQL.
- Socket.io events: `joinTicket`, `leaveTicket`, `typing`. Server emits `message`, `escalation`, and `agent:availability`.
