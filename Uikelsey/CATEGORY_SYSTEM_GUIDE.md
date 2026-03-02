# ✅ Category 分类 + Content Hash 防重复功能

## 🎯 功能说明

### **1. Category 分类系统**

根据上传页面和文件类型自动分类：

| 上传页面 | Category 值 |
|---------|-------------|
| Criteria Mapping / NIW Requirements | `evidence` |
| Personal Information - Resume | `resume` |
| Personal Information - Graduation Certificates | `graduation_certificates` |
| Personal Information - Employment Verification | `employment_verification` |
| Personal Information - Future Work Plan | `future_work_plan` |
| Form | `form` |

### **2. Content Hash 防重复**
- 自动生成文件的 SHA-256 hash
- 上传前检查相同 category 是否有重复文件
- 重复文件会被拒绝，不会显示在前端

---

## 📋 数据库配置步骤

### **步骤 1：运行 SQL**

在 Supabase SQL Editor 运行 `/update_category_column.sql` 的内容：

```sql
-- 添加 category 列（如果已有 evidence 列，可能需要先重命名）
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'evidence' 
CHECK (category IN (
  'evidence',
  'resume',
  'graduation_certificates',
  'employment_verification',
  'future_work_plan',
  'form'
));

-- 添加 content_hash 列
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- 创建索引（加速查询和重复检测）
CREATE INDEX IF NOT EXISTS idx_user_files_category ON user_files(category);
CREATE INDEX IF NOT EXISTS idx_user_files_content_hash ON user_files(content_hash);
CREATE INDEX IF NOT EXISTS idx_user_files_duplicate_check 
ON user_files(user_id, application_id, category, content_hash);
```

### **步骤 2：验证**

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_files' 
AND column_name IN ('category', 'content_hash');
```

应该看到：
| column_name | data_type | column_default |
|-------------|-----------|----------------|
| category | text | 'evidence'::text |
| content_hash | text | null |

---

## 🔧 代码使用方式

### **Criteria Mapping / NIW 上传**

```typescript
// 默认就是 'evidence'
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  criteria, 
  isSensitive
  // category 默认为 'evidence'
);
```

### **Personal Information 页面上传（按文件类型）**

```typescript
// Resume
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  [], 
  false,
  'resume'
);

// Graduation Certificates
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  [], 
  false,
  'graduation_certificates'
);

// Employment Verification
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  [], 
  false,
  'employment_verification'
);

// Future Work Plan
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  [], 
  false,
  'future_work_plan'
);
```

### **Form 页面上传**

```typescript
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  [], 
  false,
  'form'
);
```

### **按分类获取文件**

```typescript
// 只获取 evidence 类型的文件（Criteria Mapping）
const evidenceFiles = await criteriaService.getFiles(applicationId, 'evidence');

// 只获取 resume 文件
const resumeFiles = await criteriaService.getFiles(applicationId, 'resume');

// 获取所有 Personal Information 的文件
const personalInfoCategories = ['resume', 'graduation_certificates', 'employment_verification', 'future_work_plan'];
const allPersonalFiles = (await criteriaService.getFiles(applicationId))
  .filter(f => personalInfoCategories.includes(f.category || ''));

// 获取所有文件
const allFiles = await criteriaService.getFiles(applicationId);
```

---

## 🛡️ 重复检测机制

### **工作原理：**

```
用户上传文件
    ↓
生成 SHA-256 hash
    ↓
检查数据库：
  WHERE user_id = ?
  AND application_id = ?
  AND category = ?          ← 只在相同 category 检查
  AND content_hash = ?
    ↓
如果找到 → ❌ 拒绝上传
如果没有 → ✅ 继续上传
```

### **示例场景：**

**场景 1：允许（不同 category）**
```
1. 上传 resume.pdf 到 Resume (category: resume) ✅
2. 上传相同的 resume.pdf 到 Evidence (category: evidence) ✅
结果：两个都成功（category 不同）
```

**场景 2：拒绝（相同 category）**
```
1. 上传 resume.pdf 到 Resume (category: resume) ✅
2. 再次上传 resume.pdf 到 Resume (category: resume) ❌
结果：第二次被拒绝（相同 category 不允许重复）
```

**场景 3：允许（同名但不同内容）**
```
1. 上传 resume_v1.pdf 到 Resume ✅
2. 修改文件内容后上传 resume_v2.pdf 到 Resume ✅
结果：两个都成功（content_hash 不同）
```

---

## 📊 数据库表结构（最终版）

```sql
user_files
  - id (UUID, primary key)
  - user_id (UUID, foreign key → auth.users)
  - application_id (UUID)
  - file_name (TEXT)
  - file_url (TEXT)                    ← 文件在 Storage 的路径
  - file_size (BIGINT)
  - file_type (TEXT)
  - criteria (JSONB)
  - is_sensitive (BOOLEAN)
  - category (TEXT)                    ← 新增：分类字段
  - content_hash (TEXT)                ← 新增：文件 hash
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

---

## 🧪 测试步骤

### **1. 配置数据库**
运行 `/update_category_column.sql` 的 SQL

### **2. 刷新应用并上传文件**

#### **在 Criteria Mapping 上传：**
```
控制台应显示：
🔐 Generating file hash...
✅ No duplicate found, proceeding with upload
✅ Metadata saved to database table (category: evidence)
```

数据库中的 `category` 列应显示：`evidence`

#### **在 Personal Information - Resume 上传：**
```
控制台应显示：
✅ Metadata saved to database table (category: resume)
```

数据库中的 `category` 列应显示：`resume`

### **3. 测试重复检测**

1. 上传一个文件到 Resume
2. 再次上传相同文件到 Resume
3. 应该看到错误提示：
   ```
   ⚠️ Duplicate file detected in same category
   This file has already been uploaded in this category.
   ```

---

## 🔍 查询示例

### **按分类查看文件**

```sql
-- 查看所有 Personal Information 文件
SELECT file_name, category, created_at
FROM user_files
WHERE application_id = '<your-app-id>'
AND category IN ('resume', 'graduation_certificates', 'employment_verification', 'future_work_plan')
ORDER BY category, created_at DESC;

-- 只看 Resume
SELECT file_name, content_hash, created_at
FROM user_files
WHERE application_id = '<your-app-id>'
AND category = 'resume';

-- 查看所有分类的统计
SELECT category, COUNT(*) as file_count
FROM user_files
WHERE application_id = '<your-app-id>'
GROUP BY category;
```

### **查找重复文件（同一 category）**

```sql
SELECT 
  category,
  content_hash,
  COUNT(*) as count,
  STRING_AGG(file_name, ', ') as file_names
FROM user_files
WHERE application_id = '<your-app-id>'
GROUP BY category, content_hash
HAVING COUNT(*) > 1;
```

---

## ✅ 完成清单

- [ ] 运行 SQL 添加 `category` 和 `content_hash` 列
- [ ] 运行 SQL 创建索引
- [ ] 刷新应用页面
- [ ] 在 Criteria Mapping 上传文件（category 应为 `evidence`）
- [ ] 测试重复上传（应该被拒绝）
- [ ] 在 Supabase Dashboard 查看：
  - Storage → user-files → 看到文件 ✅
  - Database → user_files → category 列显示正确的值 ✅

---

## 🎉 完整的分类架构

```
user_files.category 的可能值：
├── evidence                    (Criteria Mapping / NIW)
├── resume                      (Personal Info)
├── graduation_certificates     (Personal Info)
├── employment_verification     (Personal Info)
├── future_work_plan           (Personal Info)
└── form                        (Form page)
```

每个 category 内部使用 `content_hash` 防止重复上传！
