# Profile 获取失败问题诊断和解决方案

## 问题描述
用户能够成功登录,但无法获取 profile 信息:
- ✅ 登录成功: `Auth state changed: SIGNED_IN`  
- ❌ Profile 获取失败: `Response status: 401`, `Invalid JWT`

## 问题根本原因

根据错误信息 `401 Invalid JWT`,问题是:

### **Edge Function 无法验证 JWT token**

后端 Edge Function 在验证用户身份时失败。这通常是因为 Edge Function 缺少必要的环境变量。

Supabase Edge Functions 需要这些环境变量才能正常工作:
- ✅ `SUPABASE_URL` - 项目 URL (通常自动提供)
- ✅ `SUPABASE_ANON_KEY` - 公开匿名密钥 (通常自动提供)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - **必须手动添加**
- ⚠️ JWT Secret - 用于验证 tokens (应该自动提供,但有时需要检查)

## 解决步骤

### 步骤 1: 配置 Edge Function 环境变量

这是最关键的步骤!

#### 1.1 访问 Supabase Dashboard

```
https://supabase.com/dashboard/project/mgbftnkxmbasanzfdpax
```

#### 1.2 导航到 Edge Functions 配置

两种方法:

**方法 A: 通过 Edge Functions 页面**
1. 左侧菜单 → `Edge Functions`
2. 找到并点击 `make-server-604ca09d` 函数
3. 点击右上角的 "Settings" 或 "⚙️" 图标

**方法 B: 通过 Project Settings**
1. 左侧菜单 → `Project Settings` (齿轮图标)
2. 点击 `Edge Functions` 标签
3. 找到环境变量配置区域

#### 1.3 获取 Service Role Key

1. 在 Supabase Dashboard 中:
   - 左侧菜单 → `Project Settings` → `API`
2. 找到 "Project API keys" 部分
3. 你会看到两个密钥:
   - `anon` `public` - 公开密钥 ✅ (已经在前端使用)
   - `service_role` `secret` - **复制这个!** ⚠️

**重要警告**: Service Role Key 绕过所有 RLS 策略,永远不要在客户端代码中使用!

#### 1.4 添加环境变量

在 Edge Functions 设置中,添加以下环境变量:

| 变量名 | 值 | 
|--------|---|
| `SUPABASE_URL` | `https://mgbftnkxmbasanzfdpax.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | (粘贴你复制的 service_role key) |

**注意**: 
- 有些 Supabase 版本中,`SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是自动提供的
- 但 `SUPABASE_SERVICE_ROLE_KEY` **必须手动添加**
- 确保没有多余的空格或换行符

#### 1.5 保存并等待部署

1. 点击 "Save" 或 "Update"
2. Edge Function 会自动重启
3. ⏱️ **等待 1-2 分钟**让更改生效

### 步骤 2: 确认 profiles 表结构

在 Supabase SQL Editor 中运行以下 SQL 来创建/验证表:

```sql
-- 创建 profiles 表(如果不存在)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  occupation TEXT,
  field TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 创建策略:允许用户读取自己的 profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 创建策略:允许用户更新自己的 profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 创建策略:允许用户插入自己的 profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 创建触发器:自动更新 updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 步骤 3: 测试和验证

1. **刷新页面并查看浏览器控制台**:
   - 应该看到更详细的日志:
   ```
   🔵 Fetching profile from: https://...
   🔵 User ID: xxx
   🔵 Response status: 200
   ✅ Profile data received: {...}
   ```

2. **首次使用时**:
   - 如果返回空对象 `{}`,这是正常的(用户还没有 profile 记录)
   - 填写 Personal Information 表单并点击 "Save Changes"
   - Profile 将被创建

3. **如果仍然失败**:
   - 查看控制台的错误消息
   - 检查诊断页面的详细报告
   - 查看 Supabase Edge Function 的日志(Dashboard → Edge Functions → Logs)

## 常见错误和解决方案

### 错误 1: "Failed to fetch profile: 500"
**原因**: Backend 无法访问数据库  
**解决**: 检查 `SUPABASE_SERVICE_ROLE_KEY` 环境变量是否正确配置

### 错误 2: "Failed to fetch profile: 401 Unauthorized"
**原因**: 认证 token 无效或过期  
**解决**: 重新登录

### 错误 3: Profile 返回空对象 `{}`
**原因**: 这不是错误!用户还没有创建 profile  
**解决**: 填写表单并保存,第一次保存会创建记录

### 错误 4: "Unauthorized" (即使已登录)
**原因**: RLS 策略配置问题  
**解决**: 
- 确认 RLS 策略允许用户访问自己的数据
- 或者后端使用 Service Role Key 绕过 RLS

## 调试技巧

### 1. 查看详细日志
打开浏览器控制台,所有 API 调用都会记录:
```
📋 Loading profile...
🔵 Fetching profile from: ...
🔵 User ID: ...
🔵 Response status: ...
```

### 2. 使用诊断面板
访问 Admin → Diagnostics 查看完整的系统状态

### 3. 检查 Supabase Logs
Supabase Dashboard → Edge Functions → 选择函数 → Logs

### 4. 直接测试 API
使用 curl 或 Postman 测试后端:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://mgbftnkxmbasanzfdpax.supabase.co/functions/v1/make-server-604ca09d/profile
```

## 下一步

配置完成后:
1. ✅ 用户登录后能看到 Personal Information 页面
2. ✅ 如果已有 profile,表单会自动填充
3. ✅ 修改并保存后,数据会持久化到 Supabase
4. ✅ 刷新页面后数据会被重新加载

## 需要帮助?

如果按照上述步骤仍然无法解决:
1. 访问诊断页面并复制完整报告
2. 检查 Supabase Edge Function 日志
3. 提供具体的错误消息和日志