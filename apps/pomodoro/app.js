// Pomodoro Timer — fully customizable
(function() {
  const DEFAULTS = {
    work: 25,
    short: 5,
    long: 15,
    cycles: 4,
    autoBreaks: false,
    autoWork: false,
    notify: false,
    tick: false,
    ding: true,
    volume: 0.6,
    theme: 'dark', // 'dark' or 'light'
  };

  const els = {
    display: document.getElementById('display'),
    progress: document.getElementById('progressBar'),
    startPause: document.getElementById('startPause'),
    reset: document.getElementById('reset'),
    skip: document.getElementById('skip'),
    btnWork: document.getElementById('btnWork'),
    btnShort: document.getElementById('btnShort'),
    btnLong: document.getElementById('btnLong'),
    sessionLabel: document.getElementById('sessionLabel'),
    todayPomos: document.getElementById('todayPomos'),
    focusMinutes: document.getElementById('focusMinutes'),
    cycleCount: document.getElementById('cycleCount'),
    autoInfo: document.getElementById('autoInfo'),
    notifyInfo: document.getElementById('notifyInfo'),
    soundInfo: document.getElementById('soundInfo'),
    settingsBtn: document.getElementById('openSettings'),
    settingsModal: document.getElementById('settingsModal'),
    saveSettings: document.getElementById('saveSettings'),
    setWork: document.getElementById('setWork'),
    setShort: document.getElementById('setShort'),
    setLong: document.getElementById('setLong'),
    setCycles: document.getElementById('setCycles'),
    autoStartBreaks: document.getElementById('autoStartBreaks'),
    autoStartWork: document.getElementById('autoStartWork'),
    enableNotify: document.getElementById('enableNotify'),
    enableTick: document.getElementById('enableTick'),
    enableDing: document.getElementById('enableDing'),
    volume: document.getElementById('volume'),
    toggleTheme: document.getElementById('toggleTheme'),
  };

  let settings = load('pomodoro.settings', DEFAULTS);
  let stats = load('pomodoro.stats', {
    today: dateKey(new Date()),
    todayPomos: 0,
    focusMinutes: 0,
    cycleCount: 0,
  });

  if (stats.today !== dateKey(new Date())) {
    stats.today = dateKey(new Date());
    stats.todayPomos = 0;
    stats.focusMinutes = 0;
    stats.cycleCount = 0;
    save('pomodoro.stats', stats);
  }

  // Timer state
  let mode = 'work'; // 'work' | 'short' | 'long'
  let totalSeconds = settings.work * 60;
  let remaining = totalSeconds;
  let running = false;
  let intervalId = null;
  let cycleInSet = 0; // number of completed work sessions in current set

  // Theme
  applyTheme(settings.theme);

  // Initialize UI
  updateModeButtons();
  updateDisplay();
  updateFooter();
  updateStats();

  // Settings modal defaults
  els.setWork.value = settings.work;
  els.setShort.value = settings.short;
  els.setLong.value = settings.long;
  els.setCycles.value = settings.cycles;
  els.autoStartBreaks.checked = settings.autoBreaks;
  els.autoStartWork.checked = settings.autoWork;
  els.enableNotify.checked = settings.notify;
  els.enableTick.checked = settings.tick;
  els.enableDing.checked = settings.ding;
  els.volume.value = settings.volume;

  // Event listeners
  els.startPause.addEventListener('click', toggleStartPause);
  els.reset.addEventListener('click', resetTimer);
  els.skip.addEventListener('click', skipSession);
  els.btnWork.addEventListener('click', () => switchMode('work'));
  els.btnShort.addEventListener('click', () => switchMode('short'));
  els.btnLong.addEventListener('click', () => switchMode('long'));
  els.settingsBtn.addEventListener('click', () => els.settingsModal.showModal());
  els.saveSettings.addEventListener('click', saveSettings);
  els.toggleTheme.addEventListener('click', () => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(settings.theme);
    save('pomodoro.settings', settings);
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.code === 'Space') { e.preventDefault(); toggleStartPause(); }
    else if (e.key.toLowerCase() === 'r') resetTimer();
    else if (e.key.toLowerCase() === 's') skipSession();
    else if (e.key === '1') switchMode('work');
    else if (e.key === '2') switchMode('short');
    else if (e.key === '3') switchMode('long');
    else if (e.key.toLowerCase() === 't') { settings.theme = settings.theme === 'dark' ? 'light' : 'dark'; applyTheme(settings.theme); save('pomodoro.settings', settings); }
    else if (e.key.toLowerCase() === 'o') els.settingsModal.showModal();
  });

  // Notifications permission preflight
  if (settings.notify && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Core functions
  function toggleStartPause() {
    if (running) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function startTimer() {
    if (running) return;
    running = true;
    els.startPause.textContent = 'Pause';
    const start = Date.now();
    let expected = start + 1000;

    intervalId = setInterval(() => {
      const drift = Date.now() - expected;
      if (drift > 1000) {
        // if browser throttled, adjust
        remaining -= Math.round(drift / 1000);
      } else {
        remaining--;
      }
      expected += 1000;
      tick();
      if (remaining <= 0) {
        completeSession();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (!running) return;
    running = false;
    els.startPause.textContent = 'Start';
    clearInterval(intervalId);
    intervalId = null;
  }

  function resetTimer() {
    pauseTimer();
    remaining = getModeMinutes(mode) * 60;
    updateDisplay();
  }

  function skipSession() {
    if (confirm('Skip current session?')) {
      pauseTimer();
      remaining = 0;
      completeSession();
    }
  }

  function switchMode(next) {
    if (mode === next) return;
    pauseTimer();
    mode = next;
    remaining = getModeMinutes(mode) * 60;
    totalSeconds = remaining;
    updateModeButtons();
    updateDisplay();
    els.sessionLabel.textContent = labelFor(mode);
  }

  function completeSession() {
    pauseTimer();
    remaining = 0;
    updateDisplay();
    chime();
    maybeNotify(`${labelFor(mode)} session finished.`);

    if (mode === 'work') {
      stats.todayPomos += 1;
      stats.focusMinutes += getModeMinutes('work');
      cycleInSet += 1;
      stats.cycleCount = cycleInSet;
      save('pomodoro.stats', stats);
      updateStats();

      // decide next mode
      if (cycleInSet >= settings.cycles) {
        // long break and reset cycle
        cycleInSet = 0;
        switchMode('long');
        if (settings.autoBreaks) startTimer();
      } else {
        switchMode('short');
        if (settings.autoBreaks) startTimer();
      }
    } else {
      // from any break go to work
      switchMode('work');
      if (settings.autoWork) startTimer();
    }
  }

  function getModeMinutes(m) {
    return m === 'work' ? settings.work : m === 'short' ? settings.short : settings.long;
  }

  function labelFor(m) {
    return m === 'work' ? 'Work' : m === 'short' ? 'Short Break' : 'Long Break';
  }

  function tick() {
    if (settings.tick) {
      // lightweight metronome click via WebAudio
      clickSound(settings.volume * 0.2);
    }
    updateDisplay();
  }

  function updateDisplay() {
    const mins = Math.max(0, Math.floor(remaining / 60));
    const secs = Math.max(0, remaining % 60);
    els.display.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

    const total = getModeMinutes(mode) * 60;
    const progress = total === 0 ? 0 : ((total - remaining) / total) * 100;
    els.progress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }

  function updateModeButtons() {
    [els.btnWork, els.btnShort, els.btnLong].forEach(b => b.classList.remove('active'));
    if (mode === 'work') els.btnWork.classList.add('active');
    if (mode === 'short') els.btnShort.classList.add('active');
    if (mode === 'long') els.btnLong.classList.add('active');
    els.sessionLabel.textContent = labelFor(mode);
  }

  function updateStats() {
    els.todayPomos.textContent = stats.todayPomos;
    els.focusMinutes.textContent = stats.focusMinutes;
    els.cycleCount.textContent = stats.cycleCount + ' / ' + settings.cycles;
  }

  function updateFooter() {
    els.autoInfo.textContent = `Auto: ${settings.autoBreaks || settings.autoWork ? 'On' : 'Off'}`;
    els.notifyInfo.textContent = `Notify: ${settings.notify ? 'On' : 'Off'}`;
    els.soundInfo.textContent = `Sound: ${settings.ding ? 'On' : 'Off'}`;
  }

  function saveSettings(ev) {
    ev.preventDefault();
    // read values
    const w = clamp(parseInt(els.setWork.value || settings.work), 1, 120);
    const s = clamp(parseInt(els.setShort.value || settings.short), 1, 60);
    const l = clamp(parseInt(els.setLong.value || settings.long), 1, 90);
    const c = clamp(parseInt(els.setCycles.value || settings.cycles), 1, 12);

    settings.work = w;
    settings.short = s;
    settings.long = l;
    settings.cycles = c;
    settings.autoBreaks = !!els.autoStartBreaks.checked;
    settings.autoWork = !!els.autoStartWork.checked;
    settings.notify = !!els.enableNotify.checked;
    settings.tick = !!els.enableTick.checked;
    settings.ding = !!els.enableDing.checked;
    settings.volume = parseFloat(els.volume.value || settings.volume);

    save('pomodoro.settings', settings);
    updateFooter();
    remaining = getModeMinutes(mode) * 60;
    totalSeconds = remaining;
    updateDisplay();
    updateStats();

    if (settings.notify && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    els.settingsModal.close();
  }

  // Helpers
  function clamp(n, min, max){ return Math.min(max, Math.max(min, n || 0)); }
  function dateKey(d){ return d.toISOString().slice(0,10); }
  function load(key, fallback){
    try {
      const v = localStorage.getItem(key);
      return v ? Object.assign({}, fallback, JSON.parse(v)) : JSON.parse(JSON.stringify(fallback));
    } catch { return JSON.parse(JSON.stringify(fallback)); }
  }
  function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

  function applyTheme(theme){
    document.documentElement.classList.toggle('light', theme === 'light');
  }

  function maybeNotify(message){
    if (!settings.notify || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification('Pomodoro', { body: message });
    }
  }

  // Sounds
  let audioCtx;
  function ensureCtx(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function clickSound(vol = 0.1){
    const ctx = ensureCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 880;
    g.gain.value = vol;
    o.connect(g).connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); }, 20);
  }

  function dingSound(vol = settings.volume){
    const ctx = ensureCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.6);
  }

  function chime(){
    if (settings.ding) dingSound(settings.volume);
  }
})();