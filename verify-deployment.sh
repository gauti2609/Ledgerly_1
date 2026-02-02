#!/bin/bash

# Docker Deployment Verification Script
# This script checks if all required files and configurations are in place

echo "=========================================="
echo "FinAutomate Docker Deployment Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_count=0
pass_count=0

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    check_count=$((check_count + 1))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description: $file"
        pass_count=$((pass_count + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $description: $file ${RED}(MISSING)${NC}"
        return 1
    fi
}

# Function to check file is not empty
check_file_not_empty() {
    local file=$1
    local description=$2
    check_count=$((check_count + 1))
    
    if [ -f "$file" ] && [ -s "$file" ]; then
        local size=$(wc -l < "$file")
        echo -e "${GREEN}✓${NC} $description: $file (${size} lines)"
        pass_count=$((pass_count + 1))
        return 0
    elif [ -f "$file" ]; then
        echo -e "${RED}✗${NC} $description: $file ${RED}(EMPTY FILE)${NC}"
        return 1
    else
        echo -e "${RED}✗${NC} $description: $file ${RED}(MISSING)${NC}"
        return 1
    fi
}

# Function to check directory exists
check_directory() {
    local dir=$1
    local description=$2
    check_count=$((check_count + 1))
    
    if [ -d "$dir" ]; then
        local count=$(find "$dir" -type f | wc -l)
        echo -e "${GREEN}✓${NC} $description: $dir (${count} files)"
        pass_count=$((pass_count + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $description: $dir ${RED}(MISSING)${NC}"
        return 1
    fi
}

echo "Checking Docker Configuration Files..."
echo "--------------------------------------"
check_file_not_empty "docker-compose.yml" "Docker Compose config"
check_file_not_empty "frontend.Dockerfile" "Frontend Dockerfile"
check_file_not_empty "nginx.conf" "Nginx configuration"
check_file_not_empty "backend/Dockerfile" "Backend Dockerfile"
check_file ".dockerignore" "Root .dockerignore"
check_file "backend/.dockerignore" "Backend .dockerignore"
echo ""

echo "Checking Environment Configuration..."
echo "--------------------------------------"
check_file ".env.example" "Environment template"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Environment file: .env ${GREEN}(EXISTS)${NC}"
    pass_count=$((pass_count + 1))
    
    # Check for required environment variables
    if grep -q "API_KEY=" .env && ! grep -q "API_KEY=your-google-gemini-api-key-here" .env; then
        echo -e "  ${GREEN}✓${NC} API_KEY is configured"
    else
        echo -e "  ${YELLOW}⚠${NC} API_KEY needs to be configured in .env"
    fi
    
    if grep -q "JWT_SECRET=" .env && ! grep -q "JWT_SECRET=your-super-secret-jwt-key-change-this" .env; then
        echo -e "  ${GREEN}✓${NC} JWT_SECRET is configured"
    else
        echo -e "  ${YELLOW}⚠${NC} JWT_SECRET needs to be configured in .env"
    fi
else
    echo -e "${YELLOW}⚠${NC} Environment file: .env ${YELLOW}(NOT CREATED YET)${NC}"
    echo -e "  ${YELLOW}→${NC} Run: cp .env.example .env"
fi
check_count=$((check_count + 1))
echo ""

echo "Checking Backend Implementation..."
echo "--------------------------------------"
check_file_not_empty "backend/package.json" "Backend package.json"
check_file_not_empty "backend/tsconfig.json" "TypeScript config"
check_file_not_empty "backend/nest-cli.json" "NestJS CLI config"
check_file_not_empty "backend/prisma/schema.prisma" "Prisma schema"
check_directory "backend/src/auth" "Auth module"
check_directory "backend/src/users" "Users module"
check_directory "backend/src/financial-entity" "Financial Entity module"
check_directory "backend/src/prisma" "Prisma module"
check_directory "backend/src/ai" "AI module"
check_file_not_empty "backend/src/app.module.ts" "App module"
check_file_not_empty "backend/src/main.ts" "Main entry point"
echo ""

echo "Checking Frontend Files..."
echo "--------------------------------------"
check_file_not_empty "package.json" "Frontend package.json"
check_file_not_empty "vite.config.ts" "Vite config"
check_file_not_empty "tsconfig.json" "TypeScript config"
check_file_not_empty "index.html" "HTML entry point"
check_directory "components" "Components directory"
check_directory "pages" "Pages directory"
echo ""

echo "Checking Documentation..."
echo "--------------------------------------"
check_file_not_empty "README.md" "README"
check_file_not_empty "DEPLOYMENT.md" "Deployment guide"
check_file_not_empty "PROGRESS.md" "Progress tracker"
check_file "FIXES_SUMMARY.md" "Fixes summary"
echo ""

echo "Checking Docker Installation..."
echo "--------------------------------------"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed: $(docker --version)"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗${NC} Docker is not installed ${RED}(REQUIRED)${NC}"
    echo -e "  ${YELLOW}→${NC} Install from: https://www.docker.com/products/docker-desktop/"
fi
check_count=$((check_count + 1))

if command -v docker-compose &> /dev/null || docker compose version &> /dev/null 2>&1; then
    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker Compose is installed: $(docker-compose --version)"
    else
        echo -e "${GREEN}✓${NC} Docker Compose is installed: $(docker compose version)"
    fi
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗${NC} Docker Compose is not installed ${RED}(REQUIRED)${NC}"
    echo -e "  ${YELLOW}→${NC} Usually comes with Docker Desktop"
fi
check_count=$((check_count + 1))
echo ""

# Summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "Checks Passed: ${GREEN}${pass_count}${NC}/${check_count}"
echo ""

if [ $pass_count -eq $check_count ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You are ready to deploy. Run:"
    echo "  1. Ensure .env is configured with your API keys"
    echo "  2. docker-compose up --build -d"
    echo "  3. docker-compose exec api npx prisma migrate dev --name init"
    echo "  4. Open http://localhost:8080 in your browser"
elif [ $pass_count -ge $((check_count * 3 / 4)) ]; then
    echo -e "${YELLOW}⚠ Most checks passed, but review warnings above${NC}"
    echo ""
    echo "Action items:"
    if [ ! -f ".env" ]; then
        echo "  1. Create .env file: cp .env.example .env"
        echo "  2. Configure API_KEY and JWT_SECRET in .env"
    fi
    if ! command -v docker &> /dev/null; then
        echo "  3. Install Docker from https://www.docker.com/products/docker-desktop/"
    fi
else
    echo -e "${RED}✗ Several checks failed${NC}"
    echo ""
    echo "Please review the failed checks above and ensure all required"
    echo "files are present before attempting deployment."
fi
echo ""
echo "For detailed deployment instructions, see DEPLOYMENT.md"
echo "=========================================="
