import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { Card, SectionHeader } from '@/components/common/layout';
import { hourRangeLabel, stepsByHour, type HourlySteps } from '@/domain/aggregation';
import { formatInt } from '@/domain/format';
import { useTheme } from '@/theme/ThemeProvider';

const CHART_HEIGHT = 120;
const AXIS = ['12 AM', '6 AM', '12 PM', '6 PM'];

/** Index of the busiest hour, or -1 when the day has no steps. */
function peakHour(values: readonly number[]): number {
  let best = -1;
  values.forEach((v, i) => {
    if (v > 0 && (best < 0 || v > (values[best] ?? 0))) best = i;
  });
  return best;
}

/**
 * Steps per hour (24 bars). Touch or drag across the chart to inspect an hour — the selected bar
 * stays bright, the rest dim, and the header shows that hour's steps. Tap the selected bar again
 * to clear. Screen readers can swipe up/down to move between hours.
 */
export function HourlyCard({ title, insight, hourly, currentHour, isToday }: { title: string; insight?: string; hourly: HourlySteps[]; currentHour: number; isToday: boolean }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const touch = useRef<{ startHour: number; wasSelected: boolean; moved: boolean } | null>(null);

  const values = stepsByHour(hourly);
  const lastHour = isToday ? currentHour : 23;
  const peak = peakHour(values);
  const max = Math.max(...values, 1);
  const slot = width / 24;
  const barWidth = Math.max(3, Math.min(10, slot * 0.5));

  const hourAt = (x: number) => Math.max(0, Math.min(lastHour, Math.floor(x / (slot || 1))));

  const onStart = (e: GestureResponderEvent) => {
    const h = hourAt(e.nativeEvent.locationX);
    touch.current = { startHour: h, wasSelected: selected === h, moved: false };
    setSelected(h);
  };
  const onMove = (e: GestureResponderEvent) => {
    const h = hourAt(e.nativeEvent.locationX);
    if (touch.current && h !== touch.current.startHour) touch.current.moved = true;
    setSelected(h);
  };
  const onEnd = () => {
    const t = touch.current;
    if (t && !t.moved && t.wasSelected) setSelected(null); // tapping the selected bar clears it
    touch.current = null;
  };

  const active = selected !== null && selected <= lastHour ? selected : null;
  const summary =
    peak >= 0
      ? insight ?? `Most active period: ${hourRangeLabel(peak)}`
      : isToday
        ? 'No steps recorded yet today.'
        : 'No steps were recorded on this day.';

  const a11yValue =
    active !== null ? `${formatInt(values[active] ?? 0)} steps, ${hourRangeLabel(active)}` : summary;

  return (
    <Card style={{ gap: 12 }}>
      <SectionHeader title={title} />

      {/* Fixed height so the card doesn't jump while scrubbing. */}
      <View style={{ minHeight: 44, justifyContent: 'center' }}>
        {active !== null ? (
          <AppText>
            <AppText variant="bodyStrong" color="primaryText">
              {formatInt(values[active] ?? 0)} steps
            </AppText>
            <AppText color="textSecondary"> ({hourRangeLabel(active)})</AppText>
          </AppText>
        ) : (
          <AppText color="textSecondary">{summary}</AppText>
        )}
      </View>

      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: CHART_HEIGHT }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onStart}
        onResponderMove={onMove}
        onResponderRelease={onEnd}
        onResponderTerminate={onEnd}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${title}, steps per hour`}
        accessibilityHint="Swipe up or down to move between hours"
        accessibilityValue={{ text: a11yValue }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const from = active ?? (peak >= 0 ? peak : 0);
          const next = e.nativeEvent.actionName === 'increment' ? Math.min(lastHour, from + 1) : Math.max(0, from - 1);
          setSelected(active === null ? from : next);
        }}
      >
        {width > 0
          ? values.map((v, h) => {
              const isActive = active === h;
              const barHeight = v > 0 ? Math.max(4, (v / max) * (CHART_HEIGHT - 8)) : 0;
              return (
                <View
                  key={h}
                  pointerEvents="none"
                  style={[
                    styles.slot,
                    { left: h * slot, width: slot },
                    isActive && { backgroundColor: colors.tint, borderRadius: 6 },
                  ]}
                >
                  {barHeight > 0 ? (
                    <View
                      style={{
                        width: barWidth,
                        height: barHeight,
                        borderRadius: barWidth / 2,
                        backgroundColor: active === null || isActive ? colors.primary : colors.barMuted,
                      }}
                    />
                  ) : null}
                </View>
              );
            })
          : null}
        <View pointerEvents="none" style={[styles.baseline, { backgroundColor: colors.border }]} />
      </View>

      <View style={{ flexDirection: 'row' }}>
        {AXIS.map((label) => (
          <AppText key={label} variant="caption" color="textSecondary" style={{ flex: 1 }}>
            {label}
          </AppText>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', top: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-end' },
  baseline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth * 2 },
});
