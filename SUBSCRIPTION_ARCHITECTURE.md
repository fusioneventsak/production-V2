# PhotoSphere Simplified Subscription Architecture

## Overview

This document outlines the simplified subscription flow implemented for PhotoSphere, following the pattern:

**User clicks subscribe → CreateSession function → Stripe Checkout → Payment success → Webhook handles everything → Database updated**

## Architecture Components

### 1. Frontend Components

#### SimpleSubscriptionPlans (`/src/components/subscription/SimpleSubscriptionPlans.tsx`)
- Modern, responsive subscription plans page
- Handles plan selection and redirects to Stripe Checkout
- Shows current subscription status
- Includes 14-day free trial messaging

#### SubscriptionSuccess (`/src/components/subscription/SubscriptionSuccess.tsx`)
- Handles return from Stripe Checkout
- Automatically retries fetching subscription data (webhook processing)
- Shows success/cancellation states
- Provides navigation back to dashboard

#### SubscriptionService (`/src/services/subscriptionService.ts`)
- Centralized service for subscription operations
- Handles authentication tokens automatically
- Provides methods for checkout and portal redirects
- Includes plan validation and configuration

### 2. Backend Functions

#### create-checkout-session (`/supabase/functions/create-checkout-session/index.ts`)
- Creates Stripe Checkout sessions
- Handles user authentication
- Creates/retrieves Stripe products and prices
- Redirects to success page after payment

#### create-portal-session (`/supabase/functions/create-portal-session/index.ts`)
- Creates Stripe Customer Portal sessions
- Allows users to manage billing and subscriptions
- Requires existing subscription

#### stripe-webhook (`/supabase/functions/stripe-webhook/index.ts`)
- Handles all Stripe webhook events
- Processes subscription lifecycle events
- Updates database automatically
- Includes customer discovery and creation
- Comprehensive fallback processing

### 3. Routes

```
/dashboard/subscription     - Subscription plans page
/subscription/success       - Success/cancellation handler
```

## Subscription Flow

### 1. User Subscription Process

1. **User visits** `/dashboard/subscription` or clicks upgrade from profile
2. **Selects plan** and clicks "Start Free Trial"
3. **Frontend calls** `subscriptionService.redirectToCheckout(planId)`
4. **Service calls** `create-checkout-session` function
5. **User redirected** to Stripe Checkout
6. **User completes** payment on Stripe
7. **Stripe redirects** to `/subscription/success?success=true`
8. **Success page** automatically retries fetching subscription data
9. **Webhook processes** subscription creation in background
10. **Database updated** with subscription details

### 2. Webhook Processing

When Stripe sends webhook events:

1. **Webhook receives** event (e.g., `checkout.session.completed`)
2. **Verifies signature** using custom Deno-compatible verification
3. **Processes event** based on type:
   - `checkout.session.completed`: Creates customer and subscription
   - `customer.subscription.updated`: Updates subscription status
   - `customer.subscription.deleted`: Cancels subscription
4. **Updates database** tables:
   - `profiles`: User subscription info and credits
   - `customers`: Stripe customer mapping
   - `subscriptions`: Detailed subscription records
   - `subscription_features`: Feature access control

### 3. Subscription Management

Users can manage subscriptions through:
- **Stripe Customer Portal**: Full billing management
- **Profile page**: Basic subscription info and portal access
- **Subscription page**: Plan comparison and upgrades

## Database Schema

### Profiles Table
```sql
- subscription_id: Stripe subscription ID
- subscription_tier: 'starter', 'pro', 'enterprise'
- subscription_status: 'active', 'canceled', 'past_due', etc.
- subscription_expiry: Next billing date
- credits_remaining: Available credits
- max_photospheres: Usage limits
- max_photos: Usage limits
```

### Subscriptions Table
```sql
- user_id: Link to profiles
- stripe_subscription_id: Stripe reference
- stripe_customer_id: Stripe customer reference
- price_id: Stripe price ID
- status: Current status
- tier: Plan tier
- current_period_start/end: Billing period
```

## Benefits of This Architecture

### ✅ Simplified
- Fewer moving parts
- Single source of truth (webhook)
- Reduced complexity

### ✅ Reliable
- Webhook handles all database updates
- Automatic customer discovery
- Comprehensive error handling
- Fallback processing

### ✅ Maintainable
- Clear separation of concerns
- Centralized subscription logic
- Easy to debug and monitor

### ✅ Scalable
- Handles high volume
- Efficient database operations
- Proper error recovery

## Environment Variables Required

```bash
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Deployment Checklist

- [ ] Deploy `create-checkout-session` function
- [ ] Deploy `create-portal-session` function  
- [ ] Ensure `stripe-webhook` is deployed and active
- [ ] Configure Stripe webhook endpoint
- [ ] Test subscription flow end-to-end
- [ ] Verify webhook processing
- [ ] Test customer portal access

## Removed Components

The following components were removed as part of the simplification:
- `stripe-customer-handler` function (redundant)
- Complex subscription store logic (replaced with simple service)
- Direct customer management (handled by webhook)

## Testing

1. **Subscription Creation**: Test complete flow from plan selection to success
2. **Webhook Processing**: Verify events are processed correctly
3. **Customer Portal**: Test billing management access
4. **Error Handling**: Test failed payments and cancellations
5. **Database Updates**: Verify all tables are updated correctly

This architecture provides a robust, maintainable subscription system that leverages Stripe's capabilities while maintaining simplicity and reliability.
