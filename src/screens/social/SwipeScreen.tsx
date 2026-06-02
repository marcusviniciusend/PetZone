import React, { useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Modal, Alert, Switch,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import _Icon from 'react-native-vector-icons/Ionicons';

const Icon = _Icon as React.ComponentType<{ name: string; size: number; color: string; style?: object }>;

import { moderateScale } from '../../utils/responsive';
import { useSwipe } from '../../hooks/useSwipe';
import PetCard from '../../components/PetCard';
import DistanceFilter from '../../components/DistanceFilter';
import { MatchModal } from '../../components/MatchModal';
import { matchService } from '../../services/matchService';
import { useSwipeStore } from '../../stores/swipeStore';
import { colors } from '../../theme/colors';
import { Pet } from '../../types';

type SpeciesFilter = 'all' | 'dog' | 'cat' | 'other';
type AgeFilter = 'all' | 'puppy' | 'adult' | 'senior';

const SPECIES_OPTIONS: SpeciesFilter[] = ['all', 'dog', 'cat', 'other'];
const AGE_OPTIONS: AgeFilter[] = ['all', 'puppy', 'adult', 'senior'];

function matchesSpeciesFilter(species: string, filter: SpeciesFilter): boolean {
  if (filter === 'all') return true;
  const s = species.toLowerCase();
  if (filter === 'other') return !['cachorro', 'gato'].includes(s);
  if (filter === 'dog') return s === 'cachorro';
  if (filter === 'cat') return s === 'gato';
  return true;
}

function matchesAgeFilter(age: number | undefined, filter: AgeFilter): boolean {
  if (filter === 'all' || age === undefined) return true;
  if (filter === 'puppy') return age <= 1;
  if (filter === 'adult') return age > 1 && age <= 7;
  return age > 7;
}

export default function SwipeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { pets, loading, error, refresh } = useSwipe();
  const { maxDistanceKm, setMaxDistance } = useSwipeStore();
  const swiperRef = useRef<any>(null);
  const [matchedPet, setMatchedPet] = useState<Pet | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');

  // Estados pendentes do modal (só aplicam ao fechar)
  const [pendingDistance, setPendingDistance] = useState(maxDistanceKm ?? 50);
  const [distanceLimitEnabled, setDistanceLimitEnabled] = useState(maxDistanceKm !== null);

  const filteredPets = useMemo(() => {
    return pets.filter(pet =>
      matchesSpeciesFilter(pet.species, speciesFilter) && matchesAgeFilter(pet.age, ageFilter)
    );
  }, [pets, speciesFilter, ageFilter]);

  const hasActiveFilter =
    speciesFilter !== 'all' || ageFilter !== 'all' || maxDistanceKm !== null;

  const openFilters = () => {
    setPendingDistance(maxDistanceKm ?? 50);
    setDistanceLimitEnabled(maxDistanceKm !== null);
    setShowFilters(true);
  };

  const applyFilters = () => {
    const newMaxDistance = distanceLimitEnabled ? pendingDistance : null;
    const distanceChanged = newMaxDistance !== maxDistanceKm;
    setMaxDistance(newMaxDistance);
    setShowFilters(false);
    if (distanceChanged) refresh();
  };

  const clearAll = () => {
    setSpeciesFilter('all');
    setAgeFilter('all');
    setDistanceLimitEnabled(false);
    setPendingDistance(50);
    const hadDistance = maxDistanceKm !== null;
    setMaxDistance(null);
    setShowFilters(false);
    if (hadDistance) refresh();
  };

  const handleSwipeRight = async (cardIndex: number) => {
    const pet = filteredPets[cardIndex];
    if (!pet) return;
    const response = await matchService.registerInteraction(pet.id, 'like');
    if (response.error === 'NO_PET_FOUND') {
      Alert.alert(t('swipe.noPetTitle'), t('swipe.noPetMsg'), [{ text: 'OK' }]);
      return;
    }
    if (response.match) setMatchedPet(pet);
  };

  const handleSwipeLeft = (cardIndex: number) => {
    const pet = filteredPets[cardIndex];
    if (!pet) return;
    matchService.registerInteraction(pet.id, 'dislike').then(response => {
      if (response.error === 'NO_PET_FOUND') {
        Alert.alert(t('swipe.noPetTitle'), t('swipe.noPetMsg'), [{ text: 'OK' }]);
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
          onPress={openFilters}
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
              <Text style={styles.title}>{t('swipe.emptyTitle')}</Text>
              <Text style={styles.emptySubtext}>{t('swipe.emptySubtext')}</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('swipe.noResultsTitle')}</Text>
              <Text style={styles.emptySubtext}>{t('swipe.noResultsSubtext')}</Text>
              <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearAll}>
                <Text style={styles.clearFiltersBtnText}>{t('swipe.clearFilters')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <>
          <View style={styles.swiperContainer}>
            <Swiper
              key={`${speciesFilter}-${ageFilter}-${maxDistanceKm}`}
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
                  title: t('swipe.overlayNo'),
                  style: {
                    label: { backgroundColor: colors.danger, color: 'white', fontSize: 24 },
                    wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 30, marginLeft: -30 },
                  },
                },
                right: {
                  title: t('swipe.overlayMatch'),
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
            <Text style={styles.filterTitle}>{t('swipe.filters')}</Text>

            <Text style={styles.filterLabel}>{t('swipe.speciesLabel')}</Text>
            <View style={styles.filterRow}>
              {SPECIES_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterChip, speciesFilter === opt && styles.filterChipActive]}
                  onPress={() => setSpeciesFilter(opt)}
                >
                  <Text style={[styles.filterChipText, speciesFilter === opt && styles.filterChipTextActive]}>
                    {t(`swipe.species.${opt}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>{t('swipe.ageLabel')}</Text>
            <View style={styles.filterRow}>
              {AGE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterChip, ageFilter === opt && styles.filterChipActive]}
                  onPress={() => setAgeFilter(opt)}
                >
                  <Text style={[styles.filterChipText, ageFilter === opt && styles.filterChipTextActive]}>
                    {t(`swipe.age.${opt}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.distanceHeader}>
              <Text style={styles.filterLabel}>{t('swipe.distanceLabel')}</Text>
              <View style={styles.distanceToggle}>
                <Text style={styles.distanceToggleLabel}>
                  {distanceLimitEnabled ? `${pendingDistance} km` : t('swipe.noLimit')}
                </Text>
                <Switch
                  value={distanceLimitEnabled}
                  onValueChange={setDistanceLimitEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {distanceLimitEnabled && (
              <DistanceFilter
                value={pendingDistance}
                onChange={setPendingDistance}
              />
            )}

            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>{t('swipe.apply')}</Text>
            </TouchableOpacity>

            {hasActiveFilter && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
                <Text style={styles.clearBtnText}>{t('swipe.clearFilters')}</Text>
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
  distanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distanceToggleLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  clearBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  clearBtnText: { color: colors.inactive, fontSize: 14 },
});
