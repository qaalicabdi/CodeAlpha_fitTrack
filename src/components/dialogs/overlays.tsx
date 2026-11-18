import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/theme/ThemeProvider';

/** FITTRACK / Bottom Sheet — grabber, title, close, content. Android back closes it. */
export function BottomSheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const { colors, radii, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={onClose} accessibilityLabel="Close" />
        <View style={{ flex: 1 }} pointerEvents="box-none" />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, paddingBottom: insets.bottom + spacing.lg },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.track }]} />
          <View style={styles.sheetHeader}>
            <AppText variant="heading" style={{ flex: 1 }} accessibilityRole="header">
              {title}
            </AppText>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} style={styles.close}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** FITTRACK / Dialog — centred confirmation (delete, discard). */
export function Dialog({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const { colors, radii, spacing } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.dialogWrap, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg, gap: spacing.md }]}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { paddingHorizontal: 24, paddingTop: 10, maxHeight: '88%' },
  grabber: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  close: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  dialogWrap: { flex: 1, justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 440, alignSelf: 'center' },
});
