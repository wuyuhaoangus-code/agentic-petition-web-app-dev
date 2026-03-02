import { supabase } from '../../lib/supabase';

export interface UserPetitionDocument {
  id: string;
  run_id: string;
  application_id: string;
  user_id: string;
  document_type: 'petition' | 'cover_letter';
  file_name: string;
  file_size: number | null;
  file_path: string | null;
  status: 'generating' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface PetitionRun {
  id: string;
  application_id: string;
  user_id: string;
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

/**
 * Fetch user petition documents from Supabase (direct table access)
 * Similar to how we fetch exhibits in exhibitService.ts
 * 
 * @param applicationId - Filter by application ID
 * @param userId - Filter by user ID (required for RLS)
 * @returns Array of petition documents
 */
export async function fetchUserPetitionDocuments(
  applicationId: string,
  userId: string
): Promise<UserPetitionDocument[]> {
  console.log('📥 Loading petition documents from Supabase:', {
    applicationId,
    userId,
    table: 'user_petition_documents'
  });

  try {
    // Query user_petition_documents table with filters
    const { data, error } = await supabase
      .from('user_petition_documents')
      .select('*')
      .eq('application_id', applicationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true }); // v1 = earliest

    if (error) {
      console.error('❌ Failed to fetch petition documents:', error);
      throw new Error(`Failed to fetch petition documents: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ No petition documents found for this application');
      return [];
    }

    console.log(`✅ Found ${data.length} petition documents`);
    console.log('📋 Petition documents:', JSON.stringify(data, null, 2));

    return data;
  } catch (error: any) {
    console.error('❌ Error in fetchUserPetitionDocuments:', error);
    throw error;
  }
}

/**
 * Fetch petition runs from Supabase (to check for in-progress/stuck generations)
 * 
 * @param applicationId - Filter by application ID
 * @param userId - Filter by user ID (required for RLS)
 * @returns Array of petition runs
 */
export async function fetchPetitionRuns(
  applicationId: string,
  userId: string
): Promise<PetitionRun[]> {
  console.log('📥 Loading petition runs from Supabase:', {
    applicationId,
    userId,
    table: 'petition_runs'
  });

  try {
    // Query petition_runs table with filters
    const { data, error } = await supabase
      .from('petition_runs')
      .select('*')
      .eq('application_id', applicationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Failed to fetch petition runs:', error);
      throw new Error(`Failed to fetch petition runs: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ No petition runs found for this application');
      return [];
    }

    console.log(`✅ Found ${data.length} petition runs`);
    console.log('📊 Status breakdown:', data.reduce((acc: any, run: any) => {
      const status = run.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}));

    return data;
  } catch (error: any) {
    console.error('❌ Error in fetchPetitionRuns:', error);
    throw error;
  }
}

/**
 * Download a petition document by ID using signed URL
 * This retrieves the file from Supabase Storage using a temporary signed URL
 * 
 * @param documentId - The document ID from user_petition_documents
 * @returns Blob of the document file
 */
export async function downloadPetitionDocument(documentId: string): Promise<Blob> {
  console.log('📥 Downloading petition document:', documentId);

  try {
    // First, get the document metadata to get the file_path
    const { data: doc, error: docError } = await supabase
      .from('user_petition_documents')
      .select('file_path, file_name')
      .eq('id', documentId)
      .single();

    if (docError || !doc || !doc.file_path) {
      console.error('❌ Document not found:', docError);
      throw new Error(`Document not found or missing file_path: ${docError?.message}`);
    }

    console.log('📄 Document metadata:', {
      file_path: doc.file_path,
      file_name: doc.file_name
    });

    // Try multiple possible bucket names
    const possibleBuckets = ['user-files', 'user-uploads', 'petition-documents', 'documents', 'generated-documents'];
    
    let blob: Blob | null = null;
    let lastError: any = null;

    for (const bucketName of possibleBuckets) {
      try {
        console.log(`🔍 Trying bucket: ${bucketName}`);

        // Use signed URL approach (more reliable and works around some RLS issues)
        const { data: signedUrlData, error: urlError } = await supabase
          .storage
          .from(bucketName)
          .createSignedUrl(doc.file_path, 60); // 60 seconds expiry

        if (urlError) {
          console.log(`  ❌ Signed URL failed: ${urlError.message}`);
          lastError = urlError;
          continue;
        }

        if (!signedUrlData?.signedUrl) {
          console.log(`  ❌ No signed URL returned`);
          continue;
        }

        console.log(`  ✅ Got signed URL from ${bucketName}, fetching file...`);

        // Fetch the file using the signed URL
        const response = await fetch(signedUrlData.signedUrl);
        
        if (!response.ok) {
          console.log(`  ❌ Fetch failed: ${response.status} ${response.statusText}`);
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          continue;
        }

        blob = await response.blob();

        if (!blob || blob.size === 0) {
          console.log(`  ❌ Downloaded blob is empty`);
          lastError = new Error('Downloaded blob is empty');
          continue;
        }

        console.log(`  ✅✅ Successfully downloaded from ${bucketName}:`, {
          size: blob.size,
          type: blob.type
        });
        
        break; // Success! Exit the loop
      } catch (error: any) {
        console.log(`  ❌ Exception with bucket ${bucketName}:`, error.message);
        lastError = error;
      }
    }

    if (!blob) {
      console.error('❌ Failed to download from all buckets. Last error:', lastError);
      throw new Error(`Failed to download from any bucket. Last error: ${lastError?.message || 'Unknown error'}. Please ensure storage RLS policies allow authenticated users to read their own files.`);
    }

    return blob;
  } catch (error: any) {
    console.error('❌ Error downloading petition document:', error);
    throw error;
  }
}

/**
 * Delete petition documents and storage files by run_id
 * This removes both database records and actual files from Supabase Storage
 * 
 * @param runId - The run_id to delete all associated documents
 * @param userId - User ID for verification (required for RLS)
 * @returns Success status
 */
export async function deletePetitionByRunId(runId: string, userId: string): Promise<void> {
  console.log('🗑️ Deleting petition documents for run_id:', runId);

  try {
    // Step 1: Get all documents for this run_id
    const { data: documents, error: fetchError } = await supabase
      .from('user_petition_documents')
      .select('id, file_path, file_name, document_type')
      .eq('run_id', runId)
      .eq('user_id', userId);

    if (fetchError) {
      console.error('❌ Failed to fetch documents for deletion:', fetchError);
      throw new Error(`Failed to fetch documents: ${fetchError.message}`);
    }

    if (!documents || documents.length === 0) {
      console.log('ℹ️ No documents found for this run_id');
      return;
    }

    console.log(`📋 Found ${documents.length} documents to delete:`, documents.map(d => d.file_name));

    // Step 2: Delete files from storage
    const bucketName = 'user-files';
    const filePaths = documents
      .filter(d => d.file_path)
      .map(d => d.file_path as string);

    if (filePaths.length > 0) {
      console.log(`🗑️ Deleting ${filePaths.length} files from storage bucket: ${bucketName}`);
      
      const { data: deleteData, error: storageError } = await supabase
        .storage
        .from(bucketName)
        .remove(filePaths);

      if (storageError) {
        console.error('⚠️ Storage deletion error (continuing with DB deletion):', storageError);
        // Don't throw - continue with DB deletion even if storage fails
      } else {
        console.log('✅ Storage files deleted successfully');
      }
    }

    // Step 3: Delete database records
    const { error: dbError } = await supabase
      .from('user_petition_documents')
      .delete()
      .eq('run_id', runId)
      .eq('user_id', userId);

    if (dbError) {
      console.error('❌ Failed to delete database records:', dbError);
      throw new Error(`Failed to delete database records: ${dbError.message}`);
    }

    console.log('✅ Database records deleted successfully');

    // Step 4: Optionally delete the petition_run record itself
    const { error: runError } = await supabase
      .from('petition_runs')
      .delete()
      .eq('id', runId)
      .eq('user_id', userId);

    if (runError) {
      console.error('⚠️ Failed to delete petition_run record:', runError);
      // Don't throw - documents are already deleted
    } else {
      console.log('✅ Petition run record deleted successfully');
    }

    console.log('✅✅ Petition deletion completed successfully');
  } catch (error: any) {
    console.error('❌ Error deleting petition:', error);
    throw error;
  }
}