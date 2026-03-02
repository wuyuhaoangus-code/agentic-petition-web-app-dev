import { getSupabaseClient } from '../../lib/backend';

export interface UserForm {
  id: string;
  application_id: string;
  user_id: string;
  form_type: string; // Mapped from criteria field
  form_name: string; // Mapped from file_name
  status: 'not_started' | 'in_progress' | 'finished';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  upload_date: string | null;
  last_modified: string;
  created_at: string;
}

/**
 * Parse criteria field from DB — handles all formats:
 *  - Array:   ['i140']
 *  - JSON str: '["i140"]'
 *  - Plain str: 'i140'
 *  - Comma-sep: 'i140,g28'
 */
function parseCriteria(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    // Items inside might themselves be JSON strings like '["i140"]'
    return raw
      .flatMap((item: any) => {
        if (typeof item === 'string') {
          const t = item.trim();
          if (t.startsWith('[')) {
            try { return JSON.parse(t); } catch { return [t]; }
          }
          return t ? [t] : [];
        }
        return [item];
      })
      .map((c: string) => c.replace(/^["']|["']$/g, '').trim())
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    if (t.startsWith('[')) {
      try { return JSON.parse(t); } catch { /* fall through */ }
    }
    // Comma-separated plain string  e.g. "i140" or "i140,g28"
    return t.split(',').map((c) => c.trim()).filter(Boolean);
  }
  return [];
}

// Helper to map user_files row to UserForm interface
function mapUserFileToForm(file: any): UserForm {
  const criteriaArray = parseCriteria(file.criteria);
  const formType = criteriaArray.length > 0 ? criteriaArray[0] : 'unknown';

  return {
    id: file.id,
    application_id: file.application_id,
    user_id: file.user_id,
    form_type: formType,
    form_name: file.file_name,
    status: 'finished', // If file exists in DB, it's uploaded (finished)
    file_url: file.file_url || file.file_path || null, // DB stores path in file_url column
    file_name: file.file_name,
    file_size: file.file_size,
    upload_date: file.created_at,
    last_modified: file.updated_at || file.created_at,
    created_at: file.created_at,
  };
}

export const formsService = {
  // Get all forms for an application (category='form' or 'Forms' for backward compat)
  async getForms(applicationId: string): Promise<UserForm[]> {
    console.log('🔍 [formsService.getForms] Querying forms:', { applicationId });

    const supabase = getSupabaseClient();

    // Get current user for RLS safety (mirrors criteriaService pattern)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('⚠️ [formsService.getForms] No authenticated user');
      return [];
    }

    const { data, error } = await supabase
      .from('user_files')
      .select('*')
      .eq('application_id', applicationId)
      .eq('user_id', user.id)
      // Support both 'form' (new) and 'Forms' (legacy) for backward compat
      .in('category', ['form', 'Forms'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ [formsService.getForms] Query error:', error);
      throw error;
    }

    console.log('✅ [formsService.getForms] Raw DB rows returned:', data?.length ?? 0, data);

    const mappedForms = (data || []).map(mapUserFileToForm);
    console.log('✅ [formsService.getForms] Mapped forms:', mappedForms.map(f => ({
      id: f.id,
      form_type: f.form_type,
      file_url: f.file_url,
      file_name: f.file_name,
      status: f.status,
    })));

    return mappedForms;
  },

  // Get signed URL for viewing form
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await getSupabaseClient().storage
      .from('user-files')
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  // Upload and save in one transaction (following criteriaService pattern)
  async uploadAndSaveForm(
    file: File,
    applicationId: string,
    userId: string,
    formType: string,
    formName: string
  ): Promise<UserForm> {
    console.log('🚀 [formsService.uploadAndSaveForm] Starting:', {
      formType,
      formName,
      fileSize: file.size,
      applicationId,
      userId
    });

    const supabase = getSupabaseClient();

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }
    if (user.id !== userId) {
      console.error('❌ User ID mismatch:', { authenticatedUserId: user.id, passedUserId: userId });
      throw new Error('User ID mismatch');
    }

    // 2. Check if form already exists (support both category casing)
    const { data: existing } = await supabase
      .from('user_files')
      .select('*')
      .eq('application_id', applicationId)
      .eq('user_id', user.id)
      .in('category', ['form', 'Forms'])
      .contains('criteria', [formType])
      .maybeSingle();

    // 3. Prepare upload path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${applicationId}/${timestamp}_${sanitizedName}`;

    // 4. Upload to Storage
    console.log('📤 Uploading file to storage:', filePath);
    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    console.log('✅ File uploaded successfully to Storage');

    if (existing) {
      console.log('📝 Form already exists, updating DB record:', existing.id);

      const { data: updatedFile, error: updateError } = await supabase
        .from('user_files')
        .update({
          file_name: file.name,
          file_size: file.size,
          file_url: filePath,
          file_type: file.type,
          category: 'form', // Normalise to lowercase on update
        })
        .eq('id', existing.id)
        .eq('user_id', user.id)
        .eq('application_id', applicationId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        await supabase.storage.from('user-files').remove([filePath]);
        throw new Error(`Failed to update file metadata: ${updateError.message}`);
      }

      console.log('✅ Form metadata updated in database');
      return mapUserFileToForm(updatedFile);
    }

    // 5. Insert new record
    const { data: insertedFile, error: dbError } = await supabase
      .from('user_files')
      .insert({
        user_id: user.id,
        application_id: applicationId,
        file_name: file.name,
        file_size: file.size,
        file_url: filePath,
        file_type: file.type,
        criteria: [formType],
        is_sensitive: false,
        category: 'form',
        content_hash: '',
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insert error:', dbError);
      await supabase.storage.from('user-files').remove([filePath]);
      throw new Error(`Failed to save file metadata: ${dbError.message}`);
    }

    console.log('✅ Inserted new form record. Raw DB response:', insertedFile);
    const mapped = mapUserFileToForm(insertedFile);
    console.log('✅ Mapped inserted form:', mapped);
    return mapped;
  },

  // Delete form (and file from storage)
  async deleteForm(formId: string, applicationId: string, filePath: string | null): Promise<void> {
    if (filePath) {
      await getSupabaseClient().storage
        .from('user-files')
        .remove([filePath]);
    }
    const { error } = await getSupabaseClient()
      .from('user_files')
      .delete()
      .eq('id', formId)
      .eq('application_id', applicationId);

    if (error) throw error;
  }
};