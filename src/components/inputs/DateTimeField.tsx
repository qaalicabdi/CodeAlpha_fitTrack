import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/dialogs/overlays';
import { useTheme } from '@/theme/ThemeProvider';
import { SelectField } from './Input';

type Mode = 'date' | 'time';

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  const { colors, radii } = useTheme();
  const btn = { width: 48, height: 48, borderRadius: radii.control, backgroundColor: colors.tint, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <Pressable style={btn} onPress={onMinus} accessibilityRole="button" accessibilityLabel={`Earlier ${label}`}>
        <Minus size={20} color={colors.primary} />
      </Pressable>
      <AppText variant="lead" style={{ flex: 1, textAlign: 'center' }}>
        {label}
      </AppText>
      <Pressable style={btn} onPress={onPlus} accessibilityRole="button" accessibilityLabel={`Later ${label}`}>
        <Plus size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

/**
 * Date or time picker field.
 * Android: native dialog. iOS: spinner in a bottom sheet. Web: steppers in a bottom sheet.
 */
export function DateTimeField({
  label,
  mode,
  value,
  display,
  hint,
  onChange,
  maximumDate,
  error,
  style,
}: {
  label: string;
  mode: Mode;
  value: Date;
  display: string;
  hint?: string;
  onChange: (d: Date) => void;
  maximumDate?: Date;
  error?: string;
  style?: object;
}) {
  const { scheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const clamp = (d: Date) => (maximumDate && d.getTime() > maximumDate.getTime() ? maximumDate : d);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        maximumDate: mode === 'date' ? maximumDate : undefined,
        onChange: (e: DateTimePickerEvent, d?: Date) => {
          if (e.type === 'set' && d) onChange(clamp(d));
        },
      });
      return;
    }
    setDraft(value);
    setOpen(true);
  };

  const shift = (minutes: number) => setDraft((d) => clamp(new Date(d.getTime() + minutes * 60_000)));

  return (
    <>
      <SelectField label={label} value={display} hint={hint} onPress={openPicker} error={error} showChevron={false} style={style} />
      {Platform.OS !== 'android' ? (
        <BottomSheet visible={open} title={label} onClose={() => setOpen(false)}>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={draft}
              mode={mode}
              display="spinner"
              maximumDate={mode === 'date' ? maximumDate : undefined}
              themeVariant={scheme}
              onChange={(_e, d) => d && setDraft(clamp(d))}
            />
          ) : mode === 'date' ? (
            <Stepper label={draft.toDateString()} onMinus={() => shift(-1440)} onPlus={() => shift(1440)} />
          ) : (
            <Stepper
              label={draft.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              onMinus={() => shift(-15)}
              onPlus={() => shift(15)}
            />
          )}
          <Button
            label="Done"
            onPress={() => {
              onChange(draft);
              setOpen(false);
            }}
          />
        </BottomSheet>
      ) : null}
    </>
  );
}
