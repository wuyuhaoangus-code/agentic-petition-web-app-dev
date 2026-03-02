# ✅ Fixed: Multiple Supabase Client Instances & RLS Error

## 🔴 Original Errors

```
⚠️ Edge Function failed, trying Direct Supabase. Error: {"code":401,"message":"Invalid JWT"}
GoTrueClient@sb-mgbftnkxmbasanzfdpax-auth-token:1 (2.98.0) 2026-02-27T02:34:19.560Z 
Multiple GoTrueClient instances detected in the same browser context.
❌ Upload error: StorageApiError: new row violates row-level security policy
```

## 🔍 Root Cause

The project had **TWO separate Supabase client instances**:

### Before (❌ Broken Architecture)

```
1. /src/lib/supabase.ts
   - Basic client without auth config
   - Used by: AuthPage.tsx
   - Session stored in: default storage

2. /src/lib/backend.ts → getSupabaseClient()
   - Separate client with auth config
   - Used by: formsService.ts, criteriaService.ts
   - Session stored in: different storage

❌ Problem: Auth session from client #1 not visible to client #2!
```

**Flow of the bug:**
1. User logs in via `AuthPage.tsx` → Uses client #1
2. Session saved to client #1's storage
3. User uploads form via `Forms.tsx` → Calls `formsService.ts` → Uses client #2
4. Client #2 has NO session → `auth.uid()` returns `null`
5. RLS policy checks: `auth.uid() = user_id` → `null = user_id` → **FALSE**
6. Database rejects insert → **RLS policy violation error** ❌

## ✅ Solution

**Use a single Supabase client instance across the entire app.**

### After (✅ Fixed Architecture)

```typescript
// /src/lib/supabase.ts - THE ONLY CLIENT
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: true,        // ✅ Persist session
    autoRefreshToken: true,      // ✅ Auto-refresh
    detectSessionInUrl: true,    // ✅ Detect OAuth callbacks
    storage: window.localStorage, // ✅ Consistent storage
    storageKey: 'supabase.auth.token', // ✅ Consistent key
  },
});
```

```typescript
// /src/lib/backend.ts - Returns the singleton
import { supabase } from './supabase';

export function getSupabaseClient() {
  return supabase; // ✅ Same instance!
}
```

```typescript
// /src/app/services/formsService.ts
import { getSupabaseClient } from '../../lib/backend';

const supabase = getSupabaseClient(); // ✅ Uses singleton
```

```typescript
// /src/app/services/criteriaService.ts
import { supabase } from '../../lib/supabase'; // ✅ Uses singleton
```

```typescript
// /src/app/components/AuthPage.tsx
import { supabase } from '@/lib/supabase'; // ✅ Uses singleton
```

## 🎯 What Changed

### 1. Updated `/src/lib/supabase.ts`
- ✅ Added auth configuration (persistSession, autoRefreshToken, storage)
- ✅ Made it the single source of truth

### 2. Updated `/src/lib/backend.ts`
- ✅ Removed duplicate client creation
- ✅ `getSupabaseClient()` now returns the singleton from `supabase.ts`

### 3. Updated `/src/app/services/formsService.ts`
- ✅ Changed from old `supabase` import to `getSupabaseClient()`

### 4. Updated `/src/app/services/criteriaService.ts`
- ✅ Already uses `supabase` from `/src/lib/supabase.ts` (correct)

## ✨ Benefits

✅ **Single Auth State** - All code sees the same authenticated session  
✅ **No More RLS Errors** - `auth.uid()` is always available when logged in  
✅ **No More JWT Errors** - Token is consistent across all requests  
✅ **No Multiple Instances Warning** - Only one GoTrueClient instance  
✅ **Consistent Token Refresh** - Auto-refresh works globally  

## 🧪 Testing

After this fix:

1. **Login** - User authenticates via AuthPage ✅
2. **Session saved** - To `window.localStorage` under key `supabase.auth.token` ✅
3. **Upload form** - Forms.tsx → formsService → Same client with session ✅
4. **RLS check** - `auth.uid()` returns valid user ID ✅
5. **Insert succeeds** - Row inserted into `user_files` table ✅
6. **File stored** - PDF uploaded to Storage bucket ✅

## 📋 Files Modified

1. `/src/lib/supabase.ts` - Added auth configuration
2. `/src/lib/backend.ts` - Use singleton client
3. `/src/app/services/formsService.ts` - Use authenticated client
4. `/src/app/services/criteriaService.ts` - Already correct (verified)

## 🔐 RLS Policy (For Reference)

```sql
-- This policy now works correctly!
CREATE POLICY "Users can insert their own files"
  ON user_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

Before fix: `auth.uid()` = `null` (no session) → Insert rejected ❌  
After fix: `auth.uid()` = `<user_uuid>` (session available) → Insert allowed ✅

---

## 🎉 Result

**Forms can now be uploaded successfully!** All database operations now have proper authentication context, and RLS policies work as intended.
