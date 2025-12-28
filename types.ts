
export enum IntensityUnit {
  RPE = 'RPE',
  PERCENT_1RM = '% 1RM',
  RIR = 'RIR',
  MAS = '% MAS',
  MSS = '% MSS'
}

export interface ExerciseEntry {
  id: string;
  name: string;
  sets: number;
  reps: string;
  intensity: string;
  unit: IntensityUnit;
  rest: string;
  notes: string;
  category: string;
  isCustomIntensity?: boolean;
}

export interface ConditioningEntry extends ExerciseEntry {
  distance?: number;
  targetTime?: string;
  workTime?: number;
}

export interface TrainingDay {
  id: string;
  title: string;
  warmup?: string;
  strengthExercises: ExerciseEntry[];
  conditioningExercises: ConditioningEntry[];
  fatigueChecks?: Record<string, boolean>;
  fatigueIntensity?: number;
  fatigueNotes?: string;
}

export interface TrainingWeek {
  id: string;
  weekNumber: number;
  title: string;
  strengthMasterIntensity?: string;
  strengthMasterUnit?: IntensityUnit;
  isStrengthLocked?: boolean;
  condMasterIntensity?: string;
  condMasterUnit?: IntensityUnit;
  isCondLocked?: boolean;
  days: TrainingDay[];
}

export interface AthleteStats {
  mas: number;
  mss: number;
  squat1rm?: number;
  deadlift1rm?: number;
  push1rm?: number;
  pull1rm?: number;
  press1rm?: number;
}

export interface TrainingCycle {
  id: string;
  name: string;
  weeks: TrainingWeek[];
  stats: AthleteStats; // Moved here from Program
}

export interface TrainingProgram {
  id: string;
  athleteName: string;
  goal: string;
  cycles: TrainingCycle[];
  lastModified: number;
}

export interface ExerciseLibraryItem {
  name: string;
  category: string;
}
