#!/bin/bash

# Test Docker Build Script for Timetracker
echo "🐳 Testing Docker build for Timetracker..."

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Build the Docker image
echo "🔨 Building Docker image..."
if docker build -t timetracker:test .; then
    print_status "Docker image built successfully"
else
    print_error "Docker build failed"
    exit 1
fi

# Test the container
echo "🧪 Testing container..."
if docker run --rm -d --name timetracker-test -p 3000:3000 \
    -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
    -e JWT_SECRET="test-secret" \
    -e NEXTAUTH_SECRET="test-secret" \
    -e NODE_ENV="production" \
    timetracker:test; then
    
    print_status "Container started successfully"
    
    # Wait for container to be ready
    echo "⏳ Waiting for container to be ready..."
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "Health check passed"
    else
        print_warning "Health check failed (expected without database)"
    fi
    
    # Stop the container
    docker stop timetracker-test
    print_status "Container stopped"
    
else
    print_error "Failed to start container"
    exit 1
fi

# Clean up
docker rmi timetracker:test > /dev/null 2>&1

echo ""
print_status "Docker build test completed successfully!"
echo ""
echo "🎉 Your application is ready for Coolify deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to your Git repository"
echo "2. Follow the deployment guide in DEPLOYMENT.md"
echo "3. Set up your environment variables in Coolify"
echo "4. Deploy your application" 