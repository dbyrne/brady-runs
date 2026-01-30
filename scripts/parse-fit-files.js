import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pako from 'pako';
import FitParser from 'fit-file-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const workoutDir = path.join(rootDir, 'workout_files');
const dataDir = path.join(rootDir, 'public', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Get all FIT.gz files
const files = fs.readdirSync(workoutDir)
  .filter(f => f.endsWith('.FIT.gz'))
  .sort();

console.log(`Found ${files.length} FIT.gz files to process`);

const activities = [];
const routes = [];
let totalDistance = 0;
let totalDuration = 0;
let totalElevation = 0;
let totalCalories = 0;

// Track records
let longestRun = { distance: 0, date: null, name: '' };
let fastestPace = { pace: Infinity, date: null, distance: 0 };
let biggestClimb = { elevation: 0, date: null, name: '' };

// Process each file
async function processFile(filename) {
  const filepath = path.join(workoutDir, filename);

  try {
    // Read and decompress
    const compressed = fs.readFileSync(filepath);
    const decompressed = pako.inflate(compressed);

    // Parse FIT file - don't use lengthUnit to avoid elevation conversion issues
    const fitParser = new FitParser.default({
      force: true,
      elapsedRecordField: true,
    });

    return new Promise((resolve, reject) => {
      fitParser.parse(Buffer.from(decompressed), (error, data) => {
        if (error) {
          console.error(`Error parsing ${filename}:`, error.message);
          resolve(null);
          return;
        }

        const session = data.sessions?.[0];
        if (!session) {
          console.log(`No session data in ${filename}`);
          resolve(null);
          return;
        }

        // Extract date from filename or session
        const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : (session.start_time ? new Date(session.start_time).toISOString().split('T')[0] : 'unknown');

        // Get activity data - raw values are in meters, convert to miles/feet
        const distanceMeters = session.total_distance || 0;
        const distance = distanceMeters * 0.000621371; // meters to miles
        const duration = session.total_timer_time || 0; // in seconds
        const elevationMeters = session.total_ascent || 0;
        const elevation = elevationMeters * 3.28084; // meters to feet
        const avgPace = distance > 0 ? duration / 60 / distance : 0; // min/mile
        const avgHeartRate = session.avg_heart_rate || 0;
        const maxHeartRate = session.max_heart_rate || 0;
        const calories = session.total_calories || 0;

        // Get start hour (convert UTC to Eastern Time, roughly UTC-5)
        let startHour = null;
        if (session.start_time) {
          const startTime = new Date(session.start_time);
          const utcHour = startTime.getUTCHours();
          startHour = (utcHour - 5 + 24) % 24; // Convert to ET (approximate)
        }

        // Get GPS track (simplified)
        const records = data.records || [];
        const gpsPoints = [];
        let lastLat = null, lastLng = null;

        for (let i = 0; i < records.length; i += 5) { // Sample every 5th point
          const record = records[i];
          if (record.position_lat && record.position_long) {
            const lat = record.position_lat;
            const lng = record.position_long;
            // Skip if too close to last point
            if (!lastLat || Math.abs(lat - lastLat) > 0.00005 || Math.abs(lng - lastLng) > 0.00005) {
              gpsPoints.push([lat, lng]);
              lastLat = lat;
              lastLng = lng;
            }
          }
        }

        // Get heart rate zones
        const hrZones = [0, 0, 0, 0, 0]; // Zone 1-5
        for (const record of records) {
          if (record.heart_rate) {
            const hr = record.heart_rate;
            if (hr < 120) hrZones[0]++;
            else if (hr < 140) hrZones[1]++;
            else if (hr < 160) hrZones[2]++;
            else if (hr < 175) hrZones[3]++;
            else hrZones[4]++;
          }
        }

        const activity = {
          date,
          startHour,
          distance: Math.round(distance * 100) / 100,
          duration: Math.round(duration),
          durationFormatted: formatDuration(duration),
          elevation: Math.round(elevation),
          avgPace: Math.round(avgPace * 100) / 100,
          avgPaceFormatted: formatPace(avgPace),
          avgHeartRate: Math.round(avgHeartRate),
          maxHeartRate: Math.round(maxHeartRate),
          calories: Math.round(calories),
          hrZones,
          hasGps: gpsPoints.length > 0
        };

        // Update totals
        totalDistance += distance;
        totalDuration += duration;
        totalElevation += elevation;
        totalCalories += calories;

        // Check records
        if (distance > longestRun.distance) {
          longestRun = { distance, date, elevation };
        }
        if (distance >= 1 && avgPace < fastestPace.pace) {
          fastestPace = { pace: avgPace, date, distance };
        }
        if (elevation > biggestClimb.elevation) {
          biggestClimb = { elevation, date, distance };
        }

        resolve({ activity, route: gpsPoints.length > 10 ? { date, points: gpsPoints } : null });
      });
    });
  } catch (err) {
    console.error(`Failed to process ${filename}:`, err.message);
    return null;
  }
}

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPace(minPerMile) {
  const mins = Math.floor(minPerMile);
  const secs = Math.round((minPerMile - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Process all files
console.log('Processing files...');
const results = [];
for (const file of files) {
  const result = await processFile(file);
  if (result) {
    results.push(result);
    process.stdout.write(`\rProcessed ${results.length}/${files.length} files`);
  }
}
console.log('\n');

// Extract activities and routes
for (const result of results) {
  activities.push(result.activity);
  if (result.route) {
    routes.push(result.route);
  }
}

// Sort activities by date
activities.sort((a, b) => a.date.localeCompare(b.date));
routes.sort((a, b) => a.date.localeCompare(b.date));

// Calculate rTSS for each activity
// Threshold pace estimated from fastest sustained efforts (~9:30 min/mile)
const THRESHOLD_PACE = 9.5; // min/mile

function calculateRTSS(activity) {
  if (!activity.avgPace || activity.avgPace <= 0 || activity.distance < 0.5) {
    return 0;
  }
  // Intensity Factor = Threshold Pace / Actual Pace
  // (faster pace = lower number = higher IF)
  const intensityFactor = Math.min(THRESHOLD_PACE / activity.avgPace, 1.5);
  const durationHours = activity.duration / 3600;
  // rTSS = duration(hrs) * IF^2 * 100
  return durationHours * intensityFactor * intensityFactor * 100;
}

// Calculate CTL/ATL/TSB using exponential decay
// CTL uses 42-day time constant, ATL uses 7-day
function calculateTrainingLoad(sortedActivities) {
  const CTL_DAYS = 42;
  const ATL_DAYS = 7;

  // Build daily TSS map (sum TSS if multiple runs per day)
  const dailyTSS = {};
  for (const activity of sortedActivities) {
    activity.tss = Math.round(calculateRTSS(activity) * 10) / 10;
    dailyTSS[activity.date] = (dailyTSS[activity.date] || 0) + activity.tss;
  }

  // Get date range
  const startDate = new Date(sortedActivities[0].date);
  const endDate = new Date(sortedActivities[sortedActivities.length - 1].date);

  // Calculate daily CTL/ATL/TSB for each day in range
  let ctl = 0, atl = 0;
  const trainingLoad = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const tss = dailyTSS[dateStr] || 0;

    // Exponential moving average formula
    ctl = ctl + (tss - ctl) * (1 - Math.exp(-1 / CTL_DAYS));
    atl = atl + (tss - atl) * (1 - Math.exp(-1 / ATL_DAYS));
    const tsb = ctl - atl;

    trainingLoad.push({
      date: dateStr,
      tss: Math.round(tss * 10) / 10,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10
    });
  }

  // Assign CTL/ATL/TSB to each activity
  const loadByDate = {};
  for (const load of trainingLoad) {
    loadByDate[load.date] = load;
  }
  for (const activity of sortedActivities) {
    const load = loadByDate[activity.date];
    if (load) {
      activity.ctl = load.ctl;
      activity.atl = load.atl;
      activity.tsb = load.tsb;
    }
  }

  return trainingLoad;
}

// Calculate training load metrics
const trainingLoad = calculateTrainingLoad(activities);

// Calculate weekly stats
const weeklyMileage = {};
const monthlyStats = {};

for (const activity of activities) {
  // Weekly
  const date = new Date(activity.date);
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  const weekKey = weekStart.toISOString().split('T')[0];
  weeklyMileage[weekKey] = (weeklyMileage[weekKey] || 0) + activity.distance;

  // Monthly
  const monthKey = activity.date.substring(0, 7);
  if (!monthlyStats[monthKey]) {
    monthlyStats[monthKey] = { runs: 0, distance: 0, duration: 0, elevation: 0 };
  }
  monthlyStats[monthKey].runs++;
  monthlyStats[monthKey].distance += activity.distance;
  monthlyStats[monthKey].duration += activity.duration;
  monthlyStats[monthKey].elevation += activity.elevation;
}

// Calculate streak
let currentStreak = 0;
let longestStreak = 0;
let tempStreak = 0;
const activityDates = new Set(activities.map(a => a.date));
const startDate = new Date(activities[0]?.date || '2025-01-01');
const endDate = new Date(activities[activities.length - 1]?.date || '2026-01-27');

for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
  const dateStr = d.toISOString().split('T')[0];
  if (activityDates.has(dateStr)) {
    tempStreak++;
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  } else {
    tempStreak = 0;
  }
}

// Calculate current streak from most recent date
const today = new Date();
for (let d = new Date(endDate); d >= startDate; d.setDate(d.getDate() - 1)) {
  const dateStr = d.toISOString().split('T')[0];
  if (activityDates.has(dateStr)) {
    currentStreak++;
  } else {
    break;
  }
}

// Aggregate heart rate zones
const totalHrZones = [0, 0, 0, 0, 0];
for (const activity of activities) {
  for (let i = 0; i < 5; i++) {
    totalHrZones[i] += activity.hrZones[i];
  }
}

// Aggregate runs by hour of day
const hourlyDistribution = new Array(24).fill(0);
for (const activity of activities) {
  if (activity.startHour !== null) {
    hourlyDistribution[activity.startHour]++;
  }
}

// Create summary
const summary = {
  totalRuns: activities.length,
  totalDistance: Math.round(totalDistance * 100) / 100,
  totalDuration: Math.round(totalDuration),
  totalDurationFormatted: formatDuration(totalDuration),
  totalElevation: Math.round(totalElevation),
  totalCalories: Math.round(totalCalories),
  avgDistance: Math.round(totalDistance / activities.length * 100) / 100,
  avgPace: formatPace(totalDuration / 60 / totalDistance),
  currentStreak,
  longestStreak,
  records: {
    longestRun: {
      distance: Math.round(longestRun.distance * 100) / 100,
      date: longestRun.date,
      elevation: Math.round(longestRun.elevation)
    },
    fastestPace: {
      pace: formatPace(fastestPace.pace),
      paceNum: Math.round(fastestPace.pace * 100) / 100,
      date: fastestPace.date,
      distance: Math.round(fastestPace.distance * 100) / 100
    },
    biggestClimb: {
      elevation: Math.round(biggestClimb.elevation),
      date: biggestClimb.date,
      distance: Math.round(biggestClimb.distance * 100) / 100
    },
    longestStreak: {
      days: longestStreak
    },
    highestMileageWeek: (() => {
      const weeks = Object.entries(weeklyMileage);
      weeks.sort((a, b) => b[1] - a[1]);
      const [weekStart, miles] = weeks[0] || ['', 0];
      return {
        weekStart,
        miles: Math.round(miles * 10) / 10
      };
    })()
  },
  funFacts: {
    marathons: Math.round(totalDistance / 26.2 * 10) / 10,
    mtFujis: Math.round(totalElevation / 12388 * 100) / 100, // Mt. Fuji = 12,388 ft
    earthPercent: Math.round(totalDistance / 24901 * 10000) / 100
  },
  weeklyMileage,
  monthlyStats,
  hrZones: totalHrZones,
  hourlyDistribution,
  trainingLoad,
  dateRange: {
    start: activities[0]?.date || '2025-01-01',
    end: activities[activities.length - 1]?.date || '2026-01-27'
  }
};

// Write output files
console.log('Writing output files...');
fs.writeFileSync(path.join(dataDir, 'summary.json'), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(dataDir, 'activities.json'), JSON.stringify(activities, null, 2));
fs.writeFileSync(path.join(dataDir, 'routes.json'), JSON.stringify(routes, null, 2));

console.log(`
✓ Processed ${activities.length} activities
✓ Found ${routes.length} GPS routes
✓ Total distance: ${summary.totalDistance.toFixed(1)} miles
✓ Total time: ${summary.totalDurationFormatted}
✓ Total elevation: ${summary.totalElevation.toLocaleString()} ft
✓ Longest streak: ${longestStreak} days

Output files written to data/
`);
