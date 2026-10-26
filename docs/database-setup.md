# WordQuest: Database Setup & Migration Guide

## 1. Local PostgreSQL Setup

You can run PostgreSQL locally using either Docker Compose or a native PostgreSQL installation.

### Option A: Using Docker (Recommended, Fast & Isolated)
If you have Docker Desktop running:
```powershell
cd d:\WordQuest
docker compose up -d
```
This spins up PostgreSQL 16 on `localhost:5432` with:
- **Database**: `wordquest`
- **Username**: `postgres`
- **Password**: `postgres`
- **Connection URL**: `postgresql://postgres:postgres@localhost:5432/wordquest`

To verify the container is healthy:
```powershell
docker ps
```

To stop the container when done:
```powershell
docker compose down
```

---

### Option B: Native PostgreSQL Service (e.g. Postgres / pgAdmin)
If you already have PostgreSQL installed natively on Windows:
1. Open `psql` or **pgAdmin**.
2. Create the database:
   ```sql
   CREATE DATABASE wordquest;
   ```
3. Update `DATABASE_URL` in [server/.env](file:///d:/WordQuest/server/.env) to match your local credentials:
   ```env
   DATABASE_URL=postgresql://<YOUR_USER>:<YOUR_PASSWORD>@localhost:5432/wordquest
   ```

---

## 2. Managing Migrations with Drizzle Kit

In `server/`:

1. **Generate Migration Files** (translates TypeScript schema into SQL):
   ```powershell
   npm run db:generate
   ```
   This outputs SQL migration files into `server/drizzle/`.

2. **Apply Migrations** to the database:
   ```powershell
   npm run db:migrate
   ```

3. **Open Drizzle Studio** (Visual GUI database browser):
   ```powershell
   npm run db:studio
   ```
   Opens a browser UI at `https://local.drizzle.studio` to inspect tables and rows.
