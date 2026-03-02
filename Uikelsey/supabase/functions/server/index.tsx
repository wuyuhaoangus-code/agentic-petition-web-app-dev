import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Global Error Handler
app.onError((err, c) => {
  console.error('❌ Server Error:', err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});

// Global Not Found Handler
app.notFound((c) => {
  console.error(`❌ Route not found: ${c.req.method} ${c.req.path}`);
  return c.json({ error: "Not Found", path: c.req.path }, 404);
});

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase Storage Buckets on startup
const initializeStorage = async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  
  const buckets = [
    { name: 'dreamcard-assets', public: true },           // For logos and static assets
    { name: 'make-604ca09d-form-uploads', public: false }, // For user form uploads
    { name: 'make-604ca09d-official-pdfs', public: true },  // For official PDF templates
    { name: 'user-files', public: false } // For user criteria files
  ];
  
  for (const { name: bucketName, public: isPublic } of buckets) {
    try {
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: isPublic,
          fileSizeLimit: 10485760, // 10MB limit
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/svg+xml']
        });
        
        if (error) {
          console.error(`Error creating storage bucket '${bucketName}':`, error);
        } else {
          console.log(`✅ Storage bucket '${bucketName}' created successfully (public: ${isPublic})`);
        }
      } else {
        console.log(`✅ Storage bucket '${bucketName}' already exists`);
      }
    } catch (error) {
      console.error(`❌ Error initializing storage bucket '${bucketName}':`, error);
    }
  }
};

// Initialize storage on server start
initializeStorage();

// Health check endpoint
app.get("/make-server-604ca09d/health", (c) => {
  return c.json({ status: "ok" });
});

// Test endpoint (no auth required)
app.get("/make-server-604ca09d/test", (c) => {
  console.log('🧪 Test endpoint called');
  return c.json({ 
    message: "Test endpoint works!", 
    timestamp: new Date().toISOString(),
    noAuthRequired: true 
  });
});

