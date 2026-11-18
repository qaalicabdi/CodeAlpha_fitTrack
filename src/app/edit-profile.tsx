import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { Avatar } from '@/components/common/Avatar';
import { BackHeader, Footnote, Screen } from '@/components/common/layout';
import { heightDisplay, weightDisplay } from '@/domain/format';
import { validateProfileForm, type ProfileFieldErrors, type ProfileFormInput } from '@/domain/profile';
import { BodyFields, FitnessGoalOptions } from '@/features/profile/ProfileForm';
import { pickProfilePhoto } from '@/services/photoService';
import { useAppData, useProfile } from '@/state/AppDataProvider';

/** 22 Edit Profile */
export default function EditProfile() {
  const router = useRouter();
  const profile = useProfile();
  const { settings, saveProfile } = useAppData();
  const unit = settings.measurementUnit;
  const [form, setForm] = useState<ProfileFormInput>({
    fullName: profile.fullName,
    age: String(profile.age),
    weight: weightDisplay(profile.weightKg, unit).value,
    height: heightDisplay(profile.heightCm, unit).value,
    fitnessGoal: profile.fitnessGoal,
  });
  const [photoUri, setPhotoUri] = useState(profile.photoUri);
  const [errors, setErrors] = useState<ProfileFieldErrors & { save?: string; photo?: string }>({});
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<ProfileFormInput>) => setForm((f) => ({ ...f, ...p }));

  const changePhoto = async () => {
    try {
      const r = await pickProfilePhoto(photoUri);
      if (r.status === 'picked') setPhotoUri(r.uri);
      else if (r.status === 'denied') setErrors((e) => ({ ...e, photo: 'Photo access was not allowed. You can change this in device settings.' }));
    } catch {
      setErrors((e) => ({ ...e, photo: "That photo couldn't be used. Try another one." }));
    }
  };

  const save = async () => {
    const r = validateProfileForm(form, unit);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      // Unchanged unit-converted values keep their exact stored metric numbers.
      const weightKg = form.weight === weightDisplay(profile.weightKg, unit).value ? profile.weightKg : r.value.weightKg;
      const heightCm = form.height === heightDisplay(profile.heightCm, unit).value ? profile.heightCm : r.value.heightCm;
      await saveProfile({ ...r.value, weightKg, heightCm, photoUri });
      router.back();
    } catch {
      setErrors({ save: "Your changes weren't saved. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackHeader title="Edit profile" subtitle="Keep your starting point up to date." />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar name={form.fullName || profile.fullName} uri={photoUri} size={56} />
          <View style={{ gap: 2 }}>
            <AppText>{form.fullName || profile.fullName}</AppText>
            <Pressable onPress={() => void changePhoto()} accessibilityRole="button" hitSlop={8} style={{ minHeight: 32, justifyContent: 'center' }}>
              <AppText variant="label" color="primaryText">
                Change photo
              </AppText>
            </Pressable>
          </View>
        </View>
        {errors.photo ? <AppText color="errorText">{errors.photo}</AppText> : null}
        <BodyFields value={form} onChange={patch} errors={errors} unit={unit} layout="stacked" />
        <FitnessGoalOptions heading="Fitness goal" value={form.fitnessGoal} onChange={(g) => patch({ fitnessGoal: g })} error={errors.fitnessGoal} />
        <Footnote>Profile changes apply to future calorie estimates. Previously saved activities keep their recorded values.</Footnote>
        {errors.save ? <AppText color="errorText">{errors.save}</AppText> : null}
        <Button label="Save Changes" icon={Check} onPress={() => void save()} loading={saving} />
        <Button label="Cancel" variant="text" onPress={() => router.back()} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
