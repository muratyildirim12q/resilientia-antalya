import * as THREE from 'three';

export class GridManager {
  constructor(scene, size = 12) {
    this.scene = scene;
    this.size = size; // 12x12 Şehir İmar Izgarası
    this.spacing = 3.0; // Kenney 1x1 karolarının 3x ölçeği ile %100 sıfır boşluklu uyum
    this.cells = [];
    this.cellMap = new Map();
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.hoverMesh = null;
    this.hoverWireframe = null;
    this.ghostGroup = new THREE.Group();
    this.ghostGroup.visible = false;
    this.lastGhostKey = '';
    this.group.add(this.ghostGroup);
    this.zoningOverlayGroup = new THREE.Group();
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

    const offset = ((this.size - 1) * this.spacing) / 2; // 16.5

    // 2. Hafif İmar Kılavuz Çizgileri (Sadece İnşaat Modu Açıkken Hafifçe Görünür)
    const gridTotal = this.size * this.spacing;
    const gridHelper = new THREE.GridHelper(gridTotal, this.size, 0xffffff, 0xffffff);
    gridHelper.position.set(0, 0.37, 0);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.11;
    gridHelper.material.depthWrite = false;
    this.zoningOverlayGroup.add(gridHelper);

    // 3. Parsel Hücreleri ve Raycast Düzlemleri
    const hitGeom = new THREE.PlaneGeometry(this.spacing, this.spacing);
    hitGeom.rotateX(-Math.PI / 2);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const x = c * this.spacing - offset;
        const z = r * this.spacing - offset;

        const hitPlane = new THREE.Mesh(hitGeom, hitMat);
        hitPlane.position.set(x, 0.38, z);
        this.group.add(hitPlane);

        const cell = {
          row: r,
          col: c,
          x,
          z,
          hitMesh: hitPlane,
          occupied: false,
          isRoad: false,
          building: null,
          buildingType: null,
          variantSeed: (r * 7 + c * 13) % 12
        };

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
    return this.cells.find((cell) => cell.hitMesh === intersectedMesh) || null;
  }

  isRoadAt(row, col) {
    // Ana Doğu-Batı Bulvarı (row = 6) harita kenarındaki bölgesel otoyola bağlanır
    if (row === 6 && (col === -1 || col === this.size)) {
      return true;
    }
    const cell = this.getCell(row, col);
    return Boolean(cell && cell.occupied && cell.isRoad);
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

  highlightCell(cell, mode = 'BUILD', bm = null, spec = null, budget = Infinity) {
    if (!cell) {
      this.hoverMesh.visible = false;
      this.ghostGroup.visible = false;
      return;
    }

    if (mode === 'BULLDOZE') {
      this.ghostGroup.visible = false;
      this.hoverMat.color.setHex(cell.occupied ? 0xf43f5e : 0x64748b);
      this.hoverLineMat.color.setHex(cell.occupied ? 0xfda4af : 0x94a3b8);
      this.hoverMesh.position.set(cell.x, 0.42, cell.z);
      this.hoverMesh.visible = true;
    } else if (mode === 'INSPECT') {
      this.ghostGroup.visible = false;
      this.hoverMat.color.setHex(0x0ea5e9);
      this.hoverLineMat.color.setHex(0x7dd3fc);
      this.hoverMesh.position.set(cell.x, 0.42, cell.z);
      this.hoverMesh.visible = true;
    } else {
      // BUILD modu
      const canUpgradeRoad = Boolean(cell.occupied && cell.isRoad && spec && spec.isRoad && cell.buildingType !== spec.id);
      const canAfford = !spec || budget >= spec.cost;
      const isValid = (!cell.occupied || canUpgradeRoad) && canAfford;

      if (!isValid) {
        this.hoverMat.color.setHex(0xf43f5e);
        this.hoverLineMat.color.setHex(0xfda4af);
      } else if (canUpgradeRoad) {
        this.hoverMat.color.setHex(0x0ea5e9);
        this.hoverLineMat.color.setHex(0x7dd3fc);
      } else {
        this.hoverMat.color.setHex(0x10b981);
        this.hoverLineMat.color.setHex(0x34d399);
      }
      this.hoverMesh.position.set(cell.x, 0.42, cell.z);
      this.hoverMesh.visible = true;

      // 3B Ghost / Hologram Önizlemesi
      if (bm && spec && (!cell.occupied || canUpgradeRoad)) {
        const n = this.getRoadNeighbors(cell.row, cell.col);
        const facing = this.getRoadFacingAngle(cell.row, cell.col);
        const key = `${cell.row},${cell.col},${spec.id},${n.N ? 1 : 0}${n.S ? 1 : 0}${n.W ? 1 : 0}${n.E ? 1 : 0},${facing},${isValid ? 1 : 0}`;
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
  }

  reset() {
    this.cells.forEach((cell) => {
      if (cell.building) {
        this.scene.remove(cell.building);
      }
      cell.occupied = false;
      cell.isRoad = false;
      cell.building = null;
      cell.buildingType = null;
    });
    this.hoverMesh.visible = false;
    this.ghostGroup.visible = false;
    this.lastGhostKey = '';
  }
}
