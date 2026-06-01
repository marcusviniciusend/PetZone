import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

const BUCKET = 'pet-photos';
const VACCINE_BUCKET = 'vaccine-docs';

export type SelectImageResult =
  | { type: 'success'; uri: string; base64: string }
  | { type: 'cancelled' }
  | { type: 'permission_denied' };

export type UploadResult =
  | { type: 'success'; url: string }
  | { type: 'error'; error: string };

export const imageService = {
  async selectImage(): Promise<SelectImageResult> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return { type: 'permission_denied' };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return { type: 'cancelled' };

    return {
      type: 'success',
      uri: result.assets[0].uri,
      base64: result.assets[0].base64,
    };
  },

  async uploadPetPhoto(base64: string): Promise<UploadResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { type: 'error', error: 'Usuário não autenticado.' };

      const filePath = `${user.id}/${Date.now()}.jpg`;
      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, arrayBuffer, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) return { type: 'error', error: uploadError.message };

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      return { type: 'success', url: data.publicUrl };
    } catch {
      return { type: 'error', error: 'Falha inesperada ao enviar a foto.' };
    }
  },

  async uploadVaccinePhoto(base64: string): Promise<UploadResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { type: 'error', error: 'Usuário não autenticado.' };

      const filePath = `${user.id}/${Date.now()}.jpg`;
      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from(VACCINE_BUCKET)
        .upload(filePath, arrayBuffer, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) return { type: 'error', error: uploadError.message };

      const { data } = supabase.storage.from(VACCINE_BUCKET).getPublicUrl(filePath);
      return { type: 'success', url: data.publicUrl };
    } catch {
      return { type: 'error', error: 'Falha inesperada ao enviar o documento.' };
    }
  },
};
