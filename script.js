// --- Globals & State ---
let allEvents = [];
let currentMap = null;

// --- Canvas Particles ---
function initCanvas() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.vx = (Math.random() - 0.5) * 1;
      this.vy = (Math.random() - 0.5) * 1;
      this.color = ['#ff2a85', '#00f0ff', '#39ff14'][Math.floor(Math.random() * 3)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.fill();
    }
  }

  for (let i = 0; i < 50; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

// --- Fetch Data ---
async function fetchEvents(query = '') {
  const grid = document.getElementById('events-grid');
  const loading = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  
  grid.innerHTML = '';
  loading.classList.remove('hidden');
  loading.classList.add('flex');
  errorState.classList.add('hidden');

  try {
    // Attempt live Ticketmaster API fetch (Assuming missing key causes 401 fallback)
    // const tmApiKey = 'YOUR_API_KEY';
    // const tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${tmApiKey}&classificationName=Music&keyword=${query}`;
    // let response = await fetch(tmUrl); 
    // if(!response.ok) throw new Error("API Key Missing");

    // Mock API Failure Fallback -> data.json
    throw new Error("Triggering fallback to rich JSON data");

  } catch (err) {
    console.log("Using local JSON fallback...", err.message);
    try {
      const res = await fetch('data.json');
      const data = await res.json();
      allEvents = data.events;
      if (query) {
        allEvents = allEvents.filter(e => e.name.toLowerCase().includes(query.toLowerCase()) || e.location.toLowerCase().includes(query.toLowerCase()));
      }
      renderCards(allEvents);
    } catch(err2) {
      errorState.classList.remove('hidden');
    }
  } finally {
    loading.classList.add('hidden');
    loading.classList.remove('flex');
  }
}

// --- Render Cards ---
function renderCards(events) {
  const grid = document.getElementById('events-grid');
  grid.innerHTML = '';
  
  if(events.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center text-gray-400 py-10">No festivals found.</div>`;
    return;
  }

  events.forEach(event => {
    const colorClass = event.color === 'pink' ? 'from-neon-pink/20 to-transparent border-neon-pink/30' : event.color === 'blue' ? 'from-neon-blue/20 to-transparent border-neon-blue/30' : 'from-neon-green/20 to-transparent border-neon-green/30';
    const glowClass = event.color === 'pink' ? 'shadow-[0_0_30px_rgba(255,42,133,0.3)]' : event.color === 'blue' ? 'shadow-[0_0_30px_rgba(0,240,255,0.3)]' : 'shadow-[0_0_30px_rgba(57,255,20,0.3)]';
    const textClass = event.color === 'pink' ? 'text-neon-pink' : event.color === 'blue' ? 'text-neon-blue' : 'text-neon-green';
    
    const card = document.createElement('div');
    card.className = `perspective-container group`;
    card.innerHTML = `
      <div class="card-3d-wrapper ${glowClass}">
        <!-- Front -->
        <div class="card-front bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
          <div class="relative h-56 overflow-hidden">
            <img src="${event.image}" alt="${event.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            <div class="absolute inset-0 bg-gradient-to-b ${colorClass}"></div>
            <div class="absolute top-4 right-4 ${textClass} bg-gray-900/80 px-3 py-1 rounded-full text-sm font-semibold">
              ${event.date}
            </div>
          </div>
          <div class="p-6">
            <h3 class="text-2xl font-bold mb-2 ${textClass}">${event.name}</h3>
            <p class="text-gray-400 mb-2"><i class="fa-solid fa-location-dot mr-2"></i>${event.location}</p>
            <p class="text-gray-500 text-sm mb-4"><i class="fa-solid fa-ticket mr-2"></i>${event.venue}</p>
            <div class="flex flex-wrap gap-2 mb-4">
              ${event.lineup.slice(0, 3).map(artist => `<span class="bg-gray-800 text-gray-300 px-2 py-1 rounded-full text-xs">${artist}</span>`).join('')}
              ${event.lineup.length > 3 ? `<span class="text-gray-500 text-xs">+${event.lineup.length - 3} more</span>` : ''}
            </div>
            <div class="flex justify-between items-center">
              <span class="text-white font-bold">From $${event.tickets[0].price}</span>
              <button onclick="showEventDetails('${event.id}')" class="bg-gradient-to-r ${event.color === 'pink' ? 'from-neon-pink to-pink-600' : event.color === 'blue' ? 'from-neon-blue to-blue-600' : 'from-neon-green to-green-600'} text-white px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition transform hover:scale-105">
                View Details
              </button>
            </div>
          </div>
        </div>
        <!-- Back -->
        <div class="card-back p-6 flex flex-col justify-between">
          <div>
            <h3 class="text-xl font-bold mb-4 ${textClass}">${event.name}</h3>
            <p class="text-gray-400 text-sm mb-4">Full Lineup:</p>
            <div class="flex flex-wrap gap-2 mb-6">
              ${event.lineup.map(artist => `<span class="bg-gray-800 text-gray-300 px-2 py-1 rounded-full text-xs">${artist}</span>`).join('')}
            </div>
            <p class="text-gray-400 text-sm mb-2">Tickets:</p>
            <ul class="space-y-2 mb-4">
              ${event.tickets.map(t => `<li class="flex justify-between text-sm"><span class="text-gray-300">${t.tier}</span><span class="${textClass} font-semibold">$${t.price}</span></li>`).join('')}
            </ul>
          </div>
          <button onclick="showEventDetails('${event.id}')" class="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition">
            Book Now
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// --- Map ---
function initMap() {
  if (typeof L === 'undefined') {
    console.warn('Leaflet not loaded yet');
    return;
  }
  
  currentMap = L.map('map').setView([40, -40], 3);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19
  }).addTo(currentMap);

  // Add markers after events load
  setTimeout(() => {
    if (allEvents.length > 0) {
      allEvents.forEach(event => {
        if (event.lat && event.lng) {
          const color = event.color === 'pink' ? '#ff2a85' : event.color === 'blue' ? '#00f0ff' : '#39ff14';
          const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;box-shadow:0 0 10px ${color}"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });
          L.marker([event.lat, event.lng], { icon: markerIcon })
            .addTo(currentMap)
            .bindPopup(`<b>${event.name}</b><br>${event.location}`);
        }
      });
    }
  }, 1000);
}

// --- Event Details Modal ---
function showEventDetails(eventId) {
  const event = allEvents.find(e => e.id === eventId);
  if (!event) return;

  const modal = document.createElement('div');
  modal.id = 'event-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="closeModal()"></div>
    <div class="glass-modal relative w-full max-w-2xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
      <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">
        <i class="fa-solid fa-times"></i>
      </button>
      <img src="${event.image}" alt="${event.name}" class="w-full h-48 object-cover rounded-xl mb-6">
      <h2 class="text-3xl font-bold mb-2 ${event.color === 'pink' ? 'text-neon-pink' : event.color === 'blue' ? 'text-neon-blue' : 'text-neon-green'}">${event.name}</h2>
      <p class="text-gray-400 mb-4"><i class="fa-solid fa-calendar mr-2"></i>${event.date}</p>
      <p class="text-gray-400 mb-2"><i class="fa-solid fa-location-dot mr-2"></i>${event.location}</p>
      <p class="text-gray-500 mb-6"><i class="fa-solid fa-ticket mr-2"></i>${event.venue}</p>
      
      <h3 class="text-xl font-semibold mb-3">Lineup</h3>
      <div class="flex flex-wrap gap-2 mb-6">
        ${event.lineup.map(artist => `<span class="bg-gray-800 text-gray-300 px-3 py-1 rounded-full">${artist}</span>`).join('')}
      </div>
      
      <h3 class="text-xl font-semibold mb-3">Tickets</h3>
      <div class="space-y-2 mb-6">
        ${event.tickets.map(t => `
          <div class="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
            <span class="text-gray-300">${t.tier}</span>
            <span class="font-bold text-white">$${t.price}</span>
          </div>
        `).join('')}
      </div>
      
      <h3 class="text-xl font-semibold mb-3">Nearby Hotels</h3>
      <div class="space-y-2 mb-6">
        ${event.hotels.map(h => `
          <div class="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
            <div>
              <span class="text-gray-300 block">${h.name}</span>
              <span class="text-gray-500 text-sm">${h.distance} • ${h.rating}⭐</span>
            </div>
            <span class="font-bold text-neon-blue">$${h.price}/night</span>
          </div>
        `).join('')}
      </div>
      
      <button class="w-full bg-gradient-to-r from-neon-pink to-pink-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition">
        Get Tickets
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('event-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
  }
}

// --- Search ---
document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const query = document.getElementById('search-input').value;
  fetchEvents(query);
});

// --- Navbar Scroll Effect ---
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('bg-gray-900/90', 'shadow-lg');
    navbar.classList.remove('bg-transparent');
  } else {
    navbar.classList.remove('bg-gray-900/90', 'shadow-lg');
    navbar.classList.add('bg-transparent');
  }
});

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  fetchEvents();
  
  // Delay map init to ensure Leaflet loads
  setTimeout(initMap, 500);
});