// Fun Comparisons Section

export function initComparisons(summary) {
  const container = document.querySelector('.comparisons-grid');
  const facts = summary.funFacts;

  const comparisons = [
    {
      emoji: '🏃‍♂️',
      value: facts.marathons.toFixed(1),
      text: 'marathons worth of distance'
    },
    {
      emoji: '🗻',
      value: facts.mtFujis.toFixed(1),
      text: 'Mt. Fujis climbed'
    },
    {
      emoji: '🌍',
      value: `${facts.earthPercent}%`,
      text: 'around the Earth'
    },
    {
      emoji: '✈️',
      value: Math.round(summary.totalDuration / 3600 / 5.5),
      text: 'NYC→LA flights worth of time'
    },
    {
      emoji: '📅',
      value: summary.totalRuns,
      text: 'runs completed'
    },
    {
      emoji: '📈',
      value: `${summary.avgDistance.toFixed(1)} mi`,
      text: 'average per run'
    }
  ];

  comparisons.forEach((comp, index) => {
    const card = document.createElement('div');
    card.className = 'comparison-card';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <div class="comparison-emoji">${comp.emoji}</div>
      <div class="comparison-value">${comp.value}</div>
      <div class="comparison-text">${comp.text}</div>
    `;

    container.appendChild(card);
  });
}
