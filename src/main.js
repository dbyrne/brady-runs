// Brady's Running Year - Main Entry Point
import { initHero } from './components/hero.js';
import { initCalendar } from './components/calendar.js';
import { initMap } from './components/map.js';
import { initCharts } from './components/charts.js';
import { initTimeOfDay } from './components/timeofday.js';
import { initRecords } from './components/records.js';
import { initComparisons } from './components/comparisons.js';
import { initMonthly } from './components/monthly.js';

// Load data and initialize all components
async function init() {
  try {
    // Load all data files in parallel
    const [summaryRes, activitiesRes, routesRes] = await Promise.all([
      fetch('/data/summary.json'),
      fetch('/data/activities.json'),
      fetch('/data/routes.json')
    ]);

    const summary = await summaryRes.json();
    const activities = await activitiesRes.json();
    const routes = await routesRes.json();

    console.log('Data loaded:', { summary, activities: activities.length, routes: routes.length });

    // Initialize all sections
    initHero(summary);
    initCalendar(activities);
    initMap(routes);
    initCharts(summary, activities);
    initTimeOfDay(summary);
    initRecords(summary);
    initComparisons(summary);
    initMonthly(summary);

    // Add scroll animations
    observeSections();
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}

// Intersection Observer for scroll animations
function observeSections() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
  });
}

// Start the app
init();
