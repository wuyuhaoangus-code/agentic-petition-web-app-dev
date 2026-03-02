# RLS Policy Error Fix - Forms Upload

## Problem

**Error Message:**
```
❌ Upload error: StorageApiError: new row violates row-level security policy
```

## Root Cause

There were **two different Supabase client instances** in the codebase:

### 1. `/src/lib/supabase.ts` (Basic Client)
```typescript
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(supabaseUrl, publicAnonKey);
```
- ❌ **No auth session attached**
- ❌ Cannot pass RLS checks that require `auth.uid()`
- Used by: old services like `criteriaService.ts`

### 2. `/src/lib/backend.ts` (Authenticated Client)  
```typescript
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, publicAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseClient;
}
```
- ✅ **Auth session persisted and auto-refreshed**
- ✅ Passes RLS checks because it includes auth context
- Used by: `backend.ts` API functions

## Why It Failed

The `formsService.ts` initially imported from `/src/lib/supabase.ts`:

```typescript
import { supabase } from '../../lib/supabase';  // ❌ Wrong client!

export const formsService = {
  async saveForm(formData) {
    const { data, error } = await supabase  // ❌ No auth context
      .from('user_files')
      .insert({ user_id: formData.user_id, ... });
  }
}
```

### What Happened:
1. File uploaded to Storage ✅ (Storage bucket is private but allows uploads)
2. Tried to insert row into `user_files` table ❌
3. RLS policy checked: `auth.uid() = user_id`
4. **But `auth.uid()` was null** because the client had no session!
5. RLS rejected the insert → Error thrown

## Solution

Changed `formsService.ts` to use the **authenticated client**:

```typescript
import { getSupabaseClient } from '../../lib/backend';  // ✅ Correct client!

export const formsService = {
  async getForms(applicationId: string) {
    const { data, error } = await getSupabaseClient()  // ✅ Has auth context
      .from('user_files')
      .select('*')
      .eq('application_id', applicationId)
      .eq('category', 'Forms');
    
    if (error) throw error;
    return data || [];
  },

  async uploadFormFile(file, applicationId, formType, userId) {
    const { data, error } = await getSupabaseClient().storage  // ✅ Has auth context
      .from('user-files')
      .upload(filePath, file, { ... });
    
    if (error) throw error;
    return filePath;
  },

  async saveForm(formData) {
    const { data, error } = await getSupabaseClient()  // ✅ Has auth context
      .from('user_files')
      .insert({ 
        user_id: formData.user_id,
        category: 'Forms',
        criteria: [formData.form_type],
        ...
      });
    
    if (error) throw error;
    return data;
  }
}
```

## RLS Policy Reference

The `user_files` table has RLS enabled with this policy:

```sql
CREATE POLICY "Users can insert their own files"
  ON user_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

This policy **requires** the Supabase client to have an authenticated session, otherwise:
- `auth.uid()` returns `NULL`
- `NULL = user_id` is always `false`
- Insert is rejected

## Key Takeaways

✅ **Always use `getSupabaseClient()` from `/src/lib/backend.ts`** for:
- Database queries (SELECT, INSERT, UPDATE, DELETE)
- Storage operations (upload, download, delete)
- Any operation that needs auth context for RLS

❌ **Never use** the basic `supabase` client from `/src/lib/supabase.ts` for:
- User-specific data operations
- Tables with RLS enabled

## Migration Plan

Consider migrating all services to use the authenticated client:

```typescript
// Before (❌ Wrong)
import { supabase } from '../../lib/supabase';

// After (✅ Correct)
import { getSupabaseClient } from '../../lib/backend';
```

Files that may need updating:
- `/src/app/services/criteriaService.ts` (if it uses the old client)
- Any other service files that interact with user data

## Testing

To verify the fix works:

1. **Upload a form** - Should succeed without RLS error
2. **Check database** - Row inserted with correct `user_id`
3. **Query forms** - Should return the uploaded form
4. **Delete form** - Should remove both file and DB row

All operations should now work correctly with proper authentication! ✅
