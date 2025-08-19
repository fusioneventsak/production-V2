#!/bin/bash

# Apply Security Fixes for Supabase Views
# This script applies the migration to fix security definer views

echo "Applying security fixes for Supabase views..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Apply the migration
echo "Applying migration: 20250818_fix_security_definer_views.sql"
supabase db push

# Verify the changes
echo "Verifying changes..."
supabase db execute < test_security_invoker_views.sql

echo "Security fixes applied successfully!"
echo "The following views have been fixed:"
echo "- subscription_analytics"
echo "- stripe_subscription_details"
echo "- active_subscriptions_with_profiles"
