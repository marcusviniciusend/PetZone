import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

class LocationService {
  /**
   * Solicita permissão e retorna a localização atual
   */
  async getCurrentLocation(): Promise<LocationCoords | null> {
    try {
      // Solicitar permissão
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Permissão de localização negada');
        return null;
      }

      // Pegar localização atual
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

  /**
   * Atualiza a localização do usuário no banco de dados
   */
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

      console.log('Localização atualizada:', location);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      return false;
    }
  }

  /**
   * Calcula distância entre dois pontos em km (fórmula de Haversine)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Arredondar para 1 casa decimal
  }

  /**
   * Converte graus para radianos
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Formata a distância para exibição
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m de você`;
    }
    return `${distanceKm}km de você`;
  }

  /**
   * Busca pets próximos (usando SQL com a função de distância)
   */
  async getNearbyPets(
    userId: string,
    maxDistanceKm: number = 50
  ): Promise<any[]> {
    try {
      // Pegar localização do usuário atual
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', userId)
        .maybeSingle();

      if (!currentUser?.latitude || !currentUser?.longitude) {
        console.log('Usuário sem localização definida');
        return [];
      }

      // Buscar pets próximos usando a função SQL
      const { data, error } = await supabase.rpc('get_nearby_pets', {
        user_lat: currentUser.latitude,
        user_lon: currentUser.longitude,
        max_distance: maxDistanceKm,
        current_user_id: userId,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pets próximos:', error);
      return [];
    }
  }
}

export default new LocationService();