import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/theme/ThemeProvider';

/** Circular progress ring with centred content (step ring, timer ring). */
export function ProgressRing({
  size,
  strokeWidth,
  ratio,
  color,
  trackColor,
  children,
  accessibilityLabel,
}: {
  size: number;
  strokeWidth: number;
  ratio: number;
  color: string;
  trackColor: string;
  children?: ReactNode;
  accessibilityLabel?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ width: size, height: size }} accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {clamped > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - clamped)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
  /** future / empty day — drawn as a flat stub */
  empty?: boolean;
  bold?: boolean;
}

/** Vertical bar chart (weekly steps, weekly energy, 2-hour blocks). */
export function BarChart({ data, max, height = 110, barWidth, accessibilityLabel }: { data: BarDatum[]; max: number; height?: number; barWidth?: number; accessibilityLabel?: string }) {
  const { colors } = useTheme();
  const top = Math.max(max, ...data.map((d) => d.value), 1);
  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <View style={[styles.bars, { height }]}>
        {data.map((d, i) => {
          const h = d.empty || d.value <= 0 ? 3 : Math.max(6, (d.value / top) * height);
          return (
            <View key={`${d.label}-${i}`} style={styles.barSlot}>
              <View
                style={{
                  width: barWidth ?? '72%',
                  height: h,
                  borderRadius: d.empty || d.value <= 0 ? 2 : 6,
                  backgroundColor: d.empty || d.value <= 0 ? colors.track : d.highlight ? colors.primary : colors.barMuted,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <View key={`l-${i}`} style={styles.barSlot}>
            <AppText variant="caption" color={d.bold ? 'primaryText' : 'textSecondary'} style={d.bold ? { fontFamily: 'Inter_700Bold' } : undefined}>
              {d.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Line chart with points (monthly movement trend). */
export function LineChart({ values, labels, max, height = 120, width = 300, accessibilityLabel }: { values: number[]; labels: string[]; max: number; height?: number; width?: number; accessibilityLabel?: string }) {
  const { colors } = useTheme();
  const top = Math.max(max, ...values, 1);
  const n = values.length;
  const pad = 4;
  const points = values.map((v, i) => {
    const x = n === 1 ? width / 2 : pad + (i * (width - pad * 2)) / (n - 1);
    const y = pad + (1 - v / top) * (height - pad * 2);
    return { x, y };
  });
  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ gap: 8 }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {[0, 0.5, 1].map((g) => (
          <Line key={g} x1={0} x2={width} y1={pad + g * (height - pad * 2)} y2={pad + g * (height - pad * 2)} stroke={colors.border} strokeWidth={1} />
        ))}
        {n > 1 ? <Polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinejoin="round" /> : null}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={colors.primary} />
        ))}
      </Svg>
      <View style={styles.spread}>
        {labels.map((l, i) => (
          <AppText key={`${l}-${i}`} variant="caption" color="textSecondary">
            {l}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end' },
  barSlot: { flex: 1, alignItems: 'center' },
  labels: { flexDirection: 'row', marginTop: 8 },
  spread: { flexDirection: 'row', justifyContent: 'space-between' },
});
