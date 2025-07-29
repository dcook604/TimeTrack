#!/bin/bash

# Traefik Configuration Fix Script
# This script helps clean up malformed Traefik routing rules

echo "🔍 Checking Traefik configuration issues..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Current Docker containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${YELLOW}🔍 Looking for Traefik containers...${NC}"
TRAEFIK_CONTAINERS=$(docker ps -q --filter "name=traefik")

if [ -z "$TRAEFIK_CONTAINERS" ]; then
    echo -e "${RED}❌ No Traefik containers found running${NC}"
    echo -e "${YELLOW}💡 This might be managed by Coolify or another system${NC}"
else
    echo -e "${GREEN}✅ Found Traefik containers: $TRAEFIK_CONTAINERS${NC}"
fi

echo -e "\n${YELLOW}🔍 Checking for containers with time.spectrum4.ca domain...${NC}"
TIME_CONTAINERS=$(docker ps --filter "label=traefik.http.routers" --format "{{.Names}}" | grep -E "(time|spectrum)")

if [ ! -z "$TIME_CONTAINERS" ]; then
    echo -e "${YELLOW}📦 Found containers with time.spectrum4.ca configuration:${NC}"
    echo "$TIME_CONTAINERS"
    
    echo -e "\n${YELLOW}🔧 Would you like to restart these containers? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}🔄 Restarting containers...${NC}"
        echo "$TIME_CONTAINERS" | xargs docker restart
        echo -e "${GREEN}✅ Containers restarted${NC}"
    fi
fi

echo -e "\n${YELLOW}🔍 Checking Traefik logs for routing errors...${NC}"
if [ ! -z "$TRAEFIK_CONTAINERS" ]; then
    echo "$TRAEFIK_CONTAINERS" | while read container; do
        echo -e "${YELLOW}📋 Recent errors from container $container:${NC}"
        docker logs "$container" --since 1h 2>&1 | grep -E "(ERR|error)" | tail -10
    done
else
    echo -e "${YELLOW}💡 To check Coolify Traefik logs, run:${NC}"
    echo "   docker logs \$(docker ps -q --filter 'name=coolify-proxy' --filter 'name=traefik')"
fi

echo -e "\n${GREEN}🛠️  Recommended fixes:${NC}"
echo -e "${YELLOW}1. Check Coolify Dashboard:${NC}"
echo "   - Go to your applications"
echo "   - Check domain configuration"
echo "   - Ensure Host field contains: time.spectrum4.ca"
echo "   - Ensure Path field contains: / (not the domain)"

echo -e "\n${YELLOW}2. Fix malformed routing rules:${NC}"
echo "   Current (broken): Host(\`\`) && PathPrefix(\`time.spectrum4.ca\`)"
echo "   Should be: Host(\`time.spectrum4.ca\`) && PathPrefix(\`/\`)"

echo -e "\n${YELLOW}3. Clean up ACME challenges:${NC}"
echo "   - Check that time.spectrum4.ca DNS points to your server"
echo "   - Ensure port 80 is accessible for HTTP challenges"

echo -e "\n${YELLOW}4. Remove duplicate routers:${NC}"
echo "   - Check for multiple applications with same router names"
echo "   - Remove or rename conflicting applications"

echo -e "\n${GREEN}✅ Script completed. Check the recommendations above.${NC}"