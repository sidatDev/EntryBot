# EntryBot Docker Deployment Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### Setup Steps

1. **Clone the repository** (if not already done)
   ```bash
   cd c:\Burhan\Projects\AI\EntryBot\entry-bot
   ```

2. **Create environment file**
   ```bash
   copy .env.docker.example .env
   ```

3. **Edit `.env` file** and update:
   - `POSTGRES_PASSWORD`: Set a secure database password
   - `NEXTAUTH_SECRET`: Generate using `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Set to your production URL (e.g., `https://yourdomain.com`)

4. **Update Next.js config** for standalone output
   
   Add to `next.config.ts`:
   ```typescript
   const nextConfig = {
     output: 'standalone',
     // ... other config
   };
   ```

5. **Build and run**
   ```bash
   docker-compose up -d
   ```

6. **Check logs**
   ```bash
   docker-compose logs -f app
   ```

7. **Access the application**
   - Open browser: `http://localhost:3000`

## Docker Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Database migrations
```bash
docker-compose exec app npx prisma migrate deploy
```

### Access database
```bash
docker-compose exec db psql -U entrybot -d entrybot
```

## Production Deployment

### Environment Variables
Ensure these are set in production:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your production URL (https)
- `NEXTAUTH_SECRET`: Strong random secret
- `NODE_ENV=production`

### Security Checklist
- [ ] Change default database password
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Use HTTPS in production
- [ ] Set up proper firewall rules
- [ ] Regular database backups
- [ ] Monitor logs and health checks

### Backup Database
```bash
docker-compose exec db pg_dump -U entrybot entrybot > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker-compose exec -T db psql -U entrybot entrybot
```

## Troubleshooting

### Container won't start
```bash
docker-compose logs app
docker-compose logs db
```

### Database connection issues
- Check `DATABASE_URL` in `.env`
- Ensure database container is healthy: `docker-compose ps`

### Permission issues with uploads
```bash
docker-compose exec app chown -R nextjs:nodejs /app/public/uploads
```

### Reset everything
```bash
docker-compose down -v
docker-compose up -d
```

## Architecture

- **App Container**: Next.js 16 application (Node 20 Alpine)
- **DB Container**: PostgreSQL 16 (Alpine)
- **Volumes**: 
  - `postgres_data`: Database persistence
  - `./public/uploads`: File uploads (mounted from host)

## Health Checks

The application includes a health check endpoint. Monitor with:
```bash
curl http://localhost:3000/api/health
```

## Notes

- SQLite is used in development, PostgreSQL in Docker
- Prisma migrations run automatically on container start
- Uploads are persisted in a Docker volume
- Non-root user (nextjs) runs the application for security
