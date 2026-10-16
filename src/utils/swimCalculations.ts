export interface SwimSession {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  poolLength: number; // 25, 50, etc.
  laps: number;
  distance: number; // meters
  durationSeconds: number; // seconds
  paceSecondsPer100m: number; // seconds per 100m
  stroke?: string; // 'kraul' | 'grzbiet' | 'klasyczny' | 'motylek' | 'zmienny' | 'mieszany'
  avgHeartRate?: number; // bpm
  maxHeartRate?: number; // bpm
  calories?: number; // kcal
  poolName?: string;
  notes?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  totalDistance: number; // meters
  totalDurationSeconds: number;
  sessionCount: number;
  avgPaceSecondsPer100m: number;
  totalCalories: number;
  prevWeekDistance: number;
  distanceChangePercent: number | null; // e.g. +15% or -10%
  dailyBreakdown: {
    dayName: string; // 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'
    date: string;
    distance: number;
    durationSeconds: number;
    count: number;
  }[];
}

/**
 * Calculates total distance in meters given number of laps and pool length.
 */
export function calculateDistance(laps: number, poolLength: number): number {
  if (laps <= 0 || poolLength <= 0) return 0;
  return Math.round(laps * poolLength);
}

/**
 * Parses user input for time (e.g. "32:15", "0:45:10", "45", "1h 15m") into total seconds.
 */
export function parseTimeString(input: string): number {
  if (!input) return 0;
  const clean = input.trim().toLowerCase();

  // Handle format like "1h 20m 15s" or "45m"
  if (clean.includes('h') || clean.includes('m') || clean.includes('s')) {
    let totalSec = 0;
    const hMatch = clean.match(/(\d+)\s*h/);
    const mMatch = clean.match(/(\d+)\s*m/);
    const sMatch = clean.match(/(\d+)\s*s/);
    if (hMatch) totalSec += parseInt(hMatch[1], 10) * 3600;
    if (mMatch) totalSec += parseInt(mMatch[1], 10) * 60;
    if (sMatch) totalSec += parseInt(sMatch[1], 10);
    return totalSec;
  }

  // Handle colon format "HH:MM:SS" or "MM:SS"
  const parts = clean.split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return 0;

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // Just seconds or minutes? If input is <= 120 and user typed numbers, could be min or sec.
    // Standard input: numbers only = minutes if <= 180, or seconds if large?
    // Let's treat standard single number as minutes if <= 180, else seconds.
    return parts[0] * 60;
  }
  return 0;
}

/**
 * Formats seconds into "MM:SS" or "H:MM:SS".
 */
