/**
 * Backend API Layer
 * 
 * Handles all backend communications with authentication.
 * Similar to Uikelsey pattern: gets token from Supabase auth,
 * but directly accesses Supabase tables instead of FastAPI.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '@/lib/supabase-info';
import { supabase } from './supabase'; // ✅ Import the singleton client

const supabaseUrl = `https://${projectId}.supabase.co`;

// Use the singleton Supabase client from supabase.ts
// This ensures all code shares the same auth state
export function getSupabaseClient(): SupabaseClient {
  return supabase;
}

/**
 * Get current auth session and token
 */
export async function getAuthToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Failed to get session:', error);
    return null;
  }
  
  return session?.access_token || null;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Failed to get user:', error);
    return null;
  }
  
  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

/**
 * Wrapper for fetch requests that handles HTML responses gracefully
 */
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error: any) {
    console.error('Network error:', error);
    throw error;
  }
}

/**
 * Parse JSON response with HTML fallback handling
 */
async function parseJsonResponse<T>(response: Response, defaultValue?: T): Promise<T> {
  // Check if response is HTML (common in dev environment when API doesn't exist)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    console.warn(`API endpoint returned HTML instead of JSON for ${response.url} - likely API not available in this environment`);
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error('API not available in preview environment');
  }

  try {
    return await response.json();
  } catch (error: any) {
    console.error('JSON parse error:', error);
    if (defaultValue !== undefined) {
      console.warn('Returning default value due to parse error');
      return defaultValue;
    }
    throw new Error('Invalid JSON response from API');
  }
}

/**
 * AI PIPELINE: Generate Exhibits (Bouncer group_into_exhibits)
 */
export async function generateExhibits(
  criteriaId: string,
  runId?: string,
  applicationId?: string
): Promise<{
  status: string;
  run_id: string;
  exhibits: Array<{ id: string; number: number; title: string; summary: string }>;
}> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  const base = getApiBaseUrl();
  const params = new URLSearchParams({ criteria_id: criteriaId });
  if (runId) params.set('run_id', runId);
  if (applicationId) params.set('application_id', applicationId);
  const url = `${base}/petitions/generate-exhibits?${params.toString()}`;

  try {
    const response = await apiFetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to generate exhibits (${response.status})`);
    }

    return parseJsonResponse(response);
  } catch (error: any) {
    // Handle network errors or JSON parsing errors gracefully
    console.error('Error generating exhibits:', error);
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * AI PIPELINE: Confirm Exhibits (finalize user mapping)
 */
export async function confirmExhibits(
  criteriaId: string,
  exhibits: Array<{
    title: string;
    summary?: string;
    doc_ids: string[];
  }>,
  runId?: string,
  applicationId?: string
): Promise<{
  status: string;
  run_id: string;
  exhibits: Array<{
    id: string;
    criteria_id: string;
    title: string;
    number: number;
    summary?: string | null;
  }>;
}> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  const base = getApiBaseUrl();
  const response = await apiFetch(`${base}/petitions/confirm-exhibits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      criteria_id: criteriaId,
      application_id: applicationId,
      run_id: runId,
      exhibits,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to confirm exhibits (${response.status})`);
  }

  return parseJsonResponse(response);
}

/**
 * AI PIPELINE: Draft Petition Section
 */
export async function draftPetitionSection(exhibitId: string): Promise<{
  status: string;
  draft: string;
}> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  const base = getApiBaseUrl();
  const response = await apiFetch(`${base}/petitions/draft-petition-section?exhibit_id=${exhibitId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to draft petition section (${response.status})`);
  }

  return parseJsonResponse(response);
}

/**
 * AI PIPELINE: Synthesize criteria section intro/conclusion
 */
export async function synthesizeSectionConclusion(
  runId: string,
  criteriaId?: string
): Promise<{
  status: string;
  criteria_id: string;
  section_intro: string;
  section_conclusion: string;
}> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  const base = getApiBaseUrl();
  const params = new URLSearchParams({ run_id: runId });
  if (criteriaId) params.set('criteria_id', criteriaId);
  const response = await apiFetch(`${base}/petitions/synthesize-section-conclusion?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to synthesize section conclusion (${response.status})`);
  }

  return parseJsonResponse(response);
}

export interface ExportPackageManifestEntry {
  sort_order: number;
  zip_entry_name: string;
  entry_type: 'storage_file' | 'inline_text';
  storage_path: string | null;
  has_inline_text: boolean;
}

export async function getExportPackageManifest(documentId: string): Promise<{
  document_id: string;
  run_id: string;
  entries: ExportPackageManifestEntry[];
}> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  const base = getApiBaseUrl();
  const url = `${base}/petitions/export-package-manifest?document_id=${encodeURIComponent(documentId)}`;
  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to fetch export package manifest (${response.status})`);
  }

  return parseJsonResponse(response);
}

