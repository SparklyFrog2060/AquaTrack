import React, { useState } from 'react';
import {
  Waves,
  Clock,
  Gauge,
  Flame,
  Heart,
  Edit3,
  Trash2,
  Watch,
  Search,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { type SwimSession } from '../types';
import { formatDuration, formatPace } from '../utils/swimCalculations';

interface SessionListProps {
  sessions: SwimSession[];
  onEdit: (session: SwimSession) => void;
  onDelete: (session: SwimSession) => void;
  onAddNew: () => void;
}

const STROKE_LABELS: Record<string, { label: string; emoji: string }> = {
  kraul: { label: 'Kraul', emoji: '🏊‍♂️' },
  klasyczny: { label: 'Żabka', emoji: '🐸' },
  grzbiet: { label: 'Grzbiet', emoji: '🌊' },
  motylek: { label: 'Motylek', emoji: '🦋' },
  zmienny: { label: 'Zmienny', emoji: '⚡' },
  mieszany: { label: 'Mieszany', emoji: '🎯' },
};

type SortField = 'date-desc' | 'date-asc' | 'distance-desc' | 'pace-asc';

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStroke, setSelectedStroke] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortField>('date-desc');

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPool = s.poolName?.toLowerCase().includes(q);
      const matchNotes = s.notes?.toLowerCase().includes(q);
      const matchDate = s.date?.includes(q);
      if (!matchPool && !matchNotes && !matchDate) return false;
    }

    // Stroke filter
    if (selectedStroke !== 'all' && s.stroke !== selectedStroke) {
      return false;
    }

    return true;
  });

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortOption) {
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'distance-desc':
        return (b.distance || 0) - (a.distance || 0);
      case 'pace-asc':
        return (a.paceSecondsPer100m || 0) - (b.paceSecondsPer100m || 0);
      default:
        return 0;
    }
  });

  const formatDayName = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr}T12:00:00`);
      return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      {/* Header and Search/Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Historia treningów
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {sessions.length}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Zapisane sesje basenowe z danymi z Apple Watch i czasem
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <input
              type="text"
              placeholder="Szukaj po obiekcie, notatce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortField)}
              className="pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer"
            >
              <option value="date-desc">Od najnowszych</option>
              <option value="date-asc">Od najstarszych</option>
              <option value="distance-desc">Najdłuższy dystans</option>
              <option value="pace-asc">Najszybsze tempo</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Stroke Filter Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar">
        <button
          onClick={() => setSelectedStroke('all')}
          type="button"
          className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            selectedStroke === 'all'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Wszystkie style ({sessions.length})
        </button>
        {Object.entries(STROKE_LABELS).map(([key, st]) => {
          const count = sessions.filter((s) => s.stroke === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedStroke(key)}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                selectedStroke === key
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{st.emoji}</span>
              <span>{st.label}</span>
              {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Session Cards Grid / List */}
      {sortedSessions.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-3">
            <Waves className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Brak pasujących treningów
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedStroke !== 'all'
              ? 'Zmień kryteria wyszukiwania lub filtry stylu.'
              : 'Nie dodałeś jeszcze żadnego treningu. Wklep dane z Apple Watch już teraz!'}
          </p>
          <button
            onClick={onAddNew}
            type="button"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-sm transition-all"
          >
            + Dodaj pierwszy trening
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {sortedSessions.map((session) => {
            const strokeInfo = STROKE_LABELS[session.stroke || 'kraul'] || {
              label: session.stroke || 'Kraul',
              emoji: '🏊‍♂️',
            };

            return (
              <div
                key={session.id || `${session.date}_${session.distance}`}
                className="py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 sm:px-3 rounded-2xl transition-colors group"
              >
                {/* Left side: Date, stroke, distance */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-500 text-white flex flex-col items-center justify-center shrink-0 shadow-sm shadow-cyan-600/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                      {new Date(`${session.date}T12:00:00`).toLocaleDateString('pl-PL', {
                        month: 'short',
                      })}
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold leading-none">
                      {new Date(`${session.date}T12:00:00`).getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">
                        {formatDayName(session.date)}
                      </span>
                      {/* Stroke badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <span>{strokeInfo.emoji}</span>
                        <span>{strokeInfo.label}</span>
                      </span>

                      {/* Apple Watch pill */}
                      {session.source === 'apple_watch' && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60"
                          title="Zarejestrowano w Apple Watch"
                        >
                          <Watch className="w-3 h-3" />
                          <span>Apple Watch</span>
                        </span>
                      )}
                    </div>

                    {/* Distance & laps */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                        {session.distance.toLocaleString('pl-PL')} m
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        ({session.laps} długości · basen {session.poolLength}m)
                      </span>
                    </div>

                    {/* Facility and notes */}
                    {(session.poolName || session.notes) && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 pt-0.5">
                        {session.poolName && (
                          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            {session.poolName}
                          </span>
                        )}
                        {session.notes && (
                          <span className="italic text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            „{session.notes}”
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Key stats chips & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-5 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Time */}
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Czas
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatDuration(session.durationSeconds)}
                      </span>
                    </div>

                    {/* Pace */}
                    <div className="text-right bg-cyan-50/60 dark:bg-cyan-950/40 px-3 py-1.5 rounded-xl border border-cyan-100 dark:border-cyan-900/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 block">
                        Śr. tempo
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-cyan-700 dark:text-cyan-300 font-mono">
                        {formatPace(session.paceSecondsPer100m)}
                        <span className="text-[10px] font-medium opacity-80">/100m</span>
                      </span>
                    </div>

                    {/* Calories & HR */}
                    {(session.calories || session.avgHeartRate) && (
                      <div className="hidden sm:block text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Tętno / Kcal
                        </span>
                        <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {session.avgHeartRate && (
                            <span className="inline-flex items-center gap-0.5 text-rose-500">
                              <Heart className="w-3 h-3 fill-rose-500/20" />
                              {session.avgHeartRate}
                            </span>
                          )}
                          {session.calories && (
                            <span className="inline-flex items-center gap-0.5 text-amber-500">
                              <Flame className="w-3 h-3 fill-amber-500/20" />
                              {session.calories}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(session)}
                      type="button"
                      className="p-2 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-xl transition-colors"
                      title="Edytuj trening"
                      aria-label="Edytuj trening"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(session)}
                      type="button"
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Usuń trening"
                      aria-label="Usuń trening"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
