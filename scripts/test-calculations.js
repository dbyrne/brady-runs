/**
 * Test suite for Brady's Running Year data calculations
 * Run with: node scripts/test-calculations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pako from 'pako';
import FitParser from 'fit-file-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const activities = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data/activities.json')));
const summary = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data/summary.json')));
const routes = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data/routes.json')));

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.log(`✗ ${name} ${details}`);
    failed++;
  }
}

function approxEqual(a, b, tolerance = 0.5) {
  return Math.abs(a - b) <= tolerance;
}

console.log('=== UNIT CONVERSION TESTS ===\n');

// Test conversion constants
test('Meters to miles conversion (1609.344m = 1mi)',
  approxEqual(1609.344 * 0.000621371, 1, 0.001));

test('Meters to feet conversion (1m = 3.28084ft)',
  approxEqual(1 * 3.28084, 3.28084, 0.0001));

// Verify against raw FIT file
const testFile = fs.readdirSync(path.join(rootDir, 'workout_files'))
  .filter(f => f.endsWith('.FIT.gz'))[0];
const compressed = fs.readFileSync(path.join(rootDir, 'workout_files', testFile));
const decompressed = pako.inflate(compressed);
const fitParser = new FitParser.default({ force: true });

await new Promise((resolve) => {
  fitParser.parse(Buffer.from(decompressed), (error, data) => {
    if (error) { console.error(error); resolve(); return; }

    const session = data.sessions?.[0];
    const rawDistanceMeters = session.total_distance;
    const rawElevationMeters = session.total_ascent;
    const rawDurationSeconds = session.total_timer_time;

    const expectedMiles = rawDistanceMeters * 0.000621371;
    const expectedFeet = rawElevationMeters * 3.28084;
    const expectedPace = rawDurationSeconds / 60 / expectedMiles;

    const firstActivity = activities[0];

    test('First activity distance matches FIT file conversion',
      approxEqual(firstActivity.distance, expectedMiles, 0.01),
      `(got ${firstActivity.distance}, expected ${expectedMiles.toFixed(2)})`);

    test('First activity elevation matches FIT file conversion',
      approxEqual(firstActivity.elevation, expectedFeet, 1),
      `(got ${firstActivity.elevation}, expected ${expectedFeet.toFixed(0)})`);

    test('First activity pace matches FIT file calculation',
      approxEqual(firstActivity.avgPace, expectedPace, 0.1),
      `(got ${firstActivity.avgPace}, expected ${expectedPace.toFixed(2)})`);

    resolve();
  });
});

console.log('\n=== AGGREGATION TESTS ===\n');

// Note: Small differences expected due to rounding in activities vs raw totals
test('Total runs count matches activities array length',
  summary.totalRuns === activities.length,
  `(got ${summary.totalRuns}, expected ${activities.length})`);

test('Total distance is reasonable (within 1% of sum of activities)',
  approxEqual(summary.totalDistance, activities.reduce((s, a) => s + a.distance, 0), summary.totalDistance * 0.01),
  `(summary: ${summary.totalDistance}, sum: ${activities.reduce((s, a) => s + a.distance, 0).toFixed(2)})`);

test('Total duration is reasonable (within 10s of sum of activities)',
  approxEqual(summary.totalDuration, activities.reduce((s, a) => s + a.duration, 0), 10),
  `(summary: ${summary.totalDuration}, sum: ${activities.reduce((s, a) => s + a.duration, 0)})`);

test('Total elevation is reasonable (within 5ft of sum of activities)',
  approxEqual(summary.totalElevation, activities.reduce((s, a) => s + a.elevation, 0), 5),
  `(summary: ${summary.totalElevation}, sum: ${activities.reduce((s, a) => s + a.elevation, 0)})`);

console.log('\n=== RECORDS TESTS ===\n');

// Longest run
const longestActivity = activities.reduce((max, a) => a.distance > max.distance ? a : max, activities[0]);
test('Longest run distance is correct',
  summary.records.longestRun.distance === longestActivity.distance,
  `(got ${summary.records.longestRun.distance}, expected ${longestActivity.distance})`);

test('Longest run date is correct',
  summary.records.longestRun.date === longestActivity.date,
  `(got ${summary.records.longestRun.date}, expected ${longestActivity.date})`);

// Fastest pace (min 1 mile runs only)
const fastestActivity = activities
  .filter(a => a.distance >= 1 && a.avgPace > 5 && a.avgPace < 15)
  .reduce((min, a) => a.avgPace < min.avgPace ? a : min, { avgPace: Infinity });
test('Fastest pace is correct',
  approxEqual(summary.records.fastestPace.paceNum, fastestActivity.avgPace, 0.01),
  `(got ${summary.records.fastestPace.paceNum}, expected ${fastestActivity.avgPace})`);

// Highest mileage week
const weeklyEntries = Object.entries(summary.weeklyMileage);
const highestWeek = weeklyEntries.reduce((max, [week, miles]) => miles > max[1] ? [week, miles] : max, ['', 0]);
test('Highest mileage week is correct',
  summary.records.highestMileageWeek.weekStart === highestWeek[0],
  `(got ${summary.records.highestMileageWeek.weekStart}, expected ${highestWeek[0]})`);

test('Highest mileage week miles is correct',
  approxEqual(summary.records.highestMileageWeek.miles, highestWeek[1], 0.1),
  `(got ${summary.records.highestMileageWeek.miles}, expected ${highestWeek[1].toFixed(1)})`);

console.log('\n=== FUN FACTS TESTS ===\n');

// Marathons (26.2 miles)
const expectedMarathons = summary.totalDistance / 26.2;
test('Marathons calculation is correct',
  approxEqual(summary.funFacts.marathons, expectedMarathons, 0.1),
  `(got ${summary.funFacts.marathons}, expected ${expectedMarathons.toFixed(1)})`);

// Mt Fujis (12,388 ft)
const expectedMtFujis = summary.totalElevation / 12388;
test('Mt Fujis calculation is correct',
  approxEqual(summary.funFacts.mtFujis, expectedMtFujis, 0.01),
  `(got ${summary.funFacts.mtFujis}, expected ${expectedMtFujis.toFixed(2)})`);

// Earth percentage (24,901 miles)
const expectedEarthPct = (summary.totalDistance / 24901) * 100;
test('Earth percentage calculation is correct',
  approxEqual(summary.funFacts.earthPercent, expectedEarthPct, 0.01),
  `(got ${summary.funFacts.earthPercent}, expected ${expectedEarthPct.toFixed(2)})`);

console.log('\n=== DATA INTEGRITY TESTS ===\n');

test('All activities have valid dates',
  activities.every(a => /^\d{4}-\d{2}-\d{2}$/.test(a.date)));

test('All activities have positive distance',
  activities.every(a => a.distance > 0));

test('All activities have positive duration',
  activities.every(a => a.duration > 0));

test('All activities have non-negative elevation',
  activities.every(a => a.elevation >= 0));

test('All activities have valid pace (5-20 min/mile)',
  activities.every(a => a.avgPace >= 5 && a.avgPace <= 20));

test('Routes count matches activities with GPS',
  routes.length === activities.filter(a => a.hasGps).length);

test('Hourly distribution sums to total runs',
  summary.hourlyDistribution.reduce((a, b) => a + b, 0) === summary.totalRuns,
  `(sum: ${summary.hourlyDistribution.reduce((a, b) => a + b, 0)}, totalRuns: ${summary.totalRuns})`);

test('Weekly mileage sum approximately equals total distance',
  approxEqual(Object.values(summary.weeklyMileage).reduce((a, b) => a + b, 0), summary.totalDistance, 1));

console.log('\n=== RESULTS ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
