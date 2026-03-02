# ✅ 文件上传到 Storage + 更新 user_files 表

## 🎉 已完成的修改

代码已经更新，现在文件上传流程如下：

```
用户上传文件
    ↓
1. 文件本身 → Supabase Storage (user-files bucket) ✅
    ↓
2. 文件元数据 → user_files 数据库表 ✅
```

---

## 📋 必须配置：user_files 表的 RLS 策略

### **步骤 1：打开 Supabase SQL Editor**

1. 登录 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目
3. 左侧菜单 → **SQL Editor** → **New Query**

### **步骤 2：执行以下 SQL**

复制并运行 `/user_files_rls_policies.sql` 中的 SQL：

```sql
-- 1. 启用 RLS
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

-- 2. 查看权限
CREATE POLICY "Users can view own files"
ON user_files FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 3. 插入权限
CREATE POLICY "Users can insert own files"
ON user_files FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. 更新权限
CREATE POLICY "Users can update own files"
ON user_files FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. 删除权限
CREATE POLICY "Users can delete own files"
ON user_files FOR DELETE TO authenticated
USING (auth.uid() = user_id);
```

### **步骤 3：点击 "Run" 执行**

---

## 🔍 验证配置

### **检查 RLS 策略：**

Supabase Dashboard → **Database** → **user_files** 表 → **Policies** 标签

应该看到 4 个策略：
| Policy Name | Command | Applied To |
|------------|---------|------------|
| Users can view own files | SELECT | authenticated |
| Users can insert own files | INSERT | authenticated |
| Users can update own files | UPDATE | authenticated |
| Users can delete own files | DELETE | authenticated |

---

## 🧪 测试上传

### **1. 刷新应用并登录**

### **2. 上传一个测试文件**

### **3. 查看浏览器控制台 (F12 → Console)**

应该看到以下日志：

```
🔧 Checking if user-files bucket exists...
✅ user-files bucket already exists
📤 Uploading file to storage: <user_id>/<app_id>/1234567890_test.pdf
✅ File uploaded successfully to Storage
✅ Metadata saved to database table
```

### **4. 在 Supabase Dashboard 中验证**

#### **Storage：**
Dashboard → **Storage** → **user-files**
```
<user_id>/
  └── <application_id>/
      └── 1234567890_test.pdf
```

#### **Database：**
Dashboard → **Database** → **user_files** 表

应该看到新增的一行数据，包含：
- `id` (UUID)
- `user_id` (UUID)
- `application_id` (TEXT)
- `file_name` (TEXT) - 例如: "test.pdf"
- `file_size` (BIGINT) - 例如: 524288
- `file_path` (TEXT) - 例如: "<user_id>/<app_id>/1234567890_test.pdf"
- `file_type` (TEXT) - 例如: "application/pdf"
- `criteria` (JSONB) - 例如: ["criterion_1"]
- `is_sensitive` (BOOLEAN) - 例如: false
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## 🚨 常见错误排查

### **错误 1：`new row violates row-level security policy`**

**原因：** `user_files` 表的 RLS 策略未配置  
**解决：** 运行上面的 RLS 策略 SQL

### **错误 2：`relation "user_files" does not exist`**

**原因：** `user_files` 表不存在  
**解决：** 检查表名是否正确，或者需要创建表：

```sql
CREATE TABLE IF NOT EXISTS user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  criteria JSONB DEFAULT '[]'::jsonb,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_files_user_id ON user_files(user_id);
CREATE INDEX idx_user_files_application_id ON user_files(application_id);
```

### **错误 3：`column "criteria" does not exist`**

**原因：** 表结构与代码不匹配  
**解决：** 在 Supabase SQL Editor 运行：

```sql
-- 添加缺失的列
ALTER TABLE user_files ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '[]'::jsonb;
ALTER TABLE user_files ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT false;
ALTER TABLE user_files ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE user_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

### **错误 4：Storage 上传成功但数据库插入失败**

**原因：** 数据库权限问题  
**解决：** 检查 RLS 策略，确保 `auth.uid() = user_id` 条件正确

---

## 📊 表结构参考

如果 `user_files` 表结构不正确，可以参考以下完整结构：

```sql
CREATE TABLE user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_type TEXT,
  criteria JSONB DEFAULT '[]'::jsonb,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_files_user_id ON user_files(user_id);
CREATE INDEX idx_user_files_application_id ON user_files(application_id);
CREATE INDEX idx_user_files_created_at ON user_files(created_at DESC);
```

---

## ✅ 完成清单

- [ ] 已运行 RLS 策略 SQL
- [ ] 在 Supabase Dashboard 确认 4 个策略存在
- [ ] 刷新应用页面
- [ ] 上传测试文件
- [ ] 控制台显示成功日志
- [ ] Storage 中能看到文件
- [ ] user_files 表中有新记录

完成以上步骤后，文件就会同时上传到 Storage 和更新 user_files 表了！🎉
