#!/bin/bash

# Apply Email Templates to Supabase - Interactive Helper Script
# This script helps you quickly copy templates to clipboard for pasting into Supabase Dashboard

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project info
PROJECT_ID="wkvatudgffosjfwqyxgt"
PROJECT_NAME="Ottopen"
TEMPLATES_DIR="supabase/email-templates"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║        📧 Supabase Email Templates - Copy Helper         ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Project: ${PROJECT_NAME} (${PROJECT_ID})${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "$TEMPLATES_DIR" ]; then
    echo -e "${RED}Error: Templates directory not found!${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Function to copy to clipboard
copy_to_clipboard() {
    local file=$1
    if command -v pbcopy &> /dev/null; then
        # macOS
        cat "$file" | pbcopy
        return 0
    elif command -v xclip &> /dev/null; then
        # Linux with xclip
        cat "$file" | xclip -selection clipboard
        return 0
    elif command -v xsel &> /dev/null; then
        # Linux with xsel
        cat "$file" | xsel --clipboard
        return 0
    else
        return 1
    fi
}

# Function to process template
process_template() {
    local template_name=$1
    local file_name=$2
    local subject=$3
    local dashboard_url=$4

    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📝 ${template_name}${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Subject Line:${NC}"
    echo "  $subject"
    echo ""

    if copy_to_clipboard "$TEMPLATES_DIR/$file_name"; then
        echo -e "${GREEN}✅ Template HTML copied to clipboard!${NC}"
        echo ""
        echo -e "${BLUE}Next Steps:${NC}"
        echo "  1. Open: $dashboard_url"
        echo "  2. Paste subject line: $subject"
        echo "  3. Paste template HTML (already in clipboard)"
        echo "  4. Click Save"
    else
        echo -e "${YELLOW}⚠️  Could not copy to clipboard automatically${NC}"
        echo ""
        echo -e "${BLUE}Manual Steps:${NC}"
        echo "  1. Open: $TEMPLATES_DIR/$file_name"
        echo "  2. Copy all content"
        echo "  3. Go to: $dashboard_url"
        echo "  4. Paste subject: $subject"
        echo "  5. Paste template HTML"
        echo "  6. Click Save"
    fi

    echo ""
    read -p "Press Enter when done, or 's' to skip... " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${GREEN}✓ Marked as complete${NC}"
    else
        echo -e "${YELLOW}⊘ Skipped${NC}"
    fi
}

# Main menu
echo "This helper will guide you through applying all 5 email templates."
echo ""
echo -e "${BLUE}Dashboard URL:${NC} https://app.supabase.com/project/${PROJECT_ID}/auth/templates"
echo ""
echo "Press Enter to start, or Ctrl+C to cancel..."
read

# Template 1: Confirm Signup
process_template \
    "Confirm Signup" \
    "confirm-signup.html" \
    "Confirm Your Email - Ottopen" \
    "https://app.supabase.com/project/${PROJECT_ID}/auth/templates"

# Template 2: Invite User
process_template \
    "Invite User" \
    "invite.html" \
    "You've Been Invited to Ottopen" \
    "https://app.supabase.com/project/${PROJECT_ID}/auth/templates"

# Template 3: Magic Link
process_template \
    "Magic Link" \
    "magic-link.html" \
    "Your Magic Link - Sign In to Ottopen" \
    "https://app.supabase.com/project/${PROJECT_ID}/auth/templates"

# Template 4: Email Change
process_template \
    "Change Email Address" \
    "email-change.html" \
    "Confirm Your Email Change - Ottopen" \
    "https://app.supabase.com/project/${PROJECT_ID}/auth/templates"

# Template 5: Recovery
process_template \
    "Reset Password" \
    "recovery.html" \
    "Reset Your Password - Ottopen" \
    "https://app.supabase.com/project/${PROJECT_ID}/auth/templates"

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║                    ✅ All Done!                           ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Test your templates by inviting a user"
echo "  2. Check your email to verify the design"
echo "  3. Test on mobile devices"
echo ""
echo -e "${BLUE}Test URL:${NC} https://app.supabase.com/project/${PROJECT_ID}/auth/users"
echo ""
echo -e "${GREEN}Thank you for using the template helper! 🎉${NC}"
echo ""
