/* ==========================================
   ALPHAFLOW CRM INTERACTIVE LOGIC
   ========================================== */

import { createClient } from '@supabase/supabase-js';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCalculator();
  initAuditModal();
  initQuiz();
  initSimulator();
  initVoiceAgentWidget();
  initFAQ();
  initScrollAnimations();
  initLeadCaptureForms();
  initAdminPanel();
});

const LEAD_EMAIL = 'princg86@gmail.com';
const LEAD_STORAGE_KEY = 'alphaflow_leads';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://inmfghpihwbyuqzygxmj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Xo5IW8RCwDUJi2YlQw7F9A_H8rzAT8v';
const SUPABASE_LEADS_TABLE = 'leads';

const supabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

const ADMIN_USER_MAP = {
  princg: 'princg@alphaflowcrm.com'
};

/* 1. Navbar Scroll Effect & Mobile Menu */
function initNavbar() {
  const nav = document.getElementById('main-nav');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!nav) return;

  // Change navbar opacity and border on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.style.backgroundColor = 'rgba(9, 11, 16, 0.9)';
      nav.style.backdropFilter = 'blur(16px)';
      nav.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    } else {
      nav.style.backgroundColor = 'rgba(9, 11, 16, 0.7)';
      nav.style.backdropFilter = 'blur(12px)';
      nav.style.borderColor = 'rgba(255, 255, 255, 0.04)';
    }
  });

  // Mobile menu toggle
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const active = mobileMenuBtn.classList.toggle('active');
      mobileMenu.style.display = active ? 'block' : 'none';
    });

    // Close menu when clicking links
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.style.display = 'none';
      });
    });
  }
}

/* KI-Rezeptionist LiveKit Widget */
function initVoiceAgentWidget() {
  const widget = document.getElementById('voice-agent-widget');
  const connectBtn = document.getElementById('voice-connect-btn');
  const disconnectBtn = document.getElementById('voice-disconnect-btn');
  const statusEl = document.getElementById('voice-status');
  const transcriptEl = document.getElementById('voice-transcript');
  const mascotEl = document.getElementById('voice-mascot');

  if (!widget || !connectBtn || !disconnectBtn || !statusEl || !transcriptEl || !mascotEl) return;

  let room = null;
  let audioContext = null;
  let analyser = null;
  let animationFrame = 0;
  let speakingTimeout = 0;
  let demoTimers = [];
  let demoMode = false;
  let suppressDisconnectNotice = false;
  let liveConnected = false;
  let LiveKitRoom = null;
  let LiveKitRoomEvent = null;

  const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://livekit.alphaflowcrm.com';
  const tokenEndpoint = import.meta.env.VITE_LIVEKIT_TOKEN_ENDPOINT || 'https://livekit.alphaflowcrm.com/api/livekit/token';

  async function generateToken() {
    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: 'alphaflow-demo',
        identity: 'web-user-' + Math.random().toString(36).substr(2, 8),
      }),
    });
    if (!res.ok) throw new Error('Token request failed: ' + res.status);
    const data = await res.json();
    return data.token;
  }

  function setWidgetState(state, message) {
    const statusText = {
      idle: 'Bereit',
      connecting: 'Verbinde...',
      listening: 'Hört zu...',
      speaking: 'Emma spricht',
      error: message || 'Verbindungsfehler'
    };

    statusEl.textContent = statusText[state] || statusText.idle;
    statusEl.className = `voice-status ${state}`;
    mascotEl.className = `voice-mascot ${state}`;
    connectBtn.disabled = state !== 'idle' && state !== 'error';
    disconnectBtn.disabled = state === 'idle' || state === 'error';
  }

  function addTranscript(text, who = 'system') {
    const line = document.createElement('div');
    line.className = `voice-line ${who}`;
    line.textContent = `${who === 'agent' ? 'Emma: ' : who === 'user' ? 'Sie: ' : ''}${text}`;
    transcriptEl.appendChild(line);
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
  }

  function cleanupAudio() {
    cancelAnimationFrame(animationFrame);
    clearTimeout(speakingTimeout);
    const audioEl = document.getElementById('agent-audio');
    if (audioEl) audioEl.remove();
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    analyser = null;
  }

  function clearDemoMode() {
    demoMode = false;
    demoTimers.forEach(timer => window.clearTimeout(timer));
    demoTimers = [];
  }

  function scheduleDemoStep(delay, action) {
    const timer = window.setTimeout(action, delay);
    demoTimers.push(timer);
  }

  function startFallbackDemo(error) {
    if (liveConnected) return;
    clearDemoMode();
    demoMode = true;
    const reason = error instanceof Error ? error.message : 'Live-Verbindung nicht erreichbar';

    setWidgetState('speaking');
    addTranscript('Die Live-Verbindung ist momentan nicht erreichbar. Emma zeigt den Ablauf im Demo-Modus.', 'system');
    addTranscript(`Technischer Hinweis: ${reason}`, 'system');

    scheduleDemoStep(900, () => {
      if (!demoMode) return;
      addTranscript('Guten Tag, hier ist Emma von AlphaflowCRM. Wie kann ich Ihnen weiterhelfen?', 'agent');
      setWidgetState('listening');
    });

    scheduleDemoStep(3200, () => {
      if (!demoMode) return;
      addTranscript('Ich interessiere mich für eine Beratung und möchte wissen, ob sich Automatisierung für meinen Betrieb lohnt.', 'user');
      setWidgetState('speaking');
    });

    scheduleDemoStep(5200, () => {
      if (!demoMode) return;
      addTranscript('Sehr gerne. Ich erfasse kurz Ihr Anliegen, qualifiziere die Anfrage und bereite einen passenden Termin vor.', 'agent');
      setWidgetState('listening');
    });

    scheduleDemoStep(7600, () => {
      if (!demoMode) return;
      addTranscript('Perfekt, ich habe die Anfrage strukturiert und würde sie nun an das CRM übergeben.', 'agent');
      setWidgetState('listening');
    });
  }

  function setupAudioAnalyser(activeRoom) {
    activeRoom.on(LiveKitRoomEvent.TrackSubscribed, track => {
      if (track.kind !== 'audio') return;

      const audioEl = track.attach();
      audioEl.id = 'agent-audio';
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);

      try {
        audioContext = audioContext || new AudioContext();
        const source = audioContext.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const detect = () => {
          if (!room || !analyser) return;
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

          if (avg > 15) {
            setWidgetState('speaking');
            clearTimeout(speakingTimeout);
            speakingTimeout = window.setTimeout(() => setWidgetState('listening'), 800);
          }

          animationFrame = requestAnimationFrame(detect);
        };
        detect();
      } catch {
        setWidgetState('listening');
      }
    });

    activeRoom.on(LiveKitRoomEvent.TrackUnsubscribed, track => {
      if (track.kind === 'audio') cleanupAudio();
    });
  }

  async function connect() {
    try {
      liveConnected = false;
      clearDemoMode();
      setWidgetState('connecting');
      addTranscript('Verbindung zu Emma wird aufgebaut...', 'system');
      if (!LiveKitRoom || !LiveKitRoomEvent) {
        const livekit = await import('livekit-client');
        LiveKitRoom = livekit.Room;
        LiveKitRoomEvent = livekit.RoomEvent;
      }

      const res = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: 'alphaflow-demo',
          participantName: `web-user-${Date.now()}`
        })
      });

      if (!res.ok) throw new Error(`Token-Endpunkt nicht erreichbar (${res.status})`);
      const { token, error } = await res.json();
      if (error || !token) throw new Error(error || 'Kein LiveKit-Token erhalten');

      room = new LiveKitRoom({ adaptiveStream: true, dynacast: true });

      room.on(LiveKitRoomEvent.Disconnected, () => {
        cleanupAudio();
        if (suppressDisconnectNotice) {
          suppressDisconnectNotice = false;
          return;
        }
        if (demoMode) return;
        room = null;
        setWidgetState('idle');
        addTranscript('Verbindung getrennt.', 'system');
      });

      room.on(LiveKitRoomEvent.TranscriptionReceived, (segments, participant) => {
        const isAgent = participant?.identity !== room?.localParticipant.identity;
        segments.forEach(segment => {
          if (segment.text) addTranscript(segment.text, isAgent ? 'agent' : 'user');
        });
      });

      setupAudioAnalyser(room);
      suppressDisconnectNotice = true;
      await room.connect(livekitUrl, token);
      liveConnected = true;
      suppressDisconnectNotice = false;
      await room.localParticipant.setMicrophoneEnabled(true);

      setWidgetState('listening');
      addTranscript('Verbunden mit Emma. Sprechen Sie jetzt ins Mikrofon.', 'system');
    } catch (error) {
      cleanupAudio();
      if (room) {
        suppressDisconnectNotice = true;
        room.disconnect();
        room = null;
      }
      liveConnected = false;
      startFallbackDemo(error);
    }
  }

  function disconnect() {
    clearDemoMode();
    liveConnected = false;
    cleanupAudio();
    if (room) {
      room.disconnect();
      room = null;
    }
    setWidgetState('idle');
  }

  connectBtn.addEventListener('click', connect);
  disconnectBtn.addEventListener('click', disconnect);
  window.addEventListener('beforeunload', disconnect);
}

