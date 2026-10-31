import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const BUILD_CATEGORIES = [
  {
    id: 'roads',
    name: 'Yollar & Ulaşım',
    shortName: 'Yollar'
  },
  {
    id: 'buildings',
    name: 'Konut & Ticaret',
    shortName: 'Binalar'
  },
  {
    id: 'parks',
    name: 'Sünger Parklar & Doğa',
    shortName: 'Parklar'
  },
  {
    id: 'infra',
    name: 'İklim Altyapısı',
    shortName: 'Altyapı'
  }
];

export const BUILDINGS_CATALOG = {
  // 1. YOLLAR & ULAŞIM
  road: {
    id: 'road',
    category: 'roads',
    isRoad: true,
    name: 'Şehir Yolu (Asfalt Cadde)',
    shortName: 'Asfalt Yol',
    cost: 100,
    carbon: 0,
    spongePower: 0,
    coolingPower: 0,
    income: 0,
    population: 0,
    desc: 'Otomatik kavşak, viraj ve sokak lambası bağlantılı şehir yolu. Sürükleyerek döşeyin.'
  },
  boulevard: {
    id: 'boulevard',
    category: 'roads',
    isRoad: true,
    name: 'Yeşil Bulvar (Ağaçlı Cadde)',
    shortName: 'Yeşil Bulvar',
    cost: 220,
    carbon: -1,
    spongePower: 1,
    coolingPower: 1,
    income: 0,
    population: 0,
    desc: 'Ağaçlandırılmış kaldırım ve yağmur hendekleriyle ısı adasını kıran bulvar.'
  },
  solar_tram: {
    id: 'solar_tram',
    category: 'roads',
    isRoad: true,
    name: 'Güneş Tramvayı & Yeşil Hat',
    shortName: 'Tramvay Hattı',
    cost: 1100,
    carbon: -12,
    spongePower: 3,
    coolingPower: 3,
    income: 40,
    population: 0,
    desc: 'Fosil yakıtlı trafiği azaltan çim zeminli modern elektrikli tramvay hattı.'
  },

  // 2. KONUT & TİCARET
  eco_house: {
    id: 'eco_house',
    category: 'buildings',
    isRoad: false,
    name: 'Akdeniz Eko-Konut (Villa)',
    shortName: 'Eko-Konut',
    cost: 650,
    carbon: -2,
    spongePower: 1,
    coolingPower: 1,
    income: 65,
    population: 45,
    desc: 'Bahçeli, güneş panelli banliyö konutu. Nüfus ve düzenli belediye vergi geliri sağlar.'
  },
  green_roof: {
    id: 'green_roof',
    category: 'buildings',
    isRoad: false,
    name: 'Yeşil Çatılı Apartman',
    shortName: 'Yeşil Apartman',
    cost: 950,
    carbon: -5,
    spongePower: 8,
    coolingPower: 6,
    income: 120,
    population: 120,
    desc: 'Sedum bitki çatılı çok katlı konut. 47°C kentsel ısıyı kırar ve yüksek vergi geliri üretir.'
  },
  commercial_hub: {
    id: 'commercial_hub',
    category: 'buildings',
    isRoad: false,
    name: 'Eko-Ticaret & Ofis Kulesi',
    shortName: 'Ticaret Kulesi',
    cost: 1450,
    carbon: 2,
    spongePower: 0,
    coolingPower: 0,
    income: 240,
    population: 80,
    desc: 'Yüksek belediye fonu üreten modern finans ve ticaret merkezi.'
  },

  // 3. SÜNGER PARKLAR & DOĞA
  sponge_park: {
    id: 'sponge_park',
    category: 'parks',
    isRoad: false,
    name: 'Sünger Park (Yağmur Bahçesi)',
    shortName: 'Sünger Park',
    cost: 1150,
    carbon: -6,
    spongePower: 22,
    coolingPower: 6,
    income: 0,
    population: 0,
    desc: 'Biyo-gölet, nilüferler ve fıskiye ile sel suyunu emip yeraltı barajına aktarır.'
  },
  wind_corridor: {
    id: 'wind_corridor',
    category: 'parks',
    isRoad: false,
    name: 'Rüzgar Koridoru Korusu',
    shortName: 'Rüzgar Koridoru',
    cost: 600,
    carbon: -5,
    spongePower: 8,
    coolingPower: 12,
    income: 0,
    population: 0,
    desc: 'Akdeniz deniz meltemini şehre taşıyarak sıcak hava dalgalarını kırar.'
  },
  botanical_plaza: {
    id: 'botanical_plaza',
    category: 'parks',
    isRoad: false,
    name: 'Kentsel Meydan & Çeşme Parkı',
    shortName: 'Çeşme Meydanı',
    cost: 850,
    carbon: -4,
    spongePower: 12,
    coolingPower: 8,
    income: 20,
    population: 0,
    desc: 'Serinletici fıskiye ve gölge ağaçlarıyla donatılmış geçirgen taş meydan.'
  },

  // 4. İKLİM ALTYAPISI
  cistern: {
    id: 'cistern',
    category: 'infra',
    isRoad: false,
    name: 'Yeraltı Akıllı Su Sarnıcı',
    shortName: 'Akıllı Sarnıç',
    cost: 1750,
    carbon: -3,
    spongePower: 32,
    coolingPower: 2,
    income: 0,
    population: 0,
    desc: 'Ani sel taşkınlarını anında hapsedip kentin su rezervine dönüştüren dev tesis.'
  },
  cooling_tower: {
    id: 'cooling_tower',
    category: 'infra',
    isRoad: false,
    name: 'Termal Soğutma İstasyonu',
    shortName: 'Soğutma Merkezi',
    cost: 1600,
    carbon: -8,
    spongePower: 6,
    coolingPower: 16,
    income: 0,
    population: 0,
    desc: 'Deniz suyu kaynaklı bölgesel soğutma sağlayarak 47°C ısı kubbesini nötralize eder.'
  }
};

