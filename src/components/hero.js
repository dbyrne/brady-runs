// Hero Section with Animated Counters

export function initHero(summary) {
  const container = document.querySelector('.hero-stats');

  const stats = [
    { value: summary.totalDistance, label: 'Total Miles', format: 'number', decimals: 1 },
    { value: summary.totalDuration / 3600, label: 'Total Hours', format: 'number', decimals: 1 },
    { value: summary.totalElevation, label: 'Elevation (ft)', format: 'number', decimals: 0 },
    { value: summary.totalRuns, label: 'Total Runs', format: 'number', decimals: 0 }
  ];

  stats.forEach((stat, index) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const valueEl = document.createElement('div');
    valueEl.className = 'stat-value';
    valueEl.textContent = '0';

    const labelEl = document.createElement('div');
    labelEl.className = 'stat-label';
    labelEl.textContent = stat.label;

    card.appendChild(valueEl);
    card.appendChild(labelEl);
    container.appendChild(card);

    // Animate counter
    animateCounter(valueEl, stat.value, stat.decimals, index * 200);
  });
}

function animateCounter(element, target, decimals, delay) {
  const duration = 2000;
  const startTime = performance.now() + delay;

  function update(currentTime) {
    const elapsed = currentTime - startTime;

    if (elapsed < 0) {
      requestAnimationFrame(update);
      return;
    }

    const progress = Math.min(elapsed / duration, 1);
    // Easing function for smooth animation
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;

    element.textContent = formatNumber(current, decimals);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatNumber(target, decimals);
    }
  }

  requestAnimationFrame(update);
}

function formatNumber(num, decimals) {
  if (decimals === 0) {
    return Math.round(num).toLocaleString();
  }
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
