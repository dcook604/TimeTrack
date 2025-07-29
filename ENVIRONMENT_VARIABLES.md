# Timetracker Environment Variables Guide

## Required Environment Variables for Coolify Deployment

### Essential Database Variables
```
POSTGRES_DB=timetracker
POSTGRES_USER=timetracker
POSTGRES_PASSWORD=your-secure-password-change-this
DATABASE_URL=postgresql://timetracker:your-secure-password-change-this@postgres:5432/timetracker?schema=public
```

### Essential Application Variables
```
NODE_ENV=production
APP_NAME=TimeTracker
DOMAIN=time.spectrum4.ca
NEXTAUTH_URL=https://time.spectrum4.ca
```

### Security & Authentication Variables
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production-use-long-random-string
NEXTAUTH_SECRET=your-super-secret-nextauth-key-change-in-production
```

### Email Configuration Variables (Required for Production)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@time.spectrum4.ca
```

### SSL Certificate Configuration (for Traefik)
```
ACME_EMAIL=your-email@example.com
```

### Optional Development Variables
```
LOCAL_DOMAIN=localhost
LOCAL_TRAEFIK_DOMAIN=timetracker.localhost
TRAEFIK_DOMAIN=traefik.localhost
NEXT_PUBLIC_TEMPO=false
```

## Coolify Configuration Steps

### 1. In Coolify Dashboard - Environment Variables Section
Add all the required variables above with your actual values:

1. **Database Configuration:**
   - `POSTGRES_DB=timetracker`
   - `POSTGRES_USER=timetracker` 
   - `POSTGRES_PASSWORD=your-secure-password-change-this`
   - `DATABASE_URL=postgresql://timetracker:your-secure-password-change-this@postgres:5432/timetracker?schema=public`

2. **Application Configuration:**
   - `NODE_ENV=production`
   - `APP_NAME=TimeTracker`
   - `DOMAIN=time.spectrum4.ca`
   - `NEXTAUTH_URL=https://time.spectrum4.ca`

3. **Security Configuration:**
   - `JWT_SECRET=your-super-secret-jwt-key-change-in-production-use-long-random-string`
   - `NEXTAUTH_SECRET=your-super-secret-nextauth-key-change-in-production`

4. **Email Configuration:**
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_SECURE=false`
   - `SMTP_USER=your-email@gmail.com`
   - `SMTP_PASS=your-app-specific-password`
   - `SMTP_FROM=noreply@time.spectrum4.ca`

5. **SSL Configuration:**
   - `ACME_EMAIL=your-email@example.com`

### 2. Variables with Default Values
These variables have defaults in docker-compose.yml and are optional:
- `NODE_ENV` (defaults to `production`)
- `APP_NAME` (defaults to `TimeTracker`)
- `SMTP_SECURE` (defaults to `false`)
- `LOCAL_DOMAIN` (defaults to `localhost`)
- `LOCAL_TRAEFIK_DOMAIN` (defaults to `timetracker.localhost`)
- `TRAEFIK_DOMAIN` (defaults to `traefik.localhost`)

## Security Notes

1. **JWT_SECRET**: Should be a strong, random string (32+ characters)
2. **DATABASE_URL**: Should include proper credentials and match other DB variables
3. **SMTP_PASS**: Use app-specific passwords, not your main password
4. **POSTGRES_PASSWORD**: Use a strong, unique password for production

## Testing the Configuration

After updating the environment variables in Coolify:
1. Redeploy the application in Coolify
2. Clear browser cache and cookies
3. Check application logs for any missing environment variable errors
4. Try logging in with the demo credentials