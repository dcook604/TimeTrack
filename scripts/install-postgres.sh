#!/bin/bash

# PostgreSQL Installation Script for Coolify Deployment
echo "🐘 Installing PostgreSQL for Timetracker..."

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

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            echo "ubuntu"
        elif command -v yum &> /dev/null; then
            echo "centos"
        elif command -v dnf &> /dev/null; then
            echo "fedora"
        else
            echo "unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)

echo "🖥️  Detected OS: $OS"

# Install PostgreSQL based on OS
install_postgres() {
    case $OS in
        "ubuntu")
            print_status "Installing PostgreSQL on Ubuntu..."
            sudo apt-get update
            sudo apt-get install -y postgresql postgresql-contrib
            sudo systemctl enable postgresql
            sudo systemctl start postgresql
            ;;
        "centos")
            print_status "Installing PostgreSQL on CentOS..."
            sudo yum install -y postgresql postgresql-server postgresql-contrib
            sudo postgresql-setup initdb
            sudo systemctl enable postgresql
            sudo systemctl start postgresql
            ;;
        "fedora")
            print_status "Installing PostgreSQL on Fedora..."
            sudo dnf install -y postgresql postgresql-server postgresql-contrib
            sudo postgresql-setup initdb
            sudo systemctl enable postgresql
            sudo systemctl start postgresql
            ;;
        "macos")
            print_status "Installing PostgreSQL on macOS..."
            if command -v brew &> /dev/null; then
                brew install postgresql
                brew services start postgresql
            else
                print_error "Homebrew is not installed. Please install Homebrew first:"
                echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                exit 1
            fi
            ;;
        *)
            print_error "Unsupported operating system: $OS"
            echo ""
            echo "Please install PostgreSQL manually:"
            echo "Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
            echo "CentOS/RHEL: sudo yum install postgresql postgresql-server"
            echo "Fedora: sudo dnf install postgresql postgresql-server"
            echo "macOS: brew install postgresql"
            echo "Windows: Download from https://www.postgresql.org/download/"
            exit 1
            ;;
    esac
}

# Check if PostgreSQL is already installed
if command -v psql &> /dev/null; then
    print_status "PostgreSQL is already installed"
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    echo "Version: $PSQL_VERSION"
else
    print_warning "PostgreSQL is not installed. Installing now..."
    install_postgres
fi

# Verify installation
if command -v psql &> /dev/null; then
    print_status "PostgreSQL installation successful"
else
    print_error "PostgreSQL installation failed"
    exit 1
fi

# Check if PostgreSQL service is running
if pg_isready -q; then
    print_status "PostgreSQL service is running"
else
    print_warning "PostgreSQL service is not running. Starting service..."
    case $OS in
        "ubuntu"|"centos"|"fedora")
            sudo systemctl start postgresql
            ;;
        "macos")
            brew services start postgresql
            ;;
    esac
    
    # Wait a moment for service to start
    sleep 3
    
    if pg_isready -q; then
        print_status "PostgreSQL service started successfully"
    else
        print_error "Failed to start PostgreSQL service"
        exit 1
    fi
fi

# Configure PostgreSQL for external connections (for Coolify)
configure_postgres() {
    print_status "Configuring PostgreSQL for external connections..."
    
    # Get PostgreSQL configuration directory
    PG_CONF_DIR=""
    case $OS in
        "ubuntu"|"centos"|"fedora")
            PG_CONF_DIR="/etc/postgresql/*/main"
            if [ ! -d "$PG_CONF_DIR" ]; then
                PG_CONF_DIR="/var/lib/pgsql/data"
            fi
            ;;
        "macos")
            PG_CONF_DIR="/usr/local/var/postgres"
            ;;
    esac
    
    if [ -n "$PG_CONF_DIR" ] && [ -d "$PG_CONF_DIR" ]; then
        # Backup original configuration
        sudo cp "$PG_CONF_DIR/postgresql.conf" "$PG_CONF_DIR/postgresql.conf.backup"
        sudo cp "$PG_CONF_DIR/pg_hba.conf" "$PG_CONF_DIR/pg_hba.conf.backup"
        
        # Update postgresql.conf to listen on all interfaces
        sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF_DIR/postgresql.conf"
        
        # Update pg_hba.conf to allow connections from Coolify
        echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a "$PG_CONF_DIR/pg_hba.conf"
        echo "host    all             all             ::/0                    md5" | sudo tee -a "$PG_CONF_DIR/pg_hba.conf"
        
        # Restart PostgreSQL to apply changes
        case $OS in
            "ubuntu"|"centos"|"fedora")
                sudo systemctl restart postgresql
                ;;
            "macos")
                brew services restart postgresql
                ;;
        esac
        
        print_status "PostgreSQL configured for external connections"
    else
        print_warning "Could not find PostgreSQL configuration directory"
        print_warning "You may need to manually configure PostgreSQL for external connections"
    fi
}

# Configure PostgreSQL
configure_postgres

echo ""
print_status "PostgreSQL installation and configuration completed!"
echo ""
echo "Next steps:"
echo "1. Run './scripts/setup-postgres.sh' to create database and user"
echo "2. Configure your firewall to allow PostgreSQL connections (port 5432)"
echo "3. Update your Coolify environment variables with the database connection details"
echo ""
echo "For Coolify deployment:"
echo "- Ensure port 5432 is accessible from Coolify"
echo "- Use strong passwords for production"
echo "- Consider using SSL for database connections" 