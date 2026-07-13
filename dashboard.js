/* ============================================
   JP GAS - Admin Analytics Dashboard JavaScript
   dashboard.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // --- State Variables ---
  let rawLogs = [];
  let filteredLogs = [];
  let currentPage = 1;
  const pageSize = 10;
  let abacusCount = 0;
  
  // Chart instances
  let trendChartInstance = null;
  let deviceChartInstance = null;
  let countryChartInstance = null;

  // Retrieve configuration safely
  const isConfigDefined = typeof CONFIG !== 'undefined';
  const PASSCODE = isConfigDefined ? CONFIG.ADMIN_PASSCODE : 'jpgas2026';
  const SUPABASE_URL = isConfigDefined ? CONFIG.SUPABASE_URL : '';
  const SUPABASE_KEY = isConfigDefined ? CONFIG.SUPABASE_KEY : '';
  const ABACUS_NS = isConfigDefined ? CONFIG.ABACUS_NAMESPACE : 'jpgas.in';
  const ABACUS_KEY = isConfigDefined ? CONFIG.ABACUS_KEY : 'visits';

  // --- UI Elements ---
  const passcodeScreen = document.getElementById('passcodeScreen');
  const passcodeCard = document.getElementById('passcodeCard');
  const passcodeBtn = document.getElementById('passcodeBtn');
  const passcodeField = document.getElementById('passcodeField');
  const passcodeError = document.getElementById('passcodeError');

  const btnLogout = document.getElementById('btnLogout');
  const btnRefresh = document.getElementById('btnRefresh');

  const cardHits = document.getElementById('cardHits');
  const cardDatabase = document.getElementById('cardDatabase');
  const cardCountries = document.getElementById('cardCountries');
  const cardDevices = document.getElementById('cardDevices');

  const tableBody = document.getElementById('tableBody');
  const searchInput = document.getElementById('searchInput');
  const pageInfo = document.getElementById('pageInfo');
  const btnPrevPage = document.getElementById('btnPrevPage');
  const btnNextPage = document.getElementById('btnNextPage');

  // --- 1. Passcode Protection Security Flow ---
  function checkAuthentication() {
    if (sessionStorage.getItem('jpgas_admin_auth') === 'true') {
      passcodeScreen.classList.add('hidden');
      initDashboard();
    } else {
      passcodeScreen.classList.remove('hidden');
      passcodeField.focus();
    }
  }

  function handleLogin() {
    const entered = passcodeField.value.trim();
    if (entered === PASSCODE) {
      sessionStorage.setItem('jpgas_admin_auth', 'true');
      passcodeScreen.classList.add('hidden');
      initDashboard();
    } else {
      // Shake animation & error display
      passcodeCard.classList.add('shake');
      passcodeError.classList.add('visible');
      passcodeField.value = '';
      
      setTimeout(() => {
        passcodeCard.classList.remove('shake');
      }, 500);
      
      setTimeout(() => {
        passcodeError.classList.remove('visible');
      }, 3000);
    }
  }

  // Bind security actions
  passcodeBtn.addEventListener('click', handleLogin);
  passcodeField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('jpgas_admin_auth');
    window.location.reload();
  });

  // Check auth on load
  checkAuthentication();

  // --- 2. Dashboard Initialization ---
  function initDashboard() {
    // Load data
    loadDashboardData();
  }

  btnRefresh.addEventListener('click', loadDashboardData);

  // --- 3. Data Loading Engine (Supabase + Fallbacks) ---
  function loadDashboardData() {
    showLoadingState();
    
    // Fetch total counter from Abacus API
    const countEndpoint = `https://abacus.jasoncameron.dev/get/${ABACUS_NS}/${ABACUS_KEY}`;
    
    const countPromise = fetch(countEndpoint)
      .then(res => res.ok ? res.json() : { value: 0 })
      .then(data => {
        abacusCount = data.value || 0;
      })
      .catch(err => {
        console.warn('Error fetching Abacus counter:', err);
        // Fallback to localHits count
        abacusCount = parseInt(localStorage.getItem('jpgas_local_hits') || '0');
      });

    // Fetch database logs
    const isSupabaseConfigured = SUPABASE_URL && SUPABASE_KEY;
    let logsPromise;

    if (isSupabaseConfigured) {
      const logsEndpoint = `${SUPABASE_URL}/rest/v1/visits?order=created_at.desc`;
      logsPromise = fetch(logsEndpoint, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Database request failed: ' + res.statusText);
        return res.json();
      })
      .then(data => {
        rawLogs = data || [];
      })
      .catch(err => {
        console.error('Error fetching Supabase logs:', err);
        showToast('Failed to load database logs. Using simulated/local data.');
        loadFallbackLogs();
      });
    } else {
      // Not configured: use local storage logs plus simulated logs for rich visualization
      logsPromise = new Promise((resolve) => {
        setTimeout(() => {
          loadFallbackLogs();
          resolve();
        }, 600); // Small delay to simulate network latency for loading aesthetics
      });
    }

    Promise.all([countPromise, logsPromise]).then(() => {
      // Process metrics and draw UI
      processAndRenderDashboard();
    });
  }

  function loadFallbackLogs() {
    // Read from local storage (real local test sessions)
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem('jpgas_local_logs') || '[]');
    } catch(e) {
      console.error(e);
    }

    // If local logs are very few, generate rich simulated data to demonstrate the dashboard features
    if (logs.length < 5) {
      const generated = generateSimulatedLogs();
      // Concat and sort
      logs = logs.concat(generated);
      logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    rawLogs = logs;
  }

  function generateSimulatedLogs() {
    const locations = [
      { city: 'New Delhi', region: 'Delhi', country: 'India', country_code: 'IN' },
      { city: 'Gurugram', region: 'Haryana', country: 'India', country_code: 'IN' },
      { city: 'Mumbai', region: 'Maharashtra', country: 'India', country_code: 'IN' },
      { city: 'Noida', region: 'Uttar Pradesh', country: 'India', country_code: 'IN' },
      { city: 'Bangalore', region: 'Karnataka', country: 'India', country_code: 'IN' },
      { city: 'New York', region: 'New York', country: 'United States', country_code: 'US' },
      { city: 'London', region: 'England', country: 'United Kingdom', country_code: 'GB' }
    ];

    const referrers = [
      'Direct / Bookmark',
      'https://www.google.com/',
      'https://www.google.com/',
      'https://wa.me/',
      'https://jpgas.in/',
      'https://www.bing.com/',
      'Direct / Bookmark'
    ];

    const uas = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', // Windows Chrome
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15', // Mac Safari
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1', // iPhone Safari
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', // Android Chrome
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0' // Windows Firefox
    ];

    const devices = ['Desktop', 'Desktop', 'Mobile', 'Mobile', 'Desktop'];
    const logs = [];
    const now = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(now.getTime() - i * 6.5 * 3600000); // Spans over a week
      const loc = locations[Math.floor(Math.random() * locations.length)];
      const uaIdx = Math.floor(Math.random() * uas.length);
      const isSimulated = true;
      
      logs.push({
        id: 'sim_' + i,
        created_at: date.toISOString(),
        ip: `122.161.${10 + Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 255)}`,
        city: loc.city,
        region: loc.region,
        country: loc.country,
        user_agent: uas[uaIdx],
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        device: devices[uaIdx],
        is_simulated: isSimulated
      });
    }

    return logs;
  }

  function showLoadingState() {
    cardHits.textContent = '...';
    cardDatabase.textContent = '...';
    cardCountries.textContent = '...';
    cardDevices.textContent = '...';

    tableBody.innerHTML = `
      <tr class="skeleton-row"><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td></tr>
      <tr class="skeleton-row"><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td></tr>
      <tr class="skeleton-row"><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td></tr>
    `;
  }

  // --- 4. Analytics Processing & Rendering ---
  function processAndRenderDashboard() {
    // Set Total Counter
    cardHits.textContent = abacusCount.toLocaleString();
    cardDatabase.textContent = rawLogs.length.toString();

    // Unique countries
    const countries = new Set();
    rawLogs.forEach(log => {
      if (log.country && log.country !== 'Unknown') {
        countries.add(log.country);
      }
    });
    cardCountries.style.fontSize = countries.size > 9 ? '1.8rem' : '2.2rem';
    cardCountries.textContent = countries.size > 0 ? countries.size.toString() : '1';

    // Device breakdown for stats card
    let mobileCount = 0;
    let desktopCount = 0;
    rawLogs.forEach(log => {
      const dev = log.device || 'Desktop';
      if (dev === 'Mobile' || dev === 'Tablet') mobileCount++;
      else desktopCount++;
    });
    const totalDev = rawLogs.length || 1;
    const mobilePct = Math.round((mobileCount / totalDev) * 100);
    const desktopPct = 100 - mobilePct;
    cardDevices.textContent = `${desktopPct}% / ${mobilePct}%`;

    // Process charts
    renderCharts();

    // Populate search data and table
    filterAndPaginateTable();
  }

  // --- 5. Chart.js Render Engine ---
  function renderCharts() {
    // Chart 1: Trend line (daily visits over last 7 days)
    const dailyMap = {};
    // Seed last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dailyMap[dateStr] = 0;
    }

    rawLogs.forEach(log => {
      const dateStr = new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (typeof dailyMap[dateStr] !== 'undefined') {
        dailyMap[dateStr]++;
      }
    });

    const trendLabels = Object.keys(dailyMap);
    const trendData = Object.values(dailyMap);

    // Chart 2: Device breakdown (Mobile, Desktop, Tablet)
    let desktop = 0, mobile = 0, tablet = 0;
    rawLogs.forEach(log => {
      const dev = log.device || 'Desktop';
      if (dev === 'Mobile') mobile++;
      else if (dev === 'Tablet') tablet++;
      else desktop++;
    });

    // Chart 3: Country Breakdown
    const countryMap = {};
    rawLogs.forEach(log => {
      const c = log.country || 'Unknown';
      countryMap[c] = (countryMap[c] || 0) + 1;
    });
    // Sort and take top 5
    const topCountries = Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const countryLabels = topCountries.map(x => x[0]);
    const countryData = topCountries.map(x => x[1]);

    // Render Trend Chart
    if (trendChartInstance) trendChartInstance.destroy();
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    trendChartInstance = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: [{
          label: 'Visits',
          data: trendData,
          borderColor: '#4facfe',
          backgroundColor: 'rgba(79, 172, 254, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#00f2fe',
          pointBorderColor: '#080f1a',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#8e9bb0' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { 
              color: '#8e9bb0',
              stepSize: 1,
              precision: 0
            }
          }
        }
      }
    });

    // Render Device Chart
    if (deviceChartInstance) deviceChartInstance.destroy();
    const ctxDevice = document.getElementById('deviceChart').getContext('2d');
    deviceChartInstance = new Chart(ctxDevice, {
      type: 'doughnut',
      data: {
        labels: ['Desktop', 'Mobile', 'Tablet'],
        datasets: [{
          data: [desktop, mobile, tablet],
          backgroundColor: ['#4facfe', '#00f2fe', '#f9d423'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8e9bb0', padding: 15 }
          }
        },
        cutout: '70%'
      }
    });

    // Render Country Chart
    if (countryChartInstance) countryChartInstance.destroy();
    const ctxCountry = document.getElementById('countryChart').getContext('2d');
    countryChartInstance = new Chart(ctxCountry, {
      type: 'doughnut',
      data: {
        labels: countryLabels.length > 0 ? countryLabels : ['No Data'],
        datasets: [{
          data: countryData.length > 0 ? countryData : [1],
          backgroundColor: ['#00f2fe', '#38ef7d', '#f9d423', '#ff4e50', '#778da9'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8e9bb0', padding: 15 }
          }
        },
        cutout: '70%'
      }
    });
  }

  // --- 6. Table Search, Filter, & Pagination ---
  searchInput.addEventListener('input', () => {
    currentPage = 1;
    filterAndPaginateTable();
  });

  function filterAndPaginateTable() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (query === '') {
      filteredLogs = [...rawLogs];
    } else {
      filteredLogs = rawLogs.filter(log => {
        const ip = (log.ip || '').toLowerCase();
        const city = (log.city || '').toLowerCase();
        const region = (log.region || '').toLowerCase();
        const country = (log.country || '').toLowerCase();
        const device = (log.device || '').toLowerCase();
        const ref = (log.referrer || '').toLowerCase();
        return ip.includes(query) || 
               city.includes(query) || 
               region.includes(query) || 
               country.includes(query) || 
               device.includes(query) || 
               ref.includes(query);
      });
    }

    renderTableRows();
  }

  function renderTableRows() {
    const totalItems = filteredLogs.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    // Boundary check
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    // Pagination controls state
    btnPrevPage.disabled = currentPage === 1;
    btnNextPage.disabled = currentPage === totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalItems} logs)`;

    // Slice active logs
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageLogs = filteredLogs.slice(startIdx, endIdx);

    if (pageLogs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">No visitor logs found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = '';
    pageLogs.forEach(log => {
      // Format Date
      const visitDate = new Date(log.created_at);
      const timeStr = visitDate.toLocaleString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Format Location
      const city = log.city && log.city !== 'Unknown' ? log.city : '';
      const country = log.country && log.country !== 'Unknown' ? log.country : 'Unknown';
      const locStr = city ? `${city}, ${country}` : country;

      // Geolocation flag emoji (Optional but gorgeous)
      const flagEmoji = getFlagEmoji(log.country);

      // Parse user agent to browser
      const browserInfo = parseUserAgent(log.user_agent);

      // Format Referrer
      const referrer = log.referrer || 'Direct';
      const isDirect = referrer.toLowerCase() === 'direct' || referrer.includes('Direct');
      const refDisplay = isDirect ? 'Direct / Bookmark' : referrer;

      // Check simulated data status
      const isSimulated = log.is_simulated;
      const ipDisplay = isSimulated ? `${log.ip} <span style="font-size: 0.7rem; background: rgba(249, 212, 35, 0.15); color: var(--accent-yellow); padding: 1px 4px; border-radius: 3px; font-family: var(--font-body);">DEMO</span>` : log.ip;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-time">${timeStr}</td>
        <td class="td-ip">${ipDisplay}</td>
        <td>
          <div class="location-badge">
            <span>${flagEmoji}</span>
            <span>${locStr}</span>
          </div>
        </td>
        <td>
          <div class="device-badge ${log.device || 'Desktop'}">
            <span>${log.device === 'Mobile' ? '📱' : log.device === 'Tablet' ? '📟' : '💻'}</span>
            <span>${log.device || 'Desktop'} (${browserInfo.browser})</span>
          </div>
        </td>
        <td>
          <div class="referrer-text" title="${refDisplay}">${refDisplay}</div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  btnPrevPage.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTableRows();
    }
  });

  btnNextPage.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
    if (currentPage < totalPages) {
      currentPage++;
      renderTableRows();
    }
  });

  // --- 7. Utility Parsing Functions ---
  function parseUserAgent(uaString) {
    if (!uaString) return { browser: 'Unknown', os: 'Unknown' };
    
    let browser = 'Unknown';
    let os = 'Unknown';

    // Parse OS
    if (uaString.indexOf('Windows') !== -1) os = 'Windows';
    else if (uaString.indexOf('Macintosh') !== -1 && uaString.indexOf('Mobile') === -1) os = 'macOS';
    else if (uaString.indexOf('iPhone') !== -1 || uaString.indexOf('iPad') !== -1) os = 'iOS';
    else if (uaString.indexOf('Android') !== -1) os = 'Android';
    else if (uaString.indexOf('Linux') !== -1) os = 'Linux';

    // Parse Browser
    if (uaString.indexOf('Chrome') !== -1 && uaString.indexOf('Safari') !== -1 && uaString.indexOf('Edge') === -1 && uaString.indexOf('Edg') === -1) browser = 'Chrome';
    else if (uaString.indexOf('Safari') !== -1 && uaString.indexOf('Chrome') === -1) browser = 'Safari';
    else if (uaString.indexOf('Firefox') !== -1) browser = 'Firefox';
    else if (uaString.indexOf('Edge') !== -1 || uaString.indexOf('Edg') !== -1) browser = 'Edge';
    else if (uaString.indexOf('Trident') !== -1 || uaString.indexOf('MSIE') !== -1) browser = 'IE';
    else if (uaString.indexOf('Opera') !== -1 || uaString.indexOf('OPR') !== -1) browser = 'Opera';

    return { browser, os };
  }

  function getFlagEmoji(countryName) {
    if (!countryName) return '🌐';
    
    const countryMap = {
      'india': '🇮🇳',
      'united states': '🇺🇸',
      'united kingdom': '🇬🇧',
      'canada': '🇨🇦',
      'germany': '🇩🇪',
      'france': '🇫🇷',
      'australia': '🇦🇺',
      'singapore': '🇸🇬',
      'united arab emirates': '🇦🇪'
    };

    const key = countryName.toLowerCase();
    return countryMap[key] || '🌐';
  }


  // --- 9. Toast Notifications ---
  function showToast(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.right = '2rem';
    toast.style.background = 'rgba(15, 28, 48, 0.95)';
    toast.style.border = '1px solid var(--border-glass)';
    toast.style.color = 'var(--text-primary)';
    toast.style.padding = '0.8rem 1.5rem';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = 'var(--shadow-lg)';
    toast.style.zIndex = '99999';
    toast.style.fontSize = '0.9rem';
    toast.style.transition = 'opacity 0.3s ease';
    toast.style.opacity = '0';
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Fade in
    setTimeout(() => { toast.style.opacity = '1'; }, 10);
    
    // Fade out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { toast.remove(); }, 300);
    }, 4000);
  }
});
