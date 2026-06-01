import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const CONSENT_KEY = '@petzone_lgpd_consent';

// ─── Consentimento ────────────────────────────────────────────────────────────

export async function saveLGPDConsent(): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, new Date().toISOString());
}

export async function getLGPDConsent(): Promise<string | null> {
  return AsyncStorage.getItem(CONSENT_KEY);
}

export async function hasLGPDConsent(): Promise<boolean> {
  const consent = await AsyncStorage.getItem(CONSENT_KEY);
  return consent !== null;
}

// ─── Exportação de dados (art. 15 LGPD) ─────────────────────────────────────

export async function exportUserData(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const [profileResult, petsResult, matchesResult] = await Promise.all([
    supabase.from('profiles').select('full_name, bio, avatar_url').eq('id', user.id).single(),
    supabase.from('pets').select('name, species, breed, age, bio, image_url, vaccine_doc_url, deleted_at').eq('tutor_id', user.id),
    supabase.from('matches').select('id, created_at, pet1_id, pet2_id').or(
      `pet1_id.in.(${await getUserPetIds(user.id)}),pet2_id.in.(${await getUserPetIds(user.id)})`
    ),
  ]);

  const payload = {
    exportadoEm: new Date().toISOString(),
    email: user.email,
    perfil: profileResult.data ?? {},
    pets: petsResult.data ?? [],
    matches: matchesResult.data ?? [],
  };

  return JSON.stringify(payload, null, 2);
}

// ─── Exclusão de dados (art. 18 LGPD) ───────────────────────────────────────

export async function deleteUserData(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const petIds = await getUserPetIds(user.id);

    // 1. Mensagens enviadas pelo usuário
    await supabase.from('messages').delete().eq('sender_id', user.id);

    if (petIds.length > 0) {
      // 2. Likes e dislikes dos pets do usuário
      await supabase.from('likes').delete().in('admirer_pet_id', petIds);
      await supabase.from('dislikes').delete().in('admirer_pet_id', petIds);

      // 3. Matches dos pets do usuário
      await supabase.from('matches').delete().in('pet1_id', petIds);
      await supabase.from('matches').delete().in('pet2_id', petIds);

      // 4. Pets do usuário
      await supabase.from('pets').delete().eq('tutor_id', user.id);
    }

    // 5. Perfil do usuário
    await supabase.from('profiles').delete().eq('id', user.id);

    // 6. Consentimento local
    await AsyncStorage.removeItem(CONSENT_KEY);

    // 7. Encerrar sessão (exclusão da conta de auth requer endpoint server-side)
    await supabase.auth.signOut();

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Erro inesperado ao excluir dados.' };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUserPetIds(userId: string): Promise<string[]> {
  const { data } = await supabase.from('pets').select('id').eq('tutor_id', userId);
  return (data ?? []).map((p: { id: string }) => p.id);
}
