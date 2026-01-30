// Progress Charts with Chart.js
import Chart from 'chart.js/auto';

export function initCharts(summary, activities) {
  createWeeklyChart(summary.weeklyMileage);
  createPaceChart(activities);
  createHrChart(summary.hrZones);
  createTrainingLoadChart(summary.trainingLoad);
}

function createWeeklyChart(weeklyMileage) {
  const ctx = document.getElementById('weekly-chart');
  if (!ctx) return;

  const weeks = Object.keys(weeklyMileage).sort();
  const values = weeks.map(w => weeklyMileage[w]);

  // Format week labels
  const labels = weeks.map(w => {
    const date = new Date(w);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Miles',
        data: values,
        backgroundColor: 'rgba(0, 212, 255, 0.6)',
        borderColor: 'rgba(0, 212, 255, 1)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a24',
          titleColor: '#fff',
          bodyColor: '#a0a0b0',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `${ctx.raw.toFixed(1)} miles`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#a0a0b0', maxRotation: 45 },
          grid: { display: false }
        },
        y: {
          ticks: { color: '#a0a0b0' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}

function createPaceChart(activities) {
  const ctx = document.getElementById('pace-chart');
  if (!ctx) return;

  // Filter valid paces (between 5 and 15 min/mile)
  const validActivities = activities.filter(a =>
    a.avgPace && a.avgPace > 5 && a.avgPace < 15 && a.distance > 0.5
  );

  const labels = validActivities.map(a => {
    const date = new Date(a.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const paces = validActivities.map(a => a.avgPace);

  // Calculate 7-run moving average
  const movingAvg = paces.map((_, i) => {
    const start = Math.max(0, i - 6);
    const slice = paces.slice(start, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Pace',
          data: paces,
          borderColor: 'rgba(124, 58, 237, 0.4)',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          borderWidth: 1,
          pointRadius: 2,
          fill: false,
          tension: 0
        },
        {
          label: '7-Run Average',
          data: movingAvg,
          borderColor: 'rgba(0, 212, 255, 1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#a0a0b0' }
        },
        tooltip: {
          backgroundColor: '#1a1a24',
          titleColor: '#fff',
          bodyColor: '#a0a0b0',
          callbacks: {
            label: (ctx) => {
              const pace = ctx.raw;
              const mins = Math.floor(pace);
              const secs = Math.round((pace - mins) * 60);
              return `${ctx.dataset.label}: ${mins}:${secs.toString().padStart(2, '0')} /mi`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#a0a0b0', maxTicksLimit: 12 },
          grid: { display: false }
        },
        y: {
          reverse: true, // Lower pace is better
          ticks: {
            color: '#a0a0b0',
            callback: (value) => {
              const mins = Math.floor(value);
              const secs = Math.round((value - mins) * 60);
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            }
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}

function createHrChart(hrZones) {
  const ctx = document.getElementById('hr-chart');
  if (!ctx) return;

  const total = hrZones.reduce((a, b) => a + b, 0);
  const percentages = hrZones.map(z => ((z / total) * 100).toFixed(1));

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Zone 1 (<120)', 'Zone 2 (120-140)', 'Zone 3 (140-160)', 'Zone 4 (160-175)', 'Zone 5 (175+)'],
      datasets: [{
        data: percentages,
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(0, 212, 255, 0.8)',
          'rgba(124, 58, 237, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: '#1a1a24',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#a0a0b0',
            padding: 10,
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: '#1a1a24',
          titleColor: '#fff',
          bodyColor: '#a0a0b0',
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw}%`
          }
        }
      }
    }
  });
}

function createTrainingLoadChart(trainingLoad) {
  const ctx = document.getElementById('training-load-chart');
  if (!ctx || !trainingLoad) return;

  // Sample data weekly for cleaner display
  const weeklyData = trainingLoad.filter((_, i) => i % 7 === 0 || i === trainingLoad.length - 1);

  const labels = weeklyData.map(d => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'CTL (Fitness)',
          data: weeklyData.map(d => d.ctl),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'ATL (Fatigue)',
          data: weeklyData.map(d => d.atl),
          borderColor: 'rgba(236, 72, 153, 1)',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'TSB (Form)',
          data: weeklyData.map(d => d.tsb),
          borderColor: 'rgba(251, 191, 36, 1)',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#a0a0b0' } },
        tooltip: {
          backgroundColor: '#1a1a24',
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}`
          }
        }
      },
      scales: {
        x: { ticks: { color: '#a0a0b0' }, grid: { display: false } },
        y: {
          ticks: { color: '#a0a0b0' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}
