import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import _Icon from 'react-native-vector-icons/Ionicons';

const Icon = _Icon as React.ComponentType<{ name: string; size: number; color: string; style?: object }>;
import { colors } from '../../theme/colors';
import { authService } from '../../services/authService';
import { LanguageSelector } from '../../components/LanguageSelector';

interface LoginProps {
  onNavigateRegister: () => void;
}

export default function LoginScreen({ onNavigateRegister }: LoginProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.warning'), t('login.alertEmpty'));
      return;
    }
    setLoading(true);
    const response = await authService.signIn(email, password);
    setLoading(false);

    if (response.success) {
      Alert.alert(t('common.success'), t('login.alertSuccess'));
    } else {
      Alert.alert(t('login.alertErrorTitle'), response.error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.langRow}>
        <LanguageSelector />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{t('login.title')}</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
      </View>

      <View style={styles.form}>
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
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.rememberContainer} onPress={() => setRememberMe(!rememberMe)}>
          <Icon name={rememberMe ? 'checkbox' : 'square-outline'} size={22} color={colors.primary} />
          <Text style={styles.rememberText}>{t('login.rememberMe')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? t('login.loading') : t('login.enter')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerButton} onPress={onNavigateRegister}>
          <Text style={styles.registerText}>{t('login.noAccount')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  langRow: { position: 'absolute', top: 56, right: 24, flexDirection: 'row' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 42, fontWeight: 'bold', color: colors.primary },
  subtitle: { fontSize: 16, color: colors.text, opacity: 0.7, marginTop: 5 },
  form: { paddingHorizontal: 30 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, backgroundColor: '#fff' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff' },
  passwordInput: { flex: 1, padding: 15, fontSize: 16 },
  eyeIcon: { paddingHorizontal: 15 },
  rememberContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  rememberText: { marginLeft: 8, color: colors.text, fontSize: 14 },
  button: { backgroundColor: colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  registerButton: { marginTop: 20, alignItems: 'center', padding: 10 },
  registerText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
