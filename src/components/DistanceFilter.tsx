import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface DistanceFilterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function DistanceFilter({
  value,
  onChange,
  min = 5,
  max = 100,
  step = 5,
}: DistanceFilterProps) {
  const decrease = () => onChange(Math.max(min, value - step));
  const increase = () => onChange(Math.min(max, value + step));
  const fillPercent = `${Math.round(((value - min) / (max - min)) * 100)}%` as `${number}%`;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Distância Máxima</Text>
        <Text style={styles.valueText}>{value} km</Text>
      </View>

      <View style={styles.trackWrapper}>
        <View style={styles.track} />
        <View style={[styles.fill, { width: fillPercent }]} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, value <= min && styles.btnDisabled]}
          onPress={decrease}
          disabled={value <= min}
        >
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>

        <Text style={styles.rangeHint}>{min} – {max} km</Text>

        <TouchableOpacity
          style={[styles.btn, value >= max && styles.btnDisabled]}
          onPress={increase}
          disabled={value >= max}
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 10,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  valueText: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  trackWrapper: { height: 20, justifyContent: 'center', marginBottom: 12 },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { color: '#fff', fontSize: 22, fontWeight: 'bold', lineHeight: 24 },
  rangeHint: { fontSize: 13, color: colors.inactive },
});
