#!/bin/bash

# Deployment Testing Script for Ottopen

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║        🧪 Ottopen Deployment Test Suite              ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get production URL
echo -e "${YELLOW}Enter your production URL (e.g., https://ottopen.vercel.app):${NC}"
read -p "URL: " PROD_URL

if [ -z "$PROD_URL" ]; then
    echo -e "${RED}Error: URL is required${NC}"
    exit 1
fi

# Remove trailing slash
PROD_URL="${PROD_URL%/}"

echo ""
echo -e "${BLUE}Testing deployment at: $PROD_URL${NC}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test 1: Health Check${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$PROD_URL/api/health")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)

if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "  Response: $HEALTH_BODY"
else
    echo -e "${RED}✗ Health check failed (HTTP $HEALTH_CODE)${NC}"
    echo "  Response: $HEALTH_BODY"
fi
echo ""

# Test 2: Homepage
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test 2: Homepage${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

HOME_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL")

if [ "$HOME_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Homepage loads (HTTP $HOME_CODE)${NC}"
else
    echo -e "${RED}✗ Homepage failed (HTTP $HOME_CODE)${NC}"
fi
echo ""

# Test 3: Security Headers
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test 3: Security Headers${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

HEADERS=$(curl -s -I "$PROD_URL")

check_header() {
    local header=$1
    if echo "$HEADERS" | grep -qi "$header"; then
        echo -e "${GREEN}✓ $header present${NC}"
    else
        echo -e "${RED}✗ $header missing${NC}"
    fi
}

check_header "x-frame-options"
check_header "x-content-type-options"
check_header "x-xss-protection"
check_header "referrer-policy"
echo ""

# Test 4: API Routes
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test 4: API Routes${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test auth status endpoint
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/auth/status")

if [ "$AUTH_CODE" = "200" ] || [ "$AUTH_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Auth API responding (HTTP $AUTH_CODE)${NC}"
else
    echo -e "${RED}✗ Auth API error (HTTP $AUTH_CODE)${NC}"
fi
echo ""

# Test 5: Static Assets
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test 5: Static Assets${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

ICON_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/icon")

if [ "$ICON_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Icon/favicon loads (HTTP $ICON_CODE)${NC}"
else
    echo -e "${YELLOW}⚠  Icon endpoint returned HTTP $ICON_CODE${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║                   📊 Test Summary                     ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$HEALTH_CODE" = "200" ] && [ "$HOME_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Deployment is live and responding!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test AI features in browser"
    echo "  2. Sign in and try AI Brainstorm"
    echo "  3. Apply email templates to Supabase"
    echo ""
    echo "Manual tests needed:"
    echo "  • AI Brainstorm (requires authentication)"
    echo "  • AI Expand"
    echo "  • AI Rewrite"
    echo "  • Sign up flow"
    echo "  • Password reset"
else
    echo -e "${RED}⚠️  Deployment has issues${NC}"
    echo ""
    echo "Check Vercel logs:"
    echo "  vercel logs --follow"
    echo ""
    echo "Or visit Vercel dashboard:"
    echo "  https://vercel.com/dashboard"
fi
echo ""

# Test AI endpoint (will fail without auth, but shows if route exists)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Bonus: AI Endpoint Check (expect 401)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

AI_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  "$PROD_URL/api/ai/brainstorm")

AI_BODY=$(echo "$AI_RESPONSE" | head -n -1)
AI_CODE=$(echo "$AI_RESPONSE" | tail -n 1)

if [ "$AI_CODE" = "401" ]; then
    echo -e "${GREEN}✓ AI endpoint exists (returns 401 unauthorized as expected)${NC}"
    echo "  This means the API route is working!"
elif [ "$AI_CODE" = "200" ]; then
    echo -e "${YELLOW}⚠️  AI endpoint returned 200 (unexpected without auth)${NC}"
else
    echo -e "${RED}✗ AI endpoint error (HTTP $AI_CODE)${NC}"
    echo "  Response: $AI_BODY"
fi
echo ""

echo -e "${BLUE}For full AI testing, you need to:${NC}"
echo "  1. Visit $PROD_URL"
echo "  2. Sign in with your account"
echo "  3. Go to Editor → Try AI features"
echo ""
