# 🚨 Edge Function Environment Variables Setup

## Problem
You're seeing **401 Unauthorized** errors because the Edge Function doesn't have the required environment variables configured.

## Required Environment Variables

Your Edge Function (`make-server-604ca09d`) needs these environment variables:

1. **SUPABASE_URL** - Your Supabase project URL
2. **SUPABASE_ANON_KEY** - Public anonymous key for client-side auth
3. **SUPABASE_SERVICE_ROLE_KEY** - Service role key for server-side operations (CRITICAL!)

## How to Configure

### Option 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard

2. **Get your API keys**
   - Click on your project
   - Go to **Settings** → **API**
   - Copy these values:
     - `URL` (e.g., `https://xxxxx.supabase.co`)
     - `anon public` key
     - `service_role` key ⚠️ KEEP THIS SECRET!

3. **Configure Edge Function**
   - In Supabase Dashboard, go to **Edge Functions**
   - Find `make-server-604ca09d` in the list
   - Click on it, then go to **Settings** tab
   - Add these environment variables:

   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Wait and verify**
   - Wait 1-2 minutes for changes to propagate
   - Refresh your app
   - Go to Admin Dashboard → Diagnostics to verify

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Set secrets for the edge function
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Verify secrets are set
supabase secrets list
```

## Verification

After configuring, verify the setup:

1. **Check the diagnostic endpoint**
   ```bash
   curl https://your-project-id.supabase.co/functions/v1/make-server-604ca09d/env-check
   ```

   Should return:
   ```json
   {
     "configured": {
       "SUPABASE_URL": true,
       "SUPABASE_ANON_KEY": true,
       "SUPABASE_SERVICE_ROLE_KEY": true,
       "SUPABASE_DB_URL": false
     },
     "allConfigured": true,
     "message": "All environment variables are configured ✅"
   }
   ```

2. **Use the built-in diagnostics panel**
   - Log in to your app
   - Go to Admin Dashboard
   - Click "Diagnostics" in the sidebar
   - Look for "Edge Function Environment Variables" check

## Common Issues

### Issue 1: Still getting 401 after adding keys
**Solution:** Wait 2-3 minutes for Edge Function to reload with new env vars

### Issue 2: Can't find Edge Functions in dashboard
**Solution:** Make sure you're looking in the correct Supabase project

### Issue 3: Service role key not working
**Solution:** 
- Make sure you copied the entire key (it's very long)
- Make sure there are no extra spaces or line breaks
- Verify you're using `service_role` key, not `anon` key

## Security Notes

⚠️ **NEVER** commit `SUPABASE_SERVICE_ROLE_KEY` to git or share it publicly!
- It bypasses all Row Level Security (RLS) policies
- Anyone with this key has full database access
- Only use it server-side (Edge Functions, backend APIs)

## Next Steps

Once configured:
1. ✅ 401 errors should be resolved
2. ✅ File uploads should work
3. ✅ Criteria management should work
4. ✅ All authenticated endpoints should work

## Need Help?

Check these files for more information:
- `/QUICK_FIX_401_JWT.md` - Quick fix guide
- `/BUG_FIX_INVALID_JWT.md` - Detailed JWT troubleshooting
- Run the Diagnostics panel in Admin Dashboard
