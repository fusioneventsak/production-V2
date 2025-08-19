#!/bin/bash

# Stripe Webhook Deployment Script - FIXED VERSION
# This script helps deploy the webhook function cleanly

echo "🚀 Deploying Stripe Webhook Function - TIMESTAMP FIXES..."

# Check if we're in the right directory
if [ ! -f "supabase/functions/stripe-webhook/index.ts" ]; then
    echo "❌ Error: stripe-webhook/index.ts not found."
    echo "Please run this script from the project root directory."
    exit 1
fi

# Set project reference
PROJECT_REF="xqgtuvzlrvbwwesuvitp"

echo "📁 Current directory: $(pwd)"
echo "🔍 Checking function files..."
ls -la supabase/functions/stripe-webhook/

# Clean any potential cached deployment data
echo "🧹 Cleaning deployment cache..."
rm -rf .supabase/functions/stripe-webhook 2>/dev/null || true

# Try alternative deployment methods
echo "🚀 Attempting deployment..."

# Method 1: Standard deployment
echo "📦 Method 1: Standard deployment"
supabase functions deploy stripe-webhook --project-ref $PROJECT_REF

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful with Method 1!"
    exit 0
fi

# Method 2: Force deployment with no-verify-jwt
echo "📦 Method 2: Force deployment"
supabase functions deploy stripe-webhook --project-ref $PROJECT_REF --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful with Method 2!"
    exit 0
fi

echo "❌ All deployment methods failed!"
echo "💡 Try deploying manually with: supabase functions deploy stripe-webhook --project-ref xqgtuvzlrvbwwesuvitp"
exit 1
