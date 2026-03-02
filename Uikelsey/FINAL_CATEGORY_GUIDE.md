# ✅ 完整的 Category 分类系统（基于前端实际分类）

## 🎯 完整的 Category 列表

根据前端 `PersonalInformation.tsx` 的实际命名：

| Category 值 | 对应页面/功能 | 前端字段名 |
|------------|--------------|-----------|
| `evidence` | Criteria Mapping / NIW Requirements Mapping | - |
| `degrees` | Personal Information - Resume / CV | `uploads.degrees` |
| `certificates` | Personal Information - Graduation Certificates | `uploads.certificates` |
| `employment` | Personal Information - Employment Verification | `uploads.employment` |
| `futurePlan` | Personal Information - Future Work Plan | `uploads.futurePlan` |
| `others` | Personal Information - Other Documents | `uploads.others` |
| `form` | Form page | - |

---

## 📋 数据库配置

### **步骤 1：运行 SQL**

在 Supabase SQL Editor 运行 `/add_category_column_final.sql`：

```sql
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'evidence' 
CHECK (category IN (
  'evidence',
  'degrees',
  'certificates',
  'employment',
  'futurePlan',
  'others',
  'form'
));

ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

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

---

## 🔧 代码使用方式

### **Criteria Mapping / NIW 上传**

```typescript
// 默认为 'evidence'
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  criteria, 
  isSensitive
);
```

### **Personal Information 页面上传**

```typescript
// Resume / CV
await criteriaService.uploadAndSaveFile(file, applicationId, [], false, 'degrees');

// Graduation Certificates
await criteriaService.uploadAndSaveFile(file, applicationId, [], false, 'certificates');

// Employment Verification
await criteriaService.uploadAndSaveFile(file, applicationId, [], false, 'employment');

// Future Work Plan
await criteriaService.uploadAndSaveFile(file, applicationId, [], false, 'futurePlan');

// Other Documents
await criteriaService.uploadAndSaveFile(file, applicationId, [], false, 'others');
```

### **Form 页面上传**

```typescript
await criteriaService.uploadAndSaveFile(file, applicationId, [], false, 'form');
```

### **按分类获取文件**

```typescript
// 只获取 evidence 类型的文件
const evidenceFiles = await criteriaService.getFiles(applicationId, 'evidence');

// 只获取 Resume
const resumeFiles = await criteriaService.getFiles(applicationId, 'degrees');

// 获取所有 Personal Information 的文件
const personalCategories: Array<'degrees' | 'certificates' | 'employment' | 'futurePlan' | 'others'> = 
  ['degrees', 'certificates', 'employment', 'futurePlan', 'others'];

const allFiles = await criteriaService.getFiles(applicationId);
const personalFiles = allFiles.filter(f => personalCategories.includes(f.category as any));

// 获取所有文件（不指定 filter）
const allFiles = await criteriaService.getFiles(applicationId);
```

---

## 🛡️ 重复检测机制

### **工作原理：**

1. 上传文件 → 生成 SHA-256 hash
2. 检查数据库：
   ```sql
   WHERE user_id = ? 
   AND application_id = ? 
   AND category = ?        ← 只在相同 category 检查
   AND content_hash = ?
   ```
3. 如果找到相同 hash → ❌ 拒绝
4. 如果没有 → ✅ 允许上传

### **示例场景：**

**✅ 允许（不同 category）**
```
1. 上传 resume.pdf 到 Personal Info - Resume (category: degrees)
2. 上传相同的 resume.pdf 到 Criteria Mapping (category: evidence)
结果：两个都成功
```

**❌ 拒绝（相同 category）**
```
1. 上传 resume.pdf 到 Personal Info - Resume (category: degrees)
2. 再次上传 resume.pdf 到 Personal Info - Resume (category: degrees)
结果：第二次被拒绝
```

---

## 📊 数据库表结构

```sql
user_files
  - id (UUID)
  - user_id (UUID)
  - application_id (UUID)
  - file_name (TEXT)
  - file_url (TEXT)
  - file_size (BIGINT)
  - file_type (TEXT)
  - criteria (JSONB)
  - is_sensitive (BOOLEAN)
  - category (TEXT)                    ← 新增
    CHECK IN ('evidence', 'degrees', 'certificates', 'employment', 'futurePlan', 'others', 'form')
  - content_hash (TEXT)                ← 新增
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

---

## 🔍 常用查询

### **查看所有分类的统计**

```sql
SELECT 
  category,
  COUNT(*) as file_count,
  SUM(file_size) as total_size_bytes
FROM user_files
WHERE application_id = '<your-app-id>'
GROUP BY category
ORDER BY category;
```

### **按分类查看文件**

```sql
-- Personal Information 的所有文件
SELECT file_name, category, created_at
FROM user_files
WHERE application_id = '<your-app-id>'
AND category IN ('degrees', 'certificates', 'employment', 'futurePlan', 'others')
ORDER BY category, created_at DESC;

-- 只看 Resume / CV
SELECT file_name, content_hash, created_at
FROM user_files
WHERE application_id = '<your-app-id>'
AND category = 'degrees';
```

### **查找重复文件**

```sql
SELECT 
  category,
  content_hash,
  COUNT(*) as duplicate_count,
  STRING_AGG(file_name, ', ') as file_names
FROM user_files
WHERE application_id = '<your-app-id>'
GROUP BY category, content_hash
HAVING COUNT(*) > 1;
```

---

## 🧪 测试步骤

### **1. 配置数据库**
```bash
# 在 Supabase SQL Editor 运行
/add_category_column_final.sql
```

### **2. 测试 Criteria Mapping 上传**
```
1. 刷新页面
2. 在 Criteria Mapping 上传文件
3. 控制台显示：
   🔐 Generating file hash...
   ✅ No duplicate found, proceeding with upload
   ✅ Metadata saved to database table (category: evidence)
4. 数据库检查：category = 'evidence'
```

### **3. 测试 Personal Information 上传**
```
1. 在 Resume / CV 上传文件
2. 控制台显示：category: degrees
3. 数据库检查：category = 'degrees'

4. 在 Graduation Certificates 上传文件
5. 数据库检查：category = 'certificates'
```

### **4. 测试重复检测**
```
1. 上传 resume.pdf 到 Resume (degrees)
2. 再次上传相同文件
3. 应该看到错误：
   "This file has already been uploaded in this category."
```

---

## ✅ 完成清单

- [ ] 运行 SQL 添加 `category` 和 `content_hash` 列
- [ ] 运行 SQL 创建索引
- [ ] 刷新应用页面
- [ ] 测试 Criteria Mapping 上传（category 应为 `evidence`）
- [ ] 测试 Personal Information 各类别上传
- [ ] 测试重复上传（应该被拒绝）
- [ ] 在 Supabase Dashboard 验证：
  - Storage → user-files → 看到文件 ✅
  - Database → user_files → category 列显示正确 ✅
  - Database → user_files → content_hash 有值 ✅

---

## 📁 完整的 Category 架构

```
user_files.category 的所有可能值：
├── evidence           (Criteria Mapping / NIW)
├── degrees            (Personal Info - Resume / CV)
├── certificates       (Personal Info - Graduation Certificates)
├── employment         (Personal Info - Employment Verification)
├── futurePlan         (Personal Info - Future Work Plan)
├── others             (Personal Info - Other Documents)
└── form               (Form page)
```

每个 category 内部使用 `content_hash` 防止重复上传！
