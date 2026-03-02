# 🚨 重要: Edge Function 部署问题

## 问题分析

当前遇到的 **401 Unauthorized** 错误是因为:

1. **Edge Function 需要在 Supabase 平台上部署** 
   - 在 Figma Make 环境中,代码修改后 Edge Function 不会自动更新
   - 需要手动重新部署才能生效

2. **Supabase 可能有全局的认证要求**
   - 即使我们的代码移除了认证检查
   - Supabase 平台层面可能仍然要求某些环境变量

## 当前代码状态

✅ **已完成的修改:**
- Criteria 端点已移除 JWT 认证检查
- 文件上传改为前端直接上传
- 添加了详细的日志输出
- 添加了测试端点 `/test`

## 验证步骤

请在浏览器控制台运行以下代码来测试 Edge Function 是否正常工作:

```javascript
// 测试1: 健康检查(不需要认证)
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-604ca09d/health')
  .then(r => r.json())
  .then(data => console.log('Health check:', data))
  .catch(err => console.error('Health check failed:', err));

// 测试2: 测试端点(不需要认证)
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-604ca09d/test')
  .then(r => r.json())
  .then(data => console.log('Test endpoint:', data))
  .catch(err => console.error('Test failed:', err));

// 测试3: Criteria 端点(已移除认证)
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-604ca09d/criteria/test-app-id/files')
  .then(r => r.json())
  .then(data => console.log('Criteria files:', data))
  .catch(err => console.error('Criteria failed:', err));
```

## 可能的解决方案

### 方案 1: 重新部署 Edge Function (推荐)

如果你有权限访问 Supabase CLI:

```bash
# 部署 Edge Function
supabase functions deploy make-server-604ca09d

# 检查部署状态
supabase functions list
```

### 方案 2: 配置环境变量

如果测试显示仍然需要环境变量,请在 Supabase Dashboard 配置:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 方案 3: 检查 Supabase 项目设置

1. 进入 Supabase Dashboard
2. 检查 Edge Functions 是否启用
3. 检查是否有全局的认证策略
4. 查看 Edge Function 日志以获取详细错误信息

## 临时解决方案

如果无法修复 Edge Function,可以考虑:

1. **使用本地模拟数据** - 临时绕过后端调用
2. **直接使用 Supabase Client** - 跳过 Edge Function,直接操作数据库(需要配置 RLS)
3. **使用其他后端服务** - 如 Vercel Functions, Netlify Functions 等

## 下一步行动

1. ✅ 运行上面的测试代码
2. ✅ 查看浏览器控制台的具体错误
3. ✅ 检查 Supabase Dashboard 中的 Edge Function 日志
4. ✅ 如果 `/health` 和 `/test` 端点正常工作,说明 Edge Function 已部署
5. ✅ 如果 `/criteria` 端点仍然返回 401,说明需要配置环境变量或调整 Supabase 设置

## 联系我

如果以上步骤都无法解决问题,请提供:
- 浏览器控制台的完整错误信息
- Supabase Edge Function 日志
- 测试代码的返回结果

我会帮你进一步诊断问题!
