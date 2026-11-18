import { StyleSheet, View } from 'react-native';

import { ChartLegend } from '@/components/cards/data';
import { AppText } from '@/components/common/AppText';
import { daysInMonth, fromDateKey, startOfMonth, toDateKey, WEEKDAY_INITIALS } from '@/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';

/** Monday-first month grid: workout days tinted, today filled, future muted. */
export function ConsistencyCalendar({ month, today, workoutDays }: { month: Date; today: string; workoutDays: ReadonlySet<string> }) {
  const { colors, fonts } = useTheme();
  const first = startOfMonth(month);
  const lead = (first.getDay() + 6) % 7;
  const count = daysInMonth(month);
  const cells: (number | null)[] = [...new Array<null>(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const todayDate = fromDateKey(today);

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.row}>
        {WEEKDAY_INITIALS.map((d, i) => (
          <View key={`h${i}`} style={styles.cell}>
            <AppText variant="caption" color="textSecondary">
              {d}
            </AppText>
          </View>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, w) => (
        <View key={`w${w}`} style={styles.row}>
          {cells.slice(w * 7, w * 7 + 7).map((day, i) => {
            if (day === null) return <View key={`e${w}-${i}`} style={styles.cell} />;
            const key = toDateKey(new Date(first.getFullYear(), first.getMonth(), day));
            const isToday = key === today;
            const future = fromDateKey(key).getTime() > todayDate.getTime();
            const workout = workoutDays.has(key);
            return (
              <View key={key} style={styles.cell}>
                <View
                  accessibilityLabel={`${key}${workout ? ', workout day' : ''}${isToday ? ', today' : ''}`}
                  style={[styles.day, { backgroundColor: isToday ? colors.primary : workout ? colors.tint : 'transparent' }]}
                >
                  <AppText
                    variant="label"
                    style={{
                      color: isToday ? colors.onPrimary : future ? colors.textMuted : colors.text,
                      opacity: future ? 0.55 : 1,
                      fontFamily: isToday || workout ? fonts.bold : fonts.medium,
                    }}
                  >
                    {day}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <ChartLegend items={[{ label: 'Workout day', color: colors.barMuted }, { label: 'Today', color: colors.primary }]} />
        <AppText variant="caption" color="primaryText">
          Future dates are muted
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  day: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
