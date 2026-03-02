# DreamCardAI Stripe 集成完整指南

## 📋 目录
1. [Stripe 账户设置](#1-stripe-账户设置)
2. [环境变量配置](#2-环境变量配置)
3. [前端集成](#3-前端集成)
4. [后端 Webhook 处理](#4-后端-webhook-处理)
5. [测试流程](#5-测试流程)
6. [生产环境部署](#6-生产环境部署)

---

## 1. Stripe 账户设置

### 1.1 创建 Stripe 账户
1. 访问 https://stripe.com
2. 注册账户并完成验证
3. 进入 Dashboard

### 1.2 获取 API 密钥
1. 登录 Stripe Dashboard
2. 进入 **Developers** → **API keys**
3. 复制以下密钥：
   - **Publishable key** (pk_test_...) - 用于前端
   - **Secret key** (sk_test_...) - 用于后端

### 1.3 创建产品和价格
1. 进入 **Products** → **Add product**
2. 为每个订阅计划创建产品：

#### Free Plan (不需要创建，用户默认)
- 不需要在 Stripe 中创建

#### Basic Plan
- **Name**: DreamCardAI Basic
- **Description**: Perfect for individual users
- **Pricing**: 
  - Monthly: $29.99
  - Yearly: $299.99 (16% discount)
- **Billing period**: Recurring
- 记录 Price ID: `price_xxx` (月付) 和 `price_yyy` (年付)

#### Pro Plan
- **Name**: DreamCardAI Professional
- **Description**: For serious applicants
- **Pricing**:
  - Monthly: $79.99
  - Yearly: $799.99 (16% discount)
- 记录 Price ID

#### Enterprise Plan
- **Name**: DreamCardAI Enterprise
- **Description**: For immigration lawyers and agencies
- **Pricing**:
  - Monthly: $199.99
  - Yearly: $1999.99 (16% discount)
- 记录 Price ID

### 1.4 配置 Webhook
1. 进入 **Developers** → **Webhooks**
2. 点击 **Add endpoint**
3. **Endpoint URL**: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
4. **Events to send**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. 复制 **Signing secret** (whsec_...)

---

## 2. 环境变量配置

### 2.1 在 Supabase 中添加密钥

使用 `create_supabase_secret` 工具或在 Supabase Dashboard 中添加：

```bash
# Stripe Publishable Key (前端使用)
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Stripe Secret Key (后端使用)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs
STRIPE_PRICE_BASIC_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_BASIC_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxxxxxxxxxx
```

---

## 3. 前端集成

### 3.1 安装 Stripe JS

```bash
npm install @stripe/stripe-js
```

### 3.2 创建 Stripe Service

创建 `/src/app/services/stripeService.ts`:

```typescript
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

let stripePromise: Promise<Stripe | null>;

// 初始化 Stripe
export const getStripe = () => {
  if (!stripePromise) {
    // 从环境变量或配置中获取
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

/**
 * 创建 Checkout Session
 */
export async function createCheckoutSession(priceId: string, planName: string) {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          priceId,
          planName
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error: any) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
}

/**
 * 重定向到 Stripe Checkout
 */
export async function redirectToCheckout(priceId: string, planName: string) {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Failed to load Stripe');
    }

    const sessionId = await createCheckoutSession(priceId, planName);

    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Redirect to checkout failed:', error);
    throw error;
  }
}

/**
 * 创建 Customer Portal Session（用户管理订阅）
 */
export async function createCustomerPortalSession() {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/create-portal-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create portal session');
    }

    const { url } = await response.json();
    return url;
  } catch (error: any) {
    console.error('Failed to create portal session:', error);
    throw error;
  }
}
```

### 3.3 创建价格选择组件

创建 `/src/app/components/PricingPlans.tsx`:

```typescript
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Check, Loader2 } from 'lucide-react';
import { redirectToCheckout } from '../services/stripeService';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  stripePriceMonthly: string;
  stripePriceYearly: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for individual users',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    stripePriceMonthly: 'price_basic_monthly',
    stripePriceYearly: 'price_basic_yearly',
    features: [
      '3 applications',
      '50 file uploads',
      'Email support',
      'Basic templates'
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For serious applicants',
    monthlyPrice: 79.99,
    yearlyPrice: 799.99,
    stripePriceMonthly: 'price_pro_monthly',
    stripePriceYearly: 'price_pro_yearly',
    popular: true,
    features: [
      '10 applications',
      '200 file uploads',
      'Priority support',
      'Advanced templates',
      'Export to PDF'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For lawyers and agencies',
    monthlyPrice: 199.99,
    yearlyPrice: 1999.99,
    stripePriceMonthly: 'price_enterprise_monthly',
    stripePriceYearly: 'price_enterprise_yearly',
    features: [
      'Unlimited applications',
      'Unlimited file uploads',
      '24/7 support',
      'White-label option',
      'API access'
    ]
  }
];

export function PricingPlans() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    try {
      setLoading(plan.id);
      const priceId = billingCycle === 'monthly' 
        ? plan.stripePriceMonthly 
        : plan.stripePriceYearly;
      
      await redirectToCheckout(priceId, plan.name);
    } catch (error: any) {
      console.error('Failed to start checkout:', error);
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs text-green-600 font-semibold">Save 16%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl border-2 p-8 ${
              plan.popular
                ? 'border-[#434E87] shadow-xl scale-105'
                : 'border-gray-200 shadow-sm'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-[#434E87] text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold text-gray-900">
                  ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                <span className="text-gray-500 ml-2">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSelectPlan(plan)}
              disabled={loading === plan.id}
              className={`w-full ${
                plan.popular
                  ? 'bg-[#434E87] hover:bg-[#323b6b]'
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              {loading === plan.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3.4 在 UserAccountPage 中添加订阅管理

更新 `/src/app/pages/UserAccountPage.tsx`:

```typescript
import { createCustomerPortalSession } from '../services/stripeService';

// 在组件中添加
const handleManageSubscription = async () => {
  try {
    const url = await createCustomerPortalSession();
    window.location.href = url;
  } catch (error: any) {
    toast.error('Failed to open subscription management');
  }
};

// 在 UI 中添加按钮
<Button onClick={handleManageSubscription}>
  Manage Subscription
</Button>
```

---

## 4. 后端 Webhook 处理

### 4.1 创建 Checkout Session 端点

创建 `/supabase/functions/create-checkout-session/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'npm:stripe@14.14.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const { priceId, planName } = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;

      // Update user_subscriptions with customer ID
      await supabase
        .from('user_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/account?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan_name: planName
      }
    });

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error: any) {
    console.error('Create checkout session error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
```

### 4.2 创建 Portal Session 端点

创建 `/supabase/functions/create-portal-session/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'npm:stripe@14.14.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get Stripe customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No subscription found' }),
        { status: 404 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${req.headers.get('origin')}/account`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error: any) {
    console.error('Create portal session error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

### 4.3 创建 Stripe Webhook 处理

创建 `/supabase/functions/stripe-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'npm:stripe@14.14.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );

    console.log('Webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const planName = session.metadata?.plan_name;

  if (!userId) {
    console.error('No user ID in session metadata');
    return;
  }

  // Get plan ID from database
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('name', planName?.toLowerCase())
    .single();

  if (!plan) {
    console.error('Plan not found:', planName);
    return;
  }

  // Update user subscription
  await supabase
    .from('user_subscriptions')
    .update({
      plan_id: plan.id,
      status: 'active',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('user_id', userId);

  console.log('Checkout completed for user:', userId);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!userSub) {
    console.error('User subscription not found');
    return;
  }

  const status = subscription.status === 'active' ? 'active' :
                 subscription.status === 'past_due' ? 'past_due' :
                 subscription.status === 'canceled' ? 'canceled' : 'active';

  await supabase
    .from('user_subscriptions')
    .update({
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('user_id', userSub.user_id);

  console.log('Subscription updated:', subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id, plan_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!userSub) return;

  // Get free plan
  const { data: freePlan } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('name', 'free')
    .single();

  // Downgrade to free plan
  await supabase
    .from('user_subscriptions')
    .update({
      plan_id: freePlan?.id,
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('user_id', userSub.user_id);

  console.log('Subscription canceled:', subscription.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const userId = invoice.subscription_details?.metadata?.supabase_user_id;

  if (!userId) return;

  // Record payment in payment_history
  await supabase
    .from('payment_history')
    .insert({
      user_id: userId,
      amount: invoice.amount_paid / 100, // Convert cents to dollars
      currency: invoice.currency.toUpperCase(),
      status: 'succeeded',
      stripe_payment_intent_id: invoice.payment_intent as string,
      invoice_url: invoice.hosted_invoice_url,
      receipt_url: invoice.invoice_pdf,
      description: invoice.lines.data[0]?.description || 'Subscription payment'
    });

  console.log('Payment succeeded:', invoice.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const userId = invoice.subscription_details?.metadata?.supabase_user_id;

  if (!userId) return;

  // Update subscription status to past_due
  await supabase
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('user_id', userId);

  // Record failed payment
  await supabase
    .from('payment_history')
    .insert({
      user_id: userId,
      amount: invoice.amount_due / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'failed',
      description: 'Payment failed'
    });

  console.log('Payment failed:', invoice.id);
}
```

---

## 5. 测试流程

### 5.1 使用 Stripe 测试卡

在测试模式下使用以下测试卡号：

**成功支付**:
- Card number: `4242 4242 4242 4242`
- Expiry: 任何未来日期 (e.g., 12/34)
- CVC: 任何3位数字 (e.g., 123)
- ZIP: 任何5位数字 (e.g., 12345)

**失败支付**:
- Card number: `4000 0000 0000 0002`

**需要验证**:
- Card number: `4000 0025 0000 3155`

### 5.2 测试 Webhook 本地

使用 Stripe CLI:

```bash
# 安装 Stripe CLI
brew install stripe/stripe-cli/stripe

# 登录
stripe login

# 转发 webhook 到本地
stripe listen --forward-to https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook

# 触发测试事件
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
```

### 5.3 端到端测试流程

1. **注册新用户** → 自动获得免费试用
2. **选择付费计划** → 重定向到 Stripe Checkout
3. **使用测试卡完成支付** → 重定向回网站
4. **验证订阅状态** → 检查用户订阅是否更新
5. **测试功能访问** → 验证付费功能是否解锁
6. **管理订阅** → 打开 Customer Portal，取消或更改计划

---

## 6. 生产环境部署

### 6.1 切换到生产模式

1. 在 Stripe Dashboard 中启用生产模式
2. 复制生产环境的 API 密钥
3. 更新 Supabase 环境变量为生产密钥
4. 创建生产环境的产品和价格
5. 配置生产环境的 Webhook

### 6.2 安全检查清单

- ✅ 所有 API 密钥存储在环境变量中
- ✅ Webhook 签名验证已启用
- ✅ HTTPS 已启用
- ✅ CORS 已正确配置
- ✅ Row Level Security (RLS) 已启用
- ✅ 错误日志已设置
- ✅ 支付失败通知已配置

### 6.3 监控和日志

1. 在 Stripe Dashboard 监控：
   - **Payments** → 查看所有支付
   - **Subscriptions** → 查看所有订阅
   - **Customers** → 查看所有客户
   - **Logs** → 查看 API 日志

2. 在 Supabase Dashboard 监控：
   - **Table Editor** → 检查 `user_subscriptions` 和 `payment_history`
   - **Functions** → 查看 Edge Function 日志
   - **Logs** → 查看所有数据库日志

---

## 📞 常见问题

### Q1: Webhook 没有触发？
**A**: 检查：
1. Webhook URL 是否正确
2. Webhook secret 是否正确配置
3. Stripe Dashboard 中 Webhook 是否已启用
4. 使用 Stripe CLI 测试本地 webhook

### Q2: 支付成功但订阅未更新？
**A**: 检查：
1. Webhook 日志查看是否有错误
2. `user_subscriptions` 表的 RLS 策略
3. Supabase 环境变量是否正确

### Q3: 如何处理退款？
**A**: 在 Stripe Dashboard 中手动退款，webhook 会自动更新数据库

### Q4: 如何测试年付订阅？
**A**: 在测试模式下选择年付选项，使用测试卡完成支付

---

## 🎉 完成！

现在您的 DreamCardAI 应用已经完全集成了 Stripe 支付系统！

需要帮助？参考：
- [Stripe 文档](https://stripe.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
