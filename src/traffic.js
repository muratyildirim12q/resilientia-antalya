import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class TrafficSystem {
  constructor(scene, grid) {
    this.scene = scene;
    this.grid = grid;
    this.loader = new GLTFLoader();
    this.vehicles = [];
    this.trams = [];

    this.carPrototypes = [];
    this.basePopulation = 360;

    this.loadVehicles();
    this.loadTrams();
  }

  loadVehicles() {
    this.carModels.forEach((filename, idx) => {
      this.loader.load(`./assets/${filename}`, (gltf) => {
        const root = gltf.scene;
        root.scale.set(0.42, 0.42, 0.42);
        root.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.material && c.material.map) {
              c.material.map.colorSpace = THREE.SRGBColorSpace;
            }
          }
        });

        this.carPrototypes.push(root);

        // Başlangıç araç filosu (8 araç)
        if (this.vehicles.length < 8) {
          const clone = root.clone();
          this.scene.add(clone);
          const vehicle = {
            mesh: clone,
            currCell: null,
            nextCell: null,
            prevCell: null,
            progress: (idx * 0.17) % 1.0,
            speed: 1.25 + (idx % 4) * 0.18,
            targetYaw: 0
          };
          this.assignRandomRoad(vehicle, idx);
          this.vehicles.push(vehicle);
        }
      });
    });
  }

  // Nüfus Artışına Göre Dinamik Araç Trafiği Simülasyonu
  // (Nüfus her 2 katına çıktığında caddelerdeki aktif araç sayısı artar)
  syncPopulation(population) {
    if (!this.carPrototypes || this.carPrototypes.length === 0) return;

    const pop = Math.max(100, Number(population) || 360);
    const factor = pop / this.basePopulation;
    // Nüfus 2 katına çıktığında ~14, 4 katına çıktığında ~22, 8 katına çıktığında ~32 araç
    const targetCount = Math.min(36, Math.max(8, Math.round(8 * Math.pow(factor, 0.72))));

    // Gerekli ise yeni araçlar spawn et
    while (this.vehicles.length < targetCount) {
      const proto = this.carPrototypes[this.vehicles.length % this.carPrototypes.length];
      const clone = proto.clone();
      this.scene.add(clone);
      const vehicle = {
        mesh: clone,
        currCell: null,
        nextCell: null,
        prevCell: null,
        progress: (this.vehicles.length * 0.23) % 1.0,
        speed: 1.2 + (this.vehicles.length % 5) * 0.16,
        targetYaw: 0
      };
      this.assignRandomRoad(vehicle, this.vehicles.length);
      this.vehicles.push(vehicle);
    }

    // Nüfus düşerse fazla araçları nazikçe kaldır
    while (this.vehicles.length > targetCount && this.vehicles.length > 8) {
      const removed = this.vehicles.pop();
      if (removed && removed.mesh) {
        this.scene.remove(removed.mesh);
      }
    }
  }

  loadTrams() {
    [0, 1].forEach((idx) => {
      this.loader.load('./assets/train/train-tram-modern.glb', (gltf) => {
        const root = gltf.scene;
        root.scale.set(0.62, 0.62, 0.62);
        root.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.material && c.material.map) {
              c.material.map.colorSpace = THREE.SRGBColorSpace;
            }
          }
        });
        root.visible = false;
        this.scene.add(root);

        const tram = {
          mesh: root,
          currCell: null,
          nextCell: null,
          prevCell: null,
          progress: (idx * 0.5) % 1.0,
          speed: 1.05
        };
        this.assignRandomTramCell(tram, idx);
        this.trams.push(tram);
      });
    });
  }

  getConnectedRoadNeighbors(cell, onlyTram = false) {
    if (!cell || !this.grid) return [];
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ];
    const list = [];
    for (const [dr, dc] of dirs) {
      const n = this.grid.getCell(cell.row + dr, cell.col + dc);
      if (n && n.occupied && n.isRoad && (!onlyTram || n.buildingType === 'solar_tram')) {
        list.push(n);
      }
    }
    return list;
  }

  assignRandomRoad(v, seed = 0) {
    if (!this.grid) return;
    const roadCells = this.grid.getRoadCells();
    if (roadCells.length === 0) {
      v.mesh.visible = false;
      v.currCell = null;
      v.nextCell = null;
      return;
    }

    const startCell = roadCells[(seed * 5 + Math.floor(Math.random() * roadCells.length)) % roadCells.length];
    const neighbors = this.getConnectedRoadNeighbors(startCell);
    v.currCell = startCell;
    v.prevCell = null;
    v.nextCell = neighbors.length > 0 ? neighbors[Math.floor(Math.random() * neighbors.length)] : startCell;
    v.progress = 0;
    v.mesh.visible = true;
    v.mesh.position.set(startCell.x, 0.382, startCell.z);
  }

  assignRandomTramCell(t, seed = 0) {
    if (!this.grid) return;
    const tramCells = this.grid.getRoadCells().filter((c) => c.buildingType === 'solar_tram');
    if (tramCells.length === 0) {
      t.mesh.visible = false;
      t.currCell = null;
      t.nextCell = null;
      return;
    }

    const startCell = tramCells[seed % tramCells.length];
    const neighbors = this.getConnectedRoadNeighbors(startCell, true);
    t.currCell = startCell;
    t.prevCell = null;
    t.nextCell = neighbors.length > 0 ? neighbors[0] : startCell;
    t.progress = 0;
    t.mesh.visible = true;
    t.mesh.position.set(startCell.x, 0.396, startCell.z);
  }

  update(dt) {
    if (!this.grid) return;

    this.vehicles.forEach((v, idx) => {
      if (
        !v.currCell ||
        !v.currCell.occupied ||
        !v.currCell.isRoad ||
        !v.nextCell ||
        !v.nextCell.occupied ||
        !v.nextCell.isRoad
      ) {
        this.assignRandomRoad(v, idx);
        return;
      }

      if (v.currCell === v.nextCell) {
        const neighbors = this.getConnectedRoadNeighbors(v.currCell);
        if (neighbors.length > 0) {
          v.nextCell = neighbors[0];
        } else {
          v.mesh.position.set(v.currCell.x, 0.382, v.currCell.z);
          return;
        }
      }

      v.progress += v.speed * dt;

      if (v.progress >= 1.0) {
        v.progress -= 1.0;
        v.prevCell = v.currCell;
        v.currCell = v.nextCell;

        const neighbors = this.getConnectedRoadNeighbors(v.currCell);
        if (neighbors.length === 0) {
          v.nextCell = v.currCell;
        } else if (neighbors.length === 1) {
          v.nextCell = neighbors[0];
        } else {
          const forwardChoices = neighbors.filter((n) => n !== v.prevCell);
          v.nextCell = forwardChoices[Math.floor(Math.random() * forwardChoices.length)];
        }
      }

      const dx = v.nextCell.x - v.currCell.x;
      const dz = v.nextCell.z - v.currCell.z;
      const len = Math.hypot(dx, dz) || 1;
      const ux = dx / len;
      const uz = dz / len;

      // Sağ şerit vektörü: (-uz, ux)
      const laneOffset = 0.42;
      const rx = -uz * laneOffset;
      const rz = ux * laneOffset;

      const px = THREE.MathUtils.lerp(v.currCell.x, v.nextCell.x, v.progress) + rx;
      const pz = THREE.MathUtils.lerp(v.currCell.z, v.nextCell.z, v.progress) + rz;

      v.mesh.position.set(px, 0.382, pz);

      if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        const targetAngle = Math.atan2(ux, uz);
        let diff = targetAngle - v.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        v.mesh.rotation.y += diff * Math.min(1, dt * 12);
      }
    });

    // Güneş Tramvayı araçlarını solar_tram hatları üzerinde hareket ettir
    this.trams.forEach((t, idx) => {
      if (
        !t.currCell ||
        !t.currCell.occupied ||
        t.currCell.buildingType !== 'solar_tram' ||
        !t.nextCell ||
        !t.nextCell.occupied ||
        t.nextCell.buildingType !== 'solar_tram'
      ) {
        this.assignRandomTramCell(t, idx);
        return;
      }

      if (t.currCell === t.nextCell) {
        const neighbors = this.getConnectedRoadNeighbors(t.currCell, true);
        if (neighbors.length > 0) {
          t.nextCell = neighbors[0];
        } else {
          t.mesh.position.set(t.currCell.x, 0.396, t.currCell.z);
          return;
        }
      }

      t.progress += t.speed * dt;
      if (t.progress >= 1.0) {
        t.progress -= 1.0;
        t.prevCell = t.currCell;
        t.currCell = t.nextCell;

        const neighbors = this.getConnectedRoadNeighbors(t.currCell, true);
        if (neighbors.length === 0) {
          t.nextCell = t.currCell;
        } else if (neighbors.length === 1) {
          t.nextCell = neighbors[0];
        } else {
          const forwardChoices = neighbors.filter((n) => n !== t.prevCell);
          t.nextCell = forwardChoices[Math.floor(Math.random() * forwardChoices.length)];
        }
      }

      const dx = t.nextCell.x - t.currCell.x;
      const dz = t.nextCell.z - t.currCell.z;
      const len = Math.hypot(dx, dz) || 1;
      const ux = dx / len;
      const uz = dz / len;

      const px = THREE.MathUtils.lerp(t.currCell.x, t.nextCell.x, t.progress);
      const pz = THREE.MathUtils.lerp(t.currCell.z, t.nextCell.z, t.progress);
      t.mesh.position.set(px, 0.396, pz);

      if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        const targetAngle = Math.atan2(ux, uz);
        let diff = targetAngle - t.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        t.mesh.rotation.y += diff * Math.min(1, dt * 10);
      }
    });
  }
}
