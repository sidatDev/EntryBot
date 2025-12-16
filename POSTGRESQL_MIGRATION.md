# PostgreSQL to SQLite Migration Guide

## Overview
Your project has been migrated from SQLite to PostgreSQL for production deployment.

## Changes Made

### 1. Prisma Schema Updated
- **File**: `prisma/schema.prisma`
- **Change**: Provider changed from `sqlite` to `postgresql`
- **Connection**: Now uses `DATABASE_URL` environment variable

### 2. Environment Variables Required

Create a `.env` file with:

```env
# PostgreSQL Connection
DATABASE_URL="postgresql://username:password@localhost:5432/entrybot?schema=public"

# NextAuth
NEXTAUTH_SECRET="3WBXWv+ZTr+JCBnF5hWCx2FX3WBAE77KqH/cPTRtXw8="
NEXTAUTH_URL="http://localhost:3000"
```

## Setup Instructions

### Local Development with PostgreSQL

1. **Install PostgreSQL** (if not already installed)
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

2. **Create Database**
   ```sql
   CREATE DATABASE entrybot;
   ```

3. **Update `.env` file**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/entrybot?schema=public"
   ```

4. **Run Migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

### Production Deployment

Your Docker setup already includes PostgreSQL via `docker-compose.yml`:

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL container
- Run migrations automatically
- Start your Next.js app

## Migration from SQLite Data (Optional)

If you have existing SQLite data to migrate:

1. **Export from SQLite**
   ```bash
   sqlite3 prisma/dev.db .dump > data.sql
   ```

2. **Convert and Import to PostgreSQL**
   - Manual conversion required (SQLite → PostgreSQL syntax differences)
   - Or use migration tools like `pgloader`

## Verification

Test the connection:
```bash
npx prisma studio
```

This should open Prisma Studio connected to PostgreSQL.

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running
- Check port 5432 is not blocked
- Verify credentials in `DATABASE_URL`

### Migration Errors
- Drop and recreate database if needed:
  ```sql
  DROP DATABASE entrybot;
  CREATE DATABASE entrybot;
  ```
- Re-run migrations

### Prisma Client Errors
- Regenerate client: `npx prisma generate`
- Restart dev server: `npm run dev`
