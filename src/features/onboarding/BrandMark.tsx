import { Activity } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

/** Accent rounded-square logo with the pulse glyph. */
export function BrandMark({ size = 44 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
      <Activity size={size * 0.58} color={colors.secondary} strokeWidth={2.2} />
    </View>
  );
}
