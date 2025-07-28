# Deployment Guide for Coolify

This guide will help you deploy the Timetracker application to Coolify.

## Prerequisites

- Coolify instance set up and running
- PostgreSQL database (can be managed by Coolify or external)
- SMTP service for email notifications (optional for development)

## PostgreSQL Setup

### Option 1: Automated Installation (Recommended)

Run the automated installation script:

```bash
# Install PostgreSQL
npm run postgres:install

# Set up database and user
npm run postgres:setup
```

### Option 2: Manual Installation

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### CentOS/RHEL
```bash
sudo yum install postgresql postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Database Configuration

After installing PostgreSQL, create the database and user:

```bash
# Connect as postgres user
sudo -u postgres psql

# Create user and database
CREATE USER timetracker WITH PASSWORD 'your-secure-password';
CREATE DATABASE timetracker OWNER timetracker;
GRANT ALL PRIVILEGES ON DATABASE timetracker TO timetracker;
\q
```

### Configure External Access (for Coolify)

Edit PostgreSQL configuration to allow external connections:

1. **Find configuration directory:**
   ```bash
   # Ubuntu/Debian
   sudo find /etc/postgresql -name "postgresql.conf"
   
   # CentOS/RHEL
   sudo find /var/lib/pgsql -name "postgresql.conf"
   ```

2. **Update postgresql.conf:**
   ```bash
   sudo nano /etc/postgresql/*/main/postgresql.conf
   # Change: listen_addresses = 'localhost' to listen_addresses = '*'
   ```

3. **Update pg_hba.conf:**
   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   # Add: host all all 0.0.0.0/0 md5
   ```

4. **Restart PostgreSQL:**
   ```bash
   sudo systemctl restart postgresql
   ```

5. **Configure firewall:**
   ```bash
   sudo ufw allow 5432/tcp
   ```

## Deployment Steps

### 1. Prepare Your Repository

Ensure your repository contains:
- ✅ `Dockerfile` (production-ready)
- ✅ `docker-compose.yml` (for local testing)
- ✅ `.dockerignore` (optimized build)
- ✅ `next.config.js` (with standalone output)
- ✅ All source code and dependencies

### 2. Database Setup

#### Option A: Use Coolify's PostgreSQL Service
1. In Coolify dashboard, create a new PostgreSQL service
2. Note down the connection details:
   - Host: `your-postgres-service`
   - Port: `5432`
   - Database: `timetracker`
   - Username: `timetracker`
   - Password: `your-secure-password`

#### Option B: Use External PostgreSQL
- Ensure your external PostgreSQL is accessible from Coolify
- Use the external connection string

### 3. Create Application in Coolify

1. **Create New Application**
   - Go to Coolify dashboard
   - Click "New Application"
   - Select "Docker" as deployment method

2. **Repository Configuration**
   - Connect your Git repository
   - Set branch to `main` (or your preferred branch)
   - Set build command: `npm run build`
   - Set start command: `node server.js`

3. **Environment Variables**
   Add the following environment variables:

   ```env
   # Database Configuration
   DATABASE_URL=postgresql://timetracker:your-secure-password@your-postgres-host:5432/timetracker?schema=public
   
   # Database Connection Details (for reference)
   DATABASE_HOST=your-postgres-host
   DATABASE_PORT=5432
   DATABASE_NAME=timetracker
   DATABASE_USER=timetracker
   DATABASE_PASSWORD=your-secure-password
   
   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   
   # NextAuth.js
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=your-super-secret-nextauth-key-change-in-production
   
   # App Configuration
   NODE_ENV=production
   
   # Email Configuration (Required for production)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@your-domain.com
   
   # App Settings
   APP_NAME=TimeTracker
   ```

   **Important Database Security Notes:**
   - Use strong, unique passwords for production
   - Consider using SSL connections: `?sslmode=require` in DATABASE_URL
   - Restrict database access to Coolify's IP range
   - Regularly rotate database passwords

4. **Port Configuration**
   - Set port to `3000`
   - Enable "Expose Application" if needed

### 4. Build and Deploy

1. **Trigger Build**
   - Click "Build" in Coolify dashboard
   - Monitor the build logs for any issues

2. **Database Migration**
   - After successful build, run database migrations:
   ```bash
   # Connect to your running container
   docker exec -it your-app-container sh
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed database (optional)
   npx prisma db seed
   ```

   **Alternative: Run migrations from Coolify dashboard**
   - In Coolify, go to your application
   - Click on "Terminal" or "Console"
   - Run the migration commands above

### 5. Domain and SSL

1. **Configure Domain**
   - Add your custom domain in Coolify
   - Update `NEXTAUTH_URL` to match your domain

2. **SSL Certificate**
   - Enable SSL in Coolify dashboard
   - Coolify will automatically provision Let's Encrypt certificates

### 6. Health Checks

Configure health check endpoint:
- Path: `/api/health`
- Port: `3000`
- Interval: `30s`
- Timeout: `10s`

### 7. Monitoring and Logs

1. **Application Logs**
   - Monitor logs in Coolify dashboard
   - Set up log aggregation if needed

2. **Database Monitoring**
   - Monitor PostgreSQL performance
   - Set up backups

## Local Testing with Docker

Before deploying to Coolify, test locally:

```bash
# Build and run with docker-compose
docker-compose up --build

# Access the application
open http://localhost:3000
```

## Production Checklist

- [ ] All environment variables are set
- [ ] Database migrations are applied
- [ ] SSL certificate is configured
- [ ] Health checks are working
- [ ] Email notifications are configured
- [ ] Backup strategy is in place
- [ ] Monitoring is set up

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Dockerfile syntax
   - Verify all dependencies are in package.json
   - Check .dockerignore excludes

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database is running
   - Verify PostgreSQL is listening on external interfaces
   - Check firewall settings for port 5432
   - Test connection: `psql -h your-host -p 5432 -U timetracker -d timetracker`

3. **Application Won't Start**
   - Check environment variables
   - Verify port configuration
   - Check application logs

4. **Email Not Working**
   - Verify SMTP configuration
   - Check firewall settings
   - Test SMTP credentials

### Debug Commands

```bash
# Check container logs
docker logs your-app-container

# Connect to running container
docker exec -it your-app-container sh

# Check database connection
npx prisma db pull

# Test email configuration
node -e "require('./src/lib/email').testEmailConfiguration()"

# PostgreSQL specific commands
psql -h your-host -p 5432 -U timetracker -d timetracker -c "SELECT 1;"
sudo systemctl status postgresql
sudo netstat -tlnp | grep 5432
```

### PostgreSQL Troubleshooting

#### Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if PostgreSQL is listening on external interfaces
sudo netstat -tlnp | grep 5432

# Test connection from application server
telnet your-postgres-host 5432

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### Configuration Issues
```bash
# Check PostgreSQL configuration
sudo cat /etc/postgresql/*/main/postgresql.conf | grep listen_addresses
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -E "(host|local)"

