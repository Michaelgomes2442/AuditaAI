#!/bin/bash

# AuditaAI Pilot Demo - Quick Start Script
# This script starts both backend and frontend for live demos

set -e

echo "🚀 AuditaAI Pilot Demo - Quick Start"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend directory exists
if [ ! -d "/home/michaelgomes/AuditaAI/backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "/home/michaelgomes/AuditaAI/frontend" ]; then
    echo "❌ Frontend directory not found!"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Services stopped"
    exit 0
}

trap cleanup INT TERM

echo "${BLUE}📦 Step 1: Installing Dependencies${NC}"
echo "-----------------------------------"

# Install backend dependencies if needed
if [ ! -d "/home/michaelgomes/AuditaAI/backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd /home/michaelgomes/AuditaAI/backend
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

# Install frontend dependencies if needed
if [ ! -d "/home/michaelgomes/AuditaAI/frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd /home/michaelgomes/AuditaAI/frontend
    pnpm install
else
    echo "✅ Frontend dependencies already installed"
fi

echo ""
echo "${BLUE}🔧 Step 2: Starting Backend${NC}"
echo "----------------------------"

cd /home/michaelgomes/AuditaAI/backend
npm start > /tmp/auditai-backend.log 2>&1 &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "${GREEN}✅ Backend running on http://localhost:3001${NC}"
else
    echo "${YELLOW}⚠️  Backend may need more time to start${NC}"
fi

echo ""
echo "${BLUE}🎨 Step 3: Starting Frontend${NC}"
echo "-----------------------------"

cd /home/michaelgomes/AuditaAI/frontend
pnpm dev > /tmp/auditai-frontend.log 2>&1 &
FRONTEND_PID=$!

echo "⏳ Waiting for frontend to start..."
sleep 5

echo ""
echo "${GREEN}============================================${NC}"
echo "${GREEN}✨ AuditaAI Pilot Demo is Ready!${NC}"
echo "${GREEN}============================================${NC}"
echo ""
echo "📍 Access Points:"
echo "   - Pilot Demo:    ${BLUE}http://localhost:3000/pilot${NC}"
echo "   - Landing Page:  ${BLUE}http://localhost:3000/pilot-info${NC}"
echo "   - Dashboard:     ${BLUE}http://localhost:3000${NC}"
echo "   - Backend API:   ${BLUE}http://localhost:3001${NC}"
echo ""
echo "🎬 Demo Instructions:"
echo "   1. Open ${BLUE}http://localhost:3000/pilot${NC} in your browser"
echo "   2. Click 'Start Live Demo' button"
echo "   3. Watch real-time CRIES updates"
echo "   4. Click 'Run Test' to simulate governance analysis"
echo "   5. Switch tabs to explore different views"
echo ""
echo "📋 Logs:"
echo "   - Backend:  tail -f /tmp/auditai-backend.log"
echo "   - Frontend: tail -f /tmp/auditai-frontend.log"
echo ""
echo "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running
wait
