export interface Pet {
  id: string;
  tutor_id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  bio?: string;
  image_url?: string;
  vaccine_doc_url?: string | null;
  created_at?: string;
  deleted_at?: string | null;
}

export interface Profile {
  id?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface MatchedPet {
  id: string;
  name: string;
  breed?: string;
  species: string;
  tutor_id: string;
  match_id: string;
  image_url?: string;
  unreadCount: number;
}

export type ServiceResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };
