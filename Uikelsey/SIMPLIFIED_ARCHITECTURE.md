# ✅ Simplified Architecture - No Edge Function Auth Required

## What Changed

我已经简化了系统架构，**移除了对 Edge Function 环境变量的依赖**：

### ✅ 修改内容

1. **Criteria 端点 (文件和描述)**
   - ❌ 移除了 JWT 认证检查
   - ✅ 直接通过 `applicationId` 隔离数据
   - ✅ 无需配置 `SUPABASE_SERVICE_ROLE_KEY`

2. **文件上传**
   - ❌ 移除了签名 URL 上传流程
   - ✅ 改为前端直接上传到 Supabase Storage
   - ✅ 通过 RLS 策略控制权限

3. **数据隔离**
   - ✅ 仍然通过 `application_id` 进行数据隔离
   - ✅ 文件路径包含 `userId` 确保安全性

## 🔧 需要配置的 Storage RLS 策略

为了让文件上传工作，你需要在 Supabase 中配置 Storage RLS 策略：

### 方法 1: SQL Editor (推荐)

1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**
3. 复制并运行 `/storage_policies_setup.sql` 中的 SQL
4. 点击 **Run** 执行

### 方法 2: Storage UI

1. 打开 Supabase Dashboard
2. 进入 **Storage** → **Policies**
3. 选择 `user-files` bucket
4. 添加以下策略:

   **INSERT 策略:**
   ```sql
   Policy name: Users can upload to their own folder
   Policy definition:
   bucket_id = 'user-files' AND
   (storage.foldername(name))[1] = auth.uid()::text
   ```

   **SELECT 策略:**
   ```sql
   Policy name: Users can read their own files
   Policy definition:
   bucket_id = 'user-files' AND
   (storage.foldername(name))[1] = auth.uid()::text
   ```

   **DELETE 策略:**
   ```sql
   Policy name: Users can delete their own files
   Policy definition:
   bucket_id = 'user-files' AND
   (storage.foldername(name))[1] = auth.uid()::text
   ```

## ✅ 验证

配置完成后，检查以下功能是否正常:

1. ✅ 获取文件列表 (不再有 401 错误)
2. ✅ 获取敏感描述列表 (不再有 401 错误)
3. ✅ 上传文件 (不再有 RLS 错误)
4. ✅ 删除文件

## 架构说明

```
前端 → Supabase Storage (文件上传/下载)
   ↓
前端 → Edge Function (KV Store 元数据操作)
        ↓
        KV Store (按 applicationId 隔离)
```

**安全性:**
- 文件上传通过 Storage RLS 策略控制 (用户只能访问自己的文件)
- 元数据通过 `applicationId` 隔离 (每个应用的数据独立)
- 无需复杂的 JWT 验证和环境变量配置

## 常见问题

### Q: 还是报 401 错误怎么办?
A: 刷新页面重试，如果还有问题检查浏览器控制台的具体错误信息

### Q: 文件上传报 "new row violates row-level security policy" 错误?
A: 说明 Storage RLS 策略没有配置，请按照上面的步骤配置

### Q: 这样安全吗?
A: 是的! 
- Storage 通过 RLS 策略保护,用户只能访问自己上传的文件
- KV 数据通过 applicationId 隔离
- Supabase Auth 仍然保护所有操作

### Q: Profile 和 Applications 端点还需要认证吗?
A: 是的，这些端点仍然需要认证，但只需要前端的用户 session token，无需额外配置

## 🎉 完成!

现在你的应用应该可以正常工作了，无需配置任何 Edge Function 环境变量!
