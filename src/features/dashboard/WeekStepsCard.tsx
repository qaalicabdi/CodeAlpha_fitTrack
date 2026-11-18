import { View } from 'react-native';

import { BarChart } from '@/components/charts/charts';
import { ChartLegend } from '@/components/cards/data';
import { AppText } from '@/components/common/AppText';
import { Card, SectionHeader } from '@/components/common/layout';
import { fromDateKey, WEEKDAY_INITIALS } from '@/domain/dates';
import { formatInt } from '@/domain/format';
import type { RangeDay } from '@/services/activityService';
import { useTheme } from '@/theme/ThemeProvider';

/** Weekly bar card (Home "Your week in steps", Progress weekly steps/energy). */
export function WeekBarsCard({
  title,
  headline,
  headlineCaption,
  subtitle,
  axisLabel,
  days,
  today,
  value,
  max,
  onViewAll,
}: {
  title: string;
  headline?: string;
  headlineCaption?: string;
  subtitle?: string;
  axisLabel: string;
  days: RangeDay[];
  today: string;
  value: (d: RangeDay) => number;
  max: number;
  onViewAll?: () => void;
}) {
  const { colors } = useTheme();
  const data = days.map((d, i) => {
    const isToday = d.activityDate === today;
    const future = fromDateKey(d.activityDate).getTime() > fromDateKey(today).getTime();
    return { label: WEEKDAY_INITIALS[i] ?? '', value: value(d), highlight: isToday, empty: future, bold: isToday };
  });
  const total = days.reduce((s, d) => s + value(d), 0);
  return (
    <Card style={{ gap: 14 }}>
      <SectionHeader title={title} actionLabel={onViewAll ? 'View all' : undefined} onAction={onViewAll} />
      {headline ? (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <AppText variant="heading" style={{ fontSize: 28, lineHeight: 34 }}>
            {headline}
          </AppText>
          {headlineCaption ? <AppText variant="captionRegular" color="textSecondary" style={{ fontSize: 13 }}>{headlineCaption}</AppText> : null}
        </View>
      ) : null}
      {subtitle ? <AppText color="textSecondary">{subtitle}</AppText> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="caption" color="textSecondary">
          {axisLabel}
        </AppText>
        <ChartLegend items={[{ label: 'Current day', color: colors.primary }]} />
      </View>
      <BarChart data={data} max={max} accessibilityLabel={`${title}: total ${formatInt(total)}`} />
    </Card>
  );
}
