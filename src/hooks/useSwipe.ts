import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import locationService from '../services/locationService';
import { petService } from '../services/petService';
import { useSwipeStore } from '../stores/swipeStore';

export function useSwipe() {
  const { pets, loading, error, setPets, setLoading, setError, removePet } = useSwipeStore();

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, []),
  );

  const loadPets = async () => {
    try {
      setLoading(true);
      setError(null);

      const { maxDistanceKm } = useSwipeStore.getState();
      let data: any[] | undefined;

      if (maxDistanceKm !== null) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          data = await locationService.getNearbyPets(user.id, maxDistanceKm);
        }
      } else {
        data = await petService.getAvailablePets();
      }

      setPets(data || []);
    } catch {
      setError('Erro ao conectar com o banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  return { pets, loading, error, refresh: loadPets, removePetFromList: removePet };
}
