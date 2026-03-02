# 🔍 上传文件无反应 - 调试步骤

## 问题分析

`CriteriaMapping` 组件目前**只是显示文件**，但**没有真正上传到后端**。

---

## 🔧 需要检查的地方

### 1. **打开浏览器控制台**

按 `F12` 或右键 → 检查 → Console

### 2. **上传文件后查看日志**

应该看到以下日志：
```
✅ user-files bucket already exists
🔐 Generating file hash...
✅ No duplicate found, proceeding with upload
📤 Uploading file to storage: ...
✅ File uploaded successfully to Storage
✅ Metadata saved to database table (category: evidence)
```

### 3. **如果没有看到日志**

说明 `CriteriaMapping` 组件**没有调用 `criteriaService.uploadAndSaveFile`**。

---

## ✅ 解决方案

`CriteriaMapping` 组件需要：

1. ✅ 接收 `applicationId` prop
2. ✅ 在 `handleNextFile` 或 `handleSkipMapping` 时调用真正的上传

### **需要的改动：**

#### **步骤 1：添加 applicationId prop**

```typescript
interface CriteriaMappingProps {
  files: UploadedFile[];
  applicationId: string;  // ✅ 添加这个
  // ... 其他 props
}
```

#### **步骤 2：在 handleNextFile 中上传**

```typescript
const handleNextFile = async () => {
  const currentFile = pendingFiles[currentMappingIndex];
  
  if (!currentFile.file) {
    console.error('No file object found');
    return;
  }

  try {
    // ✅ 真正上传到后端
    const uploadedFile = await criteriaService.uploadAndSaveFile(
      currentFile.file,
      applicationId,  // 需要 applicationId
      currentFile.criteria,
      false,
      'evidence'  // category
    );
    
    console.log('✅ File uploaded:', uploadedFile);
    
    // 通知父组件
    onAddFiles([{
      id: uploadedFile.id,
      name: uploadedFile.name,
      size: uploadedFile.size,
      uploadDate: new Date(uploadedFile.upload_date),
      criteria: uploadedFile.criteria,
      url: uploadedFile.url
    }]);
    
    // 继续下一个文件或关闭
    if (currentMappingIndex < pendingFiles.length - 1) {
      setCurrentMappingIndex(prev => prev + 1);
    } else {
      setShowMappingModal(false);
      setPendingFiles([]);
      setCurrentMappingIndex(0);
    }
  } catch (error) {
    console.error('❌ Upload failed:', error);
    alert(`Upload failed: ${error.message}`);
  }
};
```

---

## 📍 临时测试方法

在控制台直接测试上传：

```javascript
// 1. 获取 criteriaService
import { criteriaService } from './services/criteriaService';

// 2. 创建测试文件（或使用文件输入）
const input = document.createElement('input');
input.type = 'file';
input.onchange = async (e) => {
  const file = e.target.files[0];
  const applicationId = 'your-application-id-here';  // ⚠️ 需要实际的 applicationId
  
  try {
    const result = await criteriaService.uploadAndSaveFile(
      file,
      applicationId,
      [],
      false,
      'evidence'
    );
    console.log('✅ Upload success:', result);
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
};
input.click();
```

---

## 🎯 快速解决 - 需要的信息

告诉我：

1. ✅ 控制台有什么错误信息？
2. ✅ 能否找到 `applicationId`？（通常在 Workplace 或父组件中）
3. ✅ `CriteriaMapping` 是在哪个组件中使用的？

有了这些信息，我可以帮你完成集成！
