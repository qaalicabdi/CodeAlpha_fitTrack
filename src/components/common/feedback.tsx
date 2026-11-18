import { CircleAlert, CircleCheck, NotebookPen, Play, RotateCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { Card, Pill } from './layout';

/** Supporting state 1 — "Your first move starts here." */
export function EmptyHistory({ onStart, onLog }: { onStart: () => void; onLog: () => void }) {
  const { colors } = useTheme();
  return (
    <Card style={{ alignItems: 'center', gap: 16 }}>
      <NotebookPen size={34} color={colors.primary} strokeWidth={1.4} />
      <AppText variant="heading" align="center">
        Your first move starts here.
      </AppText>
      <AppText color="textSecondary" align="center">
        No activities recorded yet. Start a workout or add something you’ve already done.
      </AppText>
      <View style={{ alignSelf: 'stretch', gap: 12 }}>
        <Button label="Start a Workout" icon={Play} onPress={onStart} />
        <Button label="Log Activity Manually" variant="secondary" onPress={onLog} />
      </View>
    </Card>
  );
}

function SkeletonBlock({ height, width, radius = 12, round }: { height: number; width?: number | `${number}%`; radius?: number; round?: boolean }) {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.6));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ height, width: width ?? '100%', borderRadius: round ? height / 2 : radius, backgroundColor: colors.skeleton, opacity }} />;
}

/** Supporting state 2 — skeleton; no placeholder numbers are ever shown as real activity. */
export function LoadingState({ label = 'Loading your local activity…' }: { label?: string }) {
  return (
    <View style={{ gap: 16 }} accessibilityLabel={label} accessibilityState={{ busy: true }}>
      <Pill label={label} />
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <SkeletonBlock height={44} width={44} round />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBlock height={12} width="60%" />
          <SkeletonBlock height={10} width="40%" />
        </View>
      </View>
      <SkeletonBlock height={180} radius={24} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <SkeletonBlock height={96} radius={20} />
        </View>
        <View style={{ flex: 1 }}>
          <SkeletonBlock height={96} radius={20} />
        </View>
      </View>
    </View>
  );
}

/** Generic recoverable error card (save error / query failure). */
export function ErrorCard({ title, message, onRetry, retryLabel = 'Try Again', secondary }: { title: string; message: string; onRetry?: () => void; retryLabel?: string; secondary?: { label: string; onPress: () => void } }) {
  const { colors } = useTheme();
  return (
    <Card style={{ gap: 14 }}>
      <CircleAlert size={26} color={colors.error} strokeWidth={1.6} />
      <AppText variant="heading">{title}</AppText>
      <AppText color="textSecondary">{message}</AppText>
      {onRetry ? <Button label={retryLabel} icon={RotateCw} onPress={onRetry} /> : null}
      {secondary ? <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} /> : null}
    </Card>
  );
}

/** Supporting state 10 — success banner. */
export function SuccessBanner({ title, detail }: { title: string; detail?: string }) {
  const { colors, radii } = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={[styles.banner, { backgroundColor: colors.tint, borderRadius: radii.control }]}>
      <CircleCheck size={20} color={colors.primary} strokeWidth={1.6} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        {detail ? <AppText variant="captionRegular" color="textSecondary">{detail}</AppText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', gap: 12, padding: 16, alignItems: 'flex-start' },
});
