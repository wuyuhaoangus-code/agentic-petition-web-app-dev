-- =====================================================
-- DreamCardAI Subscription Management System
-- =====================================================
-- This file sets up the subscription and payment tracking system
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Create subscription_plans table
-- =====================================================
-- Defines available subscription tiers/plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB DEFAULT '[]'::jsonb,
  max_applications INTEGER, -- NULL means unlimited
  max_file_uploads INTEGER, -- NULL means unlimited
  max_file_size_mb INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Insert default subscription plans
-- =====================================================
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, features, max_applications, max_file_uploads)
VALUES
  -- Free tier
  (
    'free',
    'Free Trial',
    'Get started with basic features',
    0.00,
    0.00,
    '["1 application", "10 file uploads", "Basic support"]'::jsonb,
    1,
    10
  ),
  -- Basic tier
  (
    'basic',
    'Basic Plan',
    'Perfect for individual users',
    29.99,
    299.99,
    '["3 applications", "50 file uploads", "Email support", "Basic templates"]'::jsonb,
    3,
    50
  ),
  -- Pro tier
  (
    'pro',
    'Professional Plan',
    'For serious applicants',
    79.99,
    799.99,
    '["10 applications", "200 file uploads", "Priority support", "Advanced templates", "Export to PDF"]'::jsonb,
    10,
    200
  ),
  -- Enterprise tier
  (
    'enterprise',
    'Enterprise Plan',
    'For immigration lawyers and agencies',
    199.99,
    1999.99,
    '["Unlimited applications", "Unlimited file uploads", "24/7 support", "White-label option", "API access"]'::jsonb,
    NULL, -- Unlimited
    NULL  -- Unlimited
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. Create user_subscriptions table
-- =====================================================
-- Tracks each user's subscription status
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  
  -- Subscription status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
  
  -- Billing cycle
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  
  -- Dates
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  -- Payment gateway info
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Usage tracking
  applications_used INTEGER DEFAULT 0,
  files_uploaded INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one active subscription per user
  UNIQUE(user_id)
);

-- =====================================================
-- 4. Create payment_history table
-- =====================================================
-- Records all payment transactions
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  
  -- Payment gateway info
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  -- Invoice
  invoice_url TEXT,
  receipt_url TEXT,
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS Policies for subscription_plans
-- =====================================================
-- Anyone can view active plans
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

-- =====================================================
-- 7. RLS Policies for user_subscriptions
-- =====================================================
-- Users can view their own subscription
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subscription (typically done by backend)
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert own subscription"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update own subscription"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 8. RLS Policies for payment_history
-- =====================================================
-- Users can view their own payment history
DROP POLICY IF EXISTS "Users can view own payment history" ON public.payment_history;
CREATE POLICY "Users can view own payment history"
ON public.payment_history
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert payment records (done by backend)
-- No INSERT policy for regular users

-- =====================================================
-- 9. Create helper functions
-- =====================================================

-- Function to get user's active subscription with plan details
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  plan_display_name TEXT,
  status TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  max_applications INTEGER,
  max_file_uploads INTEGER,
  applications_used INTEGER,
  files_uploaded INTEGER
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    us.id as subscription_id,
    sp.name as plan_name,
    sp.display_name as plan_display_name,
    us.status,
    us.trial_ends_at,
    us.current_period_end,
    sp.max_applications,
    sp.max_file_uploads,
    us.applications_used,
    us.files_uploaded
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
  LIMIT 1;
$$;

-- Function to check if user has access to feature
CREATE OR REPLACE FUNCTION public.check_user_access(
  p_user_id UUID,
  p_feature TEXT DEFAULT 'any'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription RECORD;
  v_is_active BOOLEAN;
BEGIN
  -- Get user's subscription
  SELECT * INTO v_subscription
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;
  
  -- If no subscription found, they're on free tier
  IF NOT FOUND THEN
    RETURN (p_feature = 'basic');
  END IF;
  
  -- Check if subscription is active or in trial
  v_is_active := (
    v_subscription.status IN ('active', 'trial') 
    AND (
      v_subscription.current_period_end IS NULL 
      OR v_subscription.current_period_end > NOW()
    )
  );
  
  RETURN v_is_active;
END;
$$;

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_type TEXT -- 'application' or 'file'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_limit INTEGER;
  v_current_usage INTEGER;
BEGIN
  -- Get current usage and limits
  IF p_type = 'application' THEN
    SELECT 
      sp.max_applications,
      us.applications_used
    INTO v_max_limit, v_current_usage
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id;
    
    -- Check if limit reached (NULL means unlimited)
    IF v_max_limit IS NOT NULL AND v_current_usage >= v_max_limit THEN
      RETURN FALSE;
    END IF;
    
    -- Increment counter
    UPDATE public.user_subscriptions
    SET applications_used = applications_used + 1
    WHERE user_id = p_user_id;
    
  ELSIF p_type = 'file' THEN
    SELECT 
      sp.max_file_uploads,
      us.files_uploaded
    INTO v_max_limit, v_current_usage
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id;
    
    -- Check if limit reached
    IF v_max_limit IS NOT NULL AND v_current_usage >= v_max_limit THEN
      RETURN FALSE;
    END IF;
    
    -- Increment counter
    UPDATE public.user_subscriptions
    SET files_uploaded = files_uploaded + 1
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- =====================================================
-- 10. Create triggers for updated_at
-- =====================================================
CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER payment_history_updated_at
  BEFORE UPDATE ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 11. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON public.user_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON public.payment_history(status);

-- =====================================================
-- 12. Grant permissions
-- =====================================================
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;
GRANT SELECT ON public.payment_history TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_access(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_usage(UUID, TEXT) TO authenticated;

-- =====================================================
-- 13. Automatically create free subscription for new users
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_free_plan_id UUID;
BEGIN
  -- Get the free plan ID
  SELECT id INTO v_free_plan_id
  FROM public.subscription_plans
  WHERE name = 'free'
  LIMIT 1;
  
  -- Create subscription for new user
  IF v_free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (
      user_id,
      plan_id,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end
    ) VALUES (
      NEW.id,
      v_free_plan_id,
      'trial',
      NOW() + INTERVAL '14 days', -- 14-day free trial
      NOW(),
      NOW() + INTERVAL '14 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_subscription_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_subscription_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- =====================================================
-- 14. Comments for documentation
-- =====================================================
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans/tiers';
COMMENT ON TABLE public.user_subscriptions IS 'User subscription status and usage tracking';
COMMENT ON TABLE public.payment_history IS 'Payment transaction history';

COMMENT ON FUNCTION public.get_user_subscription(UUID) IS 'Get user subscription details with plan info';
COMMENT ON FUNCTION public.check_user_access(UUID, TEXT) IS 'Check if user has access to a feature';
COMMENT ON FUNCTION public.increment_usage(UUID, TEXT) IS 'Increment usage counter (application or file)';

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Next steps:
-- 1. Configure Stripe integration for payments
-- 2. Update frontend to check subscription status
-- 3. Implement payment webhooks in edge functions
-- 4. Test the subscription flow
-- =====================================================
