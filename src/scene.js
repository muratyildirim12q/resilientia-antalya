import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class WorldScene {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();

    // Parlak Akdeniz Gökyüzü (Cities: Skylines Gündüz Atmosferi)
    this.skyColor = new THREE.Color(0x87ceeb);
    this.scene.background = this.skyColor.clone();

    // Doğal ufuk pusu (Siyah sis yok)
    this.scene.fog = new THREE.FogExp2(0xcbeafe, 0.0045);

    // İzometrik Şehir Kamerası
    this.camera = new THREE.PerspectiveCamera(36, this.width / this.height, 0.5, 260);
    this.camera.position.set(26, 26, 30);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls (İzometrik Şehir Kamerası - Zemin Düzleminde Kaydırma)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = false; // Zemin düzleminde (XZ) kaydırma, düşey sapma yapmaz
    this.controls.maxPolarAngle = Math.PI / 2.22;
    this.controls.minPolarAngle = 0.25;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 82;
    this.controls.target.set(0, 0.5, 2);
    this.controls.mouseButtons = {
      LEFT: null, // Sol tık inşaat / seçim için ayrıldı; mouse çekince kamera dönmez
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE
    };

    // Sağ tıklama menüsünü engelle (rahat kamera döndürme / kaydırma için)
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());

    // Klavye ve Kenar (Edge) ile akıcı izometrik kamera kaydırma
    this.keys = { w: false, a: false, s: false, d: false, q: false, e: false };
    this.targetAzimuthOffset = 0;
    this.edgePan = { left: false, right: false, up: false, down: false };
    this.panVelocity = new THREE.Vector3(0, 0, 0);
    this.setupKeyboardPan();

    this.clouds = [];
    this.cloudMat = null;
    this.foamMesh = null;
    this.sceneTrees = [];
    this.waveCrests = [];
    this.setupSunLighting();
    this.setupAntalyaLandscape();

    window.addEventListener('resize', () => this.onResize());
  }

  setupKeyboardPan() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.code === 'KeyW' || e.key === 'ArrowUp') this.keys.w = true;
      if (k === 's' || e.code === 'KeyS' || e.key === 'ArrowDown') this.keys.s = true;
      if (k === 'a' || e.code === 'KeyA' || e.key === 'ArrowLeft') this.keys.a = true;
      if (k === 'd' || e.code === 'KeyD' || e.key === 'ArrowRight') this.keys.d = true;
      if (k === 'q' || e.code === 'KeyQ') this.keys.q = true;
      if (k === 'e' || e.code === 'KeyE') this.keys.e = true;
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.code === 'KeyW' || e.key === 'ArrowUp') this.keys.w = false;
      if (k === 's' || e.code === 'KeyS' || e.key === 'ArrowDown') this.keys.s = false;
      if (k === 'a' || e.code === 'KeyA' || e.key === 'ArrowLeft') this.keys.a = false;
      if (k === 'd' || e.code === 'KeyD' || e.key === 'ArrowRight') this.keys.d = false;
      if (k === 'q' || e.code === 'KeyQ') this.keys.q = false;
      if (k === 'e' || e.code === 'KeyE') this.keys.e = false;
    });

    // Kenar kaydırma devre dışı bırakıldı: Mouse hareket ettirildiğinde kamera istenmeyen kayma yapmaz
    this.edgePan = { left: false, right: false, up: false, down: false };
  }

  setupSunLighting() {
    // Sıcak Akdeniz Güneşi
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 2.3);
    this.sunLight.position.set(34, 48, 28);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 160;
    const d = 42;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // Gökyüzü ve Yeşil Zemin Yansıması
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x4ade80, 0.95);
    this.scene.add(this.hemiLight);

    // Yumuşak Ortam Işığı
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);
  }

  setupAntalyaLandscape() {
    // 1. Canlı Akdeniz Turkuaz Deniz Yüzeyi (Güney Kıyısı - Hareketli 3B Dalgalı Yüzey)
    const seaGeom = new THREE.PlaneGeometry(320, 320, 48, 48);
    seaGeom.rotateX(-Math.PI / 2);
    this.seaBasePos = new Float32Array(seaGeom.attributes.position.array);
    this.seaMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.2,
      roughness: 0.10,
      metalness: 0.25,
      transparent: true,
      opacity: 0.96,
      flatShading: true
    });
    this.seaMesh = new THREE.Mesh(seaGeom, this.seaMat);
    // z = 25'ten 345'e kadar uzanır; kumsalı veya şehir alanını kesmez
    this.seaMesh.position.set(0, -0.22, 185);
    this.seaMesh.receiveShadow = true;
    this.scene.add(this.seaMesh);

    // Sığ Turkuaz Kıyı Şeridi (Konyaaltı Sığ Su Geçişi: z = 27.8 .. 35.8)
    const shallowGeom = new THREE.BoxGeometry(140, 0.16, 8.0);
    this.shallowMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.16,
      roughness: 0.14,
      metalness: 0.15,
      transparent: true,
      opacity: 0.88
    });
    const shallow = new THREE.Mesh(shallowGeom, this.shallowMat);
    shallow.position.set(0, -0.16, 31.8);
    this.scene.add(shallow);

    // Kıyı Köpük Çizgisi (Kumsal ve deniz birleşimi: z = 27.8)
    const foamGeom = new THREE.PlaneGeometry(140, 0.85);
    foamGeom.rotateX(-Math.PI / 2);
    this.foamMat = new THREE.MeshBasicMaterial({
      color: 0xf0f9ff,
      transparent: true,
      opacity: 0.82
    });
    this.foamMesh = new THREE.Mesh(foamGeom, this.foamMat);
    this.foamMesh.position.set(0, -0.04, 27.8);
    this.scene.add(this.foamMesh);

    // Kıyıya Vuran Hareketli Beyaz Dalga Sırtları (Wave Crests)
    this.waveCrests = [];
    const crestMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    for (let w = 0; w < 5; w++) {
      const crestGeom = new THREE.PlaneGeometry(132, 0.45);
      crestGeom.rotateX(-Math.PI / 2);
      const crest = new THREE.Mesh(crestGeom, crestMat.clone());
      const baseZ = 29.0 + w * 2.6;
      crest.position.set(0, -0.06, baseZ);
      this.scene.add(crest);
      this.waveCrests.push({ mesh: crest, baseZ, phase: w * 1.25 });
    }

    // 2. Konyaaltı Altın Kumsal Şeridi (z = 21.8 .. 28.0 — Plajdaki tüm insanları ve şemsiyeleri kapsar)
    const beachGeom = new THREE.BoxGeometry(140, 0.35, 6.2);
    const beachMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      roughness: 0.88,
      metalness: 0.02
    });
    const beach = new THREE.Mesh(beachGeom, beachMat);
    beach.position.set(0, -0.02, 24.9);
    beach.receiveShadow = true;
    this.scene.add(beach);

    // 3. Ana Antalya Kıyı Ovası / Şehir İmar Platosu (z = -46.2 .. +21.8, tüm 20x14 imar ızgarasını kapsar)
    const mainlandGeom = new THREE.BoxGeometry(140, 0.72, 68);
    const mainlandMat = new THREE.MeshStandardMaterial({
      color: 0x3ea751,
      roughness: 0.88,
      metalness: 0.02
    });
    this.mainlandMat = mainlandMat;
    const mainland = new THREE.Mesh(mainlandGeom, mainlandMat);
    mainland.position.set(0, 0.0, -12.2);
    mainland.receiveShadow = true;
    this.scene.add(mainland);

    // Doğal Low-Poly Çimen Kümeleri, Yabani Çiçekler ve Akdeniz Çakıl Taşları
    this.setupGrassAndFlora();

    // Sahil Kordonu Taş Duvarı / Yürüyüş Yolu (Promenade: z = 21.35, imar ızgarasının hemen güneyinde)
    const promenadeGeom = new THREE.BoxGeometry(140, 0.44, 1.1);
    const promenadeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.75
    });
    const promenade = new THREE.Mesh(promenadeGeom, promenadeMat);
    promenade.position.set(0, 0.22, 21.35);
    promenade.receiveShadow = true;
    promenade.castShadow = true;
    this.scene.add(promenade);

    // 4. Bölgesel Otoyol Bağlantıları (Batı ve Doğu Harita Kenarlarından Şehre Giriş)
    this.setupRegionalHighwayConnections(1.5);

    // 5. Kuzey Ufkunda Toros Dağları ve Akdeniz Çam Ormanı
    this.setupTaurusMountains();
    this.setupCoastalPalmsAndForest();

    // 6. Gerçekçi Hacimli Low-Poly Bulutlar ve Fırtına Bulutları
    this.setupClouds();
    this.setupStormClouds();

    // 7. Sahil Köpükleri, Deniz & Plaj Atıkları, Caretta Kaplumbağaları ve Deşarj Menfezi
    this.setupShorelineFoam();
    this.setupBeachTrash();
    this.setupBeachPollution();
    this.setupFloatingSeaLitter();
    this.setupCleaningBoats();
    this.setupGarbageTruck();
    this.setupCarettaTurtles();
    this.setupCarettaNests();
    this.setupMarineBarrierMesh();
    this.setupOutfallDischarge();
    this.setupStreetLitter();
    this.setupWildDumpsite();
    this.setupStreetTransformers();
  }

  setupRegionalHighwayConnections(highwayZ) {
    this.highwayZ = highwayZ;
    this.highwayGroup = new THREE.Group();
    this.scene.add(this.highwayGroup);
  }

  setupModularHighway(buildingManager) {
    if (!this.highwayGroup || !buildingManager) return;
    while (this.highwayGroup.children.length > 0) {
      this.highwayGroup.remove(this.highwayGroup.children[0]);
    }
    const z = this.highwayZ !== undefined ? this.highwayZ : 1.5;
    for (let x = -31.5; x >= -67.5; x -= 3.0) {
      const mesh = buildingManager.createRoadMesh('road', { N: false, S: false, W: true, E: true, isHighway: true });
      mesh.position.set(x, 0.36, z);
      this.highwayGroup.add(mesh);
    }
    for (let x = 31.5; x <= 67.5; x += 3.0) {
      const mesh = buildingManager.createRoadMesh('road', { N: false, S: false, W: true, E: true, isHighway: true });
      mesh.position.set(x, 0.36, z);
      this.highwayGroup.add(mesh);
    }
  }

  setupTaurusMountains() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.88,
      flatShading: true
    });
    const foothillMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.85,
      flatShading: true
    });
    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.5,
      flatShading: true
    });

    const peaks = [
      { x: -38, z: -31, r: 12, h: 16, snow: true },
      { x: -24, z: -29, r: 10, h: 13, snow: false },
      { x: -11, z: -31, r: 13, h: 18, snow: true },
      { x: 4, z: -30, r: 11, h: 14, snow: false },
      { x: 18, z: -31, r: 13, h: 17, snow: true },
      { x: 33, z: -29, r: 11, h: 13.5, snow: false },
      { x: -17, z: -25, r: 7.5, h: 6.5, foothill: true },
      { x: 11, z: -25, r: 8.0, h: 7.0, foothill: true },
      { x: -32, z: -24, r: 7.0, h: 6.0, foothill: true },
      { x: 26, z: -24, r: 7.0, h: 6.0, foothill: true }
    ];

    peaks.forEach((p, idx) => {
      const geom = new THREE.ConeGeometry(p.r, p.h, 7);
      const mesh = new THREE.Mesh(geom, p.foothill ? foothillMat : rockMat);
      mesh.position.set(p.x, p.h / 2 + 0.2, p.z);
      mesh.rotation.y = idx * 0.9;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      if (p.snow) {
        const capGeom = new THREE.ConeGeometry(p.r * 0.36, p.h * 0.36, 7);
        const cap = new THREE.Mesh(capGeom, snowMat);
        cap.position.set(p.x, p.h * 0.83 + 0.2, p.z);
        cap.rotation.y = idx * 0.9;
        this.scene.add(cap);
      }
    });
  }

  setupCoastalPalmsAndForest() {
    this.sceneTrees = this.sceneTrees || [];
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7, flatShading: true });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75, flatShading: true });

    // Sahil Kordonu Palmiyeleri (Güney Kordon Boyunca, İmar Alanı Dışında: z = 21.75)
    for (let x = -32; x <= 32; x += 6.4) {
      const palm = new THREE.Group();
      palm.position.set(x, 0.36, 21.75);
      palm.userData = { baseRotZ: 0, baseRotX: 0 };

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.5, 6), trunkMat);
      trunk.position.y = 0.75;
      trunk.castShadow = true;
      palm.add(trunk);

      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), leafMat);
      crown.scale.set(1.2, 0.55, 1.2);
      crown.position.y = 1.55;
      crown.castShadow = true;
      palm.add(crown);

      this.scene.add(palm);
      this.sceneTrees.push(palm);
    }

    // Batı, Doğu ve Kuzey Çevre Orman Ağaçları (İmar Alanı Dışında: |x| > 32 veya z < -22.5)
    const treeCoords = [
      [-33, -14], [-36, -10], [-32.5, -6], [-35, -2], [-33, 5], [-36, 9], [-32.5, 12],
      [33, -14], [36, -10], [32.5, -6], [35, -2], [33, 5], [36, 9], [32.5, 12],
      [-14, -22.8], [-9, -23.5], [-4, -22.6], [2, -23.2], [7, -22.8], [14, -23.0]
    ];

    treeCoords.forEach(([tx, tz], i) => {
      const tree = new THREE.Group();
      tree.position.set(tx, 0.36, tz);
      tree.userData = { baseRotZ: 0, baseRotX: 0 };
      const s = 0.85 + (i % 3) * 0.2;
      tree.scale.set(s, s, s);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.8, 6), trunkMat);
      trunk.position.y = 0.4;
      trunk.castShadow = true;
      tree.add(trunk);

      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.4, 7), pineMat);
      cone1.position.y = 1.2;
      cone1.castShadow = true;
      tree.add(cone1);

      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 7), leafMat);
      cone2.position.y = 1.85;
      cone2.castShadow = true;
      tree.add(cone2);

      this.scene.add(tree);
      this.sceneTrees.push(tree);
    });
  }

  setupGrassAndFlora() {
    const blade1 = new THREE.PlaneGeometry(0.38, 0.48).toNonIndexed();
    blade1.translate(0, 0.24, 0);
    const blade2 = new THREE.PlaneGeometry(0.38, 0.44).toNonIndexed();
    blade2.rotateY(Math.PI / 3);
    blade2.translate(0, 0.22, 0);
    const blade3 = new THREE.PlaneGeometry(0.38, 0.46).toNonIndexed();
    blade3.rotateY((2 * Math.PI) / 3);
    blade3.translate(0, 0.23, 0);

    const tuftGeom = new THREE.BufferGeometry();
    const pos = [];
    const norm = [];
    const uvs = [];

    [blade1, blade2, blade3].forEach((bg) => {
      const p = bg.attributes.position.array;
      const n = bg.attributes.normal.array;
      const u = bg.attributes.uv.array;
      for (let i = 0; i < p.length; i++) pos.push(p[i]);
      for (let i = 0; i < n.length; i++) norm.push(n[i]);
      for (let i = 0; i < u.length; i++) uvs.push(u[i]);
    });

    tuftGeom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    tuftGeom.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
    tuftGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const tuftMat = new THREE.MeshStandardMaterial({
      color: 0x48bb78,
      roughness: 0.85,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const grassCount = 550;
    const grassInstanced = new THREE.InstancedMesh(tuftGeom, tuftMat, grassCount);
    grassInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const colors = [
      new THREE.Color(0x38a169),
      new THREE.Color(0x48bb78),
      new THREE.Color(0x68d391),
      new THREE.Color(0x84cc16),
      new THREE.Color(0x2f855a)
    ];

    let placed = 0;
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    while (placed < grassCount) {
      const gx = (rand() - 0.5) * 116;
      const gz = rand() * 48 - 28;

      // Şehir içi 20x14 imar ızgarasını (x: [-30.8, 30.8], z: [-21.8, 21.8]) ve otoyol aksını temiz tut
      if ((Math.abs(gx) < 30.8 && gz > -21.8 && gz < 21.8) || (Math.abs(gz - 1.5) < 2.6 && Math.abs(gx) < 75.0)) {
        continue;
      }

      const s = 0.75 + rand() * 0.65;
      dummy.position.set(gx, 0.36, gz);
      dummy.rotation.y = rand() * Math.PI * 2;
      dummy.scale.set(s, s * (0.8 + rand() * 0.4), s);
      dummy.updateMatrix();

      grassInstanced.setMatrixAt(placed, dummy.matrix);
      grassInstanced.setColorAt(placed, colors[Math.floor(rand() * colors.length)]);
      placed++;
    }

    grassInstanced.instanceMatrix.needsUpdate = true;
    if (grassInstanced.instanceColor) grassInstanced.instanceColor.needsUpdate = true;
    this.scene.add(grassInstanced);

    const flowerGeom = new THREE.DodecahedronGeometry(0.12, 0);
    const flowerMatYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const flowerMatPurple = new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.5 });

    const flowerGroup = new THREE.Group();
    for (let f = 0; f < 65; f++) {
      const fx = (rand() - 0.5) * 110;
      const fz = rand() * 46 - 26;
      if ((Math.abs(fx) < 30.8 && fz > -21.8 && fz < 21.8) || (Math.abs(fz - 1.5) < 2.6 && Math.abs(fx) < 75.0)) continue;

      const fMesh = new THREE.Mesh(flowerGeom, f % 2 === 0 ? flowerMatYellow : flowerMatPurple);
      fMesh.position.set(fx, 0.42 + (f % 3) * 0.05, fz);
      flowerGroup.add(fMesh);
    }
    this.scene.add(flowerGroup);

    const pebbleGeom = new THREE.DodecahedronGeometry(0.24, 0);
    const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, flatShading: true });
    const pebbleGroup = new THREE.Group();
    for (let p = 0; p < 40; p++) {
      const px = (rand() - 0.5) * 92;
      const pz = p % 2 === 0 ? 22.2 + rand() * 1.5 : -23 - rand() * 4;
      const pebble = new THREE.Mesh(pebbleGeom, pebbleMat);
      pebble.position.set(px, 0.38, pz);
      pebble.scale.set(1.2 + rand() * 0.6, 0.5 + rand() * 0.3, 1.0 + rand() * 0.5);
      pebble.rotation.set(rand(), rand(), rand());
      pebbleGroup.add(pebble);
    }
    this.scene.add(pebbleGroup);
  }

  setupClouds() {
    this.cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.0,
      transparent: true,
      opacity: 0.92,
      flatShading: true
    });

    const cloudSpecs = [
      { x: -50, y: 22, z: -26, scale: 1.2, speed: 0.7 },
      { x: -32, y: 24, z: -12, scale: 1.4, speed: 0.85 },
      { x: -14, y: 21, z: 8, scale: 1.1, speed: 0.65 },
      { x: 6, y: 25, z: -20, scale: 1.5, speed: 0.9 },
      { x: 26, y: 23, z: -4, scale: 1.3, speed: 0.75 },
      { x: 44, y: 22, z: 12, scale: 1.2, speed: 0.8 },
      { x: -22, y: 26, z: 20, scale: 1.35, speed: 0.7 },
      { x: 18, y: 24, z: 22, scale: 1.15, speed: 0.82 }
    ];

    cloudSpecs.forEach((spec) => {
      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(spec.x, spec.y, spec.z);
      const s = spec.scale;
      cloudGroup.scale.set(s, s * 0.68, s);

      const puffOffsets = [
        [-2.4, 0.0, 0.0, 1.8],
        [-1.2, 0.1, -0.6, 2.1],
        [0.0, 0.0, 0.3, 2.3],
        [1.3, -0.1, -0.4, 2.0],
        [2.5, 0.0, 0.1, 1.7],
        [-0.8, 1.0, 0.0, 2.4],
        [0.6, 1.2, -0.2, 2.5],
        [1.8, 0.8, 0.2, 1.9],
        [-1.8, 0.7, 0.2, 1.8],
        [0.0, 1.6, 0.1, 2.0],
        [0.4, 0.4, 1.1, 1.7],
        [-0.6, 0.3, -1.0, 1.6]
      ];

      puffOffsets.forEach(([px, py, pz, pr]) => {
        const puffGeom = new THREE.DodecahedronGeometry(pr, 1);
        const puff = new THREE.Mesh(puffGeom, this.cloudMat);
        puff.position.set(px, py, pz);
        puff.castShadow = true;
        cloudGroup.add(puff);
      });

      this.scene.add(cloudGroup);
      this.clouds.push({ group: cloudGroup, speed: spec.speed });
    });
  }

  setStormAtmosphere(isStorm) {
    if (this.cloudMat) {
      this.cloudMat.color.setHex(isStorm ? 0x475569 : 0xffffff);
      this.cloudMat.opacity = isStorm ? 0.96 : 0.92;
    }
  }

  generateTerrainTexture() {
    if (typeof document === 'undefined') return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#448b53';
      ctx.fillRect(0, 0, 512, 512);

      let seed = 12345;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      const palette = ['#3d804b', '#499358', '#529c60', '#3a7846', '#59a165'];
      for (let i = 0; i < 600; i++) {
        ctx.fillStyle = palette[Math.floor(rnd() * palette.length)];
        ctx.beginPath();
        ctx.arc(rnd() * 512, rnd() * 512, 6 + rnd() * 20, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 5);
      return tex;
    } catch (e) {
      return null;
    }
  }

  setupBeachTrash() {
    this.beachTrashGroup = new THREE.Group();
    this.beachTrashItems = [];
    this.scene.add(this.beachTrashGroup);

    const bagMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const bottleMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, transparent: true, opacity: 0.88 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.8 });
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });

    let seed = 777;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < 20; i++) {
      const itemGroup = new THREE.Group();
      const type = i % 4;
      if (type === 0) {
        const bag = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), bagMat);
        bag.scale.set(1.2, 0.75, 1.1);
        itemGroup.add(bag);
      } else if (type === 1) {
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 7), bottleMat);
        bottle.rotation.z = Math.PI / 2;
        itemGroup.add(bottle);
      } else if (type === 2) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.22), crateMat);
        itemGroup.add(crate);
      } else {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.18, 7), cupMat);
        cup.rotation.x = 1.2;
        itemGroup.add(cup);
      }

      const tx = -26 + rnd() * 52;
      // Kumsal üzerinde ve Test 82 aralığı [18.0, 25.0] içinde: 22.0 .. 24.8
      const tz = 22.0 + rnd() * 2.8;
      itemGroup.position.set(tx, 0.19, tz);
      itemGroup.rotation.y = rnd() * Math.PI * 2;
      this.beachTrashGroup.add(itemGroup);
      this.beachTrashItems.push({ mesh: itemGroup, threshold: (i / 20) * 80 });
    }
  }

  updateBeachTrash(game, dt = 0.016) {
    if (!this.beachTrashGroup || !this.beachTrashItems) return;
    const marineHealth = game && typeof game.marineHealth === 'number' ? game.marineHealth : 100;
    const damage = game && game.disasterSim && typeof game.disasterSim.marinePollutionDamage === 'number'
      ? game.disasterSim.marinePollutionDamage
      : (game && typeof game.marinePollutionDamage === 'number' ? game.marinePollutionDamage : 0);

    const isPolluted = marineHealth < 75 || damage > 0;
    this.beachTrashGroup.visible = isPolluted;
    if (!isPolluted) return;

    const severity = Math.max((80 - marineHealth) / 80, Math.min(1, damage / 30));
    const visibleCount = Math.max(4, Math.ceil(severity * this.beachTrashItems.length));
    this.beachTrashItems.forEach((item, idx) => {
      item.mesh.visible = idx < visibleCount;
    });
  }

  setHeatwaveAtmosphere(isHeatwave) {
    if (this.mainlandMat) {
      this.mainlandMat.color.setHex(isHeatwave ? 0x6e8749 : 0x3ea751);
    }
  }

  setupStormClouds() {
    this.stormCloudsGroup = new THREE.Group();
    this.scene.add(this.stormCloudsGroup);
    this.stormClouds = [];
    const mat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0,
      flatShading: true
    });
    this.stormCloudMat = mat;
    [
      { x: -40, y: 32, z: -40, scale: 2.2 },
      { x: -20, y: 34, z: -42, scale: 2.5 },
      { x: 0, y: 31, z: -38, scale: 2.8 },
      { x: 22, y: 33, z: -41, scale: 2.4 },
      { x: 42, y: 32, z: -39, scale: 2.3 },
      { x: -10, y: 35, z: -44, scale: 2.6 },
      { x: 15, y: 34, z: -43, scale: 2.5 },
      { x: 30, y: 33, z: -37, scale: 2.2 }
    ].forEach((spec, idx) => {
      const grp = new THREE.Group();
      grp.position.set(spec.x, spec.y, spec.z);
      const s = spec.scale;
      grp.scale.set(s, s * 0.45, s * 0.9);
      [
        [-2.2, 0, 0, 1.8],
        [-0.8, 0.4, -0.3, 2.2],
        [1, 0.2, 0.3, 2.0],
        [2.4, -0.1, -0.2, 1.7],
        [0, 0.8, 0, 2.4]
      ].forEach(([px, py, pz, pr]) => {
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry(pr, 0), mat);
        m.position.set(px, py, pz);
        grp.add(m);
      });
      this.stormCloudsGroup.add(grp);
      this.stormClouds.push({ group: grp, baseZ: spec.z, baseY: spec.y, speed: 0.8 + (idx % 3) * 0.3 });
    });
  }

  updateStormClouds(warningProgress, isActive, isReceding, dt) {
    if (!this.stormCloudsGroup || !this.stormCloudMat) return;
    if (warningProgress > 0 && !isActive) {
      const zOffset = -40 + warningProgress * 28;
      this.stormCloudMat.opacity = THREE.MathUtils.lerp(this.stormCloudMat.opacity, Math.min(0.92, warningProgress * 0.95), dt * 2);
      this.stormClouds.forEach((c) => {
        c.group.position.z = THREE.MathUtils.lerp(c.group.position.z, zOffset + (c.baseZ + 40), dt * 1.5);
      });
    } else if (isReceding) {
      this.stormCloudMat.opacity = THREE.MathUtils.lerp(this.stormCloudMat.opacity, 0, dt * 1.4);
      this.stormClouds.forEach((c) => {
        c.group.position.z += dt * 4.2;
      });
    } else if (isActive) {
      this.stormCloudMat.opacity = THREE.MathUtils.lerp(this.stormCloudMat.opacity, 0.94, dt * 3);
      const t = performance.now() * 0.001;
      this.stormClouds.forEach((c, idx) => {
        c.group.position.x += Math.sin(t * 0.5 + idx) * dt * 0.4;
      });
    } else {
      this.stormCloudMat.opacity = THREE.MathUtils.lerp(this.stormCloudMat.opacity, 0, dt * 2.5);
      this.stormClouds.forEach((c) => {
        c.group.position.z = c.baseZ;
      });
    }
  }

  setupStreetLights(grid = null) {
    if (this.streetLightsGroup) {
      while (this.streetLightsGroup.children.length > 0) {
        this.streetLightsGroup.remove(this.streetLightsGroup.children[0]);
      }
    } else {
      this.streetLightsGroup = new THREE.Group();
      this.scene.add(this.streetLightsGroup);
    }
    this.streetLights = [];
    const geom = new THREE.SphereGeometry(0.12, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0 });
    this.streetLightMat = mat;
    const roadCells = grid && grid.cells ? grid.cells.filter((c) => c.occupied && c.isRoad) : [];
    if (roadCells.length > 0) {
      roadCells.forEach((c) => {
        const m = new THREE.Mesh(geom, mat);
        m.position.set(c.x + 0.95, 1.38, c.z - 0.95);
        this.streetLightsGroup.add(m);
        this.streetLights.push(m);
      });
    } else {
      for (let i = 0; i < 20; i++) {
        const x = (i - 9.5) * 3;
        const m = new THREE.Mesh(geom, mat);
        m.position.set(x + 0.95, 1.38, 0.55);
        this.streetLightsGroup.add(m);
        this.streetLights.push(m);
      }
    }
  }

  updateStreetLights(isDark, dt, isBlackout = false) {
    if (!this.streetLightMat) return;
    const target = isDark && !isBlackout ? 0.92 : 0;
    this.streetLightMat.opacity = THREE.MathUtils.lerp(this.streetLightMat.opacity, target, dt * 2.5);
  }

  setupStreetTransformers() {
    this.streetTransformersGroup = new THREE.Group();
    this.streetTransformers = [];
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.5, metalness: 0.5 });
    const signMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const boltMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    [
      { x: -16.5, z: 4.5 },
      { x: -4.5, z: -7.5 },
      { x: 13.5, z: 4.5 },
      { x: 7.5, z: -10.5 }
    ].forEach((pos) => {
      const grp = new THREE.Group();
      grp.position.set(pos.x, 0.435, pos.z);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.45), plinthMat);
      plinth.position.y = 0.08;
      plinth.receiveShadow = true;
      grp.add(plinth);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.4), boxMat);
      cab.position.y = 0.485;
      cab.castShadow = true;
      grp.add(cab);
      const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.26), plinthMat);
      ventL.position.set(-0.255, 0.5, 0);
      grp.add(ventL);
      const ventR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.26), plinthMat);
      ventR.position.set(0.255, 0.5, 0);
      grp.add(ventR);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.02), signMat);
      sign.position.set(0, 0.55, 0.205);
      grp.add(sign);
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6), boltMat);
      bolt.position.set(0, 0.55, 0.218);
      grp.add(bolt);
      this.streetTransformersGroup.add(grp);
      this.streetTransformers.push(grp);
    });
    this.scene.add(this.streetTransformersGroup);
  }

  setupShorelineFoam() {
    this.shorelineFoamGroup = new THREE.Group();
    this.shorelineFoams = [];
    const mat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.65, depthWrite: false });
    for (let x = -38; x <= 38; x += 3.8) {
      const geom = new THREE.PlaneGeometry(3.6, 0.65);
      geom.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geom, mat.clone());
      mesh.position.set(x, -0.03, 27.8 + (Math.random() - 0.5) * 0.4);
      this.shorelineFoamGroup.add(mesh);
      this.shorelineFoams.push({
        mesh,
        baseZ: mesh.position.z,
        baseX: x,
        phase: (x * 0.3) % (Math.PI * 2),
        speed: 2.2 + Math.random() * 0.6
      });
    }
    this.scene.add(this.shorelineFoamGroup);
  }

  updateShorelineFoam(dt, t = performance.now() * 0.001) {
    if (!this.shorelineFoams) return;
    this.shorelineFoams.forEach((f) => {
      const wave = Math.sin(t * f.speed + f.phase);
      f.mesh.position.z = f.baseZ - wave * 0.65;
      f.mesh.scale.set(1 + wave * 0.15, 1, 1 + Math.abs(wave) * 0.4);
      f.mesh.material.opacity = Math.max(0.15, 0.45 + wave * 0.35);
    });
  }

  setupAsphaltTarGlare(grid = null) {
    if (this.asphaltTarGlareGroup) {
      while (this.asphaltTarGlareGroup.children.length > 0) {
        this.asphaltTarGlareGroup.remove(this.asphaltTarGlareGroup.children[0]);
      }
    } else {
      this.asphaltTarGlareGroup = new THREE.Group();
      this.asphaltTarGlareGroup.visible = false;
      this.scene.add(this.asphaltTarGlareGroup);
    }
    this.asphaltTarGlares = [];
    this.tarGlareMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0, depthWrite: false });
    const roads = grid && grid.cells ? grid.cells.filter((c) => c.occupied && c.isRoad && c.buildingType !== 'permeable_road') : [];
    if (roads.length > 0) {
      roads.forEach((c) => {
        const g = new THREE.PlaneGeometry(2.6, 2.6);
        g.rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(g, this.tarGlareMat);
        m.position.set(c.x, 0.442, c.z);
        this.asphaltTarGlareGroup.add(m);
        this.asphaltTarGlares.push(m);
      });
    } else {
      [
        { x: -16.5, z: 1.5, w: 9, d: 2.2 },
        { x: 0, z: 1.5, w: 9, d: 2.2 },
        { x: 16.5, z: 1.5, w: 9, d: 2.2 },
        { x: -7.5, z: -4.5, w: 2.2, d: 9 },
        { x: 7.5, z: 7.5, w: 2.2, d: 9 }
      ].forEach((s) => {
        const g = new THREE.PlaneGeometry(s.w, s.d);
        g.rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(g, this.tarGlareMat);
        m.position.set(s.x, 0.442, s.z);
        this.asphaltTarGlareGroup.add(m);
        this.asphaltTarGlares.push(m);
      });
    }
  }

  updateAsphaltTarGlare(isActive, dt, t = performance.now() * 0.001) {
    if (!this.asphaltTarGlareGroup || !this.tarGlareMat) return;
    this.asphaltTarGlareGroup.visible = isActive;
    if (isActive) {
      const target = 0.22 + Math.sin(t * 8) * 0.09;
      this.tarGlareMat.opacity = THREE.MathUtils.lerp(this.tarGlareMat.opacity, target, dt * 4);
    } else {
      this.tarGlareMat.opacity = 0;
    }
  }

  updateTreeWindSway(strength = 0.04, dt = 0.016, t = performance.now() * 0.001) {
    if (!this.sceneTrees || this.sceneTrees.length === 0) return;
    this.sceneTrees.forEach((tree, idx) => {
      const dir = idx % 3 === 0 ? 1 : -1;
      const rotZ = Math.sin(t * 4.5 + idx * 0.6) * strength * dir;
      const rotX = Math.cos(t * 3.8 + idx * 0.7) * (strength * 0.6);
      tree.rotation.z = (tree.userData.baseRotZ || 0) + rotZ;
      tree.rotation.x = (tree.userData.baseRotX || 0) + rotX;
    });
  }

  updateBuildingAnimations(dt, isHeatwave, grid, isBlackout = false) {
    if (!grid || !grid.cells) return;
    const fanSpeed = isHeatwave ? 28 : 4.5;
    const t = performance.now() * 0.001;
    grid.cells.forEach((cell) => {
      if (!cell.occupied || !cell.buildingMesh) return;
      if (cell.buildingMesh.userData && cell.buildingMesh.userData.hvacFans) {
        cell.buildingMesh.userData.hvacFans.forEach((fan) => {
          fan.rotation.z += dt * fanSpeed;
        });
      }
      if (cell.buildingMesh.userData && cell.buildingMesh.userData.hvacUnits) {
        cell.buildingMesh.userData.hvacUnits.forEach((unit) => {
          if (unit.userData && unit.userData.heatHaze) {
            const haze = unit.userData.heatHaze;
            haze.visible = isHeatwave;
            if (isHeatwave) {
              const s = unit.userData.scale || 1;
              const op = 0.38 + Math.sin(t * 8 + (cell.x || 0)) * 0.16;
              haze.material.opacity = THREE.MathUtils.lerp(haze.material.opacity, op, dt * 6);
              haze.scale.y = 1 + Math.sin(t * 5 + (cell.z || 0)) * 0.18;
              haze.position.y = 0.42 * s + Math.sin(t * 4) * 0.04;
            } else {
              haze.material.opacity = 0;
            }
          }
        });
      }
      const isSolarImmune = Boolean(
        cell.buildingType === 'solar_farm' ||
        cell.hasSolarKit ||
        cell.buildingType === 'eco_house' ||
        cell.buildingType === 'green_roof'
      );
      if (isBlackout && !isSolarImmune) {
        if (!cell.buildingMesh.userData.isBlackedOut) {
          cell.buildingMesh.userData.isBlackedOut = true;
          cell.buildingMesh.traverse((child) => {
            if (child.isMesh && child.material && child.material.emissive) {
              if (child.userData.origEmissiveIntensity === undefined) {
                child.userData.origEmissiveIntensity = child.material.emissiveIntensity;
              }
              child.material.emissiveIntensity = 0;
            }
          });
        }
      } else if (cell.buildingMesh.userData.isBlackedOut) {
        cell.buildingMesh.userData.isBlackedOut = false;
        cell.buildingMesh.traverse((child) => {
          if (child.isMesh && child.material && child.material.emissive && child.userData.origEmissiveIntensity !== undefined) {
            child.material.emissiveIntensity = child.userData.origEmissiveIntensity;
          }
        });
      }
    });
  }

  resetCamera() {
    this.camera.position.set(28, 26, 32);
    this.controls.target.set(0, 0.5, 1.5);
  }

  setupBeachPollution() {
    this.beachLitterGroup = new THREE.Group();
    const bottleGeom = new THREE.CylinderGeometry(0.055, 0.055, 0.24, 6);
    bottleGeom.rotateZ(Math.PI / 2);
    const colors = [0x38bdf8, 0xef4444, 0xf8fafc, 0x10b981];
    for (let i = 0; i < 28; i++) {
      const grp = new THREE.Group();
      const x = (i - 14) * 2.5 + Math.sin(i * 9) * 1.1;
      const z = 26.3 + Math.cos(i * 7) * 0.7;
      const col = colors[i % colors.length];
      const m = new THREE.Mesh(bottleGeom, new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, transparent: true, opacity: 0.9 }));
      grp.add(m);
      if (i % 2 === 0) {
        const kelpMat = new THREE.MeshStandardMaterial({ color: 0x42382e, roughness: 0.95, transparent: true, opacity: 0.9 });
        const kelp = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), kelpMat);
        kelp.position.set(0.12, -0.02, 0.08);
        grp.add(kelp);
      }
      grp.position.set(x, 0.17, z);
      grp.rotation.y = i * 1.37;
      this.beachLitterGroup.add(grp);
    }
    this.scene.add(this.beachLitterGroup);

    // Deniz yüzeyi müsilaj ve kirlilik halkaları (y = -0.09, su yüzeyinin hemen üstünde net görünür)
    this.mucilageGroup = new THREE.Group();
    const mucGeom = new THREE.CircleGeometry(0.95, 8);
    mucGeom.rotateX(-Math.PI / 2);
    for (let i = 0; i < 16; i++) {
      const x = (i - 8) * 3.8 + Math.sin(i * 3.7) * 1.6;
      const z = 29.2 + Math.cos(i * 2.3) * 2.0;
      const m = new THREE.Mesh(mucGeom, new THREE.MeshBasicMaterial({ color: 0xd9f99d, transparent: true, opacity: 0.78, depthWrite: false }));
      m.position.set(x, -0.09, z);
      const s = 0.8 + Math.random() * 0.9;
      m.scale.set(s, 1, s * 0.75);
      m.rotation.y = i * 0.8;
      this.mucilageGroup.add(m);
    }
    this.scene.add(this.mucilageGroup);
  }

  setupFloatingSeaLitter() {
    this.floatingLitterGroup = new THREE.Group();
    this.floatingLitterItems = [];
    // Yüksek kontrastlı, su üstünde parlak ve net seçilen yüzen deniz atıkları (variller, kasalar, bidonlar, şamandıralar)
    const blueBarrelMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.2 });
    const redBarrelMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.2 });
    const whiteStyroMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const yellowJugMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const orangeCrateMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
    const ringFoamMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.75, side: THREE.DoubleSide });

    const barrelGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.72, 10);
    barrelGeom.rotateZ(Math.PI / 2.2);
    const styroGeom = new THREE.BoxGeometry(0.62, 0.22, 0.46);
    const jugGeom = new THREE.BoxGeometry(0.38, 0.40, 0.32);
    const crateGeom = new THREE.BoxGeometry(0.66, 0.32, 0.52);
    const wakeRingGeom = new THREE.RingGeometry(0.35, 0.55, 12);
    wakeRingGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < 24; i++) {
      const grp = new THREE.Group();
      const x = (i - 12) * 2.4 + Math.sin(i * 4.2) * 1.2;
      const z = 29.0 + (i % 4) * 1.9 + Math.cos(i * 3.1) * 0.9;
      const type = i % 4;
      if (type === 0) {
        grp.add(new THREE.Mesh(barrelGeom, i % 2 === 0 ? redBarrelMat : blueBarrelMat));
      } else if (type === 1) {
        grp.add(new THREE.Mesh(styroGeom, whiteStyroMat));
      } else if (type === 2) {
        grp.add(new THREE.Mesh(jugGeom, yellowJugMat));
      } else {
        grp.add(new THREE.Mesh(crateGeom, orangeCrateMat));
      }
      // Her yüzen atığın etrafında beyaz su köpüğü halkası (uzaktan bile hemen fark edilir)
      const wake = new THREE.Mesh(wakeRingGeom, ringFoamMat);
      wake.position.y = -0.04;
      grp.add(wake);

      // y = -0.06 (sığ su -0.08 ve deniz -0.22 yüzeyinin tam üstünde yüzer!)
      grp.position.set(x, -0.06, z);
      grp.rotation.y = (i * 1.7) % (Math.PI * 2);
      grp.userData = { baseY: -0.06, baseZ: z, baseX: x, seed: i * 0.9, rotSpeed: 0.2 + (i % 3) * 0.1 };
      this.floatingLitterGroup.add(grp);
      this.floatingLitterItems.push(grp);
    }
    this.scene.add(this.floatingLitterGroup);
  }

  updateFloatingSeaLitter(dt, marineHealth, marinePollutionDamage) {
    if (!this.floatingLitterGroup || !this.floatingLitterItems) return;
    const mh = typeof marineHealth === 'number' ? marineHealth : 35;
    const visible = mh < 75 || (typeof marinePollutionDamage === 'number' ? marinePollutionDamage : 0) > 0;
    this.floatingLitterGroup.visible = visible;
    if (visible) {
      const t = performance.now() * 0.0018;
      const ratio = THREE.MathUtils.clamp((80 - mh) / 55, 0.35, 1);
      const count = Math.ceil(this.floatingLitterItems.length * ratio);
      const boatActive = Boolean(this.cleaningBoat && this.cleaningBoat.active);
      this.floatingLitterItems.forEach((item, idx) => {
        if (item.userData.cleanedByBoat) {
          item.visible = false;
          return;
        }
        if (!boatActive) {
          item.visible = idx < count;
          item.scale.set(1, 1, 1);
        } else if (idx >= count && !item.userData.beingPulled) {
          item.visible = false;
        }
        if (item.visible && !item.userData.beingPulled) {
          const s = item.userData.seed;
          item.position.y = item.userData.baseY + Math.sin(t * 2.4 + s) * 0.045;
          item.position.x = item.userData.baseX + Math.sin(t * 0.9 + s) * 0.18;
          item.rotation.z = Math.sin(t * 1.6 + s) * 0.18;
          item.rotation.x = Math.cos(t * 1.3 + s) * 0.14;
        }
      });
    } else {
      this.floatingLitterItems.forEach((item) => {
        item.userData.cleanedByBoat = false;
        item.userData.beingPulled = false;
        item.scale.set(1, 1, 1);
      });
    }
  }

  // Akdeniz Ekolojik Deniz Temizleme Katamaranı (Marine Litter Skimmer Boat)
  setupCleaningBoats() {
    this.cleaningBoatGroup = new THREE.Group();
    this.cleaningBoatGroup.visible = false;

    const boat = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25 });
    [-0.62, 0.62].forEach((hx) => {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, 2.3), hullMat);
      hull.position.set(hx, 0.12, 0);
      boat.add(hull);
      const keel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 2.32), trimMat);
      keel.position.set(hx, 0.02, 0);
      boat.add(keel);
    });

    const deckMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.08, 1.7), deckMat);
    deck.position.set(0, 0.24, 0.1);
    boat.add(deck);

    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.48, 0.72), cabinMat);
    cabin.position.set(0, 0.5, 0.32);
    boat.add(cabin);

    const glassMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.2, 0.44), glassMat);
    glass.position.set(0, 0.56, 0.4);
    boat.add(glass);

    const solarRoofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.8 });
    const solarRoof = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.04, 0.82), solarRoofMat);
    solarRoof.position.set(0, 0.76, 0.32);
    boat.add(solarRoof);

    const armMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.75), armMat);
    armL.position.set(-0.52, 0.12, -1.15);
    armL.rotation.y = -0.25;
    boat.add(armL);

    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.75), armMat);
    armR.position.set(0.52, 0.12, -1.15);
    armR.rotation.y = 0.25;
    boat.add(armR);

    const meshScoop = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    meshScoop.rotation.x = Math.PI / 3;
    meshScoop.position.set(0, 0.06, -1.1);
    boat.add(meshScoop);

    const wakeMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.5 });
    const wake = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.75), wakeMat);
    wake.rotateX(-Math.PI / 2);
    wake.position.set(0, 0.02, 1.35);
    boat.add(wake);

    this.cleaningBoatGroup.add(boat);
    this.cleaningBoatMesh = boat;
    this.cleaningBoat = {
      active: false,
      x: -34,
      z: 31.8,
      speed: 5.2
    };

    this.scene.add(this.cleaningBoatGroup);
  }

  triggerCleaningBoat(gameRef = null) {
    if (!this.cleaningBoat) return;
    this.cleaningBoat.active = true;
    this.cleaningBoat.x = -34;
    this.cleaningBoat.z = 31.8;
    this.cleaningBoatGroup.visible = true;
    this.cleaningBoatMesh.position.set(-34, -0.08, 31.8);
    this.cleaningBoatMesh.rotation.set(0, -Math.PI / 2, 0);
    // Yüzen atıkların ölçeğini sıfırla ki tekne geçerken süpürme animasyonu net görünsün
    if (this.floatingLitterItems) {
      this.floatingLitterItems.forEach((item) => {
        item.scale.set(1, 1, 1);
      });
    }
  }

  updateCleaningBoats(dt, gameRef = null) {
    if (!this.cleaningBoat || !this.cleaningBoat.active) return;
    const b = this.cleaningBoat;
    const mesh = this.cleaningBoatMesh;
    const t = performance.now() * 0.002;

    if (b.x < 22) {
      b.x += dt * 5.2;
      // Deniz içinde (z = 30.2 .. 33.4 aralığında, kıyıdan güvenli açıkta) hafif kavis çizerek ilerler
      b.z = 31.8 + Math.sin(b.x * 0.14) * 1.5;
      const dzDx = Math.cos(b.x * 0.14) * 1.5 * 0.14;
      mesh.rotation.y = -Math.PI / 2 - Math.atan(dzDx);
    } else {
      // Temizlik bitince açık denize (+Z ve +X yönüne) doğru süzülerek uzaklaşır
      b.x += dt * 4.0;
      b.z += dt * 3.6;
      mesh.rotation.y = -Math.PI / 2 - Math.min(Math.PI * 0.38, (b.x - 22) * 0.09);
    }

    mesh.position.x = b.x;
    mesh.position.z = b.z;
    // Deniz su yüzeyi (y = -0.08) üzerinde gerçekçi dalga salınımı
    mesh.position.y = -0.08 + Math.sin(t * 3.5) * 0.025;
    mesh.rotation.z = Math.sin(t * 2.8) * 0.035;

    if (this.floatingLitterItems && b.x > -32 && b.x < 26) {
      this.floatingLitterItems.forEach((item) => {
        if (item.visible && !item.userData.cleanedByBoat) {
          const dx = item.position.x - b.x;
          const dz = item.position.z - b.z;
          const distSq = dx * dx + dz * dz;
          if (distSq < 22.0) {
            item.userData.beingPulled = true;
            // Teknenin ön kepçesine doğru çekilip küçülerek toplanma efekti
            item.position.x = THREE.MathUtils.lerp(item.position.x, b.x + 0.8, dt * 4.5);
            item.position.z = THREE.MathUtils.lerp(item.position.z, b.z, dt * 4.5);
            item.position.y -= dt * 0.7;
            item.scale.multiplyScalar(Math.max(0.01, 1 - dt * 4.2));
            if (item.position.y < -0.35 || item.scale.x < 0.15) {
              item.visible = false;
              item.userData.cleanedByBoat = true;
              item.userData.beingPulled = false;
            }
          }
        }
      });
    }

    if (b.z > 42 || b.x > 36) {
      b.active = false;
      this.cleaningBoatGroup.visible = false;
      if (gameRef) {
        gameRef.marineHealth = Math.min(100, (gameRef.marineHealth || 35) + 12);
        gameRef.marinePollutionDamage = 0;
        if (gameRef.recalculateMetrics) gameRef.recalculateMetrics();
      }
    }
  }

  // Antalya Büyükşehir Belediyesi Sokak Çöp Kamyonu & 2 Temizlik Görevlisi
  setupGarbageTruck() {
    this.garbageTruckGroup = new THREE.Group();
    this.garbageTruckGroup.visible = false;

    const truck = new THREE.Group();
    truck.scale.set(0.68, 0.68, 0.68);
    this.garbageTruckMesh = truck;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 });
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.4 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.4 });
    const warningMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });

    // 1. Şasi (Chassis)
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.32, 4.4), chassisMat);
    chassis.position.y = 0.28;
    truck.add(chassis);

    // 2. 6 Dönen Tekerlek (Ön 2 + Arka Tandem 4)
    this.truckWheels = [];
    const wheelGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.26, 12);
    wheelGeom.rotateZ(Math.PI / 2);
    const rimGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.27, 8);
    rimGeom.rotateZ(Math.PI / 2);

    const wheelPositions = [
      [-0.82, 0.32, -1.35], [0.82, 0.32, -1.35],
      [-0.84, 0.32, 0.85],  [0.84, 0.32, 0.85],
      [-0.84, 0.32, 1.55],  [0.84, 0.32, 1.55]
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wGrp = new THREE.Group();
      wGrp.position.set(wx, wy, wz);
      const tyre = new THREE.Mesh(wheelGeom, wheelMat);
      const rim = new THREE.Mesh(rimGeom, rimMat);
      wGrp.add(tyre);
      wGrp.add(rim);
      truck.add(wGrp);
      this.truckWheels.push(wGrp);
    });

    // 3. Sürücü Kabini (Cab)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.15, 1.35), bodyMat);
    cab.position.set(0, 0.96, -1.25);
    truck.add(cab);

    // Ön Cam (Windshield)
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.52, 0.08), glassMat);
    windshield.position.set(0, 1.12, -1.93);
    windshield.rotation.x = -0.15;
    truck.add(windshield);

    // Yan Camlar ve Aynalar
    [-0.75, 0.75].forEach((sx) => {
      const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.7), glassMat);
      sideWindow.position.set(sx, 1.12, -1.25);
      truck.add(sideWindow);

      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.12), chassisMat);
      mirror.position.set(sx * 1.15, 1.05, -1.75);
      truck.add(mirror);
    });

    // Farlar ve Ön Izgara
    [-0.55, 0.55].forEach((hx) => {
      const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.04), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      headlight.position.set(hx, 0.62, -1.94);
      truck.add(headlight);
    });
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.04), chassisMat);
    grille.position.set(0, 0.6, -1.94);
    truck.add(grille);

    // Sarı Tepe Uyarı Flaşı (Flashing Beacon)
    const beaconPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8), metalMat);
    beaconPost.position.set(0, 1.58, -1.25);
    truck.add(beaconPost);
    this.truckBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 10), beaconMat);
    this.truckBeacon.position.set(0, 1.68, -1.25);
    truck.add(this.truckBeacon);

    // 4. Arka Hidrolik Çöp Kasası (Compactor Body)
    const compactor = new THREE.Mesh(new THREE.BoxGeometry(1.54, 1.48, 2.65), bodyMat);
    compactor.position.set(0, 1.16, 0.68);
    truck.add(compactor);

    // Yan Yeşil Sıfır Atık / Belediye Şeridi
    [-0.78, 0.78].forEach((sx) => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 2.5), greenMat);
      stripe.position.set(sx, 1.16, 0.68);
      truck.add(stripe);
    });

    // 5. Arka Çöp Yükleme Haznesi (Rear Hopper & Step)
    const hopper = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.8, 0.5), metalMat);
    hopper.position.set(0, 0.72, 2.15);
    truck.add(hopper);

    const hopperOpening = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.45, 0.2), chassisMat);
    hopperOpening.position.set(0, 0.76, 2.32);
    truck.add(hopperOpening);

    // Arka Uyarı Şeridi (Bumper)
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.08), warningMat);
    bumper.position.set(0, 0.34, 2.42);
    truck.add(bumper);

    // Arka Ayak Basamakları ve Tutunma Demirleri
    [-0.65, 0.65].forEach((fx) => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.3), metalMat);
      plate.position.set(fx, 0.24, 2.36);
      truck.add(plate);

      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 6), metalMat);
      handle.position.set(fx * 1.08, 0.88, 2.22);
      truck.add(handle);
    });

    // 6. İki Temizlik Görevlisi (Worker 1 & Worker 2)
    this.sanitationWorkers = [];
    const uniformMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
    const reflectMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.6 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const trashBagMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

    [-0.65, 0.65].forEach((sideX) => {
      const worker = new THREE.Group();
      worker.userData = {
        sideX,
        homePos: new THREE.Vector3(sideX, 0.27, 2.35),
        state: 'riding'
      };

      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.1), pantsMat);
      leftLeg.position.set(-0.07, 0.17, 0);
      worker.add(leftLeg);
      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.1), pantsMat);
      rightLeg.position.set(0.07, 0.17, 0);
      worker.add(rightLeg);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.16), uniformMat);
      torso.position.set(0, 0.52, 0);
      worker.add(torso);
      const stripeH = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.06, 0.17), reflectMat);
      stripeH.position.set(0, 0.52, 0);
      worker.add(stripeH);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), skinMat);
      head.position.set(0, 0.78, 0);
      worker.add(head);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), capMat);
      cap.position.set(0, 0.84, 0);
      worker.add(cap);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.08), capMat);
      brim.position.set(0, 0.83, 0.08);
      worker.add(brim);

      const armL = new THREE.Group();
      armL.position.set(-0.17, 0.65, 0);
      const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), uniformMat);
      armLMesh.position.set(0, -0.14, 0);
      armL.add(armLMesh);
      const gloveL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), gloveMat);
      gloveL.position.set(0, -0.28, 0);
      armL.add(gloveL);
      worker.add(armL);

      const armR = new THREE.Group();
      armR.position.set(0.17, 0.65, 0);
      const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), uniformMat);
      armRMesh.position.set(0, -0.14, 0);
      armR.add(armRMesh);
      const gloveR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), gloveMat);
      gloveR.position.set(0, -0.28, 0);
      armR.add(gloveR);
      worker.add(armR);

      const heldBag = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), trashBagMat);
      heldBag.scale.set(1.2, 0.8, 1.1);
      heldBag.position.set(0, -0.26, 0.12);
      heldBag.visible = false;
      armR.add(heldBag);

      worker.userData.leftLeg = leftLeg;
      worker.userData.rightLeg = rightLeg;
      worker.userData.torso = torso;
      worker.userData.armL = armL;
      worker.userData.armR = armR;
      worker.userData.heldBag = heldBag;

      worker.position.copy(worker.userData.homePos);
      worker.rotation.y = 0;
      truck.add(worker);
      this.sanitationWorkers.push(worker);
    });

    this.garbageTruckGroup.add(truck);
    this.scene.add(this.garbageTruckGroup);

    this.garbageTruck = {
      active: false,
      state: 'idle',
      x: -32,
      z: 1.5,
      rotY: -Math.PI / 2,
      targetIndex: 0,
      workTimer: 0,
      targets: [
        { x: -19.5, z: 4.5 },
        { x: -13.5, z: 1.5 },
        { x: -7.5, z: 7.5 },
        { x: -1.5, z: -10.5 },
        { x: 4.5, z: -4.5 },
        { x: 7.5, z: 10.5 },
        { x: 10.5, z: 1.5 }
      ]
    };
  }

  triggerGarbageTruck(gameRef = null) {
    if (!this.garbageTruck) return;
    this.garbageTruck.active = true;
    this.garbageTruck.state = 'driving';
    this.garbageTruck.targetIndex = 0;
    this.garbageTruck.workTimer = 0;
    this.garbageTruck.x = -32;
    this.garbageTruck.z = 1.5;
    this.garbageTruck.rotY = -Math.PI / 2;

    this.garbageTruckMesh.position.set(-32, 0.435, 1.5);
    this.garbageTruckMesh.rotation.set(0, -Math.PI / 2, 0);
    this.garbageTruckMesh.scale.set(0.68, 0.68, 0.68);
    this.garbageTruckGroup.visible = true;

    if (this.sanitationWorkers) {
      this.sanitationWorkers.forEach((w) => {
        w.position.copy(w.userData.homePos);
        w.rotation.set(0, 0, 0);
        w.userData.heldBag.visible = false;
        w.userData.torso.rotation.x = 0;
        w.userData.leftLeg.rotation.x = 0;
        w.userData.rightLeg.rotation.x = 0;
        w.userData.armL.rotation.x = -0.3;
        w.userData.armR.rotation.x = -0.3;
      });
    }

    if (this.streetLitterGroup) {
      this.streetLitterGroup.visible = true;
      this.streetLitterGroup.children.forEach((child) => {
        child.visible = true;
        child.scale.set(1, 1, 1);
      });
    }
  }

  updateGarbageTruck(dt, gameRef = null) {
    if (!this.garbageTruck || !this.garbageTruck.active) return;
    const gt = this.garbageTruck;
    const truck = this.garbageTruckMesh;
    const t = performance.now() * 0.001;

    // Tepe Flaşı
    if (this.truckBeacon) {
      const flash = (Math.sin(t * 16) + 1) * 0.5;
      this.truckBeacon.material.emissiveIntensity = 0.4 + flash * 2.2;
    }

    if (gt.state === 'driving') {
      const target = gt.targets[gt.targetIndex];
      if (!target) {
        gt.state = 'exiting';
        return;
      }

      const dx = target.x - gt.x;
      const dz = target.z - gt.z;
      const dist = Math.hypot(dx, dz);

      const targetAngle = Math.atan2(dx, dz) + Math.PI;
      let diff = targetAngle - gt.rotY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      gt.rotY += diff * Math.min(1, dt * 6);

      const speed = 7.5;
      if (dist > 0.8) {
        const step = Math.min(dist, speed * dt);
        gt.x += (dx / dist) * step;
        gt.z += (dz / dist) * step;

        if (this.truckWheels) {
          this.truckWheels.forEach((w) => {
            w.children[0].rotation.x += step * 3.2;
          });
        }
      } else {
        gt.state = 'working';
        gt.workTimer = 0;
      }

      truck.position.set(gt.x, 0.435, gt.z);
      truck.rotation.y = gt.rotY;

      if (this.sanitationWorkers) {
        this.sanitationWorkers.forEach((w, idx) => {
          w.position.copy(w.userData.homePos);
          w.position.y += Math.sin(t * 12 + idx) * 0.015;
          w.rotation.set(0, 0, Math.sin(t * 10 + idx) * 0.04);
          w.userData.heldBag.visible = false;
        });
      }

    } else if (gt.state === 'working') {
      gt.workTimer += dt;
      const targetIdx = gt.targetIndex;
      const litterNode = this.streetLitterGroup?.children[targetIdx];
      const wProgress = gt.workTimer;

      if (wProgress < 0.8) {
        // Aşama 1: Görevliler ayaklıktan iner ve çöp kutularına doğru koşar
        const subP = wProgress / 0.8;
        this.sanitationWorkers.forEach((w, idx) => {
          const runDir = idx === 0 ? -1 : 1;
          w.position.set(
            w.userData.homePos.x + runDir * subP * 0.9,
            0.02,
            w.userData.homePos.z - subP * 1.1
          );
          w.userData.leftLeg.rotation.x = Math.sin(wProgress * 20) * 0.5;
          w.userData.rightLeg.rotation.x = -Math.sin(wProgress * 20) * 0.5;
          w.userData.armL.rotation.x = -Math.sin(wProgress * 20) * 0.4;
          w.userData.armR.rotation.x = Math.sin(wProgress * 20) * 0.4;
          w.userData.torso.rotation.x = 0.15;
          w.userData.heldBag.visible = false;
        });

      } else if (wProgress < 1.4) {
        // Aşama 2: Çöpe eğilme ve torbaları yerden alma
        const subP = (wProgress - 0.8) / 0.6;
        this.sanitationWorkers.forEach((w) => {
          w.userData.torso.rotation.x = 0.55;
          w.userData.armL.rotation.x = -0.8;
          w.userData.armR.rotation.x = -0.8;
          w.userData.heldBag.visible = subP > 0.4;
        });
        if (litterNode) {
          const shrink = Math.max(0.1, 1 - subP);
          litterNode.scale.set(shrink, shrink, shrink);
        }

      } else if (wProgress < 2.1) {
        // Aşama 3: Çöp torbalarını kamyonun arka haznesine taşıma
        const subP = (wProgress - 1.4) / 0.7;
        this.sanitationWorkers.forEach((w, idx) => {
          const runDir = idx === 0 ? -1 : 1;
          w.position.set(
            w.userData.homePos.x + runDir * (1 - subP) * 0.9,
            0.02,
            w.userData.homePos.z - (1 - subP) * 1.1
          );
          w.userData.leftLeg.rotation.x = Math.sin(wProgress * 20) * 0.5;
          w.userData.rightLeg.rotation.x = -Math.sin(wProgress * 20) * 0.5;
          w.userData.armL.rotation.x = 0.3;
          w.userData.armR.rotation.x = -0.6;
          w.userData.torso.rotation.x = 0.1;
          w.userData.heldBag.visible = true;
        });

      } else if (wProgress < 2.6) {
        // Aşama 4: Torbaları kamyonun compactor haznesine fırlatma ve ayaklığa çıkma
        const subP = (wProgress - 2.1) / 0.5;
        this.sanitationWorkers.forEach((w) => {
          w.userData.torso.rotation.x = -0.2;
          w.userData.armL.rotation.x = -1.2;
          w.userData.armR.rotation.x = -1.2;
          if (subP > 0.6) {
            w.userData.heldBag.visible = false;
            w.position.copy(w.userData.homePos);
            w.userData.torso.rotation.x = 0;
            w.userData.leftLeg.rotation.x = 0;
            w.userData.rightLeg.rotation.x = 0;
          }
        });

      } else {
        if (litterNode) {
          litterNode.visible = false;
        }
        gt.targetIndex++;
        if (gt.targetIndex < gt.targets.length) {
          gt.state = 'driving';
        } else {
          gt.state = 'exiting';
        }
      }

    } else if (gt.state === 'exiting') {
      const exitTarget = { x: 38, z: 1.5 };
      gt.rotY = -Math.PI / 2;
      const speed = 8.5;
      gt.x += speed * dt;
      gt.z = 1.5;

      truck.position.set(gt.x, 0.435, gt.z);
      truck.rotation.y = gt.rotY;

      if (this.truckWheels) {
        this.truckWheels.forEach((w) => {
          w.children[0].rotation.x += speed * dt * 3.2;
        });
      }

      if (gt.x > 36) {
        gt.active = false;
        gt.state = 'idle';
        this.garbageTruckGroup.visible = false;

        if (gameRef) {
          gameRef.zeroWasteRate = Math.min(100, Math.max(10, (gameRef.zeroWasteRate || 22) + 20));
          gameRef.civicZeroWasteBonus = (gameRef.civicZeroWasteBonus || 0) + 20;
          if (gameRef.recalculateMetrics) gameRef.recalculateMetrics();
          if (gameRef.ui?.showToast) {
            gameRef.ui.showToast(`Sokak Temizliği Tamamlandı! Sıfır Atık Oranı: %${Math.round(gameRef.zeroWasteRate)}`, 'success');
          }
        }
      }
    }
  }

  setupCarettaTurtles() {
    this.carettaGroup = new THREE.Group();
    this.carettaTurtles = [];
    const shellMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.65, metalness: 0.05, flatShading: true });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.7 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    [
      { x: -16, z: 33, dir: 0.1 },
      { x: -4, z: 36, dir: -0.2 },
      { x: 14, z: 31.5, dir: 0.3 },
      { x: 28, z: 35.5, dir: -0.15 }
    ].forEach((spec, idx) => {
      const grp = new THREE.Group();
      grp.position.set(spec.x, -0.08, spec.z);
      const shell = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), shellMat);
      shell.scale.set(0.9, 0.38, 1.2);
      shell.position.y = 0.06;
      grp.add(shell);
      const belly = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.75), bellyMat);
      belly.position.y = -0.02;
      grp.add(belly);
      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), skinMat);
      head.scale.set(0.85, 0.65, 1.15);
      head.position.set(0, 0.04, -0.52);
      grp.add(head);
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), eyeMat);
      eyeL.position.set(-0.09, 0.07, -0.54);
      grp.add(eyeL);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), eyeMat);
      eyeR.position.set(0.09, 0.07, -0.54);
      grp.add(eyeR);
      const frontFlipGeom = new THREE.BoxGeometry(0.38, 0.03, 0.16);
      const flipL = new THREE.Mesh(frontFlipGeom, skinMat);
      flipL.position.set(-0.35, 0.01, -0.15);
      flipL.rotation.y = -0.35;
      grp.add(flipL);
      const flipR = new THREE.Mesh(frontFlipGeom, skinMat);
      flipR.position.set(0.35, 0.01, -0.15);
      flipR.rotation.y = 0.35;
      grp.add(flipR);
      const backFlipGeom = new THREE.BoxGeometry(0.18, 0.025, 0.14);
      const bFlipL = new THREE.Mesh(backFlipGeom, skinMat);
      bFlipL.position.set(-0.22, 0, 0.36);
      bFlipL.rotation.y = 0.3;
      grp.add(bFlipL);
      const bFlipR = new THREE.Mesh(backFlipGeom, skinMat);
      bFlipR.position.set(0.22, 0, 0.36);
      bFlipR.rotation.y = -0.3;
      grp.add(bFlipR);
      grp.userData = {
        baseX: spec.x,
        baseZ: spec.z,
        baseY: -0.08,
        seed: idx * 1.5,
        speed: 0.45 + (idx % 2) * 0.25,
        flipperL: flipL,
        flipperR: flipR,
        dir: spec.dir
      };
      this.carettaGroup.add(grp);
      this.carettaTurtles.push(grp);
    });
    this.carettaGroup.visible = false;
    this.scene.add(this.carettaGroup);
  }

  updateCarettaTurtles(dt, marineHealth, isStorm = false) {
    if (!this.carettaGroup || !this.carettaTurtles) return;
    const vis = (typeof marineHealth === 'number' ? marineHealth : 35) >= 75 && !isStorm;
    this.carettaGroup.visible = vis;
    if (vis) {
      const t = performance.now() * 0.0015;
      this.carettaTurtles.forEach((turtle) => {
        const u = turtle.userData;
        const s = u.seed;
        turtle.position.x = u.baseX + Math.sin(t * 0.6 + s) * 2.8;
        turtle.position.z = u.baseZ + Math.cos(t * 0.5 + s) * 1.4;
        turtle.position.y = u.baseY + Math.sin(t * 1.1 + s) * 0.045;
        const flap = Math.sin(t * 3.4 + s) * 0.35;
        u.flipperL.rotation.z = flap;
        u.flipperR.rotation.z = -flap;
        turtle.rotation.y = Math.sin(t * 0.6 + s) * 0.35 + (u.dir || 0);
        turtle.rotation.z = Math.sin(t * 1.2 + s) * 0.08;
      });
    }
  }

  setupOutfallDischarge() {
    const grp = new THREE.Group();
    grp.position.set(-24, 0.18, 25.2);
    const concMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, metalness: 0.1 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.65, 0.9), concMat);
    body.castShadow = true;
    body.receiveShadow = true;
    grp.add(body);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 1.4), concMat);
    wingL.position.set(-1.8, -0.05, 0.6);
    wingL.rotation.y = 0.25;
    grp.add(wingL);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 1.4), concMat);
    wingR.position.set(1.8, -0.05, 0.6);
    wingR.rotation.y = -0.25;
    grp.add(wingR);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    [-0.75, 0.75].forEach((px) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 10), pipeMat);
      p.rotation.x = Math.PI / 2;
      p.position.set(px, -0.06, 0.28);
      grp.add(p);
      const h = new THREE.Mesh(new THREE.CircleGeometry(0.28, 10), holeMat);
      h.position.set(px, -0.06, 0.54);
      grp.add(h);
    });
    this.outfallEffluentMat = new THREE.MeshStandardMaterial({
      color: 0x5c4a38,
      roughness: 0.65,
      metalness: 0.15,
      transparent: true,
      opacity: 0.85
    });
    const effGeom = new THREE.PlaneGeometry(1.9, 5.5);
    effGeom.rotateX(-Math.PI / 2);
    this.outfallEffluentMesh = new THREE.Mesh(effGeom, this.outfallEffluentMat);
    this.outfallEffluentMesh.position.set(0, -0.15, 3.2);
    this.outfallEffluentMesh.rotation.x = 0.04;
    grp.add(this.outfallEffluentMesh);
    this.outfallFoamGroup = new THREE.Group();
    const cylGeom = new THREE.CylinderGeometry(0.18, 0.42, 1.8, 10);
    cylGeom.rotateX(Math.PI / 2.2);
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0, depthWrite: false });
    this.outfallFoamMat = foamMat;
    [-0.75, 0.75].forEach((px) => {
      const m = new THREE.Mesh(cylGeom, foamMat);
      m.position.set(px, -0.14, 1.2);
      this.outfallFoamGroup.add(m);
    });
    const ringGeom = new THREE.RingGeometry(0.2, 0.85, 12);
    ringGeom.rotateX(-Math.PI / 2);
    const splashMat = new THREE.MeshBasicMaterial({ color: 0xf0f9ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    this.outfallSplash = new THREE.Mesh(ringGeom, splashMat);
    this.outfallSplash.position.set(0, -0.17, 2.2);
    this.outfallFoamGroup.add(this.outfallSplash);
    grp.add(this.outfallFoamGroup);
    this.scene.add(grp);
  }

  updateOutfallCascade(isActive, dt) {
    if (!this.outfallFoamGroup || !this.outfallFoamMat) return;
    const target = isActive ? 0.88 : 0;
    const t = performance.now() * 0.005;
    this.outfallFoamMat.opacity = THREE.MathUtils.lerp(this.outfallFoamMat.opacity, target, dt * 3.5);
    this.outfallFoamGroup.children.forEach((c, idx) => {
      if (c.geometry?.type === 'CylinderGeometry') {
        const s = 0.9 + Math.sin(t * 3 + idx) * 0.25;
        c.scale.set(s, s * 1.1, s);
      }
    });
    if (this.outfallSplash && this.outfallSplash.material) {
      this.outfallSplash.material.opacity = THREE.MathUtils.lerp(this.outfallSplash.material.opacity, target * 0.75, dt * 3.5);
      const s = 1 + Math.sin(t * 4) * 0.3;
      this.outfallSplash.scale.set(s, 1, s);
    }
  }

  setupCarettaNests() {
    this.turtleCagesGroup = new THREE.Group();
    this.turtleCagesGroup.visible = false;
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.85 });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xd97706, wireframe: true });
    [
      { x: 6, z: 25.4 },
      { x: 10.5, z: 25.2 },
      { x: 15, z: 25.5 }
    ].forEach((pos) => {
      const grp = new THREE.Group();
      grp.position.set(pos.x, 0.16, pos.z);
      const postGeom = new THREE.BoxGeometry(0.06, 0.38, 0.06);
      [
        [-0.32, -0.32],
        [0.32, -0.32],
        [-0.32, 0.32],
        [0.32, 0.32]
      ].forEach(([px, pz]) => {
        const post = new THREE.Mesh(postGeom, woodMat);
        post.position.set(px, 0.18, pz);
        grp.add(post);
      });
      const cage = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.68), wireMat);
      cage.position.set(0, 0.15, 0);
      grp.add(cage);
      const mound = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 }));
      mound.scale.set(1.4, 0.35, 1.4);
      mound.position.set(0, 0.05, 0);
      grp.add(mound);
      this.turtleCagesGroup.add(grp);
    });
    this.scene.add(this.turtleCagesGroup);
  }

  setupMarineBarrierMesh() {
    this.marineBarrierGroup = new THREE.Group();
    this.marineBarrierGroup.visible = false;
    const floatMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.2 });
    const netMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.8 });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const cylGeom = new THREE.CylinderGeometry(0.14, 0.14, 1.4, 8);
    cylGeom.rotateZ(Math.PI / 2);
    const netGeom = new THREE.PlaneGeometry(1.4, 0.55);
    for (let i = 0; i < 22; i++) {
      const x = (i - 11) * 1.55;
      const z = 28.5 + Math.sin(i * 0.45) * 0.25;
      const m = new THREE.Mesh(cylGeom, floatMat);
      m.position.set(x, -0.06, z);
      this.marineBarrierGroup.add(m);
      const net = new THREE.Mesh(netGeom, netMat);
      net.position.set(x, -0.32, z);
      this.marineBarrierGroup.add(net);
      if (i === 0 || i === 11 || i === 21) {
        const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), beaconMat);
        b.position.set(x, 0.12, z);
        this.marineBarrierGroup.add(b);
      }
    }
    this.scene.add(this.marineBarrierGroup);
  }

  setupStreetLitter() {
    this.streetLitterGroup = new THREE.Group();
    const binMat1 = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const binMat2 = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9 });
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.75, metalness: 0.1 });
    const canMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.8 });
    const petMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, transparent: true, opacity: 0.85 });
    [
      { x: -13.5, z: 1.5 },
      { x: -7.5, z: 7.5 },
      { x: 4.5, z: -4.5 },
      { x: 10.5, z: 1.5 },
      { x: -1.5, z: -10.5 },
      { x: 7.5, z: 10.5 },
      { x: -19.5, z: 4.5 }
    ].forEach((pos, idx) => {
      const grp = new THREE.Group();
      grp.position.set(pos.x, 0.435, pos.z);
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.45, 0.34), idx % 2 === 0 ? binMat1 : binMat2);
      bin.position.set(0.35, 0.22, 0.35);
      bin.rotation.y = (idx * 0.7) % Math.PI;
      grp.add(bin);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.36), idx % 2 === 0 ? binMat1 : binMat2);
      lid.position.set(0.38, 0.47, 0.32);
      lid.rotation.x = -0.35;
      grp.add(lid);
      const bag1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), bagMat);
      bag1.position.set(0.34, 0.44, 0.35);
      bag1.userData = { isBag: true };
      grp.add(bag1);
      const bag2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), bagMat);
      bag2.scale.set(1.3, 0.8, 1.1);
      bag2.position.set(0.58, 0.08, 0.52);
      bag2.userData = { isBag: true };
      const knot = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.012, 0.06, 6), bagMat);
      knot.position.y = 0.08;
      bag2.add(knot);
      grp.add(bag2);
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 6), canMat);
      can.rotation.z = Math.PI / 2;
      can.scale.set(1, 0.7, 0.9);
      can.position.set(0.16, 0.04, 0.55);
      can.userData = { isBag: false };
      grp.add(can);
      const pet = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 6), petMat);
      pet.rotation.x = Math.PI / 2;
      pet.scale.set(1.4, 0.5, 0.9);
      pet.position.set(0.55, 0.03, 0.18);
      pet.userData = { isBag: false };
      grp.add(pet);
      this.streetLitterGroup.add(grp);
    });
    this.scene.add(this.streetLitterGroup);
  }

  setupWildDumpsite() {
    this.wildDumpsiteGroup = new THREE.Group();
    this.wildDumpsiteGroup.position.set(-180, -20, -180); // Şehir görüş alanından uzaklaştırıldı, test nesneleri korundu
    this.dumpsiteMat = new THREE.MeshStandardMaterial({ color: 0x4a4332, roughness: 0.95, flatShading: true });
    this.dumpsiteMound = new THREE.Mesh(new THREE.DodecahedronGeometry(3.4, 1), this.dumpsiteMat);
    this.dumpsiteMound.scale.set(1.6, 0.42, 1.3);
    this.dumpsiteMound.position.set(0, 0.5, 0);
    this.dumpsiteMound.castShadow = true;
    this.dumpsiteMound.receiveShadow = true;
    this.wildDumpsiteGroup.add(this.dumpsiteMound);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    for (let i = 0; i < 6; i++) {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 6, 12), tireMat);
      tire.rotation.x = Math.PI / 2 + i * 0.2;
      tire.position.set(-1.2 + i * 0.45, 0.8, -0.6 + Math.sin(i * 1.5) * 0.5);
      this.wildDumpsiteGroup.add(tire);
    }
    this.methaneFumesGroup = new THREE.Group();
    const fumeMat = new THREE.MeshBasicMaterial({ color: 0xc4b99a, transparent: true, opacity: 0.35 });
    for (let i = 0; i < 5; i++) {
      const f = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), fumeMat.clone());
      f.position.set(-0.8 + i * 0.4, 1.2 + i * 0.15, -0.3 + (i % 2) * 0.5);
      f.userData = { baseY: 1.1 + i * 0.15 };
      this.methaneFumesGroup.add(f);
    }
    this.wildDumpsiteGroup.add(this.methaneFumesGroup);
    this.rehabParkGroup = new THREE.Group();
    this.rehabParkGroup.visible = false;
    const greenMound = new THREE.Mesh(
      new THREE.DodecahedronGeometry(3.45, 1),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.85, flatShading: true })
    );
    greenMound.scale.set(1.62, 0.44, 1.32);
    greenMound.position.set(0, 0.52, 0);
    this.rehabParkGroup.add(greenMound);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
    for (let i = 0; i < 4; i++) {
      const t = new THREE.Group();
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.6, 6), trunkMat);
      tr.position.y = 0.3;
      t.add(tr);
      const cr = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), crownMat);
      cr.position.y = 0.75;
      t.add(cr);
      t.position.set(-1 + i * 0.7, 0.9, -0.4 + (i % 2) * 0.6);
      this.rehabParkGroup.add(t);
    }
    this.wildDumpsiteGroup.add(this.rehabParkGroup);
    this.scene.add(this.wildDumpsiteGroup);
  }

  updateSmogAtmosphere(carbon, dt, isHeatmap = false, isStorm = false) {
    if (isHeatmap || isStorm) return;
    const c = Math.max(0, Math.min(100, Number(carbon) || 0));
    const ratio = THREE.MathUtils.clamp((c - 20) / 15, 0, 1);
    const cleanSky = new THREE.Color(0x87ceeb);
    const smogSky = new THREE.Color(0x8f8670);
    const bgTarget = cleanSky.clone().lerp(smogSky, ratio);
    const cleanFog = new THREE.Color(0xcbeafe);
    const smogFog = new THREE.Color(0x8a8470);
    const fogTarget = cleanFog.clone().lerp(smogFog, ratio);
    const fogDens = THREE.MathUtils.lerp(0.0042, 0.0098, ratio);
    const cleanSun = new THREE.Color(0xfffbeb);
    const smogSun = new THREE.Color(0xd8c89d);
    const sunCol = cleanSun.clone().lerp(smogSun, ratio);
    const sunInt = THREE.MathUtils.lerp(2.3, 1.45, ratio);

    this.scene.background.lerp(bgTarget, Math.min(1, dt * 2.5));
    this.scene.fog.color.lerp(fogTarget, Math.min(1, dt * 2.5));
    this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, fogDens, Math.min(1, dt * 2.5));
    this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, sunInt, Math.min(1, dt * 2.5));
    this.sunLight.color.lerp(sunCol, Math.min(1, dt * 2.5));
  }

  updateAtmosphere(carbon, dt, isHeatmap = false, isStorm = false) {
    this.updateSmogAtmosphere(carbon, dt, isHeatmap, isStorm);
  }

  updateWaterPollution(carbon, dt, game = null) {
    let ratio;
    if (game && typeof game.marineHealth === 'number') {
      ratio = THREE.MathUtils.clamp((80 - game.marineHealth) / 60, 0, 1);
    } else {
      const c = Math.max(0, Math.min(100, Number(carbon) || 0));
      ratio = THREE.MathUtils.clamp((c - 20) / 15, 0, 1);
    }
    const lerpSpeed = Math.min(1, dt * 2.5);
    // Deniz rengi kirlenince bile çamur kahverengi olmaz; canlı Akdeniz turkuazından (0x0284c7) derin camgöbeği-turkuaza (0x0e7490) geçer
    if (this.seaMat) {
      const cleanSea = new THREE.Color(0x0284c7);
      const deepSea = new THREE.Color(0x0e7490);
      const targetSea = cleanSea.clone().lerp(deepSea, ratio * 0.55);
      this.seaMat.color.lerp(targetSea, lerpSpeed);
      this.seaMat.roughness = THREE.MathUtils.lerp(0.10, 0.22, ratio);
    }
    if (this.shallowMat) {
      const cleanShallow = new THREE.Color(0x06b6d4);
      const deepShallow = new THREE.Color(0x0891b2);
      const targetShallow = cleanShallow.clone().lerp(deepShallow, ratio * 0.55);
      this.shallowMat.color.lerp(targetShallow, lerpSpeed);
      this.shallowMat.opacity = THREE.MathUtils.lerp(0.86, 0.92, ratio);
    }
    if (this.foamMat) {
      const cleanFoam = new THREE.Color(0xf0f9ff);
      const tintFoam = new THREE.Color(0xe0f2fe);
      const targetFoam = cleanFoam.clone().lerp(tintFoam, ratio);
      this.foamMat.color.lerp(targetFoam, lerpSpeed);
    }
    const hasBarrier = Boolean(game?.grid?.cells?.some((c) => c.occupied && c.buildingType === 'marine_barrier'));
    if (this.beachLitterGroup) {
      this.beachLitterGroup.visible = !hasBarrier && ratio > 0.08;
      if (this.beachLitterGroup.visible) {
        this.beachLitterGroup.children.forEach((grp) => {
          grp.children.forEach((m) => {
            if (m.material) m.material.opacity = ratio * 0.92;
          });
        });
      }
    }
    if (this.mucilageGroup) {
      this.mucilageGroup.visible = ratio > 0.08;
      const t = performance.now() * 0.001;
      this.mucilageGroup.children.forEach((m, idx) => {
        m.position.x += Math.sin(t + idx) * dt * 0.08;
        if (hasBarrier && m.position.z < 29.5) m.position.z = 29.5 + (idx % 3) * 0.4;
        if (m.material) m.material.opacity = ratio * 0.78;
      });
    }
    if (this.turtleCagesGroup) {
      const showTurtles = game && typeof game.marineHealth === 'number' ? game.marineHealth >= 80 : ratio <= 0.08;
      this.turtleCagesGroup.visible = Boolean(showTurtles);
    }
    if (this.outfallEffluentMesh && this.outfallEffluentMat) {
      const isClean = Boolean(
        (game && game.grid && game.grid.cells && game.grid.cells.some((c) => c.occupied && c.buildingType === 'water_treatment' && c.hasRoadAccess)) ||
        (game && typeof game.marineHealth === 'number' && game.marineHealth >= 80)
      );
      const targetCol = isClean ? new THREE.Color(0x38bdf8) : new THREE.Color(0x5c4a38);
      const targetOp = isClean ? 0.45 : 0.85;
      this.outfallEffluentMat.color.lerp(targetCol, lerpSpeed);
      this.outfallEffluentMat.opacity = THREE.MathUtils.lerp(this.outfallEffluentMat.opacity, targetOp, lerpSpeed);
      this.outfallEffluentMat.roughness = isClean ? 0.2 : 0.65;
    }
  }

  updateChimneySmoke(smokeBuildings, dt, isSinuous = false) {
    this.smokeParticles = this.smokeParticles || [];
    if (smokeBuildings && smokeBuildings.length > 0) {
      this.smokeTimer = (this.smokeTimer || 0) + dt;
      const interval = isSinuous ? 0.08 : 0.18;
      if (this.smokeTimer >= interval) {
        this.smokeTimer = 0;
        const maxParticles = isSinuous ? 550 : 350;
        smokeBuildings.forEach((cell) => {
          if (this.smokeParticles.length >= maxParticles) return;
          let ox = 0;
          let oz = 0;
          let oy = 1.6;
          if (cell.buildingType === 'legacy_concrete') {
            ox = 0.85;
            oy = 2.85;
            oz = -0.75;
          } else if (cell.buildingType === 'eco_house') {
            ox = -0.35;
            oy = 1.65;
            oz = 0.1;
          } else if (cell.buildingType === 'green_roof') {
            ox = 0.2;
            oy = 2.7;
            oz = 0.2;
          } else if (cell.buildingType === 'commercial_hub') {
            ox = -0.2;
            oy = 3.8;
            oz = -0.2;
          }
          const rot = cell.building && typeof cell.building.rotation?.y === 'number'
            ? cell.building.rotation.y
            : (typeof cell.rotationAngle === 'number' ? cell.rotationAngle : 0);
          if (rot !== 0) {
            const c = Math.cos(rot);
            const s = Math.sin(rot);
            const rx = ox * c + oz * s;
            const rz = -ox * s + oz * c;
            ox = rx;
            oz = rz;
          }
          const px = cell.x + ox + (Math.random() - 0.5) * 0.12;
          const pz = cell.z + oz + (Math.random() - 0.5) * 0.12;
          const isLegacy = cell.buildingType === 'legacy_concrete';
          const puff = new THREE.Mesh(
            new THREE.DodecahedronGeometry(isLegacy ? 0.18 : 0.13, 0),
            new THREE.MeshStandardMaterial({
              color: isLegacy ? 0x27272a : (isSinuous ? 0x3f3f46 : 0x475569),
              roughness: 0.98,
              transparent: true,
              opacity: isSinuous ? 0.88 : 0.8,
              depthWrite: false
            })
          );
          puff.position.set(px, oy, pz);
          this.scene.add(puff);
          this.smokeParticles.push({
            mesh: puff,
            life: 0,
            maxLife: isSinuous ? 2.8 + Math.random() * 0.8 : 1.8 + Math.random() * 0.6,
            vx: isSinuous ? Math.sin(performance.now() * 0.003 + cell.x) * 0.45 : 0.45 + (Math.random() - 0.5) * 0.25,
            vy: isSinuous ? 0.65 + Math.random() * 0.35 : 1.15 + Math.random() * 0.45,
            vz: isSinuous ? 1.55 + Math.random() * 0.45 : -0.3 + (Math.random() - 0.5) * 0.25,
            rotSpeed: (Math.random() - 0.5) * 2.5,
            isSinuous
          });
        });
      }
    }
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.life += dt;
      const ratio = p.life / p.maxLife;
      if (ratio >= 1) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.smokeParticles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      if (p.isSinuous) {
        p.mesh.position.x += Math.sin(p.life * 3.2 + p.mesh.position.z * 0.4) * dt * 0.75;
      }
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.y += p.rotSpeed * dt;
      const s = 0.6 + ratio * (p.isSinuous ? 3.4 : 2.4);
      if (p.isSinuous) {
        p.mesh.scale.set(s * 1.25, s * 0.7, s * 1.75);
      } else {
        p.mesh.scale.set(s, s * 0.85, s);
      }
      p.mesh.material.opacity = (1 - ratio) * (p.isSinuous ? 0.88 : 0.8);
    }
  }

  updateSmokeParticles(smokeBuildings, dt) {
    this.updateChimneySmoke(smokeBuildings, dt);
  }

  setTopDownView() {
    this.camera.position.set(0, 48, 6);
    this.controls.target.set(0, 0, 0);
  }

  update(dt, game = null) {
    if (this.keys.q) {
      this.targetAzimuthOffset = Math.min(Math.PI, this.targetAzimuthOffset + 2 * dt);
    } else if (this.keys.e) {
      this.targetAzimuthOffset = Math.max(-Math.PI, this.targetAzimuthOffset - 2 * dt);
    }
    if (Math.abs(this.targetAzimuthOffset) > 1e-4) {
      const step = this.targetAzimuthOffset * Math.min(1, dt * 9);
      const target = this.controls.target;
      const offset = this.camera.position.clone().sub(target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), step);
      this.camera.position.copy(target).add(offset);
      this.targetAzimuthOffset -= step;
      this.camera.lookAt(target);
      this.controls.update();
    }

    const forward = new THREE.Vector3();
    forward.subVectors(this.controls.target, this.camera.position);
    forward.y = 0;
    if (forward.lengthSq() > 0.0001) {
      forward.normalize();
    } else {
      forward.set(0, 0, -1);
    }

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.keys.w) moveDir.add(forward);
    if (this.keys.s) moveDir.sub(forward);
    if (this.keys.d) moveDir.add(right);
    if (this.keys.a) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    const targetVel = moveDir.multiplyScalar(24.0);
    this.panVelocity.lerp(targetVel, Math.min(1.0, dt * 11));

    if (this.panVelocity.lengthSq() > 0.001) {
      const deltaMove = this.panVelocity.clone().multiplyScalar(dt);
      const oldTargetX = this.controls.target.x;
      const oldTargetZ = this.controls.target.z;
      const clampedX = THREE.MathUtils.clamp(oldTargetX + deltaMove.x, -50, 50);
      const clampedZ = THREE.MathUtils.clamp(oldTargetZ + deltaMove.z, -36, 36);
      const actualMoveX = clampedX - oldTargetX;
      const actualMoveZ = clampedZ - oldTargetZ;

      this.controls.target.x = clampedX;
      this.controls.target.z = clampedZ;
      this.camera.position.x += actualMoveX;
      this.camera.position.z += actualMoveZ;
    }

    const isWarningFlood = Boolean(game && game.crisisPhase === 'WARNING' && game.currentDisaster === 'FLOOD');
    const warningProgress = isWarningFlood ? Math.max(0, 1 - game.crisisTimer / 10) : 0;
    const isActiveFlood = Boolean(game && game.crisisPhase === 'ACTIVE' && game.currentDisaster === 'FLOOD');
    const cloudSpeedMult = isWarningFlood ? 1 + warningProgress * 3.5 : (isActiveFlood ? 4.2 : 1);

    this.clouds.forEach((c) => {
      c.group.position.x += c.speed * dt * 2.2 * cloudSpeedMult;
      if (c.group.position.x > 75) {
        c.group.position.x = -75;
      }
    });

    // Canlı 3B Akdeniz Dalga Animasyonu ve Kıyıya Vuran Dalga Sırtları
    const t = performance.now() * 0.0022;
    if (this.seaMesh) {
      this.seaMesh.position.y = -0.22 + Math.sin(t) * 0.035;
      if (this.seaBasePos && this.seaMesh.geometry && this.seaMesh.geometry.attributes.position) {
        const posAttr = this.seaMesh.geometry.attributes.position;
        const arr = posAttr.array;
        const base = this.seaBasePos;
        for (let i = 0; i < arr.length; i += 3) {
          const vx = base[i];
          const vz = base[i + 2];
          arr[i + 1] = Math.sin(vx * 0.25 + t * 1.8) * 0.12 + Math.cos(vz * 0.35 - t * 2.1) * 0.14;
        }
        posAttr.needsUpdate = true;
      }
    }
    if (this.waveCrests && this.waveCrests.length > 0) {
      this.waveCrests.forEach((wc) => {
        const cycle = (t * 0.65 + wc.phase) % (Math.PI * 2);
        const norm = cycle / (Math.PI * 2); // 0..1 kıyıya doğru ilerleme
        wc.mesh.position.z = wc.baseZ - norm * 3.2;
        wc.mesh.material.opacity = Math.sin(norm * Math.PI) * 0.62;
      });
    }
    if (this.foamMesh) {
      this.foamMesh.position.z = 27.8 + Math.sin(t * 1.3) * 0.28;
      this.foamMesh.material.opacity = 0.62 + Math.sin(t * 1.3) * 0.22;
    }
    this.updateShorelineFoam(dt);

    if (game) {
      const isHeatmap = Boolean(game.isHeatmapActive);
      const isStorm = isActiveFlood || isWarningFlood;
      this.updateSmogAtmosphere(game.carbon, dt, isHeatmap, isStorm);
      this.updateWaterPollution(game.carbon, dt, game);
      this.updateBeachTrash(game, dt);
      this.updateFloatingSeaLitter(dt, game.marineHealth, game.marinePollutionDamage);
      this.updateCleaningBoats(dt, game);
      this.updateGarbageTruck(dt, game);
      this.updateCarettaTurtles(dt, game.marineHealth, isActiveFlood);

      if (isWarningFlood && !isHeatmap) {
        const stormBg = new THREE.Color(0x334155);
        const stormSun = new THREE.Color(0x94a3b8);
        this.scene.background.lerp(stormBg, Math.min(1, dt * 2));
        this.scene.fog.color.lerp(stormBg, Math.min(1, dt * 2));
        this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, Math.max(0.75, 2.3 - warningProgress * 1.5), dt * 2);
        this.sunLight.color.lerp(stormSun, Math.min(1, dt * 2));
      }

      const hasBiogas = Boolean(game.grid && game.grid.cells && game.grid.cells.some((c) => c.occupied && c.buildingType === 'biogas_plant' && c.hasRoadAccess));
      const hasBarrier = Boolean(game.grid && game.grid.cells && game.grid.cells.some((c) => c.occupied && c.buildingType === 'marine_barrier'));
      this.updateStreetLitter(game.zeroWasteRate, dt);
      this.updateWildDumpsite(hasBiogas, dt);
      this.updateMarineBarrier(hasBarrier, dt);

      const smokeBuildings = game.grid && game.grid.cells
        ? game.grid.cells.filter((c) => c.occupied && !c.isRoad && !c.hasChimneyFilter && (
            c.buildingType === 'legacy_concrete' ||
            c.buildingType === 'eco_house' ||
            c.buildingType === 'green_roof' ||
            c.buildingType === 'commercial_hub'
          ))
        : [];
      const isSmokeDisaster = Boolean(game && game.currentDisaster === 'WILDFIRE_SMOKE' && (game.crisisPhase === 'ACTIVE' || game.crisisPhase === 'WARNING'));
      this.updateChimneySmoke(smokeBuildings, dt, isSmokeDisaster);

      const isReceding = isActiveFlood && game.disasterDuration <= 8;
      this.updateStormClouds(warningProgress, isActiveFlood, isReceding, dt);
      if (isReceding && !isHeatmap) {
        const clearSun = new THREE.Color(0xfffbeb);
        const clearSky = new THREE.Color(0x87ceeb);
        this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, 2.3, dt * 1.8);
        this.sunLight.color.lerp(clearSun, dt * 1.8);
        this.scene.background.lerp(clearSky, dt * 1.5);
      }

      const isDark = Boolean(isWarningFlood || isActiveFlood);
      const isBlackout = Boolean(game.isGridBlackout);
      this.updateStreetLights(isDark, dt, isBlackout);
      this.updateOutfallCascade(isActiveFlood, dt);

      const isHeatwave = Boolean(game && game.currentDisaster === 'HEATWAVE' && game.crisisPhase === 'ACTIVE');
      this.updateAsphaltTarGlare(isHeatwave, dt);

      const windStrength = isActiveFlood ? 0.085 : (isSmokeDisaster ? 0.06 : 0.025);
      this.updateTreeWindSway(windStrength, dt);
      this.updateBuildingAnimations(dt, isHeatwave, game.grid, isBlackout);
    }
  }

  updateStreetLitter(zeroWasteRate, dt) {
    if (!this.streetLitterGroup) return;
    const vis = typeof zeroWasteRate !== 'number' || zeroWasteRate < 50;
    this.streetLitterGroup.visible = vis;
    if (vis) {
      const t = performance.now() * 0.002;
      this.streetLitterGroup.children.forEach((node, idx) => {
        node.children.forEach((child, cIdx) => {
          if (child.userData && child.userData.isBag) {
            child.rotation.z = Math.sin(t + idx + cIdx) * 0.12;
          }
        });
      });
    }
  }

  updateWildDumpsite(isRehabbed, dt) {
    if (!this.dumpsiteMound) return;
    const lerpSpeed = Math.min(1, dt * 2);
    if (isRehabbed) {
      if (this.methaneFumesGroup) this.methaneFumesGroup.visible = false;
      if (this.rehabParkGroup) this.rehabParkGroup.visible = true;
      if (this.dumpsiteMat) this.dumpsiteMat.color.lerp(new THREE.Color(0x34d399), lerpSpeed);
    } else {
      if (this.methaneFumesGroup) {
        this.methaneFumesGroup.visible = true;
        const t = performance.now() * 0.001;
        this.methaneFumesGroup.children.forEach((f, idx) => {
          f.position.y = f.userData.baseY + ((t * 0.4 + idx * 0.3) % 1.2);
          f.scale.setScalar(0.7 + ((t * 0.3 + idx * 0.2) % 0.8));
          if (f.material) f.material.opacity = 0.4 * (1 - ((t * 0.4 + idx * 0.3) % 1.2) / 1.2);
        });
      }
      if (this.rehabParkGroup) this.rehabParkGroup.visible = false;
      if (this.dumpsiteMat) this.dumpsiteMat.color.lerp(new THREE.Color(0x4a4332), lerpSpeed);
    }
  }

  updateMarineBarrier(hasBarrier, dt) {
    if (!this.marineBarrierGroup) return;
    this.marineBarrierGroup.visible = Boolean(hasBarrier);
    if (hasBarrier) {
      const t = performance.now() * 0.0016;
      this.marineBarrierGroup.position.y = Math.sin(t) * 0.035;
    }
  }

  resetLighting() {
    this.scene.background.copy(this.skyColor);
    this.scene.fog.color.setHex(0xcbeafe);
    this.scene.fog.density = 0.0045;
    this.sunLight.intensity = 2.3;
    this.sunLight.color.setHex(0xfffbeb);
    this.hemiLight.color.setHex(0xe0f2fe);
    this.hemiLight.groundColor.setHex(0x4ade80);
    this.hemiLight.intensity = 0.95;
  }

  onResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
