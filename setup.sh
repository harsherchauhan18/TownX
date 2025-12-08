#!/bin/bash
# 🚀 PLACE RECOMMENDER AGENT - DEPLOYMENT SCRIPT
# This script helps set up and deploy the Place Recommender system

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Place Recommender Agent - Setup & Deployment Script         ║"
echo "║   TownX Project - Complete Implementation                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check Node.js installation
echo ""
echo "Checking prerequisites..."
echo ""

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo "Please install Node.js 16+ from https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v)
    print_status "Node.js installed: $NODE_VERSION"
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
else
    NPM_VERSION=$(npm -v)
    print_status "npm installed: $NPM_VERSION"
fi

echo ""
echo "═════════════════════════════════════════════════════════════════"
echo "Step 1: Backend Setup"
echo "═════════════════════════════════════════════════════════════════"
echo ""

if [ -d "backend" ]; then
    print_status "Backend directory found"
    
    # Check if .env exists
    if [ -f "backend/.env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to update GROQ_API_KEY? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter your Groq API key: " GROQ_KEY
            if grep -q "GROQ_API_KEY" backend/.env; then
                # Update existing key
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    sed -i '' "s/^GROQ_API_KEY=.*/GROQ_API_KEY=$GROQ_KEY/" backend/.env
                else
                    sed -i "s/^GROQ_API_KEY=.*/GROQ_API_KEY=$GROQ_KEY/" backend/.env
                fi
                print_status "GROQ_API_KEY updated"
            else
                echo "GROQ_API_KEY=$GROQ_KEY" >> backend/.env
                print_status "GROQ_API_KEY added"
            fi
        fi
    else
        print_warning ".env file not found"
        read -p "Enter your Groq API key: " GROQ_KEY
        echo "GROQ_API_KEY=$GROQ_KEY" > backend/.env
        if [ -n "$MONGO_URI" ]; then
            echo "MONGO_URI=$MONGO_URI" >> backend/.env
        fi
        print_status ".env file created"
    fi
    
    print_info "Installing backend dependencies..."
    cd backend
    npm install > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        print_status "Backend dependencies installed"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    
    cd ..
else
    print_error "Backend directory not found"
    exit 1
fi

echo ""
echo "═════════════════════════════════════════════════════════════════"
echo "Step 2: Frontend Setup"
echo "═════════════════════════════════════════════════════════════════"
echo ""

if [ -d "frontend" ]; then
    print_status "Frontend directory found"
    
    print_info "Installing frontend dependencies..."
    cd frontend
    npm install > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        print_status "Frontend dependencies installed"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    
    cd ..
else
    print_error "Frontend directory not found"
    exit 1
fi

echo ""
echo "═════════════════════════════════════════════════════════════════"
echo "Step 3: Verification"
echo "═════════════════════════════════════════════════════════════════"
echo ""

# Check created files
FILES_TO_CHECK=(
    "backend/src/openstreetmap/agent-commonjs.js"
    "frontend/src/components/MapModal.jsx"
    "frontend/pages/RecommenderPage.jsx"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        print_status "File exists: $file"
    else
        print_error "File missing: $file"
    fi
done

echo ""
echo "═════════════════════════════════════════════════════════════════"
echo "✅ Setup Complete!"
echo "═════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend server:"
echo "   ${BLUE}cd backend && npm run dev${NC}"
echo ""
echo "2. In another terminal, start the frontend:"
echo "   ${BLUE}cd frontend && npm run dev${NC}"
echo ""
echo "3. Open your browser and navigate to:"
echo "   ${BLUE}http://localhost:5173/recommender${NC}"
echo ""
echo "4. Try a test query:"
echo "   ${BLUE}\"Find cafes nearby\"${NC}"
echo ""
echo "═════════════════════════════════════════════════════════════════"
echo "Documentation:"
echo "═════════════════════════════════════════════════════════════════"
echo ""
echo "- Read AGENT_QUICKSTART.md for quick start guide"
echo "- Read AGENT_SYSTEM_README.md for detailed documentation"
echo "- Read API_REFERENCE_TROUBLESHOOTING.md for API & debugging"
echo "- Read ARCHITECTURE.md for system architecture"
echo ""
echo "═════════════════════════════════════════════════════════════════"
echo "Status: ✅ READY FOR TESTING"
echo "═════════════════════════════════════════════════════════════════"
echo ""