export class BuildingManager {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.cache = {};
    this.isLoaded = false;

    // Ortak Materyaller
    this.asphaltBaseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.88,
      metalness: 0.05
    });

    this.manholeMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
      metalness: 0.7
    });

    this.drainMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.8
    });

    this.turfMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.65,
      metalness: 0.04
    });

    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.12,
      metalness: 0.25,
      transparent: true,
      opacity: 0.9
    });

    this.solarMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.18,
      metalness: 0.75
    });

    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.75
    });

    this.stripeMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc
    });

    this.railMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25
    });

    this.glowCyanMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      roughness: 0.2,
      metalness: 0.3
    });

    this.ghostValidMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });

    this.ghostInvalidMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
  }

  preloadAll(onComplete) {
    const files = [
      // Starter Kit (1x1 base unit tiles)
      'building-garage.glb',
      'building-small-a.glb',
      'building-small-b.glb',
      'building-small-c.glb',
      'building-small-d.glb',
      'grass-trees.glb',
      'grass-trees-tall.glb',
      'grass.glb',
      'pavement-fountain.glb',
      'pavement.glb',
      'road-straight.glb',
      'road-straight-lightposts.glb',
      'road-corner.glb',
      'road-split.glb',
      'road-intersection.glb',
      // Commercial Kit
      'commercial/building-a.glb',
      'commercial/building-b.glb',
      'commercial/building-c.glb',
      'commercial/building-d.glb',
      'commercial/building-f.glb',
      'commercial/building-skyscraper-a.glb',
      'commercial/building-skyscraper-b.glb',
      // Suburban Kit
      'suburban/building-type-a.glb',
      'suburban/building-type-b.glb',
      'suburban/building-type-c.glb',
      'suburban/building-type-d.glb',
      'suburban/tree-large.glb',
      'suburban/tree-small.glb',
      'suburban/planter.glb',
      // Train Kit
      'train/train-tram-modern.glb'
    ];

    let loaded = 0;
    const checkDone = () => {
      loaded++;
      if (loaded === files.length) {
        this.isLoaded = true;
        if (onComplete) onComplete();
      }
    };

    files.forEach((f) => {
      this.loader.load(
        `./assets/${f}`,
        (gltf) => {
          gltf.scene.traverse((c) => {
            if (c.isMesh) {
              c.castShadow = true;
              c.receiveShadow = true;
              if (c.material) {
                c.material.roughness = 0.62;
                c.material.metalness = 0.06;
                if (c.material.map) {
                  c.material.map.colorSpace = THREE.SRGBColorSpace;
                  c.material.map.anisotropy = 4;
                }
              }
            }
          });
          this.cache[f] = gltf.scene;
          checkDone();
        },
        undefined,
        (err) => {
          console.warn('Model yüklenemedi:', f, err);
          checkDone();
        }
      );
    });
  }

  cloneModel(key, scaleX = 1, scaleY = scaleX, scaleZ = scaleX) {
    const src = this.cache[key];
    if (!src) return null;
    const clone = src.clone();
    clone.scale.set(scaleX, scaleY, scaleZ);
    return clone;
  }

  // Otomatik Bağlantılı Şehir Yolu Oluşturucu (3.0 x 3.0 Tam Karo Uyumu, Z-Fighting Önlemeli)
  createRoadMesh(typeId, neighbors, row = 0, col = 0) {
    const group = new THREE.Group();
    const { N, S, W, E } = neighbors;
    const count = (N ? 1 : 0) + (S ? 1 : 0) + (W ? 1 : 0) + (E ? 1 : 0);

    let roadFile = 'road-straight.glb';
    let rotY = 0;

    if (count === 4) {
      roadFile = 'road-intersection.glb';
      rotY = 0;
    } else if (count === 3) {
      roadFile = 'road-split.glb';
      // road-split.glb: kapalı kaldırım Kuzey (-Z), açık kollar S, W, E
      if (!N) rotY = 0;
      else if (!W) rotY = Math.PI / 2;
      else if (!S) rotY = Math.PI;
      else if (!E) rotY = -Math.PI / 2;
    } else if (count === 2) {
      if (N && S) {
        roadFile = (row + col) % 2 === 0 ? 'road-straight-lightposts.glb' : 'road-straight.glb';
        rotY = 0;
      } else if (W && E) {
        roadFile = (row + col) % 2 === 0 ? 'road-straight-lightposts.glb' : 'road-straight.glb';
        rotY = Math.PI / 2;
      } else {
        // Köşe dönüşü (road-corner.glb: açık kollar Güney +Z ve Batı -X)
        roadFile = 'road-corner.glb';
        if (S && W) rotY = 0;
        else if (S && E) rotY = Math.PI / 2;
        else if (N && E) rotY = Math.PI;
        else if (N && W) rotY = -Math.PI / 2;
      }
    } else if (count === 1) {
      roadFile = 'road-straight-lightposts.glb';
      rotY = W || E ? Math.PI / 2 : 0;
    } else {
      roadFile = 'road-straight-lightposts.glb';
      rotY = 0;
    }

    // Alt taban plakası (Z-fighting'i %100 önler, asfalt yüzey y = 0.02 seviyesinde başlar)
    const basePad = new THREE.Mesh(new THREE.BoxGeometry(2.98, 0.02, 2.98), this.asphaltBaseMat);
    basePad.position.y = 0.01;
    basePad.receiveShadow = true;
    group.add(basePad);

    const tile = this.cloneModel(roadFile, 3.0, 2.2, 3.0);
    if (tile) {
      tile.position.y = 0.02;
      tile.rotation.y = rotY;
      group.add(tile);
    }

    // Şerit Çizgileri (Asfalt yüzey y = 0.02 üzerinde y = 0.026'da tam yapışık)
    this.addRoadMarkings(group, { N, S, W, E, count });

    // Yeşil Bulvar: Dört köşe kaldırım ceplerine ağaçlar ve kapalı kaldırım kenarlarına çiçeklikler
    // (Köşe cepleri |x|=1.28, |z|=1.28 her yol tipinde kaldırımdır, asla asfalt şeride taşmaz!)
    if (typeId === 'boulevard') {
      const cornerTrees = [
        [-1.28, -1.28],
        [1.28, -1.28],
        [-1.28, 1.28],
        [1.28, 1.28]
      ];
      cornerTrees.forEach(([tx, tz]) => {
        const tree = this.cloneModel('suburban/tree-small.glb', 1.6, 1.6, 1.6);
        if (tree) {
          tree.position.set(tx, 0.13, tz);
          group.add(tree);
        }
      });

      const closedSidePlanters = [];
      if (!N && (W || E)) closedSidePlanters.push([0, -1.28, 0]);
      if (!S && (W || E)) closedSidePlanters.push([0, 1.28, 0]);
      if (!W && (N || S)) closedSidePlanters.push([-1.28, 0, Math.PI / 2]);
      if (!E && (N || S)) closedSidePlanters.push([1.28, 0, Math.PI / 2]);

      closedSidePlanters.forEach(([px, pz, ry]) => {
        const planter = this.cloneModel('suburban/planter.glb', 1.5, 1.5, 1.5);
        if (planter) {
          planter.position.set(px, 0.13, pz);
          planter.rotation.y = ry;
          group.add(planter);
        }
      });
    }

    // Güneş Tramvayı Hattı: Bağlı yönlere (N/S/W/E) göre kesintisiz çim ray yatağı, çelik raylar ve katener kemeri
    if (typeId === 'solar_tram') {
      this.addSolarTramTracks(group, { N, S, W, E, count });
    }

    return group;
  }

  addSolarTramTracks(group, { N, S, W, E, count }) {
    const activeN = count === 0 ? true : N || (count === 1 && S);
    const activeS = count === 0 ? true : S || (count === 1 && N);
    const activeW = count === 1 && (W || E) ? true : W;
    const activeE = count === 1 && (W || E) ? true : E;

    // Merkez çim ve ray göbeği (Asfalt yüzeyi y = 0.075 üzerinde)
    const hubTurf = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.016, 0.96), this.turfMat);
    hubTurf.position.set(0, 0.078, 0);
    group.add(hubTurf);

    const addArm = (dir) => {
      const armGroup = new THREE.Group();
      if (dir === 'N') armGroup.rotation.y = 0;
      else if (dir === 'S') armGroup.rotation.y = Math.PI;
      else if (dir === 'W') armGroup.rotation.y = Math.PI / 2;
      else if (dir === 'E') armGroup.rotation.y = -Math.PI / 2;

      const turf = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.016, 1.04), this.turfMat);
      turf.position.set(0, 0.078, -0.98);
      armGroup.add(turf);

      [-0.32, 0.32].forEach((rx) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.026, 1.48), this.railMat);
        rail.position.set(rx, 0.088, -0.75);
        armGroup.add(rail);
      });

      group.add(armGroup);
    };

    if (activeN) addArm('N');
    if (activeS) addArm('S');
    if (activeW) addArm('W');
    if (activeE) addArm('E');

    // Modern Güneş Katener Direği (Kaldırım kenarında, yolu kapatmaz)
    const isHorizOnly = (activeW || activeE) && !activeN && !activeS;
    const archGroup = new THREE.Group();
    if (isHorizOnly) archGroup.rotation.y = Math.PI / 2;

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.45, 8), this.railMat);
    mast.position.set(-1.26, 0.88, 0);
    archGroup.add(mast);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.04, 0.05), this.railMat);
    arm.position.set(-0.62, 1.58, 0);
    archGroup.add(arm);

    const solarCap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.32), this.solarMat);
    solarCap.position.set(-0.35, 1.61, 0);
    archGroup.add(solarCap);

    group.add(archGroup);
  }

  addRoadMarkings(group, { N, S, W, E, count }) {
    // Asfalt yüzeyi y = 0.075'tedir. Çizgiler 0.078'de, mazgal ve rögarlar 0.08'de tam oturur!
    const y = 0.078;

    // Yaya Geçidi Çizgileri Yardımcısı (Zebra Crossing)
    const addCrosswalk = (dir) => {
      const cwGroup = new THREE.Group();
      for (let b = -0.52; b <= 0.52; b += 0.26) {
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.42), this.stripeMat);
        bar.rotateX(-Math.PI / 2);
        bar.position.set(b, y, 0);
        cwGroup.add(bar);
      }
      if (dir === 'N') cwGroup.position.set(0, 0, -1.06);
      else if (dir === 'S') cwGroup.position.set(0, 0, 1.06);
      else if (dir === 'W') {
        cwGroup.rotation.y = Math.PI / 2;
        cwGroup.position.set(-1.06, 0, 0);
      } else if (dir === 'E') {
        cwGroup.rotation.y = Math.PI / 2;
        cwGroup.position.set(1.06, 0, 0);
      }
      group.add(cwGroup);
    };

    // Sünger Şehir Yağmur Suyu Mazgalı (Kaldırım Kenarı Drenajı)
    const addDrainGrate = (px, pz, isRot = false) => {
      const grate = new THREE.Mesh(new THREE.BoxGeometry(isRot ? 0.36 : 0.22, 0.012, isRot ? 0.22 : 0.36), this.drainMat);
      grate.position.set(px, 0.08, pz);
      group.add(grate);
    };

    // 1. Düz veya Uç Yol
    if (count <= 1) {
      const isHoriz = W || E;
      [-0.65, 0.65].forEach((offset) => {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.68), this.stripeMat);
        dash.rotateX(-Math.PI / 2);
        if (isHoriz) {
          dash.rotation.z = Math.PI / 2;
          dash.position.set(offset, y, 0);
        } else {
          dash.position.set(0, y, offset);
        }
        group.add(dash);
      });

      // Yol kenarı yağmur mazgalları ve döküm rögar kapağı
      if (isHoriz) {
        addDrainGrate(0, -0.92, true);
        addDrainGrate(0, 0.92, true);
        const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 12), this.manholeMat);
        manhole.position.set(0.5, 0.081, 0.28);
        group.add(manhole);
      } else {
        addDrainGrate(-0.92, 0, false);
        addDrainGrate(0.92, 0, false);
        const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 12), this.manholeMat);
        manhole.position.set(0.28, 0.081, 0.5);
        group.add(manhole);
      }
      return;
    }

    // 2. 3'lü (T-Kavşak) ve 4'lü (Dörtyol) Kavşaklarda Yaya Geçitleri ve Şeritler
    if (count >= 3) {
      if (N) addCrosswalk('N');
      if (S) addCrosswalk('S');
      if (W) addCrosswalk('W');
      if (E) addCrosswalk('E');

      // Merkez kavşak döküm rögar kapağı
      const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.016, 12), this.manholeMat);
      manhole.position.set(0, 0.081, 0);
      group.add(manhole);
      return;
    }

    // 3. 2'li Düz Yol veya Viraj
    if (N && S) {
      [-0.75, 0.75].forEach((zOff) => {
        const d = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.68), this.stripeMat);
        d.rotateX(-Math.PI / 2);
        d.position.set(0, y, zOff);
        group.add(d);
      });
      addDrainGrate(-0.92, 0, false);
      addDrainGrate(0.92, 0, false);
    } else if (W && E) {
      [-0.75, 0.75].forEach((xOff) => {
        const d = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.12), this.stripeMat);
        d.rotateX(-Math.PI / 2);
        d.position.set(xOff, y, 0);
        group.add(d);
      });
      addDrainGrate(0, -0.92, true);
      addDrainGrate(0, 0.92, true);
    } else {
      // Köşe viraj çizgileri ve geçiş
      if (N) {
        const d = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.55), this.stripeMat);
        d.rotateX(-Math.PI / 2);
        d.position.set(0, y, -0.85);
        group.add(d);
      }
      if (S) {
        const d = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.55), this.stripeMat);
        d.rotateX(-Math.PI / 2);
        d.position.set(0, y, 0.85);
        group.add(d);
      }
      if (W) {
        const d = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.12), this.stripeMat);
        d.rotateX(-Math.PI / 2);
        d.position.set(-0.85, y, 0);
        group.add(d);
      }
      if (E) {
        const d = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.12), this.stripeMat);
        d.rotateX(-Math.PI / 2);
        d.position.set(0.85, y, 0);
        group.add(d);
      }
    }
  }

  // 3B Hologram / Ghost Önizleme Modeli Oluşturucu
  createGhostPreview(typeId, { neighbors, row = 0, col = 0, variantSeed = 0, facingAngle = 0, isValid = true } = {}) {
    const spec = BUILDINGS_CATALOG[typeId];
    if (!spec) return null;

    const mesh = spec.isRoad
      ? this.createRoadMesh(typeId, neighbors || { N: false, S: false, W: false, E: false }, row, col)
      : this.createBuilding(typeId, variantSeed, facingAngle);

    const holoMat = isValid ? this.ghostValidMat : this.ghostInvalidMat;
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.material = holoMat;
      }
    });

    return mesh;
  }

  // Zengin Low-Poly Cities: Skylines Parsel & Bina Oluşturucu (3.0 x 3.0 Tam Parsel)
  createBuilding(typeId, variantSeed = 0, facingAngle = 0) {
    const group = new THREE.Group();
    const seed = Math.abs(Math.floor(Number(variantSeed) || 0));

    if (typeId === 'eco_house') {
      // 1. AKDENİZ EKO-KONUT (Suburban Villa + Bahçe + Çatı Solar Panel)
      const grassTile = this.cloneModel('grass.glb', 3.0, 2.0, 3.0);
      if (grassTile) group.add(grassTile);

      const houseVariants = [
        'suburban/building-type-a.glb',
        'suburban/building-type-b.glb',
        'suburban/building-type-c.glb',
        'suburban/building-type-d.glb'
      ];
      const vKey = houseVariants[seed % houseVariants.length];
      const house = this.cloneModel(vKey, 1.32, 1.32, 1.32);
      if (house) {
        house.position.set(0, 0.11, -0.15);
        group.add(house);

        // Çatı yüksekliğini tam ölçerek güneş paneli yerleştir
        const box = new THREE.Box3().setFromObject(house);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.45), this.solarMat);
        panel.position.set(0.2, box.max.y - 0.12, -0.15);
        panel.rotation.x = Math.PI / 10;
        group.add(panel);
      }

      // Bahçe Ağaçları ve Çiçeklik
      const treeL = this.cloneModel('suburban/tree-large.glb', 2.1, 2.1, 2.1);
      if (treeL) {
        treeL.position.set(-1.05, 0.11, 0.9);
        group.add(treeL);
      }
      const treeS = this.cloneModel('suburban/tree-small.glb', 1.9, 1.9, 1.9);
      if (treeS) {
        treeS.position.set(1.05, 0.11, -0.95);
        group.add(treeS);
      }
      const planter = this.cloneModel('suburban/planter.glb', 2.0, 2.0, 2.0);
      if (planter) {
        planter.position.set(0.85, 0.11, 0.95);
        group.add(planter);
      }
    } else if (typeId === 'green_roof') {
      // 2. YEŞİL ÇATILI APARTMAN KOMPLEKSİ (Çok Katlı Konut + Gerçek Çatı Çimi + Güneş Panelleri)
      const paveTile = this.cloneModel('pavement.glb', 3.0, 2.0, 3.0);
      if (paveTile) group.add(paveTile);

      const aptVariants = [
        'building-small-b.glb',
        'building-small-c.glb',
        'commercial/building-a.glb',
        'commercial/building-d.glb',
        'building-small-a.glb'
      ];
      const vKey = aptVariants[seed % aptVariants.length];
      const apt = this.cloneModel(vKey, 2.05, 2.05, 2.05);
      if (apt) {
        apt.position.set(0, 0.11, 0);
        group.add(apt);

        // Gerçek çatı yüksekliğini hesapla (Asla havada asılı kalmaz!)
        const box = new THREE.Box3().setFromObject(apt);
        const roofW = Math.max(0.9, (box.max.x - box.min.x) * 0.78);
        const roofD = Math.max(0.9, (box.max.z - box.min.z) * 0.78);
        const roofY = box.max.y;

        const roofGarden = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.08, roofD), this.turfMat);
        roofGarden.position.set(0, roofY + 0.02, 0);
        roofGarden.castShadow = true;
        group.add(roofGarden);

        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(roofW * 0.45, 0.04, roofD * 0.55),
          this.solarMat
        );
        panel.position.set(roofW * 0.16, roofY + 0.09, 0);
        panel.rotation.x = -Math.PI / 14;
        group.add(panel);
      }

      // Köşe Bahçe Ağaçları
      [
        [-1.08, 1.08],
        [1.08, 1.08],
        [-1.08, -1.08]
      ].forEach(([tx, tz], idx) => {
        const t = this.cloneModel(
          idx === 0 ? 'suburban/tree-large.glb' : 'suburban/tree-small.glb',
          1.95,
          1.95,
          1.95
        );
        if (t) {
          t.position.set(tx, 0.11, tz);
          group.add(t);
        }
      });
    } else if (typeId === 'commercial_hub') {
      // 3. EKO-TİCARET & OFİS KULESİ (Cities: Skylines Gökdelen / İş Merkezi Silüeti)
      const paveTile = this.cloneModel('pavement.glb', 3.0, 2.0, 3.0);
      if (paveTile) group.add(paveTile);

      const towerVariants = [
        { file: 'commercial/building-skyscraper-a.glb', scale: 1.65 },
        { file: 'commercial/building-f.glb', scale: 2.05 },
        { file: 'commercial/building-skyscraper-b.glb', scale: 1.45 },
        { file: 'commercial/building-b.glb', scale: 2.05 }
      ];
      const spec = towerVariants[seed % towerVariants.length];
      const tower = this.cloneModel(spec.file, spec.scale, spec.scale, spec.scale);
      if (tower) {
        tower.position.set(0, 0.11, -0.08);
        group.add(tower);
      }

      // Ön Meydan Çiçeklikleri ve Ağaçlar
      [-0.95, 0.95].forEach((px) => {
        const planter = this.cloneModel('suburban/planter.glb', 2.0, 2.0, 2.0);
        if (planter) {
          planter.position.set(px, 0.11, 1.12);
          group.add(planter);
        }
        const tree = this.cloneModel('suburban/tree-small.glb', 1.8, 1.8, 1.8);
        if (tree) {
          tree.position.set(px, 0.11, -1.12);
          group.add(tree);
        }
      });
    } else if (typeId === 'sponge_park') {
      // 4. SÜNGER PARK (Yağmur Bahçesi, Gölet, Fıskiye ve Zengin Ağaçlandırma)
      const grassTile = this.cloneModel('grass.glb', 3.0, 2.0, 3.0);
      if (grassTile) group.add(grassTile);

      // Taş Çerçeveli Biyo-Tutma Göleti
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.15, 0.14, 24), this.curbMat);
      rim.position.set(0, 0.14, 0);
      group.add(rim);

      const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 1.0, 0.17, 24), this.waterMat);
      pond.position.set(0, 0.15, 0);
      group.add(pond);

      const fountain = this.cloneModel('pavement-fountain.glb', 1.25, 1.25, 1.25);
      if (fountain) {
        fountain.position.set(0, 0.12, 0);
        group.add(fountain);
      }

      // Köşelere Zengin Ağaç Koruları
      [
        [-0.92, -0.92, 'grass-trees-tall.glb', 1.35],
        [0.92, 0.92, 'grass-trees.glb', 1.35],
        [-0.95, 0.95, 'suburban/tree-large.glb', 2.1],
        [0.95, -0.95, 'suburban/tree-large.glb', 2.0]
      ].forEach(([tx, tz, file, s]) => {
        const t = this.cloneModel(file, s, s, s);
        if (t) {
          t.position.set(tx, 0.11, tz);
          group.add(t);
        }
      });
    } else if (typeId === 'wind_corridor') {
      // 5. RÜZGAR KORİDORU KORUSU (Yoğun Akdeniz Çamlığı + Dikey Eko-Rüzgar Türbini)
      const grassTile = this.cloneModel('grass.glb', 3.0, 2.0, 3.0);
      if (grassTile) group.add(grassTile);

      const t1 = this.cloneModel('grass-trees-tall.glb', 1.65, 1.85, 1.65);
      if (t1) {
        t1.position.set(-0.65, 0.11, -0.55);
        group.add(t1);
      }
      const t2 = this.cloneModel('grass-trees-tall.glb', 1.55, 1.75, 1.55);
      if (t2) {
        t2.position.set(0.65, 0.11, 0.55);
        group.add(t2);
      }
      const t3 = this.cloneModel('grass-trees.glb', 1.45, 1.55, 1.45);
      if (t3) {
        t3.position.set(-0.65, 0.11, 0.65);
        group.add(t3);
      }

      // Modern Kentsel Rüzgar Kulesi (VAWT)
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.4, roughness: 0.3 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.2, 12), poleMat);
      pole.position.set(0.65, 1.2, -0.65);
      pole.castShadow = true;
      group.add(pole);

      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.75, 6, 1, true), this.glowCyanMat);
      rotor.position.set(0.65, 2.0, -0.65);
      group.add(rotor);
    } else if (typeId === 'botanical_plaza') {
      // 6. KENTSEL MEYDAN & ÇEŞME PARKI
      const plaza = this.cloneModel('pavement-fountain.glb', 3.0, 2.6, 3.0);
      if (plaza) {
        group.add(plaza);
      }

      // Merkez Fıskiye Suyu Parıltısı
      const waterJet = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.22, 16), this.waterMat);
      waterJet.position.set(0, 0.28, 0);
      group.add(waterJet);

      [
        [-1.08, -1.08],
        [1.08, -1.08],
        [-1.08, 1.08],
        [1.08, 1.08]
      ].forEach(([tx, tz]) => {
        const tree = this.cloneModel('suburban/tree-large.glb', 1.95, 1.95, 1.95);
        if (tree) {
          tree.position.set(tx, 0.14, tz);
          group.add(tree);
        }
      });
    } else if (typeId === 'cistern') {
      // 7. YERALTI AKILLI SU SARNICI (Yüksek Kapasiteli Sel Rezervuarı Tesisi)
      const paveTile = this.cloneModel('pavement.glb', 3.0, 2.0, 3.0);
      if (paveTile) group.add(paveTile);

      const controlBldg = this.cloneModel('building-garage.glb', 1.75, 1.85, 1.75);
      if (controlBldg) {
        controlBldg.position.set(-0.45, 0.11, -0.35);
        group.add(controlBldg);
      }

      // İkiz Parlayan Su Sarnıcı Kubbeleri
      const tankShellMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5, roughness: 0.35 });
      [
        [0.75, -0.55],
        [0.75, 0.65]
      ].forEach(([tx, tz]) => {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 1.15, 20), tankShellMat);
        tank.position.set(tx, 0.68, tz);
        tank.castShadow = true;
        group.add(tank);

        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.22, 20), this.glowCyanMat);
        ring.position.set(tx, 0.85, tz);
        group.add(ring);
      });

      // Ön Rezervuar Havuzu
      const basin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.85), this.waterMat);
      basin.position.set(-0.45, 0.16, 0.78);
      group.add(basin);
    } else if (typeId === 'cooling_tower') {
      // 8. TERMAL SOĞUTMA İSTASYONU (Bölgesel İklim Soğutma Merkezi)
      const paveTile = this.cloneModel('pavement.glb', 3.0, 2.0, 3.0);
      if (paveTile) group.add(paveTile);

      const station = this.cloneModel('commercial/building-c.glb', 1.8, 1.8, 1.8);
      if (station) {
        station.position.set(-0.42, 0.11, 0);
        group.add(station);
      }

      // İkiz Beyaz Soğutma Kuleleri
      const towerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4, metalness: 0.2 });
      [-0.58, 0.58].forEach((tz) => {
        const chillTower = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.48, 1.65, 20), towerMat);
        chillTower.position.set(0.78, 0.92, tz);
        chillTower.castShadow = true;
        group.add(chillTower);

        const coreGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 16), this.glowCyanMat);
        coreGlow.position.set(0.78, 1.72, tz);
        group.add(coreGlow);
      });
    }

    group.rotation.y = facingAngle;
    return group;
  }

  animateSpawn(object, duration = 380) {
    object.scale.set(0.01, 0.01, 0.01);
    const start = performance.now();

    function step(now) {
      const p = Math.min((now - start) / duration, 1.0);
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const ease = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);

      const s = Math.max(0.01, ease);
      object.scale.set(s, s, s);

      if (p < 1.0) {
        requestAnimationFrame(step);
      } else {
        object.scale.set(1.0, 1.0, 1.0);
      }
    }
    requestAnimationFrame(step);
  }
}
