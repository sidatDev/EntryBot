# PostgreSQL Database Setup with pgvector

## Quick Start Commands

### 1. Stop any existing PostgreSQL container
```bash
docker stop entrybot-postgres 2>$null
docker rm entrybot-postgres 2>$null
```

### 2. Start PostgreSQL with pgvector
```bash
docker run -d `
  --name entrybot-postgres `
  -e POSTGRES_USER=entrybot_user `
  -e POSTGRES_PASSWORD=entrybot_secure_password_2024 `
  -e POSTGRES_DB=entrybot `
  -p 5432:5432 `
  -v entrybot-pgdata:/var/lib/postgresql/data `
  pgvector/pgvector:latest
```

### 3. Verify container is running
```bash
docker ps | Select-String "entrybot-postgres"
```

### 4. Test connection
```bash
docker exec -it entrybot-postgres psql -U entrybot_user -d entrybot -c "SELECT version();"
```

## Environment Variables

Create a `.env` file in your project root with:

```env
# PostgreSQL Database Configuration
POSTGRES_USER=entrybot_user
POSTGRES_PASSWORD=entrybot_secure_password_2024
POSTGRES_DB=entrybot
POSTGRES_PORT=5432

# Database URL for Prisma
DATABASE_URL="postgresql://entrybot_user:entrybot_secure_password_2024@localhost:5432/entrybot?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="3WBXWv+ZTr+JCBnF5hWCx2FX3WBAE77KqH/cPTRtXw8="
NEXTAUTH_URL="http://localhost:3000"
```

## Run Prisma Migrations

After database is running:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Open Prisma Studio to verify
npx prisma studio
```

## Useful Commands

### View logs
```bash
docker logs entrybot-postgres
```

### Access PostgreSQL shell
```bash
docker exec -it entrybot-postgres psql -U entrybot_user -d entrybot
```

### Stop database
```bash
docker stop entrybot-postgres
```

### Start database
```bash
docker start entrybot-postgres
```

### Remove database (WARNING: deletes all data)
```bash
docker stop entrybot-postgres
docker rm entrybot-postgres
docker volume rm entrybot-pgdata
```

## Troubleshooting

### Port already in use
```bash
# Find process using port 5432
netstat -ano | findstr :5432

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Connection refused
- Ensure container is running: `docker ps`
- Check logs: `docker logs entrybot-postgres`
- Verify port mapping: `docker port entrybot-postgres`

### Reset database
```bash
docker exec -it entrybot-postgres psql -U entrybot_user -d postgres -c "DROP DATABASE entrybot;"
docker exec -it entrybot-postgres psql -U entrybot_user -d postgres -c "CREATE DATABASE entrybot;"
npx prisma migrate dev --name init
```
