import { useLocalSearchParams } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { useState } from 'react';

import { PageTitle, Screen } from '@/components/common/layout';
import { SelectField } from '@/components/inputs/Input';
import { PeriodTabs } from '@/components/inputs/selection';
import { formatMediumDate, formatMonthYear, formatRange, isSameDay, startOfWeek } from '@/domain/dates';
import { DateRangeSheet, rangeFor, type Period } from '@/features/analytics/DateRangeSheet';
import { DailyView, MonthlyView, WeeklyView } from '@/features/analytics/views';
import { useNow } from '@/hooks/useNow';
import { useAppData } from '@/state/AppDataProvider';
import { useTheme } from '@/theme/ThemeProvider';

const SUBTITLE: Record<Period, string> = {
  daily: 'Small efforts. Measurable change.',
  weekly: 'Consistency is your strongest metric.',
  monthly: 'See the bigger picture.',
};

const TABS = [
  { value: 'daily' as const, label: 'Daily' },
  { value: 'weekly' as const, label: 'Weekly' },
  { value: 'monthly' as const, label: 'Monthly' },
];

function isPeriod(v: unknown): v is Period {
  return v === 'daily' || v === 'weekly' || v === 'monthly';
}

/** 16 Daily · 17 Weekly · 18 Monthly */
export default function ProgressScreen() {
  const params = useLocalSearchParams<{ period?: string }>();
  const { settings } = useAppData();
  const { colors } = useTheme();
  const now = useNow();
  const [period, setPeriod] = useState<Period>(isPeriod(params.period) ? params.period : 'daily');
  const [anchor, setAnchor] = useState(now);
  const [sheet, setSheet] = useState(false);

  // The tab stays mounted; follow `?period=` when another screen links here.
  const [lastParam, setLastParam] = useState(params.period);
  if (params.period !== lastParam) {
    setLastParam(params.period);
    if (isPeriod(params.period)) setPeriod(params.period);
  }

  const label =
    period === 'daily'
      ? formatMediumDate(anchor)
      : period === 'weekly'
        ? `${formatRange(rangeFor('weekly', anchor))}${isSameDay(startOfWeek(anchor), startOfWeek(now)) ? ' · this week' : ''}`
        : formatMonthYear(anchor);

  return (
    <Screen bottomInset={false}>
      <PageTitle title="Your progress" subtitle={SUBTITLE[period]} />
      <PeriodTabs options={TABS} value={period} onChange={setPeriod} />
      <SelectField value={label} onPress={() => setSheet(true)} icon={<Calendar size={18} color={colors.primary} strokeWidth={1.6} />} />
      {period === 'daily' ? (
        <DailyView anchor={anchor} now={now} unit={settings.measurementUnit} />
      ) : period === 'weekly' ? (
        <WeeklyView anchor={anchor} now={now} />
      ) : (
        <MonthlyView anchor={anchor} now={now} />
      )}
      <DateRangeSheet
        visible={sheet}
        period={period}
        anchor={anchor}
        now={now}
        onClose={() => setSheet(false)}
        onApply={(p, a) => {
          setPeriod(p);
          setAnchor(a);
        }}
      />
    </Screen>
  );
}
