
import React, { useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrainingProgram, IntensityUnit, AthleteStats } from '../types';

interface ProgramStatsProps {
  program: TrainingProgram;
}

export const ProgramStats: React.FC<ProgramStatsProps> = ({ program }) => {
  const calculateStrengthVolume = (ex: any, stats?: AthleteStats) => {
    const sets = Number(ex.sets) || 0;
    const reps = parseInt(ex.reps) || 0;
    let intensityVal = parseFloat(ex.intensity) || 0;

    if (ex.unit === IntensityUnit.PERCENT_1RM && stats) {
      const cat = (ex.category || '').toLowerCase();
      const name = (ex.name || '').toLowerCase();
      let base1RM = 0;
      
      if (cat.includes('squat') || name.includes('squat')) base1RM = stats.squat1rm || 0;
      else if (cat.includes('push') || name.includes('push')) base1RM = stats.push1rm || 0;
      else if (cat.includes('pull') || name.includes('pull')) base1RM = stats.pull1rm || 0;
      else if (cat.includes('press') || name.includes('press')) base1RM = stats.press1rm || 0;
      else if (cat.includes('hinge') || name.includes('deadlift')) base1RM = stats.deadlift1rm || 0;
      
      if (base1RM > 0) {
        intensityVal = (intensityVal / 100) * base1RM;
      }
    }
    return sets * reps * intensityVal;
  };

  const aggregateWeeklyStats = useMemo(() => {
    const allWeeks: any[] = [];
    program.cycles.forEach(cycle => {
      cycle.weeks.forEach(week => {
        let totalStrengthVolume = 0;
        let totalCondDistance = 0;
        
        week.days.forEach(day => {
          day.strengthExercises.forEach(ex => {
            // Using the cycle's stats for this specific calculation
            totalStrengthVolume += calculateStrengthVolume(ex, cycle.stats);
          });
          day.conditioningExercises.forEach(ex => {
            const s = Number(ex.sets) || 0;
            const d = Number(ex.distance) || 0;
            totalCondDistance += (s * d);
          });
        });

        allWeeks.push({
          label: `C${program.cycles.indexOf(cycle) + 1}W${week.weekNumber}`,
          strength: totalStrengthVolume,
          conditioning: totalCondDistance
        });
      });
    });
    return allWeeks;
  }, [program]);

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Total Volume Analytics</h2>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cumulative Strength Load (kg)</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregateWeeklyStats}>
                <defs>
                  <linearGradient id="colorStrength" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={8} fontWeight="black" />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', fontSize: '10px'}} />
                <Area type="monotone" dataKey="strength" stroke="#3b82f6" strokeWidth={3} fill="url(#colorStrength)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cumulative Distance (m)</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregateWeeklyStats}>
                <defs>
                  <linearGradient id="colorCond" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={8} fontWeight="black" />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', fontSize: '10px'}} />
                <Area type="monotone" dataKey="conditioning" stroke="#10b981" strokeWidth={3} fill="url(#colorCond)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