/**
 * AI PIPELINE: Download Petition Section (Builder)
 */
export async function downloadPetitionSection(runIds: string | string[]): Promise<Blob> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  const base = getApiBaseUrl();
  const ids = Array.isArray(runIds) ? runIds.join(',') : runIds;
  const response = await apiFetch(`${base}/petitions/download-petition-section?run_ids=${ids}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to download petition section (${response.status})`);
  }

  return response.blob();
}

/**
 * AI PIPELINE: Generate and persist final petition document
 */
export async function generateFinalDocument(
  runIds: string[],
  applicationId?: string,
  title?: string
): Promise<{ document_id: string; file_name: string; file_path: string }> {
  const token = await getAuthToken();
  if (!token) throw new Error('No auth token available');

  const base = getApiBaseUrl();
  const url = `${base}/petitions/generate-final-document`;

  console.log('🚀 Generating final document:', {
    url,
    runIds,
    applicationId,
    title,
    hasToken: !!token
  });

  try {
    const response = await apiFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        run_ids: runIds,
        application_id: applicationId,
        title,
      }),
    });

    console.log('📥 Generate final document response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Generate final document error:', errorText);
      throw new Error(errorText || `Failed to generate final document (${response.status})`);
    }

    const result = await parseJsonResponse(response, { document_id: '', file_name: '', file_path: '' });
    console.log('✅ Generated document:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Generate final document failed:', error);
    throw error;
  }
}

/**
 * AI PIPELINE: Download persisted final petition document by document_id
 */
export async function downloadFinalDocument(documentId: string): Promise<Blob> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  const base = getApiBaseUrl();
  console.log('🌐 Fetching document from:', `${base}/petitions/download-final-document?document_id=${documentId}`);
  
  const response = await apiFetch(`${base}/petitions/download-final-document?document_id=${documentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('📡 Response status:', response.status);
  console.log('📡 Response headers:', {
    contentType: response.headers.get('content-type'),
    contentLength: response.headers.get('content-length'),
    contentDisposition: response.headers.get('content-disposition'),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Download failed:', errorText);
    throw new Error(errorText || `Failed to download final document (${response.status})`);
  }

  const blob = await response.blob();
  console.log('✅ Blob created:', { size: blob.size, type: blob.type });
  
  return blob;
}

export interface UserPetitionDocumentItem {
  id: string;
  run_id: string;
  application_id: string | null;
  document_type: string; // 'petition' | 'cover_letter'
  file_name: string;
  file_size: number | null;
  status: string;
  created_at: string | null;
}

/**
 * List generated petition documents for the current user (from user_petition_documents).
 * Ordered by created_at ascending (v1 = earliest).
 */
export async function listUserPetitionDocuments(applicationId?: string): Promise<{ documents: UserPetitionDocumentItem[] }> {
  // ✅ Use direct Supabase query instead of API (API not available in preview)
  const supabase = getSupabaseClient();
  
  // 🔍 Get current user info for debugging
  const user = await getCurrentUser();
  
  if (!user) {
    console.error('❌ No authenticated user found');
    return { documents: [] };
  }
  
  console.log('🔍 Current authenticated user:', {
    userId: user.id,
    email: user.email,
    applicationId
  });
  
  console.log('🔍 Fetching petition documents from Supabase:', {
    userId: user.id,
    applicationId,
    table: 'user_petition_documents'
  });

  try {
    // 🔍 DEBUG: First query WITHOUT filter to see ALL rows in table
    console.log('🔍 DEBUG: Querying ALL rows in user_petition_documents (no filter)...');
    const { data: allData, error: allError, count: allCount } = await supabase
      .from('user_petition_documents')
      .select('*', { count: 'exact' });
    
    console.log('🔍 DEBUG: ALL rows in table (first 5):', {
      count: allCount,
      error: allError,
      sample: allData?.slice(0, 5).map(d => ({
        id: d.id,
        application_id: d.application_id,
        user_id: d.user_id,
        document_type: d.document_type,
        status: d.status,
        file_name: d.file_name,
        created_at: d.created_at
      }))
    });

    // Now query with user_id filter (CRITICAL - same as backend!)
    let query = supabase
      .from('user_petition_documents')
      .select('*')
      .eq('user_id', user.id)  // ✅ Filter by user_id like backend does
      .order('created_at', { ascending: true });

    if (applicationId) {
      console.log('🔍 DEBUG: Also filtering by application_id:', applicationId);
      query = query.eq('application_id', applicationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase error fetching petition documents:', error);
      return { documents: [] };
    }

    console.log('✅ Fetched ALL petition documents from Supabase (no status filter):', {
      count: data?.length || 0,
      statusBreakdown: data?.reduce((acc: any, doc: any) => {
        const status = doc.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      documents: data?.map(d => ({
        id: d.id,
        document_type: d.document_type,
        status: d.status,
        file_name: d.file_name,
        created_at: d.created_at
      }))
    });

    // ✅ Filter to only 'ready' documents on the frontend
    const readyDocs = data?.filter(d => d.status === 'ready') || [];
    
    console.log(`📊 Returning ${readyDocs.length} ready documents out of ${data?.length || 0} total`);

    return { documents: readyDocs };
  } catch (error: any) {
    console.error('Error fetching petition documents:', error);
    return { documents: [] };
  }
}

export interface PetitionRunItem {
  id: string;
  application_id: string;
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
}

/**
 * List in-progress petition runs from petition_runs table.
 * Ordered by created_at ascending (v1 = earliest).
 */
export async function listInProgressRuns(applicationId: string): Promise<PetitionRunItem[]> {
  const supabase = getSupabaseClient();
  
  console.log('🔍 DEBUG: Fetching petition runs for application:', applicationId);
  
  const { data, error } = await supabase
    .from('petition_runs')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Failed to fetch petition runs:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return [];
  }
  
  console.log('✅ Fetched petition runs:', {
    count: data?.length || 0,
    statusBreakdown: data?.reduce((acc: any, run: any) => {
      const status = run.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}),
    runs: data?.map(r => ({
      id: r.id,
      status: r.status,
      created_at: r.created_at
    }))
  });
  
  return data || [];
}

/**
 * Export petition package as ZIP (01 Cover Letter, 02-04 form placeholders, 05 Petition Letter, then exhibit files).
 * documentId = petition document id from user_petition_documents.
 */
export async function exportPetitionPackage(documentId: string): Promise<Blob> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  const base = getApiBaseUrl();
  const url = `${base}/petitions/export-package?document_id=${encodeURIComponent(documentId)}`;
  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to export package (${response.status})`);
  }

  return response.blob();
}

