// Warung Rasa: Dapur Kilat — all sound, synthesized with WebAudio, no audio files.
// One clear job: tiny bleeps for chop, sizzle, serve, error and coins.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, seconds, type, gain, when = 0) {
    const ac = ensure();
    if (!ac || muted) return;
    try {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, ac.currentTime + when);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + seconds);
      osc.connect(g).connect(ac.destination);
      osc.start(ac.currentTime + when);
      osc.stop(ac.currentTime + when + seconds + 0.02);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  function noiseBurst(seconds, gain) {
    const ac = ensure();
    if (!ac || muted) return;
    try {
      const len = Math.floor(ac.sampleRate * seconds);
      const buffer = ac.createBuffer(1, len, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource();
      src.buffer = buffer;
      const g = ac.createGain();
      g.gain.value = gain;
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1200;
      src.connect(filter).connect(g).connect(ac.destination);
      src.start();
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    chop() { noiseBurst(0.07, 0.25); tone(180, 0.06, 'square', 0.12); },
    sizzle() { noiseBurst(0.12, 0.08); },
    pickup() { tone(520, 0.07, 'sine', 0.12); },
    place() { tone(340, 0.07, 'sine', 0.12); },
    ding() { tone(880, 0.12, 'sine', 0.16); tone(1320, 0.18, 'sine', 0.14, 0.09); },
    coin() { tone(990, 0.08, 'triangle', 0.16); tone(1480, 0.14, 'triangle', 0.14, 0.07); },
    error() { tone(140, 0.22, 'sawtooth', 0.14); },
    burn() { tone(220, 0.3, 'sawtooth', 0.12); tone(160, 0.3, 'sawtooth', 0.1, 0.12); },
  };
}
