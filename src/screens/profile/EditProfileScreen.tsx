import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { profileService } from '../../services/profileService';
import { colors } from '../../theme/colors';
import _Icon from 'react-native-vector-icons/Ionicons';

const Icon = _Icon as React.ComponentType<{ name: string; size: number; color: string; style?: object }>;

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const data = await profileService.getProfile();
    if (data) {
      setFullName(data.full_name || '');
      setBio(data.bio || '');
    }
    setLoading(false);
  }

  async function updateProfile() {
    setLoading(true);
    const result = await profileService.updateProfile({ full_name: fullName, bio });
    setLoading(false);

    if (result.success) {
      Alert.alert(t('common.success'), t('editProfile.successMsg'));
      navigation.goBack();
    } else {
      Alert.alert(t('common.error'), result.error);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('editProfile.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{t('editProfile.nameLabel')}</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('editProfile.namePlaceholder')}
        />

        <Text style={styles.label}>{t('editProfile.bioLabel')}</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder={t('editProfile.bioPlaceholder')}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={updateProfile}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('editProfile.saveButton')}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', fontSize: 16, color: colors.text },
  bioInput: { height: 120, textAlignVertical: 'top' },
  saveButton: { backgroundColor: colors.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});