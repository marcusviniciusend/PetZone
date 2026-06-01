import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setStoredLanguage } from '../i18n';
import { colors } from '../theme/colors';

const LANGUAGES = [
  { code: 'pt-BR', label: 'PT' },
  { code: 'en-US', label: 'EN' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const handleChange = async (code: string) => {
    if (code === current) return;
    await i18n.changeLanguage(code);
    await setStoredLanguage(code);
  };

  return (
    <View style={styles.container}>
      {LANGUAGES.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[styles.btn, current === lang.code && styles.btnActive]}
          onPress={() => handleChange(lang.code)}
          activeOpacity={0.8}
        >
          <Text style={[styles.label, current === lang.code && styles.labelActive]}>
            {lang.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 6 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  btnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  label: { fontSize: 13, fontWeight: '700', color: '#999' },
  labelActive: { color: '#fff' },
});
