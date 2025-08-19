import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('🔍 Auth header received:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.error('❌ No authorization header found');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    // Log environment variables (without exposing secrets)
    console.log('🔧 Environment check:');
    console.log('- SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
    console.log('- SUPABASE_ANON_KEY exists:', !!Deno.env.get('SUPABASE_ANON_KEY'));

    // Create Supabase client for JWT verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    );

    console.log('🔐 Attempting to get user from JWT token...');
    
    // Extract the JWT token from the Authorization header
    const jwt = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token directly
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    
    if (userError) {
      console.error('❌ User authentication error:', userError);
      return new Response(JSON.stringify({ 
        error: 'Invalid user token', 
        details: userError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    if (!user) {
      console.error('❌ No user found in token');
      return new Response(JSON.stringify({ error: 'Invalid user token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    console.log('✅ User authenticated successfully:', user.email);

    // Parse the request body
    const { planType, priceId } = await req.json();
    if (!planType) {
      return new Response(JSON.stringify({ error: 'Missing plan type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    console.log(`📦 Creating checkout session for plan: ${planType}, user: ${user.email}`);
    // Note: priceId from frontend is optional, we'll use our own price mapping

    // Define plan configurations
    const planConfigs = {
      starter: {
        name: 'Starter Plan',
        price: 4500, // $45.00
        features: ['5 PhotoSpheres', 'Virtual PhotoBooth', 'PhotoSphere Display', 'Moderation tools', 'Up to 200 photos displayed']
      },
      pro: {
        name: 'Pro Plan',
        price: 9900, // $99.00
        features: ['Everything in Starter', 'Advanced camera animations', 'Built-in video recording', '20 PhotoSpheres', 'Up to 500 photos displayed', 'Priority support']
      },
      'one-time': {
        name: 'One-Time Event',
        price: 49900, // $499.00
        features: ['PhotoSphere lasts 30 days post-event', 'Up to 500 photos displayed', 'Virtual PhotoBooth included', 'Basic moderation tools', 'Single event license'],
        mode: 'payment' // One-time payment instead of subscription
      }
    };

    const planConfig = planConfigs[planType];
    if (!planConfig) {
      return new Response(JSON.stringify({ error: 'Invalid plan type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Handle Enterprise plan - redirect to contact sales
    if (planType === 'enterprise') {
      return new Response(JSON.stringify({ 
        error: 'Enterprise plan requires custom pricing',
        contactSales: true,
        message: 'Please contact our sales team for Enterprise pricing and setup.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create or retrieve product
    let product;
    const existingProducts = await stripe.products.list({
      active: true,
      limit: 100,
    });

    const existingProduct = existingProducts.data.find(p => 
      p.name.toLowerCase().includes(planType.toLowerCase())
    );

    if (existingProduct) {
      product = existingProduct;
    } else {
      product = await stripe.products.create({
        name: planConfig.name,
        description: `PhotoSphere ${planConfig.name}`,
        metadata: {
          plan_type: planType
        }
      });
    }

    // Create or retrieve price (recurring or one-time based on plan)
    let price;
    const isOneTime = planConfig.mode === 'payment';
    const priceType = isOneTime ? 'one_time' : 'recurring';
    
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: priceType,
      limit: 100,
    });

    let targetPrice;
    if (isOneTime) {
      // Find one-time price
      targetPrice = existingPrices.data.find(p => !p.recurring);
    } else {
      // Find recurring monthly price
      targetPrice = existingPrices.data.find(p => 
        p.recurring && p.recurring.interval === 'month'
      );
    }

    if (targetPrice) {
      price = targetPrice;
      console.log(`✅ Using existing ${isOneTime ? 'one-time' : 'recurring'} price: ${price.id}`);
    } else {
      console.log(`📝 Creating new ${isOneTime ? 'one-time' : 'recurring'} price for ${planType}`);
      const priceData = {
        product: product.id,
        unit_amount: planConfig.price,
        currency: 'usd',
        metadata: {
          plan_type: planType
        }
      };
      
      if (!isOneTime) {
        priceData.recurring = {
          interval: 'month'
        };
      }
      
      price = await stripe.prices.create(priceData);
      console.log(`✅ Created new ${isOneTime ? 'one-time' : 'recurring'} price: ${price.id}`);
    }

    // Create checkout session
    const sessionData = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: isOneTime ? 'payment' : 'subscription',
      success_url: `${req.headers.get('origin')}/dashboard?payment=success`,
      cancel_url: `${req.headers.get('origin')}/subscription/success?canceled=true`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan_type: planType
      }
    };

    // Add subscription_data only for recurring subscriptions
    if (!isOneTime) {
      sessionData.subscription_data = {
        metadata: {
          user_id: user.id,
          plan_type: planType
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});