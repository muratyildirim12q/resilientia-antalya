import * as THREE from 'three';

export class GridManager {
  constructor(scene, cols = 20, rows = 14) {
    this.scene = scene;
    if (typeof rows === 'undefined') rows = cols;
    this.cols = cols; // 20 Sütun
    this.rows = rows; // 14 Satır (280 Hücre)
    this.size = Math.max(this.cols, this.rows); // Geriye uyumluluk için
    this.spacing = 3.0; // Kenney 1x1 karolarının 3x ölçeği ile %100 sıfır boşluklu uyum
    this.cells = [];
    this.cellMap = new Map();
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.hoverMesh = null;
    this.hoverWireframe = null;
    this.aoeAuraMesh = null;
    this.ghostGroup = new THREE.Group();
    this.ghostGroup.visible = false;
    this.lastGhostKey = '';
    this.group.add(this.ghostGroup);
    this.zoningOverlayGroup = new THREE.Group();
    this.zoningOverlayGroup.visible = false;
    this.group.add(this.zoningOverlayGroup);

    this.initGrid();
  }

  initGrid() {
    // 1. Seçim / Hover Vurgusu (İnşaat: Yeşil, Yıkım: Kırmızı, İnceleme: Mavi)
    const hGeom = new THREE.PlaneGeometry(2.92, 2.92);
    hGeom.rotateX(-Math.PI / 2);
    this.hoverMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.hoverMesh = new THREE.Mesh(hGeom, this.hoverMat);
    this.hoverMesh.position.y = 0.42;
    this.hoverMesh.visible = false;

    const edges = new THREE.EdgesGeometry(hGeom);
    this.hoverLineMat = new THREE.LineBasicMaterial({ color: 0x34d399 });
    this.hoverWireframe = new THREE.LineSegments(edges, this.hoverLineMat);
    this.hoverMesh.add(this.hoverWireframe);
    this.group.add(this.hoverMesh);

    // v9.0 Mekansal Etki Alanı Aurası (AoE Radius Aura)
    const aoeGeom = new THREE.CircleGeometry(1.0, 32);
    aoeGeom.rotateX(-Math.PI / 2);
    this.aoeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.aoeAuraMesh = new THREE.Mesh(aoeGeom, this.aoeMat);
    this.aoeAuraMesh.position.y = 0.43;
    this.aoeAuraMesh.visible = false;
    const aoeEdges = new THREE.EdgesGeometry(new THREE.RingGeometry(0.95, 1.0, 32).rotateX(-Math.PI / 2));
    this.aoeLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
    this.aoeRingLine = new THREE.LineSegments(aoeEdges, this.aoeLineMat);
    this.aoeAuraMesh.add(this.aoeRingLine);
    this.group.add(this.aoeAuraMesh);

    // v10.0 / v11.0 İnteraktif Başlangıç Öğreticisi 3B Yönlendirici İşaretçi (Şık 3B Ok, Parsel Çerçevesi ve Halka)
    this.tutorialBeaconGroup = new THREE.Group();
    this.tutorialBeaconGroup.visible = false;

    const cylGeom = new THREE.CylinderGeometry(0.11, 0.05, 1.4, 8);
    this.beaconCylMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    });
    this.beaconCylinder = new THREE.Mesh(cylGeom, this.beaconCylMat);
    this.beaconCylinder.position.y = 2.65;
    this.tutorialBeaconGroup.add(this.beaconCylinder);

    const coneGeom = new THREE.ConeGeometry(0.42, 0.72, 6);
    coneGeom.rotateX(Math.PI);
    this.beaconConeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.96
    });
    this.beaconCone = new THREE.Mesh(coneGeom, this.beaconConeMat);
    this.beaconCone.position.y = 1.75;
    this.tutorialBeaconGroup.add(this.beaconCone);

    const ringGeom = new THREE.RingGeometry(1.12, 1.38, 32);
    ringGeom.rotateX(-Math.PI / 2);
    this.beaconRingMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.beaconRing = new THREE.Mesh(ringGeom, this.beaconRingMat);
    this.beaconRing.position.y = 0.425;
    this.tutorialBeaconGroup.add(this.beaconRing);

    const framePlane = new THREE.PlaneGeometry(2.86, 2.86);
    framePlane.rotateX(-Math.PI / 2);
    const frameEdges = new THREE.EdgesGeometry(framePlane);
    this.beaconFrameMat = new THREE.LineBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.95 });
    this.beaconFrame = new THREE.LineSegments(frameEdges, this.beaconFrameMat);
    this.beaconFrame.position.y = 0.43;
    this.tutorialBeaconGroup.add(this.beaconFrame);

    this.group.add(this.tutorialBeaconGroup);

    const offsetX = ((this.cols - 1) * this.spacing) / 2; // (19 * 3) / 2 = 28.5
    const offsetZ = ((this.rows - 1) * this.spacing) / 2; // (13 * 3) / 2 = 19.5 (row 7 -> z = 1.5)

    // 2. 20x14 İmar Kılavuz Çizgileri ve Belirgin Çerçeve
    const gridLines = [];
    const minX = -this.cols * this.spacing / 2; // -30.0
    const maxX = this.cols * this.spacing / 2;  // 30.0
    const minZ = -this.rows * this.spacing / 2; // -21.0
    const maxZ = this.rows * this.spacing / 2;  // 21.0

    // İç ızgara çizgileri (X boyunca)
    for (let r = 1; r < this.rows; r++) {
      const zLine = minZ + r * this.spacing;
      gridLines.push(minX, 0.37, zLine, maxX, 0.37, zLine);
    }
    // İç ızgara çizgileri (Z boyunca)
    for (let c = 1; c < this.cols; c++) {
      const xLine = minX + c * this.spacing;
      gridLines.push(xLine, 0.37, minZ, xLine, 0.37, maxZ);
    }

    const gridGeom = new THREE.BufferGeometry();
    gridGeom.setAttribute('position', new THREE.Float32BufferAttribute(gridLines, 3));
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });
    const gridMesh = new THREE.LineSegments(gridGeom, gridMat);
    this.zoningOverlayGroup.add(gridMesh);

    // Belirgin 20x14 Dış Çevre Sınır Çizgisi ve Köşe Braketleri (Geniş İmar Sahasını Net Gösterir)
    const boundaryLines = [
      minX, 0.38, minZ, maxX, 0.38, minZ,
      maxX, 0.38, minZ, maxX, 0.38, maxZ,
      maxX, 0.38, maxZ, minX, 0.38, maxZ,
      minX, 0.38, maxZ, minX, 0.38, minZ
    ];
    // 4 Köşe L-Braketleri (Köşe sınır vurgusu)
    const bLen = 2.4;
    boundaryLines.push(
      minX, 0.385, minZ, minX + bLen, 0.385, minZ,
      minX, 0.385, minZ, minX, 0.385, minZ + bLen,
      maxX, 0.385, minZ, maxX - bLen, 0.385, minZ,
      maxX, 0.385, minZ, maxX, 0.385, minZ + bLen,
      minX, 0.385, maxZ, minX + bLen, 0.385, maxZ,
      minX, 0.385, maxZ, minX, 0.385, maxZ - bLen,
      maxX, 0.385, maxZ, maxX - bLen, 0.385, maxZ,
      maxX, 0.385, maxZ, maxX, 0.385, maxZ - bLen
    );
    const boundaryGeom = new THREE.BufferGeometry();
    boundaryGeom.setAttribute('position', new THREE.Float32BufferAttribute(boundaryLines, 3));
    const boundaryMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const boundaryMesh = new THREE.LineSegments(boundaryGeom, boundaryMat);
    this.zoningOverlayGroup.add(boundaryMesh);

    // Kalıcı İmar Sınırı Köşe Braketleri (İnşaat menüsü kapalıyken dahi 20x14 geniş alanı hissettirir)
    const permCornerLines = [
      minX, 0.375, minZ, minX + 2.2, 0.375, minZ,
      minX, 0.375, minZ, minX, 0.375, minZ + 2.2,
      maxX, 0.375, minZ, maxX - 2.2, 0.375, minZ,
      maxX, 0.375, minZ, maxX, 0.375, minZ + 2.2,
      minX, 0.375, maxZ, minX + 2.2, 0.375, maxZ,
      minX, 0.375, maxZ, minX, 0.375, maxZ - 2.2,
      maxX, 0.375, maxZ, maxX - 2.2, 0.375, maxZ,
      maxX, 0.375, maxZ, maxX, 0.375, maxZ - 2.2
    ];
    const permGeom = new THREE.BufferGeometry();
    permGeom.setAttribute('position', new THREE.Float32BufferAttribute(permCornerLines, 3));
    const permMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      visible: false,
      depthWrite: false
    });
    this.group.add(new THREE.LineSegments(permGeom, permMat));

    // 3. Parsel Hücreleri ve Raycast Düzlemleri
    const hitGeom = new THREE.PlaneGeometry(this.spacing, this.spacing);
    hitGeom.rotateX(-Math.PI / 2);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.spacing - offsetX;
        const z = r * this.spacing - offsetZ;

        const hitPlane = new THREE.Mesh(hitGeom, hitMat);
        hitPlane.position.set(x, 0.38, z);
        this.group.add(hitPlane);

        // v11.0 Prosedürel Akdeniz Toprak/Çim Parsel Altlığı (Beveled Parcel Earth Pad)
        const emptyPadGroup = new THREE.Group();
        emptyPadGroup.position.set(x, 0.365, z);

        const padGeom = new THREE.BoxGeometry(2.88, 0.035, 2.88);
        const padMat = new THREE.MeshStandardMaterial({
          color: 0x4f9b5c,
          roughness: 0.9,
          metalness: 0.02,
          visible: false
        });
        const padMesh = new THREE.Mesh(padGeom, padMat);
        padMesh.visible = false;
        padMesh.receiveShadow = true;
        emptyPadGroup.add(padMesh);

        // Toprak Altlık Kenar Bordürü (Toprak sınırlayıcı hafif koyu terra-cotta pah şeridi)
        const rimGeom = new THREE.BoxGeometry(2.94, 0.02, 2.94);
        const rimMat = new THREE.MeshStandardMaterial({
          color: 0x4f9b5c,
          roughness: 0.95,
          visible: false
        });
        const rimMesh = new THREE.Mesh(rimGeom, rimMat);
        rimMesh.visible = false;
        rimMesh.position.y = -0.01;
        emptyPadGroup.add(rimMesh);

        // Parsel içi minik çakıl taşları / yabani çalı detayları (Doğal boş arsa hissi)
        const seedVal = (r * 7 + c * 13) % 12;
        if (seedVal % 2 === 0) {
          const pebbleGeom = new THREE.DodecahedronGeometry(0.045, 0);
          const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
          const pebble = new THREE.Mesh(pebbleGeom, pebbleMat);
          pebble.position.set(0.6 * ((seedVal % 3) - 1), 0.025, 0.5 * ((seedVal % 4) - 1.5));
          emptyPadGroup.add(pebble);
        }

        this.group.add(emptyPadGroup);

        const cell = {
          row: r,
          col: c,
          x,
          z,
          hitMesh: hitPlane,
          emptyPadGroup,
          occupied: false,
          isRoad: false,
          building: null,
          buildingType: null,
          variantSeed: seedVal
        };
        hitPlane.userData.cell = cell;

        this.cells.push(cell);
        this.cellMap.set(`${r},${c}`, cell);
      }
    }
  }

  setZoningOverlayVisible(visible) {
    this.zoningOverlayGroup.visible = visible;
  }

  getCell(row, col) {
    return this.cellMap.get(`${row},${col}`) || null;
  }

  getCellFromIntersection(intersectedMesh) {
    if (intersectedMesh && intersectedMesh.userData && intersectedMesh.userData.cell) {
      return intersectedMesh.userData.cell;
    }
    return this.cells.find((cell) => cell.hitMesh === intersectedMesh) || null;
  }

  isRoadAt(row, col) {
    // Ana Doğu-Batı Bulvarı (row = 7) harita kenarındaki bölgesel otoyola bağlanır
    if (row === 7 && (col === -1 || col === this.cols)) {
      return true;
    }
    const cell = this.getCell(row, col);
    return Boolean(cell && cell.occupied && cell.isRoad);
  }

  hasRoadAccess(row, col) {
    return this.isRoadAt(row - 1, col) ||
           this.isRoadAt(row + 1, col) ||
           this.isRoadAt(row, col - 1) ||
           this.isRoadAt(row, col + 1);
  }

  getRoadNeighbors(row, col) {
    return {
      N: this.isRoadAt(row - 1, col),
      S: this.isRoadAt(row + 1, col),
      W: this.isRoadAt(row, col - 1),
      E: this.isRoadAt(row, col + 1)
    };
  }

  // Binaların ön cephesini en yakın komşu yola döndürür (Cities: Skylines stili)
  getRoadFacingAngle(row, col) {
    if (this.isRoadAt(row + 1, col)) return 0; // Güneydeki yola bak
    if (this.isRoadAt(row, col + 1)) return Math.PI / 2; // Doğudaki yola bak
    if (this.isRoadAt(row - 1, col)) return Math.PI; // Kuzeydeki yola bak
    if (this.isRoadAt(row, col - 1)) return -Math.PI / 2; // Batıdaki yola bak
    return 0;
  }

  getRoadCells() {
    return this.cells.filter((c) => c.occupied && c.isRoad);
  }

  highlightCell(cell, mode = 'BUILD', bm = null, spec = null, budget = Infinity, rotationAngle = null) {
    if (!cell || mode === 'NONE' || !mode) {
      this.hoverMesh.visible = false;
      this.ghostGroup.visible = false;
      if (this.aoeAuraMesh) this.aoeAuraMesh.visible = false;
      return;
    }

    if (mode === 'BULLDOZE') {
      this.ghostGroup.visible = false;
      if (this.aoeAuraMesh) this.aoeAuraMesh.visible = false;
      this.hoverMat.color.setHex(cell.occupied ? 0xf43f5e : 0x64748b);
      this.hoverLineMat.color.setHex(cell.occupied ? 0xfda4af : 0x94a3b8);
      this.hoverMesh.position.set(cell.x, 0.42, cell.z);
      this.hoverMesh.visible = true;
    } else if (mode === 'INSPECT') {
      this.ghostGroup.visible = false;
      if (this.aoeAuraMesh) this.aoeAuraMesh.visible = false;
      this.hoverMat.color.setHex(0x0ea5e9);
      this.hoverLineMat.color.setHex(0x7dd3fc);
      this.hoverMesh.position.set(cell.x, 0.42, cell.z);
      this.hoverMesh.visible = true;
    } else {
      // BUILD modu
      const canUpgradeRoad = Boolean(cell.occupied && cell.isRoad && spec && (spec.isRoad || spec.id === 'drain_grate') && cell.buildingType !== spec.id);
      const canAfford = !spec || budget >= spec.cost;
      const isValid = (!cell.occupied || canUpgradeRoad) && canAfford;
      const hasAccess = spec && spec.isRoad ? true : this.hasRoadAccess(cell.row, cell.col);

      if (!isValid) {
        this.hoverMat.color.setHex(0xf43f5e);
        this.hoverLineMat.color.setHex(0xfda4af);
      } else if (canUpgradeRoad) {
        this.hoverMat.color.setHex(0x0ea5e9);
        this.hoverLineMat.color.setHex(0x7dd3fc);
      } else if (!hasAccess && !spec?.isRoad) {
        // Yola cephe yok uyarısı (Kehribar / Sarı renk)
        this.hoverMat.color.setHex(0xf59e0b);
        this.hoverLineMat.color.setHex(0xfbbf24);
      } else {
        this.hoverMat.color.setHex(0x10b981);
        this.hoverLineMat.color.setHex(0x34d399);
      }
      this.hoverMesh.position.set(cell.x, 0.42, cell.z);
      this.hoverMesh.visible = true;

      // v9.0 Mekansal Etki Alanı (AoE Aura) Göstergesi
      const aoeSpecs = {
        wind_corridor: { radius: 10.5, color: 0x38bdf8 },
        botanical_plaza: { radius: 7.5, color: 0x10b981 },
        sponge_park: { radius: 9.0, color: 0x0ea5e9 },
        cooling_tower: { radius: 12.0, color: 0x06b6d4 },
        drain_grate: { radius: 5.5, color: 0x0284c7 },
        coastal_pump: { radius: 8.5, color: 0x0284c7 },
        cistern: { radius: 11.0, color: 0x2563eb }
      };
      if (this.aoeAuraMesh && spec && aoeSpecs[spec.id]) {
        const cfg = aoeSpecs[spec.id];
        this.aoeAuraMesh.scale.set(cfg.radius, 1, cfg.radius);
        this.aoeMat.color.setHex(cfg.color);
        this.aoeLineMat.color.setHex(cfg.color);
        this.aoeAuraMesh.position.set(cell.x, 0.43, cell.z);
        this.aoeAuraMesh.visible = true;
      } else if (this.aoeAuraMesh) {
        this.aoeAuraMesh.visible = false;
      }

      // 3B Ghost / Hologram Önizlemesi
      if (bm && spec && (!cell.occupied || canUpgradeRoad)) {
        const n = this.getRoadNeighbors(cell.row, cell.col);
        const facing = typeof rotationAngle === 'number' ? rotationAngle : this.getRoadFacingAngle(cell.row, cell.col);
        const key = `${cell.row},${cell.col},${spec.id},${n.N ? 1 : 0}${n.S ? 1 : 0}${n.W ? 1 : 0}${n.E ? 1 : 0},${facing},${isValid ? 1 : 0},${hasAccess ? 1 : 0}`;
        if (key !== this.lastGhostKey) {
          while (this.ghostGroup.children.length > 0) {
            this.ghostGroup.remove(this.ghostGroup.children[0]);
          }
          const ghostMesh = bm.createGhostPreview(spec.id, {
            neighbors: n,
            row: cell.row,
            col: cell.col,
            variantSeed: cell.variantSeed,
            facingAngle: facing,
            isValid
          });
          if (ghostMesh) {
            ghostMesh.rotation.y = facing;
            this.ghostGroup.add(ghostMesh);
          }
          this.lastGhostKey = key;
        }
        this.ghostGroup.position.set(cell.x, 0.36, cell.z);
        this.ghostGroup.visible = true;
      } else {
        this.ghostGroup.visible = false;
      }
    }
  }

  invalidateGhost() {
    this.lastGhostKey = '';
  }

  clearHighlight() {
    this.hoverMesh.visible = false;
    this.ghostGroup.visible = false;
    if (this.aoeAuraMesh) this.aoeAuraMesh.visible = false;
  }

  setTutorialBeacon(cell, colorHex = 0x06b6d4) {
    if (!cell) {
      this.hideTutorialBeacon();
      return;
    }
    this.tutorialBeaconGroup.position.set(cell.x, 0.0, cell.z);
    this.tutorialBeaconGroup.visible = true;
    if (this.beaconCylMat) this.beaconCylMat.color.setHex(colorHex);
    if (this.beaconConeMat) this.beaconConeMat.color.setHex(colorHex);
    if (this.beaconRingMat) this.beaconRingMat.color.setHex(colorHex);
    if (this.beaconFrameMat) this.beaconFrameMat.color.setHex(colorHex);
  }

  hideTutorialBeacon() {
    if (this.tutorialBeaconGroup) {
      this.tutorialBeaconGroup.visible = false;
    }
  }

  updateTutorialBeacon(dt) {
    if (!this.tutorialBeaconGroup || !this.tutorialBeaconGroup.visible) return;
    const t = performance.now() * 0.0035;
    const bounce = Math.sin(t * 2.6) * 0.24;
    if (this.beaconCone) {
      this.beaconCone.position.y = 1.75 + bounce;
      this.beaconCone.rotation.y += dt * 2.2;
    }
    if (this.beaconCylinder) {
      this.beaconCylinder.position.y = 2.65 + bounce;
      this.beaconCylinder.rotation.y += dt * 2.2;
    }
    if (this.beaconRing) {
      const s = 0.72 + ((t * 0.75) % 1.0) * 0.65;
      this.beaconRing.scale.set(s, s, s);
      if (this.beaconRingMat) {
        this.beaconRingMat.opacity = Math.max(0.15, 0.85 * (1.0 - ((t * 0.75) % 1.0)));
      }
    }
  }

  reset() {
    this.cells.forEach((cell) => {
      if (cell.building) {
        if (cell.noRoadBadge) {
          cell.building.remove(cell.noRoadBadge);
          if (cell.noRoadBadge.material && cell.noRoadBadge.material.map) {
            cell.noRoadBadge.material.map.dispose();
          }
          if (cell.noRoadBadge.material) cell.noRoadBadge.material.dispose();
          cell.noRoadBadge = null;
        }
        this.scene.remove(cell.building);
      }
      cell.occupied = false;
      cell.isRoad = false;
      cell.building = null;
      cell.buildingType = null;
      cell.hasRoadAccess = false;
      cell.hasChimneyFilter = false;
      cell.hasRainHarvest = false;
      cell.hasSolarKit = false;
      cell.hasBioDrain = false;
      cell.hasWasteCompactor = false;
      cell.hasCustomRotation = false;
      cell.rotationAngle = 0;
      if (cell.emptyPadGroup) cell.emptyPadGroup.visible = true;
    });
    this.hoverMesh.visible = false;
    this.ghostGroup.visible = false;
    this.lastGhostKey = '';
  }
}
