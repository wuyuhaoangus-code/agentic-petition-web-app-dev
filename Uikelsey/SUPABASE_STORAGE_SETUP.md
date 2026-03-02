# Supabase Storage 配置指南

## 问题：为什么上传的文件在 Supabase 没有显示？

当前应用使用 **localStorage + Supabase Storage** 混合架构：
- ✅ **文件元数据** → 保存在浏览器 localStorage
- ✅ **实际文件** → 上传到 Supabase Storage 的 `user-files` bucket

如果文件没有显示在 Supabase，可能是以下原因：

---

## ✅ 解决方案 1：自动创建 Bucket

**最新代码已自动处理！**

代码现在会在第一次上传文件时自动检查并创建 `user-files` bucket：

```typescript
// 在 criteriaService.ts 中
await ensureBucketExists(); // 自动创建 bucket
```

**查看控制台日志：**
打开浏览器开发者工具 (F12) → Console，你应该看到：

```
🔧 Checking if user-files bucket exists...
✅ user-files bucket already exists
或
📦 Creating user-files bucket...
✅ user-files bucket created successfully!
```

---

## ✅ 解决方案 2：手动配置 Storage RLS 策略

### **为什么需要 RLS？**

Supabase Storage 默认有**行级安全性 (Row Level Security, RLS)** 保护。没有正确的策略，即使 bucket 存在，文件也无法上传。

### **配置步骤：**

1. **打开 Supabase Dashboard**  
   访问：https://supabase.com/dashboard

2. **进入 SQL Editor**  
   左侧菜单 → SQL Editor → New Query

3. **复制并执行以下 SQL：**

```sql
-- ============================================
-- Storage RLS Policies for user-files bucket
-- ============================================

-- 1. 允许用户上传文件到自己的文件夹
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. 允许用户读取自己的文件
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. 允许用户删除自己的文件
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

4. **点击 "Run" 按钮执行**

---

## 🔍 验证配置是否成功

### **1. 检查 Bucket 是否存在**

Supabase Dashboard → Storage → 应该看到 `user-files` bucket

### **2. 检查 RLS 策略**

Supabase Dashboard → Storage → user-files → Policies

应该看到 3 个策略：
- ✅ Users can upload to their own folder
- ✅ Users can read their own files
- ✅ Users can delete their own files

### **3. 测试上传**

1. 在应用中上传一个文件
2. 打开浏览器控制台，查看日志：
   ```
   📤 Uploading file to storage: <user_id>/<app_id>/<timestamp>_<filename>
   ✅ File uploaded successfully
   ✅ Metadata saved to localStorage
   ```

3. 在 Supabase Dashboard → Storage → user-files 中查看文件

---

## 🚨 常见错误及解决方案

### **错误 1: "new row violates row-level security policy"**

**原因：** RLS 策略没有配置  
**解决：** 执行上面的 SQL 创建策略

### **错误 2: "Bucket not found"**

**原因：** `user-files` bucket 不存在  
**解决：** 刷新页面，代码会自动创建；或手动在 Dashboard 创建

### **错误 3: "User not authenticated"**

**原因：** 用户没有登录  
**解决：** 确保用户已登录，检查 `supabase.auth.getUser()` 返回值

### **错误 4: "File size exceeds limit"**

**原因：** 文件超过 20MB  
**解决：** 压缩文件或修改 `criteriaService.ts` 中的 `fileSizeLimit`

---

## 📊 查看上传的文件

### **在 Supabase Dashboard 中查看：**

1. Storage → user-files
2. 文件按用户 ID 分组：`<user_id>/<application_id>/<filename>`

### **在应用中查看：**

文件列表存储在 localStorage，键名格式：
```
dreamcard_file_<application_id>_<file_id>
```

打开浏览器控制台：
```javascript
// 查看所有文件
Object.keys(localStorage).filter(k => k.startsWith('dreamcard_file_'))
```

---

## 🎯 快速检查清单

- [ ] `user-files` bucket 已创建（自动或手动）
- [ ] RLS 策略已配置（3 个策略）
- [ ] 用户已登录（有 auth.uid()）
- [ ] 文件类型正确（PDF, DOCX, PNG, JPG）
- [ ] 文件大小 ≤ 20MB
- [ ] 浏览器控制台没有错误

完成以上步骤后，文件应该能正常上传到 Supabase Storage！
