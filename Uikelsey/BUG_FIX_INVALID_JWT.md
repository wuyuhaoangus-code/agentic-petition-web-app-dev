# 🐛 Bug Found & Fixed: Invalid JWT Error

## The Root Cause

You had **both** `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` configured correctly, but the **Edge Function code was using the wrong key** for JWT verification.

## The Bug 🔴

**Location**: `/supabase/functions/server/index.tsx` lines 377-401

```typescript
// ❌ WRONG: Using SERVICE_ROLE_KEY to verify user JWT
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',  // ❌ Wrong key!
);

const { data: { user } } = await supabase.auth.getUser(
  authHeader.split(' ')[1]  // ❌ This pattern doesn't work with SERVICE_ROLE_KEY
);
```

### Why This Failed

| Key Type | Purpose | Can Verify User JWTs? |
|----------|---------|----------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations, bypass RLS | ❌ No (different context) |
| `SUPABASE_ANON_KEY` | User authentication, RLS enforcement | ✅ Yes (correct context) |

**The issue**: User JWT tokens are signed in the `ANON_KEY` context. When you try to verify them using a client created with `SERVICE_ROLE_KEY`, Supabase rejects them as "Invalid JWT".

## The Fix ✅

**Updated Code**: Now using `SUPABASE_ANON_KEY` for authentication

```typescript
// ✅ CORRECT: Using ANON_KEY to verify user JWT
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',  // ✅ Correct key!
  {
    global: {
      headers: { Authorization: authHeader }  // ✅ Pass token in headers
    }
  }
);

// ✅ Call getUser() without parameters
const { data: { user } } = await supabase.auth.getUser();
```

### Key Changes

1. **Use `SUPABASE_ANON_KEY`** instead of `SUPABASE_SERVICE_ROLE_KEY` for the client
2. **Pass Authorization header** in the client config, not as a parameter
3. **Call `getUser()`** without any parameters (token is in headers)
4. **RLS automatically applies** - users can only access their own data

## 📝 What Changed in the Code

### Before (Broken):
```typescript
app.get("/make-server-604ca09d/profile", async (c) => {
  const supabase = createClient(url, SERVICE_ROLE_KEY);
  const { user } = await supabase.auth.getUser(token); // ❌ Fails
  const { data } = await supabase.from('profiles').select('*');
});
```

### After (Fixed):
```typescript
app.get("/make-server-604ca09d/profile", async (c) => {
  const supabase = createClient(url, ANON_KEY, {
    global: { headers: { Authorization: authHeader }}
  });
  const { user } = await supabase.auth.getUser(); // ✅ Works
  const { data } = await supabase.from('profiles').select('*');
});
```

## 🚀 How to Deploy the Fix

### Option 1: Redeploy via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/mgbftnkxmbasanzfdpax/functions
2. Click on `make-server-604ca09d` function
3. Click "Deploy" or "Redeploy" button
4. The updated code will be deployed automatically

### Option 2: Deploy via Supabase CLI (if you have it)

```bash
# Navigate to your project
cd your-project

# Deploy the updated function
supabase functions deploy make-server-604ca09d

# Verify deployment
supabase functions list
```

### Option 3: The code is already updated in this project

The file `/supabase/functions/server/index.tsx` has been updated with the fix. If you're using Figma Make's deployment, it should automatically deploy when you save/commit.

## ✅ Testing the Fix

After deploying:

1. **Refresh your application**
2. **Login** (if not already logged in)
3. **Navigate to Personal Information page**
4. **Check browser console** - you should see:
   ```
   📋 Fetching profile from Edge Function: https://...
   🔵 User ID: 518afa3b-270c-4fbd-a94e-9d5d709c607e
   🔵 Response status: 200  ✅ (not 401 anymore!)
   ✅ Profile data received: {}
   ```

5. **Fill out the form and click "Save Changes"**
6. **Refresh the page** - your data should persist!

## 🔍 Edge Function Logs

You can verify the fix by checking Edge Function logs:

1. Go to: https://supabase.com/dashboard/project/mgbftnkxmbasanzfdpax/functions
2. Click on `make-server-604ca09d`
3. Click the "Logs" tab
4. You should see:
   ```
   ✅ User authenticated: 518afa3b-270c-4fbd-a94e-9d5d709c607e
   ✅ Profile fetched: not found  (first time)
   ```

## 📊 Architecture Now

```
Frontend
  ↓ (JWT token in Authorization header)
Edge Function
  ↓ (Create client with ANON_KEY + Auth header)
Supabase Auth
  ✅ (Verify JWT token - now works!)
  ↓
Database Query (with RLS)
  ✅ (User can only access their own data)
  ↓
Return Profile Data
```

## 🎯 Why Both Keys Exist

| Scenario | Use This Key | Example |
|----------|-------------|---------|
| **Verify user identity** | `SUPABASE_ANON_KEY` | Profile endpoints (GET/POST) |
| **User data operations** | `SUPABASE_ANON_KEY` | Users accessing their own data |
| **Admin operations** | `SUPABASE_SERVICE_ROLE_KEY` | Create users, bucket initialization |
| **Bypass RLS** | `SUPABASE_SERVICE_ROLE_KEY` | Admin dashboard viewing all users |

**Rule of thumb**: 
- Use `ANON_KEY` when working with authenticated users
- Use `SERVICE_ROLE_KEY` only for admin/system operations

## 🔐 Security Note

The fix actually **improves security** because:
- ✅ RLS policies automatically apply (users can't access others' data)
- ✅ No need to manually check `user.id` matches requested data
- ✅ Database enforces data isolation at the PostgreSQL level

## 📚 Related Files Updated

1. `/supabase/functions/server/index.tsx` - Fixed JWT verification
2. `/src/app/admin/services/profileService.ts` - Restored Edge Function calls
3. This document - Explains the bug and fix

## ❓ FAQ

**Q: Why didn't the error message say "wrong key"?**
A: Supabase's error message is generic for security reasons. It just says "Invalid JWT" whether the token is expired, malformed, or verified with the wrong key.

**Q: Can I still use Direct Supabase (backend.ts)?**
A: Yes! Both approaches work now:
- Edge Function = Good for complex logic, admin operations
- Direct Supabase = Good for simple CRUD, faster development

**Q: Do I need to run the SQL script?**
A: Yes! You still need to create the `profiles` table. Run `/supabase_profiles_setup.sql` in the SQL Editor if you haven't already.

---

**Status**: 🟢 Bug Fixed - Ready to Deploy!
