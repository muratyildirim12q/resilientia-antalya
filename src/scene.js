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

    // OrbitControls (İzometrik Şehir Kamerası)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.maxPolarAngle = Math.PI / 2.22;
    this.controls.minPolarAngle = 0.25;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 82;
    this.controls.target.set(0, 0.5, 2);
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE
    };

    // Klavye ile akıcı izometrik kamera kaydırma (WASD / Ok tuşları + Eylemsizlik)
    this.keys = { w: false, a: false, s: false, d: false };
    this.panVelocity = new THREE.Vector3(0, 0, 0);
    this.setupKeyboardPan();

    this.clouds = [];
    this.cloudMat = null;
    this.foamMesh = null;
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
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.code === 'KeyW' || e.key === 'ArrowUp') this.keys.w = false;
      if (k === 's' || e.code === 'KeyS' || e.key === 'ArrowDown') this.keys.s = false;
      if (k === 'a' || e.code === 'KeyA' || e.key === 'ArrowLeft') this.keys.a = false;
      if (k === 'd' || e.code === 'KeyD' || e.key === 'ArrowRight') this.keys.d = false;
    });
  }

  setupSunLighting() {
    // Sıcak Akdeniz Güneşi
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 2.3);
    this.sunLight.position.set(32, 46, 28);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 140;
    const d = 32;
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
    // 1. Akdeniz Turkuaz Deniz Yüzeyi (Güney Kıyısı)
    const seaGeom = new THREE.PlaneGeometry(320, 320, 24, 24);
    seaGeom.rotateX(-Math.PI / 2);
    this.seaMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.14,
      metalness: 0.22,
      transparent: true,
      opacity: 0.94
    });
    this.seaMesh = new THREE.Mesh(seaGeom, this.seaMat);
    this.seaMesh.position.set(0, -0.22, 40);
    this.seaMesh.receiveShadow = true;
    this.scene.add(this.seaMesh);

    // Sığ Turkuaz Kıyı Şeridi (Konyaaltı Sığ Su Geçişi)
    const shallowGeom = new THREE.BoxGeometry(140, 0.16, 8);
    const shallowMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    });
    const shallow = new THREE.Mesh(shallowGeom, shallowMat);
    shallow.position.set(0, -0.18, 22.5);
    this.scene.add(shallow);

    // Kıyı Köpük Çizgisi
    const foamGeom = new THREE.PlaneGeometry(140, 0.65);
    foamGeom.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xf0f9ff,
      transparent: true,
      opacity: 0.7
    });
    this.foamMesh = new THREE.Mesh(foamGeom, foamMat);
    this.foamMesh.position.set(0, -0.06, 20.1);
    this.scene.add(this.foamMesh);

    // 2. Konyaaltı Altın Kumsal Şeridi (Güney Sahili)
    const beachGeom = new THREE.BoxGeometry(140, 0.35, 5.2);
    const beachMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      roughness: 0.88,
      metalness: 0.02
    });
    const beach = new THREE.Mesh(beachGeom, beachMat);
    beach.position.set(0, -0.02, 18.4);
    beach.receiveShadow = true;
    this.scene.add(beach);

    // 3. Ana Antalya Kıyı Ovası / Şehir İmar Platosu (Doğal Akdeniz Çim & Toprak Dokusu)
    const mainlandGeom = new THREE.BoxGeometry(140, 0.72, 64);
    const mainlandMat = new THREE.MeshStandardMaterial({
      color: 0x3ea751, // Zengin Akdeniz çim ve mera yeşili (monoton çiğ zemin yok)
      roughness: 0.88,
      metalness: 0.02
    });
    const mainland = new THREE.Mesh(mainlandGeom, mainlandMat);
    // Üst yüzey y = 0.36
    mainland.position.set(0, 0.0, -14.8);
    mainland.receiveShadow = true;
    this.scene.add(mainland);

    // Doğal Low-Poly Çimen Kümeleri, Yabani Çiçekler ve Akdeniz Çakıl Taşları
    this.setupGrassAndFlora();

    // Sahil Kordonu Taş Duvarı / Promenade Bordürü
    const promenadeGeom = new THREE.BoxGeometry(140, 0.44, 0.9);
    const promenadeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.75
    });
    const promenade = new THREE.Mesh(promenadeGeom, promenadeMat);
    promenade.position.set(0, 0.18, 17.0);
    promenade.receiveShadow = true;
    promenade.castShadow = true;
    this.scene.add(promenade);

    // 4. Bölgesel Otoyol Bağlantıları (Batı ve Doğu Harita Kenarlarından Şehre Giriş)
    // Grid row = 6 -> z = 6 * 3.0 - 16.5 = +1.5
    this.setupRegionalHighwayConnections(1.5);

    // 5. Kuzey Ufkunda Toros Dağları (Low-Poly Dağ Sırası) ve Akdeniz Çam Ormanı
    this.setupTaurusMountains();
    this.setupCoastalPalmsAndForest();

    // 6. Gerçekçi Hacimli Low-Poly Bulutlar (Gölge Düşüren Kümülüsler)
    this.setupClouds();
  }

  setupRegionalHighwayConnections(highwayZ) {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8
    });
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.75
    });
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    // Batı (-X) ve Doğu (+X) dış otoyol uzantıları (x: ±18'den ±68'e kadar)
    [-43, 43].forEach((centerX) => {
      const len = 50;
      const group = new THREE.Group();
      group.position.set(centerX, 0.36, highwayZ);

      // Asfalt gövde
      const asphalt = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 2.2), roadMat);
      asphalt.position.y = 0.025;
      asphalt.receiveShadow = true;
      group.add(asphalt);

      // Kuzey ve Güney kaldırım bordürleri
      [-1.3, 1.3].forEach((cz) => {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.4), curbMat);
        curb.position.set(0, 0.045, cz);
        curb.receiveShadow = true;
        group.add(curb);
      });

      // Kesikli orta şerit çizgileri
      for (let x = -len / 2 + 1.5; x < len / 2; x += 3.0) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.14), stripeMat);
        dash.rotateX(-Math.PI / 2);
        dash.position.set(x, 0.06, 0);
        group.add(dash);
      }

      this.scene.add(group);
    });
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
      { x: -38, z: -29, r: 12, h: 16, snow: true },
      { x: -24, z: -27, r: 10, h: 13, snow: false },
      { x: -11, z: -29, r: 13, h: 18, snow: true },
      { x: 4, z: -28, r: 11, h: 14, snow: false },
      { x: 18, z: -29, r: 13, h: 17, snow: true },
      { x: 33, z: -27, r: 11, h: 13.5, snow: false },
      { x: -17, z: -23, r: 7.5, h: 6.5, foothill: true },
      { x: 11, z: -23, r: 8.0, h: 7.0, foothill: true },
      { x: -32, z: -22, r: 7.0, h: 6.0, foothill: true },
      { x: 26, z: -22, r: 7.0, h: 6.0, foothill: true }
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
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7, flatShading: true });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75, flatShading: true });

    // Sahil Kordonu Palmiyeleri (Güney Kordon Boyunca, İmar Alanı Dışında)
    for (let x = -32; x <= 32; x += 6.4) {
      const palm = new THREE.Group();
      palm.position.set(x, 0.36, 16.6);

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
    }

    // Batı, Doğu ve Kuzey Çevre Orman Ağaçları (İmar Alanı Dışında: |x| > 19 veya z < -18.5)
    const treeCoords = [
      [-21, -14], [-24, -10], [-20, -6], [-23, -2], [-21, 5], [-25, 9], [-20, 12],
      [21, -14], [24, -10], [20, -6], [23, -2], [21, 5], [25, 9], [20, 12],
      [-14, -19.5], [-9, -20.5], [-4, -19.2], [2, -20.2], [7, -19.5], [14, -20.0]
    ];

    treeCoords.forEach(([tx, tz], i) => {
      const tree = new THREE.Group();
      tree.position.set(tx, 0.36, tz);
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
    });
  }

  // Akdeniz Çimen Kümeleri, Yabani Çiçekler ve Kireçtaşı Çakıl Taşları
  setupGrassAndFlora() {
    // 1. Düşük Poligonlu Çim Demeti Geometrisi (Çapraz 3 bıçak kanadı)
    const blade1 = new THREE.PlaneGeometry(0.38, 0.48);
    blade1.translate(0, 0.24, 0);
    const blade2 = new THREE.PlaneGeometry(0.38, 0.44);
    blade2.rotateY(Math.PI / 3);
    blade2.translate(0, 0.22, 0);
    const blade3 = new THREE.PlaneGeometry(0.38, 0.46);
    blade3.rotateY((2 * Math.PI) / 3);
    blade3.translate(0, 0.23, 0);

    // Geometrileri birleştir
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

    const grassCount = 650;
    const grassInstanced = new THREE.InstancedMesh(tuftGeom, tuftMat, grassCount);
    grassInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const colors = [
      new THREE.Color(0x38a169), // Zengin zümrüt
      new THREE.Color(0x48bb78), // Taze Akdeniz çimi
      new THREE.Color(0x68d391), // Açık bahar yeşili
      new THREE.Color(0x84cc16), // Güneş görmüş zeytin ucu
      new THREE.Color(0x2f855a)  // Koyu mera gölgesi
    ];

    let placed = 0;
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    while (placed < grassCount) {
      const gx = (rand() - 0.5) * 92;
      const gz = rand() * 42 - 25; // z: -25 to +17 (kıyıya kadar)

      // Şehir içi merkezi yol koridorunun tam merkezini (row=6, z=1.5 civarı) ve otoyolu temiz tut
      if (Math.abs(gx) < 17.5 && Math.abs(gz - 1.5) < 16.5) {
        // İmar alanı içi: sadece boş hücre aralıklarında seyrek serpme
        if (rand() > 0.35) continue;
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

    // 2. Yabani Akdeniz Çiçekleri (Sarı Papatya & Lavanta lekeleri)
    const flowerGeom = new THREE.DodecahedronGeometry(0.12, 0);
    const flowerMatYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const flowerMatPurple = new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.5 });

    const flowerGroup = new THREE.Group();
    for (let f = 0; f < 80; f++) {
      const fx = (rand() - 0.5) * 85;
      const fz = rand() * 38 - 22;
      if (Math.abs(fx) < 17 && Math.abs(fz - 1.5) < 16) continue;

      const fMesh = new THREE.Mesh(flowerGeom, f % 2 === 0 ? flowerMatYellow : flowerMatPurple);
      fMesh.position.set(fx, 0.42 + (f % 3) * 0.05, fz);
      flowerGroup.add(fMesh);
    }
    this.scene.add(flowerGroup);

    // 3. Toros Etekleri ve Sahil Kireçtaşı Çakılları
    const pebbleGeom = new THREE.DodecahedronGeometry(0.24, 0);
    const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, flatShading: true });
    const pebbleGroup = new THREE.Group();
    for (let p = 0; p < 45; p++) {
      const px = (rand() - 0.5) * 88;
      const pz = p % 2 === 0 ? 16.2 + rand() * 1.5 : -21 - rand() * 4;
      const pebble = new THREE.Mesh(pebbleGeom, pebbleMat);
      pebble.position.set(px, 0.38, pz);
      pebble.scale.set(1.2 + rand() * 0.6, 0.5 + rand() * 0.3, 1.0 + rand() * 0.5);
      pebble.rotation.set(rand(), rand(), rand());
      pebbleGroup.add(pebble);
    }
    this.scene.add(pebbleGroup);
  }

  // 3B Hacimli Fluffy Kümülüs Bulutları (Gölge Düşüren Gerçekçi Low-Poly Kümeler)
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

      // Kümülüs bulut gövdesi: Geniş düz taban pofudukları + yükselen kubbe pofudukları
      const puffOffsets = [
        // Taban katmanı
        [-2.4, 0.0, 0.0, 1.8],
        [-1.2, 0.1, -0.6, 2.1],
        [0.0, 0.0, 0.3, 2.3],
        [1.3, -0.1, -0.4, 2.0],
        [2.5, 0.0, 0.1, 1.7],
        // Üst kubbe pofudukları (kabaran hacim)
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

  resetCamera() {
    this.camera.position.set(26, 26, 30);
    this.controls.target.set(0, 0.5, 2);
  }

  setTopDownView() {
    this.camera.position.set(0, 42, 8);
    this.controls.target.set(0, 0, 0);
  }

  update(dt) {
    // 1. Gerçek Ekran Düzlemi (Screen-Space) İzometrik Kamera Kaydırma
    // Kamera yönünü yatay XZ düzlemine yansıtarak ileri ve sağ vektörlerini hesapla
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

    // Akıcı eylemsizlik / süzülme (Damped Velocity)
    const panSpeed = 24.0;
    const targetVel = moveDir.multiplyScalar(panSpeed);
    this.panVelocity.lerp(targetVel, Math.min(1.0, dt * 11));

    if (this.panVelocity.lengthSq() > 0.001) {
      const deltaMove = this.panVelocity.clone().multiplyScalar(dt);
      this.camera.position.add(deltaMove);
      this.controls.target.add(deltaMove);

      // Harita sınır kısıtlaması (Şehrin dışına kaymayı önler)
      this.controls.target.x = THREE.MathUtils.clamp(this.controls.target.x, -45, 45);
      this.controls.target.z = THREE.MathUtils.clamp(this.controls.target.z, -35, 35);
    }

    // 2. Bulutların batıdan doğuya süzülmesi (Yumuşak rüzgar akışı)
    this.clouds.forEach((c) => {
      c.group.position.x += c.speed * dt * 2.2;
      if (c.group.position.x > 62) {
        c.group.position.x = -62;
      }
    });

    // 3. Akdeniz dalga ve kıyı köpüğü hareketi
    const t = performance.now() * 0.0018;
    if (this.seaMesh) {
      this.seaMesh.position.y = -0.22 + Math.sin(t) * 0.035;
    }
    if (this.foamMesh) {
      this.foamMesh.position.z = 20.1 + Math.sin(t * 1.3) * 0.22;
      this.foamMesh.material.opacity = 0.55 + Math.sin(t * 1.3) * 0.2;
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