/**
 * AI PIPELINE: Download Petition Intro (Builder)
 */
export async function downloadPetitionIntro(): Promise<Blob> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  const base = getApiBaseUrl();
  const response = await apiFetch(`${base}/petitions/download-petition-intro`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to download petition intro (${response.status})`);
  }

  return response.blob();
}

// ==================== Profile API ====================

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  occupation?: string;
  field?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  occupation?: string;
  field?: string;
  avatar_url?: string;
}

/**
 * Get user profile
 * Direct Supabase table access with RLS
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  console.log('🔵 Fetching profile for user:', user.id);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle(); // Use maybeSingle() to handle case where profile doesn't exist yet

  if (error) {
    console.error('❌ Error fetching profile:', error);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  console.log('✅ Profile fetched:', data);
  return data;
}

/**
 * Update or create user profile
 * Uses upsert to handle both insert and update
 */
export async function updateProfile(updates: ProfileUpdateData): Promise<Profile> {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  console.log('🔵 Updating profile for user:', user.id);

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id', // Use id as the conflict target
      }
    )
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  console.log('✅ Profile updated:', data);
  return data;
}

/**
 * Delete user profile
 */
export async function deleteProfile(): Promise<void> {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  console.log('🔵 Deleting profile for user:', user.id);

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (error) {
    console.error('❌ Error deleting profile:', error);
    throw new Error(`Failed to delete profile: ${error.message}`);
  }

  console.log('✅ Profile deleted');
}

// ==================== Future: Other API Endpoints ====================

// You can add more API functions here following the same pattern:
// - getUserFiles()
// - createEvidence()
// - updateExhibit()
// etc.

export const backend = {
  // Auth
  getAuthToken,
  getCurrentUser,
  isAuthenticated,
  getSupabaseClient,
  generateExhibits,
  confirmExhibits,
  draftPetitionSection,
  synthesizeSectionConclusion,
  downloadPetitionSection,
  downloadPetitionIntro,
  
  // Profile
  getProfile,
  updateProfile,
  deleteProfile,
};

export default backend;