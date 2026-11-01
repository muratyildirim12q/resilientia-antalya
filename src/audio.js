// Web Audio API - Profesyonel Endüstriyel & İklim Ses Motoru

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (typeof window === 'undefined') return false;
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
      this.ambienceGain.gain.setValueAtTime(this.isMuted ? 0 : 0.14, this.ctx?.currentTime || 0);
    }
    return this.isMuted;
  }

  // Şehir Gürültüsü & Akdeniz Esintisi (Hafif ve Akıcı Ambiyans)
  startCityAmbience() {
    if (this.ambienceStarted || !this.init()) return;
    try {
      this.ambienceStarted = true;
      const now = this.ctx.currentTime;

      // 1. Akdeniz kıyı meltemi & şehir uğultusu (5 saniyelik kesintisiz dairesel pembe gürültü)
      const sampleRate = this.ctx.sampleRate;
      const duration = 5;
      const bufferSize = sampleRate * duration;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.16;
      }

      // Dairesel döngü için uç noktaları yumuşak çapraz geçişle (crossfade) birleştir
      const fadeLen = Math.floor(sampleRate * 0.4);
      for (let i = 0; i < fadeLen; i++) {
        const t = i / fadeLen;
        data[i] = data[i] * t + data[bufferSize - fadeLen + i] * (1 - t);
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Kıyı esintisi hafifçe dalgalanan alçak geçiren filtre (LFO ile 200Hz - 320Hz arası süzülme)
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(340, now);

      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.12, now); // 8 saniyede bir hafif esinti dalgalanması
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(50, now);
      lfo.connect(lfoGain);
      lfoGain.connect(lowpass.frequency);

      // 2. Çok hafif uzak şehir trafiği ve liman derinliği (55Hz sub)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(55, now);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.055, now);
      subOsc.connect(subGain);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.isMuted ? 0 : 0.14, now);

      noiseSource.connect(lowpass);
      lowpass.connect(this.ambienceGain);
      subGain.connect(this.ambienceGain);
      this.ambienceGain.connect(this.ctx.destination);

      noiseSource.start(now);
      lfo.start(now);
      subOsc.start(now);

      // 3. Periyodik Akdeniz Martı Sesi & Kıyı Dalga Çırpıntısı (12-16 saniyede bir)
      if (typeof window !== 'undefined') {
        setInterval(() => {
          if (!this.isMuted && this.ambienceStarted) {
            this.playSeagull();
          }
        }, 14000);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Akdeniz Martı Sesi (Procedural Seagull Call)
  playSeagull() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    // Martı çığlığı frekans eğrisi: 1750Hz -> 2550Hz -> 1850Hz
    osc.frequency.setValueAtTime(1750, now);
    osc.frequency.linearRampToValueAtTime(2550, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(1850, now + 0.38);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.022, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Belediye Telsizi Onay Biti & Telsiz Çıtırtısı (Gerçekçi Roger Beep & Squelch)
  playRadioBeep() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;

    // 1. Telsiz Mandalı Açılış Çıtırtısı / Squelch Burst (35ms bant geçiren pembe gürültü)
    const sampleRate = this.ctx.sampleRate;
    const squelchDur = 0.035;
    const bufferSize = Math.floor(sampleRate * squelchDur);
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.015));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(1.8, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.035, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + squelchDur);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);

    // 2. Telsiz Onay Tonu (Roger Beep: 1100Hz -> 1760Hz çift ton)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1100, now + 0.03);
    gain1.gain.setValueAtTime(0.045, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now + 0.03);
    osc1.stop(now + 0.085);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, now + 0.08);
    gain2.gain.setValueAtTime(0.05, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.17);
  }

  // Geriye dönük uyumluluk için AURA chime telsiz tonuna yönlendirilir
  playAuraChime() {
    this.playRadioBeep();
  }

  // Elektrostatik Baca Filtresi Montaj & Hava Temizleme Fısıltısı
  playFilterInstall() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;

    // 1. Mekanik montaj / lokma anahtarı sıkma klikleri (2 hızlı metalik klik)
    [0, 0.07].forEach((delay) => {
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1900, now + delay);
      clickOsc.frequency.exponentialRampToValueAtTime(600, now + delay + 0.03);
      clickGain.gain.setValueAtTime(0.08, now + delay);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.035);
      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now + delay);
      clickOsc.stop(now + delay + 0.04);
    });

    // 2. Temiz hava emişi & elektrostatik filtre fısıltısı (Yumuşak hava akımı)
    const airDur = 0.45;
    const airBufSize = Math.floor(this.ctx.sampleRate * airDur);
    const airBuf = this.ctx.createBuffer(1, airBufSize, this.ctx.sampleRate);
    const airData = airBuf.getChannelData(0);
    for (let i = 0; i < airBufSize; i++) {
      airData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
    }
    const airNoise = this.ctx.createBufferSource();
    airNoise.buffer = airBuf;
    const airFilter = this.ctx.createBiquadFilter();
    airFilter.type = 'lowpass';
    airFilter.frequency.setValueAtTime(1200, now + 0.1);
    airFilter.frequency.linearRampToValueAtTime(350, now + 0.1 + airDur);
    const airGain = this.ctx.createGain();
    airGain.gain.setValueAtTime(0.065, now + 0.1);
    airGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1 + airDur);
    airNoise.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(this.ctx.destination);
    airNoise.start(now + 0.1);

    // 3. İyonizasyon tamamlama tınısı
    const chime = this.ctx.createOscillator();
    const cGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(1318.5, now + 0.22); // E6
    cGain.gain.setValueAtTime(0.035, now + 0.22);
    cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    chime.connect(cGain);
    cGain.connect(this.ctx.destination);
    chime.start(now + 0.22);
    chime.stop(now + 0.5);
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

  // Tok, Mekanik UI Klik Sesi (Tactile Mechanical Switch Click)
  playClick() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;

    // 1. Tok gövde mekanik darbesi (160Hz -> 48Hz)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(160, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(48, now + 0.035);
    bodyGain.gain.setValueAtTime(0.24, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.ctx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.04);

    // 2. Tok plastik/metal yay snap tıkırtısı (1900Hz -> 420Hz)
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(1900, now);
    snapOsc.frequency.exponentialRampToValueAtTime(420, now + 0.024);
    snapGain.gain.setValueAtTime(0.07, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.026);
    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.028);
  }

  // Yapı İnşa Edilme (Ağır Fiziksel Vuruş + İnşaat Çekici & Kristal)
  playPlace() {
    this.playConstruction();
  }

  playConstruction() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;

    // 1. Ağır taban vuruşu / fiziksel ağırlık sub-darbesi (160Hz -> 38Hz)
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(38, now + 0.16);
    subGain.gain.setValueAtTime(0.24, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.19);

    // 2. İnşaat çekici & metal/ahşap oturma klik sesi (triangle + bandpass 900Hz)
    const hammer = this.ctx.createOscillator();
    const hammerGain = this.ctx.createGain();
    hammer.type = 'triangle';
    hammer.frequency.setValueAtTime(940, now);
    hammer.frequency.exponentialRampToValueAtTime(320, now + 0.08);
    hammerGain.gain.setValueAtTime(0.12, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    hammer.connect(hammerGain);
    hammerGain.connect(this.ctx.destination);
    hammer.start(now);
    hammer.stop(now + 0.1);

    // 3. Hafif kristal tamamlama tınısı
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(659.25, now + 0.04); // E5
    chime.frequency.setValueAtTime(880, now + 0.09); // A5
    chimeGain.gain.setValueAtTime(0.05, now + 0.04);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start(now + 0.04);
    chime.stop(now + 0.23);
  }

  // Yıkım & Buldozer (Moloz Çöküşü, Ağır Beton Kırılma Gürültüsü)
  playDemolition() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;

    // 1. Ağır çöküş sub-rumble
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(90, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.32);
    subGain.gain.setValueAtTime(0.28, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.36);

    // 2. Beton moloz ufalanma gürültüsü (bandpass filtered noise burst)
    const sampleRate = this.ctx.sampleRate;
    const dur = 0.32;
    const bufferSize = Math.floor(sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.1));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, now);
    filter.Q.setValueAtTime(2.2, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Yola Bağlantı Başarılı Bildirim Sesi
  playRoadConnected() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(783.99, now + 0.08); // G5
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Yola Cephe Yok / Uyarı Sesi
  playNoRoadWarning() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(196, now + 0.08);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Meteoroloji ve Afet Uyarısı (Telsiz Cızırtısı + Resmi Acil Durum İkaz Bipi)
  playAlarm() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;

    // 1. Telsiz Squelch / Cızırtı Darbesi (45ms bandpass noise burst)
    const sampleRate = this.ctx.sampleRate;
    const squelchDur = 0.045;
    const bufferSize = Math.floor(sampleRate * squelchDur);
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.02));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1450, now);
    filter.Q.setValueAtTime(2.2, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.05, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + squelchDur);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);

    // 2. Resmi Meteorolojik Acil Durum Bip Tonu (Dual 853Hz & 960Hz resmi ikaz)
    [853, 960].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.04);
      gain.gain.setValueAtTime(0.065, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + 0.04);
      osc.stop(now + 0.40);
    });
  }

  // Sel Yağmuru & Gök Gürültüsü Uğultusu (Uzaktan veya Yakından)
  playThunder(volume = 0.2) {
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
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Trafo Aşırı Yüklenmesi & Elektrik Kıvılcımı / Ark Sesi
  playTransformerSpark() {
    if (this.isMuted || !this.init()) return;
    const now = this.ctx.currentTime;

    // 1. Elektrik ark çıtırtısı (noise burst bandpass 2400Hz)
    const dur = 0.12;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.35 ? 1 : 0.2);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    // 2. Trafo 50Hz şebeke vızıltısı (Mains hum pulse)
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(100, now);
    humGain.gain.setValueAtTime(0.04, now);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    hum.connect(humGain);
    humGain.connect(this.ctx.destination);
    hum.start(now);
    hum.stop(now + 0.19);
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
