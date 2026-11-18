import { useRouter } from 'expo-router';
import { Activity, ArrowRight, Footprints } from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { Pill } from '@/components/common/layout';
import { StepRing } from '@/components/progress/StepRing';
import { useTheme } from '@/theme/ThemeProvider';

interface Slide {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  hero: () => ReactNode;
}

/** Illustrations for the onboarding slides (values here are illustrative, not user data). */
function WalkHero() {
  const { colors, radii } = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: colors.tint, borderRadius: radii.card }]}>
      <Footprints size={96} color={colors.primary} strokeWidth={1.1} />
      <View style={[styles.chip, { backgroundColor: colors.surface, borderRadius: radii.control }]}>
        <AppText variant="metric" style={{ fontFamily: 'Inter_500Medium' }}>
          7,250
        </AppText>
        <View>
          <AppText variant="label">Every step counts.</AppText>
          <AppText variant="caption" color="textSecondary">
            72.5% of your daily goal
          </AppText>
        </View>
      </View>
    </View>
  );
}

function RunHero() {
  const { colors, radii } = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: colors.tint, borderRadius: radii.card }]}>
      <Activity size={96} color={colors.primary} strokeWidth={1.1} />
      <View style={[styles.chip, { backgroundColor: colors.secondary, borderRadius: radii.control, justifyContent: 'space-between' }]}>
        <View>
          <AppText variant="label" color="accent">
            RUNNING
          </AppText>
          <AppText variant="caption" color="onSecondaryMuted">
            Your pace. Your progress.
          </AppText>
        </View>
        <AppText variant="metric" color="onSecondary">
          24:38
        </AppText>
      </View>
    </View>
  );
}

function GoalHero() {
  const { colors, radii } = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: colors.secondary, borderRadius: radii.card, justifyContent: 'center', gap: 16 }]}>
      <StepRing steps={7250} goal={10000} tone="hero" size={180} />
      <View style={{ flexDirection: 'row', gap: 24 }}>
        <View>
          <AppText variant="lead" color="onSecondary">
            326 kcal
          </AppText>
          <AppText variant="caption" color="onSecondaryMuted">
            Fuel your progress
          </AppText>
        </View>
        <View>
          <AppText variant="lead" color="accent">
            3 / 4
          </AppText>
          <AppText variant="caption" color="onSecondaryMuted">
            Weekly workouts
          </AppText>
        </View>
      </View>
    </View>
  );
}

const SLIDES: Slide[] = [
  {
    key: 'track',
    eyebrow: '01 / YOUR EVERYDAY, MEASURED',
    title: 'Track your activity.\nFind your rhythm.',
    body: 'Turn everyday movement into meaningful progress. Track your steps, distance and active energy in one clear view.',
    hero: WalkHero,
  },
  {
    key: 'active',
    eyebrow: '02 / MAKE MOVEMENT A HABIT',
    title: 'Stay active.\nOn your terms.',
    body: 'From a morning walk to a strength session. Choose your workout, start the timer and see your effort add up.',
    hero: RunHero,
  },
  {
    key: 'goals',
    eyebrow: '03 / SMALL WINS, STRONGER YOU',
    title: 'Achieve your goals.\nBuild your better.',
    body: 'Set personal step and calorie goals. Celebrate steady progress with clear insights that keep you moving forward.',
    hero: GoalHero,
  },
];

/** 02–04 onboarding carousel */
export default function Intro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, spacing } = useTheme();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<Slide>>(null);
  const last = index === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < SLIDES.length) setIndex(i);
  };

  const next = () => {
    if (last) router.push('/setup');
    else list.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <AppText variant="bodyStrong" style={{ letterSpacing: 1.6 }}>
          FITTRACK
        </AppText>
        <Pressable onPress={() => router.push('/setup')} accessibilityRole="button" hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
          <AppText variant="bodyStrong" color="primaryText">
            Skip
          </AppText>
        </Pressable>
      </View>
      <FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(s) => s.key}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.md }}>
            <item.hero />
            <Pill label={item.eyebrow} />
            <AppText variant="title">{item.title}</AppText>
            <AppText variant="leadRegular" color="textSecondary">
              {item.body}
            </AppText>
          </View>
        )}
      />
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.lg, gap: spacing.lg }}>
        <View style={styles.dots} accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={{ height: 6, width: i === index ? 24 : 6, borderRadius: 3, backgroundColor: i === index ? colors.primary : colors.track }} />
          ))}
        </View>
        <Button label={last ? 'Get Started' : 'Next'} icon={ArrowRight} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { height: 320, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  chip: { position: 'absolute', left: 14, right: 14, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
});