/* Lead capture: sends static-site form submissions by email and keeps a local fallback. */
function initLeadCaptureForms() {
  const forms = document.querySelectorAll('.lead-capture-form');
  if (!forms.length) return;

  forms.forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      const originalLabel = submitButton ? submitButton.textContent : '';
      const lead = buildLeadFromForm(form);

      saveLeadLocally(lead);

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Wird gesendet...';
      }

      try {
        try {
          await saveLeadToSupabase(lead);
        } catch (supabaseError) {
          console.warn('Supabase lead save failed:', supabaseError);
        }
        await sendLeadByEmail(lead);
        alert('Vielen Dank! Ihre Anfrage wurde versendet. Wir melden uns innerhalb von 24 Stunden.');
        form.reset();
      } catch {
        alert('Danke! Ihre Anfrage wurde lokal vorgemerkt. Falls keine E-Mail ankommt, bitte kurz direkt an princg86@gmail.com schreiben.');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
      }
    });
  });
}

function buildLeadFromForm(form) {
  const data = new FormData(form);
  const lead = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    source: form.dataset.leadSource || 'Website',
    page: window.location.href,
    name: data.get('name') || '',
    company: data.get('company') || '',
    email: data.get('email') || '',
    phone: data.get('phone') || '',
    message: data.get('message') || '',
    auditSummary: data.get('audit_summary') || ''
  };

  if (!lead.auditSummary) {
    const summaryInput = document.getElementById('audit-result-summary');
    lead.auditSummary = summaryInput ? summaryInput.value : '';
  }

  return lead;
}

async function saveLeadToSupabase(lead) {
  if (!supabase) return;

  const { error } = await supabase.from(SUPABASE_LEADS_TABLE).insert({
    id: lead.id,
    created_at: lead.createdAt,
    source: lead.source,
    page: lead.page,
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    message: lead.message,
    audit_summary: lead.auditSummary,
    status: 'new'
  });

  if (error) throw error;
}

