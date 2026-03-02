# ✅ Evidence 分类 + Content Hash 防重复功能

## 🎯 新功能说明

### **1. Evidence 分类**
根据上传页面自动分类文件：
- `evidence` - Criteria Mapping / NIW Requirements Mapping 上传
- `personal_information` - Personal Information 页面上传
- `form` - Form 页面上传

### **2. Content Hash 防重复**
- 自动生成文件的 SHA-256 hash
- 上传前检查相同 category 是否有重复文件
- 重复文件会被拒绝，不会显示在前端

---

## 📋 数据库配置步骤

### **步骤 1：添加新列**

在 Supabase SQL Editor 运行 `/add_evidence_and_hash_columns.sql` 的 SQL：

```sql
-- 添加 evidence 列
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS evidence TEXT DEFAULT 'evidence' 
CHECK (evidence IN ('evidence', 'personal_information', 'form'));

-- 添加 content_hash 列
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- 创建索引（加速重复检测）
CREATE INDEX IF NOT EXISTS idx_user_files_content_hash 
ON user_files(content_hash);

CREATE INDEX IF NOT EXISTS idx_user_files_duplicate_check 
ON user_files(user_id, application_id, evidence, content_hash);
```

### **步骤 2：验证列已添加**

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_files' 
AND column_name IN ('evidence', 'content_hash');
```

应该看到：
| column_name | data_type | column_default |
|-------------|-----------|----------------|
| evidence | text | 'evidence'::text |
| content_hash | text | null |

---

## 🔧 代码使用方式

### **在 Criteria Mapping 中上传**

```typescript
// 默认就是 'evidence'
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  criteria, 
  isSensitive
  // evidence 参数会自动设为 'evidence'
);
```

### **在 Personal Information 页面上传**

```typescript
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  criteria, 
  isSensitive,
  'personal_information' // 指定分类
);
```

### **在 Form 页面上传**

```typescript
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  criteria, 
  isSensitive,
  'form' // 指定分类
);
```

### **按分类获取文件**

```typescript
// 只获取 evidence 类型的文件
const evidenceFiles = await criteriaService.getFiles(
  applicationId, 
  'evidence'
);

// 只获取 personal_information 类型的文件
const personalFiles = await criteriaService.getFiles(
  applicationId, 
  'personal_information'
);

// 获取所有文件（不指定 evidenceFilter）
const allFiles = await criteriaService.getFiles(applicationId);
```

---

## 🛡️ 重复检测机制

### **工作原理：**

1. **上传前生成 Hash**
   ```
   用户选择文件 → 生成 SHA-256 hash
   ```

2. **检查重复**
   ```sql
   SELECT * FROM user_files 
   WHERE user_id = ? 
   AND application_id = ? 
   AND evidence = ?      -- 只在相同分类中检查
   AND content_hash = ?
   ```

3. **结果：**
   - ✅ **无重复** → 正常上传
   - ❌ **有重复** → 拒绝上传，提示错误

### **错误提示：**

```
"This file has already been uploaded in this category. 
Duplicate files are not allowed."
```

---

## 📊 数据库表结构（更新后）

```sql
user_files
  - id (UUID, primary key)
  - user_id (UUID)
  - application_id (UUID)
  - file_name (TEXT)
  - file_url (TEXT)
  - file_size (BIGINT)
  - file_type (TEXT)
  - criteria (JSONB)
  - is_sensitive (BOOLEAN)
  - evidence (TEXT)           ← 新增：分类字段
  - content_hash (TEXT)        ← 新增：文件 hash
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

---

## 🧪 测试场景

### **场景 1：正常上传**

1. 在 Criteria Mapping 上传 `resume.pdf`
2. 控制台显示：
   ```
   🔐 Generating file hash...
   ✅ No duplicate found, proceeding with upload
   📤 Uploading file to storage...
   ✅ Metadata saved to database table (evidence: evidence)
   ```

### **场景 2：重复上传（同一分类）**

1. 再次在 Criteria Mapping 上传同一个 `resume.pdf`
2. 控制台显示：
   ```
   🔐 Generating file hash...
   ⚠️ Duplicate file detected in same category
   ❌ This file has already been uploaded in this category
   ```

### **场景 3：跨分类上传（允许）**

1. 在 Criteria Mapping 上传 `resume.pdf` (evidence)
2. 在 Personal Information 上传相同的 `resume.pdf` (personal_information)
3. ✅ **两次都成功**（因为分类不同）

---

## 🔍 查询示例

### **查看所有文件及其分类**

```sql
SELECT 
  file_name,
  evidence,
  content_hash,
  created_at
FROM user_files
WHERE application_id = '<your-app-id>'
ORDER BY created_at DESC;
```

### **查找重复文件**

```sql
SELECT 
  content_hash,
  evidence,
  COUNT(*) as count,
  STRING_AGG(file_name, ', ') as file_names
FROM user_files
WHERE application_id = '<your-app-id>'
GROUP BY content_hash, evidence
HAVING COUNT(*) > 1;
```

---

## ✅ 完成清单

- [ ] 运行 SQL 添加 `evidence` 和 `content_hash` 列
- [ ] 运行 SQL 创建索引
- [ ] 刷新应用页面
- [ ] 测试上传文件（应该看到 hash 生成日志）
- [ ] 测试重复上传（应该被拒绝）
- [ ] 在数据库中验证数据

---

## 🎉 完成！

现在你的应用有了：

1. ✅ **自动分类** - 根据页面自动标记文件类型
2. ✅ **防重复** - 同一分类中不允许重复文件
3. ✅ **跨分类** - 同一文件可以在不同分类中上传
4. ✅ **高性能** - 使用索引优化查询速度
