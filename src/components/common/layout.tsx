import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

export type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/** Scrollable page with the themed background and safe-area padding. */
export function Screen({
  children,
  scroll = true,
  contentStyle,
  bottomInset = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** false when a tab bar already handles the bottom inset */
  bottomInset?: boolean;
}) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const padding: ViewStyle = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: (bottomInset ? insets.bottom : 0) + spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  };
  if (!scroll) {
    return <View style={[{ flex: 1, backgroundColor: colors.background }, padding, contentStyle]}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

/** Large tab-page title with optional subtitle ("Activity" / date). */
export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? <AppText color="textSecondary">{subtitle}</AppText> : null}
    </View>
  );
}

/** Back arrow + heading/subtitle used by flow screens (05, 06, 11, 14, 19, 20, 22). */
export function BackHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  const router = useRouter();
  const { colors, sizes } = useTheme();
  return (
    <View style={styles.backHeader}>
      <Pressable
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        style={{ width: sizes.minTouch, height: sizes.minTouch, justifyContent: 'center' }}
      >
        <ArrowLeft size={22} color={colors.text} strokeWidth={1.75} />
      </Pressable>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? <AppText variant="captionRegular" color="textSecondary" style={{ fontSize: 13 }}>{subtitle}</AppText> : null}
      </View>
    </View>
  );
}

export function SectionHeader({ title, actionLabel, onAction, right }: { title: string; actionLabel?: string; onAction?: () => void; right?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="lead" style={{ fontSize: 18 }} accessibilityRole="header">
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="link" hitSlop={10}>
          <AppText variant="label" color="primaryText">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : (
        right
      )}
    </View>
  );
}

export function Card({
  children,
  style,
  tone = 'surface',
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'tint' | 'hero';
  padded?: boolean;
}) {
  const { colors, radii, spacing } = useTheme();
  const bg = tone === 'hero' ? colors.secondary : tone === 'tint' ? colors.tint : colors.surface;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radii.card,
          borderWidth: tone === 'surface' ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: colors.border,
          padding: padded ? spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Status badge / eyebrow pill. */
export function Pill({ label, icon: Icon, tone = 'tint', uppercase }: { label: string; icon?: IconComponent; tone?: 'tint' | 'onHero' | 'error'; uppercase?: boolean }) {
  const { colors, radii } = useTheme();
  const fg = tone === 'onHero' ? colors.accent : tone === 'error' ? colors.errorText : colors.primaryText;
  const bg = tone === 'onHero' ? 'rgba(255,255,255,0.08)' : colors.tint;
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderRadius: radii.pill }]}>
      {Icon ? <Icon size={14} color={fg} strokeWidth={2} /> : null}
      <AppText variant="label" style={{ color: fg, fontSize: 12 }} uppercase={uppercase}>
        {label}
      </AppText>
    </View>
  );
}

/** Rounded tinted square holding an icon (history rows, empty states). */
export function IconTile({ icon: Icon, size = 48, tone = 'tint' }: { icon: IconComponent; size?: number; tone?: 'tint' | 'error' }) {
  const { colors, radii } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size > 60 ? radii.control + 4 : radii.tile,
        backgroundColor: tone === 'error' ? 'transparent' : colors.tint,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={size * 0.46} color={tone === 'error' ? colors.error : colors.primary} strokeWidth={1.6} />
    </View>
  );
}

export function Row({ children, gap = 12, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', gap }, style]}>{children}</View>;
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.border }} />;
}

/** Small explanatory footnote under a screen. */
export function Footnote({ children, align }: { children: ReactNode; align?: 'center' | 'left' }) {
  return (
    <AppText variant="captionRegular" color="textSecondary" align={align}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  backHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
});
