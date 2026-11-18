import { ChevronRight, EllipsisVertical } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { Card, IconTile, type IconComponent } from '@/components/common/layout';
import { useTheme } from '@/theme/ThemeProvider';

/** FITTRACK / Stat Card — value + unit + label, optional icon. */
export function StatCard({ value, unit, label, icon: Icon, compact }: { value: string; unit?: string; label: string; icon?: IconComponent; compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flex: 1, padding: compact ? 14 : 16, borderRadius: 20, gap: 6 }}>
      {Icon ? <Icon size={20} color={colors.primary} strokeWidth={1.6} /> : null}
      <View style={styles.valueRow}>
        <AppText variant="metric" style={compact ? { fontSize: 22 } : undefined} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="captionRegular" color="textSecondary" style={{ fontSize: 13 }}>
            {unit}
          </AppText>
        ) : null}
      </View>
      <AppText variant="captionRegular" color="textSecondary" style={{ fontSize: 13 }}>
        {label}
      </AppText>
    </Card>
  );
}

/** Linear progress bar (8 high, rounded). */
export function LinearProgress({ ratio, color, label }: { ratio: number; color?: string; label?: string }) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { backgroundColor: colors.track }]}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color ?? colors.primary }]} />
    </View>
  );
}

/** Title + percent, bar, and detail lines — used by Daily goals, Showing up counts, monthly goals, Goals screen. */
export function GoalProgressRow({ title, percentLabel, ratio, detail, extra }: { title: string; percentLabel: string; ratio: number; detail: string; extra?: string }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.spread}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="label" color="primaryText">
          {percentLabel}
        </AppText>
      </View>
      <LinearProgress ratio={ratio} label={`${title} ${percentLabel}`} />
      <AppText variant="captionRegular" color="textSecondary" style={{ fontSize: 13 }}>
        {detail}
      </AppText>
      {extra ? (
        <AppText variant="captionRegular" color="textSecondary" style={{ fontSize: 13 }}>
          {extra}
        </AppText>
      ) : null}
    </View>
  );
}

/** FITTRACK / History Row. */
export function HistoryRow({
  icon,
  title,
  subtitle,
  meta,
  onPress,
  onMenu,
  plain,
  selected,
}: {
  icon: IconComponent;
  title: string;
  subtitle: string;
  meta: string;
  onPress?: () => void;
  onMenu?: () => void;
  /** card style without chevron (Activity "Your day in motion") */
  plain?: boolean;
  selected?: boolean;
}) {
  const { colors } = useTheme();
  const body = (
    <>
      {plain ? <IconComponentInline icon={icon} /> : <IconTile icon={icon} />}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="captionRegular" color="textSecondary" style={{ fontSize: 13 }}>
          {subtitle}
        </AppText>
        <AppText variant="captionRegular" color="textSecondary">
          {meta}
        </AppText>
      </View>
      {!onMenu && onPress ? <ChevronRight size={18} color={colors.textSecondary} /> : null}
    </>
  );
  if (plain) {
    return (
      <Card style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20 }}>
        <View style={[styles.historyRow, { paddingVertical: 0 }]}>{body}</View>
      </Card>
    );
  }
  // The row and its ⋮ menu are sibling buttons (nested buttons are invalid on web and confuse screen readers).
  return (
    <View style={[styles.historyRowOuter, { backgroundColor: selected ? colors.tint : 'transparent' }]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityState={{ selected: !!selected }}
          style={({ pressed }) => [styles.historyRow, { flex: 1, opacity: pressed ? 0.7 : 1 }]}
        >
          {body}
        </Pressable>
      ) : (
        <View style={[styles.historyRow, { flex: 1 }]}>{body}</View>
      )}
      {onMenu ? (
        <Pressable onPress={onMenu} accessibilityRole="button" accessibilityLabel={`Options for ${title}`} hitSlop={12} style={styles.menuBtn}>
          <EllipsisVertical size={18} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function IconComponentInline({ icon: Icon }: { icon: IconComponent }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: 28, alignItems: 'center', alignSelf: 'flex-start', paddingTop: 2 }}>
      <Icon size={22} color={colors.primary} strokeWidth={1.5} />
    </View>
  );
}

export function KeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.spread}>
      <AppText color="textSecondary">{label}</AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

/** Chart legend: dot + label. */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
      {items.map((i) => (
        <View key={i.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i.color }} />
          <AppText variant="caption" color="primaryText">
            {i.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Settings list row (screen 21). */
export function SettingsRow({ icon: Icon, label, sublabel, value, onPress, right }: { icon: IconComponent; label: string; sublabel?: string; value?: string; onPress?: () => void; right?: ReactNode }) {
  const { colors } = useTheme();
  const main = (
    <>
      <Icon size={18} color={colors.primary} strokeWidth={1.6} />
      <View style={{ flex: 1 }}>
        <AppText>{label}</AppText>
        {sublabel ? <AppText variant="caption" color="textSecondary">{sublabel}</AppText> : null}
      </View>
      {value ? (
        <AppText variant="captionRegular" color="textSecondary">
          {value}
        </AppText>
      ) : null}
      {!right && onPress ? <ChevronRight size={16} color={colors.textSecondary} /> : null}
    </>
  );
  // A trailing control (e.g. a switch) is a sibling of the row button, never nested inside it.
  return (
    <View style={styles.settingsRow}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={value ? `${label}, ${value}` : label}
          style={({ pressed }) => [styles.settingsMain, { opacity: pressed ? 0.7 : 1 }]}
        >
          {main}
        </Pressable>
      ) : (
        <View style={styles.settingsMain}>{main}</View>
      )}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  historyRowOuter: { flexDirection: 'row', alignItems: 'center', borderRadius: 16 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  menuBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16 },
  settingsMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56 },
});
