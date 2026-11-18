import { View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { Input } from '@/components/inputs/Input';
import { OptionCard } from '@/components/inputs/selection';
import { FITNESS_GOAL_ICON } from '@/constants/icons';
import type { MeasurementUnit } from '@/domain/format';
import { FITNESS_GOAL_LABEL, FITNESS_GOALS, type FitnessGoal, type ProfileFieldErrors, type ProfileFormInput } from '@/domain/profile';

/** Name, age, weight and height — shared by User Setup (05) and Edit Profile (22). */
export function BodyFields({
  value,
  onChange,
  errors,
  unit,
  layout = 'row',
}: {
  value: ProfileFormInput;
  onChange: (patch: Partial<ProfileFormInput>) => void;
  errors: ProfileFieldErrors;
  unit: MeasurementUnit;
  /** 05 shows age/weight/height in one row; 22 shows age alone then weight + height */
  layout?: 'row' | 'stacked';
}) {
  const imperial = unit === 'imperial';
  const age = (
    <Input style={{ flex: 1 }} label="Age" value={value.age} onChangeText={(v) => onChange({ age: v })} suffix="years" keyboardType="number-pad" maxLength={3} error={errors.age} />
  );
  const weight = (
    <Input style={{ flex: 1 }} label="Weight" value={value.weight} onChangeText={(v) => onChange({ weight: v })} suffix={imperial ? 'lb' : 'kg'} keyboardType="decimal-pad" maxLength={5} error={errors.weight} />
  );
  const height = (
    <Input style={{ flex: 1 }} label="Height" value={value.height} onChangeText={(v) => onChange({ height: v })} suffix={imperial ? 'in' : 'cm'} keyboardType="decimal-pad" maxLength={5} error={errors.height} />
  );
  return (
    <View style={{ gap: 20 }}>
      <Input label="Full name" value={value.fullName} onChangeText={(v) => onChange({ fullName: v })} error={errors.fullName} maxLength={60} />
      {layout === 'row' ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {age}
          {weight}
          {height}
        </View>
      ) : (
        <>
          {age}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {weight}
            {height}
          </View>
        </>
      )}
    </View>
  );
}

/** Fitness goal option cards (Stay Active / Lose Weight / Build Fitness / Maintain Health). */
export function FitnessGoalOptions({ value, onChange, error, heading }: { value: FitnessGoal | null; onChange: (g: FitnessGoal) => void; error?: string; heading: string }) {
  return (
    <View style={{ gap: 10 }}>
      <AppText variant={heading === 'Fitness goal' ? 'label' : 'lead'}>{heading}</AppText>
      <View style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel={heading}>
        {FITNESS_GOALS.map((g) => (
          <OptionCard key={g} label={FITNESS_GOAL_LABEL[g]} icon={FITNESS_GOAL_ICON[g]} selected={value === g} onPress={() => onChange(g)} />
        ))}
      </View>
      {error ? (
        <AppText variant="captionRegular" color="errorText">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
