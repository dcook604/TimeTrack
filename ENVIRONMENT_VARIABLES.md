# Timetracker Environment Variables Guide

## Required Environment Variables for Production

### Essential Variables (Already Configured)
- `JWT_SECRET` - Secret key for JWT token signing
- `DATABASE_URL` - PostgreSQL database connection string
- `NEXTAUTH_URL` - Base URL of your application

### Missing Variables (Add to Coolify)

#### 1. Node Environment
```
NODE_ENV=production
```

#### 2. Email Configuration (Optional but Recommended)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@timetracker.com
```

#### 3. Development Tools (Optional)
```
NEXT_PUBLIC_TEMPO=false
```

## Recommended Coolify Configuration

### Remove These Variables (Not Needed):
- `NEXTAUTH_SECRET` - Your app doesn't use NextAuth, only custom JWT

### Add These Variables:
1. `NODE_ENV=production`
2. `SMTP_HOST=smtp.gmail.com` (or your email provider)
3. `SMTP_PORT=587`
4. `SMTP_SECURE=false`
5. `SMTP_USER=your-email@gmail.com`
6. `SMTP_PASS=your-app-password`
7. `SMTP_FROM=noreply@timetracker.com`

## Environment Variable Priority

The application uses these fallbacks:
- `JWT_SECRET` defaults to `'your-secret-key'` if not set
- `SMTP_HOST` defaults to `'localhost'` if not set
- `SMTP_PORT` defaults to `587` if not set
- `SMTP_SECURE` defaults to `false` if not set
- `SMTP_FROM` defaults to `'noreply@timetracker.com'` if not set

## Security Notes

1. **JWT_SECRET**: Should be a strong, random string (32+ characters)
2. **DATABASE_URL**: Should include proper credentials
3. **SMTP_PASS**: Use app-specific passwords, not your main password
4. **NEXTAUTH_SECRET**: Can be removed as you're not using NextAuth

## Testing the Configuration

After updating the environment variables:
1. Redeploy the application in Coolify
2. Clear browser cache and cookies
3. Try logging in with the demo credentials