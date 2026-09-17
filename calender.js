// ============================================================
// GOOGLE CALENDAR INTEGRATION
// ============================================================
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const API_KEY = 'YOUR_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// ---------- Init ----------
window.addEventListener('load', () => {
  // Wait a moment for the async Google scripts to load
  const checkReady = setInterval(() => {
    if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
      clearInterval(checkReady);
      gapiLoaded();
      gisLoaded();
    }
  }, 200);
});

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [
      'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    ],
  });
  gapiInited = true;
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '',
  });
  gisInited = true;
}

// ---------- Auth ----------
document.getElementById('authBtn').addEventListener('click', () => {
  if (!gapiInited || !gisInited) {
    alert('Google API is still loading. Please try again in a moment.');
    return;
  }

  tokenClient.callback = (resp) => {
    if (resp.error !== undefined) {
      setStatus('Connection failed: ' + resp.error, 'error');
      return;
    }
    setStatus('✅ Connected to Google Calendar', 'connected');
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    tokenClient.requestAccessToken({ prompt: '' });
  }
});

function setStatus(msg, cls) {
  const el = document.getElementById('authStatus');
  el.textContent = msg;
  el.className = 'status ' + (cls || '');
}

function ensureConnected() {
  const token = gapi.client.getToken();
  if (!token) {
    alert('Please connect to Google Calendar first.');
    return false;
  }
  return true;
}

// ---------- Sync Classes ----------
document.getElementById('syncClassesBtn').addEventListener('click', syncClasses);

async function syncClasses() {
  if (!gapiInited) {
    alert('Google API not ready.');
    return;
  }
  if (!ensureConnected()) return;

  const classes = JSON.parse(localStorage.getItem('classes')) || [];
  if (classes.length === 0) {
    alert('No classes added yet.');
    return;
  }

  // Find the next occurrence of a given weekday
  function nextDateForDay(dayCode) {
    const map = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
    const today = new Date();
    const target = map[dayCode];
    const diff = (target - today.getDay() + 7) % 7;
    const d = new Date(today);
    d.setDate(today.getDate() + diff);
    return d;
  }

  for (const c of classes) {
    const baseDate = nextDateForDay(c.day);

    const [sh, sm] = c.start.split(':');
    const [eh, em] = c.end.split(':');

    const startDate = new Date(baseDate);
    startDate.setHours(parseInt(sh), parseInt(sm), 0, 0);

    const endDate = new Date(baseDate);
    endDate.setHours(parseInt(eh), parseInt(em), 0, 0);

    const event = {
      summary: c.name,
      location: c.location || '',
      description: 'Campus class added from Daily Planner',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${c.day}`],
    };

    try {
      await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
    } catch (err) {
      console.error('Failed to add class:', c.name, err);
    }
  }

  alert('✅ All classes synced to your Google Calendar!');
}