async function sendLeadByEmail(lead) {
  const payload = new FormData();
  payload.append('_subject', `Neuer Alphaflow Lead: ${lead.source}`);
  payload.append('_template', 'table');
  payload.append('_captcha', 'false');
  payload.append('Quelle', lead.source);
  payload.append('Zeitpunkt', new Date(lead.createdAt).toLocaleString('de-DE'));
  payload.append('Name', lead.name);
  payload.append('Firma', lead.company);
  payload.append('E-Mail', lead.email);
  payload.append('Telefon', lead.phone);
  payload.append('Nachricht', lead.message);
  payload.append('Audit-Ergebnis', lead.auditSummary);
  payload.append('Seite', lead.page);

  const response = await fetch(`https://formsubmit.co/ajax/${LEAD_EMAIL}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: payload
  });

  if (!response.ok) throw new Error('Lead email failed');
  try {
    const result = await response.json();
    if (result.success === false) throw new Error('Lead email rejected');
  } catch {
    // FormSubmit can answer with non-JSON in some confirmation states. HTTP 2xx is enough here.
  }
}

function getStoredLeads() {
  try {
    return JSON.parse(localStorage.getItem(LEAD_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLeadLocally(lead) {
  const leads = getStoredLeads();
  leads.unshift(lead);
  localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(leads.slice(0, 250)));
}

function initAdminPanel() {
  const adminRoot = document.getElementById('admin-leads-root');
  if (!adminRoot) return;

  const tableBody = document.getElementById('admin-leads-body');
  const emptyState = document.getElementById('admin-empty-state');
  const countEl = document.getElementById('admin-lead-count');
  const exportBtn = document.getElementById('admin-export-csv');
  const refreshBtn = document.getElementById('admin-refresh-leads');
  const clearBtn = document.getElementById('admin-clear-leads');
  const loginForm = document.getElementById('admin-login-form');
  const loginUsername = document.getElementById('admin-login-username');
  const loginPassword = document.getElementById('admin-login-password');
  const logoutBtn = document.getElementById('admin-logout-btn');
  const authTitle = document.getElementById('admin-auth-title');
  const authDesc = document.getElementById('admin-auth-desc');
  const isFileProtocol = window.location.protocol === 'file:';

  let currentLeads = getStoredLeads();

  async function loadLeads() {
    currentLeads = getStoredLeads();

    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      updateAdminAuthUi(session);

      if (session) {
        const { data, error } = await supabase
          .from(SUPABASE_LEADS_TABLE)
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) currentLeads = data.map(normalizeSupabaseLead);
        if (error) {
          emptyState.textContent = 'Supabase-Leads konnten nicht geladen werden. Prüfe Tabelle, RLS-Policy und Admin-Login.';
        }
      }
    }

    render(currentLeads);
  }

  function render(leads) {
    countEl.textContent = leads.length.toString();
    emptyState.classList.toggle('hidden', leads.length > 0);
    tableBody.innerHTML = '';

    leads.forEach(lead => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(new Date(lead.createdAt).toLocaleString('de-DE'))}</td>
        <td>${escapeHtml(lead.name)}</td>
        <td>${escapeHtml(lead.company)}</td>
        <td><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></td>
        <td>${escapeHtml(lead.phone)}</td>
        <td>${escapeHtml(lead.source)}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  function updateAdminAuthUi(session) {
    if (!loginForm || !logoutBtn || !authTitle || !authDesc) return;
    const loggedIn = Boolean(session);
    loginForm.classList.toggle('hidden', loggedIn);
    logoutBtn.classList.toggle('hidden', !loggedIn);
    authTitle.textContent = loggedIn ? `Angemeldet als ${session.user.email}` : 'Benutzername + Passwort';
    if (loggedIn) {
      authDesc.textContent = 'Supabase-Leads werden zentral geladen.';
      return;
    }

    authDesc.textContent = isFileProtocol
      ? 'Hinweis: Diese Seite wurde per file:// geöffnet. Bitte über Domain oder localhost öffnen, sonst kann Supabase den Login blockieren.'
      : 'Melde dich mit Benutzername und Passwort an, um Supabase-Leads zu laden.';
  }

  if (loginForm && supabase) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const username = loginUsername.value.trim();
      const password = loginPassword.value;
      const email = resolveAdminEmail(username);

      if (!email || !password) return;

      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        alert(error ? `Login fehlgeschlagen: ${error.message}` : 'Login erfolgreich.');
        if (!error) await loadLeads();
      } catch (networkError) {
        console.error('Admin login network error:', networkError);
        const help = isFileProtocol
          ? 'Öffne das Admin-Panel über https://alphaflowcrm.com/admin.html oder einen lokalen Server (nicht file://).'
          : 'Prüfe Internetverbindung, Browser-Blocker und ob die Supabase-URL erreichbar ist.';
        alert(`Login fehlgeschlagen: Netzwerkfehler (Failed to fetch). ${help}`);
      }
    });
  }

  if (logoutBtn && supabase) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      await loadLeads();
    });
  }

  if (refreshBtn) refreshBtn.addEventListener('click', loadLeads);

  exportBtn.addEventListener('click', () => {
    const csv = leadsToCsv(currentLeads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alphaflow-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('Lokale Lead-Liste wirklich löschen?')) return;
    localStorage.removeItem(LEAD_STORAGE_KEY);
    loadLeads();
  });

  if (supabase) {
    supabase.auth.onAuthStateChange(() => loadLeads());
  }

  loadLeads();
}

function resolveAdminEmail(username) {
  const normalized = String(username || '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized.includes('@')) return normalized;
  return ADMIN_USER_MAP[normalized] || `${normalized}@alphaflowcrm.com`;
}

function normalizeSupabaseLead(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    source: row.source,
    page: row.page,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    message: row.message,
    auditSummary: row.audit_summary
  };
}

function leadsToCsv(leads) {
  const headers = ['Zeitpunkt', 'Name', 'Firma', 'E-Mail', 'Telefon', 'Quelle', 'Nachricht', 'Audit-Ergebnis', 'Seite'];
  const rows = leads.map(lead => [
    lead.createdAt,
    lead.name,
    lead.company,
    lead.email,
    lead.phone,
    lead.source,
    lead.message,
    lead.auditSummary,
    lead.page
  ]);
  return [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
}

function csvEscape(value) {
  return `"${String(value || '').replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

/* 2. Interactive Revenue Loss Calculator */
function initCalculator() {
  const calcIndustry = document.getElementById('calc-industry');
  const calcRevenue = document.getElementById('calc-revenue');
  const calcRevenueVal = document.getElementById('calc-revenue-val');
  const calcCustomerVal = document.getElementById('calc-customer-val');
  const calcCustomerValDisplay = document.getElementById('calc-customer-val-display');

  const calcLossDay = document.getElementById('calc-loss-day');
  const calcLossYear = document.getElementById('calc-loss-year');

  const breakReact = document.getElementById('calc-break-react');
  const breakReview = document.getElementById('calc-break-review');
  const breakCalls = document.getElementById('calc-break-calls');
  const breakChats = document.getElementById('calc-break-chats');
  const breakWeb = document.getElementById('calc-break-web');

  const barReact = document.getElementById('calc-bar-react');
  const barReview = document.getElementById('calc-bar-review');
  const barCalls = document.getElementById('calc-bar-calls');
  const barChats = document.getElementById('calc-bar-chats');
  const barWeb = document.getElementById('calc-bar-web');

  if (!calcRevenue || !calcLossDay) return;

  function calculate() {
    const revenue = parseInt(calcRevenue.value);
    const customerVal = parseInt(calcCustomerVal.value);
    const selectedOpt = calcIndustry.options[calcIndustry.selectedIndex];
    const lossFactor = parseFloat(selectedOpt.getAttribute('data-loss-factor') || '1.0');

    // Update UI text labels
    calcRevenueVal.textContent = revenue.toLocaleString('de-DE') + ' €';
    calcCustomerValDisplay.textContent = customerVal.toLocaleString('de-DE') + ' €';

    // Math: Assume average baseline revenue leakage of 17.5% of total potential revenue
    // Leakage rate = 0.175 * lossFactor
    const leakageRate = 0.175 * lossFactor;
    const yearlyLoss = Math.round(revenue * 12 * leakageRate);
    const dailyLoss = Math.round(yearlyLoss / 365);

    // Animate the main loss counters
    animateValue(calcLossDay, dailyLoss, '- ', ' €');
    animateValue(calcLossYear, yearlyLoss, '- ', ' €');

    // Breakdown distribution (1: Reactivation 63%, 2: Review 17%, 3: Calls 9%, 4: Chats 9%, 5: Web 6%)
    const reactVal = Math.round(yearlyLoss * 0.63);
    const reviewVal = Math.round(yearlyLoss * 0.17);
    const callsVal = Math.round(yearlyLoss * 0.09);
    const chatsVal = Math.round(yearlyLoss * 0.09);
    const webVal = Math.round(yearlyLoss * 0.06);

    breakReact.textContent = reactVal.toLocaleString('de-DE') + ' €';
    breakReview.textContent = reviewVal.toLocaleString('de-DE') + ' €';
    breakCalls.textContent = callsVal.toLocaleString('de-DE') + ' €';
    breakChats.textContent = chatsVal.toLocaleString('de-DE') + ' €';
    breakWeb.textContent = webVal.toLocaleString('de-DE') + ' €';

    // Set widths of visual bars
    barReact.style.width = '63%';
    barReview.style.width = '17%';
    barCalls.style.width = '9%';
    barChats.style.width = '9%';
    barWeb.style.width = '6%';
  }

  // Helper function to animate numbers counting up/down smoothly
  function animateValue(obj, endVal, prefix = '', suffix = '') {
    let startVal = parseInt(obj.textContent.replace(/[^0-9]/g, '')) || 0;
    if (startVal === endVal) return;
    
    const duration = 400; // ms
    const startTime = performance.now();
    
    function updateNumber(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      const currentVal = Math.round(startVal + (endVal - startVal) * easeProgress);
      
      obj.textContent = prefix + currentVal.toLocaleString('de-DE') + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        obj.textContent = prefix + endVal.toLocaleString('de-DE') + suffix;
      }
    }
    requestAnimationFrame(updateNumber);
  }

  // Event Listeners
  calcIndustry.addEventListener('change', calculate);
  calcRevenue.addEventListener('input', calculate);
  calcCustomerVal.addEventListener('input', calculate);

  // Initial calculation
  calculate();
}

/* 3. Interactive Diagnostic Quick-Audit Quiz */
function initAuditModal() {
  const modal = document.getElementById('audit-quiz');
  const openTriggers = document.querySelectorAll('.js-audit-open, a[href="#audit-quiz"]');
  const closeTriggers = document.querySelectorAll('[data-audit-close]');
  const bookButton = document.getElementById('quiz-book-btn');

  if (!modal) return;

  function openAudit(event) {
    if (event) event.preventDefault();
    modal.classList.remove('reveal', 'active');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('audit-modal-open');
  }

  function closeAudit() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('audit-modal-open');
  }

  openTriggers.forEach(trigger => trigger.addEventListener('click', openAudit));
  closeTriggers.forEach(trigger => trigger.addEventListener('click', closeAudit));
  if (bookButton) {
    bookButton.addEventListener('click', event => {
      event.preventDefault();
      closeAudit();
      document.querySelector('#kontakt-form')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeAudit();
  });

  if (window.location.hash === '#audit-quiz') openAudit();
}

const QUIZ_QUESTIONS = [
  {
    pillar: 'Säule 01: Datenbank-Reaktivierung',
    question: 'Wie systematisch reaktivieren Sie frühere Kunden für Folgeaufträge, Empfehlungen oder saisonale Angebote?',
    options: [
      { text: 'Gar nicht oder nur selten. Kundendaten liegen verstreut in Rechnungen, Excel oder E-Mail.', score: 0, pillarId: 'react' },
      { text: 'Gelegentlich mit generischen Newslettern oder manuellen Nachrichten.', score: 50, pillarId: 'react' },
      { text: 'Regelmäßig mit personalisierten, automatisierten CRM-Kampagnen.', score: 100, pillarId: 'react' }
    ]
  },
  {
    pillar: 'Säule 02: Reputation',
    question: 'Wie aktiv gewinnen, beantworten und nutzen Sie Google-Bewertungen?',
    options: [
      { text: 'Wir fragen kaum aktiv nach Bewertungen und reagieren nicht zuverlässig.', score: 0, pillarId: 'review' },
      { text: 'Wir bitten gelegentlich manuell um Bewertungen und antworten innerhalb weniger Tage.', score: 50, pillarId: 'review' },
      { text: 'Automatisierte Bewertungsanfragen, schnelle Antworten und sichtbare Review-Widgets sind eingerichtet.', score: 100, pillarId: 'review' }
    ]
  },
  {
    pillar: 'Säule 03: Anruf-Management',
    question: 'Was passiert mit eingehenden Anrufen während Terminen, nach Feierabend oder am Wochenende?',
    options: [
      { text: 'Viele Anrufe landen auf der Mailbox, Rückruf oft erst Stunden später oder am Folgetag.', score: 0, pillarId: 'calls' },
      { text: 'Wir nehmen die meisten Anrufe an, verpassen im Alltag aber regelmäßig Chancen.', score: 50, pillarId: 'calls' },
      { text: '24/7 Annahme, Qualifizierung, Sofort-Rückruf oder direkte Terminbuchung ist vorhanden.', score: 100, pillarId: 'calls' }
    ]
  },
  {
    pillar: 'Säule 04: Omnichannel-Kommunikation',
    question: 'Wie schnell reagieren Sie auf Leads über WhatsApp, Website-Chat, Social Media, SMS oder E-Mail?',
    options: [
      { text: 'Unregelmäßig. Nachrichten liegen auf mehreren Geräten und Kanälen verstreut.', score: 0, pillarId: 'chats' },
      { text: 'Manuell innerhalb einiger Stunden oder am nächsten Werktag.', score: 50, pillarId: 'chats' },
      { text: 'Alle Kanäle laufen zentral zusammen, mit Sofortantwort und automatischer Nachverfolgung.', score: 100, pillarId: 'chats' }
    ]
  },
  {
    pillar: 'Säule 05: Website Conversion',
    question: 'Wie gut wandelt Ihre Website Besucher in messbare Anfragen und Termine um?',
    options: [
      { text: 'Sie ist eher eine digitale Visitenkarte ohne starke Conversion-Elemente.', score: 0, pillarId: 'web' },
      { text: 'Kontaktformular und mobile Darstellung sind vorhanden, Follow-up ist aber manuell.', score: 50, pillarId: 'web' },
      { text: 'Online-Buchung, CRM-Integration, mobile Optimierung und automatisierte Follow-ups sind aktiv.', score: 100, pillarId: 'web' }
    ]
  }
];

const PILLAR_META = {
  react: { label: 'Datenbank-Reaktivierung', icon: '📁' },
  review: { label: 'Reputation', icon: '⭐' },
  calls: { label: 'Anruf-Management', icon: '📞' },
  chats: { label: 'Omnichannel-Kommunikation', icon: '💬' },
  web: { label: 'Website Conversion', icon: '🌐' }
};

function initQuiz() {
  const quizWelcome = document.getElementById('quiz-welcome');
  const quizStartBtn = document.getElementById('quiz-start-btn');
  const quizQuestionContainer = document.getElementById('quiz-question-container');
  const quizResult = document.getElementById('quiz-result');

  const quizProgressText = document.getElementById('quiz-progress-text');
  const quizPercent = document.getElementById('quiz-percent');
  const quizProgressBar = document.getElementById('quiz-progress-bar');

  const quizQPillar = document.getElementById('quiz-q-pillar');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptions = document.getElementById('quiz-options');

  const quizCircleProgress = document.getElementById('quiz-circle-progress');
  const quizScoreVal = document.getElementById('quiz-score-val');
  const quizScoreTier = document.getElementById('quiz-score-tier');
  const quizScoreDesc = document.getElementById('quiz-score-desc');

  const quizWeakIcon = document.getElementById('quiz-weak-icon');
  const quizWeakTitle = document.getElementById('quiz-weak-title');
  const quizWeakDesc = document.getElementById('quiz-weak-desc');

  const quizRestartAction = document.getElementById('quiz-restart-action');
  const auditTotalPotential = document.getElementById('audit-total-potential');
  const auditPriorityWindow = document.getElementById('audit-priority-window');
  const auditPriorityDesc = document.getElementById('audit-priority-desc');
  const auditBreakdownList = document.getElementById('audit-breakdown-list');
  const auditBars = document.getElementById('audit-bars');
  const auditRecommendations = document.getElementById('audit-recommendations');
  const auditResultForm = document.getElementById('audit-result-form');
  const auditResultSummary = document.getElementById('audit-result-summary');

  if (!quizStartBtn) return;

  let currentQuestionIdx = 0;
  let totalScore = 0;
  // Keep track of scores per pillar to identify the weakest one
  let pillarScores = {
    calls: 0,
    review: 0,
    react: 0,
    chats: 0,
    web: 0
  };

  quizStartBtn.addEventListener('click', startQuiz);
  quizRestartAction.addEventListener('click', restartQuiz);

  function startQuiz() {
    quizWelcome.classList.add('hidden');
    quizResult.classList.add('hidden');
    quizQuestionContainer.classList.remove('hidden');
    currentQuestionIdx = 0;
    totalScore = 0;
    pillarScores = { calls: 0, review: 0, react: 0, chats: 0, web: 0 };
    quizCircleProgress.style.strokeDashoffset = 390;
    showQuestion();
  }

  function showQuestion() {
    const q = QUIZ_QUESTIONS[currentQuestionIdx];
    
    // Progress
    const totalQ = QUIZ_QUESTIONS.length;
    const progressPercent = Math.round((currentQuestionIdx / totalQ) * 100);
    quizProgressText.textContent = `Frage ${currentQuestionIdx + 1} von ${totalQ}`;
    quizPercent.textContent = `${progressPercent}% abgeschlossen`;
    quizProgressBar.style.width = `${progressPercent}%`;

    // Content
    quizQPillar.textContent = q.pillar;
    quizQuestionText.textContent = q.question;

    // Render options
    quizOptions.innerHTML = '';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      const label = document.createElement('span');
      const arrow = document.createElement('span');
      label.textContent = opt.text;
      arrow.textContent = '➔';
      btn.append(label, arrow);
      btn.addEventListener('click', () => handleAnswer(opt.score, opt.pillarId));
      quizOptions.appendChild(btn);
    });
  }

  function handleAnswer(score, pillarId) {
    totalScore += score;
    pillarScores[pillarId] = score;

    currentQuestionIdx++;
    if (currentQuestionIdx < QUIZ_QUESTIONS.length) {
      showQuestion();
    } else {
      showResult();
    }
  }

  function showResult() {
    quizQuestionContainer.classList.add('hidden');
    quizResult.classList.remove('hidden');

    // Circular progress SVG animation
    // Radius = 62, Circumference = 2 * Math.PI * 62 = 389.55 (roughly 390)
    // Stroke-dashoffset corresponds to the unfilled part.
    // Score is out of 500. E.g. score = 250 -> percentage = 50% -> offset = 390 * (1 - 0.5)
    const percentage = totalScore / 500;
    const offset = 390 * (1 - percentage);
    
    // Animate score number
    animateScoreCounter(quizScoreVal, totalScore);
    
    // Animate circle SVG (slight timeout for transition to render)
    setTimeout(() => {
      quizCircleProgress.style.strokeDashoffset = offset;
    }, 100);

    // Determine Tier
    let tierText = '';
    let tierDesc = '';
    const averageScore = totalScore / 5;
    if (averageScore <= 40) {
      tierText = 'Befund: Kritisch (Akuter Handlungsbedarf)';
      tierDesc = 'Mehrere Kernprozesse arbeiten noch nicht zuverlässig. Laut Audit-Logik sollten diese Lücken innerhalb von 30 Tagen geschlossen werden.';
    } else if (averageScore <= 60) {
      tierText = 'Befund: Fair (Substanzieller Umsatzverlust)';
      tierDesc = 'Die Grundlagen sind teilweise vorhanden, aber Automatisierung, Reaktionszeit und Nachverfolgung lassen noch deutlich messbares Potenzial liegen.';
    } else if (averageScore <= 80) {
      tierText = 'Befund: Gut (Optimierbare Wachstumshebel)';
      tierDesc = 'Ihr Betrieb hat eine solide Basis. Die größten Gewinne liegen jetzt in konsequenter Automatisierung und sauberer Messbarkeit.';
    } else {
      tierText = 'Befund: Exzellent (Feintuning & Skalierung)';
      tierDesc = 'Ihre Systeme sind stark. Jetzt geht es um Monitoring, Optimierung und weitere Conversion-Verbesserungen.';
    }
    quizScoreTier.textContent = tierText;
    quizScoreDesc.textContent = tierDesc;

    const impact = calculateAuditImpact(pillarScores);

    // Identify priority pillar by lowest score, using revenue impact as tie-breaker.
    let weakestPillar = 'calls';
    let lowestPillarScore = 999;
    for (const [key, value] of Object.entries(pillarScores)) {
      if (value < lowestPillarScore || (value === lowestPillarScore && impact.breakdown[key] > impact.breakdown[weakestPillar])) {
        lowestPillarScore = value;
        weakestPillar = key;
      }
    }

    // Weakness Card display
    renderAuditImpact(impact, weakestPillar, lowestPillarScore);

    let weakIcon = '📁';
    let weakTitle = 'Säule 01: Datenbank-Reaktivierung';
    let weakDesc = 'Ihr größtes Kapital liegt brach: Frühere Kunden werden nicht systematisch erneut angesprochen. Automatisierte E-Mail- und SMS-Kampagnen können hier schnell Umsatz aktivieren.';

    switch (weakestPillar) {
      case 'react':
        weakIcon = '📁';
        weakTitle = 'Säule 01: Datenbank-Reaktivierung';
        weakDesc = 'Ihr größtes Kapital liegt brach: Frühere Kunden werden nicht systematisch erneut angesprochen. Automatisierte E-Mail- und SMS-Kampagnen können hier schnell Umsatz aktivieren.';
        break;
      case 'review':
        weakIcon = '⭐';
        weakTitle = 'Säule 02: Reputation';
        weakDesc = 'Bewertungen beeinflussen Vertrauen, Google-Auswahl und Preisdruck. Ein automatisches Bewertungssystem nach Auftragsschluss ist ein direkter Wachstumshebel.';
        break;
      case 'calls':
        weakIcon = '📞';
        weakTitle = 'Säule 03: Anruf-Management';
        weakDesc = 'Jeder verpasste Anruf kann ein verlorener Auftrag sein. Sofort-Rückruf, KI-Sprachassistenz oder 24/7 Qualifizierung sichern mehr Termine.';
        break;
      case 'chats':
        weakIcon = '💬';
        weakTitle = 'Säule 04: Omnichannel-Kommunikation';
        weakDesc = 'Zu langsame Antworten kosten Leads. Ein zentrales Postfach mit Sofortantwort erhöht die Chance, Interessenten zu erreichen, bevor sie beim Wettbewerb landen.';
        break;
      case 'web':
        weakIcon = '🌐';
        weakTitle = 'Säule 05: Website Conversion';
        weakDesc = 'Ihre Website sollte Besucher aktiv in Termine und Anfragen verwandeln. Rechner, Buchung, mobile Geschwindigkeit und CRM-Follow-up schließen diese Lücke.';
        break;
    }

    quizWeakIcon.textContent = weakIcon;
    quizWeakTitle.textContent = weakTitle;
    quizWeakDesc.textContent = weakDesc;
  }

  function getNumber(id, fallback) {
    const input = document.getElementById(id);
    const value = input ? Number(input.value) : fallback;
    return Number.isFinite(value) ? value : fallback;
  }

  function calculateAuditImpact(scores) {
    const monthlyRevenue = getNumber('audit-monthly-revenue', 100000);
    const averageSale = getNumber('audit-average-sale', 800);
    const pastCustomers = getNumber('audit-past-customers', 1000);
    const missedCalls = getNumber('audit-missed-calls', 20);
    const monthlyLeads = getNumber('audit-monthly-leads', 80);
    const websiteVisitors = getNumber('audit-website-visitors', 1000);
    const conversionRate = getNumber('audit-conversion-rate', 2.8) / 100;
    const starRating = getNumber('audit-star-rating', 4.1);

    const gapFactor = key => Math.max(0, (100 - scores[key]) / 100);
    const starGap = Math.max(0, 4.7 - starRating);
    const conversionGap = Math.max(0, 0.052 - conversionRate);

    const breakdown = {
      react: pastCustomers * 0.67 * averageSale * 0.75 * gapFactor('react'),
      review: monthlyRevenue * 12 * 0.05 * starGap * gapFactor('review'),
      calls: missedCalls * averageSale * 12 * gapFactor('calls'),
      chats: monthlyLeads * 0.5 * averageSale * 12 * gapFactor('chats'),
      web: websiteVisitors * conversionGap * averageSale * 12 * gapFactor('web')
    };

    const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
    return { breakdown, total };
  }

  function renderAuditImpact(impact, weakestPillar, weakestScore) {
    auditTotalPotential.textContent = formatEuro(impact.total);
    if (auditResultSummary) {
      auditResultSummary.value = `Score: ${totalScore}/500 | Potenzial/Jahr: ${formatEuro(impact.total)} | Priorität: ${PILLAR_META[weakestPillar].label}`;
    }

    if (weakestScore <= 40) {
      auditPriorityWindow.textContent = '30 Tage';
      auditPriorityDesc.textContent = 'Kritische Umsatzlücke zuerst schließen.';
    } else if (weakestScore <= 60) {
      auditPriorityWindow.textContent = '90 Tage';
      auditPriorityDesc.textContent = 'Mit klarer Priorität automatisieren.';
    } else if (weakestScore <= 80) {
      auditPriorityWindow.textContent = '6 Monate';
      auditPriorityDesc.textContent = 'Bestehende Systeme ausbauen.';
    } else {
      auditPriorityWindow.textContent = 'Optimierung';
      auditPriorityDesc.textContent = 'Monitoring und Feintuning fortführen.';
    }

    auditBreakdownList.innerHTML = '';
    const sortedBreakdown = Object.entries(impact.breakdown)
      .sort(([, a], [, b]) => b - a)
      .filter(([, value]) => value > 0);

    if (sortedBreakdown.length === 0) {
      const row = document.createElement('div');
      row.className = 'audit-breakdown-row';
      row.textContent = 'Keine kritischen Umsatzlücken erkannt.';
      auditBreakdownList.appendChild(row);
    }

    sortedBreakdown.forEach(([key, value]) => {
        const row = document.createElement('div');
        row.className = 'audit-breakdown-row';
        if (key === weakestPillar) row.classList.add('is-weakest');

        const label = document.createElement('span');
        const amount = document.createElement('strong');
        label.textContent = `${PILLAR_META[key].icon} ${PILLAR_META[key].label}`;
        amount.textContent = formatEuro(value);
        row.append(label, amount);
        auditBreakdownList.appendChild(row);
      });

    renderAuditBars(sortedBreakdown, impact.total);
    renderAuditRecommendations(sortedBreakdown);
  }

  function renderAuditBars(sortedBreakdown, totalPotential) {
    if (!auditBars) return;
    auditBars.innerHTML = '';
    if (sortedBreakdown.length === 0) {
      auditBars.textContent = 'Ihre Systeme liegen bereits nahe am Zielwert. Fokus: Monitoring und Feintuning.';
      return;
    }
    const maxValue = Math.max(...sortedBreakdown.map(([, value]) => value), 1);

    sortedBreakdown.forEach(([key, value]) => {
      const row = document.createElement('div');
      const meta = document.createElement('div');
      const label = document.createElement('span');
      const amount = document.createElement('strong');
      const track = document.createElement('div');
      const fill = document.createElement('div');
      const share = totalPotential > 0 ? Math.round((value / totalPotential) * 100) : 0;

      row.className = 'audit-bar-row';
      meta.className = 'audit-bar-meta';
      track.className = 'audit-bar-track';
      fill.className = 'audit-bar-fill';
      label.textContent = `${PILLAR_META[key].icon} ${PILLAR_META[key].label}`;
      amount.textContent = `${formatEuro(value)} · ${share}%`;
      fill.style.width = `${Math.max(6, Math.round((value / maxValue) * 100))}%`;

      meta.append(label, amount);
      track.appendChild(fill);
      row.append(meta, track);
      auditBars.appendChild(row);
    });
  }

  function renderAuditRecommendations(sortedBreakdown) {
    if (!auditRecommendations) return;
    auditRecommendations.innerHTML = '';
    const recommendations = sortedBreakdown.slice(0, 3);
    if (recommendations.length === 0) {
      auditRecommendations.textContent = 'Quartalsweise re-auditen und Conversion-Daten weiter messen.';
      return;
    }

    recommendations.forEach(([key, value], index) => {
      const item = document.createElement('div');
      const number = document.createElement('span');
      const text = document.createElement('div');
      const title = document.createElement('strong');
      const desc = document.createElement('small');

      item.className = 'audit-recommendation';
      number.className = 'audit-step-number';
      number.textContent = index + 1;
      title.textContent = PILLAR_META[key].label;
      desc.textContent = getRecommendationText(key, value);

      text.append(title, desc);
      item.append(number, text);
      auditRecommendations.appendChild(item);
    });
  }

  function getRecommendationText(key, value) {
    const valueText = formatEuro(value);
    const texts = {
      react: `Altkunden segmentieren und eine 90-Tage-Reaktivierung per SMS/E-Mail starten. Potenzial: ${valueText}.`,
      review: `Bewertungsanfragen automatisieren und negative Reviews schneller beantworten. Potenzial: ${valueText}.`,
      calls: `Verpasste Anrufe mit KI-Annahme, Sofort-SMS und Kalenderbuchung absichern. Potenzial: ${valueText}.`,
      chats: `WhatsApp, Social, Chat und E-Mail in eine Inbox bringen und Sofortantworten aktivieren. Potenzial: ${valueText}.`,
      web: `Website mit Buchung, Rechner, CRM-Leadcapture und Follow-up-Sequenzen ausstatten. Potenzial: ${valueText}.`
    };
    return texts[key] || `Diesen Bereich zuerst optimieren. Potenzial: ${valueText}.`;
  }

  function formatEuro(value) {
    return Math.round(value).toLocaleString('de-DE') + ' €';
  }

  function animateScoreCounter(obj, endVal) {
    let startVal = 0;
    const duration = 800; // ms
    const startTime = performance.now();

    function updateScore(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress);
      const currentVal = Math.round(startVal + (endVal - startVal) * easeProgress);
      
      obj.textContent = currentVal;
      
      if (progress < 1) {
        requestAnimationFrame(updateScore);
      } else {
        obj.textContent = endVal;
      }
    }
    requestAnimationFrame(updateScore);
  }

  function restartQuiz() {
    startQuiz();
  }
}