# Restart PostgreSQL after configuration changes
sudo systemctl restart postgresql
```

#### Permission Issues
```bash
# Connect as postgres user and check permissions
sudo -u postgres psql -c "\du"
sudo -u postgres psql -c "SELECT * FROM pg_database WHERE datname = 'timetracker';"
```

## Security Considerations

1. **Environment Variables**
   - Use strong, unique secrets
   - Rotate secrets regularly
   - Never commit secrets to repository

2. **Database Security**
   - Use strong database passwords
   - Restrict database access
   - Enable SSL for database connections

3. **Application Security**
   - Keep dependencies updated
   - Use HTTPS in production
   - Implement rate limiting

## Backup Strategy

1. **Database Backups**
   - Set up automated PostgreSQL backups
   - Test backup restoration

2. **Application Backups**
   - Version control all code
   - Document configuration changes

## Performance Optimization

1. **Database**
   - Add appropriate indexes
   - Monitor query performance
   - Consider read replicas for high traffic

2. **Application**
   - Enable Next.js optimizations
   - Use CDN for static assets
   - Implement caching strategies

## Support

For issues with:
- **Coolify**: Check Coolify documentation
- **Application**: Check application logs and this guide
- **Database**: Check PostgreSQL logs and configuration

## Updates and Maintenance

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Test updates in staging environment

2. **Monitoring**
   - Set up application monitoring
   - Monitor database performance
   - Track error rates and response times 