#!/bin/bash

# PostgreSQL Setup Script for Coolify Deployment
echo "🐘 Setting up PostgreSQL for Timetracker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL first."
    echo ""
    echo "Installation instructions:"
    echo "Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "CentOS/RHEL: sudo yum install postgresql postgresql-server"
    echo "macOS: brew install postgresql"
    echo "Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

print_status "PostgreSQL is installed"

# Check if PostgreSQL service is running
if ! pg_isready -q; then
    print_error "PostgreSQL service is not running. Please start PostgreSQL service."
    echo ""
    echo "Start PostgreSQL service:"
    echo "Ubuntu/Debian: sudo systemctl start postgresql"
    echo "CentOS/RHEL: sudo systemctl start postgresql"
    echo "macOS: brew services start postgresql"
    exit 1
fi

print_status "PostgreSQL service is running"

# Get database configuration from environment variables or use defaults
DB_NAME=${DATABASE_NAME:-timetracker}
DB_USER=${DATABASE_USER:-timetracker}
DB_PASSWORD=${DATABASE_PASSWORD:-timetracker123}
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}

echo "📊 Database Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"

# Create database and user
echo "🔧 Creating database and user..."

# Connect as postgres user and create database/user
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;

-- Connect to the database and grant schema privileges
\c $DB_NAME;
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

\q
EOF

if [ $? -eq 0 ]; then
    print_status "Database and user created successfully"
else
    print_error "Failed to create database and user"
    exit 1
fi

# Test database connection
echo "🧪 Testing database connection..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "Database connection successful"
else
    print_error "Database connection failed"
    echo "Please check your database configuration and try again."
    exit 1
fi

# Create .env file with database URL
echo "📝 Creating .env file with database configuration..."
cat > .env << EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-nextauth-key-change-in-production"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# App Configuration
NODE_ENV="production"

# Email Configuration (for local development - using console logging)
SMTP_HOST="localhost"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@timetracker.local"

# App Settings
APP_NAME="TimeTracker"
EOF

print_status ".env file created with database configuration"

echo ""
print_status "PostgreSQL setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run db:migrate' to apply database migrations"
echo "2. Run 'npm run db:seed' to populate with sample data"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:3000 to access the application"
echo ""
echo "For Coolify deployment:"
echo "1. Use the DATABASE_URL from the .env file in your Coolify environment variables"
echo "2. Ensure your PostgreSQL instance is accessible from Coolify"
echo "3. Follow the deployment guide in DEPLOYMENT.md" 