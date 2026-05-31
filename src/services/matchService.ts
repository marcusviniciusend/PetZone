import { supabase } from '../lib/supabase';
import { MatchedPet } from '../types';
import { useActivePetStore } from '../stores/activePetStore';

export type { MatchedPet };

async function resolveMyPetId(userId: string): Promise<string | null> {
  const { activePetId, setActivePetId } = useActivePetStore.getState();
  if (activePetId) return activePetId;

  const { data: myPets } = await supabase
    .from('pets')
    .select('id')
    .eq('tutor_id', userId)
    .is('deleted_at', null)
    .limit(1);

  if (!myPets || myPets.length === 0) return null;
  setActivePetId(myPets[0].id);
  return myPets[0].id;
}

export const matchService = {
  async registerInteraction(targetPetId: string, action: 'like' | 'dislike') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { match: false };

      const myPetId = await resolveMyPetId(user.id);
      if (!myPetId) return { match: false, error: 'NO_PET_FOUND' };

      if (action === 'dislike') {
        const { error: dislikeError } = await supabase
          .from('dislikes')
          .insert({ admirer_pet_id: myPetId, target_pet_id: targetPetId });

        if (dislikeError) console.error('Erro ao salvar dislike:', dislikeError.message);
        return { match: false };
      }

      const { error: insertError } = await supabase
        .from('likes')
        .insert({ admirer_pet_id: myPetId, target_pet_id: targetPetId });

      if (insertError && !insertError.message.includes('duplicate key')) {
        console.error('Erro ao dar like:', insertError.message);
      }

      const { data: matchData } = await supabase
        .from('likes')
        .select('id')
        .eq('admirer_pet_id', targetPetId)
        .eq('target_pet_id', myPetId)
        .maybeSingle();

      if (matchData) return { match: true };
      return { match: false };

    } catch (error) {
      console.error('Erro no fluxo de interação:', error);
      return { match: false };
    }
  },

  async getMyLikedPets(): Promise<MatchedPet[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const myPetId = await resolveMyPetId(user.id);
      if (!myPetId) return [];

      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          pet1:pets!pet1_id(id, name, breed, species, tutor_id, image_url),
          pet2:pets!pet2_id(id, name, breed, species, tutor_id, image_url)
        `)
        .or(`pet1_id.eq.${myPetId},pet2_id.eq.${myPetId}`);

      if (error) throw error;
      if (!data) return [];

      const seenPetIds = new Set<string>();
      const uniqueMatches: Omit<MatchedPet, 'unreadCount'>[] = [];

      for (const m of data) {
        const p1 = m.pet1 as unknown as MatchedPet;
        const p2 = m.pet2 as unknown as MatchedPet;
        if (!p1 || !p2) continue;

        const otherPet = p1.id === myPetId ? p2 : p1;
        if (!seenPetIds.has(otherPet.id)) {
          seenPetIds.add(otherPet.id);
          uniqueMatches.push({ ...otherPet, match_id: m.id });
        }
      }

      if (uniqueMatches.length === 0) return [];

      const matchIds = uniqueMatches.map(m => m.match_id);
      const { data: unreadData } = await supabase
        .from('messages')
        .select('match_id')
        .eq('receiver_id', user.id)
        .eq('read', false)
        .in('match_id', matchIds);

      const unreadByMatch = (unreadData || []).reduce<Record<string, number>>((acc, msg) => {
        acc[msg.match_id] = (acc[msg.match_id] || 0) + 1;
        return acc;
      }, {});

      return uniqueMatches.map(m => ({
        ...m,
        unreadCount: unreadByMatch[m.match_id] || 0,
      }));

    } catch (error) {
      console.error('Erro ao buscar matches:', error);
      return [];
    }
  },
};
