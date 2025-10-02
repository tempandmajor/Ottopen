#!/bin/bash

# API Keys Setup Script for Ottopen
# This script helps you add environment variables to your deployment platform

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
echo -e "${BLUE}║        🔑 API Keys Setup - Ottopen                    ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Warning about exposed keys
echo -e "${RED}⚠️  IMPORTANT: Rotate Your Exposed Keys First!${NC}"
echo ""
echo "Before proceeding, you MUST rotate these keys:"
echo "  1. Anthropic: https://console.anthropic.com/settings/keys"
echo "  2. OpenAI: https://platform.openai.com/api-keys"
echo "  3. Perplexity: https://www.perplexity.ai/settings/api"
echo ""
read -p "Have you rotated all exposed keys? (yes/no): " rotated

if [[ ! "$rotated" =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}Please rotate your keys first, then run this script again.${NC}"
    echo "See HOW_TO_ADD_API_KEYS.md for instructions."
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Great! Let's add your new keys.${NC}"
echo ""

# Select platform
echo "Which platform are you deploying to?"
echo "  1) Vercel (recommended for Next.js)"
echo "  2) Netlify"
echo "  3) Railway"
echo "  4) Other / Manual setup"
echo ""
read -p "Enter choice (1-4): " platform

case $platform in
    1)
        echo ""
        echo -e "${BLUE}Setting up Vercel...${NC}"
        echo ""

        # Check if logged in
        if ! vercel whoami &>/dev/null; then
            echo "You're not logged in to Vercel."
            read -p "Login now? (yes/no): " login
            if [[ "$login" =~ ^[Yy][Ee][Ss]$ ]]; then
                vercel login
            else
                echo -e "${RED}Please run: vercel login${NC}"
                exit 1
            fi
        fi

        echo ""
        echo "Linking to Vercel project..."
        vercel link

        echo ""
        echo -e "${YELLOW}Now let's add your environment variables.${NC}"
        echo "You'll be prompted to enter each value."
        echo ""

        # Function to add env var
        add_env() {
            local key=$1
            local description=$2
            echo ""
            echo -e "${BLUE}$description${NC}"
            read -p "Enter $key: " -s value
            echo ""
            if [ -n "$value" ]; then
                vercel env add "$key" production <<< "$value"
                echo -e "${GREEN}✓ Added $key${NC}"
            else
                echo -e "${YELLOW}⊘ Skipped $key${NC}"
            fi
        }

        # Add required variables
        add_env "ANTHROPIC_API_KEY" "🤖 Anthropic API Key (NEW rotated key)"
        add_env "OPENAI_API_KEY" "🤖 OpenAI API Key (NEW rotated key)"
        add_env "PERPLEXITY_API_KEY" "🤖 Perplexity API Key (NEW rotated key)"

        echo ""
        read -p "Add Supabase keys? (yes/no): " add_supabase
        if [[ "$add_supabase" =~ ^[Yy][Ee][Ss]$ ]]; then
            add_env "NEXT_PUBLIC_SUPABASE_URL" "🗄️  Supabase URL (https://wkvatudgffosjfwqyxgt.supabase.co)"
            add_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "🗄️  Supabase Anon Key"
            add_env "SUPABASE_SERVICE_ROLE_KEY" "🗄️  Supabase Service Role Key"
        fi

        echo ""
        read -p "Add Stripe keys? (yes/no): " add_stripe
        if [[ "$add_stripe" =~ ^[Yy][Ee][Ss]$ ]]; then
            add_env "STRIPE_SECRET_KEY" "💳 Stripe Secret Key"
            add_env "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "💳 Stripe Publishable Key"
        fi

        echo ""
        read -p "Add app URL? (yes/no): " add_url
        if [[ "$add_url" =~ ^[Yy][Ee][Ss]$ ]]; then
            add_env "NEXT_PUBLIC_APP_URL" "🌐 App URL (e.g., https://ottopen.com)"
        fi

        echo ""
        echo -e "${GREEN}✓ Environment variables added!${NC}"
        echo ""
        read -p "Deploy to production now? (yes/no): " deploy
        if [[ "$deploy" =~ ^[Yy][Ee][Ss]$ ]]; then
            echo ""
            echo "Deploying to production..."
            vercel --prod
            echo ""
            echo -e "${GREEN}✓ Deployed!${NC}"
        else
            echo ""
            echo "To deploy later, run: vercel --prod"
        fi
        ;;

    2)
        echo ""
        echo -e "${BLUE}Setting up Netlify...${NC}"
        echo ""
        echo "1. Go to: https://app.netlify.com"
        echo "2. Select your Ottopen site"
        echo "3. Go to: Site settings → Environment variables"
        echo "4. Add each variable from the list below:"
        echo ""
        echo "   ANTHROPIC_API_KEY=<your NEW key>"
        echo "   OPENAI_API_KEY=<your NEW key>"
        echo "   PERPLEXITY_API_KEY=<your NEW key>"
        echo "   NEXT_PUBLIC_SUPABASE_URL=https://wkvatudgffosjfwqyxgt.supabase.co"
        echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your key>"
        echo "   SUPABASE_SERVICE_ROLE_KEY=<your key>"
        echo "   STRIPE_SECRET_KEY=<your key>"
        echo "   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your key>"
        echo "   NEXT_PUBLIC_APP_URL=https://ottopen.com"
        echo ""
        echo "5. Trigger a new deploy"
        echo ""
        echo "See HOW_TO_ADD_API_KEYS.md for detailed instructions."
        ;;

    3)
        echo ""
        echo -e "${BLUE}Setting up Railway...${NC}"
        echo ""
        echo "1. Go to: https://railway.app/dashboard"
        echo "2. Select your Ottopen project"
        echo "3. Click 'Variables' tab"
        echo "4. Add each variable:"
        echo ""
        echo "   ANTHROPIC_API_KEY"
        echo "   OPENAI_API_KEY"
        echo "   PERPLEXITY_API_KEY"
        echo "   ... (see HOW_TO_ADD_API_KEYS.md for full list)"
        echo ""
        echo "Railway will auto-deploy after you save."
        ;;

    4)
        echo ""
        echo -e "${BLUE}Manual Setup${NC}"
        echo ""
        echo "See HOW_TO_ADD_API_KEYS.md for instructions specific to your platform."
        echo ""
        echo "Quick reference - Required environment variables:"
        echo "  • ANTHROPIC_API_KEY (NEW rotated key)"
        echo "  • OPENAI_API_KEY (NEW rotated key)"
        echo "  • PERPLEXITY_API_KEY (NEW rotated key)"
        echo "  • NEXT_PUBLIC_SUPABASE_URL"
        echo "  • NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "  • SUPABASE_SERVICE_ROLE_KEY"
        echo "  • STRIPE_SECRET_KEY"
        echo "  • NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
        echo "  • NEXT_PUBLIC_APP_URL"
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║                    ✅ Done!                           ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. ✅ API keys added"
echo "  2. 📧 Apply email templates to Supabase"
echo "  3. 🧪 Test your deployment"
echo ""
echo "See PRODUCTION_READY_SUMMARY.md for complete checklist."
echo ""
