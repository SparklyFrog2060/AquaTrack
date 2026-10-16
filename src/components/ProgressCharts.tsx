import React, { useState } from 'react';
import {
  TrendingUp,
  Activity,
  Award,
  Zap,
  Clock,
  Flame,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { type SwimSession } from '../types';
import { formatDuration, formatPace } from '../utils/swimCalculations';

interface ProgressChartsProps {
  sessions: SwimSession[];
}

type ChartMetric = 'pace' | 'distance' | 'duration' | 'calories';

export const ProgressCharts: React.FC<ProgressChartsProps> = ({ sessions }) => {
  const [metric, setMetric] = useState<ChartMetric>('pace');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sort sessions chronologically (oldest to newest) for charting
  const sortedSessions = [...sessions]
    .filter((s) => s.date && s.distance > 0 && s.durationSeconds > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedSessions.length === 0) {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
          <LineChartIcon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Wykresy postępów
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Dodaj swój pierwszy trening pływacki z Apple Watch lub ręcznie, aby zobaczyć wykres tempa, dystansu i postępów!
        </p>
      </section>
    );
  }

  // Extract values based on active metric
  const getVal = (s: SwimSession): number => {
    switch (metric) {
      case 'pace':
        return s.paceSecondsPer100m || 0;
      case 'distance':
        return s.distance || 0;
      case 'duration':
        return Math.round((s.durationSeconds || 0) / 60); // minutes
      case 'calories':
        return s.calories || 0;
    }
  };

  const values = sortedSessions.map(getVal);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const avgVal = Math.round(values.reduce((a, b) => a + b, 0) / (values.length || 1));

  // For pace: lowest is best!
  const bestPace = Math.min(...sortedSessions.map((s) => s.paceSecondsPer100m));
  const maxDistance = Math.max(...sortedSessions.map((s) => s.distance));

  // Chart Dimensions
  const svgWidth = 720;
  const svgHeight = 260;
  const paddingX = 40;
  const paddingTop = 30;
  const paddingBottom = 40;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingTop - paddingBottom;

  // Coordinate mapping
  const valRange = maxVal === minVal ? 1 : maxVal - minVal;

  const getX = (index: number) => {
    if (sortedSessions.length === 1) return svgWidth / 2;
    return paddingX + (index / (sortedSessions.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    if (maxVal === minVal) return paddingTop + innerHeight / 2;
    // For pace: invert so lower (faster) pace is higher up visually!
    if (metric === 'pace') {
      const normalized = (maxVal - val) / valRange; // best pace is at top
      return paddingTop + innerHeight - normalized * innerHeight;
    }
    const normalized = (val - minVal) / valRange;
    return paddingTop + innerHeight - normalized * innerHeight;
  };

  const points = sortedSessions.map((s, i) => ({
    x: getX(i),
    y: getY(getVal(s)),
    session: s,
    val: getVal(s),
  }));

  // Path generator
  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Area under curve
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${
          paddingTop + innerHeight
        } Z`
      : '';

  const formatMetricVal = (v: number) => {
    switch (metric) {
      case 'pace':
        return `${formatPace(v)}/100m`;
      case 'distance':
        return `${v} m`;
      case 'duration':
        return `${v} min`;
      case 'calories':
        return `${v} kcal`;
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Wizualizacja postępów
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {metric === 'pace' &&
              'Ewolucja tempa pływania (/100m) — niższy czas oznacza szybsze pływanie'}
            {metric === 'distance' && 'Dystans przepłynięty w kolejnych sesjach'}
            {metric === 'duration' && 'Aktywny czas spędzony w wodzie'}
            {metric === 'calories' && 'Aktywne kalorie zarejestrowane przez zegarek'}
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => {
              setMetric('pace');
              setHoveredIndex(null);
            }}
            type="button"
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              metric === 'pace'
                ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tempo (/100m)
          </button>
          <button
            onClick={() => {
              setMetric('distance');
              setHoveredIndex(null);
            }}
            type="button"
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              metric === 'distance'
                ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Dystans (m)
          </button>
          <button
            onClick={() => {
              setMetric('duration');
              setHoveredIndex(null);
            }}
            type="button"
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              metric === 'duration'
                ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Czas (min)
          </button>
          <button
            onClick={() => {
              setMetric('calories');
              setHoveredIndex(null);
            }}
            type="button"
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              metric === 'calories'
                ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Kalorie
          </button>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 my-4">
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {metric === 'pace' ? 'Rekord tempa (PB)' : 'Maksymalnie'}
          </span>
          <span className="text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-400">
            {metric === 'pace'
              ? `${formatPace(bestPace)}/100m`
              : formatMetricVal(maxVal)}
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Średnia z sesji
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
            {formatMetricVal(avgVal)}
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Liczba treningów
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
            {sortedSessions.length} sesji
          </span>
        </div>
      </div>

      {/* Chart Canvas (SVG) */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[300px] overflow-visible"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + ratio * innerHeight;
            return (
              <line
                key={ratio}
                x1={paddingX}
                y1={y}
                x2={svgWidth - paddingX}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

          {/* Main Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {points.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            const isBest =
              metric === 'pace'
                ? pt.val === bestPace
                : metric === 'distance'
                ? pt.val === maxDistance
                : false;

            return (
              <g
                key={i}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(i)}
              >
                {/* Hover vertical line */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={paddingTop + innerHeight}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Outer ring */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 8 : isBest ? 6 : 4}
                  className={`transition-all duration-150 ${
                    isBest
                      ? 'fill-amber-400 stroke-white dark:stroke-slate-900 stroke-2'
                      : isHovered
                      ? 'fill-cyan-500 stroke-white dark:stroke-slate-900 stroke-2'
                      : 'fill-sky-500'
                  }`}
                />

                {/* Date labels on X-axis (every few points) */}
                {(i === 0 ||
                  i === points.length - 1 ||
                  (points.length > 5 && i % Math.ceil(points.length / 5) === 0)) && (
                  <text
                    x={pt.x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 dark:fill-slate-500 font-medium"
                  >
                    {pt.session.date ? pt.session.date.slice(5) : ''}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip / Detail Card */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-4 z-10 bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md pointer-events-none min-w-[210px]"
          >
            <div className="flex items-center justify-between text-xs text-slate-300 pb-1.5 border-b border-slate-800">
              <span className="font-semibold text-cyan-400">
                {points[hoveredIndex].session.date}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {points[hoveredIndex].session.stroke || 'Kraul'}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Dystans:</span>
                <span className="font-bold text-white">
                  {points[hoveredIndex].session.distance} m ({points[hoveredIndex].session.laps} basenów)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Czas:</span>
                <span className="font-bold text-white">
                  {formatDuration(points[hoveredIndex].session.durationSeconds)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tempo:</span>
                <span className="font-bold text-cyan-400">
                  {formatPace(points[hoveredIndex].session.paceSecondsPer100m)} /100m
                </span>
              </div>
              {points[hoveredIndex].session.calories && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Kalorie:</span>
                  <span className="font-medium text-amber-300">
                    {points[hoveredIndex].session.calories} kcal
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
