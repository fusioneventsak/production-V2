#!/usr/bin/env node

/**
 * Test Invoice Payment Succeeded Event
 * 
 * This script specifically tests the invoice.payment_succeeded webhook event
 */

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

async function testInvoicePaymentSucceeded() {
  console.log('🧪 Testing invoice.payment_succeeded Event\n');

  try {
    // Step 1: Create a test customer
    console.log('1️⃣ Creating test customer...');
    const customer = await stripe.customers.create({
      email: 'invoice-test@photosphere.com',
      name: 'Invoice Test User',
      metadata: { test: 'invoice_payment_test' }
    });
    console.log(`✅ Created customer: ${customer.id}`);

    // Step 2: Create a subscription (this will generate an invoice)
    console.log('\n2️⃣ Creating subscription (will trigger invoice.payment_succeeded)...');
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: 'price_1RrOhKHF5unOiVE9rYGrAfAZ', // Pro plan
      }],
      metadata: { test: 'invoice_payment_test' }
    });
    
    console.log(`✅ Created subscription: ${subscription.id}`);
    console.log(`📊 Status: ${subscription.status}`);
    console.log(`🎯 Price ID: ${subscription.items.data[0].price.id}`);

    // Step 3: Get the latest invoice for this subscription
    console.log('\n3️⃣ Retrieving latest invoice...');
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      subscription: subscription.id,
      limit: 1
    });

    if (invoices.data.length > 0) {
      const invoice = invoices.data[0];
      console.log(`✅ Found invoice: ${invoice.id}`);
      console.log(`💰 Amount: $${(invoice.amount_paid / 100).toFixed(2)}`);
      console.log(`📊 Status: ${invoice.status}`);
      console.log(`🔗 Subscription: ${invoice.subscription}`);
      
      // If the invoice is already paid, this would have triggered the webhook
      if (invoice.status === 'paid') {
        console.log('\n🎯 This invoice payment should have triggered:');
        console.log('   📡 invoice.payment_succeeded webhook event');
        console.log('   🔄 handleInvoicePaymentSucceeded() function');
        console.log('   📊 Database updates for subscription renewal');
      }
    } else {
      console.log('⚠️ No invoices found for this subscription');
    }

    // Step 4: Simulate a manual invoice payment (if needed)
    console.log('\n4️⃣ Expected Webhook Event:');
    console.log('📡 Your webhook should receive: invoice.payment_succeeded');
    console.log('🔍 Event data should include:');
    console.log(`   - invoice.id: ${invoices.data[0]?.id || 'inv_xxx'}`);
    console.log(`   - invoice.subscription: ${subscription.id}`);
    console.log(`   - invoice.customer: ${customer.id}`);
    console.log(`   - invoice.amount_paid: ${invoices.data[0]?.amount_paid || 0}`);

    console.log('\n🔍 Expected Database Updates:');
    console.log('   - profiles: subscription_status updated, credits refreshed');
    console.log('   - subscriptions: current_period_end updated');
    console.log('   - subscription_features: features maintained for tier');

    return {
      customerId: customer.id,
      subscriptionId: subscription.id,
      invoiceId: invoices.data[0]?.id,
      customerEmail: customer.email
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

async function cleanupTestData(customerId) {
  try {
    console.log('\n🧹 Cleaning up test data...');
    await stripe.customers.del(customerId);
    console.log('✅ Deleted test customer and associated data');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
    console.log('Set it with: export STRIPE_SECRET_KEY=sk_test_...');
    process.exit(1);
  }

  try {
    const testData = await testInvoicePaymentSucceeded();
    
    console.log('\n⏳ Waiting 10 seconds for webhook processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('\n🔍 Check your webhook logs for:');
    console.log('   ✅ "💰 Invoice payment succeeded: inv_xxx"');
    console.log('   ✅ "🔄 Processing invoice.payment_succeeded: inv_xxx"');
    console.log('   ✅ "✅ Successfully processed invoice payment for subscription sub_xxx"');
    console.log('   ❌ If you see "Unhandled event type invoice.payment_succeeded", there\'s an issue');
    
    console.log('\n❓ Cleanup test data? (y/n)');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', async (key) => {
      const input = key.toString().trim().toLowerCase();
      if (input === 'y') {
        await cleanupTestData(testData.customerId);
        process.exit(0);
      } else if (input === 'n') {
        console.log('🔄 Test data preserved for manual inspection');
        console.log(`Customer ID: ${testData.customerId}`);
        console.log(`Subscription ID: ${testData.subscriptionId}`);
        console.log(`Invoice ID: ${testData.invoiceId}`);
        process.exit(0);
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testInvoicePaymentSucceeded, cleanupTestData };