/* 4. Live Phone Simulator Animation Logic */
const SIMULATOR_SCENARIOS = {
  calls: [
    { type: 'system', text: 'Verpasster Anruf von +49 176 99887766 (14:32 Uhr)' },
    { type: 'system', text: 'Alphaflow CRM reagiert nach 45 Sekunden automatisch...' },
    { type: 'received', text: 'Hallo! Wir haben gerade Ihren Anruf verpasst, da wir auf der Baustelle sind. Wie können wir Ihnen helfen? Sie können uns hier direkt schreiben oder einen Rückruftermin buchen: alphaflow.de/termin' },
    { type: 'sent', text: 'Hi! Ich bräuchte ein Angebot für eine Dachreinigung und Beschichtung für mein Einfamilienhaus in Köln.' },
    { type: 'received', text: 'Sehr gerne! Um Ihnen ein passendes Angebot zu machen: Handelt es sich um ein Steildach oder Flachdach? Und wie alt ist die Dacheindeckung etwa?' },
    { type: 'sent', text: 'Steildach, ca. 22 Jahre alt.' },
    { type: 'received', text: 'Perfekt, danke für die Info. Ich habe Thomas direkt Bescheid gegeben. Möchten Sie, dass er Sie morgen um 10:00 Uhr oder um 14:00 Uhr anruft, um Details zu besprechen?' },
    { type: 'sent', text: 'Morgen um 10:00 passt super.' },
    { type: 'received', text: 'Abgemacht! Der Termin steht. Thomas wird Sie morgen um 10:00 Uhr anrufen. Ich schicke Ihnen gleich noch unsere Referenzen per E-Mail. Schönen Tag!' },
    { type: 'system', text: 'Termin in Thomas\' Kalender eingetragen. Lead gesichert & CRM aktualisiert! ✅' }
  ],
  whatsapp: [
    { type: 'sent', text: 'Hallo! Ich suche kurzfristig einen Elektriker für eine Wallbox-Installation. Habt ihr noch Termine frei?' },
    { type: 'system', text: 'Eingang am Sonntag, 11:15 Uhr. AI antwortet sofort...' },
    { type: 'received', text: 'Hallo! Schön, dass Sie sich melden. Ja, wir installieren wöchentlich Wallboxen in der Region. Um Ihnen direkt weiterzuhelfen: Haben Sie die Wallbox bereits gekauft oder benötigen Sie auch Beratung zum Gerät?' },
    { type: 'sent', text: 'Ich brauche auch Beratung zur passenden Wallbox.' },
    { type: 'received', text: 'Kein Problem! Unser Meister Herr Müller berät Sie gerne telefonisch. Senden Sie uns kurz Ihre E-Mail-Adresse, dann schicken wir Ihnen vorab unseren Wallbox-Leitfaden und den Link zur Online-Terminauswahl.' },
    { type: 'sent', text: 'm.schmidt@web.de' },
    { type: 'received', text: 'Klasse, E-Mail ist raus! Sie können Ihren Wunschtermin direkt hier wählen: alphaflow.de/wallbox-beratung. Schönen Sonntag noch!' },
    { type: 'system', text: 'Lead im CRM erfasst, E-Mail-Leitfaden versendet. Terminkalender verknüpft! ✅' }
  ],
  review: [
    { type: 'system', text: 'Auftrag \'Dachsanierung Müller\' im CRM als abgeschlossen markiert.' },
    { type: 'system', text: 'System sendet automatische SMS/WhatsApp nach 24 Stunden...' },
    { type: 'received', text: 'Hallo Herr Müller! Vielen Dank für Ihr Vertrauen in unser Handwerk. Wir hoffen, die neuen Ziegel gefallen Ihnen. Waren Sie mit der Arbeit unserer Jungs zufrieden?' },
    { type: 'sent', text: 'Hallo Thomas! Absolut, die Jungs waren pünktlich, sauber und sehr nett. Sieht super aus.' },
    { type: 'received', text: 'Das freut uns riesig! Wenn Sie uns unterstützen möchten: Ein kurzes Feedback auf Google hilft unserem regionalen Betrieb enorm. Hier ist der direkte Link: g.page/alphaflow/review' },
    { type: 'sent', text: 'Mach ich gerne heute Abend fertig!' },
    { type: 'received', text: 'Tausend Dank, das bedeutet uns viel! Bei weiteren Projekten melden Sie sich einfach direkt über diese Nummer. Liebe Grüße, Thomas' },
    { type: 'system', text: 'Kunde klickt auf Link. 5-Sterne-Bewertung auf Google erfasst! ✅' }
  ]
};

