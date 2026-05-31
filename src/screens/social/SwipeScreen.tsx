import React, { useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Modal, Alert,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { useNavigation } from '@react-navigation/native';
import _Icon from 'react-native-vector-icons/Ionicons';

const Icon = _Icon as React.ComponentType<{ name: string; size: number; color: string; style?: object }>;

import { moderateScale } from '../../utils/responsive';
import { useSwipe } from '../../hooks/useSwipe';
import PetCard from '../../components/PetCard';
import { MatchModal } from '../../components/MatchModal';
import { matchService } from '../../services/matchService';
import { colors } from '../../theme/colors';
import { Pet } from '../../types';

type SpeciesFilter = 'Todos' | 'Cachorro' | 'Gato' | 'Outro';
type AgeFilter = 'Todos' | 'Filhote' | 'Adulto' | 'Idoso';

const SPECIES_OPTIONS: SpeciesFilter[] = ['Todos', 'Cachorro', 'Gato', 'Outro'];
const AGE_OPTIONS: AgeFilter[] = ['Todos', 'Filhote', 'Adulto', 'Idoso'];

function matchesAgeFilter(age: number | undefined, filter: AgeFilter): boolean {
  if (filter === 'Todos' || age === undefined) return true;
  if (filter === 'Filhote') return age <= 1;
  if (filter === 'Adulto') return age > 1 && age <= 7;
  return age > 7;
}

export default function SwipeScreen() {
  const navigation = useNavigation<any>();
  const { pets, loading, error } = useSwipe();
  const swiperRef = useRef<any>(null);
  const [matchedPet, setMatchedPet] = useState<Pet | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('Todos');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('Todos');

  const filteredPets = useMemo(() => {
    return pets.filter(pet => {
      const speciesMatch =
        speciesFilter === 'Todos' ||
        (speciesFilter === 'Outro'
          ? !['cachorro', 'gato'].includes(pet.species.toLowerCase())
          : pet.species.toLowerCase() === speciesFilter.toLowerCase());
      return speciesMatch && matchesAgeFilter(pet.age, ageFilter);
    });
  }, [pets, speciesFilter, ageFilter]);

  const hasActiveFilter = speciesFilter !== 'Todos' || ageFilter !== 'Todos';

  const handleSwipeRight = async (cardIndex: number) => {
    const pet = filteredPets[cardIndex];
    if (!pet) return;
    const response = await matchService.registerInteraction(pet.id, 'like');
    if (response.error === 'NO_PET_FOUND') {
      Alert.alert(
        'Pet não cadastrado',
        'Você precisa cadastrar um pet antes de dar like! Vá em Perfil > Adicionar Pet.',
        [{ text: 'OK' }],
      );
      return;
    }
    if (response.match) setMatchedPet(pet);
  };

  const handleSwipeLeft = (cardIndex: number) => {
    const pet = filteredPets[cardIndex];
    if (!pet) return;
    matchService.registerInteraction(pet.id, 'dislike').then(response => {
      if (response.error === 'NO_PET_FOUND') {
        Alert.alert(
          'Pet não cadastrado',
          'Você precisa cadastrar um pet antes de dar like! Vá em Perfil > Adicionar Pet.',
          [{ text: 'OK' }],
        );
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilter && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Icon
            name="options-outline"
            size={moderateScale(22)}
            color={hasActiveFilter ? '#fff' : colors.text}
          />
        </TouchableOpacity>
      </View>

      {filteredPets.length === 0 ? (
        <View style={styles.emptyContainer}>
          {pets.length === 0 ? (
            <>
              <Text style={styles.title}>Fim da linha!</Text>
              <Text style={styles.emptySubtext}>Não há mais pets disponíveis no momento.</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Nenhum resultado</Text>
              <Text style={styles.emptySubtext}>Tente ajustar os filtros para ver mais pets.</Text>
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                onPress={() => { setSpeciesFilter('Todos'); setAgeFilter('Todos'); }}
              >
                <Text style={styles.clearFiltersBtnText}>Limpar Filtros</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <>
          <View style={styles.swiperContainer}>
            <Swiper
              key={`${speciesFilter}-${ageFilter}`}
              ref={swiperRef}
              cards={filteredPets}
              renderCard={(card) => <PetCard pet={card} />}
              onSwipedLeft={handleSwipeLeft}
              onSwipedRight={handleSwipeRight}
              cardIndex={0}
              backgroundColor={colors.background}
              stackSize={3}
              verticalSwipe={false}
              cardVerticalMargin={moderateScale(20, 0.8)}
              cardHorizontalMargin={moderateScale(10, 0.8)}
              containerStyle={{ backgroundColor: 'transparent' }}
              animateCardOpacity
              overlayLabels={{
                left: {
                  title: 'NÃO',
                  style: {
                    label: { backgroundColor: colors.danger, color: 'white', fontSize: 24 },
                    wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 30, marginLeft: -30 },
                  },
                },
                right: {
                  title: 'MATCH!',
                  style: {
                    label: { backgroundColor: colors.success, color: 'white', fontSize: 24 },
                    wrapper: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 30, marginLeft: 30 },
                  },
                },
              }}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.dislikeButton]}
              onPress={() => swiperRef.current?.swipeLeft()}
            >
              <Icon name="close" size={moderateScale(30)} color={colors.danger} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.likeButton]}
              onPress={() => swiperRef.current?.swipeRight()}
            >
              <Icon name="heart" size={moderateScale(32)} color={colors.success} />
            </TouchableOpacity>
          </View>
        </>
      )}

      <MatchModal
        visible={!!matchedPet}
        matchedPet={matchedPet}
        onViewMatches={() => {
          setMatchedPet(null);
          navigation.navigate('Matches');
        }}
        onContinue={() => setMatchedPet(null)}
      />

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        >
          <View style={styles.filterSheet}>
            <View style={styles.filterHandle} />
            <Text style={styles.filterTitle}>Filtros</Text>

            <Text style={styles.filterLabel}>Espécie</Text>
            <View style={styles.filterRow}>
              {SPECIES_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterChip, speciesFilter === opt && styles.filterChipActive]}
                  onPress={() => setSpeciesFilter(opt)}
                >
                  <Text style={[styles.filterChipText, speciesFilter === opt && styles.filterChipTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Faixa de Idade</Text>
            <View style={styles.filterRow}>
              {AGE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterChip, ageFilter === opt && styles.filterChipActive]}
                  onPress={() => setAgeFilter(opt)}
                >
                  <Text style={[styles.filterChipText, ageFilter === opt && styles.filterChipTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyBtnText}>Aplicar</Text>
            </TouchableOpacity>

            {hasActiveFilter && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => { setSpeciesFilter('Todos'); setAgeFilter('Todos'); setShowFilters(false); }}
              >
                <Text style={styles.clearBtnText}>Limpar Filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  topBar: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(8),
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterButton: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButtonActive: { backgroundColor: colors.primary },
  swiperContainer: { flex: 1, marginBottom: moderateScale(100) },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  emptySubtext: { fontSize: 16, color: colors.inactive, textAlign: 'center', paddingHorizontal: 30 },
  errorText: { fontSize: 16, color: colors.danger },
  clearFiltersBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  clearFiltersBtnText: { color: '#fff', fontWeight: 'bold' },
  footer: {
    position: 'absolute',
    bottom: moderateScale(20),
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
    gap: moderateScale(50),
  },
  button: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dislikeButton: { borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.2)' },
  likeButton: {
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.2)',
    width: moderateScale(74),
    height: moderateScale(74),
    borderRadius: moderateScale(37),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  filterHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  filterTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inactive,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  clearBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  clearBtnText: { color: colors.inactive, fontSize: 14 },
});
