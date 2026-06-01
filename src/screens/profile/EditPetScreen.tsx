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

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  bio: string;
  image_url?: string;
  vaccine_doc_url?: string | null;
};

type NewImage = { uri: string; base64: string };

export default function EditPetScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const pet: Pet = route.params.pet;

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newImage, setNewImage] = useState<NewImage | null>(null);
  const [newVaccineImage, setNewVaccineImage] = useState<NewImage | null>(null);
  const [speciesSuggestions, setSpeciesSuggestions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: pet.name,
    species: pet.species,
    breed: pet.breed || '',
    age: pet.age ? String(pet.age) : '',
    bio: pet.bio || '',
  });

  const currentImageUri = newImage?.uri ?? pet.image_url;
  const hasVaccineDoc = !!(newVaccineImage || pet.vaccine_doc_url);

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
      Alert.alert(t('common.warning'), 'Habilite o acesso à galeria nas configurações do celular.');
      return;
    }
    if (result.type === 'success') {
      setNewImage({ uri: result.uri, base64: result.base64 });
    }
  };

  const handlePickVaccine = async () => {
    const result = await imageService.selectImage();
    if (result.type === 'permission_denied') {
      Alert.alert(t('common.warning'), 'Habilite o acesso à galeria nas configurações do celular.');
      return;
    }
    if (result.type === 'success') {
      setNewVaccineImage({ uri: result.uri, base64: result.base64 });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.species) {
      Alert.alert(t('common.warning'), 'O nome e a espécie do pet são obrigatórios.');
      return;
    }

    setLoading(true);

    let imageUrl = pet.image_url;
    if (newImage) {
      const uploadResult = await imageService.uploadPetPhoto(newImage.base64);
      if (uploadResult.type === 'error') {
        setLoading(false);
        Alert.alert(t('common.error'), uploadResult.error);
        return;
      }
      imageUrl = uploadResult.url;
    }

    let vaccineDocUrl = pet.vaccine_doc_url;
    if (newVaccineImage) {
      const vaccineResult = await imageService.uploadVaccinePhoto(newVaccineImage.base64);
      if (vaccineResult.type === 'success') {
        vaccineDocUrl = vaccineResult.url;
      }
    }

    const response = await petService.updatePet(pet.id, {
      name: formData.name,
      species: formData.species,
      breed: formData.breed,
      age: parseInt(formData.age) || 0,
      bio: formData.bio,
      image_url: imageUrl,
      vaccine_doc_url: vaccineDocUrl,
    });

    setLoading(false);

    if (response.success) {
      Alert.alert(t('common.success'), 'As informações do pet foram atualizadas.');
      navigation.goBack();
    } else {
      Alert.alert(t('common.error'), response.error || 'Não foi possível atualizar o pet.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      `Excluir ${pet.name}?`,
      'Esta ação é permanente e não pode ser desfeita.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const response = await petService.deletePet(pet.id);
            setDeleting(false);
            if (response.success) {
              navigation.goBack();
            } else {
              Alert.alert(t('common.error'), response.error || 'Não foi possível excluir o pet.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Pet</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Foto do Pet</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {currentImageUri ? (
            <Image source={{ uri: currentImageUri }} style={styles.imagePreview} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="camera-outline" size={40} color={colors.primary} />
              <Text style={styles.imagePlaceholderText}>Toque para adicionar uma foto</Text>
            </View>
          )}
        </TouchableOpacity>
        {currentImageUri && (
          <TouchableOpacity onPress={handlePickImage} style={styles.changePhotoLink}>
            <Text style={styles.changePhotoText}>Trocar foto</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Nome do Pet *</Text>
        <TextInput
          style={styles.input}
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
          {hasVaccineDoc ? (
            <View style={styles.vaccineSelected}>
              <Icon name="checkmark-circle" size={22} color="#007AFF" />
              <Text style={styles.vaccineSelectedText}>
                {newVaccineImage ? t('pets.vaccineSelected') : 'Carteirinha já anexada ✓'}
              </Text>
            </View>
          ) : (
            <View style={styles.vaccineEmpty}>
              <Icon name="document-attach-outline" size={28} color="#007AFF" />
              <Text style={styles.vaccineHintText}>{t('pets.vaccineHint')}</Text>
            </View>
          )}
        </TouchableOpacity>
        {hasVaccineDoc && (
          <TouchableOpacity onPress={handlePickVaccine} style={styles.changePhotoLink}>
            <Text style={[styles.changePhotoText, { color: '#007AFF' }]}>{t('pets.vaccineChange')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading || deleting}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={loading || deleting}
        >
          {deleting ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <>
              <Icon name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteButtonText}>Excluir Pet</Text>
            </>
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
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 40,
    padding: 16,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  deleteButtonText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
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
