import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { BackHeader, Footnote, Pill, Screen } from '@/components/common/layout';
import { Input } from '@/components/inputs/Input';
import { formatInt } from '@/domain/format';
import { validateGoalTarget } from '@/domain/goals';
import { validateProfileForm, type ProfileFieldErrors, type ProfileFormInput } from '@/domain/profile';
import { BodyFields, FitnessGoalOptions } from '@/features/profile/ProfileForm';
import { useAppData } from '@/state/AppDataProvider';

type SetupErrors = ProfileFieldErrors & { stepGoal?: string; save?: string };

/** 05 User Setup */
export default function Setup() {
  const router = useRouter();
  const { profile, settings, goals, saveProfile, setGoal } = useAppData();
  const unit = settings.measurementUnit;
  const [form, setForm] = useState<ProfileFormInput>({
    fullName: profile?.fullName ?? '',
    age: profile ? String(profile.age) : '',
    weight: profile ? String(profile.weightKg) : '',
    height: profile ? String(profile.heightCm) : '',
    fitnessGoal: profile?.fitnessGoal ?? null,
  });
  const [stepGoal, setStepGoal] = useState(formatInt(goals.daily_steps));
  const [errors, setErrors] = useState<SetupErrors>({});
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<ProfileFormInput>) => setForm((f) => ({ ...f, ...p }));

  const submit = async () => {
    const result = validateProfileForm(form, unit);
    const goal = validateGoalTarget('daily_steps', stepGoal);
    setErrors({ ...(result.ok ? {} : result.errors), ...(goal.ok ? {} : { stepGoal: goal.message }) });
    if (!result.ok || !goal.ok) return;
    setSaving(true);
    try {
      await saveProfile({ ...result.value, photoUri: profile?.photoUri ?? null });
      await setGoal('daily_steps', goal.value);
      router.push('/permission');
    } catch {
      setErrors({ save: "We couldn't save your details on this device. Free some space and try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackHeader title="Make it personal" subtitle="A few details. A better fit." />
        <Pill label="YOUR STARTING POINT" />
        <AppText color="textSecondary" variant="leadRegular" style={{ fontSize: 16 }}>
          Your profile helps tailor your goals and estimate the energy you use.
        </AppText>
        <BodyFields value={form} onChange={patch} errors={errors} unit={unit} />
        <Input
          label="Daily step goal"
          value={stepGoal}
          onChangeText={setStepGoal}
          suffix="steps"
          keyboardType="number-pad"
          helper="A great starting goal. You can change this anytime."
          error={errors.stepGoal}
        />
        <FitnessGoalOptions heading="What moves you?" value={form.fitnessGoal} onChange={(g) => patch({ fitnessGoal: g })} error={errors.fitnessGoal} />
        {errors.save ? <AppText color="errorText">{errors.save}</AppText> : null}
        <Button label="Continue" icon={ArrowRight} onPress={submit} loading={saving} />
        <Footnote>Your information stays on this device. No account or cloud upload required.</Footnote>
      </Screen>
    </KeyboardAvoidingView>
  );
}
