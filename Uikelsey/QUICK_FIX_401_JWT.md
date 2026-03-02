# 🚨 快速修复指南: 401 Invalid JWT 错误

## 问题
```
❌ Response status: 401
❌ Error: Invalid JWT
```

## 根本原因
Edge Function 缺少 `SUPABASE_SERVICE_ROLE_KEY` 环境变量

## 🎯 快速修复步骤 (5分钟)

### 1️⃣ 获取 Service Role Key

1. 打开 Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/mgbftnkxmbasanzfdpax
   ```

2. 导航: `Project Settings` → `API`

3. 在 "Project API keys" 部分,复制 `service_role` key
   - ⚠️ 这是敏感信息,不要分享或提交到 Git!

### 2️⃣ 配置 Edge Function 环境变量

**选项 A: 通过 Supabase CLI (推荐)**

如果你有 Supabase CLI:

```bash
# 设置 secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=你的service_role_key

# 验证
supabase secrets list
```

**选项 B: 通过 Dashboard (如果 CLI 不可用)**

1. Supabase Dashboard → `Edge Functions`
2. 点击 `make-server-604ca09d` 函数
3. 找到 "Secrets" 或 "Environment Variables" 部分
4. 添加:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (粘贴你的 service_role key)
5. 保存

### 3️⃣ 等待并测试

1. ⏱️ 等待 1-2 分钟让更改生效
2. 刷新你的应用页面
3. 查看控制台,应该看到:
   ```
   ✅ Response status: 200
   ✅ Profile data received
   ```

## 🔍 验证配置

### 方法 1: 使用诊断面板
1. 登录管理面板
2. 侧边栏 → `Diagnostics` (活动图标)
3. 查看 "Profile Endpoint" 检查结果

### 方法 2: 查看 Edge Function 日志
1. Supabase Dashboard → `Edge Functions`
2. 点击 `make-server-604ca09d`
3. 查看 `Logs` 标签
4. 如果配置正确,不应该看到 JWT 错误

## 📋 完整的必需环境变量

Edge Function 应该有这些环境变量:

| 变量 | 状态 | 说明 |
|-----|------|------|
| `SUPABASE_URL` | ✅ 自动 | 项目 URL |
| `SUPABASE_ANON_KEY` | ✅ 自动 | 公开密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ 手动 | **必须添加** |

## ⚠️ 重要注意事项

1. **Service Role Key 安全**:
   - 只在服务器端(Edge Function)使用
   - 永远不要在客户端代码中使用
   - 不要提交到版本控制系统

2. **等待时间**:
   - 更改环境变量后需要 1-2 分钟生效
   - 如果立即测试可能仍然失败

3. **验证方式**:
   - 使用诊断面板查看详细状态
   - 查看浏览器控制台的日志
   - 检查 Edge Function 日志

## 🆘 仍然失败?

如果按照上述步骤操作后仍然看到 401 错误:

1. **检查 profiles 表是否存在**:
   ```sql
   -- 在 Supabase SQL Editor 中运行
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'profiles';
   ```

2. **检查 Edge Function 部署状态**:
   - Dashboard → Edge Functions → 查看部署日志

3. **重新部署 Edge Function**:
   ```bash
   supabase functions deploy make-server-604ca09d
   ```

4. **查看完整文档**: 参考 `/PROFILE_TROUBLESHOOTING.md`

## ✅ 成功标志

配置成功后,你应该看到:

```javascript
// 浏览器控制台
🔵 Fetching profile from: https://...
🔵 User ID: 518afa3b-270c-4fbd-a94e-9d5d709c607e
🔵 Response status: 200  // ✅ 不再是 401!
✅ Profile data received: {} // 或者有数据的对象
```

然后你就可以:
- ✅ 查看和编辑个人信息
- ✅ 保存 profile 数据
- ✅ 刷新后数据持久化

---

**创建时间**: 2026-02-13  
**项目**: DreamCardAI Internal Dashboard  
**作者**: Figma Make Assistant
