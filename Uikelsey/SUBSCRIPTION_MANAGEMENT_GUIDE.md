# DreamCardAI 订阅和付费管理系统

## 概述

本系统通过 Supabase 数据库实现用户订阅状态管理和付费用户界定，支持多种订阅计划和使用限制。

## 数据库架构

### 1. `subscription_plans` 表
存储所有可用的订阅计划：
- **free**: 免费试用（1个申请，10个文件）
- **basic**: 基础套餐 $29.99/月（3个申请，50个文件）
- **pro**: 专业套餐 $79.99/月（10个申请，200个文件）
- **enterprise**: 企业套餐 $199.99/月（无限制）

### 2. `user_subscriptions` 表
跟踪每个用户的订阅状态：
- `status`: trial（试用）、active（活跃）、past_due（逾期）、canceled（已取消）、expired（已过期）
- `trial_ends_at`: 试用期结束时间
- `current_period_end`: 当前订阅周期结束时间
- `applications_used`: 已使用的申请数量
- `files_uploaded`: 已上传的文件数量

### 3. `payment_history` 表
记录所有支付交易历史

## 使用方法

### 1. 安装数据库架构

```bash
# 在 Supabase SQL Editor 中运行
cat supabase_subscriptions_setup.sql
```

这将自动：
- 创建所有必要的表
- 设置 Row Level Security (RLS) 策略
- 创建辅助函数
- 为新用户自动创建免费试用订阅（14天）

### 2. 在代码中使用订阅服务

```typescript
import { subscriptionService } from './services/subscriptionService';

// 获取用户当前订阅信息
const subscription = await subscriptionService.getUserSubscription();
console.log(subscription.plan_name); // 'free', 'basic', 'pro', 'enterprise'
console.log(subscription.status); // 'trial', 'active', etc.

// 检查用户是否可以创建新申请
const { allowed, reason } = await subscriptionService.canCreateApplication();
if (!allowed) {
  toast.error(reason); // 显示限制原因
  return;
}

// 增加申请使用计数
await subscriptionService.incrementApplicationUsage();

// 检查用户是否可以上传文件
const canUpload = await subscriptionService.canUploadFile();
if (!canUpload.allowed) {
  toast.error(canUpload.reason);
  return;
}

// 增加文件上传计数
await subscriptionService.incrementFileUploadUsage();

// 获取使用统计
const stats = await subscriptionService.getUsageStats();
console.log(`Applications: ${stats.applicationsUsed}/${stats.applicationsLimit}`);
console.log(`Files: ${stats.filesUploaded}/${stats.filesLimit}`);
```

### 3. 界定付费与未付费用户

#### 方法 1: 通过订阅状态

```typescript
// 检查用户是否是免费用户
const isFreePlan = await subscriptionService.isFreePlan();

// 检查用户是否在试用期
const isOnTrial = await subscriptionService.isOnTrial();

// 检查用户是否有付费订阅（active 状态）
const subscription = await subscriptionService.getUserSubscription();
const isPaidUser = subscription?.status === 'active' && 
                   subscription?.plan_name !== 'free';
```

#### 方法 2: 通过功能访问权限

```typescript
// 检查用户是否可以访问特定功能
const hasAccess = await subscriptionService.checkAccess('premium_feature');

if (!hasAccess) {
  // 显示升级提示
  showUpgradeModal();
}
```

#### 方法 3: 使用 RLS 策略（推荐）

在 Supabase 中创建 RLS 策略来自动限制访问：

```sql
-- 示例：限制只有付费用户才能创建超过1个申请
CREATE POLICY "Limit free users to 1 application"
ON public.applications
FOR INSERT
WITH CHECK (
  (
    SELECT COUNT(*) 
    FROM public.applications 
    WHERE user_id = auth.uid()
  ) < 1
  OR
  (
    SELECT us.plan_id
    FROM public.user_subscriptions us
    WHERE us.user_id = auth.uid()
  ) IN (
    SELECT id 
    FROM public.subscription_plans 
    WHERE name != 'free'
  )
);
```

### 4. 在 UI 中显示订阅状态

```typescript
import { SubscriptionStatus } from './components/SubscriptionStatus';

function UserAccountPage() {
  return (
    <div>
      <h1>Account Settings</h1>
      <SubscriptionStatus />
    </div>
  );
}
```

## 常见使用场景

### 场景 1: 创建新申请前检查限制

