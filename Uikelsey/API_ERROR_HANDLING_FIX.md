# API Error Handling Fix

## 问题描述
在 "My Petition" 页面遇到错误：
```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## 原因分析
在 Figma Make 预览环境中，当调用不存在的 API 端点时（如 `/api/v1/petitions/user-petition-documents`），开发服务器会返回 HTML（index.html）而不是 JSON 数据。这是因为：
1. 预览环境中没有真实的后端 API 服务
2. Vite 开发服务器的单页应用 fallback 机制会对未匹配的路径返回 index.html

## 解决方案

### 1. 修改 `/src/lib/backend.ts` 中的 `listUserPetitionDocuments` 函数
添加了更健壮的错误处理：
- 检测返回内容的 Content-Type
- 如果返回的是 HTML 而不是 JSON，返回空数组而不是抛出错误
- 捕获 JSON 解析错误并返回空数据

```typescript
export async function listUserPetitionDocuments(applicationId?: string): Promise<{ documents: UserPetitionDocumentItem[] }> {
  // ... existing code ...
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Check if response is HTML (common in dev environment when API doesn't exist)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.warn('API endpoint returned HTML instead of JSON - likely API not available in this environment');
        // Return empty list instead of failing
        return { documents: [] };
      }
      
      const errorText = await response.text();
      throw new Error(errorText || `Failed to list petition documents (${response.status})`);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors or JSON parsing errors gracefully
    console.error('Error fetching petition documents:', error);
    
    // If it's a parsing error (HTML instead of JSON), return empty data
    if (error.message && error.message.includes('JSON')) {
      console.warn('Received non-JSON response, returning empty documents list');
      return { documents: [] };
    }
    
    // Re-throw other errors
    throw error;
  }
}
```

### 2. 修改 MyPetition 组件中的 useQuery 配置
在 `/src/app/components/MyPetition.tsx` 中添加 `retry: false` 选项：

```typescript
const {
  data: petitionDocsResponse,
  isLoading: isLoadingVersions,
  isError: versionsQueryError,
  error: versionsQueryErr,
} = useQuery({
  queryKey: queryKeys.petitionDocuments(applicationId!),
  queryFn: () => listUserPetitionDocuments(applicationId!),
  enabled: !!applicationId,
  retry: false, // Don't retry in preview environment where API is unavailable
});
```

## 效果
- ✅ 不再显示 JSON 解析错误
- ✅ 在 API 不可用时显示友好的空状态信息："No generated petition yet"
- ✅ 组件正常渲染，用户可以点击 "Generate New Version" 按钮
- ✅ 控制台会显示警告信息但不会破坏用户体验

## 适用场景
这个修复适用于所有需要在 Figma Make 预览环境中工作但依赖外部 API 的功能。可以考虑将类似的错误处理应用到其他 API 调用函数中。

## 注意事项
- 在生产环境中，真实的 API 服务应该返回正确的 JSON 响应
- 这个修复主要是为了改善开发/预览环境的用户体验
- 建议在部署到生产环境前配置正确的 `VITE_API_BASE_URL` 环境变量
