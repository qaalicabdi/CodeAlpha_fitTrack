import { Activity, BicepsFlexed, Bike, Dumbbell, Ellipsis, Flame, Footprints, Heart, PersonStanding } from 'lucide-react-native';

import type { IconComponent } from '@/components/common/layout';
import type { ActivityType } from '@/domain/activityTypes';
import type { FitnessGoal } from '@/domain/profile';

/** Glyphs used by the Figma workout picker and history rows. */
export const ACTIVITY_ICON: Record<ActivityType, IconComponent> = {
  walking: Footprints,
  running: Activity,
  cycling: Bike,
  gym: Dumbbell,
  strength: BicepsFlexed,
  yoga: PersonStanding,
  other: Ellipsis,
};

export const FITNESS_GOAL_ICON: Record<FitnessGoal, IconComponent> = {
  stay_active: Footprints,
  lose_weight: Flame,
  build_fitness: Dumbbell,
  maintain_health: Heart,
};
