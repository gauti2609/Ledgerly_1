# Quick Deployment Guide

This guide provides quick reference for deploying the application after the fixes.

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured (copy from `.env.example`)

## Development Deployment

```bash
# Clone and navigate to repository
cd /path/to/GoogleAILocal_v0

# Create environment file
cp .env.example .env

# Edit .env and add your API keys
# Required: JWT_SECRET, API_KEY, GEMINI_API_KEY

# Start services
docker-compose up --build -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f

# Access application
# Frontend: http://localhost:8080
# API: http://localhost:3000/api
```

## Production Deployment

```bash
# Use production configuration (no dev volumes)
docker-compose -f docker-compose.prod.yml up --build -d

# Check service health
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## What's Different After Fixes

### Automatic Features

1. **Database Migrations**: Now run automatically on startup
2. **Healthchecks**: Services wait for dependencies before starting
3. **No Manual Setup**: No need to run `prisma migrate` manually
4. **Multiple Deployments**: Can run multiple instances on same host

### Service Startup Order

```
1. Database starts → healthcheck passes (30s max)
2. API starts → waits for DB → runs migrations → healthcheck passes (60s max)
3. Frontend starts → waits for API → healthcheck passes (30s max)
```

### Healthcheck Endpoints

- Database: `pg_isready` command
- API: `http://localhost:3000/api/health`
- Frontend: `http://localhost:80/`

## Troubleshooting

### Services not starting

```bash
# Check logs
docker-compose logs -f

# Check specific service
docker-compose logs api
docker-compose logs db
docker-compose logs frontend
```

### Migration issues

Migrations now run automatically via entrypoint script. If you see migration errors:

```bash
# Check API logs
docker-compose logs api

# The entrypoint script will:
# 1. Wait for database
# 2. Run 'prisma migrate deploy' or 'prisma db push'
# 3. Start application
```

### Port conflicts

If ports are in use, edit docker-compose.yml:

```yaml
ports:
  - "8081:80"    # Change 8080 to 8081 for frontend
  - "3001:3000"  # Change 3000 to 3001 for API
  - "5433:5432"  # Change 5432 to 5433 for database
```

### Healthcheck failures

Healthchecks now have `start_period` to allow time for startup:
- DB: 30 seconds
- API: 60 seconds (includes build time)
- Frontend: 30 seconds

Wait for the start_period to elapse before investigating failures.

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# For production
docker-compose -f docker-compose.prod.yml down
```

## Updating After Changes

```bash
# Rebuild and restart
docker-compose up --build -d

# Or rebuild specific service
docker-compose up --build -d api
```

## Verifying Deployment

```bash
# Check all services are healthy
docker-compose ps

# Expected output:
# NAME                COMMAND                  SERVICE    STATUS         PORTS
# project_api_1       "docker-entrypoint.s…"   api        Up (healthy)   0.0.0.0:3000->3000/tcp
# project_db_1        "docker-entrypoint.s…"   db         Up (healthy)   0.0.0.0:5432->5432/tcp
# project_frontend_1  "/docker-entrypoint.…"   frontend   Up (healthy)   0.0.0.0:8080->80/tcp

# Test API health endpoint
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Test frontend
curl http://localhost:8080
# Expected: HTML content
```

## Common Commands

```bash
# View all running containers
docker-compose ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api

# Restart a service
docker-compose restart api

# Execute command in container
docker-compose exec api npx prisma studio

# Check container health
docker-compose ps | grep healthy
```

## Environment Variables

Required in `.env`:

```bash
# Database
POSTGRES_USER=user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=finautomatedb

# JWT Secret (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Google Gemini API Keys
API_KEY=your-google-gemini-api-key
GEMINI_API_KEY=your-google-gemini-api-key

# Auto-generated
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

## Getting Help

1. Check logs: `docker-compose logs -f`
2. Check health: `docker-compose ps`
3. See detailed fixes: `DEPLOYMENT_FIXES.md`
4. See full deployment guide: `DEPLOYMENT.md`

## Success Indicators

✅ All services show "healthy" status
✅ API responds at http://localhost:3000/api/health
✅ Frontend loads at http://localhost:8080
✅ No error messages in logs
✅ Database migrations completed

## Next Steps

1. Access http://localhost:8080
2. Create an account
3. Start using the application

For more details, see:
- `DEPLOYMENT_FIXES.md` - Detailed explanation of all fixes
- `DEPLOYMENT.md` - Comprehensive deployment guide