```typescript
async function createNewApplication() {
  // 1. 检查是否允许创建
  const { allowed, reason } = await subscriptionService.canCreateApplication();
  
  if (!allowed) {
    // 显示升级提示
    toast.error(reason);
    showUpgradeModal();
    return;
  }

  // 2. 创建申请
  const application = await applicationsService.create({...});

  // 3. 增加使用计数
  await subscriptionService.incrementApplicationUsage();

  toast.success('Application created!');
}
```

### 场景 2: 文件上传前检查限制

```typescript
async function handleFileUpload(file: File) {
  // 1. 检查是否允许上传
  const { allowed, reason } = await subscriptionService.canUploadFile();
  
  if (!allowed) {
    toast.error(reason);
    return;
  }

  // 2. 上传文件
  await uploadFile(file);

  // 3. 增加使用计数
  await subscriptionService.incrementFileUploadUsage();
}
```

### 场景 3: 显示试用期剩余天数

```typescript
const TrialBanner = () => {
  const [trialDays, setTrialDays] = useState<number | null>(null);

  useEffect(() => {
    subscriptionService.getTrialDaysRemaining()
      .then(setTrialDays);
  }, []);

  if (trialDays === null || trialDays > 7) return null;

  return (
    <div className="bg-amber-100 p-4 text-center">
      <p>
        {trialDays > 0 
          ? `${trialDays} days left in your trial`
          : 'Your trial has expired'}
      </p>
      <Button>Upgrade Now</Button>
    </div>
  );
};
```

## 付费集成（Stripe）

### 1. Webhook 处理

在 Supabase Edge Function 中处理 Stripe webhook：

```typescript
// supabase/functions/stripe-webhook/index.ts
import Stripe from 'stripe';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  );

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      // 更新用户订阅状态
      await updateUserSubscription(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      // 记录支付成功
      await recordPayment(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      // 取消订阅
      await cancelSubscription(event.data.object);
      break;
  }

  return new Response(JSON.stringify({ received: true }));
});
```

### 2. 创建订阅

```typescript
async function createSubscription(planId: string, paymentMethodId: string) {
  // 调用后端 API
  const response = await fetch('/api/create-subscription', {
    method: 'POST',
    body: JSON.stringify({
      planId,
      paymentMethodId
    })
  });

  if (response.ok) {
    // 刷新订阅状态
    await subscriptionService.getUserSubscription();
  }
}
```

## 安全最佳实践

1. **使用 RLS 策略**: 在数据库层面限制访问，不要只依赖前端检查
2. **验证使用限制**: 在后端 Edge Function 中也要验证用户权限
3. **记录审计日志**: 记录所有订阅变更和支付事件
4. **定期同步**: 定期同步 Stripe 和数据库的订阅状态

## 测试

```typescript
// 测试订阅功能
describe('Subscription Service', () => {
  it('should limit free users to 1 application', async () => {
    const { allowed } = await subscriptionService.canCreateApplication();
    expect(allowed).toBe(false);
  });

  it('should allow pro users unlimited applications', async () => {
    // 模拟 pro 订阅
    const { allowed } = await subscriptionService.canCreateApplication();
    expect(allowed).toBe(true);
  });
});
```

## 故障排除

### 问题 1: 新用户没有自动创建订阅
**解决方案**: 检查 `on_auth_user_subscription_created` trigger 是否正确创建

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_subscription_created';
```

### 问题 2: RLS 策略阻止用户访问
**解决方案**: 检查 RLS 策略是否正确配置

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_subscriptions';
```

### 问题 3: 使用计数不准确
**解决方案**: 重新计算使用统计

```sql
UPDATE user_subscriptions us
SET 
  applications_used = (
    SELECT COUNT(*) FROM applications WHERE user_id = us.user_id
  ),
  files_uploaded = (
    SELECT COUNT(*) FROM user_files WHERE user_id = us.user_id
  );
```

## 总结

通过这个订阅管理系统，您可以：

1. ✅ **精确界定**付费和免费用户
2. ✅ **自动限制**免费用户的使用额度
3. ✅ **跟踪使用情况**并在达到限制时提示升级
4. ✅ **提供试用期**吸引新用户
5. ✅ **灵活管理**多种订阅计划
6. ✅ **安全可靠**使用 Row Level Security 保护数据

系统完全基于 Supabase，无需额外的后端服务器，易于维护和扩展。
