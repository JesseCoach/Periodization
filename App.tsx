
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrainingProgram, IntensityUnit, TrainingWeek, TrainingDay, ExerciseEntry, AthleteStats, ConditioningEntry, TrainingCycle } from './types';
import { INITIAL_PROGRAM_NAME, CATEGORIES, FATIGUE_ITEMS } from './constants';
import { ExerciseRow } from './components/ExerciseRow';
import { ConditioningRow } from './components/ConditioningRow';
import { ProgramStats } from './components/ProgramStats';

const App: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [programs, setPrograms] = useState<TrainingProgram[]>(() => {
    try {
      const saved = localStorage.getItem('snc_athlete_programs_v3'); 
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load data from storage", e);
    }
    return [];
  });

  const [activeProgramId, setActiveProgramId] = useState<string | null>(() => {
    return localStorage.getItem('snc_active_athlete_id_v3') || null;
  });

  const [collapsedCycles, setCollapsedCycles] = useState<Set<string>>(new Set());
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [collapsedStats, setCollapsedStats] = useState<Set<string>>(new Set());

  const [isLeftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setRightDrawerOpen] = useState(false);

  const [activeDayId, setActiveDayId] = useState<string | null>(null);

  // Auto-save logic with visual feedback
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      localStorage.setItem('snc_athlete_programs_v3', JSON.stringify(programs));
      if (activeProgramId) {
        localStorage.setItem('snc_active_athlete_id_v3', activeProgramId);
      }
      setIsSaving(false);
    }, 500); // Debounce save
    return () => clearTimeout(timer);
  }, [programs, activeProgramId]);

  // Data Management Functions
  const exportData = () => {
    const dataStr = JSON.stringify(programs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `StandardForce_Backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          if (window.confirm("匯入將覆蓋目前所有資料，確定要繼續嗎？ (Import will overwrite all data, continue?)")) {
            setPrograms(json);
            if (json.length > 0) setActiveProgramId(json[0].id);
            alert("資料匯入成功！");
          }
        } else {
          alert("無效的檔案格式。 (Invalid file format)");
        }
      } catch (err) {
        alert("讀取檔案失敗。 (Failed to read file)");
      }
    };
    reader.readAsText(file);
  };

  const resetAllData = () => {
    if (window.confirm("危險動作：這將刪除所有運動員資料且無法復原。確定要清空嗎？")) {
      setPrograms([]);
      setActiveProgramId(null);
      setActiveDayId(null);
      localStorage.clear();
      window.location.reload();
    }
  };

  const activeProgram = useMemo(() => 
    programs.find(p => p.id === activeProgramId) || null
  , [programs, activeProgramId]);

  useEffect(() => {
    if (activeProgram && !activeDayId && activeProgram.cycles[0]?.weeks[0]?.days[0]) {
      setActiveDayId(activeProgram.cycles[0].weeks[0].days[0].id);
    }
  }, [activeProgram, activeDayId]);

  const activeDay = useMemo(() => {
    if (!activeProgram || !activeDayId) return null;
    for (let cIdx = 0; cIdx < activeProgram.cycles.length; cIdx++) {
      const cycle = activeProgram.cycles[cIdx];
      for (let wIdx = 0; wIdx < cycle.weeks.length; wIdx++) {
        const week = cycle.weeks[wIdx];
        const dIdx = week.days.findIndex(d => d.id === activeDayId);
        if (dIdx !== -1) {
          return { 
            day: week.days[dIdx], 
            cycleId: cycle.id, 
            weekId: week.id, 
            cycle,
            cycleNumber: cIdx + 1,
            weekNumber: week.weekNumber,
            dayNumber: dIdx + 1
          };
        }
      }
    }
    return null;
  }, [activeProgram, activeDayId]);

  const updateActiveProgram = (updates: Partial<TrainingProgram>) => {
    if (!activeProgramId) return;
    setPrograms(prev => prev.map(p => 
      p.id === activeProgramId ? { ...p, ...updates, lastModified: Date.now() } : p
    ));
  };

  const deleteProgram = (id: string, name: string) => {
    if (!window.confirm(`確定要刪除運動員「${name}」的所有訓練計畫嗎？`)) return;
    setPrograms(prev => prev.filter(p => p.id !== id));
    if (activeProgramId === id) {
      setActiveProgramId(null);
      setActiveDayId(null);
    }
  };

  const updateCycleStats = (cycleId: string, statsUpdates: Partial<AthleteStats>) => {
    if (!activeProgram) return;
    updateActiveProgram({
      cycles: activeProgram.cycles.map(c => 
        c.id === cycleId ? { ...c, stats: { ...c.stats, ...statsUpdates } } : c
      )
    });
  };

  const updateDayData = (cycleId: string, weekId: string, dayId: string, updates: Partial<TrainingDay>) => {
    if (!activeProgramId) return;
    setPrograms(prev => prev.map(p => {
      if (p.id !== activeProgramId) return p;
      return {
        ...p,
        cycles: p.cycles.map(c => c.id === cycleId ? {
          ...c,
          weeks: c.weeks.map(w => w.id === weekId ? {
            ...w,
            days: w.days.map(d => d.id === dayId ? { ...d, ...updates } : d)
          } : w)
        } : c)
      };
    }));
  };

  const getDefaultStats = (): AthleteStats => ({
    mas: 0, mss: 0, squat1rm: 0, deadlift1rm: 0, push1rm: 0, pull1rm: 0, press1rm: 0
  });

  const addCycle = () => {
    if (!activeProgram) return;
    const newDayId = crypto.randomUUID();
    const newCycle: TrainingCycle = {
      id: crypto.randomUUID(),
      name: `New Training Cycle ${activeProgram.cycles.length + 1}`,
      stats: getDefaultStats(),
      weeks: [{
        id: crypto.randomUUID(),
        weekNumber: 1,
        title: 'Block 1',
        days: [{ id: newDayId, title: 'Day 1', warmup: '', strengthExercises: [], conditioningExercises: [], fatigueChecks: {}, fatigueIntensity: 5, fatigueNotes: '' }]
      }]
    };
    updateActiveProgram({ cycles: [...activeProgram.cycles, newCycle] });
  };

  const addWeek = (cycleId: string) => {
    if (!activeProgram) return;
    const cycle = activeProgram.cycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const nextNum = cycle.weeks.length + 1;
    const newDayId = crypto.randomUUID();
    const newWeek: TrainingWeek = {
      id: crypto.randomUUID(),
      weekNumber: nextNum,
      title: `Week ${nextNum}`,
      days: [{ id: newDayId, title: `Day 1`, warmup: '', strengthExercises: [], conditioningExercises: [], fatigueChecks: {}, fatigueIntensity: 5, fatigueNotes: '' }]
    };
    updateActiveProgram({
      cycles: activeProgram.cycles.map(c => c.id === cycleId ? { ...c, weeks: [...c.weeks, newWeek] } : c)
    });
  };

  const addDay = (cycleId: string, weekId: string) => {
    if (!activeProgram) return;
    updateActiveProgram({
      cycles: activeProgram.cycles.map(c => c.id === cycleId ? {
        ...c,
        weeks: c.weeks.map(w => w.id === weekId ? {
          ...w,
          days: [...w.days, { id: crypto.randomUUID(), title: `Day ${w.days.length + 1}`, warmup: '', strengthExercises: [], conditioningExercises: [], fatigueChecks: {}, fatigueIntensity: 5, fatigueNotes: '' }]
        } : w)
      } : c)
    });
  };

  const addStrengthExercise = (cycleId: string, weekId: string, dayId: string) => {
    if (!activeProgram) return;
    const day = activeProgram.cycles.find(c => c.id === cycleId)?.weeks.find(w => w.id === weekId)?.days.find(d => d.id === dayId);
    if (!day) return;
    const newEx: ExerciseEntry = { id: crypto.randomUUID(), name: '', sets: 3, reps: '10', intensity: '75', unit: IntensityUnit.PERCENT_1RM, rest: '90s', notes: '', category: 'Squat' };
    updateDayData(cycleId, weekId, dayId, { strengthExercises: [...day.strengthExercises, newEx] });
  };

  const addConditioningExercise = (cycleId: string, weekId: string, dayId: string) => {
    if (!activeProgram) return;
    const day = activeProgram.cycles.find(c => c.id === cycleId)?.weeks.find(w => w.id === weekId)?.days.find(d => d.id === dayId);
    if (!day) return;
    const newEx: ConditioningEntry = { id: crypto.randomUUID(), name: '', sets: 3, reps: '1', intensity: 'MAS', unit: IntensityUnit.MAS, rest: '1:1', notes: '', category: 'Conditioning', distance: 100 };
    updateDayData(cycleId, weekId, dayId, { conditioningExercises: [...day.conditioningExercises, newEx] });
  };

  const createNewProgram = () => {
    const newDayId = crypto.randomUUID();
    const newProgram: TrainingProgram = {
      id: crypto.randomUUID(), athleteName: 'New Athlete', goal: '', lastModified: Date.now(),
      cycles: [{
        id: crypto.randomUUID(), name: INITIAL_PROGRAM_NAME, stats: getDefaultStats(),
        weeks: [{ id: crypto.randomUUID(), weekNumber: 1, title: 'Initial Phase', days: [{ id: newDayId, title: 'Day 1', warmup: '', strengthExercises: [], conditioningExercises: [], fatigueChecks: {}, fatigueIntensity: 5, fatigueNotes: '' }] }]
      }]
    };
    setPrograms(prev => [...prev, newProgram]);
    setActiveProgramId(newProgram.id);
    setActiveDayId(newDayId);
    setLeftDrawerOpen(false);
  };

  const toggleCycleCollapse = (cycleId: string) => setCollapsedCycles(prev => { const next = new Set(prev); if (next.has(cycleId)) next.delete(cycleId); else next.add(cycleId); return next; });
  const toggleStatsCollapse = (cycleId: string) => setCollapsedStats(prev => { const next = new Set(prev); if (next.has(cycleId)) next.delete(cycleId); else next.add(cycleId); return next; });
  const toggleWeekCollapse = (weekId: string) => setCollapsedWeeks(prev => { const next = new Set(prev); if (next.has(weekId)) next.delete(weekId); else next.add(weekId); return next; });
  const toggleDayCollapse = (dayId: string) => setCollapsedDays(prev => { const next = new Set(prev); if (next.has(dayId)) next.delete(dayId); else next.add(dayId); return next; });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {(isLeftDrawerOpen || isRightDrawerOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity xl:hidden" onClick={() => { setLeftDrawerOpen(false); setRightDrawerOpen(false); }} />
      )}

      {/* Sidebar: Athlete Roster */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out transform ${isLeftDrawerOpen ? 'translate-x-0' : '-translate-x-full'} xl:relative xl:translate-x-0`}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2 rounded-xl text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
              <span className="font-black text-xl text-slate-900 tracking-tighter">StandardForce</span>
            </div>
            {/* Save Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
              <span className="text-[8px] font-black uppercase text-slate-400">{isSaving ? 'Saving' : 'Synced'}</span>
            </div>
          </div>
          <button onClick={createNewProgram} className="w-full bg-blue-600 text-white px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg">+ 新增運動員 (New Athlete)</button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Athlete Roster</div>
          {programs.map(p => (
            <div key={p.id} onClick={() => { setActiveProgramId(p.id); setLeftDrawerOpen(false); }} className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${activeProgramId === p.id ? 'bg-slate-50 border-blue-200 text-slate-900 shadow-sm' : 'hover:bg-slate-50 text-slate-500 border-transparent'}`}>
              <div className="min-w-0 pr-2">
                <div className="font-black truncate text-sm">{p.athleteName || 'Untitled Athlete'}</div>
                <div className="text-[9px] uppercase font-black text-slate-400 tracking-tight">{p.cycles.length} Cycles</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteProgram(p.id, p.athleteName); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
          ))}
        </nav>

        {/* Data Management Section */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
           <div className="mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Management</div>
           <div className="grid grid-cols-2 gap-2">
              <button onClick={exportData} className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter hover:bg-slate-100 transition-all">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter hover:bg-slate-100 transition-all">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Import
              </button>
              <input type="file" ref={fileInputRef} onChange={importData} accept=".json" className="hidden" />
           </div>
           <button onClick={resetAllData} className="w-full mt-2 py-2 text-[8px] font-black uppercase text-red-400 hover:text-red-600 transition-all opacity-50 hover:opacity-100">Reset System</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeProgram ? (
          <>
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setLeftDrawerOpen(true)} className="p-2 xl:hidden bg-slate-100 rounded-xl text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                <div className="flex flex-col">
                  <input type="text" value={activeProgram.athleteName} onChange={(e) => updateActiveProgram({ athleteName: e.target.value })} className="text-xl md:text-2xl font-black text-slate-900 bg-transparent border-none focus:ring-0 p-0 leading-tight tracking-tighter" />
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Master Athlete Profile</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setRightDrawerOpen(true)} className="p-3 xl:hidden bg-slate-900 text-white rounded-xl shadow-lg no-print"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></button>
                <button onClick={() => window.print()} className="hidden lg:block bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest no-print">Export Report</button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth pb-32">
              <div className="max-w-7xl mx-auto space-y-12">
                {activeProgram.cycles.map((cycle) => {
                  const isCycleCollapsed = collapsedCycles.has(cycle.id);
                  const isStatsCollapsed = collapsedStats.has(cycle.id);
                  return (
                    <div key={cycle.id} className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm transition-all print:border-slate-100">
                      <div onClick={() => toggleCycleCollapse(cycle.id)} className={`p-6 md:p-8 flex items-center justify-between cursor-pointer border-b border-slate-100 transition-colors ${isCycleCollapsed ? 'bg-slate-50/50' : 'bg-slate-900 text-white print:bg-slate-50 print:text-slate-900'}`}>
                        <div className="flex items-center gap-6">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black no-print ${isCycleCollapsed ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white'}`}><svg className={`w-5 h-5 transition-transform ${isCycleCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg></div>
                          <input type="text" value={cycle.name} onClick={(e) => e.stopPropagation()} onChange={(e) => updateActiveProgram({ cycles: activeProgram.cycles.map(c => c.id === cycle.id ? { ...c, name: e.target.value } : c) })} className="text-xl md:text-2xl font-black bg-transparent focus:outline-none tracking-tight" />
                        </div>
                        <div className="flex items-center gap-3 no-print">
                          {!isCycleCollapsed && <button onClick={(e) => { e.stopPropagation(); addWeek(cycle.id); }} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">+ADD WEEK</button>}
                        </div>
                      </div>

                      {!isCycleCollapsed && (
                        <div className="p-6 md:p-8 space-y-10">
                          <div className="bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden">
                            <div onClick={() => toggleStatsCollapse(cycle.id)} className="px-6 py-4 flex items-center justify-between cursor-pointer bg-slate-100/50 hover:bg-slate-100 transition-colors no-print">
                              <div className="flex items-center gap-3"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg><span className="text-xs font-black uppercase tracking-widest text-slate-600">Performance Baseline (1RM & MAS)</span></div>
                              <svg className={`w-4 h-4 text-slate-400 transition-transform ${isStatsCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <div className={`p-6 grid grid-cols-2 md:grid-cols-7 gap-4 ${(isStatsCollapsed && !window.matchMedia('print').matches) ? 'hidden' : 'grid'}`}>
                                {[{ label: 'Squat', key: 'squat1rm' }, { label: 'Hinge', key: 'deadlift1rm' }, { label: 'Push', key: 'push1rm' }, { label: 'Pull', key: 'pull1rm' }, { label: 'Press', key: 'press1rm' }, { label: 'MAS', key: 'mas' }, { label: 'MSS', key: 'mss' }].map((stat) => (
                                  <div key={stat.key} className="flex flex-col gap-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{stat.label}</label><input type="number" value={cycle.stats[stat.key as keyof AthleteStats] || 0} onChange={(e) => updateCycleStats(cycle.id, { [stat.key]: parseFloat(e.target.value) || 0 })} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
                                ))}
                            </div>
                          </div>

                          {cycle.weeks.map((week) => {
                            const isWeekCollapsed = collapsedWeeks.has(week.id);
                            return (
                              <div key={week.id} className="space-y-6">
                                <div onClick={() => toggleWeekCollapse(week.id)} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between cursor-pointer group hover:bg-slate-100 transition-all border border-slate-100 print:bg-slate-100">
                                  <div className="flex items-center gap-4"><div className="bg-slate-900 text-white w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs">W{week.weekNumber}</div><input type="text" value={week.title} onClick={(e) => e.stopPropagation()} onChange={(e) => updateActiveProgram({ cycles: activeProgram.cycles.map(c => c.id === cycle.id ? { ...c, weeks: c.weeks.map(w => w.id === week.id ? { ...w, title: e.target.value } : w) } : c) })} className="bg-transparent text-lg font-black text-slate-800 focus:outline-none" /></div>
                                  <svg className={`w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-transform no-print ${isWeekCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                                {!isWeekCollapsed && (
                                  <div className="space-y-8 pl-4 md:pl-8 border-l-2 border-slate-100">
                                    {week.days.map((day) => {
                                      const isDayCollapsed = collapsedDays.has(day.id);
                                      return (
                                        <div key={day.id} onClick={() => setActiveDayId(day.id)} className={`bg-white rounded-[2rem] border transition-all ${activeDayId === day.id ? 'ring-4 ring-blue-500/10 border-blue-300' : 'border-slate-200'}`}>
                                          <div onClick={(e) => { e.stopPropagation(); toggleDayCollapse(day.id); }} className="p-5 flex items-center justify-between cursor-pointer"><div className="flex items-center gap-3"><svg className={`w-4 h-4 text-slate-300 transition-transform no-print ${isDayCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg><input type="text" value={day.title} onClick={(e) => e.stopPropagation()} onChange={(e) => updateDayData(cycle.id, week.id, day.id, { title: e.target.value })} className="font-black text-slate-800 bg-transparent text-lg focus:outline-none" /></div></div>
                                          {!isDayCollapsed && (
                                            <div className="px-6 md:px-8 pb-8 space-y-8">
                                              <div className="pt-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Warm-up / Activation</label><textarea value={day.warmup || ''} onChange={(e) => updateDayData(cycle.id, week.id, day.id, { warmup: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none" placeholder="Daily activation routine..." rows={2} /></div>
                                              <section><div className="flex items-center justify-between mb-4"><h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Strength Exercises</h3><button onClick={() => addStrengthExercise(cycle.id, week.id, day.id)} className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline no-print">+ Add Exercise</button></div><div className="space-y-3">{day.strengthExercises.map(ex => <ExerciseRow key={ex.id} exercise={ex} athleteStats={cycle.stats} onUpdate={(u) => { const updatedExs = day.strengthExercises.map(e => e.id === ex.id ? { ...e, ...u } : e); updateDayData(cycle.id, week.id, day.id, { strengthExercises: updatedExs }); }} onDelete={() => { updateDayData(cycle.id, week.id, day.id, { strengthExercises: day.strengthExercises.filter(e => e.id !== ex.id) }); }} />)}</div></section>
                                              <section><div className="flex items-center justify-between mb-4"><h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Conditioning Drills</h3><button onClick={() => addConditioningExercise(cycle.id, week.id, day.id)} className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline no-print">+ Add Drill</button></div><div className="space-y-4">{day.conditioningExercises.map(ex => <ConditioningRow key={ex.id} exercise={ex} athleteStats={cycle.stats} onUpdate={(u) => { const updatedExs = day.conditioningExercises.map(e => e.id === ex.id ? { ...e, ...u } : e); updateDayData(cycle.id, week.id, day.id, { conditioningExercises: updatedExs }); }} onDelete={() => { updateDayData(cycle.id, week.id, day.id, { conditioningExercises: day.conditioningExercises.filter(e => e.id !== ex.id) }); }} />)}</div></section>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                    <button onClick={() => addDay(cycle.id, week.id)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-200 hover:text-blue-400 transition-all no-print">+ 新增訓練日 (Add Day)</button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <button onClick={() => addWeek(cycle.id)} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl no-print">+ADD WEEK</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button onClick={addCycle} className="w-full py-10 border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center gap-3 hover:border-blue-400 group transition-all no-print"><div className="bg-slate-100 p-4 rounded-full group-hover:bg-blue-50 transition-colors"><svg className="w-8 h-8 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></div><span className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-600">Start New Training Cycle</span></button>
              </div>
            </main>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            <div className="bg-blue-50 p-10 rounded-[3rem] text-center border-4 border-dashed border-blue-100">
               <svg className="w-16 h-16 text-blue-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
               <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">No Athletes Selected</h2>
               <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8 font-medium">Please select an existing athlete or create a new profile to begin programming.</p>
               <button onClick={createNewProgram} className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Setup Athlete Profile</button>
            </div>
          </div>
        )}
      </div>

      <aside className={`fixed inset-y-0 right-0 z-50 w-[320px] md:w-[400px] bg-white border-l border-slate-200 p-6 md:p-8 overflow-y-auto shrink-0 transition-transform duration-300 ease-in-out transform ${isRightDrawerOpen ? 'translate-x-0' : 'translate-x-full'} xl:relative xl:translate-x-0 no-print`}>
        {activeProgram && (
          <div className="space-y-12">
            <ProgramStats program={activeProgram} />
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="flex flex-col gap-1 mb-6"><h3 className="font-black text-xl flex items-center gap-3"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>Fatigue Monitoring</h3>{activeDay && <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-5">Logged: C{activeDay.cycleNumber}W{activeDay.weekNumber}D{activeDay.dayNumber}</span>}</div>
              {activeDay ? (
                <div className="space-y-6 relative z-10">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10"><div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Soreness / Readiness</span><span className="text-xl font-black">{activeDay.day.fatigueIntensity || 5}</span></div><input type="range" min="1" max="10" step="1" value={activeDay.day.fatigueIntensity || 5} onChange={(e) => updateDayData(activeDay.cycleId, activeDay.weekId, activeDay.day.id, { fatigueIntensity: parseInt(e.target.value) })} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" /></div>
                  <div className="space-y-2">{FATIGUE_ITEMS.map((item) => (
                      <div key={item.key} onClick={() => { const current = activeDay.day.fatigueChecks || {}; updateDayData(activeDay.cycleId, activeDay.weekId, activeDay.day.id, { fatigueChecks: { ...current, [item.key]: !current[item.key] } }); }} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all active:scale-95 ${activeDay.day.fatigueChecks?.[item.key] ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}><div className="flex items-center gap-3"><span className="text-lg">{item.icon}</span><span className="text-xs font-black uppercase tracking-widest">{item.label}</span></div>{activeDay.day.fatigueChecks?.[item.key] && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}</div>
                    ))}</div>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">Session Notes</label><textarea value={activeDay.day.fatigueNotes || ''} onChange={(e) => updateDayData(activeDay.cycleId, activeDay.weekId, activeDay.day.id, { fatigueNotes: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none" placeholder="Recovery notes..." rows={4} /></div>
                </div>
              ) : (
                <div className="text-center py-10 opacity-50"><p className="text-xs font-black uppercase">Select session to monitor</p></div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default App;
