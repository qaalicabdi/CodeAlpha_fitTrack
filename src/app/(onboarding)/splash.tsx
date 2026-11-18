import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/AppText';
import { BrandMark } from '@/features/onboarding/BrandMark';
import { useTheme } from '@/theme/ThemeProvider';

const SPLASH_MS = 1600;

/** 01 Splash */
export default function Splash() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme, fonts } = useTheme();
  const bg = scheme === 'dark' ? colors.background : colors.secondary;

  useEffect(() => {
    const t = setTimeout(() => router.replace('/intro'), SPLASH_MS);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <Pressable style={{ flex: 1, backgroundColor: bg }} onPress={() => router.replace('/intro')} accessibilityLabel="FITTRACK. Move Better. Live Stronger. Tap to continue.">
      <StatusBar style="light" />
      <View style={styles.center}>
        <BrandMark size={56} />
        <AppText style={{ color: colors.onSecondary, fontFamily: fonts.bold, fontSize: 40, lineHeight: 48, letterSpacing: -0.5, marginTop: 20 }}>FITTRACK</AppText>
        <AppText variant="leadRegular" style={{ color: colors.onSecondaryMuted }}>
          Move Better. Live Stronger.
        </AppText>
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
        <View style={{ width: 24, height: 2, backgroundColor: colors.accent }} />
        <AppText variant="overline" style={{ color: colors.onSecondaryMuted }}>
          BUILT FOR YOUR EVERYDAY
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});
