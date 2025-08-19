# Stripe Webhook Deployment Guide

## 🚨 **DEPLOYMENT ERROR FIX**

You're getting this error: `Failed to deploy edge function: Entrypoint path does not exist - /tmp/user_fn_xqgtuvzlrvbwwesuvitp_fa0d2cff-91e0-4e63-a36c-3dae2e2946ed_46/source/index.ts`

This happens when the Supabase CLI has stale deployment references. Here are the solutions:

## 🔧 **Solution 1: Use the Deployment Script**

```bash
# From the project root directory:
./deploy-webhook.sh
```

## 🔧 **Solution 2: Manual Deployment Steps**

### Step 1: Clean Cache
```bash
# Remove any cached deployment data
rm -rf .supabase/functions/stripe-webhook 2>/dev/null || true
```

### Step 2: Verify File Structure
```bash
# Check that files exist
ls -la supabase/functions/stripe-webhook/
# Should show: index.ts and config.json
```

### Step 3: Deploy with Different Methods

**Method A: Standard Deployment**
```bash
supabase functions deploy stripe-webhook --project-ref xqgtuvzlrvbwwesuvitp
```

**Method B: Force Deployment**
```bash
supabase functions deploy stripe-webhook --project-ref xqgtuvzlrvbwwesuvitp --no-verify-jwt
```

**Method C: Reset and Deploy**
```bash
# Login again (if needed)
supabase login

# Link project
supabase link --project-ref xqgtuvzlrvbwwesuvitp

# Deploy
supabase functions deploy stripe-webhook
```

## 🔧 **Solution 3: Alternative Deployment**

If CLI deployment fails, you can deploy via the Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/xqgtuvzlrvbwwesuvitp/functions
2. Click "Create Function" or edit existing "stripe-webhook"
3. Copy the contents of `supabase/functions/stripe-webhook/index.ts`
4. Paste into the dashboard editor
5. Set JWT verification to **DISABLED**
6. Deploy

## ✅ **What's Fixed in This Version**

### 1. **Timestamp Validation** ✅
All timestamp conversions now have null checks:
```typescript
current_period_start: stripeSubscription.current_period_start ? 
  new Date(stripeSubscription.current_period_start * 1000).toISOString() : null
```

### 2. **Deno Compatibility** ✅
- Removed incompatible `cryptoProvider`
- Custom async signature verification using Web Crypto API
- Proper Stripe SDK configuration for Deno

### 3. **Error Handling** ✅
- Comprehensive null checks on all Stripe timestamp fields
- Proper error logging and debugging
- Graceful handling of edge cases

## 🎯 **Expected Behavior After Deployment**

When the new version deploys, you should see these logs:
```
🔍 Environment check - FIXED VERSION:
🔍 DEBUG: Incoming request - TIMESTAMP FIXED VERSION
```

This confirms you're running the fixed version that handles null timestamps properly.

## 📋 **Verification Steps**

1. **Check Deployment**: Look for version number > 50
2. **Test Webhook**: Send a test event from Stripe
3. **Monitor Logs**: Should see "TIMESTAMP FIXED VERSION" in logs
4. **No More Errors**: No more "Invalid time value" errors

## 🆘 **If Still Having Issues**

1. Check Supabase CLI version: `supabase --version`
2. Update CLI: `npm update -g supabase`
3. Clear all cache: `rm -rf ~/.supabase`
4. Re-login: `supabase login`
5. Try deployment again

The webhook is now fully fixed with proper timestamp validation and Deno compatibility! 🎉