// Sign up endpoint
app.post("/make-server-604ca09d/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || '' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Sign up error:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('User created successfully:', data.user.id);
    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      }
    });

  } catch (error) {
    console.error('Sign up error:', error);
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

// Check USCIS case status endpoint
app.post("/make-server-604ca09d/check-case-status", async (c) => {
  try {
    const { caseNumber } = await c.req.json();
    
    if (!caseNumber) {
      return c.json({ error: "Case number is required" }, 400);
    }

    // Validate case number format
    const caseNumPattern = /^[A-Z]{3}\d{10}$/;
    if (!caseNumPattern.test(caseNumber)) {
      return c.json({ error: "Invalid case number format" }, 400);
    }

    console.log('Checking case status for:', caseNumber);

    // TODO: Integrate with Lawful API
    // For now, return mock data with realistic USCIS status information
    const mockStatuses = [
      {
        status: 'Case Was Received',
        description: 'We received your Form I-140, Immigrant Petition for Alien Workers, and mailed you a receipt notice.',
        receivedDate: '2024-01-15',
        history: [
          {
            date: '2024-01-15',
            status: 'Case Was Received',
            description: 'We received your Form I-140, Immigrant Petition for Alien Workers, and mailed you a receipt notice.'
          },
          {
            date: '2024-01-10',
            status: 'Case Was Submitted',
            description: 'Your case has been submitted to USCIS.'
          }
        ]
      },
      {
        status: 'Case Is Being Actively Reviewed',
        description: 'We are actively reviewing your Form I-140, Immigrant Petition for Alien Workers. We will send you a notice if we need additional information.',
        receivedDate: '2023-12-01',
        history: [
          {
            date: '2024-01-20',
            status: 'Case Is Being Actively Reviewed',
            description: 'We are actively reviewing your Form I-140, Immigrant Petition for Alien Workers.'
          },
          {
            date: '2024-01-05',
            status: 'Fingerprint Fee Was Received',
            description: 'We received your fingerprint fee for Form I-140.'
          },
          {
            date: '2023-12-01',
            status: 'Case Was Received',
            description: 'We received your Form I-140, Immigrant Petition for Alien Workers, and mailed you a receipt notice.'
          }
        ]
      },
      {
        status: 'Case Was Approved',
        description: 'Your Form I-140, Immigrant Petition for Alien Workers, was approved. We have sent you an approval notice.',
        receivedDate: '2023-10-15',
        noticeDate: '2024-01-22',
        history: [
          {
            date: '2024-01-22',
            status: 'Case Was Approved',
            description: 'Your Form I-140, Immigrant Petition for Alien Workers, was approved. We have sent you an approval notice.'
          },
          {
            date: '2023-12-10',
            status: 'Request for Additional Evidence Was Sent',
            description: 'We sent you a Request for Evidence (RFE). Please respond within the time frame specified in the notice.'
          },
          {
            date: '2023-11-15',
            status: 'Case Is Being Actively Reviewed',
            description: 'We are actively reviewing your Form I-140, Immigrant Petition for Alien Workers.'
          },
          {
            date: '2023-10-15',
            status: 'Case Was Received',
            description: 'We received your Form I-140, Immigrant Petition for Alien Workers, and mailed you a receipt notice.'
          }
        ]
      }
    ];

    // Select a status based on the case number (for demo consistency)
    const hash = caseNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const selectedStatus = mockStatuses[hash % mockStatuses.length];

    const response = {
      caseNumber,
      status: selectedStatus.status,
      lastUpdated: new Date().toISOString(),
      receivedDate: selectedStatus.receivedDate,
      noticeDate: selectedStatus.noticeDate,
      description: selectedStatus.description,
      history: selectedStatus.history
    };

    console.log('Case status response:', response);
    return c.json(response);

  } catch (error) {
    console.error('Check case status error:', error);
    return c.json({ error: 'Failed to check case status' }, 500);
  }
});

// --- Blog Posts CRUD Endpoints ---

// Get all posts
app.get("/make-server-604ca09d/posts", async (c) => {
  try {
    const posts = await kv.getByPrefix("post:");
    // Sort by updatedAt desc
    posts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return c.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

// Get single post
app.get("/make-server-604ca09d/posts/:id", async (c) => {
  const id = c.req.param('id');
  try {
    const post = await kv.get(`post:${id}`);
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    return c.json(post);
  } catch (error) {
    console.error(`Error fetching post ${id}:`, error);
    return c.json({ error: 'Failed to fetch post' }, 500);
  }
});

// Create post
app.post("/make-server-604ca09d/posts", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newPost = {
      ...body,
      id,
      createdAt: now,
      updatedAt: now,
      views: 0
    };

    await kv.set(`post:${id}`, newPost);
    return c.json(newPost, 201);
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

// Update post
app.put("/make-server-604ca09d/posts/:id", async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const existing = await kv.get(`post:${id}`);
    
    if (!existing) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const updatedPost = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`post:${id}`, updatedPost);
    return c.json(updatedPost);
  } catch (error) {
    console.error(`Error updating post ${id}:`, error);
    return c.json({ error: 'Failed to update post' }, 500);
  }
});

// Delete post
app.delete("/make-server-604ca09d/posts/:id", async (c) => {
  const id = c.req.param('id');
  try {
    await kv.del(`post:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error(`Error deleting post ${id}:`, error);
    return c.json({ error: 'Failed to delete post' }, 500);
  }
});

// Seed posts (optional helper)
app.post("/make-server-604ca09d/posts/seed", async (c) => {
  try {
    // Check if posts already exist
    const existing = await kv.getByPrefix("post:");
    if (existing.length > 0) {
      return c.json({ message: 'Posts already exist, skipping seed' });
    }

    const mockPosts = [
      {
        id: '1',
        title: 'What is NIW (National Interest Waiver)? Complete Guide for 2024',
        status: 'published',
        author: 'Admin User',
        categories: ['NIW Fundamentals', 'Guide'],
        views: 12450,
        updatedAt: '2024-02-10',
        content: '## Introduction\n\nThe National Interest Waiver (NIW) is one of the most popular employment-based green card categories...',
        excerpt: 'Understanding the National Interest Waiver under EB-2 classification.',
        slug: 'what-is-niw-guide-2024'
      },
      {
        id: '2',
        title: 'EB-1A vs NIW: Which Path is Right for You?',
        status: 'published',
        author: 'Sarah Legal',
        categories: ['Strategy', 'EB-1A'],
        views: 8320,
        updatedAt: '2024-02-08',
        content: '## EB-1A vs NIW\n\nChoosing between EB-1A and NIW depends on your profile...',
        excerpt: 'A detailed breakdown comparing EB-1A and NIW paths.',
        slug: 'eb1a-vs-niw-path'
      },
      {
        id: '3',
        title: 'Understanding the Totality of Circumstances Test',
        status: 'draft',
        author: 'Admin User',
        categories: ['Legal Analysis'],
        views: 0,
        updatedAt: '2024-02-11',
        content: '## Totality of Circumstances\n\nThis legal standard allows adjudicators to...',
        excerpt: 'Deep dive into the legal standard for extraordinary ability.',
        slug: 'totality-of-circumstances'
      }
    ];

    for (const post of mockPosts) {
      await kv.set(`post:${post.id}`, post);
    }

    return c.json({ success: true, count: mockPosts.length });
  } catch (error) {
    console.error('Error seeding posts:', error);
    return c.json({ error: 'Failed to seed posts' }, 500);
  }
});

// --- Profile Endpoints ---

app.get("/make-server-604ca09d/profile", async (c) => {
  try {
    // Get the authorization header from the incoming request
    const authorization = c.req.header('Authorization') || c.req.header('authorization');
    
    if (!authorization) {
      console.error('❌ No authorization header provided');
      console.log('📋 Available headers:', Object.keys(Object.fromEntries(c.req.raw.headers.entries())));
      return c.json({ error: 'Unauthorized - Missing authorization header' }, 401);
    }

    console.log('🔑 Authorization header received');

    // Create Supabase client with the user's JWT token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authorization },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('❌ Authentication failed:', userError?.message);
      return c.json({ error: 'Unauthorized', details: userError?.message }, 401);
    }

    console.log('✅ User authenticated:', user.id);

    // Fetch the user's profile (RLS automatically restricts to their own data)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Database error:', profileError.message);
      return c.json({ error: 'Failed to fetch profile', details: profileError.message }, 500);
    }

    console.log('✅ Profile query successful:', profile ? 'found' : 'empty');
    
    // Return empty object if no profile exists yet
    return c.json(profile || {});
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

app.post("/make-server-604ca09d/profile", async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  
  // Create user-context client with ANON_KEY
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader }
      }
    }
  );

  // Verify user authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Authentication failed:', userError);
    return c.json({ error: 'Unauthorized' }, 401);
  }

  console.log('✅ User authenticated:', user.id);

  // Sanitize body to only allow specific fields
  const allowedFields = ['first_name', 'last_name', 'full_name', 'field', 'occupation', 'avatar_url'];
  const updates: any = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  // Upsert profile with RLS (user can only update their own data)
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      updated_at: new Date().toISOString(),
      ...updates
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: error.message || 'Failed to update profile' }, 500);
  }

  console.log('✅ Profile updated:', data.id);
  return c.json(data);
});

// --- Application Endpoints ---

// Get user's applications
app.get("/make-server-604ca09d/applications", async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const apps = await kv.getByPrefix(`application:${user.id}:`);
    // Sort by updatedAt desc
    apps.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return c.json(apps);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return c.json({ error: 'Failed to fetch applications' }, 500);
  }
});

// Create application
app.post("/make-server-604ca09d/applications", async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newApp = {
      ...body,
      id,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(`application:${user.id}:${id}`, newApp);
    return c.json(newApp, 201);
  } catch (error) {
    console.error('Error creating application:', error);
    return c.json({ error: 'Failed to create application' }, 500);
  }
});

// Update application
app.put("/make-server-604ca09d/applications/:id", async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  
  try {
    const existing = await kv.get(`application:${user.id}:${id}`);
    if (!existing) return c.json({ error: 'Application not found' }, 404);

    const body = await c.req.json();
    const updatedApp = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
      userId: user.id // Ensure userId cannot be changed
    };

    await kv.set(`application:${user.id}:${id}`, updatedApp);
    return c.json(updatedApp);
  } catch (error) {
    console.error('Error updating application:', error);
    return c.json({ error: 'Failed to update application' }, 500);
  }
});

// Delete application
app.delete("/make-server-604ca09d/applications/:id", async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');

  try {
    // Verify ownership
    const existing = await kv.get(`application:${user.id}:${id}`);
    if (!existing) return c.json({ error: 'Application not found' }, 404);

    await kv.del(`application:${user.id}:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting application:', error);
    return c.json({ error: 'Failed to delete application' }, 500);
  }
});

// --- Criteria File Endpoints ---

// Get all files for an application
app.get("/make-server-604ca09d/criteria/:applicationId/files", async (c) => {
  const applicationId = c.req.param('applicationId');
  console.log(`📂 Fetching files for application: ${applicationId}`);

  try {
    const files = await kv.getByPrefix(`criteria_file:${applicationId}:`);
    console.log(`✅ Found ${files.length} files for application ${applicationId}`);
    return c.json(files);
  } catch (error) {
    console.error('❌ Error fetching criteria files:', error);
    return c.json({ error: 'Failed to fetch criteria files' }, 500);
  }
});

// Create/Update file metadata
app.post("/make-server-604ca09d/criteria/:applicationId/files", async (c) => {
  const applicationId = c.req.param('applicationId');
  console.log(`📝 Creating file metadata for application: ${applicationId}`);

  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    
    // Ensure applicationId is set
    const file = {
      ...body,
      id,
      application_id: applicationId,
      upload_date: body.upload_date || new Date().toISOString()
    };

    await kv.set(`criteria_file:${applicationId}:${id}`, file);
    console.log(`✅ Created file metadata: ${id}`);
    return c.json(file, 201);
  } catch (error) {
    console.error('❌ Error creating criteria file:', error);
    return c.json({ error: 'Failed to create criteria file' }, 500);
  }
});

// Update file criteria
app.put("/make-server-604ca09d/criteria/:applicationId/files/:id", async (c) => {
  const applicationId = c.req.param('applicationId');
  const id = c.req.param('id');
  console.log(`✏️ Updating file: ${id} for application: ${applicationId}`);

  try {
    const existing = await kv.get(`criteria_file:${applicationId}:${id}`);
    if (!existing) {
      console.log(`⚠️ File not found: ${id}`);
      return c.json({ error: 'File not found' }, 404);
    }

    const body = await c.req.json();
    const updatedFile = {
      ...existing,
      criteria: body.criteria
    };

    await kv.set(`criteria_file:${applicationId}:${id}`, updatedFile);
    console.log(`✅ Updated file: ${id}`);
    return c.json(updatedFile);
  } catch (error) {
    console.error('❌ Error updating criteria file:', error);
    return c.json({ error: 'Failed to update criteria file' }, 500);
  }
});

// Delete file metadata
app.delete("/make-server-604ca09d/criteria/:applicationId/files/:id", async (c) => {
  const applicationId = c.req.param('applicationId');
  const id = c.req.param('id');
  console.log(`🗑️ Deleting file: ${id} for application: ${applicationId}`);

  try {
    await kv.del(`criteria_file:${applicationId}:${id}`);
    console.log(`✅ Deleted file: ${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting criteria file:', error);
    return c.json({ error: 'Failed to delete criteria file' }, 500);
  }
});


// --- Criteria Description Endpoints ---

// Get all descriptions for an application
app.get("/make-server-604ca09d/criteria/:applicationId/descriptions", async (c) => {
  const applicationId = c.req.param('applicationId');
  console.log(`📋 Fetching descriptions for application: ${applicationId}`);

  try {
    const descs = await kv.getByPrefix(`criteria_desc:${applicationId}:`);
    console.log(`✅ Found ${descs.length} descriptions for application ${applicationId}`);
    return c.json(descs);
  } catch (error) {
    console.error('❌ Error fetching criteria descriptions:', error);
    return c.json({ error: 'Failed to fetch criteria descriptions' }, 500);
  }
});

// Create description
app.post("/make-server-604ca09d/criteria/:applicationId/descriptions", async (c) => {
  const applicationId = c.req.param('applicationId');
  console.log(`📝 Creating description for application: ${applicationId}`);

  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    
    const desc = {
      ...body,
      id,
      application_id: applicationId,
      created_date: body.created_date || new Date().toISOString()
    };

    await kv.set(`criteria_desc:${applicationId}:${id}`, desc);
    console.log(`✅ Created description: ${id}`);
    return c.json(desc, 201);
  } catch (error) {
    console.error('❌ Error creating criteria description:', error);
    return c.json({ error: 'Failed to create criteria description' }, 500);
  }
});

// Update description criteria
app.put("/make-server-604ca09d/criteria/:applicationId/descriptions/:id", async (c) => {
  const applicationId = c.req.param('applicationId');
  const id = c.req.param('id');
  console.log(`✏️ Updating description: ${id} for application: ${applicationId}`);

  try {
    const existing = await kv.get(`criteria_desc:${applicationId}:${id}`);
    if (!existing) {
      console.log(`⚠️ Description not found: ${id}`);
      return c.json({ error: 'Description not found' }, 404);
    }

    const body = await c.req.json();
    const updatedDesc = {
      ...existing,
      criteria: body.criteria
    };

    await kv.set(`criteria_desc:${applicationId}:${id}`, updatedDesc);
    console.log(`✅ Updated description: ${id}`);
    return c.json(updatedDesc);
  } catch (error) {
    console.error('❌ Error updating criteria description:', error);
    return c.json({ error: 'Failed to update criteria description' }, 500);
  }
});

// Delete description
app.delete("/make-server-604ca09d/criteria/:applicationId/descriptions/:id", async (c) => {
  const applicationId = c.req.param('applicationId');
  const id = c.req.param('id');
  console.log(`🗑️ Deleting description: ${id} for application: ${applicationId}`);

  try {
    await kv.del(`criteria_desc:${applicationId}:${id}`);
    console.log(`✅ Deleted description: ${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting criteria description:', error);
    return c.json({ error: 'Failed to delete criteria description' }, 500);
  }
});

// --- Storage Helper Endpoints ---

// Get signed upload URL for secure uploads to private buckets
app.post("/make-server-604ca09d/storage/upload-url", async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    const { bucket, path } = await c.req.json();
    if (!bucket || !path) {
      return c.json({ error: 'Bucket and path are required' }, 400);
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) {
      console.error('Error creating signed upload URL:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (error: any) {
    console.error('Error generating upload URL:', error.message);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Stripe Webhook endpoint (for testing)
app.post("/make-server-604ca09d/stripe-webhook", async (c) => {
  try {
    console.log('🔔 Stripe Webhook endpoint hit!');
    console.log('Method:', c.req.method);
    console.log('Path:', c.req.path);
    console.log('Headers:', Object.fromEntries(c.req.raw.headers.entries()));
    
    const body = await c.req.text();
    const signature = c.req.header('stripe-signature');
    
    console.log('🔔 Stripe Webhook Received');
    console.log('Signature:', signature);
    console.log('Body length:', body.length);
    
    // Parse the event
    let event;
    try {
      event = JSON.parse(body);
    } catch (e) {
      console.error('Failed to parse webhook body:', e);
      return c.json({ error: 'Invalid JSON' }, 400);
    }
    
    console.log('Event Type:', event.type);
    console.log('Event ID:', event.id);
    console.log('Event Data:', JSON.stringify(event.data, null, 2));
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('✅ Checkout completed:', event.data.object.id);
        break;
      case 'customer.subscription.created':
        console.log('✅ Subscription created:', event.data.object.id);
        break;
      case 'customer.subscription.updated':
        console.log('✅ Subscription updated:', event.data.object.id);
        break;
      case 'customer.subscription.deleted':
        console.log('✅ Subscription deleted:', event.data.object.id);
        break;
      case 'invoice.payment_succeeded':
        console.log('✅ Payment succeeded:', event.data.object.id);
        break;
      case 'invoice.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        break;
      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }
    
    return c.json({ 
      received: true,
      event_type: event.type,
      event_id: event.id
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return c.json({ error: error.message }, 400);
  }
});

Deno.serve(app.fetch);