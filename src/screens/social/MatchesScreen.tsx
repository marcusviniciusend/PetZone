import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { useMatches } from '../../hooks/useMatches';
import { MatchedPet } from '../../types';

export default function MatchesScreen({ navigation }: any) {
  const { matches, loading } = useMatches();

  const handleOpenChat = (match: MatchedPet) => {
    navigation.navigate('Matches', {
      screen: 'Chat',
      params: {
        matchId: match.match_id,
        otherUserId: match.tutor_id,
        otherUserName: match.name,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderMatch = ({ item }: { item: MatchedPet }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => handleOpenChat(item)}
    >
      <Image
        source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=150' }}
        style={styles.avatar}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{item.name}</Text>
        <Text style={styles.lastMessage}>{item.species} • {item.breed || 'Raça não definida'}</Text>
      </View>

      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Matches</Text>
        <Text style={styles.subtitle}>Pets que você demonstrou interesse!</Text>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum match ainda. Volte ao Swipe e dê um like!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { padding: 20, paddingTop: 50, backgroundColor: colors.primary },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fff', opacity: 0.8 },
  listContainer: { padding: 15 },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  lastMessage: { fontSize: 14, color: colors.inactive },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors.inactive },
});
