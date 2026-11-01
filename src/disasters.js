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
    this.setupTransformerSparks();
    this.setupStreetWaterFlow();
    this.setupAshFallout();
    this.drizzleProgress = 1.0;
    this.floodElapsed = 0.0;
  }

  // 1. Gerçekçi Hacimli Tam Harita Fırtına Yağmur Çizgileri (LineSegments: 125x125 birim)
  setupRainStreaks() {
    this.rainCount = 4200;
    const positions = new Float32Array(this.rainCount * 6); // Her çizgi 2 nokta
    this.rainData = [];

    for (let i = 0; i < this.rainCount; i++) {
      const rx = (Math.random() - 0.5) * 125;
      const ry = 4 + Math.random() * 32;
      const rz = (Math.random() - 0.5) * 120;
      const len = 1.4 + Math.random() * 0.9;
      const speed = 36 + Math.random() * 14;

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
    this.maxRipples = 75;
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
    const surfaceY = Math.max(0.368, this.waterMesh.position.y + 0.008);
    r.mesh.position.set(x, surfaceY, z);
    r.life = r.maxLife;
    r.mesh.scale.set(0.3, 0.3, 0.3);
    r.mesh.material.opacity = 0.75;
    if (r.mesh.material && r.mesh.material.color) {
      r.mesh.material.color.setHex(this.isAcidRain ? 0xeab308 : 0xe0f2fe);
    }
    r.mesh.visible = true;
  }

  // 3. Dinamik Dalgalı Sel Suyu Tabakası, Köpük Dalgaları ve Yüzen Molozlar
  setupFloodWaterMesh() {
    this.waterW = 160;
    this.waterH = 120;
    this.waterSegs = 64;
    const waterGeom = new THREE.PlaneGeometry(this.waterW, this.waterH, this.waterSegs, this.waterSegs);
    waterGeom.rotateX(-Math.PI / 2);

    this.waterBasePos = waterGeom.attributes.position.array.slice();

    // Akdeniz Fırtına Taşkını Suyu: Canlı, Işıltılı Turkuaz/Mavi (#0284c7 - #0ea5e9)
    this.waterTexture = null;

    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Akdeniz fırtına taşkın turkuazı (#0284c7 - #0ea5e9)
      transparent: true,
      opacity: 0.0,
      roughness: 0.06, // Işıltılı ayna pürüzsüzlüğü ve speküler yansımalar
      metalness: 0.35, // Canlı su derinliği ve Fresnel ışıltısı
      depthWrite: false
    });

    this.waterMesh = new THREE.Mesh(waterGeom, this.waterMat);
    this.waterMesh.position.set(0, 0.05, 0);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // Köpük Dalgaları Dizisi (Geriye dönük uyumluluk: Yapay yatay beyaz çizgiler tamamen temizlendi)
    this.foamSurges = [];
    this.floodFoamMat = new THREE.MeshBasicMaterial({
      color: 0xf0f9ff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      visible: false
    });

    // Sel Suyunda Yüzen Kentsel Nesneler (Trafik Dubaları, Tahta Paletler, Variller, Ağaç Dalları, Sokak Çöpleri)
    this.setupFloatingDebris();

    // Ekolojik Yağmur Parkı & Derin Drenaj Rezervuarı Emici Su Hortumları (Vortex Whirlpools)
    this.setupDrainWhirlpools();

    // Cadde Kenar Mazgallarından Geriye Doğru Kabaran Köpükler (Gutter Storm Drain Geysers)
    this.setupDrainGeysers();

    // Kıyı ve Bina Kenarları Yumuşatılmış Temas Köpüğü (Soft Shoreline / Wall Edge Meniscus)
    this.setupContactFoam();

    // Yol ve Mazgallarda Lokal Su Birikintisi & Göllenme (Dynamic Road Puddles)
    this.setupPuddles();

    // Sünger Şehir Dairesel Mavi Emilim Dalgaları (Absorption Pulsing Rings)
    this.setupPulsingRings();

    // Sıcak Dalgası Çatı Isı Titreşimi (Heat Haze Shimmer)
    this.setupHeatHaze();
  }

  setupContactFoam(grid = null) {
    if (grid) this.grid = grid;
    if (!this.contactFoamGroup) {
      this.contactFoamGroup = new THREE.Group();
      this.scene.add(this.contactFoamGroup);
    }
    while (this.contactFoamGroup.children.length > 0) {
      this.contactFoamGroup.remove(this.contactFoamGroup.children[0]);
    }
    this.contactFoams = [];

    this.contactFoamMat = new THREE.MeshBasicMaterial({
      color: 0xf0fdf4,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      visible: false
    });
  }

  // 3b. Yol ve Mazgallarda Dinamik Su Birikintisi & Göllenme (Dynamic Road Puddles)
  setupPuddles(grid = null) {
    if (grid) this.grid = grid;
    if (!this.puddlesGroup) {
      this.puddlesGroup = new THREE.Group();
      this.scene.add(this.puddlesGroup);
    }
    while (this.puddlesGroup.children.length > 0) {
      this.puddlesGroup.remove(this.puddlesGroup.children[0]);
    }
    this.puddles = [];

    const puddleGeom = new THREE.CircleGeometry(1, 16);
    puddleGeom.rotateX(-Math.PI / 2);

    const roadCells = (this.grid && this.grid.cells) ? this.grid.cells.filter(c => c.occupied && c.isRoad) : [];

    roadCells.forEach((rc, rIdx) => {
      // Geçirgen yeşil yol (permeable_road): Suyu anında toprağa emer, su birikintisi OLUŞMAZ (zero puddles)!
      if (rc.buildingType === 'permeable_road') {
        return;
      }

      const neighbors = (this.grid.getRoadNeighbors)
        ? this.grid.getRoadNeighbors(rc.row, rc.col)
        : { N: false, S: false, W: false, E: false };
      const count = (neighbors.N ? 1 : 0) + (neighbors.S ? 1 : 0) + (neighbors.W ? 1 : 0) + (neighbors.E ? 1 : 0);

      const pMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Akdeniz canlı turkuaz su tonu (#0284c7)
        roughness: 0.04,
        metalness: 0.3,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });

      if (count >= 3) {
        // Kavşak alçak noktası: merkezde geniş su birikintisi / gölet
        const mesh = new THREE.Mesh(puddleGeom, pMat);
        mesh.position.set(rc.x, 0.438, rc.z);
        mesh.visible = false;
        mesh.scale.set(0.01, 1, 0.01);
        this.puddlesGroup.add(mesh);
        this.puddles.push({
          mesh,
          mat: pMat,
          cell: rc,
          level: 0.0,
          maxRadius: 1.15,
          rate: 0.24,
          phase: rIdx * 0.7
        });
      } else {
        // Düz ve viraj yollar: cadde olukları ve mazgal kenarlarında (gutters) lokal göllenme
        const isHoriz = neighbors.W || neighbors.E;
        const offsets = isHoriz
          ? [[-0.45, -0.85], [0.45, 0.85]]
          : [[-0.85, -0.45], [0.85, 0.45]];

        offsets.forEach(([ox, oz], oIdx) => {
          const m = new THREE.Mesh(puddleGeom, pMat.clone());
          m.position.set(rc.x + ox, 0.438, rc.z + oz);
          m.visible = false;
          m.scale.set(0.01, 1, 0.01);
          this.puddlesGroup.add(m);
          this.puddles.push({
            mesh: m,
            mat: m.material,
            cell: rc,
            level: 0.0,
            maxRadius: 0.55 + (oIdx * 0.12),
            rate: 0.18,
            phase: rIdx * 1.1 + oIdx
          });
        });
      }
    });
  }

  updatePuddles(dt, isRaining, gridRef, gameRef) {
    if (!this.puddles || this.puddles.length === 0) {
      if (gridRef && gridRef.cells && gridRef.cells.some(c => c.occupied && c.isRoad)) {
        this.grid = gridRef;
        this.setupPuddles(gridRef);
      }
    }
    if (!this.puddles) return;

    const t = performance.now() * 0.001;
    const hasCoastalPump = Boolean(gameRef?.grid?.cells?.some(c => c.occupied && c.buildingType === 'coastal_pump' && c.hasRoadAccess));

    this.puddles.forEach((p) => {
      // Eğer yol sonradan permeable_road yapıldıysa sıfır birikinti
      if (p.cell && p.cell.buildingType === 'permeable_road') {
        p.level = 0.0;
        p.mesh.visible = false;
        p.mat.opacity = 0.0;
        return;
      }

      if (isRaining) {
        // Yağmur sırasında göllenme genişler
        let accRate = p.rate || 0.18;
        if (gameRef && gameRef.spongeCapacity >= 45) {
          accRate *= 0.6; // Sünger parklar akıntıyı emer
        }
        p.level = Math.min(1.0, p.level + dt * accRate);
      } else {
        // Yağmur bittiğinde su birikintisi doğal olarak çekilir ve buharlaşır
        let evapRate = 0.28;
        if (gameRef && gameRef.spongeCapacity >= 45) evapRate += 0.18;
        if (hasCoastalPump) evapRate += 0.25;
        p.level = Math.max(0.0, p.level - dt * evapRate);
      }

      if (p.level > 0.01) {
        p.mesh.visible = true;
        const currentRadius = p.maxRadius * p.level;
        const ripple = 1.0 + Math.sin(t * 3.5 + p.phase) * 0.035;
        p.mesh.scale.set(currentRadius * ripple, 1, currentRadius * ripple);
        p.mat.opacity = Math.min(0.82, p.level * 0.85);
        p.mat.roughness = 0.04 + Math.sin(t * 2.0 + p.phase) * 0.02;
      } else {
        p.mesh.visible = false;
        p.mat.opacity = 0.0;
      }
    });
  }

  setupDrainGeysers(grid = null) {
    if (grid) this.grid = grid;
    if (!this.drainGeyserGroup) {
      this.drainGeyserGroup = new THREE.Group();
      this.scene.add(this.drainGeyserGroup);
    }
    while (this.drainGeyserGroup.children.length > 0) {
      this.drainGeyserGroup.remove(this.drainGeyserGroup.children[0]);
    }
    this.drainGeysers = [];

    const coverGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16);
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.75
    });

    const columnGeom = new THREE.CylinderGeometry(0.12, 0.20, 0.52, 10);
    const columnMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });

    const bubbleGeom = new THREE.DodecahedronGeometry(0.18, 1);
    const geyserCount = 56;
    for (let i = 0; i < geyserCount; i++) {
      const gGroup = new THREE.Group();

      // Döküm Demir Rögar Kapağı (Cast Iron Manhole Cover)
      const cover = new THREE.Mesh(coverGeom, coverMat.clone());
      cover.position.set(0, 0.02, 0);
      gGroup.add(cover);

      // Gri Köpüklü Su Fışkırma Kolonu (Dirty Foamy Geyser Column)
      const column = new THREE.Mesh(columnGeom, columnMat.clone());
      column.position.set(0, 0.26, 0);
      column.visible = false;
      gGroup.add(column);

      const bMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.25,
        metalness: 0.1,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });
      const m1 = new THREE.Mesh(bubbleGeom, bMat);
      gGroup.add(m1);

      for (let b = 0; b < 3; b++) {
        const subMat = new THREE.MeshStandardMaterial({
          color: 0xf0f9ff,
          roughness: 0.25,
          transparent: true,
          opacity: 0.0,
          depthWrite: false
        });
        const sub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), subMat);
        const ang = (b * Math.PI * 2) / 3;
        sub.position.set(Math.cos(ang) * 0.16, 0.04, Math.sin(ang) * 0.16);
        gGroup.add(sub);
      }

      gGroup.position.set(0, 0.42, 0);
      gGroup.visible = false;
      this.drainGeyserGroup.add(gGroup);
      this.drainGeysers.push({
        group: gGroup,
        cover,
        column,
        phase: Math.random() * Math.PI * 2,
        speed: 7.0 + Math.random() * 4.0
      });
    }
  }

  // 3c. Caddelerde Toros Dağları'ndan Denize Doğru Akan Gerçekçi Su Şeritleri ve Mazgal Emişi
  setupStreetWaterFlow(grid = null) {
    if (grid) this.grid = grid;
    if (!this.streetFlowGroup) {
      this.streetFlowGroup = new THREE.Group();
      this.scene.add(this.streetFlowGroup);
    }
    while (this.streetFlowGroup.children.length > 0) {
      this.streetFlowGroup.remove(this.streetFlowGroup.children[0]);
    }
    this.streetFlows = [];
    this.grateSuctions = [];

    const roadCells = (this.grid && this.grid.cells) ? this.grid.cells.filter((c) => c.occupied && c.isRoad) : [];
    if (roadCells.length === 0) return;

    const ribbonGeomNS = new THREE.PlaneGeometry(1.8, 2.8, 4, 6);
    ribbonGeomNS.rotateX(-Math.PI / 2);

    const ribbonGeomEW = new THREE.PlaneGeometry(2.8, 1.8, 6, 4);
    ribbonGeomEW.rotateX(-Math.PI / 2);

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Canlı Akdeniz sel turkuazı (#0284c7)
      roughness: 0.08,
      metalness: 0.35,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });

    roadCells.forEach((rc, idx) => {
      const neighbors = (this.grid.getRoadNeighbors)
        ? this.grid.getRoadNeighbors(rc.row, rc.col)
        : { N: false, S: false, W: false, E: false };

      const isEW = (neighbors.W || neighbors.E) && (!neighbors.N && !neighbors.S);
      const mesh = new THREE.Mesh(isEW ? ribbonGeomEW : ribbonGeomNS, ribbonMat.clone());
      mesh.position.set(rc.x, 0.442, rc.z);
      mesh.visible = false;
      this.streetFlowGroup.add(mesh);

      this.streetFlows.push({
        mesh,
        mat: mesh.material,
        cell: rc,
        isEW,
        phase: idx * 0.45,
        baseY: 0.442
      });

      // Mazgal veya Kıyı Pompası bitişikse yol kenarından mazgala emiş akıntısı
      if (this.grid && this.grid.cells) {
        const adjGrate = this.grid.cells.find((c) =>
          c.occupied &&
          (c.buildingType === 'drain_grate' || c.buildingType === 'coastal_pump') &&
          Math.abs(c.row - rc.row) + Math.abs(c.col - rc.col) === 1
        );
        if (adjGrate) {
          const suctionGeom = new THREE.RingGeometry(0.12, 0.42, 12);
          suctionGeom.rotateX(-Math.PI / 2);
          const suctionMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
            side: THREE.DoubleSide
          });
          const suctionMesh = new THREE.Mesh(suctionGeom, suctionMat);
          const midX = (rc.x + adjGrate.x) * 0.5;
          const midZ = (rc.z + adjGrate.z) * 0.5;
          suctionMesh.position.set(midX, 0.445, midZ);
          suctionMesh.visible = false;
          this.streetFlowGroup.add(suctionMesh);

          this.grateSuctions.push({
            mesh: suctionMesh,
            grateCell: adjGrate,
            roadCell: rc,
            phase: idx * 0.8
          });
        }
      }
    });
  }

  updateStreetWaterFlow(dt, isFlood, gridRef, gameRef) {
    let floodActive = isFlood;
    let grid = gridRef;
    let game = gameRef;

    if (typeof isFlood !== 'boolean') {
      floodActive = (this.activeDisaster === 'FLOOD');
      grid = isFlood;
      game = (typeof gridRef === 'number') ? { zeroWasteRate: gridRef } : gridRef;
    }

    if (!this.streetFlows || this.streetFlows.length === 0) {
      if (grid && grid.cells && grid.cells.some((c) => c.occupied && c.isRoad)) {
        this.setupStreetWaterFlow(grid);
      }
    }

    const t = performance.now() * 0.001;
    const waterY = (this.waterMesh && this.waterMesh.position) ? this.waterMesh.position.y : 0.48;
    const targetOpacity = floodActive ? Math.min(0.78, Math.max(0.2, (waterY / 0.50) * 0.78)) : 0.0;

    if (this.streetFlows) {
      this.streetFlows.forEach((sf) => {
        if (sf.cell.buildingType === 'permeable_road') {
          sf.mat.opacity = Math.max(0, sf.mat.opacity - dt * 2.0);
          sf.mesh.visible = sf.mat.opacity > 0.01;
          return;
        }

        if (floodActive) {
          sf.mat.opacity = THREE.MathUtils.lerp(sf.mat.opacity, targetOpacity, dt * 2.2);
          sf.mesh.visible = sf.mat.opacity > 0.01;
          const wave = Math.sin(t * 3.8 + sf.phase) * 0.006;
          sf.mesh.position.y = sf.baseY + wave;
          sf.mesh.scale.set(1.0 + Math.sin(t * 2.5 + sf.phase) * 0.03, 1.0, 1.0 + Math.cos(t * 3.2 + sf.phase) * 0.03);
        } else {
          sf.mat.opacity = Math.max(0, sf.mat.opacity - dt * 1.8);
          sf.mesh.visible = sf.mat.opacity > 0.01;
        }
      });
    }

    if (this.grateSuctions) {
      this.grateSuctions.forEach((gs) => {
        if (floodActive) {
          gs.mesh.visible = true;
          gs.mesh.material.opacity = THREE.MathUtils.lerp(gs.mesh.material.opacity, Math.min(0.75, targetOpacity * 1.1), dt * 3.0);
          gs.mesh.rotation.y += dt * 4.2;
          const s = 0.85 + Math.sin(t * 5.5 + gs.phase) * 0.25;
          gs.mesh.scale.set(s, s, s);
        } else {
          gs.mesh.material.opacity = Math.max(0, gs.mesh.material.opacity - dt * 2.5);
          gs.mesh.visible = gs.mesh.material.opacity > 0.01;
        }
      });
    }

    // Grid üzerindeki tüm drain_grate hücrelerinin clogGroup ve girdap güncellemeleri
    const activeGrid = grid || this.grid;
    if (activeGrid && activeGrid.cells) {
      const zeroWaste = (typeof game === 'number') ? game : (game && typeof game.zeroWasteRate === 'number' ? game.zeroWasteRate : 22);
      const isClogged = floodActive && zeroWaste < 50;

      activeGrid.cells.forEach((cell) => {
        if (cell.occupied && (cell.buildingType === 'drain_grate' || cell.buildingType === 'grate') && cell.buildingMesh) {
          if (cell.buildingMesh.userData && cell.buildingMesh.userData.clogGroup) {
            cell.buildingMesh.userData.clogGroup.visible = isClogged;
          }
          if (cell.buildingMesh.children) {
            const vRing = cell.buildingMesh.children.find((c) => c.geometry?.type === 'RingGeometry');
            if (vRing && vRing.rotation) {
              vRing.rotation.z += dt * (isClogged ? 1.5 : 5.0);
            }
          }
        }
      });
    }
  }

  setupFloatingDebris() {
    this.floatingDebris = [];
    this.debrisGroup = new THREE.Group();
    this.scene.add(this.debrisGroup);

    // 1. Turuncu Trafik Dubaları (4 adet)
    const coneGeom = new THREE.ConeGeometry(0.18, 0.42, 8);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

    for (let i = 0; i < 4; i++) {
      const cone = new THREE.Group();
      const body = new THREE.Mesh(coneGeom, coneMat);
      body.position.y = 0.21;
      cone.add(body);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 8), stripeMat);
      ring.position.y = 0.18;
      cone.add(ring);

      this.debrisGroup.add(cone);
      this.floatingDebris.push({
        mesh: cone,
        x: -24 + Math.random() * 48,
        z: -18 + Math.random() * 36,
        baseYOffset: 0.08,
        driftSpeed: 1.2 + Math.random() * 0.8,
        rotSpeed: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
      });
    }

    // 2. Ahşap Kargo Sandıkları / Paletler (4 adet)
    const crateGeom = new THREE.BoxGeometry(0.55, 0.22, 0.55);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
    for (let i = 0; i < 4; i++) {
      const crate = new THREE.Mesh(crateGeom, crateMat);
      this.debrisGroup.add(crate);
      this.floatingDebris.push({
        mesh: crate,
        x: -26 + Math.random() * 52,
        z: -18 + Math.random() * 36,
        baseYOffset: 0.06,
        driftSpeed: 0.9 + Math.random() * 0.6,
        rotSpeed: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      });
    }

    // 3. Sarı Acil Durum / Kimyasal Varilleri (3 adet)
    const barrelGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.45, 10);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.4 });
    for (let i = 0; i < 3; i++) {
      const barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.rotation.z = Math.PI / 2; // Yüzerken yan yatar
      this.debrisGroup.add(barrel);
      this.floatingDebris.push({
        mesh: barrel,
        x: -22 + Math.random() * 44,
        z: -16 + Math.random() * 32,
        baseYOffset: 0.07,
        driftSpeed: 1.4 + Math.random() * 0.7,
        rotSpeed: 0.8 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2
      });
    }

    // 4. Sürüklenen Palmiye / Ağaç Dalları (3 adet)
    const branchGeom = new THREE.CylinderGeometry(0.04, 0.07, 0.85, 6);
    const branchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const branch = new THREE.Mesh(branchGeom, branchMat);
      branch.rotation.x = Math.PI / 2;
      this.debrisGroup.add(branch);
      this.floatingDebris.push({
        mesh: branch,
        x: -25 + Math.random() * 50,
        z: -15 + Math.random() * 34,
        baseYOffset: 0.04,
        driftSpeed: 1.1 + Math.random() * 0.5,
        rotSpeed: 0.4 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      });
    }

    // 5. Karada Toplanmamış Gerçekçi Sokak Çöpleri (Yırtık siyah çöp poşetleri, ezik teneke kutular, ezilmiş PET şişeler)
    const bottleGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 6);
    bottleGeom.rotateZ(Math.PI / 2);
    const bottleColors = [0x38bdf8, 0xef4444, 0x10b981];
    for (let i = 0; i < 6; i++) {
      const bottleGroup = new THREE.Group();
      const bottleMat = new THREE.MeshStandardMaterial({
        color: bottleColors[i % bottleColors.length],
        transparent: true,
        opacity: 0.85,
        roughness: 0.2
      });
      const body = new THREE.Mesh(bottleGeom, bottleMat);
      body.scale.set(1.4, 0.55, 0.85); // Ezilmiş / yassılaşmış PET şişe formu
      bottleGroup.add(body);

      // Şişe Kapağı
      const capGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 6);
      capGeom.rotateZ(Math.PI / 2);
      const cap = new THREE.Mesh(capGeom, new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 }));
      cap.position.set(0.12, 0, 0);
      bottleGroup.add(cap);

      this.debrisGroup.add(bottleGroup);
      this.floatingDebris.push({
        mesh: bottleGroup,
        isTrash: true,
        x: -22 + Math.random() * 44,
        z: -14 + Math.random() * 28,
        baseYOffset: 0.03,
        driftSpeed: 1.6 + Math.random() * 0.9,
        rotSpeed: 1.2 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Düğümlü Yırtık Siyah Çöp Torbaları (Torn Black Trash Bags with Knot)
    const bagGeom = new THREE.DodecahedronGeometry(0.13, 0);
    const bagMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Gerçekçi siyah polietilen çöp torbası
      roughness: 0.75,
      metalness: 0.1
    });
    const knotGeom = new THREE.CylinderGeometry(0.03, 0.015, 0.08, 6);

    for (let i = 0; i < 5; i++) {
      const bagGroup = new THREE.Group();
      const bag = new THREE.Mesh(bagGeom, bagMat);
      bag.scale.set(1.3, 0.85, 1.1);
      bagGroup.add(bag);

      // Üst Düğüm / Bağlantı Boğumu
      const knot = new THREE.Mesh(knotGeom, bagMat);
      knot.position.set(0, 0.11, 0);
      bagGroup.add(knot);

      // Yırtıktan dışarı sarkan atık detayı
      const scrap = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.04, 0),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
      );
      scrap.position.set(0.08, -0.02, 0.06);
      bagGroup.add(scrap);

      this.debrisGroup.add(bagGroup);
      this.floatingDebris.push({
        mesh: bagGroup,
        isTrash: true,
        x: -24 + Math.random() * 48,
        z: -12 + Math.random() * 26,
        baseYOffset: 0.04,
        driftSpeed: 1.8 + Math.random() * 0.8,
        rotSpeed: 1.5 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.debrisGroup.visible = false;
  }

  setupDrainWhirlpools() {
    this.whirlpools = [];
    const vortexGeom = new THREE.RingGeometry(0.18, 1.15, 20);
    vortexGeom.rotateX(-Math.PI / 2);

    const vortexMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // 32 adede kadar dinamik girdap halkasi (oyuncunun kurdugu sunger park, sarnic ve pompalara baglanir)
    for (let i = 0; i < 32; i++) {
      const mesh = new THREE.Mesh(vortexGeom, vortexMat.clone());
      mesh.position.set(0, 0.43, 0);
      mesh.visible = false;
      this.scene.add(mesh);
      this.whirlpools.push({ mesh, active: false });
    }
  }

  // Sunger Sehir Savunmasi: Sunger Park, Yagmur Hasat Depolari ve Kiyi Pompalarindan Yayilan Emilim Dalgalari (Pulsing Rings)
  setupPulsingRings() {
    this.pulsingRingsGroup = new THREE.Group();
    this.scene.add(this.pulsingRingsGroup);
    this.pulsingRings = [];

    const ringGeom = new THREE.RingGeometry(0.35, 0.50, 28);
    ringGeom.rotateX(-Math.PI / 2);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 72; i++) {
      const mesh = new THREE.Mesh(ringGeom, ringMat.clone());
      mesh.position.set(0, 0.445, 0);
      mesh.visible = false;
      this.pulsingRingsGroup.add(mesh);
      this.pulsingRings.push({ mesh, active: false });
    }
  }

  // Sicak Dalgasi: Bacasiz ve Korumasiz Binalarin Tepesinde Kirmizi/Turuncu Sicaklik Dalgalanmasi (Heat Haze)
  setupHeatHaze() {
    this.heatHazeGroup = new THREE.Group();
    this.scene.add(this.heatHazeGroup);
    this.heatHazeGroup.visible = false;
    this.heatHazeMeshes = [];

    for (let i = 0; i < 48; i++) {
      const group = new THREE.Group();
      const geomA = new THREE.PlaneGeometry(1.6, 1.2, 8, 6);
      const geomB = new THREE.PlaneGeometry(1.6, 1.2, 8, 6);
      geomB.rotateY(Math.PI / 2);

      const hazeMatA = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const hazeMatB = hazeMatA.clone();

      const meshA = new THREE.Mesh(geomA, hazeMatA);
      const meshB = new THREE.Mesh(geomB, hazeMatB);
      group.add(meshA);
      group.add(meshB);
      group.visible = false;
      this.heatHazeGroup.add(group);

      this.heatHazeMeshes.push({
        group,
        meshA,
        meshB,
        basePosA: geomA.attributes.position.array.slice(),
        basePosB: geomB.attributes.position.array.slice(),
        active: false,
        phase: i * 0.73
      });
    }
  }

  updateHeatHaze(dt, gridRef, t = performance.now() * 0.001) {
    if (!this.heatHazeGroup) return;

    if (this.activeDisaster !== 'HEATWAVE') {
      this.heatHazeGroup.visible = false;
      if (this.heatHazeMeshes) {
        this.heatHazeMeshes.forEach((h) => {
          h.group.visible = false;
          h.active = false;
          h.meshA.material.opacity = 0;
          h.meshB.material.opacity = 0;
        });
      }
      return;
    }

    const grid = gridRef || this.grid;
    const unprotectedCells = [];
    if (grid && grid.cells) {
      for (const cell of grid.cells) {
        if (cell.occupied && !cell.isRoad) {
          const isProtected = cell.buildingType === 'green_roof' ||
                              cell.buildingType === 'cooling_tower' ||
                              cell.buildingType === 'sponge_park' ||
                              cell.buildingType === 'wind_corridor' ||
                              cell.buildingType === 'botanical_plaza';
          if (!isProtected) {
            unprotectedCells.push(cell);
          }
        }
      }
    }

    this.heatHazeGroup.visible = unprotectedCells.length > 0;
    let hazeIdx = 0;

    const roofHeights = {
      legacy_concrete: 2.8,
      commercial_hub: 3.9,
      eco_house: 1.7,
      waste_station: 1.3,
      solar_farm: 0.9,
      biogas_plant: 1.8,
      cistern: 1.4,
      compost_greenhouse: 1.3
    };

    for (let c = 0; c < unprotectedCells.length; c++) {
      if (hazeIdx >= this.heatHazeMeshes.length) break;
      const cell = unprotectedCells[c];
      const h = this.heatHazeMeshes[hazeIdx];
      h.active = true;
      h.group.visible = true;

      const roofBaseY = (roofHeights[cell.buildingType] || 1.8) + 0.36;
      const riseOffset = (Math.sin(t * 3.5 + h.phase) * 0.12) + 0.65;
      h.group.position.set(cell.x, roofBaseY + riseOffset, cell.z);

      const shimmerOpacity = 0.20 + Math.sin(t * 5.2 + h.phase) * 0.04;
      h.meshA.material.opacity = shimmerOpacity;
      h.meshB.material.opacity = shimmerOpacity;

      const posA = h.meshA.geometry.attributes.position.array;
      const baseA = h.basePosA;
      for (let v = 0; v < posA.length / 3; v++) {
        const vy = baseA[v * 3 + 1];
        const wave = Math.sin(t * 9.0 + vy * 6.0 + h.phase) * 0.09;
        posA[v * 3 + 2] = baseA[v * 3 + 2] + wave; // Z ekseni: meshA düzleminin normal dalgalanması
        posA[v * 3 + 0] = baseA[v * 3 + 0] + Math.cos(t * 7.0 + vy * 5.0 + h.phase) * 0.04;
      }
      h.meshA.geometry.attributes.position.needsUpdate = true;

      const posB = h.meshB.geometry.attributes.position.array;
      const baseB = h.basePosB;
      for (let v = 0; v < posB.length / 3; v++) {
        const vy = baseB[v * 3 + 1];
        const wave = Math.cos(t * 9.0 + vy * 6.0 + h.phase) * 0.09;
        posB[v * 3 + 0] = baseB[v * 3 + 0] + wave; // X ekseni: 90° döndürülmüş meshB düzleminin normal dalgalanması
        posB[v * 3 + 2] = baseB[v * 3 + 2] + Math.sin(t * 7.0 + vy * 5.0 + h.phase) * 0.04;
      }
      h.meshB.geometry.attributes.position.needsUpdate = true;

      hazeIdx++;
    }

    for (let i = hazeIdx; i < this.heatHazeMeshes.length; i++) {
      this.heatHazeMeshes[i].group.visible = false;
      this.heatHazeMeshes[i].active = false;
    }
  }

  setupTransformerSparks() {
    this.transformerSparksGroup = new THREE.Group();
    this.scene.add(this.transformerSparksGroup);
    this.transformerSparksGroup.visible = false;
    this.transformerSparks = [];

    const sparkGeom = new THREE.DodecahedronGeometry(0.08, 0);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < 48; i++) {
      const mesh = new THREE.Mesh(sparkGeom, sparkMat.clone());
      mesh.visible = false;
      this.transformerSparksGroup.add(mesh);
      this.transformerSparks.push({
        mesh,
        life: 0,
        maxLife: 0.25,
        vx: 0,
        vy: 0,
        vz: 0
      });
    }
  }

  triggerTransformerSpark(x, y, z) {
    if (!this.transformerSparks) return;
    this.transformerSparksGroup.visible = true;
    for (let i = 0; i < 4; i++) {
      const sp = this.transformerSparks.find((s) => s.life <= 0);
      if (!sp) break;
      sp.mesh.position.set(x, y, z);
      sp.life = 0.16 + Math.random() * 0.16;
      sp.maxLife = sp.life;
      sp.vx = (Math.random() - 0.5) * 3.2;
      sp.vy = 1.2 + Math.random() * 2.2;
      sp.vz = (Math.random() - 0.5) * 3.2;
      sp.mesh.visible = true;
      sp.mesh.material.opacity = 1.0;
      sp.mesh.material.color.setHex(Math.random() < 0.6 ? 0x38bdf8 : 0xfacc15);
    }
  }

  updateTransformerSparks(dt) {
    if (!this.transformerSparksGroup || !this.transformerSparksGroup.visible) return;
    let anyActive = false;
    this.transformerSparks.forEach((sp) => {
      if (sp.life > 0) {
        anyActive = true;
        sp.life -= dt;
        const prog = 1.0 - sp.life / sp.maxLife;
        sp.mesh.position.x += sp.vx * dt;
        sp.mesh.position.y += (sp.vy - 4.5 * dt) * dt;
        sp.mesh.position.z += sp.vz * dt;
        sp.mesh.material.opacity = 1.0 - prog;
        const s = 0.08 * (1.0 - prog * 0.6);
        sp.mesh.scale.set(s, s, s);
        if (sp.life <= 0) {
          sp.mesh.visible = false;
        }
      }
    });
    if (!anyActive) {
      this.transformerSparksGroup.visible = false;
    }
  }

  // Toroslar Duman İnversiyonu & Kül Serpintisi Sistemi (Ash Fallout)
  setupAshFallout() {
    this.ashParticlesGroup = new THREE.Group();
    this.ashParticlesGroup.visible = false;
    this.scene.add(this.ashParticlesGroup);

    this.ashParticles = [];
    const ashGeom = new THREE.DodecahedronGeometry(0.045, 0);
    const ashMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });

    for (let i = 0; i < 75; i++) {
      const mesh = new THREE.Mesh(ashGeom, ashMat);
      mesh.position.set(
        -35 + Math.random() * 70,
        1.5 + Math.random() * 14,
        -25 + Math.random() * 55
      );
      this.ashParticlesGroup.add(mesh);
      this.ashParticles.push({
        mesh,
        baseX: mesh.position.x,
        baseZ: mesh.position.z,
        vy: 0.35 + Math.random() * 0.45,
        driftSpeed: 0.8 + Math.random() * 0.6,
        rotSpeed: 1.0 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  updateAshFallout(dt, t = performance.now() * 0.001) {
    if (!this.ashParticlesGroup) return;
    const isSmoke = this.activeDisaster === 'WILDFIRE_SMOKE';
    this.ashParticlesGroup.visible = isSmoke;
    if (!isSmoke) return;

    this.ashParticles.forEach((ash) => {
      ash.mesh.position.y -= ash.vy * dt;
      ash.mesh.position.x += Math.sin(t * ash.driftSpeed + ash.phase) * dt * 0.35;
      ash.mesh.position.z += (0.55 + Math.cos(t * ash.driftSpeed + ash.phase) * 0.25) * dt;
      ash.mesh.rotation.x += dt * ash.rotSpeed;
      ash.mesh.rotation.y += dt * ash.rotSpeed * 0.8;

      if (ash.mesh.position.y <= 0.44) {
        ash.mesh.position.y = 12.0 + Math.random() * 4.0;
        ash.mesh.position.x = -35 + Math.random() * 70;
        ash.mesh.position.z = -25 + Math.random() * 55;
      }
    });
  }

  setSpongeCapacity(cap) {
    this.spongeCapacity = cap;
  }

  setGrid(grid) {
    this.grid = grid;
    this.setupContactFoam(grid);
    this.setupPuddles(grid);
    this.setupDrainGeysers(grid);
    this.setupStreetWaterFlow(grid);
  }

  startDisaster(type) {
    if (this.activeDisaster === 'FLOOD' && type !== 'FLOOD') {
      this.waterMesh.position.y = 0.05;
      this.waterMat.opacity = 0.0;
      if (this.debrisGroup) this.debrisGroup.visible = false;
    }
    this.activeDisaster = type;
    this.intensity = 1.0;
    this.floodElapsed = 0.0;
    this.lightningTimer = 2.0 + Math.random() * 2.0;
  }

  stopDisaster() {
    this.activeDisaster = null;
    this.intensity = 0.0;
    this.floodElapsed = 0.0;
    this.foamSurges.forEach((fs) => {
      if (fs.mat) fs.mat.opacity = 0.0;
    });
    // Afet bitince yuzen molozlar aninda yok edilmez; su cekilirken yumusakca coker
    this.whirlpools.forEach((w) => {
      w.mesh.visible = false;
      w.mesh.material.opacity = 0.0;
      w.active = false;
    });
    if (this.pulsingRings) {
      this.pulsingRings.forEach((r) => {
        r.mesh.visible = false;
        r.mesh.material.opacity = 0.0;
        r.active = false;
      });
      if (this.pulsingRingsGroup) this.pulsingRingsGroup.visible = false;
    }
    if (this.heatHazeGroup) {
      this.heatHazeGroup.visible = false;
    }
    if (this.heatHazeMeshes) {
      this.heatHazeMeshes.forEach((h) => {
        h.group.visible = false;
        h.active = false;
        h.meshA.material.opacity = 0.0;
        h.meshB.material.opacity = 0.0;
      });
    }
    if (this.streetFlowGroup) {
      if (this.streetFlows) {
        this.streetFlows.forEach((sf) => {
          sf.mat.opacity = 0.0;
          sf.mesh.visible = false;
        });
      }
      if (this.grateSuctions) {
        this.grateSuctions.forEach((gs) => {
          gs.mesh.material.opacity = 0.0;
          gs.mesh.visible = false;
        });
      }
    }
    this.ripples.forEach((r) => {
      r.life = Math.min(r.life, 0.12);
    });
    if (this.transformerSparksGroup) {
      this.transformerSparksGroup.visible = false;
    }
    if (this.ashParticlesGroup) {
      this.ashParticlesGroup.visible = false;
    }
  }

  update(dt, sunLight, hemiLight, fog, sceneBg, gridRef, gameRef = null) {
    const t = performance.now() * 0.001;
    if (gridRef && !this.grid) {
      this.grid = gridRef;
      this.setupPuddles(gridRef);
      this.setupStreetWaterFlow(gridRef);
    }

    // Sel suyu ve fırtına çekilmesi (Afet bitince yeraltına / denize emilim)
    if (!this.activeDisaster) {
      this.updatePuddles(dt, false, gridRef, gameRef);
      this.updateStreetWaterFlow(dt, false, gridRef, gameRef);
      if (this.transformerSparksGroup && this.transformerSparksGroup.visible) {
        this.updateTransformerSparks(dt);
      }
      if (this.rainMat.opacity > 0) {
        this.rainMat.opacity = Math.max(0, this.rainMat.opacity - dt * 2.5);
      }
      if (this.drainGeysers) {
        this.drainGeysers.forEach((g) => {
          g.group.visible = false;
        });
      }
      if (this.contactFoamGroup) {
        this.contactFoams.forEach((f) => {
          f.mesh.material.opacity = Math.max(0, f.mesh.material.opacity - dt * 0.8);
        });
        if (this.waterMesh.position.y <= 0.08) {
          this.contactFoamGroup.visible = false;
        }
      }
      if (this.pulsingRings) {
        let anyActive = false;
        this.pulsingRings.forEach((r) => {
          if (r.mesh.material.opacity > 0) {
            r.mesh.material.opacity = Math.max(0, r.mesh.material.opacity - dt * 2.0);
            anyActive = true;
          } else {
            r.mesh.visible = false;
            r.active = false;
          }
        });
        if (!anyActive && this.pulsingRingsGroup) {
          this.pulsingRingsGroup.visible = false;
        }
      }
      if (this.heatHazeGroup && this.heatHazeGroup.visible) {
        this.updateHeatHaze(dt, gridRef, t);
      }
      if (this.waterMesh.position.y > 0.05 || this.waterMat.opacity > 0 || (this.debrisGroup && this.debrisGroup.visible)) {
        this.waterMesh.position.y = Math.max(0.05, this.waterMesh.position.y - dt * 0.32);
        this.waterMat.opacity = Math.max(0, this.waterMat.opacity - dt * 0.45);
        this.foamSurges.forEach((fs) => {
          fs.mat.opacity = Math.max(0, fs.mat.opacity - dt * 0.6);
        });
        if (this.debrisGroup && this.debrisGroup.visible) {
          this.floatingDebris.forEach((d) => {
            d.mesh.position.y = Math.max(0.18, d.mesh.position.y - dt * 0.35);
          });
          if (this.waterMesh.position.y <= 0.09) {
            this.debrisGroup.visible = false;
          }
        }
        if (this.waterMesh.position.y <= 0.055) {
          const geomPos = this.waterMesh.geometry.attributes.position.array;
          const basePos = this.waterBasePos;
          for (let i = 0; i < geomPos.length; i++) {
            geomPos[i] = basePos[i];
          }
          this.waterMesh.geometry.attributes.position.needsUpdate = true;
        }
        if (this.waterMesh.position.y <= 0.05 && this.waterMat.opacity <= 0) {
          this.waterMesh.position.y = 0.05;
          this.waterMat.opacity = 0.0;
          if (this.debrisGroup) this.debrisGroup.visible = false;
        }
      }
      return;
    }

    if (this.activeDisaster === 'FLOOD') {
      this.updatePuddles(dt, true, gridRef, gameRef);
      // 1. Fırtına Gökyüzü ve Atmosferik Işıklandırma
      if (sceneBg?.setHex) sceneBg.setHex(0x334155);
      if (fog) {
        if (fog.color?.setHex) fog.color.setHex(0x334155);
        fog.density = 0.012;
      }
      if (hemiLight) hemiLight.intensity = 0.38;

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
        if (sunLight) {
          sunLight.intensity = 4.2;
          if (sunLight.color?.setHex) sunLight.color.setHex(0xe0f2fe);
        }
        if (sceneBg?.setHex) sceneBg.setHex(0x64748b);
        if (fog?.color?.setHex) fog.color.setHex(0x64748b);
        if (this.flashDuration <= 0) {
          this.isFlashing = false;
        }
      } else {
        if (sunLight) {
          sunLight.intensity = 0.65;
          if (sunLight.color?.setHex) sunLight.color.setHex(0x94a3b8);
        }
      }

      // 2. Yağmur Çizgilerini Aşağı Doğru Yağdır (Kademeli çisenti -> sağanak geçişi)
      const isAcid = Boolean(gameRef && ((gameRef.carbon && gameRef.carbon > 35) || (gameRef.airQuality && gameRef.airQuality < 65)));
      this.isAcidRain = isAcid;
      if (isAcid) {
        this.rainMat.color.setHex(0xd9df65); // Asit yağmuru sülfür/azot oksit kirlilik tonu
      } else {
        this.rainMat.color.setHex(0xcbeafe); // Temiz Akdeniz yağmuru
      }

      const rainFactor = (typeof this.drizzleProgress === 'number') ? this.drizzleProgress : 1.0;
      const targetRainOpacity = 0.32 + rainFactor * 0.56;
      this.rainMat.opacity = THREE.MathUtils.lerp(this.rainMat.opacity, targetRainOpacity, dt * 4.0);
      const pos = this.rainLines.geometry.attributes.position.array;
      const currentSurfaceY = Math.max(0.368, this.waterMesh.position.y + 0.008);

      for (let i = 0; i < this.rainCount; i++) {
        const d = this.rainData[i];
        d.y -= (d.speed * (0.65 + rainFactor * 0.35)) * dt;
        d.x -= 4.2 * dt;
        d.z += 2.4 * dt;

        // Su veya zemin yüzeyine çarpınca sıçrama halkası tetikle
        if (d.y <= currentSurfaceY) {
          if (Math.random() < 0.38) {
            this.spawnSplash(d.x, d.z);
          }
          d.y = 28 + Math.random() * 6;
          d.x = (Math.random() - 0.5) * 125;
          d.z = (Math.random() - 0.5) * 120;
        }

        const idx = i * 6;
        const topY = Math.max(currentSurfaceY + 0.05, d.y);
        const botY = Math.max(currentSurfaceY, d.y - d.len);
        pos[idx + 0] = d.x;
        pos[idx + 1] = topY;
        pos[idx + 2] = d.z;
        pos[idx + 3] = d.x - 0.35;
        pos[idx + 4] = botY;
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

      // 3. Organik Sel Suyu Fiziği: Kademeli Yağış, Altyapı Doygunluğu ve v9.0 Dinamik Mazgal Emişi
      this.floodElapsed = (this.floodElapsed || 0) + dt;

      const grid = gridRef || this.grid;
      const roadCells = (grid && grid.cells) ? grid.cells.filter((c) => c.occupied && c.isRoad) : [];
      let activeGrates = 0;
      let absorbingCount = 0;
      const absorbingCells = [];
      if (grid && grid.cells) {
        for (const cell of grid.cells) {
          if (cell.occupied) {
            if ((cell.buildingType === 'drain_grate' || cell.buildingType === 'coastal_pump') && cell.hasRoadAccess) {
              activeGrates++;
            }
            if (
              cell.buildingType === 'sponge_park' ||
              cell.buildingType === 'coastal_pump' ||
              cell.buildingType === 'cistern' ||
              Boolean(cell.hasRainHarvest)
            ) {
              absorbingCount++;
              absorbingCells.push(cell);
            }
          }
        }
      }
      const spongeCap = (gameRef && typeof gameRef.spongeCapacity === 'number') ? gameRef.spongeCapacity : this.spongeCapacity;
      const zeroWaste = (gameRef && typeof gameRef.zeroWasteRate === 'number') ? gameRef.zeroWasteRate : 22;
      const grateEfficiency = zeroWaste >= 50 ? 1.0 : 0.45;
      // v9.0 Her aktif mazgal sel suyunu yer altına çeker (drainRate)
      this.currentDrainRate = activeGrates * 0.038 * grateEfficiency;
      this.activeGratesCount = activeGrates;
      const isMitigated = (spongeCap >= 40 || activeGrates >= 4 || absorbingCount >= 3);

      // Kademeli Su Seviyesi Eğrisi (Gerçekçi Şehir Hidrolojisi + Dinamik Mazgal Tahliyesi):
      // - 0s - 3s: Hızlı cadde oluk birikimi (y = 0.25 -> 0.46, yollar hızla suyla kaplanır)
      // - 3s - 8s: Şehir şebekesi doygunluğu ve asfalt taşması (y = 0.46 -> 0.51)
      // - 8s+: Tepe noktası. Mazgal ve sünger parklar suyu emerek güvenli seviyeye (0.45) çeker!
      let targetWaterY = 0.05;
      if (this.floodElapsed <= 2.6) {
        const p1 = this.floodElapsed / 2.6;
        targetWaterY = 0.05 + p1 * 0.16; // 0.05 -> 0.21 (< 0.25)
      } else if (this.floodElapsed <= 6.5) {
        const p2 = (this.floodElapsed - 2.6) / 3.9;
        targetWaterY = 0.21 + p2 * 0.26; // 0.21 -> 0.47 (hızla yolları basar)
      } else {
        if (isMitigated) {
          targetWaterY = 0.455;
        } else {
          const p3 = Math.min(1.0, (this.floodElapsed - 6.5) / 4.0);
          targetWaterY = 0.47 + p3 * 0.025; // 0.47 -> 0.495 (~0.50)
        }
      }

      // v9.0 Mazgal Dinamik Boşaltım Algoritması: İnşa edilen mazgallar su seviyesini anlık tahliye eder
      if (activeGrates > 0) {
        const grateReduction = Math.min(0.045, activeGrates * 0.015 * grateEfficiency);
        targetWaterY = Math.max(0.442, targetWaterY - grateReduction);
      }

      // Afet sonuna doğru yağmur dinerken suyun doğal geri çekilmesi
      if (gameRef && typeof gameRef.disasterDuration === 'number' && gameRef.disasterDuration < 6.0) {
        const recedeRatio = Math.max(0, gameRef.disasterDuration / 6.0);
        targetWaterY = 0.05 + recedeRatio * (targetWaterY - 0.05);
      }

      const lerpSpeed = activeGrates >= 4 ? 2.6 : 1.8;
      this.waterMesh.position.y = THREE.MathUtils.lerp(this.waterMesh.position.y, targetWaterY, dt * lerpSpeed);

      const targetOpacity = Math.min(0.85, 0.20 + Math.min(1.0, this.floodElapsed / 6.0) * 0.65);
      this.waterMat.opacity = THREE.MathUtils.lerp(this.waterMat.opacity, targetOpacity, dt * 2.8);

      // Akıntı Yönü: Dokuyu Akdeniz'e (+Z, güneye) doğru akıt
      if (this.waterTexture) {
        this.waterTexture.offset.y -= dt * 0.42;
        this.waterTexture.offset.x -= dt * 0.08;
      }

      // Toroslar'dan (Kuzey, -Z) Akdeniz'e (+Z, Güney) pürüzsüz doğal yüzey dalgaları
      const geomPos = this.waterMesh.geometry.attributes.position.array;
      const basePos = this.waterBasePos;
      const vCount = geomPos.length / 3;

      for (let i = 0; i < vCount; i++) {
        const bx = basePos[i * 3 + 0];
        const bz = basePos[i * 3 + 2];

        // Toroslar'dan Akdeniz kıyısına doğal eğim gradyanı
        const torosSlope = (bz < 22) ? ((-bz) * 0.0032) : 0;

        // Haritadaki yol koridorlarına göre suyun önce yolları doldurup sonra yollardan taşması:
        let minDistSq = 999;
        if (roadCells.length > 0 && Math.abs(bx) < 32 && Math.abs(bz) < 23) {
          for (let r = 0; r < roadCells.length; r++) {
            const rc = roadCells[r];
            const dx = bx - rc.x;
            const dz = bz - rc.z;
            const d2 = dx * dx + dz * dz;
            if (d2 < minDistSq) minDistSq = d2;
            if (d2 < 1.2) break;
          }
        } else {
          minDistSq = Math.min(Math.pow(bz - 1.5, 2), Math.pow(Math.abs(bx) - 7.5, 2));
        }

        const distToRoad = Math.sqrt(minDistSq);
        const isStreetCorridor = distToRoad <= 1.65;
        // İlk 6 saniyede sel suyu sadece yolların (asfalt olukların) içinde yükselir,
        // 6. saniyeden 16. saniyeye kadar yollardan taşarak çevre parsellere yayılır!
        const overflowProg = THREE.MathUtils.clamp((this.floodElapsed - 5.0) / 10.0, 0.0, 1.0);
        const overflowRadius = 1.65 + overflowProg * 18.0;

        let roadChannelOffset = 0.0;
        if (bz < 21.8) {
          if (isStreetCorridor) {
            // Yol koridorlarında su erken evrede (+0.09) hızla birikir, zirvede dengelenir
            roadChannelOffset = (1.0 - overflowProg) * 0.09 + 0.015;
          } else if (distToRoad > overflowRadius) {
            // Henüz taşkın dalgasının ulaşmadığı kara parsellerinde su zeminin altında (-0.28) kalır
            roadChannelOffset = -0.28 * (1.0 - overflowProg);
          } else {
            // Yoldan taşma geçiş kuşağı (yol kenarından dışarı doğru kademeli yayılma)
            const edgeRatio = (distToRoad - 1.65) / Math.max(0.1, overflowRadius - 1.65);
            roadChannelOffset = -0.22 * edgeRatio * (1.0 - overflowProg);
          }
        }

        const streetSwell = isStreetCorridor
          ? (Math.sin(bz * 0.35 - t * 2.4) * 0.022) + roadChannelOffset
          : roadChannelOffset;

        // Yumuşak, doğal güneye (Akdeniz'e) doğru dalgalanma (Sert beyaz ışık kırılmalarını ve titremeleri önler)
        const wave1 = Math.sin(bz * 0.22 - t * 1.8) * 0.032;
        const wave2 = Math.cos(bz * 0.35 + bx * 0.12 - t * 2.2) * 0.018;
        const wave3 = Math.sin((bz * 0.45) - t * 2.8) * 0.012;

        // Sünger Şehir Su Çöküntüsü (Sponge City Suction Depression):
        // Aktif sünger park, hasRainHarvest binaları ve kıyı pompalarının çevresinde su yüzeyi aşağı çekilir!
        let maxDepression = 0;
        if (absorbingCells.length > 0) {
          for (let a = 0; a < absorbingCells.length; a++) {
            const ac = absorbingCells[a];
            const dx = bx - ac.x;
            const dz = bz - ac.z;
            const distSq = dx * dx + dz * dz;
            const radius = 3.6;
            if (distSq < radius * radius) {
              const dist = Math.sqrt(distSq);
              const falloff = 0.5 * (1 + Math.cos((dist / radius) * Math.PI));
              const dip = 0.18 * falloff;
              if (dip > maxDepression) maxDepression = dip;
            }
          }
        }

        geomPos[i * 3 + 1] = torosSlope + wave1 + wave2 + wave3 + streetSwell - maxDepression;
      }
      this.waterMesh.geometry.attributes.position.needsUpdate = true;
      this.waterMesh.geometry.computeVertexNormals();

      // 4. Dalgalı Taşkın Köpük Katmanları (Yapay yatay beyaz çizgiler kaldırıldı)
      if (this.foamSurges && this.foamSurges.length > 0) {
        this.foamSurges.forEach((fs) => {
          if (fs.mat) fs.mat.opacity = 0;
        });
      }

      // 4b. Yolların Kenarlarındaki Mazgallardan Geriye Doğru Kabaran Köpükler ve Rögar Kapakları (Gutter Drain Surcharge Geysers)
      if (this.waterMesh.position.y > 0.12 && grid && grid.cells && this.drainGeysers) {
        // Mazgal ve Drenaj Altyapısı Kapasite Kontrolü:
        // Şehirde yeterli mazgal (drain_grate >= 4) veya sünger kapasitesi (>= 40) varsa su yeraltına çekilir,
        // rögar kapakları kapalı kalır ve fışkırma olmaz!
        const activeGrates = grid.cells.filter((c) => c.occupied && (c.buildingType === 'drain_grate' || c.buildingType === 'coastal_pump') && c.hasRoadAccess).length;
        const isSurcharging = (activeGrates < 4) && (this.spongeCapacity < 40);

        let gIdx = 0;
        for (const rCell of roadCells) {
          if (gIdx >= this.drainGeysers.length) break;
          const neighbors = (grid.getRoadNeighbors)
            ? grid.getRoadNeighbors(rCell.row, rCell.col)
            : { N: false, S: false, W: false, E: false };
          const isEW = (neighbors.W || neighbors.E) && (!neighbors.N && !neighbors.S);

          const offsets = isEW
            ? [[0, -1.15], [0, 1.15]]
            : [[-1.15, 0], [1.15, 0]];

          offsets.forEach(([ox, oz]) => {
            if (gIdx >= this.drainGeysers.length) return;
            const geyser = this.drainGeysers[gIdx];
            geyser.group.visible = true;

            if (isSurcharging) {
              const frothY = this.waterMesh.position.y + 0.025 + Math.sin(t * geyser.speed + geyser.phase) * 0.04;
              geyser.group.position.set(rCell.x + ox, frothY, rCell.z + oz);

              if (geyser.cover) {
                // Rögar Kapağı Zıplama / Fırlama: Döküm rögar kapağı fiziksel olarak yukarı zıplayıp kenara devrilir
                const bounce = Math.abs(Math.sin(t * 12.0 + geyser.phase));
                geyser.cover.position.y = 0.26 + bounce * 0.12;
                geyser.cover.position.x = 0.16 + Math.sin(t * 5.0 + geyser.phase) * 0.04;
                geyser.cover.rotation.x = 0.65 + Math.sin(t * 8.0) * 0.18;
                geyser.cover.rotation.z = -0.42 + Math.cos(t * 9.5) * 0.14;
              }
              if (geyser.column) {
                geyser.column.visible = true;
                geyser.column.scale.set(1.15, 1.35 + Math.sin(t * 14.0 + geyser.phase) * 0.45, 1.15);
                if (geyser.column.material) {
                  geyser.column.material.opacity = Math.min(0.92, (this.waterMesh.position.y / 0.50) * 0.90);
                }
              }

              const scale = 0.85 + Math.sin(t * geyser.speed + geyser.phase) * 0.42;
              geyser.group.scale.set(scale, scale * 1.3, scale);
              geyser.group.children.forEach((child) => {
                if (child.material && child !== geyser.cover && child !== geyser.column) {
                  child.material.opacity = Math.min(0.88, (this.waterMesh.position.y / 0.50) * 0.85);
                }
              });
            } else {
              geyser.group.position.set(rCell.x + ox, 0.438, rCell.z + oz);
              if (geyser.cover) {
                geyser.cover.position.set(0, 0.02, 0);
                geyser.cover.rotation.set(0, 0, 0);
              }
              if (geyser.column) {
                geyser.column.visible = false;
                if (geyser.column.material) geyser.column.material.opacity = 0.0;
              }
              geyser.group.children.forEach((child) => {
                if (child.material && child !== geyser.cover) {
                  child.material.opacity = 0.0;
                }
              });
            }
            gIdx++;
          });
        }
        for (let i = gIdx; i < this.drainGeysers.length; i++) {
          this.drainGeysers[i].group.visible = false;
        }
      } else if (this.drainGeysers) {
        this.drainGeysers.forEach((g) => {
          g.group.visible = false;
        });
      }

      // 4c. Kıyı ve Bina Kenarları Temas Köpüğü (Gizlendi, yapay yatay çizgiler önlendi)
      if (this.contactFoamGroup) {
        this.contactFoamGroup.visible = false;
        this.contactFoams.forEach((cf) => {
          if (cf.mesh && cf.mesh.material) cf.mesh.material.opacity = 0;
        });
      }

      // 4d. Caddeler Boyunca Su Akıntısı ve Mazgal Emişi
      this.updateStreetWaterFlow(dt, true, gridRef, gameRef);

      // 5. Yüzen Moloz & Sokak Çöpleri Simülasyonu
      if (this.waterMesh.position.y > 0.15) {
        this.debrisGroup.visible = true;
        const isCleanStreets = Boolean(gameRef && gameRef.zeroWasteRate >= 80);

        this.floatingDebris.forEach((d) => {
          // Eğer sıfır atık oranı %80 üzerindeyse sokak çöpleri (şişe/poşet) gizlenir
          if (d.isTrash && isCleanStreets) {
            d.mesh.visible = false;
            return;
          }
          d.mesh.visible = true;

          // Akıntı ile güneye (Akdeniz'e) doğru sürüklenir
          d.z += dt * d.driftSpeed;
          if (d.z > 26) {
            // Sahile / Kumsala vurdu, döngüyü kuzeyden yenile
            d.z = -18;
            d.x = -24 + Math.random() * 48;
          }

          // Yüzey dalga yüksekliğine göre batıp çıkma ve yalpalama
          const localWave = Math.sin(d.x * 0.4 + d.z * 0.3 - t * 4.5) * 0.06;
          d.mesh.position.set(d.x, this.waterMesh.position.y + localWave + d.baseYOffset, d.z);
          d.mesh.rotation.x = Math.sin(t * 3.2 + d.phase) * 0.22;
          d.mesh.rotation.z = Math.cos(t * 2.8 + d.phase) * 0.18;
          d.mesh.rotation.y += dt * d.rotSpeed;
        });
      }

      // 6. Sünger Tesisleri Emici Su Hortumları (Vortex Whirlpools)
      let drainIndex = 0;
      for (const cell of absorbingCells) {
        if (drainIndex < this.whirlpools.length) {
          const w = this.whirlpools[drainIndex];
          w.mesh.visible = true;
          w.active = true;
          // Girdap, sünger havzasındaki su çöküntüsünün (dip: -0.18) tam yüzeyinde oturur
          w.mesh.position.set(cell.x, Math.max(0.32, this.waterMesh.position.y - 0.17), cell.z);
          w.mesh.rotation.z += dt * (9.0 + drainIndex * 1.5);
          const s = 0.95 + Math.sin(t * 4.5 + drainIndex) * 0.35;
          w.mesh.scale.set(s, s, s);
          w.mesh.material.opacity = Math.min(0.9, 0.55 + (this.spongeCapacity / 45) * 0.35);
          drainIndex++;
        }
      }

      // Eğer haritada henüz sünger park yoksa ama sünger kapasitesi varsa varsayılan sahil çıkışlarında emilim göster
      if (drainIndex === 0 && this.spongeCapacity > 0) {
        const fallbackDrains = [[-10, 1.5], [10, 1.5], [0, 18.0]];
        fallbackDrains.forEach(([wx, wz], idx) => {
          if (idx < this.whirlpools.length) {
            const w = this.whirlpools[idx];
            w.mesh.visible = true;
            w.mesh.position.set(wx, Math.max(0.32, this.waterMesh.position.y - 0.15), wz);
            w.mesh.rotation.z += dt * (8.0 + idx * 1.5);
            const s = 0.75 + Math.sin(t * 4 + idx) * 0.3;
            w.mesh.scale.set(s, s, s);
            w.mesh.material.opacity = Math.min(0.85, (this.spongeCapacity / 45) * 0.85);
            drainIndex++;
          }
        });
      }

      // Kalan boş girdapları gizle
      for (let i = drainIndex; i < this.whirlpools.length; i++) {
        this.whirlpools[i].mesh.visible = false;
        this.whirlpools[i].active = false;
      }

      // 7. Sünger Şehir Dairesel Mavi Emilim Dalgaları (Absorption Pulsing Rings)
      let ringIndex = 0;
      if (this.pulsingRings && absorbingCells.length > 0) {
        this.pulsingRingsGroup.visible = true;
        for (let fIdx = 0; fIdx < absorbingCells.length; fIdx++) {
          const ac = absorbingCells[fIdx];
          for (let wIdx = 0; wIdx < 3; wIdx++) {
            if (ringIndex >= this.pulsingRings.length) break;
            const r = this.pulsingRings[ringIndex];
            const phase = (t * 1.35 + wIdx * 0.33 + fIdx * 0.22) % 1.0;
            const scale = 0.6 + phase * 2.8;
            const alpha = Math.sin(phase * Math.PI) * 0.85;

            // Dalganın yarıçapına göre su yüzeyi çöküntüsünü dinamik takip et:
            const currentRadius = 0.50 * scale;
            const falloff = 0.5 * (1 + Math.cos(Math.min(1.0, currentRadius / 3.6) * Math.PI));
            const localWaterY = this.waterMesh.position.y - 0.18 * falloff;
            const surfaceY = Math.max(0.438, localWaterY);
            const ringY = surfaceY + 0.008;

            r.mesh.position.set(ac.x, ringY, ac.z);
            r.mesh.scale.set(scale, 1, scale);
            r.mesh.material.opacity = alpha;
            r.mesh.visible = true;
            r.active = true;
            ringIndex++;
          }
        }
      }
      for (let i = ringIndex; i < this.pulsingRings.length; i++) {
        this.pulsingRings[i].mesh.visible = false;
        this.pulsingRings[i].active = false;
      }

    } else if (this.activeDisaster === 'HEATWAVE') {
      // 47°C Sıcak Hava Kubbesi & Kavurucu Sıcak Dalgası (Scorching Desert Orange & Glowing Amber)
      const desertOrange = 0xf97316; // Scorching hot desert orange (#f97316)
      const deepOrange = 0xea580c;   // Deep desert orange (#ea580c)
      const glowingAmber = 0xb45309; // Glowing amber fog & sky (#b45309)

      if (sceneBg?.setHex) sceneBg.setHex(glowingAmber);
      if (fog) {
        if (fog.color?.setHex) fog.color.setHex(glowingAmber);
        fog.density = 0.010;
      }
      if (sunLight) {
        sunLight.intensity = 3.6;
        if (sunLight.color?.setHex) sunLight.color.setHex(desertOrange);
      }
      if (hemiLight) {
        hemiLight.intensity = 1.2;
        if (hemiLight.color?.setHex) hemiLight.color.setHex(desertOrange);
        if (hemiLight.groundColor?.setHex) hemiLight.groundColor.setHex(deepOrange);
      }

      this.updatePuddles(dt, false, gridRef, gameRef);
      this.rainMat.opacity = 0.0;
      this.waterMat.opacity = 0.0;
      this.floodFoamMat.opacity = 0.0;
      if (this.waterMesh.position.y > 0.05 || (this.debrisGroup && this.debrisGroup.visible)) {
        this.waterMesh.position.y = 0.05;
        if (this.debrisGroup) this.debrisGroup.visible = false;
        const geomPos = this.waterMesh.geometry.attributes.position.array;
        const basePos = this.waterBasePos;
        for (let i = 0; i < geomPos.length; i++) {
          geomPos[i] = basePos[i];
        }
        this.waterMesh.geometry.attributes.position.needsUpdate = true;
      }

      // Korumasız ve bacasız binaların çatısında dalgalanan kentsel ısı dalgalanması (Heat Haze)
      this.updateHeatHaze(dt, gridRef, t);

      if (this.transformerSparksGroup && this.transformerSparksGroup.visible) {
        this.updateTransformerSparks(dt);
      }

    } else if (this.activeDisaster === 'WILDFIRE_SMOKE') {
      this.updatePuddles(dt, false, gridRef, gameRef);
      if (this.heatHazeGroup) this.heatHazeGroup.visible = false;
      // Toros Dağları Orman Yangını Dumanı & Hava Kalitesi Krizi
      if (sceneBg?.setHex) sceneBg.setHex(0x78350f);
      if (fog) {
        if (fog.color?.setHex) fog.color.setHex(0x78350f);
        fog.density = 0.016;
      }
      if (sunLight) {
        sunLight.intensity = 1.4;
        if (sunLight.color?.setHex) sunLight.color.setHex(0xf97316);
      }
      if (hemiLight?.color?.setHex) hemiLight.color.setHex(0xd97706);

      this.rainMat.opacity = 0.0;
      this.waterMat.opacity = 0.0;
      this.floodFoamMat.opacity = 0.0;
      if (this.waterMesh.position.y > 0.05 || (this.debrisGroup && this.debrisGroup.visible)) {
        this.waterMesh.position.y = 0.05;
        if (this.debrisGroup) this.debrisGroup.visible = false;
        const geomPos = this.waterMesh.geometry.attributes.position.array;
        const basePos = this.waterBasePos;
        for (let i = 0; i < geomPos.length; i++) {
          geomPos[i] = basePos[i];
        }
        this.waterMesh.geometry.attributes.position.needsUpdate = true;
      }

      // Toroslar kül serpintisini güncelle
      this.updateAshFallout(dt, t);
    }
  }
}

