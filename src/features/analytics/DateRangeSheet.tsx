import { useState } from 'react';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/dialogs/overlays';
import { DateTimeField } from '@/components/inputs/DateTimeField';
import { SelectField } from '@/components/inputs/Input';
import { PeriodTabs } from '@/components/inputs/selection';
import { dayRange, formatFullDate, fromDateKey, isSameDay, monthRange, startOfWeek, weekRange, type DateRange } from '@/domain/dates';

export type Period = 'daily' | 'weekly' | 'monthly';

export function rangeFor(period: Period, anchor: Date): DateRange {
  return period === 'daily' ? dayRange(anchor) : period === 'weekly' ? weekRange(anchor) : monthRange(anchor);
}

const PRESETS = [
  { value: 'daily' as const, label: 'Today' },
  { value: 'weekly' as const, label: 'This week' },
  { value: 'monthly' as const, label: 'This month' },
];

function rangeCaption(period: Period, anchor: Date, now: Date): string {
  if (period === 'daily') return isSameDay(anchor, now) ? 'Today · still in progress.' : 'A completed day.';
  const r = rangeFor(period, anchor);
  const end = fromDateKey(r.to);
  if (end.getTime() < now.getTime() && !isSameDay(end, now)) return period === 'weekly' ? 'A completed week.' : 'A completed month.';
  if (period === 'weekly') return isSameDay(startOfWeek(anchor), startOfWeek(now)) ? 'Current week · upcoming days are not missed days.' : '';
  return 'Current month · future dates are muted.';
}

/** Supporting state 7 — "Choose date range". The range always matches a whole day, week or month. */
export function DateRangeSheet({
  visible,
  period,
  anchor,
  now,
  onApply,
  onClose,
}: {
  visible: boolean;
  period: Period;
  anchor: Date;
  now: Date;
  onApply: (period: Period, anchor: Date) => void;
  onClose: () => void;
}) {
  const [p, setP] = useState(period);
  const [a, setA] = useState(anchor);
  // Reset the draft each time the sheet opens.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setP(period);
      setA(anchor);
    }
  }

  const r = rangeFor(p, a);
  return (
    <BottomSheet visible={visible} title="Choose date range" onClose={onClose}>
      <PeriodTabs
        options={PRESETS}
        value={p}
        onChange={(v) => {
          setP(v);
          setA(now);
        }}
      />
      <DateTimeField label="From" mode="date" value={fromDateKey(r.from)} display={formatFullDate(fromDateKey(r.from))} onChange={setA} maximumDate={now} />
      <SelectField label="To" value={formatFullDate(fromDateKey(r.to))} onPress={() => undefined} showChevron={false} helper="Set by the period you choose." />
      <AppText variant="captionRegular" color="textSecondary">
        {rangeCaption(p, a, now)}
      </AppText>
      <Button
        label="Apply Range"
        onPress={() => {
          onApply(p, a);
          onClose();
        }}
      />
      <Button label="Cancel" variant="secondary" onPress={onClose} />
    </BottomSheet>
  );
}
