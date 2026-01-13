#!/bin/bash

# ============================================================
# JURAGITESHOLIDAY - QUICK START SCRIPT
# ============================================================

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Juragitesholiday Setup ===${NC}\n"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}Node.js not found. Please install Node.js 18+${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

# Install dependencies
echo -e "\n${BLUE}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check .env.local
if [ ! -f .env.local ]; then
  echo -e "\n${YELLOW}⚠ .env.local not found${NC}"
  echo "Copy .env.example to .env.local and fill in your Supabase credentials:"
  echo "  cp .env.example .env.local"
  echo ""
  echo "Then update with:"
  echo "  NEXT_PUBLIC_SUPABASE_URL=your_url"
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key"
  echo "  SUPABASE_SERVICE_KEY=your_service_key"
fi

# Show startup info
echo -e "\n${BLUE}=== Next Steps ===${NC}"
echo "1. Configure Supabase:"
echo "   - Create a new project at supabase.com"
echo "   - Run SQL scripts from supabase/ folder"
echo "   - Set up storage bucket 'property-photos'"
echo ""
echo "2. Set environment variables in .env.local"
echo ""
echo "3. Start development server:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "4. Admin access: Press Ctrl+Shift+A on homepage"
echo ""
echo -e "${GREEN}Setup complete! Happy coding! 🚀${NC}\n"
