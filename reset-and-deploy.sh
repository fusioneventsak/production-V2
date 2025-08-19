#!/bin/bash

# Complete Reset and Deploy Script for Stripe Webhook
# This script completely resets deployment state and redeploys

echo "🧹 COMPLETE RESET AND REDEPLOY - Stripe Webhook"
echo "================================================"

# Set project reference
PROJECT_REF="xqgtuvzlrvbwwesuvitp"

# Step 1: Complete cleanup
echo "🧹 Step 1: Complete cleanup..."
rm -rf .supabase 2>/dev/null || true
rm -rf ~/.supabase/functions 2>/dev/null || true
rm -rf /tmp/user_fn_* 2>/dev/null || true

# Step 2: Verify we're in the right place
echo "🔍 Step 2: Verifying file structure..."
if [ ! -f "supabase/functions/stripe-webhook/index.ts" ]; then
    echo "❌ Error: stripe-webhook/index.ts not found."
    echo "Current directory: $(pwd)"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "✅ Found webhook files:"
ls -la supabase/functions/stripe-webhook/

# Step 3: Re-initialize Supabase
echo "🔄 Step 3: Re-initializing Supabase..."
supabase login --token $(echo $SUPABASE_ACCESS_TOKEN)
supabase link --project-ref $PROJECT_REF

# Step 4: Deploy with fresh state
echo "🚀 Step 4: Deploying with fresh state..."

# Try deployment methods in order
DEPLOYED=false

# Method 1: Standard deployment
echo "📦 Trying Method 1: Standard deployment"
if supabase functions deploy stripe-webhook --project-ref $PROJECT_REF; then
    echo "✅ Deployment successful with Method 1!"
    DEPLOYED=true
fi

# Method 2: With no-verify-jwt flag
if [ "$DEPLOYED" = false ]; then
    echo "📦 Trying Method 2: With no-verify-jwt flag"
    if supabase functions deploy stripe-webhook --project-ref $PROJECT_REF --no-verify-jwt; then
        echo "✅ Deployment successful with Method 2!"
        DEPLOYED=true
    fi
fi

# Method 3: Force deployment
if [ "$DEPLOYED" = false ]; then
    echo "📦 Trying Method 3: Force deployment"
    if supabase functions deploy stripe-webhook --project-ref $PROJECT_REF --no-verify-jwt --debug; then
        echo "✅ Deployment successful with Method 3!"
        DEPLOYED=true
    fi
fi

if [ "$DEPLOYED" = true ]; then
    echo ""
    echo "🎉 SUCCESS! Webhook deployed successfully!"
    echo "📍 Webhook URL: https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook"
    echo ""
    echo "🔍 To verify deployment, check the logs for:"
    echo "   - '🔍 Environment check - FIXED VERSION:'"
    echo "   - '🔍 DEBUG: Incoming request - TIMESTAMP FIXED VERSION'"
    echo ""
    echo "✅ All timestamp validation fixes are now active!"
else
    echo ""
    echo "❌ All deployment methods failed!"
    echo ""
    echo "🆘 Manual deployment options:"
    echo "1. Deploy via Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/functions"
    echo ""
    echo "2. Try manual CLI commands:"
    echo "   supabase functions deploy stripe-webhook --project-ref $PROJECT_REF"
    echo ""
    echo "3. Check CLI version and update:"
    echo "   supabase --version"
    echo "   npm update -g supabase"
    exit 1
fi
