/*
 * Supabase Configuration
 *
 * 🔧 TO CONFIGURE:
 * 1. Go to: https://supabase.com/dashboard/project/mgbftnkxmbasanzfdpax/settings/api
 * 2. Copy your "anon" "public" key
 * 3. Paste it in the SUPABASE_ANON_KEY constant below
 * 4. Save this file
 */

// ⬇️ EDIT THIS - Paste your Supabase anon key here:
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYmZ0bmt4bWJhc2FuemZkcGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTQ4NTUsImV4cCI6MjA4NDI5MDg1NX0.Q2mgNUUljeJl-dPcCyO66OdbDw1UOFERsvKzorZxq14";

// ✅ Project ID (already configured)
const SUPABASE_PROJECT_ID = "mgbftnkxmbasanzfdpax";

// Export for use throughout the app
export const projectId =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ||
  SUPABASE_PROJECT_ID;
export const publicAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

// Validation - only warn once
let hasWarned = false;
if (
  !hasWarned &&
  (!publicAnonKey ||
    publicAnonKey === "PASTE_YOUR_ANON_KEY_HERE")
) {
  hasWarned = true;
  console.warn(
    "\n" +
      "⚠️  SUPABASE NOT CONFIGURED\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "Please edit: /src/lib/supabase-info.ts\n" +
      "Get your key: https://supabase.com/dashboard/project/mgbftnkxmbasanzfdpax/settings/api\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
  );
}