function initSimulator() {
  const container = document.getElementById('phone-chat-messages');
  const chatPartner = document.getElementById('phone-chat-partner');
  const buttons = document.querySelectorAll('.simulator-btn');

  if (!container || buttons.length === 0) return;

  let currentTimeout = null;
  let activeScenario = null;
  let scriptIndex = 0;

  // Set up event listeners for control buttons
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const scenario = btn.getAttribute('data-scenario');
      if (activeScenario === scenario) return;
      
      // Update active button styling
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      runScenario(scenario);
    });
  });

  // Run the default scenario on load
  buttons[0].classList.add('active');
  runScenario(buttons[0].getAttribute('data-scenario'));

  function runScenario(scenarioKey) {
    // Clear any active typing timeouts
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    
    container.innerHTML = '';
    activeScenario = SIMULATOR_SCENARIOS[scenarioKey];
    scriptIndex = 0;

    // Update Header based on scenario
    if (scenarioKey === 'review') {
      chatPartner.textContent = 'Thomas K. (Inhaber)';
    } else {
      chatPartner.textContent = 'Alphaflow Assist';
    }

    playNextMessage();
  }

  function playNextMessage() {
    if (scriptIndex >= activeScenario.length) return;

    const msgData = activeScenario[scriptIndex];
    scriptIndex++;

    if (msgData.type === 'received') {
      // Show typing indicator
      showTypingIndicator();
      
      // Calculate delay based on message length (longer text = longer typing)
      const delay = Math.min(Math.max(msgData.text.length * 15, 1000), 2800);
      
      currentTimeout = setTimeout(() => {
        removeTypingIndicator();
        appendMessage(msgData.type, msgData.text);
        scrollChatToBottom();
        
        // Wait before displaying the next user response
        currentTimeout = setTimeout(playNextMessage, 1200);
      }, delay);
    } else if (msgData.type === 'sent') {
      // Simulating user typing and sending
      currentTimeout = setTimeout(() => {
        appendMessage(msgData.type, msgData.text);
        scrollChatToBottom();
        
        // Wait before AI responds
        currentTimeout = setTimeout(playNextMessage, 1000);
      }, 1500);
    } else {
      // System message
      currentTimeout = setTimeout(() => {
        appendMessage(msgData.type, msgData.text);
        scrollChatToBottom();
        playNextMessage();
      }, 800);
    }
  }

  function showTypingIndicator() {
    removeTypingIndicator(); // Ensure no duplicates
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'chat-typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(indicator);
    scrollChatToBottom();
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('chat-typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  function appendMessage(type, text) {
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.textContent = text;
    container.appendChild(div);
  }

  function scrollChatToBottom() {
    container.scrollTop = container.scrollHeight;
  }
}

