// GitHub-style Activity Calendar Heatmap

export function initCalendar(activities) {
  const container = document.querySelector('.calendar-container');

  // Create activity map by date
  const activityMap = new Map();
  let maxDistance = 0;

  activities.forEach(activity => {
    const existing = activityMap.get(activity.date) || 0;
    const total = existing + activity.distance;
    activityMap.set(activity.date, total);
    if (total > maxDistance) maxDistance = total;
  });

  // Generate date range from Jan 1, 2025 to Jan 27, 2026
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2026-01-27');

  // Calculate dimensions
  const cellSize = 14;
  const cellGap = 3;
  const weekCount = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1;
  const width = weekCount * (cellSize + cellGap) + 50;
  const height = 7 * (cellSize + cellGap) + 40;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'calendar-heatmap');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // Month labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastMonth = -1;

  // Day labels
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  dayLabels.forEach((label, i) => {
    if (label) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', 10);
      text.setAttribute('y', 35 + i * (cellSize + cellGap));
      text.setAttribute('class', 'calendar-month-label');
      text.textContent = label;
      svg.appendChild(text);
    }
  });

  // Generate cells
  let week = 0;
  const currentDate = new Date(startDate);

  // Adjust to start on Sunday
  const dayOfWeek = currentDate.getDay();
  currentDate.setDate(currentDate.getDate() - dayOfWeek);

  while (currentDate <= endDate) {
    const dayInWeek = currentDate.getDay();
    const dateStr = currentDate.toISOString().split('T')[0];
    const distance = activityMap.get(dateStr) || 0;

    // Add month label
    if (currentDate.getMonth() !== lastMonth && dayInWeek === 0 && currentDate >= startDate) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', 50 + week * (cellSize + cellGap));
      text.setAttribute('y', 12);
      text.setAttribute('class', 'calendar-month-label');
      text.textContent = months[currentDate.getMonth()];
      svg.appendChild(text);
      lastMonth = currentDate.getMonth();
    }

    // Only render cells within our date range
    if (currentDate >= startDate && currentDate <= endDate) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', 50 + week * (cellSize + cellGap));
      rect.setAttribute('y', 20 + dayInWeek * (cellSize + cellGap));
      rect.setAttribute('width', cellSize);
      rect.setAttribute('height', cellSize);
      rect.setAttribute('class', 'calendar-day');
      rect.setAttribute('fill', getColor(distance, maxDistance));

      // Tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = distance > 0
        ? `${dateStr}: ${distance.toFixed(1)} miles`
        : `${dateStr}: No activity`;
      rect.appendChild(title);

      svg.appendChild(rect);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    if (currentDate.getDay() === 0) week++;
  }

  container.appendChild(svg);

  // Add legend
  const legend = document.createElement('div');
  legend.className = 'calendar-legend';
  legend.innerHTML = `
    <span>Less</span>
    <div class="legend-box" style="background: #1a1a24;"></div>
    <div class="legend-box" style="background: #0e4429;"></div>
    <div class="legend-box" style="background: #006d32;"></div>
    <div class="legend-box" style="background: #26a641;"></div>
    <div class="legend-box" style="background: #39d353;"></div>
    <span>More</span>
  `;
  container.appendChild(legend);
}

function getColor(distance, maxDistance) {
  if (distance === 0) return '#1a1a24';

  const intensity = distance / maxDistance;

  if (intensity < 0.15) return '#0e4429';
  if (intensity < 0.35) return '#006d32';
  if (intensity < 0.6) return '#26a641';
  return '#39d353';
}
