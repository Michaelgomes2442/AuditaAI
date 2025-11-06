#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# AuditaAI vΩ-Enterprise - Production Startup Script
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════════════════"
echo "🚀 AuditaAI vΩ-Enterprise - Production Startup"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Environment Check
echo -e "${BLUE}[1/6]${NC} Checking environment..."
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
    echo -e "${YELLOW}⚠️  NODE_ENV not set, defaulting to: production${NC}"
else
    echo -e "${GREEN}✅${NC} NODE_ENV: $NODE_ENV"
fi

# Check backend URL
if [ -z "$NEXT_PUBLIC_BACKEND_URL" ]; then
    export NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_BACKEND_URL not set, defaulting to: http://localhost:3001${NC}"
else
    echo -e "${GREEN}✅${NC} NEXT_PUBLIC_BACKEND_URL: $NEXT_PUBLIC_BACKEND_URL"
fi

# Step 2: Health Check
echo ""
echo -e "${BLUE}[2/6]${NC} Running governance health check..."
cd /home/michaelgomes/AuditaAI/backend
node src/governance-health-check.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed - aborting startup${NC}"
    exit 1
fi

# Step 3: Database Check
echo ""
echo -e "${BLUE}[3/6]${NC} Checking database connection..."
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set - using SQLite fallback${NC}"
else
    echo -e "${GREEN}✅${NC} Database configured"
fi

# Step 4: Install Dependencies
echo ""
echo -e "${BLUE}[4/6]${NC} Installing dependencies..."
cd /home/michaelgomes/AuditaAI/backend
pnpm install --prod

cd /home/michaelgomes/AuditaAI/frontend
pnpm install --prod

echo -e "${GREEN}✅${NC} Dependencies installed"

# Step 5: Build Frontend
echo ""
echo -e "${BLUE}[5/6]${NC} Building frontend..."
cd /home/michaelgomes/AuditaAI/frontend
pnpm build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Step 6: Start Services
echo ""
echo -e "${BLUE}[6/6]${NC} Starting services..."
echo ""

# Start backend
echo -e "${GREEN}🔧 Starting backend server (port 3001)...${NC}"
cd /home/michaelgomes/AuditaAI/backend
pnpm start &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    exit 1
fi

# Start frontend
echo ""
echo -e "${GREEN}🌐 Starting frontend server (port 3000)...${NC}"
cd /home/michaelgomes/AuditaAI/frontend
pnpm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to be ready
echo "Waiting for frontend to start..."
sleep 3

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ AuditaAI vΩ-Enterprise is running!${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo "Lab-Pilot: http://localhost:3000/pilot"
echo ""
echo "Governance: vΩ-Enterprise (Frontier + Lite)"
echo "CRIES Target: Frontier +15-20%, Lite +8-12%"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Save PIDs for cleanup
echo $BACKEND_PID > /tmp/audita-backend.pid
echo $FRONTEND_PID > /tmp/audita-frontend.pid

# Wait for user interrupt
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f /tmp/audita-backend.pid /tmp/audita-frontend.pid; echo 'Services stopped'; exit 0" INT TERM

# Keep script running
wait
