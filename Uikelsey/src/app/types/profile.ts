export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  field: string | null;
  occupation: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  created_at: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  field?: string;
  occupation?: string;
  avatar_url?: string;
}
