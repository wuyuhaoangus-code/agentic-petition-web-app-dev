// This file centralizes all static asset imports.
// Assets are now stored in Supabase Storage for production use.

// CONFIGURATION
// Supabase Project ID: ktwdsnuuqlffwnnajefe
// Storage Bucket Name: dreamcard-assets (public)
// Base URL: https://mgbftnkxmbasanzfdpax.supabase.co/storage/v1/object/public/dreamcard-assets/

// Production URLs (Supabase Storage)
const SUPABASE_STORAGE_BASE = "https://mgbftnkxmbasanzfdpax.supabase.co/storage/v1/object/public/dreamcard-assets/";

export const ASSETS = {
  logo: `${SUPABASE_STORAGE_BASE}/logo.png`,
  lgowhite: `${SUPABASE_STORAGE_BASE}/logowhite.png`,
  blogsLogo: `${SUPABASE_STORAGE_BASE}/blogs-logo.png`,
  heroImage: `${SUPABASE_STORAGE_BASE}/hero-image1.jpg`,
  demoProfileAvatar: `${SUPABASE_STORAGE_BASE}/demo-profile-avatar.png`,
};

// USAGE INSTRUCTIONS:
// 1. Upload your assets to Supabase Storage → dreamcard-assets bucket
// 2. Name your files: logo.png, blogs-logo.png, hero-image.png
// 3. The bucket is PUBLIC, so assets will be accessible directly via URL
// 4. To upload via Supabase Dashboard:
//    - Go to: https://supabase.com/dashboard/project/ktwdsnuuqlffwnnajefe/storage/buckets/dreamcard-assets
//    - Click "Upload file"
//    - Select your image files
// 5. Refresh your app to see the new assets!