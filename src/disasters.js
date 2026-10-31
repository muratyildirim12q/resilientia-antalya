import * as THREE from 'three';
import { sound } from './audio.js';

export class DisasterSimulator {
  constructor(scene) {
    this.scene = scene;
    this.activeDisaster = null; // 'FLOOD', 'HEATWAVE', null
    this.intensity = 0;
    this.spongeCapacity = 0;

    // Şimşek Zamanlayıcısı
    this.lightningTimer = 4.5;
    this.isFlashing = false;
    this.flashDuration = 0;

    this.setupRainStreaks();
    this.setupSplashRipples();
    this.setupFloodWaterMesh();
  }

  // 1. Gerçekçi Eğimli Fırtına Yağmur Çizgileri (LineSegments)
  setupRainStreaks() {
    this.rainCount = 2400;
    const positions = new Float32Array(this.rainCount * 6); // Her çizgi 2 nokta
    this.rainData = [];

    for (let i = 0; i < this.rainCount; i++) {
      const rx = (Math.random() - 0.5) * 62;
      const ry = 4 + Math.random() * 26;
      const rz = (Math.random() - 0.5) * 58;
      const len = 1.4 + Math.random() * 0.8;
      const speed = 36 + Math.random() * 12;

      this.rainData.push({ x: rx, y: ry, z: rz, len, speed });

      const idx = i * 6;
      positions[idx + 0] = rx;
      positions[idx + 1] = ry;
      positions[idx + 2] = rz;
      // Rüzgar eğimi (Toroslar'dan Akdeniz'e doğru esen rüzgar: -X ve +Z yönünde)
      positions[idx + 3] = rx - 0.35;
      positions[idx + 4] = ry - len;
      positions[idx + 5] = rz + 0.2;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.rainMat = new THREE.LineBasicMaterial({
      color: 0xcbeafe,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.rainLines = new THREE.LineSegments(geom, this.rainMat);
    this.scene.add(this.rainLines);
  }

  // 2. Yere Çarpan Yağmur Damlası Halka Sıçramaları (Splash Ripples)
  setupSplashRipples() {
    this.maxRipples = 45;
    this.ripples = [];
    const ringGeom = new THREE.RingGeometry(0.06, 0.22, 10);
    ringGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < this.maxRipples; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(ringGeom, mat);
      mesh.position.set(0, 0.365, 0);
      mesh.visible = false;
      this.scene.add(mesh);

      this.ripples.push({
        mesh,
        life: 0,
        maxLife: 0.38,
        scale: 1.0
      });
    }
    this.rippleIndex = 0;
  }

  spawnSplash(x, z) {
    const r = this.ripples[this.rippleIndex];
    this.rippleIndex = (this.rippleIndex + 1) % this.maxRipples;
    r.mesh.position.set(x, 0.366, z);
    r.life = r.maxLife;
    r.mesh.scale.set(0.3, 0.3, 0.3);
    r.mesh.material.opacity = 0.75;
    r.mesh.visible = true;
  }

  // 3. Dinamik Dalgalı Sel Suyu Tabakası (Harmonik Sinüs Dalgası Fiziği)
  setupFloodWaterMesh() {
    this.waterW = 54;
    this.waterH = 50;
    this.waterSegs = 42;
    const waterGeom = new THREE.PlaneGeometry(this.waterW, this.waterH, this.waterSegs, this.waterSegs);
    waterGeom.rotateX(-Math.PI / 2);

    this.waterBasePos = waterGeom.attributes.position.array.slice();

    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Akdeniz fırtına taşkın turkuazı
      transparent: true,
      opacity: 0.0,
      roughness: 0.08,
      metalness: 0.35,
      depthWrite: false
    });

    this.waterMesh = new THREE.Mesh(waterGeom, this.waterMat);
    this.waterMesh.position.set(0, 0.05, 0);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // Kıyı ve cadde taşkın köpük çizgisi
    const floodFoamGeom = new THREE.PlaneGeometry(54, 0.8);
    floodFoamGeom.rotateX(-Math.PI / 2);
    this.floodFoamMat = new THREE.MeshBasicMaterial({
      color: 0xf0f9ff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.floodFoam = new THREE.Mesh(floodFoamGeom, this.floodFoamMat);
    this.floodFoam.position.set(0, 0.37, -12);
    this.scene.add(this.floodFoam);
  }

  setSpongeCapacity(cap) {
    this.spongeCapacity = cap;
  }

  startDisaster(type) {
    this.activeDisaster = type;
    this.intensity = 1.0;
    this.lightningTimer = 2.5 + Math.random() * 2.0;
  }

  stopDisaster() {
    this.activeDisaster = null;
    this.intensity = 0.0;
    this.rainMat.opacity = 0.0;
    this.floodFoamMat.opacity = 0.0;
    this.ripples.forEach((r) => {
      r.mesh.visible = false;
      r.life = 0;
    });
  }

  update(dt, sunLight, hemiLight, fog, sceneBg) {
    const t = performance.now() * 0.001;

    // Sel suyu çekilmesi (Afet bitince yeraltına / denize emilim)
    if (!this.activeDisaster) {
      if (this.waterMesh.position.y > 0.05) {
        this.waterMesh.position.y = Math.max(0.05, this.waterMesh.position.y - dt * 0.35);
        this.waterMat.opacity = Math.max(0, this.waterMat.opacity - dt * 0.5);
      }
      return;
    }

    if (this.activeDisaster === 'FLOOD') {
      // 1. Fırtına Gökyüzü ve Atmosferik Işıklandırma
      sceneBg.setHex(0x334155);
      fog.color.setHex(0x334155);
      fog.density = 0.012;
      hemiLight.intensity = 0.38;

      // Şimşek çakması animasyonu (Lightning Flash)
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 3.5 + Math.random() * 3.8;
        this.isFlashing = true;
        this.flashDuration = 0.12;
        sound.playThunder();
      }

      if (this.isFlashing) {
        this.flashDuration -= dt;
        sunLight.intensity = 4.2;
        sunLight.color.setHex(0xe0f2fe);
        sceneBg.setHex(0x64748b);
        fog.color.setHex(0x64748b);
        if (this.flashDuration <= 0) {
          this.isFlashing = false;
        }
      } else {
        sunLight.intensity = 0.65;
        sunLight.color.setHex(0x94a3b8);
      }

      // 2. Yağmur Çizgilerini Aşağı Doğru Yağdır
      this.rainMat.opacity = THREE.MathUtils.lerp(this.rainMat.opacity, 0.88, dt * 4.0);
      const pos = this.rainLines.geometry.attributes.position.array;

      for (let i = 0; i < this.rainCount; i++) {
        const d = this.rainData[i];
        d.y -= d.speed * dt;
        d.x -= 4.2 * dt;
        d.z += 2.4 * dt;

        // Yere çarpınca sıçrama halkası tetikle
        if (d.y <= 0.38) {
          if (Math.random() < 0.35) {
            this.spawnSplash(d.x, d.z);
          }
          d.y = 26 + Math.random() * 4;
          d.x = (Math.random() - 0.5) * 62;
          d.z = (Math.random() - 0.5) * 58;
        }

        const idx = i * 6;
        pos[idx + 0] = d.x;
        pos[idx + 1] = d.y;
        pos[idx + 2] = d.z;
        pos[idx + 3] = d.x - 0.35;
        pos[idx + 4] = d.y - d.len;
        pos[idx + 5] = d.z + 0.2;
      }
      this.rainLines.geometry.attributes.position.needsUpdate = true;

      // Sıçrama halkalarını güncelle
      this.ripples.forEach((r) => {
        if (r.life > 0) {
          r.life -= dt;
          const prog = 1.0 - r.life / r.maxLife;
          const s = 0.3 + prog * 1.6;
          r.mesh.scale.set(s, s, s);
          r.mesh.material.opacity = (1.0 - prog) * 0.72;
          if (r.life <= 0) {
            r.mesh.visible = false;
          }
        }
      });

      // 3. Sel Suyu Fiziği & Dinamik Dalga Tepecikleri
      this.waterMat.opacity = THREE.MathUtils.lerp(this.waterMat.opacity, 0.76, dt * 2.5);
      this.floodFoamMat.opacity = 0.65 + Math.sin(t * 3.5) * 0.25;

      // Sünger Park Kapasitesine Göre Su Yüksekliği Dengesi:
      // Eğer sünger kapasitesi >= 45 ise su seviyesi kaldırım altında (y ≈ 0.37) emilerek hapsedilir!
      // Eğer sünger kapasitesi yetersizse su seviyesi y = 0.52'ye yükselerek binaları basar!
      const targetWaterY = this.spongeCapacity >= 45 ? 0.365 : 0.51;
      this.waterMesh.position.y = THREE.MathUtils.lerp(this.waterMesh.position.y, targetWaterY, dt * 0.16);

      // Toroslar'dan (Kuzey, -Z) Akdeniz'e (+Z) akan sel dalgası simülasyonu
      const geomPos = this.waterMesh.geometry.attributes.position.array;
      const basePos = this.waterBasePos;
      const vCount = geomPos.length / 3;

      for (let i = 0; i < vCount; i++) {
        const bx = basePos[i * 3 + 0];
        const bz = basePos[i * 3 + 2];
        // İki harmonik akıntı dalgası
        const wave1 = Math.sin(bx * 0.45 + bz * 0.3 + t * 4.2) * 0.055;
        const wave2 = Math.cos(bx * 0.3 - bz * 0.5 + t * 3.2) * 0.04;
        geomPos[i * 3 + 1] = wave1 + wave2;
      }
      this.waterMesh.geometry.attributes.position.needsUpdate = true;
      this.waterMesh.geometry.computeVertexNormals();

    } else if (this.activeDisaster === 'HEATWAVE') {
      // 47°C Sıcak Hava Kubbesi (Kentsel Isı Adası)
      sceneBg.setHex(0x9a3412);
      fog.color.setHex(0x9a3412);
      fog.density = 0.008;
      sunLight.intensity = 3.2;
      sunLight.color.setHex(0xfbbf24);
      hemiLight.color.setHex(0xf59e0b);

      this.rainMat.opacity = 0.0;
      this.waterMat.opacity = 0.0;
      this.floodFoamMat.opacity = 0.0;
    }
  }
}