/* 5. Interactive FAQ Accordion */
function initFAQ() {
  const triggers = document.querySelectorAll('.faq-trigger');

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parent = trigger.closest('.faq-item');
      const content = parent.querySelector('.faq-content');
      const icon = trigger.querySelector('.faq-icon');
      
      // If already active, close it
      if (parent.classList.contains('active')) {
        parent.classList.remove('active');
        content.style.maxHeight = '0px';
        icon.textContent = '+';
      } else {
        // Close other items
        document.querySelectorAll('.faq-item').forEach(item => {
          item.classList.remove('active');
          item.querySelector('.faq-content').style.maxHeight = '0px';
          item.querySelector('.faq-icon').textContent = '+';
        });

        // Open selected item
        parent.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
        icon.textContent = '-';
      }
    });
  });
}

/* 6. Intersection Observer for Scroll-triggered entrance animations */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target); // Trigger only once
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    // Fallback if IntersectionObserver is not supported
    revealElements.forEach(el => el.classList.add('active'));
  }
  
  // Add reveal class to all sections for entrance animations
  const sections = document.querySelectorAll('section');
  sections.forEach((sec, idx) => {
    // Skip hero since it has entrance animations already
    if (idx > 0 && !sec.classList.contains('audit-modal')) {
      sec.classList.add('reveal');
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('active');
            }
          });
        }, { threshold: 0.05 });
        observer.observe(sec);
      } else {
        sec.classList.add('active');
      }
    }
  });
}
