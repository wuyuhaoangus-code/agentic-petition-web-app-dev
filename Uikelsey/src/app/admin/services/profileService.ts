import { projectId } from '@/lib/supabase-info';
import { supabase } from '@/lib/supabase';
import { Profile, ProfileUpdateData } from '../../types/profile';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-604ca09d`;

// Try Edge Function first (after Figma deployment), fallback to Direct Supabase
export const profileService = {
  async getProfile(): Promise<Profile | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    console.log('📋 Testing Edge Function after Figma deployment');
    console.log('🔵 Fetching from:', `${SERVER_URL}/profile`);

    try {
      const response = await fetch(`${SERVER_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('🔵 Edge Function response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Edge Function SUCCESS! Data:', data);
        return Object.keys(data).length === 0 ? null : data;
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Edge Function failed, trying Direct Supabase. Error:', errorText);
        throw new Error('Edge Function failed');
      }
    } catch (error) {
      // Fallback to Direct Supabase
      console.log('🔄 Falling back to Direct Supabase...');
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (dbError) throw dbError;
      console.log('✅ Direct Supabase SUCCESS! Data:', data);
      return data;
    }
  },

  async updateProfile(updates: ProfileUpdateData): Promise<Profile> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    console.log('📋 Updating profile...');

    try {
      // Try Edge Function first
      const response = await fetch(`${SERVER_URL}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Edge Function update SUCCESS!');
        return data;
      } else {
        throw new Error('Edge Function failed');
      }
    } catch (error) {
      // Fallback to Direct Supabase
      console.log('🔄 Falling back to Direct Supabase for update...');
      const { data, error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          updated_at: new Date().toISOString(),
          ...updates
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      console.log('✅ Direct Supabase update SUCCESS!');
      return data;
    }
  }
};