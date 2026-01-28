// Monthly Breakdown Section

export function initMonthly(summary) {
  const container = document.querySelector('.monthly-grid');
  const monthlyStats = summary.monthlyStats;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Sort months chronologically
  const months = Object.keys(monthlyStats).sort();

  months.forEach((monthKey, index) => {
    const stats = monthlyStats[monthKey];
    const [year, month] = monthKey.split('-');
    const monthName = `${monthNames[parseInt(month) - 1]} ${year}`;

    const card = document.createElement('div');
    card.className = 'month-card';
    card.style.animationDelay = `${index * 0.05}s`;

    const avgPace = stats.distance > 0 ? stats.duration / 60 / stats.distance : 0;
    const paceFormatted = formatPace(avgPace);

    card.innerHTML = `
      <div class="month-header">
        <div class="month-name">${monthName}</div>
      </div>
      <div class="month-body">
        <div class="month-stats">
          <div class="month-stat">
            <div class="month-stat-value">${stats.runs}</div>
            <div class="month-stat-label">Runs</div>
          </div>
          <div class="month-stat">
            <div class="month-stat-value">${stats.distance.toFixed(1)}</div>
            <div class="month-stat-label">Miles</div>
          </div>
          <div class="month-stat">
            <div class="month-stat-value">${formatDuration(stats.duration)}</div>
            <div class="month-stat-label">Time</div>
          </div>
          <div class="month-stat">
            <div class="month-stat-value">${paceFormatted}</div>
            <div class="month-stat-label">Avg Pace</div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatPace(minPerMile) {
  if (!minPerMile || minPerMile === Infinity || minPerMile === 0) return '--:--';
  const mins = Math.floor(minPerMile);
  const secs = Math.round((minPerMile - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
