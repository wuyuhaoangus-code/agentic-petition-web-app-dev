# ✅ Category 系统 - 无限制版本 + 修改功能

## 🎯 改动说明

1. ✅ **移除 CHECK 约束** - category 可以是任意字符串值
2. ✅ **添加修改功能** - 可以修改已上传文件的 category

---

## 📋 数据库配置

### **运行 SQL（无 CHECK 约束）**

在 Supabase SQL Editor 运行 `/add_category_no_constraint.sql`：

```sql
-- 添加 category 列（无 CHECK 约束）
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'evidence';

-- 添加 content_hash 列
ALTER TABLE user_files 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_files_category ON user_files(category);
CREATE INDEX IF NOT EXISTS idx_user_files_content_hash ON user_files(content_hash);
CREATE INDEX IF NOT EXISTS idx_user_files_duplicate_check 
ON user_files(user_id, application_id, category, content_hash);
```

如果已经有 CHECK 约束，先删除：
```sql
ALTER TABLE user_files DROP CONSTRAINT IF EXISTS user_files_category_check;
```

---

## 🔧 新增的修改功能

### **1. 只修改 category**

```typescript
import { criteriaService } from './services/criteriaService';

// 修改文件的 category
await criteriaService.updateFileCategory(
  fileId,           // 文件 ID
  'new_category',   // 新的 category 值（任意字符串）
  applicationId
);
```

### **2. 只修改 criteria**

```typescript
// 修改文件的 criteria（已有功能）
await criteriaService.updateFileCriteria(
  fileId,
  ['criterion1', 'criterion2'],
  applicationId
);
```

### **3. 同时修改 category 和 criteria**

```typescript
// 同时修改两个字段
await criteriaService.updateFileMetadata(
  fileId,
  {
    category: 'new_category',
    criteria: ['criterion1', 'criterion2']
  },
  applicationId
);

// 只修改其中一个
await criteriaService.updateFileMetadata(
  fileId,
  { category: 'only_change_category' },
  applicationId
);

await criteriaService.updateFileMetadata(
  fileId,
  { criteria: ['only_change_criteria'] },
  applicationId
);
```

---

## 📍 在前端组件中使用

### **示例：在文件列表中添加修改按钮**

```typescript
// 在你的组件中
import { criteriaService } from '../services/criteriaService';
import { useState } from 'react';

function FileList({ files, applicationId }) {
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');

  const handleUpdateCategory = async (fileId: string) => {
    try {
      await criteriaService.updateFileCategory(fileId, newCategory, applicationId);
      alert('Category updated successfully!');
      setEditingFileId(null);
      // 刷新文件列表
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update category');
    }
  };

  return (
    <div>
      {files.map(file => (
        <div key={file.id}>
          <span>{file.name}</span>
          
          {editingFileId === file.id ? (
            <div>
              <input 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category"
              />
              <button onClick={() => handleUpdateCategory(file.id)}>
                Save
              </button>
              <button onClick={() => setEditingFileId(null)}>
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <span>Category: {file.category}</span>
              <button onClick={() => {
                setEditingFileId(file.id);
                setNewCategory(file.category || '');
              }}>
                Edit Category
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 💡 常见使用场景

### **场景 1：文件上传时指定自定义 category**

```typescript
// 可以使用任意字符串作为 category
await criteriaService.uploadAndSaveFile(
  file,
  applicationId,
  criteria,
  false,
  'my_custom_category'  // 任意字符串
);
```

### **场景 2：上传后修改 category**

```typescript
// 先上传文件
const uploadedFile = await criteriaService.uploadAndSaveFile(
  file,
  applicationId,
  [],
  false,
  'initial_category'
);

// 稍后修改 category
await criteriaService.updateFileCategory(
  uploadedFile.id,
  'updated_category',
  applicationId
);
```

### **场景 3：批量修改多个文件的 category**

```typescript
const fileIds = ['file-id-1', 'file-id-2', 'file-id-3'];

await Promise.all(
  fileIds.map(fileId => 
    criteriaService.updateFileCategory(fileId, 'new_category', applicationId)
  )
);

console.log('✅ All files updated');
```

---

## 🔍 查询和筛选

### **按任意 category 查询**

```typescript
// 获取特定 category 的文件
const files = await criteriaService.getFiles(applicationId, 'my_custom_category');

// 获取所有文件
const allFiles = await criteriaService.getFiles(applicationId);

// 在前端过滤
const customCategoryFiles = allFiles.filter(f => f.category === 'my_custom_category');
```

### **SQL 查询示例**

```sql
-- 查看所有不同的 category 值
SELECT DISTINCT category, COUNT(*) as count
FROM user_files
WHERE application_id = '<your-app-id>'
GROUP BY category
ORDER BY count DESC;

-- 查询特定 category 的文件
SELECT file_name, category, created_at
FROM user_files
WHERE application_id = '<your-app-id>'
AND category = 'my_custom_category';

-- 修改 category（通过 SQL）
UPDATE user_files
SET category = 'new_category', updated_at = NOW()
WHERE id = '<file-id>';
```

---

## 🎨 UI 设计建议

### **下拉选择器 + 自定义输入**

```typescript
const COMMON_CATEGORIES = [
  'evidence',
  'degrees',
  'certificates',
  'employment',
  'futurePlan',
  'others',
  'form'
];

function CategorySelector({ currentCategory, onUpdate }) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  return (
    <div>
      {!isCustom ? (
        <>
          <select 
            value={currentCategory}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setIsCustom(true);
              } else {
                onUpdate(e.target.value);
              }
            }}
          >
            {COMMON_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="__custom__">Custom...</option>
          </select>
        </>
      ) : (
        <>
          <input 
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Enter custom category"
          />
          <button onClick={() => onUpdate(customValue)}>Save</button>
          <button onClick={() => setIsCustom(false)}>Cancel</button>
        </>
      )}
    </div>
  );
}
```

---

## ✅ 完成清单

- [ ] 运行 SQL 添加 category（无 CHECK 约束）
- [ ] 运行 SQL 添加 content_hash
- [ ] 运行 SQL 创建索引
- [ ] 刷新应用页面
- [ ] 测试上传文件（使用任意 category 值）
- [ ] 测试修改 category 功能
- [ ] 在 Supabase Dashboard 验证数据

---

## 📊 API 总结

| 功能 | 方法 | 说明 |
|-----|------|------|
| 上传文件 | `uploadAndSaveFile(file, appId, criteria, isSensitive, category)` | category 可以是任意字符串 |
| 获取文件 | `getFiles(appId, categoryFilter?)` | 可选按 category 筛选 |
| 修改 category | `updateFileCategory(fileId, category, appId)` | 只修改 category |
| 修改 criteria | `updateFileCriteria(fileId, criteria, appId)` | 只修改 criteria |
| 同时修改 | `updateFileMetadata(fileId, {category?, criteria?}, appId)` | 灵活修改 |
| 删除文件 | `deleteFile(fileId, appId)` | 删除文件和元数据 |

---

现在你可以：
1. ✅ 使用任意字符串作为 category
2. ✅ 随时修改已上传文件的 category
3. ✅ 同时修改 category 和 criteria