export function formatDuration(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return '0:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

/**
 * Calculates pace in seconds per 100m.
 */
export function calculatePaceSeconds(distanceMeters: number, durationSeconds: number): number {
  if (distanceMeters <= 0 || durationSeconds <= 0) return 0;
  return Math.round((durationSeconds / distanceMeters) * 100);
}

/**
 * Parses pace input (e.g. "1:48" or "1:48/100m" or "108") into seconds per 100m.
 */
export function parsePaceString(input: string): number {
  if (!input) return 0;
  const clean = input.replace('/100m', '').replace('/100', '').trim();
  const parts = clean.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  const single = parseInt(clean, 10);
  return isNaN(single) ? 0 : single;
}

/**
 * Formats pace seconds per 100m into "M:SS" string.
 */
export function formatPace(paceSeconds: number): string {
  if (!paceSeconds || isNaN(paceSeconds) || paceSeconds <= 0) return '0:00';
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Speed in km/h.
 */
export function calculateSpeedKmh(distanceMeters: number, durationSeconds: number): number {
  if (distanceMeters <= 0 || durationSeconds <= 0) return 0;
  const km = distanceMeters / 1000;
  const hours = durationSeconds / 3600;
  return Number((km / hours).toFixed(2));
}

/**
 * Get date string YYYY-MM-DD from a Date object.
 */
export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns Monday of the week containing the given date.
 */
export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Aggregates swimming sessions for weekly metrics.
 */
export function aggregateWeeklyStats(sessions: SwimSession[], referenceDate: Date = new Date()): WeeklyStats {
  const currentMonday = getMonday(referenceDate);
  const currentSunday = new Date(currentMonday);
  currentSunday.setDate(currentMonday.getDate() + 6);
  currentSunday.setHours(23, 59, 59, 999);

  const prevMonday = new Date(currentMonday);
  prevMonday.setDate(currentMonday.getDate() - 7);
  const prevSunday = new Date(currentSunday);
  prevSunday.setDate(currentSunday.getDate() - 7);

  const dayNames = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
  const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() + i);
    return {
      dayName: dayNames[i],
      date: toISODateString(d),
      distance: 0,
      durationSeconds: 0,
      count: 0,
    };
  });

  let currentDist = 0;
  let currentDur = 0;
  let currentCal = 0;
  let currentCount = 0;

  let prevDist = 0;

  for (const session of sessions) {
    if (!session.date) continue;
    const sessionDate = new Date(`${session.date}T12:00:00`);

    // Check if in current week
    if (sessionDate >= currentMonday && sessionDate <= currentSunday) {
      currentDist += session.distance || 0;
      currentDur += session.durationSeconds || 0;
      currentCal += session.calories || 0;
      currentCount++;

      const dateStr = session.date;
      const dayItem = dailyBreakdown.find((d) => d.date === dateStr);
      if (dayItem) {
        dayItem.distance += session.distance || 0;
        dayItem.durationSeconds += session.durationSeconds || 0;
        dayItem.count++;
      }
    } else if (sessionDate >= prevMonday && sessionDate <= prevSunday) {
      prevDist += session.distance || 0;
    }
  }

  const avgPace = currentDist > 0 ? calculatePaceSeconds(currentDist, currentDur) : 0;
  let distanceChangePercent: number | null = null;
  if (prevDist > 0) {
    distanceChangePercent = Math.round(((currentDist - prevDist) / prevDist) * 100);
  } else if (currentDist > 0) {
    distanceChangePercent = 100;
  }

  return {
    weekStart: toISODateString(currentMonday),
    weekEnd: toISODateString(currentSunday),
    totalDistance: currentDist,
    totalDurationSeconds: currentDur,
    sessionCount: currentCount,
    avgPaceSecondsPer100m: avgPace,
    totalCalories: currentCal,
    prevWeekDistance: prevDist,
    distanceChangePercent,
    dailyBreakdown,
  };
}

/**
 * Exports swim sessions into a CSV formatted string with UTF-8 BOM.
 */
export function exportToCsv(sessions: SwimSession[]): string {
  const headers = [
    'Data',
    'Dystans (m)',
    'Liczba długości',
    'Długość basenu (m)',
    'Czas trwania (MM:SS)',
    'Czas (sekundy)',
    'Tempo (/100m)',
    'Tempo (sek/100m)',
    'Styl',
    'Śr. tętno (bpm)',
    'Maks. tętno (bpm)',
    'Kalorie (kcal)',
    'Basen / Obiekt',
    'Notatki',
    'Źródło',
  ];

  const rows = sessions.map((s) => [
    `"${s.date || ''}"`,
    s.distance ?? '',
    s.laps ?? '',
    s.poolLength ?? '',
    `"${formatDuration(s.durationSeconds || 0)}"`,
    s.durationSeconds ?? '',
    `"${formatPace(s.paceSecondsPer100m || 0)}"`,
    s.paceSecondsPer100m ?? '',
    `"${(s.stroke || '').replace(/"/g, '""')}"`,
    s.avgHeartRate ?? '',
    s.maxHeartRate ?? '',
    s.calories ?? '',
    `"${(s.poolName || '').replace(/"/g, '""')}"`,
    `"${(s.notes || '').replace(/"/g, '""')}"`,
    `"${(s.source || '').replace(/"/g, '""')}"`,
  ]);

  const bom = '\uFEFF';
  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  return bom + csvContent;
}
