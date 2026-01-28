// Running Footprint Map with Leaflet

export function initMap(routes) {
  // Dynamically load Leaflet
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => createMap(routes);
  document.head.appendChild(script);
}

function createMap(routes) {
  if (!routes || routes.length === 0) {
    document.getElementById('route-map').innerHTML = '<p style="padding: 2rem; text-align: center;">No GPS data available</p>';
    return;
  }

  // Classify each route into a location
  function classifyRoute(route) {
    if (!route.points || route.points.length === 0) return null;
    const [lat, lng] = route.points[0];

    // Upstate NY (Catskills area)
    if (lat > 41.5 && lng > -75 && lng < -73) return 'Upstate';

    // Jersey City area
    if (lat >= 40.7 && lat <= 40.75 && lng >= -74.07 && lng <= -74.02) return 'Jersey City';

    // Brooklyn/Williamsburg area
    if (lat >= 40.7 && lat <= 40.78 && lng >= -73.99 && lng <= -73.93) return 'Brooklyn';

    // Manhattan (fold into Brooklyn for display)
    if (lat >= 40.75 && lat <= 40.82 && lng >= -74.02 && lng <= -73.93) return 'Brooklyn';

    // Philadelphia
    if (lat >= 39.9 && lat <= 40.1 && lng >= -75.3 && lng <= -75.1) return 'Philadelphia';

    // Seattle
    if (lat >= 47 && lat <= 48 && lng >= -122.5 && lng <= -121.5) return 'Seattle';

    // Paris
    if (lat >= 48.5 && lat <= 49.5 && lng >= 2 && lng <= 3) return 'Paris';

    // London
    if (lat >= 51 && lat <= 52 && lng >= -0.5 && lng <= 0.5) return 'London';

    // Ireland
    if (lat >= 53 && lat <= 54 && lng >= -10 && lng <= -8) return 'Ireland';

    // Utah
    if (lat >= 40 && lat <= 41 && lng >= -112.5 && lng <= -111) return 'Utah';

    return null;
  }

  // Group routes by location
  const locationRoutes = {};
  routes.forEach(route => {
    const loc = classifyRoute(route);
    if (loc) {
      if (!locationRoutes[loc]) locationRoutes[loc] = [];
      locationRoutes[loc].push(route);
    }
  });

  // Define location metadata
  const locationMeta = {
    'Jersey City': { icon: '🏙️', color: '#00d4ff', order: 1 },
    'Brooklyn': { icon: '🌉', color: '#7c3aed', order: 2 },
    'Upstate': { icon: '🌲', color: '#10b981', order: 3 },
    'Philadelphia': { icon: '🔔', color: '#fbbf24', order: 4, special: true },
    'Seattle': { icon: '☕', color: '#06b6d4', order: 5 },
    'Paris': { icon: '🗼', color: '#ec4899', order: 6 },
    'London': { icon: '🎡', color: '#8b5cf6', order: 7 },
    'Ireland': { icon: '☘️', color: '#22c55e', order: 8 },
    'Utah': { icon: '🏔️', color: '#f97316', order: 9 }
  };

  // Calculate bounds for each location
  Object.keys(locationRoutes).forEach(loc => {
    const routes = locationRoutes[loc];
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    routes.forEach(route => {
      route.points.forEach(([lat, lng]) => {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
    });
    locationMeta[loc].bounds = [[minLat, minLng], [maxLat, maxLng]];
    locationMeta[loc].count = routes.length;
  });

  // Sort locations by order
  const sortedLocations = Object.keys(locationRoutes)
    .filter(loc => locationMeta[loc])
    .sort((a, b) => locationMeta[a].order - locationMeta[b].order);

  // Create location selector
  const mapSection = document.getElementById('map');
  const selector = document.createElement('div');
  selector.className = 'location-selector';
  selector.innerHTML = sortedLocations.map((loc, i) => `
    <button class="location-btn ${i === 0 ? 'active' : ''} ${locationMeta[loc].special ? 'special' : ''}"
            data-location="${loc}"
            style="--btn-color: ${locationMeta[loc].color}">
      <span class="loc-icon">${locationMeta[loc].icon}</span>
      <span class="loc-name">${loc}</span>
      <span class="loc-count">${locationMeta[loc].count}</span>
    </button>
  `).join('');

  mapSection.querySelector('.section-subtitle').insertAdjacentElement('afterend', selector);

  // Get initial location
  const initialLocation = sortedLocations[0];
  const initialBounds = locationMeta[initialLocation].bounds;

  // Initialize map
  const map = L.map('route-map', {
    center: [(initialBounds[0][0] + initialBounds[1][0]) / 2, (initialBounds[0][1] + initialBounds[1][1]) / 2],
    zoom: 13,
    zoomControl: true,
    scrollWheelZoom: true
  });

  // Add dark tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Store polyline groups
  const polylineGroups = {};

  // Create routes for each location
  sortedLocations.forEach(loc => {
    const routes = locationRoutes[loc];
    const meta = locationMeta[loc];
    const group = L.layerGroup();
    polylineGroups[loc] = group;

    routes.forEach(route => {
      if (!route.points || route.points.length < 2) return;

      // Special styling for Philadelphia marathon
      const isMarathon = route.date === '2025-11-23';
      const isPhilly = loc === 'Philadelphia';

      // Uniform styling - same for all locations
      const color = meta.color;
      const weight = isMarathon ? 4 : 2.5;
      const opacity = isPhilly ? 0.9 : 0.7;

      // Main route line
      const polyline = L.polyline(route.points, {
        color: color,
        weight: weight,
        opacity: opacity,
        smoothFactor: 1,
        lineCap: 'round',
        lineJoin: 'round'
      });
      group.addLayer(polyline);

      // Subtle glow effect
      const glow = L.polyline(route.points, {
        color: color,
        weight: weight + 6,
        opacity: isPhilly ? 0.35 : 0.2,
        smoothFactor: 1,
        lineCap: 'round',
        lineJoin: 'round'
      });
      group.addLayer(glow);

      // Marathon marker
      if (isMarathon) {
        const startPoint = route.points[0];
        const marker = L.marker(startPoint, {
          icon: L.divIcon({
            className: 'marathon-marker',
            html: '<div class="marker-content">🏃 Philadelphia Marathon<br>26.67 miles</div>',
            iconSize: [160, 50],
            iconAnchor: [80, 50]
          })
        });
        group.addLayer(marker);
      }
    });

    // Add initial location to map
    if (loc === initialLocation) {
      group.addTo(map);
    }
  });

  // Fit to initial bounds
  map.fitBounds(initialBounds, { padding: [40, 40] });

  // Handle location switching
  let currentLocation = initialLocation;
  selector.addEventListener('click', (e) => {
    const btn = e.target.closest('.location-btn');
    if (!btn) return;

    const location = btn.dataset.location;
    if (location === currentLocation) return;

    // Update button states
    selector.querySelectorAll('.location-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Swap layers
    if (polylineGroups[currentLocation]) {
      map.removeLayer(polylineGroups[currentLocation]);
    }
    if (polylineGroups[location]) {
      polylineGroups[location].addTo(map);
    }

    // Fly to new bounds
    const bounds = locationMeta[location].bounds;
    if (bounds) {
      map.flyToBounds(bounds, { padding: [40, 40], duration: 1.2 });
    }

    currentLocation = location;
  });
}
