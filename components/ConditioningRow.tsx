
import React from 'react';
import { ConditioningEntry, IntensityUnit, AthleteStats } from '../types';
import { MAS_ZONES } from '../constants';

interface ConditioningRowProps {
  exercise: ConditioningEntry;
  isLocked?: boolean;
  athleteStats?: AthleteStats;
  onUpdate: (updates: Partial<ConditioningEntry>) => void;
  onDelete: () => void;
}

export const ConditioningRow: React.FC<ConditioningRowProps> = ({ exercise, isLocked, athleteStats, onUpdate, onDelete }) => {
  const isMAS = exercise.unit === IntensityUnit.MAS;
  const currentZone = isMAS ? MAS_ZONES.find(z => z.label === exercise.intensity) : null;

  // Calculate target pace and time
  const paceCalculated = React.useMemo(() => {
    if (!athleteStats || !athleteStats.mas) return null;
    const pct = currentZone ? currentZone.percentage : (parseFloat(exercise.intensity) || 0);
    if (pct <= 0) return null;
    
    const speedMS = athleteStats.mas * (pct / 100);
    const speedKMH = (speedMS * 3.6).toFixed(1);
    
    let timeLabel = "";
    if (exercise.distance && exercise.distance > 0) {
      const seconds = exercise.distance / speedMS;
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      timeLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }

    return { speedMS: speedMS.toFixed(2), speedKMH, timeLabel };
  }, [athleteStats, currentZone, exercise.intensity, exercise.distance]);

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className={`grid grid-cols-1 md:grid-cols-10 gap-2 bg-blue-50/30 p-4 rounded-2xl border border-blue-100 items-center transition-all ${isLocked ? 'opacity-80' : 'hover:border-blue-400'}`}>
        <div className="md:col-span-3">
          <input
            type="text"
            value={exercise.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full bg-transparent font-black text-slate-800 focus:outline-none placeholder-blue-300"
            placeholder="Conditioning Drill Name"
          />
        </div>

        <div className="md:col-span-1 flex flex-col">
          <label className="text-[9px] font-black text-blue-400 uppercase">Sets</label>
          <input
            type="number"
            value={exercise.sets}
            onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 0 })}
            className="w-full bg-transparent border-b border-blue-100 focus:border-blue-400 focus:outline-none font-bold text-sm"
          />
        </div>

        <div className="md:col-span-1 flex flex-col">
          <label className="text-[9px] font-black text-blue-400 uppercase">Distance (m)</label>
          <input
            type="number"
            value={exercise.distance || ''}
            onChange={(e) => onUpdate({ distance: parseFloat(e.target.value) || 0 })}
            className="w-full bg-transparent border-b border-blue-100 focus:border-blue-400 focus:outline-none font-bold text-sm"
            placeholder="Meters"
          />
        </div>

        <div className="md:col-span-2 flex flex-col relative">
          <label className="text-[9px] font-black text-blue-400 uppercase flex items-center gap-1">
            Intensity 
            {(isLocked || (!exercise.isCustomIntensity)) && (
               <svg className={`w-2 h-2 ${isLocked ? 'text-blue-600' : 'text-blue-400'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            )}
          </label>
          <div className="flex items-center gap-1">
            {isMAS ? (
              <select
                value={exercise.intensity}
                disabled={isLocked}
                onChange={(e) => onUpdate({ intensity: e.target.value, unit: IntensityUnit.MAS, isCustomIntensity: true })}
                className={`w-full bg-transparent border-b border-blue-100 focus:outline-none font-bold text-xs py-1 ${isLocked ? 'text-blue-600 cursor-not-allowed' : (!exercise.isCustomIntensity ? 'text-blue-600' : '')}`}
              >
                <option value="">Select Zone</option>
                {MAS_ZONES.map(z => <option key={z.label} value={z.label}>{z.label} ({z.percentage}%)</option>)}
              </select>
            ) : (
              <input 
                type="text"
                value={exercise.intensity}
                disabled={isLocked}
                onChange={(e) => onUpdate({ intensity: e.target.value, isCustomIntensity: true })}
                className={`w-full bg-transparent border-b border-blue-100 focus:outline-none font-bold text-xs py-1 ${isLocked ? 'text-blue-600 cursor-not-allowed' : (!exercise.isCustomIntensity ? 'text-blue-600' : '')}`}
              />
            )}
            <select
              value={exercise.unit}
              disabled={isLocked}
              onChange={(e) => onUpdate({ unit: e.target.value as IntensityUnit, isCustomIntensity: true })}
              className={`text-[8px] font-black bg-white/50 border-none rounded px-1 ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
            >
               {Object.values(IntensityUnit).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="md:col-span-1 flex flex-col">
          <label className="text-[9px] font-black text-blue-400 uppercase">Rest</label>
          <input
            type="text"
            value={exercise.rest}
            onChange={(e) => onUpdate({ rest: e.target.value })}
            className="w-full bg-transparent border-b border-blue-100 focus:border-blue-400 focus:outline-none font-bold text-sm"
            placeholder="e.g. 1:1"
          />
        </div>

        <div className="md:col-span-1 flex flex-col items-center">
          <label className="text-[9px] font-black text-blue-400 uppercase">Target Time</label>
          <div className="font-black text-blue-600 text-sm">
            {paceCalculated?.timeLabel || "--"}
          </div>
        </div>

        <div className="md:col-span-1 flex justify-end">
          <button onClick={onDelete} className="text-blue-200 hover:text-red-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
      
      {paceCalculated && currentZone && (
        <div className="flex gap-4 px-4 py-1 text-[10px] font-black uppercase">
          <span className={`${currentZone.color}`}>效能: {currentZone.effect}</span>
          <span className="text-slate-400">配速: {paceCalculated.speedMS} m/s ({paceCalculated.speedKMH} km/h)</span>
        </div>
      )}
    </div>
  );
};
