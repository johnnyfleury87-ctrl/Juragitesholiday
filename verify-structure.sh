#!/bin/bash
# Deployment Checklist for Juragitesholiday V1

echo "========================================"
echo "Juragitesholiday - Final Checklist"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $1 (MISSING)"
    ((FAIL++))
  fi
}

echo "=== Core Files ==="
check_file "package.json"
check_file "next.config.js"
check_file "tsconfig.json"
check_file ".env.example"
check_file ".eslintrc.json"

echo ""
echo "=== Database ==="
check_file "supabase/schema.sql"
check_file "supabase/seed.sql"
check_file "supabase/storage_rules.md"

echo ""
echo "=== Application Pages ==="
check_file "app/layout.js"
check_file "app/page.js"
check_file "app/login/page.js"
check_file "app/signup/page.js"
check_file "app/logements/page.js"
check_file "app/logements/[slug]/page.js"

echo ""
echo "=== Client Pages ==="
check_file "app/app/page.js"
check_file "app/app/reservations/page.js"
check_file "app/app/reservations/[id]/page.js"
check_file "app/app/profile/page.js"

echo ""
echo "=== Admin Pages ==="
check_file "app/admin/login/page.js"
check_file "app/admin/page.js"
check_file "app/admin/logements/page.js"
check_file "app/admin/logements/new/page.js"
check_file "app/admin/logements/[id]/page.js"
check_file "app/admin/reservations/page.js"
check_file "app/admin/reservations/[id]/page.js"

echo ""
echo "=== Libraries & Utilities ==="
check_file "lib/supabase/client.js"
check_file "lib/supabase/server.js"
check_file "lib/supabase/auth.js"
check_file "lib/guards.js"
check_file "components/shared.js"

echo ""
echo "=== Styling ==="
check_file "app/globals.css"

echo ""
echo "=== Documentation ==="
check_file "README.md"
check_file "DEPLOY.md"
check_file "SPECIFICATIONS.md"
check_file "IMPLEMENTATION_NOTES.js"

echo ""
echo "========================================"
echo "Total: ${GREEN}$PASS✓${NC} ${RED}$FAIL✗${NC}"
echo "========================================"

if [ $FAIL -eq 0 ]; then
  echo -e "\n${GREEN}✓ All files present!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Set up Supabase project"
  echo "2. Run schema.sql"
  echo "3. Run seed.sql"
  echo "4. Create storage bucket"
  echo "5. Configure .env.local"
  echo "6. npm install"
  echo "7. npm run dev"
  echo ""
  exit 0
else
  echo -e "\n${RED}✗ Some files are missing!${NC}"
  exit 1
fi
