import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { petService } from '../../services/petService';
import { imageService } from '../../services/imageService';
import { colors } from '../../theme/colors';
import { PET_SPECIES } from '../../constants/petSpecies';
import _Icon from 'react-native-vector-icons/Ionicons';

const Icon = _Icon as React.ComponentType<{ name: string; size: number; color: string; style?: object }>;

type SelectedImage = { uri: string; base64: string };

export default function AddPetScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [vaccineImage, setVaccineImage] = useState<SelectedImage | null>(null);
  const [speciesSuggestions, setSpeciesSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    bio: '',
  });

  const handleSpeciesChange = (text: string) => {
    setFormData({ ...formData, species: text });
    setSpeciesSuggestions(
      text.length > 0
        ? PET_SPECIES.filter(s => s.toLowerCase().startsWith(text.toLowerCase()))
        : []
    );
  };

  const handleSelectSpecies = (species: string) => {
    setFormData({ ...formData, species });
    setSpeciesSuggestions([]);
  };

  const handlePickImage = async () => {
    const result = await imageService.selectImage();
    if (result.type === 'permission_denied') {
      Alert.alert(t('common.warning'), 'Precisamos acessar sua galeria. Habilite nas configurações do celular.');
      return;
    }
    if (result.type === 'success') {
      setSelectedImage({ uri: result.uri, base64: result.base64 });
    }
  };

  const handlePickVaccine = async () => {
    const result = await imageService.selectImage();
    if (result.type === 'permission_denied') {
      Alert.alert(t('common.warning'), 'Precisamos acessar sua galeria. Habilite nas configurações do celular.');
      return;
    }
    if (result.type === 'success') {
      setVaccineImage({ uri: result.uri, base64: result.base64 });
    }
  };

  const handleSavePet = async () => {
    if (!formData.name || !formData.species) {
      Alert.alert(t('common.warning'), 'O nome e a espécie do pet são obrigatórios.');
      return;
    }
    if (!selectedImage) {
      Alert.alert(t('common.warning'), 'A foto do pet é obrigatória.');
      return;
    }

    setLoading(true);

    const uploadResult = await imageService.uploadPetPhoto(selectedImage.base64);
    if (uploadResult.type === 'error') {
      setLoading(false);
      Alert.alert(t('common.error'), uploadResult.error);
      return;
    }

    let vaccineDocUrl: string | null = null;
    if (vaccineImage) {
      const vaccineResult = await imageService.uploadVaccinePhoto(vaccineImage.base64);
      if (vaccineResult.type === 'success') {
        vaccineDocUrl = vaccineResult.url;
      }
    }

    const response = await petService.createPet({
      name: formData.name,
      species: formData.species,
      breed: formData.breed,
      age: parseInt(formData.age) || 0,
      bio: formData.bio,
      image_url: uploadResult.url,
      vaccine_doc_url: vaccineDocUrl,
    });

    setLoading(false);

    if (response.success) {
      Alert.alert(t('common.success'), `${formData.name} foi adicionado ao seu perfil.`);
      navigation.goBack();
    } else {
      Alert.alert(t('common.error'), response.error || 'Não foi possível cadastrar o pet.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Pet</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Foto do Pet *</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="camera-outline" size={40} color={colors.primary} />
              <Text style={styles.imagePlaceholderText}>Toque para adicionar uma foto</Text>
            </View>
          )}
        </TouchableOpacity>
        {selectedImage && (
          <TouchableOpacity onPress={handlePickImage} style={styles.changePhotoLink}>
            <Text style={styles.changePhotoText}>Trocar foto</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Nome do Pet *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Arrascaeta"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        <Text style={styles.label}>Espécie *</Text>
        <View style={styles.speciesContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ex: Cachorro, Gato"
            value={formData.species}
            onChangeText={handleSpeciesChange}
          />
          {speciesSuggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              {speciesSuggestions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSpecies(item)}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.label}>Raça</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Golden Retriever"
          value={formData.breed}
          onChangeText={(text) => setFormData({ ...formData, breed: text })}
        />

        <Text style={styles.label}>Idade (anos)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 3"
          keyboardType="numeric"
          value={formData.age}
          onChangeText={(text) => setFormData({ ...formData, age: text })}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Conte um pouco sobre a personalidade do seu pet..."
          multiline
          numberOfLines={4}
          value={formData.bio}
          onChangeText={(text) => setFormData({ ...formData, bio: text })}
        />

        {/* Carteira de Vacinação */}
        <View style={styles.vaccineSectionHeader}>
          <Icon name="shield-checkmark-outline" size={20} color="#007AFF" />
          <Text style={[styles.label, styles.vaccineLabel]}>{t('pets.vaccine')}</Text>
        </View>
        <TouchableOpacity style={styles.vaccinePicker} onPress={handlePickVaccine}>
          {vaccineImage ? (
            <View style={styles.vaccineSelected}>
              <Icon name="checkmark-circle" size={22} color="#007AFF" />
              <Text style={styles.vaccineSelectedText}>{t('pets.vaccineSelected')}</Text>
            </View>
          ) : (
            <View style={styles.vaccineEmpty}>
              <Icon name="document-attach-outline" size={28} color="#007AFF" />
              <Text style={styles.vaccineHintText}>{t('pets.vaccineHint')}</Text>
            </View>
          )}
        </TouchableOpacity>
        {vaccineImage && (
          <TouchableOpacity onPress={handlePickVaccine} style={styles.changePhotoLink}>
            <Text style={[styles.changePhotoText, { color: '#007AFF' }]}>{t('pets.vaccineChange')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePet}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Cadastrar Pet</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: colors.text,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  imagePicker: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    gap: 10,
  },
  imagePlaceholderText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  changePhotoLink: { alignItems: 'center', marginTop: 8 },
  changePhotoText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  vaccineSectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 6, marginBottom: 8 },
  vaccineLabel: { marginTop: 0, marginBottom: 0, color: '#007AFF' },
  vaccinePicker: {
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F6FF',
    padding: 16,
  },
  vaccineEmpty: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vaccineSelected: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vaccineHintText: { fontSize: 14, color: '#007AFF', flex: 1 },
  vaccineSelectedText: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  speciesContainer: { position: 'relative', zIndex: 10 },
  suggestionsBox: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: { fontSize: 16, color: colors.text },
});
