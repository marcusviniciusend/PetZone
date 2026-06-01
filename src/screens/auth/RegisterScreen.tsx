import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import _Icon from 'react-native-vector-icons/Ionicons';

const Icon = _Icon as React.ComponentType<{ name: string; size: number; color: string; style?: object }>;
import { colors } from '../../theme/colors';
import { authService } from '../../services/authService';
import { LanguageSelector } from '../../components/LanguageSelector';

interface RegisterProps {
  onNavigateLogin: () => void;
}

export default function RegisterScreen({ onNavigateLogin }: RegisterProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert(t('common.warning'), t('register.alertEmpty'));
      return;
    }

    setLoading(true);
    const response = await authService.signUp(email, password, name);
    setLoading(false);

    if (response.success) {
      Alert.alert(t('register.alertSuccessTitle'), t('register.alertSuccessMsg'));
      onNavigateLogin();
    } else {
      Alert.alert(t('register.alertErrorTitle'), response.error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onNavigateLogin}>
        <Icon name="arrow-back" size={28} color={colors.primary} />
      </TouchableOpacity>

      <View style={styles.langRow}>
        <LanguageSelector />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{t('register.title')}</Text>
        <Text style={styles.subtitle}>{t('register.subtitle', { appName: t('appName') })}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>{t('register.nameLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('register.namePlaceholder')}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>{t('login.email')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('login.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>{t('login.password')}</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('register.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? t('register.creating') : t('register.submit')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  langRow: { position: 'absolute', top: 50, right: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 36, fontWeight: 'bold', color: colors.primary },
  subtitle: { fontSize: 16, color: colors.text, opacity: 0.7, marginTop: 5 },
  form: { paddingHorizontal: 30 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, backgroundColor: '#fff' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff' },
  passwordInput: { flex: 1, padding: 15, fontSize: 16 },
  eyeIcon: { paddingHorizontal: 15 },
  button: { backgroundColor: colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
