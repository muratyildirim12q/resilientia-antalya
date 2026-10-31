// Web Audio API - Profesyonel Endüstriyel & İklim Ses Motoru

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      try {
        this.ctx = new AudioCtx();
      } catch {
        return false;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ambienceGain) {
      this.ambienceGain.gain.setValueAtTime(this.isMuted ? 0 : 0.038, this.ctx?.currentTime || 0);
    }
    return this.isMuted;
  }

  // Şehir Gürültüsü & Akdeniz Esintisi (Hafif Ambiyans)
  startCityAmbience() {
    if (this.ambienceStarted || !this.init()) return;
    try {
      this.ambienceStarted = true;
      const now = this.ctx.currentTime;

      // 1. Akdeniz kıyı meltemi & şehir uğultusu (Filtrelenmiş Pembe Gürültü)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.18;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(260, now);

      // 2. Çok hafif uzak şehir trafiği ve liman derinliği (55Hz sub)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(55, now);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.015, now);
      subOsc.connect(subGain);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.isMuted ? 0 : 0.038, now);

      noiseSource.connect(lowpass);
      lowpass.connect(this.ambienceGain);
      subGain.connect(this.ambienceGain);
      this.ambienceGain.connect(this.ctx.destination);

      noiseSource.start(now);
      subOsc.start(now);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Yumuşak Fütüristik AURA Bildirim Chime'ı (Rahatsız edici daktilo tıkı yok)
  playAuraChime() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, now); // G5
    gain1.gain.setValueAtTime(0.04, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.08); // C6
    gain2.gain.setValueAtTime(0.04, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.3);
  }

  // Hafif, kesintili yumuşak daktilo fısıltısı (kullanıcıyı asla rahatsız etmez)
  playTypewriter() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520 + Math.random() * 80, now);

    gain.gain.setValueAtTime(0.004, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.022);
  }

  // Şık UI Tıklama
  playClick() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Yapı İnşa Edilme (Düşük Bas + Kristal)
  playPlace() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(50, now + 0.18);
    subGain.gain.setValueAtTime(0.18, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.21);

    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(587.33, now); // D5
    chime.frequency.setValueAtTime(880, now + 0.05); // A5
    chimeGain.gain.setValueAtTime(0.06, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start(now);
    chime.stop(now + 0.26);
  }

  // Kriz Alarmı (Fırtına / Sıcak Dalgası Uyarısı)
  playAlarm() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(330, now + 0.15);
    osc.frequency.setValueAtTime(440, now + 0.3);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  // Sel Yağmuru & Gök Gürültüsü Uğultusu
  playThunder() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.linearRampToValueAtTime(60, now + 0.7);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Zafer Fanfarı
  playVictory() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.12, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.42);
    });
  }
}

export const sound = new SoundEngine();
