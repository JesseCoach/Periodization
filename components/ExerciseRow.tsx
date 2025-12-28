
import React, { useMemo } from 'react';
import { ExerciseEntry, IntensityUnit, AthleteStats } from '../types';
import { CATEGORIES } from '../constants';

interface ExerciseRowProps {
  exercise: ExerciseEntry;
  isLocked?: boolean;
  athleteStats?: AthleteStats;
  onUpdate: (updates: Partial<ExerciseEntry>) => void;
  onDelete: () => void;
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({ exercise, isLocked, athleteStats, onUpdate, onDelete }) => {
  const isPct1RM = exercise.unit === IntensityUnit.PERCENT_1RM;

  const intensityInfo = useMemo(() => {
    if (!athleteStats || !isPct1RM) return null;

    const pct = parseFloat(exercise.intensity) || 0;
    if (pct <= 0) return null;

    let base1RM = 0;
    const cat = (exercise.category || "").toLowerCase();
    const name = (exercise.name || "").toLowerCase();
    
    // Auto-detect which 1RM to use based on category or name
    if (cat.includes('squat') || name.includes('squat')) base1RM = athleteStats.squat1rm || 0;
    else if (cat.includes('push') || name.includes('bench') || name.includes('push')) base1RM = athleteStats.push1rm || 0;
    else if (cat.includes('hinge') || name.includes('deadlift')) base1RM = athleteStats.deadlift1rm || 0;
    else if (cat.includes('pull') || name.includes('pull') || name.includes('row')) base1RM = athleteStats.pull1rm || 0;
    else if (cat.includes('press') || name.includes('press') || name.includes('overhead')) base1RM = athleteStats.press1rm || 0;

    let weightLabel = "";
    if (base1RM > 0) {
      weightLabel = `${(base1RM * (pct / 100)).toFixed(1)} kg`;
    }

    // Determine "Effect" (效能) based on %1RM
    let effect = "";
    let effectColor = "text-slate-400";
    if (pct < 60) { effect = "恢復/技巧 (Recovery)"; effectColor = "text-emerald-500"; }
    else if (pct < 70) { effect = "耐力/肌肥大基礎 (Endurance)"; effectColor = "text-green-500"; }
    else if (pct < 80) { effect = "肌肥大/一般力量 (Hypertrophy)"; effectColor = "text-blue-500"; }
    else if (pct < 90) { effect = "最大力量 (Max Strength)"; effectColor = "text-orange-500"; }
    else { effect = "神經募集/爆發峰值 (Peak Power)"; effectColor = "text-red-500"; }

    return { weight: weightLabel, effect, effectColor };
  }, [athleteStats, exercise.intensity, exercise.unit, exercise.category, exercise.name]);

  return (
    <div className="flex flex-col gap-1 mb-3">
      <div className={`grid grid-cols-2 md:grid-cols-12 gap-2 bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 items-center transition-all ${isLocked ? 'opacity-80' : 'hover:border-blue-300'}`}>
        {/* Movement Name */}
        <div className="col-span-2 md:col-span-3">
          <input type="text" value={exercise.name} onChange={(e) => onUpdate({ name: e.target.value })} className="w-full bg-transparent font-bold text-slate-800 focus:outline-none rounded px-2 py-2" placeholder="Movement Name" />
        </div>
        
        {/* Sets */}
        <div className="flex items-center gap-1 px-1 md:col-span-1">
          <input type="number" value={exercise.sets} onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 0 })} className="w-full text-center border-b border-slate-100 focus:outline-none font-medium py-1" />
          <span className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase">Sets</span>
        </div>

        {/* Reps */}
        <div className="flex items-center gap-1 px-1 md:col-span-1">
          <input type="text" value={exercise.reps} onChange={(e) => onUpdate({ reps: e.target.value })} className="w-full text-center border-b border-slate-100 focus:outline-none font-medium py-1" />
          <span className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase">Reps</span>
        </div>

        {/* % 1RM Intensity */}
        <div className="flex items-center gap-1 px-1 md:col-span-1">
          <input 
            type="number" 
            value={exercise.intensity} 
            onChange={(e) => onUpdate({ intensity: e.target.value, unit: IntensityUnit.PERCENT_1RM, isCustomIntensity: true })} 
            className="w-full text-center border-b border-blue-200 focus:outline-none font-bold py-1 text-blue-600" 
            placeholder="0"
          />
          <span className="text-[8px] md:text-[9px] text-blue-400 font-black uppercase whitespace-nowrap">% 1RM</span>
        </div>

        {/* Category */}
        <div className="hidden md:block md:col-span-2 px-1">
          <select value={exercise.category} onChange={(e) => onUpdate({ category: e.target.value })} className="w-full text-[10px] font-bold border-none bg-slate-50 rounded focus:outline-none py-1.5">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Rest Time - Moved further back and added label */}
        <div className="hidden md:flex items-center gap-2 px-1 md:col-span-3 border-l border-slate-50 pl-4">
          <span className="text-[8px] font-black text-slate-400 uppercase whitespace-nowrap">休息時間</span>
          <input type="text" value={exercise.rest} onChange={(e) => onUpdate({ rest: e.target.value })} className="w-full text-xs border-b border-slate-100 focus:outline-none py-1 font-medium" placeholder="90s" />
        </div>

        {/* Actions */}
        <div className="flex justify-end pr-1 md:col-span-1">
          <button onClick={onDelete} className="p-2 text-slate-200 hover:text-red-500 transition-colors active:scale-90">
            <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* Info labels below the row */}
      {intensityInfo && (
        <div className="flex gap-4 px-4 py-1 text-[10px] font-black uppercase">
          <span className={intensityInfo.effectColor}>強度效能: {intensityInfo.effect}</span>
          {intensityInfo.weight && (
            <span className="text-blue-600">建議重量: {intensityInfo.weight}</span>
          )}
        </div>
      )}
    </div>
  );
};
