export type SwimmingStroke =
  | 'kraul'
  | 'klasyczny'
  | 'grzbiet'
  | 'motylek'
  | 'zmienny'
  | 'mieszany';

export interface SwimSession {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  poolLength: number; // 25, 50, etc.
  laps: number;
  distance: number; // meters
  durationSeconds: number; // seconds
  paceSecondsPer100m: number; // seconds per 100m
  stroke?: string;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  poolName?: string;
  notes?: string;
  source?: string; // 'apple_watch' | 'manual'
  createdAt?: string;
  updatedAt?: string;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalDistance: number;
  totalDurationSeconds: number;
  sessionCount: number;
  avgPaceSecondsPer100m: number;
  totalCalories: number;
  prevWeekDistance: number;
  distanceChangePercent: number | null;
  dailyBreakdown: {
    dayName: string;
    date: string;
    distance: number;
    durationSeconds: number;
    count: number;
  }[];
}
