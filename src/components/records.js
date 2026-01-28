// Personal Records Section

function formatWeekDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function initRecords(summary) {
  const container = document.querySelector('.records-grid');
  const records = summary.records;

  const recordCards = [
    {
      icon: '🏃',
      title: 'Longest Run',
      value: `${records.longestRun.distance} mi`,
      detail: `${records.longestRun.date} • ${records.longestRun.elevation} ft elevation`
    },
    {
      icon: '⚡',
      title: 'Fastest Pace',
      value: `${records.fastestPace.pace}/mi`,
      detail: `${records.fastestPace.date} • ${records.fastestPace.distance} mi run`
    },
    {
      icon: '🏔️',
      title: 'Biggest Climb',
      value: `${records.biggestClimb.elevation.toLocaleString()} ft`,
      detail: `${records.biggestClimb.date} • ${records.biggestClimb.distance} mi run`
    },
    {
      icon: '🔥',
      title: 'Longest Streak',
      value: `${records.longestStreak.days} days`,
      detail: 'Consecutive days running'
    },
    {
      icon: '📅',
      title: 'Highest Mileage Week',
      value: `${records.highestMileageWeek.miles} mi`,
      detail: `Week of ${formatWeekDate(records.highestMileageWeek.weekStart)}`
    }
  ];

  recordCards.forEach((record, index) => {
    const card = document.createElement('div');
    card.className = 'record-card';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <div class="record-icon">${record.icon}</div>
      <div class="record-title">${record.title}</div>
      <div class="record-value">${record.value}</div>
      <div class="record-detail">${record.detail}</div>
    `;

    container.appendChild(card);
  });
}
