// Time of Day Bar Chart

export function initTimeOfDay(summary) {
  const container = document.querySelector('.timeofday-container');
  if (!container) return;

  const hours = summary.hourlyDistribution;
  const maxCount = Math.max(...hours);

  // Find peak hour
  const peakHour = hours.indexOf(maxCount);
  const peakAmpm = peakHour < 12 ? 'AM' : 'PM';
  const peakDisplayHour = peakHour % 12 || 12;

  // Create bar chart
  const chart = document.createElement('div');
  chart.className = 'timeofday-chart';

  // Only show hours 4 AM to 10 PM (when runs actually happen)
  const startHour = 4;
  const endHour = 22;

  for (let hour = startHour; hour <= endHour; hour++) {
    const count = hours[hour];
    const intensity = count / maxCount;
    const isPeak = hour === peakHour;

    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 || 12;

    const bar = document.createElement('div');
    bar.className = `timeofday-bar ${isPeak ? 'peak' : ''}`;

    bar.innerHTML = `
      <span class="bar-label">${displayHour}${ampm}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${intensity * 100}%"></div>
      </div>
      <span class="bar-count">${count}</span>
    `;

    bar.title = `${displayHour} ${ampm}: ${count} runs`;
    chart.appendChild(bar);
  }

  // Add peak summary
  const summary_el = document.createElement('div');
  summary_el.className = 'timeofday-summary';
  summary_el.innerHTML = `
    <span class="peak-label">Peak time:</span>
    <span class="peak-value">${peakDisplayHour} ${peakAmpm}</span>
    <span class="peak-count">(${maxCount} runs)</span>
  `;

  container.appendChild(summary_el);
  container.appendChild(chart);
}
