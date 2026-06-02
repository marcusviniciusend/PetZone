import { supabase } from '../lib/supabase';
import { Profile, ServiceResult } from '../types';

export const profileService = {
  async getProfile(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },

  async updateAvatar(avatarUrl: string): Promise<ServiceResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Usuário não autenticado' };

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: 'Erro inesperado ao atualizar avatar.' };
    }
  },

  async updateProfile(profile: Pick<Profile, 'full_name' | 'bio'>): Promise<ServiceResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Usuário não autenticado' };

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: 'Erro inesperado ao atualizar perfil.' };
    }
  },
};
