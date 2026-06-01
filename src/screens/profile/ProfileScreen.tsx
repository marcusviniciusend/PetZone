import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, Switch, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { petService } from '../../services/petService';
import { profileService } from '../../services/profileService';
import { useActivePetStore } from '../../stores/activePetStore';
import { Profile, Pet } from '../../types';
import { colors } from '../../theme/colors';
import { LanguageSelector } from '../../components/LanguageSelector';
import _Icon from 'react-native-vector-icons/Ionicons';

const Icon = _Icon as React.ComponentType<{ name: string; size: number; color: string; style?: object }>;

export default function ProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPets, setShowPets] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const { activePetId, setActivePetId } = useActivePetStore();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const data = await profileService.getProfile();
    setProfile(data);
    setLoading(false);
  }

  async function loadMyPets() {
    const data = await petService.getMyPets();
    setMyPets(data);
    if (!activePetId && data.length > 0) {
      setActivePetId(data[0].id);
    }
  }

  const handleOpenPets = async () => {
    await loadMyPets();
    setShowPets(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleExportData = () => {
    Alert.alert(t('settings.exportAlertTitle'), t('settings.exportAlert'));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteConfirmTitle'),
      t('settings.deleteConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.deleteConfirmBtn'), style: 'destructive', onPress: () => Alert.alert(t('common.success')) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho do Perfil */}
      <View style={styles.header}>
        <View style={styles.imagePlaceholder}>
          <Icon name="person" size={80} color="#ccc" />
          <TouchableOpacity style={styles.editImageBtn}>
            <Icon name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{profile?.full_name || 'Tutor Sem Nome'}</Text>
        <Text style={styles.bio}>{profile?.bio || 'Adicione uma bio para que outros tutores o conheçam!'}</Text>
      </View>

      {/* Menu Principal */}
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={handleOpenPets}>
          <Icon name="paw" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Meus Pets</Text>
          <Icon name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setShowSettings(true)}>
          <Icon name="settings-outline" size={24} color={colors.text} />
          <Text style={styles.menuText}>Configurações</Text>
          <Icon name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutBtn]} onPress={handleSignOut}>
          <Icon name="log-out-outline" size={24} color="#ff4444" />
          <Text style={[styles.menuText, { color: '#ff4444' }]}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL: MEUS PETS */}
      <Modal visible={showPets} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Meus Pets</Text>
            <TouchableOpacity onPress={() => setShowPets(false)}>
              <Icon name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {myPets.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="paw-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>Você ainda não cadastrou nenhum pet.</Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    setShowPets(false);
                    navigation.navigate('AddPet');
                  }}
                >
                  <Text style={styles.primaryButtonText}>+ Adicionar Pet</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.activePetHint}>
                  Toque no ícone de rádio para selecionar o pet ativo no Swipe.
                </Text>

                {myPets.map((pet) => {
                  const isActive = pet.id === activePetId;
                  return (
                    <View key={pet.id} style={[styles.petItemCard, isActive && styles.petItemCardActive]}>
                      <TouchableOpacity
                        style={styles.radioBtn}
                        onPress={() => setActivePetId(pet.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon
                          name={isActive ? 'radio-button-on' : 'radio-button-off'}
                          size={24}
                          color={isActive ? colors.primary : '#ccc'}
                        />
                      </TouchableOpacity>

                      <Icon name="paw" size={22} color={isActive ? colors.primary : '#ccc'} style={{ marginLeft: 8 }} />

                      <View style={styles.petItemInfo}>
                        <View style={styles.petNameRow}>
                          <Text style={styles.petNameText}>{pet.name}</Text>
                          {pet.vaccine_doc_url ? (
                            <Icon name="shield-checkmark" size={16} color="#007AFF" style={{ marginLeft: 6 }} />
                          ) : null}
                        </View>
                        <Text style={styles.petDetailText}>{pet.species} • {pet.breed || 'Raça não definida'}</Text>
                        {isActive && (
                          <Text style={styles.activePetBadge}>Ativo no Swipe</Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.editPetBtn}
                        onPress={() => {
                          setShowPets(false);
                          navigation.navigate('EditPet', { pet });
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="create-outline" size={20} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 20 }]}
                  onPress={() => {
                    setShowPets(false);
                    navigation.navigate('AddPet');
                  }}
                >
                  <Text style={styles.primaryButtonText}>+ Adicionar Outro Pet</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL: CONFIGURAÇÕES */}
      <Modal visible={showSettings} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('settings.title')}</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Icon name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => { setShowSettings(false); navigation.navigate('EditProfile'); }}
            >
              <View style={styles.settingsOptionLeft}>
                <Icon name="create-outline" size={24} color={colors.text} />
                <Text style={styles.settingsText}>{t('settings.editProfile')}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.settingsOption}>
              <View style={styles.settingsOptionLeft}>
                <Icon name="notifications-outline" size={24} color={colors.text} />
                <Text style={styles.settingsText}>{t('settings.notifications')}</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>

            <View style={styles.settingsOption}>
              <View style={styles.settingsOptionLeft}>
                <Icon name="language-outline" size={24} color={colors.text} />
                <Text style={styles.settingsText}>{t('settings.languageTitle')}</Text>
              </View>
              <LanguageSelector />
            </View>

            <Text style={styles.sectionTitle}>{t('settings.privacyTitle')}</Text>
            <TouchableOpacity style={styles.settingsOption} onPress={handleExportData}>
              <View style={styles.settingsOptionLeft}>
                <Icon name="download-outline" size={24} color={colors.text} />
                <Text style={styles.settingsText}>{t('settings.exportData')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsOption} onPress={handleDeleteAccount}>
              <View style={styles.settingsOptionLeft}>
                <Icon name="trash-outline" size={24} color="#ff4444" />
                <Text style={[styles.settingsText, { color: '#ff4444' }]}>{t('settings.deleteAccount')}</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  imagePlaceholder: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  editImageBtn: { position: 'absolute', bottom: 5, right: 5, backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  bio: { fontSize: 14, color: colors.text, opacity: 0.6, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  menu: { marginTop: 30, paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10 },
  menuText: { marginLeft: 15, fontSize: 16, fontWeight: '500', color: colors.text },
  logoutBtn: { marginTop: 20, borderColor: '#ff444433', borderWidth: 1 },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalContent: { padding: 20 },
  activePetHint: { fontSize: 13, color: colors.inactive, marginBottom: 14, textAlign: 'center' },
  petItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  petItemCardActive: { borderColor: colors.primary },
  radioBtn: { padding: 2 },
  petItemInfo: { marginLeft: 12, flex: 1 },
  petNameRow: { flexDirection: 'row', alignItems: 'center' },
  petNameText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  petDetailText: { fontSize: 12, color: '#999', marginTop: 2 },
  activePetBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editPetBtn: { padding: 4, marginLeft: 8 },
  settingsOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  settingsOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  settingsText: { fontSize: 16, marginLeft: 15, color: colors.text },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#999', marginTop: 30, marginBottom: 10, textTransform: 'uppercase' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 15, marginBottom: 30, paddingHorizontal: 40 },
  primaryButton: { backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
