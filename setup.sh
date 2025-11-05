#!/bin/bash

echo "🚀 Setting up AI Chat Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20+ first.${NC}"
    exit 1
fi

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.11+ first.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🐍 Setting up Python virtual environment...${NC}"
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create virtual environment${NC}"
        exit 1
    fi
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install Python dependencies${NC}"
    exit 1
fi

deactivate
cd ..

echo ""
echo -e "${BLUE}⚙️  Setting up environment variables...${NC}"
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Created backend/.env from .env.example${NC}"
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}To start the application, run:${NC}"
echo -e "  ${GREEN}npm run dev${NC}       # Run both frontend and backend"
echo -e "  ${GREEN}npm run dev:web${NC}   # Run frontend only"
echo -e "  ${GREEN}npm run dev:backend${NC}  # Run backend only"
echo ""
echo -e "${BLUE}Access the application at:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs: ${GREEN}http://localhost:8000/api/docs${NC}"
echo ""
