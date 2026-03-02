import { supabase } from '@/lib/supabase';
import { Application, CreateApplicationDTO, UpdateApplicationDTO } from '../types/application';

export const applicationsService = {
  async getApplications(): Promise<Application[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("User is not authenticated");
    }

    const { data, error } = await supabase
      .from('user_applications')
      .select('*')
      .eq('user_id', session.user.id)   // ✅ Add user filter to prevent data leak
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      // Even if error occurs, returning empty array might prevent UI crash, 
      // but let's log detailed error to help debug.
      // Common issues: RLS policy not matching, or table not existing.
      throw new Error(`Fetch failed: ${error.message} (${error.code})`);
    }

    return (data || []).map(mapToApplication);
  },

  async createApplication(data: CreateApplicationDTO): Promise<Application> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("User is not authenticated");
    }

    // Check if application of this type already exists for this user
    // This enforces the "one NIW and one EB1A" rule per user
    const { data: existingApp, error: checkError } = await supabase
      .from('user_applications')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('type', data.type)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing application:', checkError);
      throw new Error(`Failed to check existing application: ${checkError.message}`);
    }

    if (existingApp) {
      console.log(`Application of type ${data.type} already exists. Returning existing instance.`);
      return mapToApplication(existingApp);
    }

    // Explicitly select all columns to avoid issues if return value is partial
    const { data: newApp, error } = await supabase
      .from('user_applications')
      .insert({
        user_id: session.user.id,
        name: data.name,
        type: data.type,
        status: 'draft',
        progress: 0,
        // created_at and updated_at are default now() in DB
      })
      .select('*') 
      .single();

    if (error) {
      console.error('Error creating application details:', error);
      // Enhance error message for debugging
      throw new Error(`Create failed: ${error.message} (${error.code}) - Hint: Check RLS policies for INSERT.`);
    }

    if (!newApp) {
        throw new Error("Application created but no data returned. Row Level Security (RLS) might be blocking the SELECT after INSERT.");
    }

    return mapToApplication(newApp);
  },

  async updateApplication(id: string, updates: UpdateApplicationDTO): Promise<Application> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("User is not authenticated");
    }

    const { data: updatedApp, error } = await supabase
      .from('user_applications')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('application_id', id) // Ensure this matches schema primary key
      .select('*')
      .single();

    if (error) {
      console.error('Error updating application:', error);
      throw new Error(`Update failed: ${error.message} (${error.code})`);
    }

    return mapToApplication(updatedApp);
  },

  async deleteApplication(id: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("User is not authenticated");
    }

    const { error } = await supabase
      .from('user_applications')
      .delete()
      .eq('application_id', id);

    if (error) {
      console.error('Error deleting application:', error);
      throw new Error(`Delete failed: ${error.message} (${error.code})`);
    }
  }
};

// Helper to map database rows (snake_case) to TypeScript interface (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToApplication(row: any): Application {
  return {
    id: row.application_id, 
    userId: row.user_id,
    name: row.name,
    type: row.type,
    status: row.status,
    progress: row.progress,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}