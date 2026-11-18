import { Image, View } from 'react-native';

import { initials } from '@/domain/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

/** Profile photo (stored locally) or initials on a brand tile. */
export function Avatar({ name, uri, size = 40 }: { name: string; uri: string | null; size?: number }) {
  const { colors, fonts } = useTheme();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityLabel={`${name} profile photo`} />;
  }
  return (
    <View
      accessibilityLabel={`${name} profile`}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}
    >
      <AppText style={{ color: colors.accent, fontFamily: fonts.bold, fontSize: size * 0.36, lineHeight: size * 0.44 }}>{initials(name)}</AppText>
    </View>
  );
}
