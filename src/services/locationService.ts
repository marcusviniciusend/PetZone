import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useActivePetStore } from '../stores/activePetStore';
import { petService } from './petService';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

class LocationService {
  async getCurrentLocation(): Promise<LocationCoords | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Erro ao pegar localização:', error);
      return null;
    }
  }

  async updateUserLocation(userId: string): Promise<boolean> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) return false;

      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      return false;
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m de você`;
    return `${distanceKm}km de você`;
  }

  async getNearbyPets(userId: string, maxDistanceKm: number = 50): Promise<any[]> {
    try {
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', userId)
        .maybeSingle();

      if (!currentUser?.latitude || !currentUser?.longitude) {
        // Sem localização salva: usa a busca padrão como fallback
        return petService.getAvailablePets();
      }

      const { activePetId } = useActivePetStore.getState();

      const { data, error } = await supabase.rpc('get_nearby_pets', {
        user_lat: currentUser.latitude,
        user_lon: currentUser.longitude,
        max_distance: maxDistanceKm,
        current_user_id: userId,
        my_pet_uuid: activePetId,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pets próximos:', error);
      return [];
    }
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default new LocationService();
