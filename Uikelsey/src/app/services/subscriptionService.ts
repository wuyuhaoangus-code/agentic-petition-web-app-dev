/**
 * Subscription Service
 * Manages user subscriptions, payment status, and feature access
 */

import { createClient } from '../../lib/supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_applications: number | null;
  max_file_uploads: number | null;
  max_file_size_mb: number;
  is_active: boolean;
}

export interface UserSubscription {
  subscription_id: string;
  plan_name: string;
  plan_display_name: string;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
  trial_ends_at: string | null;
  current_period_end: string | null;
  max_applications: number | null;
  max_file_uploads: number | null;
  applications_used: number;
  files_uploaded: number;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  description: string;
  invoice_url: string | null;
  receipt_url: string | null;
  created_at: string;
}

class SubscriptionService {
  private supabase = createClient();

  /**
   * Get all available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Failed to fetch subscription plans:', error);
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get current user's subscription details
   */
  async getUserSubscription(): Promise<UserSubscription | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .rpc('get_user_subscription', { p_user_id: user.id });

    if (error) {
      console.error('Failed to fetch user subscription:', error);
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * Check if user has access to a feature
   */
  async checkAccess(feature: string = 'any'): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await this.supabase
      .rpc('check_user_access', { 
        p_user_id: user.id,
        p_feature: feature 
      });

    if (error) {
      console.error('Failed to check user access:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Check if user can create a new application
   */
  async canCreateApplication(): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await this.getUserSubscription();
    
    if (!subscription) {
      return { 
        allowed: false, 
        reason: 'No active subscription found' 
      };
    }

    // Check if subscription is active
    if (subscription.status !== 'active' && subscription.status !== 'trial') {
      return { 
        allowed: false, 
        reason: 'Your subscription is not active' 
      };
    }

    // Check if trial has expired
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      if (trialEnd < new Date()) {
        return { 
          allowed: false, 
          reason: 'Your trial period has expired' 
        };
      }
    }

    // Check usage limits (null means unlimited)
    if (subscription.max_applications !== null) {
      if (subscription.applications_used >= subscription.max_applications) {
        return { 
          allowed: false, 
          reason: `You have reached your application limit (${subscription.max_applications})` 
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if user can upload a file
   */
  async canUploadFile(): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await this.getUserSubscription();
    
    if (!subscription) {
      return { 
        allowed: false, 
        reason: 'No active subscription found' 
      };
    }

    // Check if subscription is active
    if (subscription.status !== 'active' && subscription.status !== 'trial') {
      return { 
        allowed: false, 
        reason: 'Your subscription is not active' 
      };
    }

    // Check usage limits (null means unlimited)
    if (subscription.max_file_uploads !== null) {
      if (subscription.files_uploaded >= subscription.max_file_uploads) {
        return { 
          allowed: false, 
          reason: `You have reached your file upload limit (${subscription.max_file_uploads})` 
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Increment application usage counter
   */
  async incrementApplicationUsage(): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .rpc('increment_usage', { 
        p_user_id: user.id,
        p_type: 'application' 
      });

    if (error) {
      console.error('Failed to increment application usage:', error);
      throw new Error(`Failed to increment usage: ${error.message}`);
    }

    return data === true;
  }

  /**
   * Increment file upload usage counter
   */
  async incrementFileUploadUsage(): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .rpc('increment_usage', { 
        p_user_id: user.id,
        p_type: 'file' 
      });

    if (error) {
      console.error('Failed to increment file upload usage:', error);
      throw new Error(`Failed to increment usage: ${error.message}`);
    }

    return data === true;
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(): Promise<PaymentHistory[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch payment history:', error);
      throw new Error(`Failed to fetch payment history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if user is on free plan
   */
  async isFreePlan(): Promise<boolean> {
    const subscription = await this.getUserSubscription();
    return subscription?.plan_name === 'free';
  }

  /**
   * Check if user is on trial
   */
  async isOnTrial(): Promise<boolean> {
    const subscription = await this.getUserSubscription();
    return subscription?.status === 'trial';
  }

  /**
   * Get days remaining in trial
   */
  async getTrialDaysRemaining(): Promise<number | null> {
    const subscription = await this.getUserSubscription();
    
    if (!subscription || subscription.status !== 'trial' || !subscription.trial_ends_at) {
      return null;
    }

    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<{
    applicationsUsed: number;
    applicationsLimit: number | null;
    filesUploaded: number;
    filesLimit: number | null;
    applicationsPercentage: number;
    filesPercentage: number;
  } | null> {
    const subscription = await this.getUserSubscription();
    
    if (!subscription) {
      return null;
    }

    const applicationsPercentage = subscription.max_applications
      ? (subscription.applications_used / subscription.max_applications) * 100
      : 0;

    const filesPercentage = subscription.max_file_uploads
      ? (subscription.files_uploaded / subscription.max_file_uploads) * 100
      : 0;

    return {
      applicationsUsed: subscription.applications_used,
      applicationsLimit: subscription.max_applications,
      filesUploaded: subscription.files_uploaded,
      filesLimit: subscription.max_file_uploads,
      applicationsPercentage: Math.round(applicationsPercentage),
      filesPercentage: Math.round(filesPercentage)
    };
  }
}

export const subscriptionService = new SubscriptionService();
