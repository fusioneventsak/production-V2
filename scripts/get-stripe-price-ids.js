/**
 * Get Stripe Price IDs Helper Script
 * 
 * This script helps you retrieve your actual Stripe price IDs to update
 * the webhook configuration.
 * 
 * Usage:
 * 1. Set your STRIPE_SECRET_KEY environment variable
 * 2. Run: node scripts/get-stripe-price-ids.js
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Please set STRIPE_SECRET_KEY environment variable');
  console.log('Example: STRIPE_SECRET_KEY=sk_live_... node scripts/get-stripe-price-ids.js');
  process.exit(1);
}

async function getStripePrices() {
  try {
    console.log('🔍 Fetching Stripe prices...\n');

    const response = await fetch('https://api.stripe.com/v1/prices?limit=100&active=true', {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Stripe-Version': '2024-06-20'
      }
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📋 Active Stripe Prices:\n');
    console.log('Price ID'.padEnd(35), '| Product'.padEnd(25), '| Amount'.padEnd(10), '| Currency | Interval');
    console.log('-'.repeat(35), '|', '-'.repeat(23), '|', '-'.repeat(8), '|', '-'.repeat(8), '|', '-'.repeat(10));

    for (const price of data.data) {
      const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A';
      const interval = price.recurring?.interval || 'one-time';
      const productId = typeof price.product === 'string' ? price.product : price.product?.name || 'N/A';
      
      console.log(
        price.id.padEnd(35),
        '|',
        productId.substring(0, 23).padEnd(23),
        '|',
        amount.padEnd(8),
        '|',
        price.currency.padEnd(8),
        '|',
        interval
      );
    }

    console.log('\n🎯 PhotoSphere Subscription Mapping:');
    console.log('Copy these price IDs to your webhook configuration:\n');

    // Try to identify PhotoSphere plans by amount
    const photoSpherePrices = data.data.filter(price => {
      const amount = price.unit_amount / 100;
      return price.recurring && (amount === 45 || amount === 99 || amount === 499);
    });

    if (photoSpherePrices.length > 0) {
      console.log('const PRICE_TO_TIER_MAP = {');
      
      photoSpherePrices.forEach(price => {
        const amount = price.unit_amount / 100;
        let tier = 'unknown';
        
        if (amount === 45) tier = 'starter';
        else if (amount === 99) tier = 'pro';
        else if (amount === 499) tier = 'enterprise';
        
        console.log(`  '${price.id}': '${tier}', // $${amount}/${price.recurring.interval}`);
      });
      
      console.log('};');
    } else {
      console.log('⚠️  Could not automatically identify PhotoSphere subscription prices.');
      console.log('Please manually map your price IDs based on the table above.');
      console.log('\nExample mapping:');
      console.log('const PRICE_TO_TIER_MAP = {');
      console.log("  'price_your_starter_id': 'starter',   // $45/month");
      console.log("  'price_your_pro_id': 'pro',           // $99/month");
      console.log("  'price_your_enterprise_id': 'enterprise' // $499/month");
      console.log('};');
    }

    console.log('\n📝 Next Steps:');
    console.log('1. Update the PRICE_TO_TIER_MAP in your webhook function');
    console.log('2. Deploy the updated webhook');
    console.log('3. Test with a subscription event');

  } catch (error) {
    console.error('❌ Error fetching Stripe prices:', error.message);
    process.exit(1);
  }
}

// Also fetch products for better context
async function getStripeProducts() {
  try {
    const response = await fetch('https://api.stripe.com/v1/products?limit=100&active=true', {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Stripe-Version': '2024-06-20'
      }
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('\n📦 Active Stripe Products:\n');
    console.log('Product ID'.padEnd(35), '| Name'.padEnd(30), '| Description');
    console.log('-'.repeat(35), '|', '-'.repeat(28), '|', '-'.repeat(20));

    for (const product of data.data) {
      console.log(
        product.id.padEnd(35),
        '|',
        (product.name || 'N/A').substring(0, 28).padEnd(28),
        '|',
        (product.description || 'N/A').substring(0, 50)
      );
    }

  } catch (error) {
    console.error('❌ Error fetching Stripe products:', error.message);
  }
}

// Run both functions
async function main() {
  await getStripeProducts();
  await getStripePrices();
}

main();
