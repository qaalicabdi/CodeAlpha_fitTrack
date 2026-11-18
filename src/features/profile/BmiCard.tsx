import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { Card, SectionHeader } from '@/components/common/layout';
import {
  ADULT_BMI_AGE,
  BMI_CATEGORY_LABEL,
  bmiCategory,
  calculateBmi,
  healthyWeightRangeKg,
  kgOutsideHealthyRange,
  type BmiCategory,
} from '@/domain/bmi';
import { weightDisplay, type MeasurementUnit } from '@/domain/format';
import { useTheme } from '@/theme/ThemeProvider';

// The scale shown on the bar: 15 → 40 BMI, split at the WHO cut-offs.
const SCALE_MIN = 15;
const SCALE_MAX = 40;
const SEGMENTS: { category: BmiCategory; from: number; to: number }[] = [
  { category: 'underweight', from: SCALE_MIN, to: 18.5 },
  { category: 'healthy', from: 18.5, to: 25 },
  { category: 'overweight', from: 25, to: 30 },
  { category: 'obese', from: 30, to: SCALE_MAX },
];
const TICKS = [18.5, 25, 30];

/** BMI from the saved profile (weight + height), with a category scale and the healthy weight range. */
export function BmiCard({ weightKg, heightCm, age, unit }: { weightKg: number; heightCm: number; age: number; unit: MeasurementUnit }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const bmi = calculateBmi(weightKg, heightCm);
  if (bmi === null) return null;

  const adult = age >= ADULT_BMI_AGE;
  const category = bmiCategory(bmi);
  const color: Record<BmiCategory, string> = {
    underweight: colors.barMuted,
    healthy: colors.primary,
    overweight: colors.accent,
    obese: colors.error,
  };
  const pos = (v: number) => ((Math.min(SCALE_MAX, Math.max(SCALE_MIN, v)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * width;

  const range = healthyWeightRangeKg(heightCm);
  const min = weightDisplay(range.minKg, unit);
  const max = weightDisplay(range.maxKg, unit);
  const diffKg = kgOutsideHealthyRange(weightKg, heightCm);
  const diff = weightDisplay(Math.abs(diffKg), unit);
  const advice =
    diffKg === 0
      ? 'You are inside the healthy range for your height.'
      : diffKg > 0
        ? `About ${diff.value} ${diff.unit} above the healthy range.`
        : `About ${diff.value} ${diff.unit} below the healthy range.`;

  return (
    <Card style={{ gap: 14 }}>
      <SectionHeader title="Body Mass Index" />

      <View
        style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}
        accessible
        accessibilityLabel={`BMI ${bmi}${adult ? `, ${BMI_CATEGORY_LABEL[category]}` : ''}`}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <AppText variant="metricLarge">{bmi.toFixed(1)}</AppText>
          <AppText variant="captionRegular" color="textSecondary">
            kg/m²
          </AppText>
        </View>
        {adult ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color[category] }} />
            <AppText variant="label">{BMI_CATEGORY_LABEL[category]}</AppText>
          </View>
        ) : null}
      </View>

      {adult ? (
        <>
          <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{ height: 22, justifyContent: 'center' }} importantForAccessibility="no-hide-descendants">
            <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
              {SEGMENTS.map((s) => (
                <View key={s.category} style={{ flex: s.to - s.from, backgroundColor: color[s.category], opacity: s.category === category ? 1 : 0.45 }} />
              ))}
            </View>
            {width > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  left: pos(bmi) - 9,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.surface,
                  borderWidth: 4,
                  borderColor: color[category],
                }}
              />
            ) : null}
          </View>
          {width > 0 ? (
            <View style={{ height: 15 }} importantForAccessibility="no-hide-descendants">
              {TICKS.map((t) => (
                <AppText key={t} variant="caption" color="textSecondary" style={{ position: 'absolute', left: pos(t) - 14, width: 28, textAlign: 'center' }}>
                  {t}
                </AppText>
              ))}
            </View>
          ) : null}

          <View style={{ gap: 4 }}>
            <AppText variant="bodyStrong">
              Healthy weight for your height: {min.value}–{max.value} {max.unit}
            </AppText>
            <AppText color="textSecondary">{advice}</AppText>
          </View>
        </>
      ) : (
        <AppText color="textSecondary">Under {ADULT_BMI_AGE}, BMI is judged against age and sex percentiles, so adult categories aren&apos;t shown.</AppText>
      )}

      <AppText variant="captionRegular" color="textSecondary">
        Calculated from your profile weight and height. BMI doesn&apos;t tell muscle from fat, so treat it as a guide, not a diagnosis.
      </AppText>
    </Card>
  );
}
