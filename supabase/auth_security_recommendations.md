# Supabase Auth Security Recommendations

This document addresses the remaining Auth security warnings in the Supabase Security Advisor.

## 1. OTP Expiry Time Warning

**Warning**: OTP expiry time exceeds recommended threshold (>1 hour)

**Recommendation**: Reduce the OTP (One-Time Password) expiry time to 1 hour or less.

### How to Fix:

1. Navigate to the Supabase Dashboard
2. Go to Authentication → Settings → Email
3. Find the "Email OTP Expiry" setting
4. Change the value to 3600 (1 hour in seconds) or less
5. Save changes

**Security Benefit**: Shorter OTP expiry times reduce the window of opportunity for attackers to use intercepted or leaked OTP codes.

## 2. Leaked Password Protection Warning

**Warning**: Leaked password protection is disabled in Supabase Auth

**Recommendation**: Enable leaked password protection to prevent users from using known compromised passwords.

### How to Fix:

1. Navigate to the Supabase Dashboard
2. Go to Authentication → Settings → Security
3. Find the "Leaked Password Protection" toggle
4. Enable the toggle
5. Save changes

**Security Benefit**: This feature checks passwords against known data breaches and prevents users from using compromised passwords, significantly reducing the risk of credential stuffing attacks.

## Implementation Notes

- These settings can only be changed through the Supabase Dashboard UI, not via SQL scripts
- Changes take effect immediately and apply to all new authentication attempts
- Existing sessions are not affected by these changes
- No application code changes are required after implementing these recommendations

## Verification

After implementing these changes, run the Supabase Security Advisor again to verify that the warnings have been resolved.
