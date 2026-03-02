# ✅ Category 系统 - 最终命名规范

## 🎯 完整的 Category 列表（确切命名）

| Category 值 | 对应页面/功能 | 前端字段 |
|------------|--------------|---------|
| `evidence` | Criteria Mapping / NIW | - |
| `resumeCV` | Personal Info - Resume / CV | `uploads.degrees` |
| `graduationcertificates` | Personal Info - Graduation Certificates | `uploads.certificates` |
| `employmentverification` | Personal Info - Employment Verification | `uploads.employment` |
| `futureplan` | Personal Info - Future Work Plan | `uploads.futurePlan` |
| `other_personalinfo` | Personal Info - Other Documents | `uploads.others` |
| `form` | Form page | - |

---

## 📋 数据库配置

### **运行 SQL**

在 Supabase SQL Editor 运行 `/add_category_final_naming.sql`：

```sql
-- 添加 category 列
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'evidence';

-- 添加 content_hash 列
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- 删除旧的 CHECK 约束（如果存在）
ALTER TABLE user_files DROP CONSTRAINT IF EXISTS user_files_category_check;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_files_category ON user_files(category);
CREATE INDEX IF NOT EXISTS idx_user_files_content_hash ON user_files(content_hash);
CREATE INDEX IF NOT EXISTS idx_user_files_duplicate_check 
ON user_files(user_id, application_id, category, content_hash);
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
  isSensitive,
  'evidence'
);
```

### **Personal Information 页面上传**

```typescript
// Resume / CV
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  [], 
  false,
  'resumeCV'  // ✅ 使用驼峰式
);

// Graduation Certificates
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  [], 
  false,
  'graduationcertificates'  // ✅ 全小写连在一起
);

// Employment Verification
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  [], 
  false,
  'employmentverification'  // ✅ 全小写连在一起
);

// Future Work Plan
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  [], 
  false,
  'futureplan'  // ✅ 全小写连在一起
);

// Other Documents
await criteriaService.uploadAndSaveFile(
  file, 
  applicationId, 
  [], 
  false,
  'other_personalinfo'  // ✅ 下划线连接
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

---

## 📍 在 PersonalInformation 组件中集成

### **修改 handleFileChange 方法**

```typescript
// 在 PersonalInformation.tsx 中
const handleFileChange = async (category: keyof typeof uploads, e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
    const newFile = e.target.files[0];
    
    // 映射前端字段到数据库 category
    const categoryMap = {
      'degrees': 'resumeCV',
      'certificates': 'graduationcertificates',
      'employment': 'employmentverification',
      'futurePlan': 'futureplan',
      'others': 'other_personalinfo'
    };
    
    const dbCategory = categoryMap[category];
    
    // 上传到服务
    try {
      const uploadedFile = await criteriaService.uploadAndSaveFile(
        newFile,
        applicationId,
        [],
        false,
        dbCategory
      );
      
      // 更新本地状态
      setUploads(prev => ({
        ...prev,
        [category]: [newFile]
      }));
      
      console.log('✅ File uploaded with category:', dbCategory);
    } catch (error) {
      console.error('❌ Upload failed:', error);
      alert(error.message);
    }
  }
};
```

---

## 🔍 按 Category 查询文件

### **获取特定类型的文件**

```typescript
// 获取所有 Personal Info 的文件
const personalInfoCategories = [
  'resumeCV',
  'graduationcertificates',
  'employmentverification',
  'futureplan',
  'other_personalinfo'
];

const allFiles = await criteriaService.getFiles(applicationId);
const personalInfoFiles = allFiles.filter(f => 
  personalInfoCategories.includes(f.category || '')
);

// 只获取 Resume / CV
const resumeFiles = await criteriaService.getFiles(applicationId, 'resumeCV');

// 只获取 Evidence
const evidenceFiles = await criteriaService.getFiles(applicationId, 'evidence');
```

---

## 🛠️ 修改文件的 Category

### **单个文件修改**

```typescript
// 将文件从 'resumeCV' 改为 'other_personalinfo'
await criteriaService.updateFileCategory(
  fileId,
  'other_personalinfo',
  applicationId
);
```

### **批量修改**

```typescript
// 将多个文件的 category 改为 'evidence'
const fileIds = ['file-1', 'file-2', 'file-3'];

await Promise.all(
  fileIds.map(id => 
    criteriaService.updateFileCategory(id, 'evidence', applicationId)
  )
);
```

---

## 📊 SQL 查询示例

### **查看所有 category 的统计**

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

结果示例：
```
category                  | file_count | total_size_bytes
--------------------------|------------|------------------
evidence                  | 15         | 25600000
resumeCV                  | 2          | 1500000
graduationcertificates    | 3          | 2800000
employmentverification    | 1          | 850000
futureplan                | 1          | 950000
other_personalinfo        | 2          | 1200000
form                      | 5          | 3500000
```

### **按 category 查询文件**

```sql
-- Personal Information 的所有文件
SELECT file_name, category, created_at
FROM user_files
WHERE application_id = '<your-app-id>'
AND category IN (
  'resumeCV', 
  'graduationcertificates', 
  'employmentverification', 
  'futureplan', 
  'other_personalinfo'
)
ORDER BY category, created_at DESC;

