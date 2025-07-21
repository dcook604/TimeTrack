#!/bin/bash

# TimeTracker Database Setup Script
echo "🚀 Setting up TimeTracker database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql"
    echo "   Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL service is not running. Please start PostgreSQL service."
    echo "   Ubuntu/Debian: sudo systemctl start postgresql"
    echo "   macOS: brew services start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is installed and running"

# Create database and user
echo "📊 Creating database and user..."

# Connect as postgres user and create database/user
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'timetracker') THEN
        CREATE USER timetracker WITH PASSWORD 'timetracker123';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE timetracker OWNER timetracker'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'timetracker')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE timetracker TO timetracker;
ALTER USER timetracker CREATEDB;

\q
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database and user created successfully"
else
    echo "❌ Failed to create database and user"
    exit 1
fi

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
cd "$(dirname "$0")/.."
npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo "✅ Prisma migrations completed"
else
    echo "❌ Prisma migrations failed"
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated"
else
    echo "❌ Prisma client generation failed"
    exit 1
fi

echo "🎉 Database setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run seed' to populate with sample data"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000 to access the application"