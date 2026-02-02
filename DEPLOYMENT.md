# FinAutomate - Deployment Guide

This guide provides detailed instructions for deploying the FinAutomate application using Docker.

## Overview

The application consists of three services:
- **PostgreSQL Database** (db): Stores all application data
- **NestJS Backend API** (api): Handles authentication, data management, and AI features
- **React Frontend** (frontend): User interface served via Nginx

## Prerequisites

### Required Software

1. **Docker & Docker Compose**
   - **On Windows/Mac**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - **On Linux**: Install Docker Engine and Docker Compose
   - **On Asustor NAS**: Install "Docker Engine" and "Portainer" from App Central

2. **Minimum System Requirements**
   - 2GB RAM
   - 5GB free disk space
   - Internet connection for initial build

## Setup Instructions

### Step 1: Extract and Navigate to Project

1. Extract the `financials-automation_v0.zip` file
2. Open a terminal and navigate to the extracted directory:
   ```bash
   cd /path/to/financials-automation_v0
   ```

### Step 2: Configure Environment Variables

1. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your settings:
   ```bash
   # Database Configuration (you can keep defaults or customize)
   POSTGRES_USER=user
   POSTGRES_PASSWORD=your_secure_password_here
   POSTGRES_DB=finautomatedb

   # JWT Secret (REQUIRED: Change this to a long random string)
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

   # Google Gemini API Key (REQUIRED: Get from https://aistudio.google.com/apikey)
   API_KEY=your-actual-google-gemini-api-key
   GEMINI_API_KEY=your-actual-google-gemini-api-key

   # Database URL (auto-generated, do not modify)
   DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
   ```

   **Important:**
   - Replace `JWT_SECRET` with a long, random, secure string (minimum 32 characters)
   - Replace `API_KEY` and `GEMINI_API_KEY` with your actual Google Gemini API key
   - To get a Gemini API key, visit: https://aistudio.google.com/apikey

### Step 3: Build and Start the Application

Run the following command to build and start all services:

```bash
docker-compose up --build -d
```

**Command breakdown:**
- `--build`: Builds the Docker images from the Dockerfiles
- `-d`: Runs containers in detached mode (background)

**First-time build:** This may take 10-20 minutes depending on your internet speed as it needs to:
- Download Node.js and PostgreSQL images
- Install all npm dependencies
- Build the frontend and backend applications

**Progress monitoring:** To watch the build progress:
```bash
docker-compose logs -f
```
Press `Ctrl+C` to stop watching logs (containers will continue running).

### Step 4: Initialize the Database

After the containers are running, initialize the database schema:

```bash
docker-compose exec api npx prisma migrate dev --name init
```

Or alternatively:
```bash
docker-compose exec api npx prisma db push
```

### Step 5: Access the Application

Once all services are running:

1. **Open your web browser**
2. **Navigate to**: `http://localhost:8080` (or `http://<your-nas-ip>:8080` if on NAS)
3. **Create an account** and start using FinAutomate!

## Managing the Application

### Viewing Logs

To view logs from all services:
```bash
docker-compose logs -f
```

To view logs from a specific service:
```bash
docker-compose logs -f api      # Backend API logs
docker-compose logs -f frontend  # Frontend logs
docker-compose logs -f db        # Database logs
```

### Stopping the Application

To stop all services:
```bash
docker-compose down
```

**Note:** Your data is persisted in a Docker volume and will be preserved when you stop the containers.

### Starting the Application (After First Setup)

To start the application again (no build needed):
```bash
docker-compose up -d
```

### Restarting a Service

To restart a specific service:
```bash
docker-compose restart api      # Restart backend
docker-compose restart frontend # Restart frontend
docker-compose restart db       # Restart database
```

### Rebuilding After Code Changes

If you make changes to the code:
```bash
docker-compose up --build -d
```

## Troubleshooting

### Problem: "Port already in use" error

**Solution:** Check if another application is using the ports:
- Port 8080 (frontend)
- Port 3000 (backend)
- Port 5432 (database)

Change ports in `docker-compose.yml` if needed.

### Problem: "Cannot connect to API" error

**Solution:**
1. Check if backend is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs api`
3. Ensure `.env` file has correct `API_KEY` and `JWT_SECRET`
4. Restart services: `docker-compose restart`

### Problem: Database connection errors

**Solution:**
1. Check database is running: `docker-compose ps db`
2. Check database logs: `docker-compose logs db`
3. Verify `DATABASE_URL` in `.env` is correct
4. Run database migration: `docker-compose exec api npx prisma migrate dev`

### Problem: Frontend shows blank page

**Solution:**
1. Check frontend logs: `docker-compose logs frontend`
2. Check browser console for errors (F12)
3. Verify API is accessible: `curl http://localhost:3000/api/health`
4. Clear browser cache and reload

### Problem: Build takes too long or fails

**Solution:**
1. Ensure good internet connection
2. Increase Docker memory allocation in Docker Desktop settings (minimum 2GB)
3. Try building without cache: `docker-compose build --no-cache`

## Data Backup

### Backup Database

To backup your data:
```bash
docker-compose exec db pg_dump -U user finautomatedb > backup.sql
```

### Restore Database

To restore from backup:
```bash
docker-compose exec -T db psql -U user finautomatedb < backup.sql
```

## Advanced Configuration

### Changing Ports

Edit `docker-compose.yml` to change exposed ports:

```yaml
frontend:
  ports:
    - "9000:80"  # Change 8080 to your preferred port
    
api:
  ports:
    - "4000:3000"  # Change 3000 to your preferred port
```

### Production Deployment

For production deployment:

1. **Remove volume mounts** from the API service in `docker-compose.yml`:
   ```yaml
   api:
     # Remove these lines in production:
     # volumes:
     #   - ./backend:/usr/src/app
     #   - /usr/src/app/node_modules
   ```

2. **Use environment-specific .env file** with secure credentials

3. **Enable HTTPS** using a reverse proxy (nginx, Caddy, or Traefik)

4. **Set up regular backups** of the database volume

## Support

For issues or questions:
- Check the logs first: `docker-compose logs -f`
- Review this troubleshooting section
- Ensure all prerequisites are installed correctly
- Verify `.env` file is configured correctly with valid API keys

## Architecture

```
┌─────────────────┐
│  Browser :8080  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Nginx          │ ← Serves React app
│  (Frontend)     │ ← Proxies /api to backend
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  NestJS         │ ← REST API
│  (Backend)      │ ← JWT Authentication
└────────┬────────┘ ← Gemini AI Integration
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │ ← Data persistence
│  (Database)     │
└─────────────────┘
```

## Quick Reference

| Service  | Internal Port | External Port | URL |
|----------|--------------|---------------|-----|
| Frontend | 80           | 8080          | http://localhost:8080 |
| Backend  | 3000         | 3000          | http://localhost:3000 |
| Database | 5432         | 5432          | postgresql://localhost:5432 |

## Security Notes

- Never commit `.env` file to version control
- Keep your JWT_SECRET secure and random
- Protect your Gemini API key
- Use strong database passwords in production
- Regularly backup your data
- Keep Docker and images updated
