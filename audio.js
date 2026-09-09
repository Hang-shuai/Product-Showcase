(() => {
  const preferenceKey = "boiling-bubbles-sound-enabled-v1";
  const body = document.body;
  const theme = body.classList.contains("scheme-three")
    ? "midnight"
    : body.classList.contains("scheme-two")
      ? "rose"
      : "cream";
  const tracks = {
    cream: "assets/audio/bgm-cream-mist.mp3",
    rose: "assets/audio/bgm-bubble-rose.mp3",
    midnight: "assets/audio/bgm-midnight-rose.mp3"
  };
  const themeTones = {
    cream: { low: 523.25, mid: 659.25, high: 783.99, wave: "sine" },
    rose: { low: 587.33, mid: 739.99, high: 880, wave: "sine" },
    midnight: { low: 293.66, mid: 440, high: 659.25, wave: "triangle" }
  };
  const musicVolumes = {
    cream: 0.14,
    rose: 0.09,
    midnight: 0.095
  };
  const musicVolume = musicVolumes[theme];
  const musicStartVolume = Math.min(musicVolume, theme === "cream" ? 0.11 : 0.072);
  const music = new Audio(tracks[theme]);
  const controls = [...document.querySelectorAll("[data-sound-toggle]")];
  let audioContext;
  let fadeFrame;
  let duckTimer;
  let gestureStartArmed = false;
  const awaitingNoticeChoice = theme === "rose" && Boolean(document.querySelector("[data-first-visit-notice]"));
  let enabled = awaitingNoticeChoice ? false : readPreference();

  music.loop = true;
  music.preload = "auto";
  music.volume = musicStartVolume;
  music.load();

  function readPreference() {
    try {
      return localStorage.getItem(preferenceKey) === "true";
    } catch {
      return false;
    }
  }

  function savePreference() {
    try {
      localStorage.setItem(preferenceKey, String(enabled));
    } catch {
      // The sound choice still applies until this page is closed.
    }
  }

  function updateControls() {
    controls.forEach((control) => {
      control.setAttribute("aria-pressed", String(enabled));
      control.setAttribute("aria-label", enabled ? "关闭页面声音" : "开启页面声音");
      const icon = control.querySelector("[data-sound-icon]");
      const label = control.querySelector("[data-sound-label]");
      if (icon) icon.textContent = enabled ? "♫" : "♪";
      if (label) label.textContent = enabled ? "音乐开" : "音乐";
    });
  }

  function fadeMusic(target, duration = 850) {
    cancelAnimationFrame(fadeFrame);
    const initial = music.volume;
    const startedAt = performance.now();

    function step(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      music.volume = initial + (target - initial) * eased;
      if (progress < 1) fadeFrame = requestAnimationFrame(step);
      else if (target === 0 && !enabled) music.pause();
    }

    fadeFrame = requestAnimationFrame(step);
  }

  async function startMusic(immediate = false) {
    if (!enabled || document.hidden) return false;
    try {
      if (music.volume < musicStartVolume) music.volume = musicStartVolume;
      await music.play();
      fadeMusic(musicVolume, immediate ? 90 : 180);
      return true;
    } catch {
      armGestureStart();
      return false;
    }
  }

  function armGestureStart() {
    if (gestureStartArmed) return;
    gestureStartArmed = true;

    function resumeFromGesture() {
      document.removeEventListener("pointerdown", resumeFromGesture, true);
      document.removeEventListener("keydown", resumeFromGesture, true);
      gestureStartArmed = false;
      if (enabled) startMusic();
    }

    document.addEventListener("pointerdown", resumeFromGesture, { capture: true });
    document.addEventListener("keydown", resumeFromGesture, { capture: true });
  }

  function stopMusic() {
    fadeMusic(0, 260);
  }

  function getAudioContext() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      audioContext = new AudioContextClass();
    }
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function tone(frequency, delay = 0, duration = 0.09, volume = 0.11) {
    const context = getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    const end = start + duration;
    oscillator.type = themeTones[theme].wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
  }

  function duckMusic() {
    if (music.paused) return;
    clearTimeout(duckTimer);
    music.volume = Math.min(music.volume, 0.045);
    duckTimer = setTimeout(() => {
      if (enabled && !document.hidden) fadeMusic(musicVolume, 220);
    }, 130);
  }

  function playEffect(kind = "click") {
    if (!enabled) return;
    duckMusic();
    const notes = themeTones[theme];
    if (kind === "heart") {
      tone(notes.mid, 0, 0.12, 0.15);
      tone(notes.high, 0.075, 0.18, 0.125);
      return;
    }
    if (kind === "open") {
      tone(notes.low, 0, 0.11, 0.1);
      tone(notes.mid, 0.055, 0.15, 0.13);
      return;
    }
    if (kind === "close") {
      tone(notes.mid, 0, 0.1, 0.11);
      tone(notes.low, 0.05, 0.13, 0.095);
      return;
    }
    if (kind === "switch") {
      tone(notes.low, 0, 0.1, 0.09);
      tone(notes.mid, 0.055, 0.12, 0.115);
      tone(notes.high, 0.11, 0.16, 0.1);
      return;
    }
    if (kind === "notice") {
      tone(notes.mid, 0, 0.15, 0.13);
      tone(notes.high, 0.1, 0.24, 0.115);
      return;
    }
    if (kind === "collect") {
      tone(notes.low, 0, 0.12, 0.13);
      tone(notes.mid, 0.07, 0.18, 0.17);
      tone(notes.high, 0.16, 0.28, 0.15);
      return;
    }
    tone(notes.mid, 0, 0.075, 0.11);
  }

  function setEnabled(nextEnabled, effect = true) {
    const wasEnabled = enabled;
    if (!nextEnabled && wasEnabled && effect) playEffect("close");
    enabled = Boolean(nextEnabled);
    savePreference();
    updateControls();
    if (enabled) {
      startMusic();
      if (effect) playEffect(wasEnabled ? "click" : "notice");
    } else {
      stopMusic();
    }
  }

  controls.forEach((control) => {
    control.addEventListener("click", () => setEnabled(!enabled));
  });

  document.addEventListener("click", (event) => {
    if (!enabled || event.target.closest("[data-sound-toggle], [data-notice-close], [data-owned-toggle]")) return;
    if (event.target.closest(".style-choice")) playEffect("switch");
    else if (event.target.closest("[data-favorite], [data-modal-favorite], [data-show-favorites]")) playEffect("heart");
    else if (event.target.closest("[data-open-product]")) playEffect("open");
    else if (event.target.closest("[data-modal-close]")) playEffect("close");
    else if (event.target.closest("button, a")) playEffect("click");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) music.pause();
    else if (enabled) startMusic(true);
  });

  window.addEventListener("pageshow", () => {
    if (enabled) startMusic(true);
  });

  updateControls();
  if (enabled) startMusic(true);

  window.BoilingBubblesAudio = {
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
    playEffect,
    isEnabled: () => enabled
  };
})();
