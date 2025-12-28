
import { ExerciseLibraryItem } from './types';

export const CATEGORIES = ['Squat', 'Hinge', 'Push', 'Pull', 'Press', 'Single Leg', 'Core', 'Carry', 'Conditioning', 'Other'];

export interface MASZone {
  percentage: number;
  label: string;
  effect: string;
  color: string;
}

export const MAS_ZONES: MASZone[] = [
  { percentage: 80, label: 'MAS-20%', effect: '恢復性有氧', color: 'text-emerald-500' },
  { percentage: 90, label: 'MAS-10%', effect: '穩定節奏', color: 'text-green-500' },
  { percentage: 100, label: 'MAS', effect: '閾值速度', color: 'text-blue-500' },
  { percentage: 120, label: 'MAS+20%', effect: '高強度間歇', color: 'text-yellow-500' },
  { percentage: 140, label: 'MAS+40%', effect: '無氧耐力', color: 'text-orange-500' },
  { percentage: 160, label: 'MAS+60%', effect: '高速跑', color: 'text-red-500' },
  { percentage: 180, label: 'MAS+80%', effect: '最大衝刺前導', color: 'text-purple-500' },
];

export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  { name: 'Back Squat', category: 'Squat' },
  { name: 'Deadlift', category: 'Hinge' },
  { name: 'Bench Press', category: 'Push' },
  { name: 'Overhead Press', category: 'Press' },
  { name: 'Pull Up', category: 'Pull' },
  { name: 'MAS Intervals', category: 'Conditioning' },
];

export const INITIAL_PROGRAM_NAME = "New Training Cycle";

// List of wellness/fatigue markers used for athlete monitoring
export const FATIGUE_ITEMS = [
  { key: 'sleep', label: 'Sleep Quality', icon: '🌙' },
  { key: 'stress', label: 'Stress Levels', icon: '🧠' },
  { key: 'energy', label: 'Energy Levels', icon: '⚡' },
  { key: 'mood', label: 'Mood/Motivation', icon: '🔥' },
];
