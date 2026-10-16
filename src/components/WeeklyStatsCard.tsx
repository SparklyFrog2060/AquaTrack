import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Flame,
  Award,
  Calendar,
  Activity,
} from 'lucide-react';
import { type WeeklyStats, formatDuration, formatPace } from '../utils/swimCalculations';

interface WeeklyStatsCardProps {
  stats: WeeklyStats;
  currentWeekOffset: number; // 0 = current week, -1 = last week, etc.
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

export const WeeklyStatsCard: React.FC<WeeklyStatsCardProps> = ({
  stats,
  currentWeekOffset,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
}) => {
  // Format readable Polish date range
  const formatDateRange = (startStr: string, endStr: string) => {
    try {
      const s = new Date(`${startStr}T12:00:00`);
      const e = new Date(`${endStr}T12:00:00`);
      const sDay = s.getDate();
      const sMonth = s.toLocaleDateString('pl-PL', { month: 'short' });
      const eDay = e.getDate();
      const eMonth = e.toLocaleDateString('pl-PL', { month: 'short' });
      const year = e.getFullYear();

      if (sMonth === eMonth) {
        return `${sDay} – ${eDay} ${sMonth} ${year}`;
      }
      return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${year}`;
    } catch {
      return `${startStr} – ${endStr}`;
    }
  };

  const maxDailyDist = Math.max(...stats.dailyBreakdown.map((d) => d.distance), 1500);

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      {/* Header and Week Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Podsumowanie tygodniowe
            </h2>
            {currentWeekOffset === 0 && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full">
                Bieżący tydzień
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {formatDateRange(stats.weekStart, stats.weekEnd)}
          </p>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={onPrevWeek}
            type="button"
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Poprzedni tydzień"
            aria-label="Poprzedni tydzień"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {currentWeekOffset !== 0 ? (
            <button
              onClick={onCurrentWeek}
              type="button"
              className="px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-700 shadow-xs rounded-lg transition-colors"
            >
              Wróć do dziś
            </button>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Ten tydzień
            </span>
          )}
          <button
            onClick={onNextWeek}
            type="button"
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Następny tydzień"
            aria-label="Następny tydzień"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
        {/* Metric 1: Distance */}
        <div className="bg-gradient-to-br from-cyan-50/60 to-sky-50/30 dark:from-cyan-950/20 dark:to-sky-950/10 border border-cyan-100 dark:border-cyan-900/50 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
              Dystans
            </span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats.totalDistance.toLocaleString('pl-PL')}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                m
              </span>
            </div>
            {/* Compare to prev week */}
            <div className="mt-1.5 flex items-center gap-1 text-xs font-medium">
              {stats.distanceChangePercent !== null ? (
                stats.distanceChangePercent >= 0 ? (
                  <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{stats.distanceChangePercent}%
                  </span>
                ) : (
                  <span className="inline-flex items-center text-rose-500 font-semibold gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {stats.distanceChangePercent}%
                  </span>
                )
              ) : (
                <span className="text-slate-400">Brak danych w ub. tyg.</span>
              )}
              <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate">
                vs ub. tydz. ({stats.prevWeekDistance.toLocaleString('pl-PL')}m)
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Duration & Average Pace */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Czas i tempo
            </span>
            <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formatDuration(stats.totalDurationSeconds)}
              </span>
            </div>
            <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                {stats.avgPaceSecondsPer100m > 0
                  ? `${formatPace(stats.avgPaceSecondsPer100m)}/100m`
                  : '—'}
              </span>
              <span className="text-slate-400 text-[11px]">śr. tempo</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Session Count */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Treningi
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats.sessionCount}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                sesji
              </span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              {stats.sessionCount > 0
                ? `Średnio ${Math.round(stats.totalDistance / stats.sessionCount)} m / trening`
                : 'Brak treningów w tym tygodniu'}
            </div>
          </div>
        </div>

        {/* Metric 4: Apple Watch Calories */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Aktywne kalorie
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats.totalCalories > 0 ? stats.totalCalories.toLocaleString('pl-PL') : '—'}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                kcal
              </span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>Zsynchronizowane z Apple Watch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day by Day Mini Chart / Breakdown */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
          Rozkład tygodniowy (Poniedziałek – Niedziela)
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {stats.dailyBreakdown.map((day) => {
            const heightPercent =
              day.distance > 0 ? Math.max(15, Math.round((day.distance / maxDailyDist) * 100)) : 0;
            const isToday = day.date === new Date().toISOString().split('T')[0];

            return (
              <div
                key={day.date}
                className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                  day.distance > 0
                    ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200/60 dark:border-cyan-800/60 shadow-xs'
                    : isToday
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-cyan-400/50 dark:border-cyan-500/50'
                    : 'bg-transparent border-transparent'
                }`}
              >
                <span
                  className={`text-[11px] font-bold ${
                    isToday
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {day.dayName}
                </span>

                {/* Bar representation */}
                <div className="w-full h-14 flex items-end justify-center my-1.5">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[20px] rounded-t-md transition-all duration-300 ${
                      day.distance > 0
                        ? 'bg-gradient-to-t from-cyan-600 to-sky-400 dark:from-cyan-500 dark:to-sky-300'
                        : 'bg-slate-200/70 dark:bg-slate-800 h-1'
                    }`}
                  />
                </div>

                <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100">
                  {day.distance > 0 ? `${day.distance}m` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