-- 只看 Evidence 文件
SELECT file_name, file_size, created_at
FROM user_files
WHERE application_id = '<your-app-id>'
AND category = 'evidence';
```

### **修改 category（直接通过 SQL）**

```sql
-- 将某个文件的 category 改为 'evidence'
UPDATE user_files
SET category = 'evidence', updated_at = NOW()
WHERE id = '<file-id>';

-- 批量修改
UPDATE user_files
SET category = 'other_personalinfo', updated_at = NOW()
WHERE application_id = '<your-app-id>'
AND category = 'resumeCV';
```

---

## 🎨 UI 组件示例

### **Category 下拉选择器**

```typescript
const CATEGORY_OPTIONS = [
  { value: 'evidence', label: 'Evidence (Criteria Mapping)' },
  { value: 'resumeCV', label: 'Resume / CV' },
  { value: 'graduationcertificates', label: 'Graduation Certificates' },
  { value: 'employmentverification', label: 'Employment Verification' },
  { value: 'futureplan', label: 'Future Work Plan' },
  { value: 'other_personalinfo', label: 'Other Personal Info' },
  { value: 'form', label: 'Form' }
];

function CategorySelector({ currentCategory, onUpdate, fileId, applicationId }) {
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    try {
      await criteriaService.updateFileCategory(fileId, newCategory, applicationId);
      onUpdate(newCategory);
      alert('✅ Category updated!');
    } catch (error) {
      alert('❌ Failed to update category');
    }
  };

  return (
    <select value={currentCategory} onChange={handleChange}>
      {CATEGORY_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
```

---

## 🔄 Category 映射关系

### **前端字段 → 数据库 Category**

```typescript
export const FRONTEND_TO_DB_CATEGORY = {
  'degrees': 'resumeCV',
  'certificates': 'graduationcertificates',
  'employment': 'employmentverification',
  'futurePlan': 'futureplan',
  'others': 'other_personalinfo'
} as const;

export const DB_TO_FRONTEND_CATEGORY = {
  'resumeCV': 'degrees',
  'graduationcertificates': 'certificates',
  'employmentverification': 'employment',
  'futureplan': 'futurePlan',
  'other_personalinfo': 'others'
} as const;

// 使用示例
const dbCategory = FRONTEND_TO_DB_CATEGORY['degrees']; // 'resumeCV'
const frontendField = DB_TO_FRONTEND_CATEGORY['resumeCV']; // 'degrees'
```

---

## ✅ 完成清单

- [ ] 运行 `/add_category_final_naming.sql` 的 SQL
- [ ] 验证 `category` 和 `content_hash` 列已添加
- [ ] 在 `PersonalInformation.tsx` 中添加 category 映射
- [ ] 测试上传文件（使用正确的 category 名称）
- [ ] 测试修改 category 功能
- [ ] 在 Supabase Dashboard 验证数据：
  - Storage → user-files → 看到文件 ✅
  - Database → user_files → category 列显示正确值 ✅
  - Database → user_files → content_hash 有值 ✅

---

## 📁 完整的 Category 架构

```
user_files.category 的所有标准值：
├── evidence                    (Criteria Mapping / NIW)
├── resumeCV                    (Personal Info - Resume / CV)
├── graduationcertificates      (Personal Info - Graduation Certificates)
├── employmentverification      (Personal Info - Employment Verification)
├── futureplan                  (Personal Info - Future Work Plan)
├── other_personalinfo          (Personal Info - Other Documents)
└── form                        (Form page)
```

---

## 🎯 API 快速参考

```typescript
// 上传文件
await criteriaService.uploadAndSaveFile(file, appId, [], false, 'resumeCV');

// 获取文件
const files = await criteriaService.getFiles(appId, 'resumeCV');

// 修改 category
await criteriaService.updateFileCategory(fileId, 'evidence', appId);

// 同时修改 category 和 criteria
await criteriaService.updateFileMetadata(
  fileId, 
  { category: 'evidence', criteria: ['c1'] }, 
  appId
);

// 删除文件
await criteriaService.deleteFile(fileId, appId);
```

---

## 🚀 完成！

现在你有了：
1. ✅ 明确的 category 命名规范
2. ✅ 完整的上传和修改功能
3. ✅ 前端字段到数据库的映射关系
4. ✅ SHA-256 hash 防重复机制
