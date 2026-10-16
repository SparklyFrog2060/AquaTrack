import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistance,
  parseTimeString,
  formatDuration,
  calculatePaceSeconds,
  parsePaceString,
  formatPace,
  calculateSpeedKmh,
  aggregateWeeklyStats,
  exportToCsv,
  type SwimSession,
} from './swimCalculations.ts';

test('calculateDistance handles standard lap and pool lengths', () => {
  assert.equal(calculateDistance(40, 25), 1000);
  assert.equal(calculateDistance(30, 50), 1500);
  assert.equal(calculateDistance(0, 25), 0);
  assert.equal(calculateDistance(-5, 25), 0);
});

test('parseTimeString correctly parses varied time strings', () => {
  assert.equal(parseTimeString('30:00'), 1800);
  assert.equal(parseTimeString('1:15:30'), 4530);
  assert.equal(parseTimeString('0:45'), 45);
  assert.equal(parseTimeString('45m'), 2700);
  assert.equal(parseTimeString('1h 10m'), 4200);
  assert.equal(parseTimeString(''), 0);
});

test('formatDuration formats seconds accurately', () => {
  assert.equal(formatDuration(1800), '30:00');
  assert.equal(formatDuration(4530), '1:15:30');
  assert.equal(formatDuration(45), '0:45');
  assert.equal(formatDuration(0), '0:00');
});

test('calculatePaceSeconds and formatPace', () => {
  // 1000m in 1200s (20 min) -> 120s / 100m -> 2:00 /100m
  const pace = calculatePaceSeconds(1000, 1200);
  assert.equal(pace, 120);
  assert.equal(formatPace(pace), '2:00');

  // 1500m in 1650s -> 110s -> 1:50
  assert.equal(calculatePaceSeconds(1500, 1650), 110);
  assert.equal(formatPace(110), '1:50');
});

test('parsePaceString parses Apple watch pace formats', () => {
  assert.equal(parsePaceString('1:52'), 112);
  assert.equal(parsePaceString('2:05/100m'), 125);
  assert.equal(parsePaceString('110'), 110);
});

test('calculateSpeedKmh calculates speed correctly', () => {
  // 3000m in 3600s (1h) = 3.0 km/h
  assert.equal(calculateSpeedKmh(3000, 3600), 3.0);
});

test('aggregateWeeklyStats aggregates correctly for the current week', () => {
  const refDate = new Date('2026-10-14T10:00:00'); // Wednesday
  const sampleSessions: SwimSession[] = [
    {
      userId: 'u1',
      date: '2026-10-12', // Monday this week
      distance: 1000,
      laps: 40,
      poolLength: 25,
      durationSeconds: 1200,
      paceSecondsPer100m: 120,
      calories: 300,
    },
    {
      userId: 'u1',
      date: '2026-10-14', // Wednesday this week
      distance: 1500,
      laps: 60,
      poolLength: 25,
      durationSeconds: 1650,
      paceSecondsPer100m: 110,
      calories: 450,
    },
    {
      userId: 'u1',
      date: '2026-10-05', // Last week Monday
      distance: 1200,
      laps: 48,
      poolLength: 25,
      durationSeconds: 1440,
      paceSecondsPer100m: 120,
      calories: 360,
    },
  ];

  const stats = aggregateWeeklyStats(sampleSessions, refDate);
  assert.equal(stats.totalDistance, 2500);
  assert.equal(stats.sessionCount, 2);
  assert.equal(stats.totalDurationSeconds, 2850);
  assert.equal(stats.totalCalories, 750);
  assert.equal(stats.prevWeekDistance, 1200);
  assert.equal(stats.dailyBreakdown.length, 7);
  // Monday distance
  assert.equal(stats.dailyBreakdown[0].distance, 1000);
  // Wednesday distance
  assert.equal(stats.dailyBreakdown[2].distance, 1500);
});

test('exportToCsv produces valid CSV with BOM and swimming data', () => {
  const sampleSessions: SwimSession[] = [
    {
      userId: 'u1',
      date: '2026-10-12',
      distance: 1500,
      laps: 60,
      poolLength: 25,
      durationSeconds: 1800,
      paceSecondsPer100m: 120,
      stroke: 'kraul',
      avgHeartRate: 142,
      maxHeartRate: 168,
      calories: 480,
      poolName: 'Aquapark',
      notes: 'Dobry trening tempo-wytrzymałość',
      source: 'apple_watch',
    },
  ];

  const csv = exportToCsv(sampleSessions);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('Data;Dystans (m);Liczba długości'));
  assert.ok(csv.includes('1500'));
  assert.ok(csv.includes('kraul'));
  assert.ok(csv.includes('142'));
});
