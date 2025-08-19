import { supabase } from '../lib/supabase';

export interface CreateCheckoutSessionRequest {
  planType: 'starter' | 'pro' | 'enterprise';
}

export interface CreateCheckoutSessionResponse {
  url: string;
}

export interface CreatePortalSessionResponse {
  url: string;
}

class SubscriptionService {
  private async getAuthToken(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      throw new Error('No valid authentication token found');
    }
    
    return session.access_token;
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a Stripe Checkout session for subscription
   */
  async createCheckoutSession(planType: string): Promise<CreateCheckoutSessionResponse> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const endpoint = `${supabaseUrl}/functions/v1/create-checkout-session`;
    
    return this.makeAuthenticatedRequest<CreateCheckoutSessionResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ planType }),
    });
  }

  /**
   * Create a Stripe Customer Portal session for subscription management
   */
  async createPortalSession(): Promise<CreatePortalSessionResponse> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const endpoint = `${supabaseUrl}/functions/v1/create-portal-session`;
    
    return this.makeAuthenticatedRequest<CreatePortalSessionResponse>(endpoint, {
      method: 'POST',
    });
  }

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(planType: string): Promise<void> {
    try {
      const { url } = await this.createCheckoutSession(planType);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to redirect to checkout:', error);
      throw error;
    }
  }

  /**
   * Redirect to Stripe Customer Portal
   */
  async redirectToPortal(): Promise<void> {
    try {
      const { url } = await this.createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to redirect to portal:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment return
   * This method can be called when user returns from Stripe Checkout
   */
  async handlePaymentSuccess(): Promise<void> {
    // The webhook should have already processed the subscription
    // We just need to refresh the user's subscription data
    
    // Wait a moment for webhook to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Trigger a refresh of subscription data
    // This will be handled by the component calling fetchSubscription()
  }

  /**
   * Validate plan type
   */
  isValidPlanType(planType: string): planType is 'starter' | 'pro' | 'enterprise' {
    return ['starter', 'pro', 'enterprise'].includes(planType);
  }

  /**
   * Get plan configuration
   */
  getPlanConfig(planType: string) {
    const configs = {
      starter: {
        name: 'Starter Plan',
        price: 45,
        features: ['50 PhotoSpheres', '1,000 Photos', 'Basic Support'],
        limits: { photospheres: 50, photos: 1000 }
      },
      pro: {
        name: 'Pro Plan', 
        price: 99,
        features: ['200 PhotoSpheres', '5,000 Photos', 'Video Recording', 'Priority Support'],
        limits: { photospheres: 200, photos: 5000 }
      },
      enterprise: {
        name: 'Enterprise Plan',
        price: 499,
        features: ['Unlimited PhotoSpheres', 'Unlimited Photos', 'Video Recording', 'White Label', 'Dedicated Manager'],
        limits: { photospheres: 999999, photos: 999999 }
      }
    };

    return configs[planType as keyof typeof configs] || null;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
