import React, { useState, useEffect } from 'react';
import {
  X,
  Watch,
  Waves,
  Clock,
  Gauge,
  Calendar,
  Flame,
  Heart,
  MapPin,
  FileText,
  Sparkles,
  Info,
} from 'lucide-react';
import { type SwimSession } from '../types';
import {
  calculateDistance,
  formatPace,
  formatDuration,
  parseTimeString,
  parsePaceString,
  calculatePaceSeconds,
  toISODateString,
} from '../utils/swimCalculations';

interface SessionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: SwimSession) => Promise<void>;
  editingSession?: SwimSession | null;
  defaultPoolLength?: number;
}

const STROKES = [
  { id: 'kraul', label: 'Kraul (dowolny)', emoji: '🏊‍♂️' },
  { id: 'klasyczny', label: 'Żabka (klasyczny)', emoji: '🐸' },
  { id: 'grzbiet', label: 'Styl grzbietowy', emoji: '🌊' },
  { id: 'motylek', label: 'Motylek (delfin)', emoji: '🦋' },
  { id: 'zmienny', label: 'Styl zmienny', emoji: '⚡' },
  { id: 'mieszany', label: 'Trening mieszany', emoji: '🎯' },
];

export const SessionFormModal: React.FC<SessionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSession,
  defaultPoolLength = 25,
}) => {
  const [date, setDate] = useState<string>(toISODateString(new Date()));
  const [poolLength, setPoolLength] = useState<number>(defaultPoolLength);
  const [customPoolLength, setCustomPoolLength] = useState<string>('');
  const [isCustomPool, setIsCustomPool] = useState<boolean>(false);

  const [laps, setLaps] = useState<string>('40'); // default 40 laps = 1000m
  const [timeInput, setTimeInput] = useState<string>('24:30'); // MM:SS or HH:MM:SS
  const [paceInput, setPaceInput] = useState<string>(''); // if left empty, auto-calculated
  const [manualPaceOverride, setManualPaceOverride] = useState<boolean>(false);

  const [stroke, setStroke] = useState<string>('kraul');
  const [calories, setCalories] = useState<string>('320');
  const [avgHeartRate, setAvgHeartRate] = useState<string>('138');
  const [maxHeartRate, setMaxHeartRate] = useState<string>('162');
  const [poolName, setPoolName] = useState<string>('Basen 25m');
  const [notes, setNotes] = useState<string>('');
  const [isAppleWatch, setIsAppleWatch] = useState<boolean>(true);

  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (editingSession) {
      setDate(editingSession.date || toISODateString(new Date()));
      if (editingSession.poolLength === 25 || editingSession.poolLength === 50) {
        setPoolLength(editingSession.poolLength);
        setIsCustomPool(false);
      } else {
        setPoolLength(editingSession.poolLength);
        setIsCustomPool(true);
        setCustomPoolLength(editingSession.poolLength.toString());
      }
      setLaps(editingSession.laps?.toString() || '40');
      setTimeInput(formatDuration(editingSession.durationSeconds || 0));
      setPaceInput(formatPace(editingSession.paceSecondsPer100m || 0));
      setManualPaceOverride(true);
      setStroke(editingSession.stroke || 'kraul');
      setCalories(editingSession.calories?.toString() || '');
      setAvgHeartRate(editingSession.avgHeartRate?.toString() || '');
      setMaxHeartRate(editingSession.maxHeartRate?.toString() || '');
      setPoolName(editingSession.poolName || '');
      setNotes(editingSession.notes || '');
      setIsAppleWatch(editingSession.source === 'apple_watch');
    } else {
      // defaults
      setDate(toISODateString(new Date()));
      setPoolLength(defaultPoolLength);
      setIsCustomPool(false);
      setLaps('40');
      setTimeInput('24:30');
      setPaceInput('');
      setManualPaceOverride(false);
      setStroke('kraul');
      setCalories('320');
      setAvgHeartRate('138');
      setMaxHeartRate('162');
      setPoolName('');
      setNotes('');
      setIsAppleWatch(true);
    }
    setErrorMessage(null);
  }, [editingSession, defaultPoolLength, isOpen]);

  if (!isOpen) return null;

  // Active pool length
  const activePoolLength = isCustomPool
    ? parseFloat(customPoolLength) || defaultPoolLength
    : poolLength;
  const numLaps = parseInt(laps, 10) || 0;
  const calculatedDistance = calculateDistance(numLaps, activePoolLength);

  const parsedDurationSeconds = parseTimeString(timeInput);

  // Calculated pace from time and distance
  const calculatedPaceSec = calculatePaceSeconds(calculatedDistance, parsedDurationSeconds);
  const displayPace = manualPaceOverride && paceInput
    ? paceInput
    : calculatedPaceSec > 0
    ? `${formatPace(calculatedPaceSec)}/100m`
    : '0:00/100m';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!date) {
      setErrorMessage('Wybierz datę treningu.');
      return;
    }

    if (numLaps <= 0) {
      setErrorMessage('Podaj poprawną liczbę przepłyniętych długości basenu (min. 1).');
      return;
    }

    if (parsedDurationSeconds <= 0) {
      setErrorMessage('Wpisz poprawny czas trwania treningu (np. 32:15).');
      return;
    }

    // Determine pace seconds
    let finalPaceSec = calculatedPaceSec;
    if (manualPaceOverride && paceInput) {
      const parsedP = parsePaceString(paceInput);
      if (parsedP > 0) finalPaceSec = parsedP;
    }

    if (finalPaceSec <= 0) {
      setErrorMessage('Nieprawidłowe tempo. Sprawdź czas i dystans.');
      return;
    }

    const sessionData: SwimSession = {
      ...(editingSession?.id ? { id: editingSession.id } : {}),
      userId: editingSession?.userId || '',
      date,
      poolLength: activePoolLength,
      laps: numLaps,
      distance: calculatedDistance,
      durationSeconds: parsedDurationSeconds,
      paceSecondsPer100m: finalPaceSec,
      stroke,
      avgHeartRate: avgHeartRate ? parseInt(avgHeartRate, 10) : undefined,
      maxHeartRate: maxHeartRate ? parseInt(maxHeartRate, 10) : undefined,
      calories: calories ? parseInt(calories, 10) : undefined,
      poolName: poolName.trim() || undefined,
      notes: notes.trim() || undefined,
      source: isAppleWatch ? 'apple_watch' : 'manual',
    };

    try {
      setSaving(true);
      await onSave(sessionData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Wystąpił błąd podczas zapisywania treningu w Firebase.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-cyan-50/50 via-white to-sky-50/30 dark:from-cyan-950/20 dark:via-slate-900 dark:to-sky-950/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="session-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              >
                {editingSession ? 'Edytuj trening pływacki' : 'Nowy trening pływacki'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wklep dane z aplikacji Trening w Apple Watch lub wpisz ręcznie
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Zamknij formularz"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Apple Watch preset indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/70 dark:border-cyan-900/60 text-xs text-cyan-900 dark:text-cyan-200">
            <div className="flex items-center gap-2">
              <Watch className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="font-semibold">Rejestracja z Apple Watch</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[11px]">
              <input
                type="checkbox"
                checked={isAppleWatch}
                onChange={(e) => setIsAppleWatch(e.target.checked)}
                className="rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500"
              />
              Oznacz jako Apple Watch
            </label>
          </div>

          {/* Row 1: Date & Pool Length */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="session-date"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                Data treningu *
              </label>
              <div className="relative">
                <input
                  id="session-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Długość basenu *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomPool(false);
                    setPoolLength(25);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    !isCustomPool && poolLength === 25
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  25 m
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomPool(false);
                    setPoolLength(50);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    !isCustomPool && poolLength === 50
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  50 m
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomPool(true)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                    isCustomPool
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Inny
                </button>
              </div>
              {isCustomPool && (
                <input
                  type="number"
                  placeholder="np. 20, 33.3"
                  value={customPoolLength}
                  onChange={(e) => setCustomPoolLength(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              )}
            </div>
          </div>

          {/* Row 2: Laps & Distance calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            <div>
              <label
                htmlFor="session-laps"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                Liczba długości (basenów) *
              </label>
              <div className="relative">
                <input
                  id="session-laps"
                  type="number"
                  min="1"
                  max="1000"
                  value={laps}
                  onChange={(e) => setLaps(e.target.value)}
                  placeholder="np. 40"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                  długości
                </span>
              </div>
              {/* Lap quick adjusters */}
              <div className="flex gap-1.5 mt-2">
                {[20, 30, 40, 60, 80].map((quickLap) => (
                  <button
                    key={quickLap}
                    type="button"
                    onClick={() => setLaps(quickLap.toString())}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-600 dark:text-slate-300 hover:border-cyan-500"
                  >
                    {quickLap}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Distance Result */}
            <div className="flex flex-col justify-center bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Całkowity dystans
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight font-mono">
                  {calculatedDistance.toLocaleString('pl-PL')}
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  metrów
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                ({numLaps} × {activePoolLength}m = {(calculatedDistance / 1000).toFixed(2)} km)
              </span>
            </div>
          </div>

          {/* Row 3: Time & Pace (from Apple Watch) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="session-time"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Czas treningu (Apple Watch) *
                </label>
                <span className="text-[10px] text-slate-400">format MM:SS lub H:MM:SS</span>
              </div>
              <div className="relative">
                <input
                  id="session-time"
                  type="text"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  placeholder="np. 24:30 lub 1:02:15"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  required
                />
                <Clock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="session-pace"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Średnie tempo (/100m)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setManualPaceOverride(!manualPaceOverride);
                    if (!manualPaceOverride && calculatedPaceSec > 0) {
                      setPaceInput(formatPace(calculatedPaceSec));
                    }
                  }}
                  className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  {manualPaceOverride ? 'Wylicz automatycznie' : 'Wpisz z zegarka'}
                </button>
              </div>

              {manualPaceOverride ? (
                <div className="relative">
                  <input
                    id="session-pace"
                    type="text"
                    value={paceInput}
                    onChange={(e) => setPaceInput(e.target.value)}
                    placeholder="np. 1:52"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-cyan-400 dark:border-cyan-600 bg-cyan-50/20 dark:bg-cyan-950/20 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                    /100m
                  </span>
                </div>
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
                  <span className="text-base font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {displayPace}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    auto (czas / dystans)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Swimming Stroke */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Główny styl pływania
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STROKES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStroke(st.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                    stroke === st.id
                      ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-500 text-cyan-800 dark:text-cyan-300 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <span className="text-base">{st.emoji}</span>
                  <span className="truncate">{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 5: Apple Watch Vitals (Heart rate & Calories) */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label
                htmlFor="session-cals"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1"
              >
                Kalorie (kcal)
              </label>
              <div className="relative">
                <input
                  id="session-cals"
                  type="number"
                  min="0"
                  max="5000"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="350"
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                />
                <Flame className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-amber-500" />
              </div>
            </div>

            <div>
              <label
                htmlFor="session-avg-hr"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1"
              >
                Śr. tętno (bpm)
              </label>
              <div className="relative">
                <input
                  id="session-avg-hr"
                  type="number"
                  min="40"
                  max="220"
                  value={avgHeartRate}
                  onChange={(e) => setAvgHeartRate(e.target.value)}
                  placeholder="138"
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                />
                <Heart className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-rose-500" />
              </div>
            </div>

            <div>
              <label
                htmlFor="session-max-hr"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1"
              >
                Maks. tętno (bpm)
              </label>
              <div className="relative">
                <input
                  id="session-max-hr"
                  type="number"
                  min="40"
                  max="240"
                  value={maxHeartRate}
                  onChange={(e) => setMaxHeartRate(e.target.value)}
                  placeholder="165"
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                />
                <Heart className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-rose-600" />
              </div>
            </div>
          </div>

          {/* Row 6: Pool location & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="session-pool"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1"
              >
                Nazwa basenu / Obiekt
              </label>
              <div className="relative">
                <input
                  id="session-pool"
                  type="text"
                  maxLength={100}
                  value={poolName}
                  onChange={(e) => setPoolName(e.target.value)}
                  placeholder="np. Warszawianka, OSiR"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
                <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label
                htmlFor="session-notes"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1"
              >
                Notatki / Trening zadaniowy
              </label>
              <div className="relative">
                <input
                  id="session-notes"
                  type="text"
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="np. Interwały 10x100m, dobra forma"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
                <FileText className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              type="button"
              disabled={saving}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 rounded-xl shadow-md shadow-cyan-600/30 transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Zapisywanie w chmurze...</span>
                </>
              ) : (
                <span>{editingSession ? 'Zapisz zmiany' : 'Dodaj trening'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
