import { Footprints } from 'lucide-react-native';
import { View } from 'react-native';

import { ProgressRing } from '@/components/charts/charts';
import { AppText } from '@/components/common/AppText';
import { formatInt, formatPercent } from '@/domain/format';
import { useTheme } from '@/theme/ThemeProvider';

/** Step goal ring. `hero` = accent on forest card (07, 04); `surface` = brand on light card (08). */
export function StepRing({ steps, goal, tone, size = 200 }: { steps: number; goal: number; tone: 'hero' | 'surface'; size?: number }) {
  const { colors } = useTheme();
  const hero = tone === 'hero';
  const ratio = goal > 0 ? steps / goal : 0;
  const ringColor = hero ? colors.accent : colors.primary;
  return (
    <ProgressRing
      size={size}
      strokeWidth={size * 0.06}
      ratio={ratio}
      color={ringColor}
      trackColor={hero ? 'rgba(255,255,255,0.14)' : colors.track}
      accessibilityLabel={`${formatInt(steps)} of ${formatInt(goal)} steps, ${formatPercent(ratio * 100)}`}
    >
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Footprints size={22} color={ringColor} strokeWidth={1.5} />
        <AppText variant="metricLarge" style={{ color: hero ? colors.onSecondary : colors.text, fontSize: size * 0.2, lineHeight: size * 0.24 }}>
          {formatInt(steps)}
        </AppText>
        <AppText variant="captionRegular" style={{ color: hero ? colors.onSecondaryMuted : colors.textSecondary, fontSize: 13 }}>
          of {formatInt(goal)} steps
        </AppText>
        <AppText variant="captionRegular" style={{ color: hero ? colors.accent : colors.primaryText, fontSize: 13 }}>
          {formatPercent(ratio * 100)}
        </AppText>
      </View>
    </ProgressRing>
  );
}
