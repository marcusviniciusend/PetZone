import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import _Icon from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../utils/responsive';

const Icon = _Icon as React.ComponentType<{ name: string; size: number; color: string; style?: object }>;

// Pegando a largura e altura da tela do celular dinamicamente
const { width, height } = Dimensions.get('window');

// Definindo os tipos para o TypeScript parar de reclamar
interface PetCardProps {
  pet: {
    id: number | string;
    name: string;
    breed?: string;
    age?: number;
    bio?: string;
    image_url?: string;
    vaccine_doc_url?: string | null;
  };
}

export default function PetCard({ pet }: PetCardProps) {
  // Se o pet não tiver foto no banco, usamos essa de gatinho/cachorro genérica
  const imageUrl = pet.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1000&auto=format&fit=crop';

  return (
    <View style={styles.card}>
      {/* Imagem de Fundo */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      
      {/* Container com um fundo escuro transparente para o texto dar leitura em cima da foto */}
      <View style={styles.infoContainer}>
        <View style={styles.textBackground}>
          <View style={styles.row}>
            <Text style={styles.name}>{pet.name}, {pet.age}</Text>
            <View style={styles.onlineBadge} />
            {pet.vaccine_doc_url ? (
              <View style={styles.verifiedBadge}>
                <Icon name="shield-checkmark" size={moderateScale(16)} color="#fff" />
              </View>
            ) : null}
          </View>
          <Text style={styles.breed}>{pet.breed}</Text>
          {pet.bio && (
            <Text style={styles.bio} numberOfLines={2}>{pet.bio}</Text>
          )}
          <Text style={styles.owner}>📍 Próximo a você</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 25,
    backgroundColor: '#000',
    
    // Sombras (iOS e Android)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    
    overflow: 'hidden', // Impede que a foto quadrada saia pelas bordas arredondadas
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '40%',
    justifyContent: 'flex-end',
  },
  textBackground: {
    padding: moderateScale(20),
    // Padding aumentado para garantir que o texto fique acima dos botões flutuantes
    paddingBottom: moderateScale(120), 
    backgroundColor: 'rgba(0,0,0,0.45)', // Simula um gradiente para legibilidade
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    color: '#fff',
    fontSize: moderateScale(32), // Tamanho da fonte responsivo
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  onlineBadge: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: '#4CD964',
    marginLeft: moderateScale(10),
    borderWidth: moderateScale(2),
    borderColor: '#fff',
  },
  verifiedBadge: {
    marginLeft: moderateScale(8),
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  breed: {
    color: '#fff',
    fontSize: moderateScale(18), // Tamanho da fonte responsivo
    marginTop: moderateScale(4),
    opacity: 0.9,
    fontWeight: '500',
  },
  bio: {
    color: '#fff',
    fontSize: moderateScale(15),
    marginTop: moderateScale(8),
    opacity: 0.85,
  },
  owner: {
    color: '#fff',
    fontSize: moderateScale(16), // Tamanho da fonte responsivo
    fontWeight: '400',
    marginTop: moderateScale(8),
    opacity: 0.8,
  },
});