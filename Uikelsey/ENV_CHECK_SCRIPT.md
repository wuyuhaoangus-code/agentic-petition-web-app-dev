# Quick Environment Check

Run this in your browser console to check if environment variables are configured:

```javascript
// Check Edge Function environment variables
const projectId = 'YOUR_PROJECT_ID'; // Replace with your project ID
const checkEnv = async () => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-604ca09d/env-check`
    );
    const data = await response.json();
    console.log('Environment Check:', data);
    
    if (data.allConfigured) {
      console.log('✅ All environment variables are configured!');
    } else {
      console.log('❌ Missing environment variables:');
      Object.entries(data.configured).forEach(([key, value]) => {
        console.log(`  ${key}: ${value ? '✅' : '❌'}`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to check environment:', error);
  }
};

checkEnv();
```

Expected output if configured correctly:
```
Environment Check: {
  configured: {
    SUPABASE_URL: true,
    SUPABASE_ANON_KEY: true,
    SUPABASE_SERVICE_ROLE_KEY: true,
    SUPABASE_DB_URL: true
  },
  allConfigured: true,
  message: "All environment variables are configured ✅"
}
✅ All environment variables are configured!
```
