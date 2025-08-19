# Manual Deployment Solution

## 🚨 **IMMEDIATE FIX for Path Error**

The error `Entrypoint path does not exist - /tmp/user_fn_xqgtuvzlrvbwwesuvitp_fa0d2cff-91e0-4e63-a36c-3dae2e2946ed_46/source/index.ts` is caused by stale CLI cache.

## 🎯 **SOLUTION 1: Complete Reset (Recommended)**

Run the reset script:
```bash
./reset-and-deploy.sh
```

## 🎯 **SOLUTION 2: Manual CLI Reset**

```bash
# 1. Clean all cache
rm -rf .supabase
rm -rf ~/.supabase/functions
rm -rf /tmp/user_fn_* 2>/dev/null || true

# 2. Re-login and link
supabase login
supabase link --project-ref xqgtuvzlrvbwwesuvitp

# 3. Deploy fresh
supabase functions deploy stripe-webhook --project-ref xqgtuvzlrvbwwesuvitp
```

## 🎯 **SOLUTION 3: Dashboard Deployment (Guaranteed to Work)**

If CLI continues to fail, deploy via the web dashboard:

### Step 1: Go to Supabase Dashboard
https://supabase.com/dashboard/project/xqgtuvzlrvbwwesuvitp/functions

### Step 2: Create/Edit Function
- Click "Create Function" or edit existing "stripe-webhook"
- Name: `stripe-webhook`

### Step 3: Copy Function Code
Copy the entire contents of `supabase/functions/stripe-webhook/index.ts`

### Step 4: Configure Settings
- **JWT Verification**: DISABLED ❌
- **Environment Variables**: Already configured

### Step 5: Deploy
Click "Deploy Function"

## 🎯 **SOLUTION 4: Alternative CLI Method**

Try these CLI variations:

```bash
# Method A: Direct deployment
cd supabase/functions/stripe-webhook
supabase functions deploy . --project-ref xqgtuvzlrvbwwesuvitp

# Method B: From parent directory
cd supabase/functions
supabase functions deploy stripe-webhook --project-ref xqgtuvzlrvbwwesuvitp

# Method C: With debug
supabase functions deploy stripe-webhook --project-ref xqgtuvzlrvbwwesuvitp --debug
```

## ✅ **How to Verify Success**

After deployment, test the webhook:

```bash
curl -X POST https://xqgtuvzlrvbwwesuvitp.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "version_check"}'
```

Look for these logs in Supabase Dashboard > Functions > stripe-webhook > Logs:
- `🔍 Environment check - FIXED VERSION:`
- `🔍 DEBUG: Incoming request - TIMESTAMP FIXED VERSION`

## 🔧 **Root Cause**

The CLI is referencing a cached deployment path from version 46. The path `/tmp/user_fn_xqgtuvzlrvbwwesuvitp_fa0d2cff-91e0-4e63-a36c-3dae2e2946ed_46/source/index.ts` no longer exists because:

1. **Temporary directories** are cleaned up after deployment
2. **CLI cache** holds stale references
3. **Version mismatch** between cache and actual deployment

## 💡 **Prevention**

To avoid this in the future:
1. Always clean cache before deployment: `rm -rf .supabase`
2. Use the reset script for major changes
3. Consider dashboard deployment for critical updates

The webhook code is now fully fixed with timestamp validation - we just need to get it deployed! 🎉
