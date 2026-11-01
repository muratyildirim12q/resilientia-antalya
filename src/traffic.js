import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BUILDINGS_CATALOG } from './buildings.js';

export class TrafficSystem {
  constructor(scene, grid) {
    this.scene = scene;
    this.grid = grid;
    this.loader = new GLTFLoader();
    this.vehicles = [];
    this.trams = [];

    // Fosil yakıtlı araç egzoz dumanı grubu
    this.exhaustParticles = [];
    this.exhaustGroup = new THREE.Group();
    if (this.scene && this.scene.add) {
      this.scene.add(this.exhaustGroup);
    }
    this.exhaustGeom = new THREE.DodecahedronGeometry(0.08, 0);
    this.exhaustMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });

    // 11 çeşit gerçekçi Akdeniz şehri taşıt filosu
    this.carModels = [
      'car/sedan.glb',
      'car/taxi.glb',
      'car/sedan-sports.glb',
      'car/suv.glb',
      'car/van.glb',
      'car/police.glb',
      'car/ambulance.glb',
      'vehicle-truck-green.glb',
      'vehicle-truck-yellow.glb',
      'vehicle-truck-red.glb',
      'vehicle-truck-purple.glb'
    ];

    this.carPrototypes = [];
    this.basePopulation = 550; // Başlangıç şehir nüfusu

    this.loadVehicles();
    this.loadTrams();
    this.crowd = new CrowdSystem(scene, grid);
  }

  // Taşıt Su Sıçratma Sprey Konileri & Dörtlü Flaşör Işık Grubu
  setupVehicleFx(vehicle) {
    if (!vehicle || !vehicle.mesh || vehicle.splashSprayGroup) return;

    // 1. Su Sıçratma Sprey Konileri (Splash Spray)
    const splashGroup = new THREE.Group();
    splashGroup.name = 'Splash Spray';
    splashGroup.visible = false;

    const sprayMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });

    const sprayGeom = new THREE.ConeGeometry(0.18, 0.42, 6);
    sprayGeom.rotateX(Math.PI / 2.3);

    const wheelOffsets = [
      { x: -0.32, z: 0.38, rotY: 0.25 },   // Ön Sol Tekerlek
      { x: 0.32, z: 0.38, rotY: -0.25 },  // Ön Sağ Tekerlek
      { x: -0.32, z: -0.38, rotY: 0.25 },  // Arka Sol Tekerlek
      { x: 0.32, z: -0.38, rotY: -0.25 }   // Arka Sağ Tekerlek
    ];

    wheelOffsets.forEach((wo) => {
      const spray = new THREE.Mesh(sprayGeom, sprayMat);
      spray.name = 'Splash Spray';
      spray.position.set(wo.x, 0.05, wo.z);
      spray.rotation.y = wo.rotY;
      splashGroup.add(spray);
    });

    vehicle.mesh.add(splashGroup);
    vehicle.splashSprayGroup = splashGroup;

    // 2. Dörtlü Flaşörler (Hazard Blinkers)
    const hazardGroup = new THREE.Group();
    hazardGroup.name = 'Hazard Blinkers';
    const hazardMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.0
    });
    const blinkerGeom = new THREE.SphereGeometry(0.045, 6, 6);

    const corners = [
      { x: -0.32, y: 0.22, z: 0.52 }, // Ön Sol
      { x: 0.32, y: 0.22, z: 0.52 },  // Ön Sağ
      { x: -0.32, y: 0.24, z: -0.52 }, // Arka Sol
      { x: 0.32, y: 0.24, z: -0.52 }  // Arka Sağ
    ];

    corners.forEach((c) => {
      const b = new THREE.Mesh(blinkerGeom, hazardMat);
      b.position.set(c.x, c.y, c.z);
      hazardGroup.add(b);
    });

    vehicle.mesh.add(hazardGroup);
    vehicle.hazardGroup = hazardGroup;
    vehicle.hazardMat = hazardMat;
  }

  loadVehicles() {
    this.carModels.forEach((filename, idx) => {
      this.loader.load(`./assets/${filename}`, (gltf) => {
        const root = gltf.scene;
        // Kamyonlar ve binek araçlar için uygun ölçek
        const isTruck = filename.includes('truck');
        const s = isTruck ? 0.38 : 0.42;
        root.scale.set(s, s, s);
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
          this.setupVehicleFx(vehicle);
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

    const pop = Math.max(100, Number(population) || 550);
    const factor = pop / this.basePopulation;
    // Nüfus 1x -> 8 araç, 2x (~1100) -> 14 araç, 4x (~2200) -> 23 araç, 8x (~4400) -> 36 araç
    const targetCount = Math.min(40, Math.max(8, Math.round(8 * Math.pow(factor, 0.72))));

    // Gerekli ise yeni araçlar spawn et
    while (this.vehicles.length < targetCount && this.carPrototypes.length > 0) {
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
      this.setupVehicleFx(vehicle);
      this.assignRandomRoad(vehicle, this.vehicles.length);
      this.vehicles.push(vehicle);
    }

    // Nüfus düşerse fazla araçları kaldır
    while (this.vehicles.length > targetCount && this.vehicles.length > 8) {
      const removed = this.vehicles.pop();
      if (removed && removed.mesh) {
        this.scene.remove(removed.mesh);
      }
    }

    if (this.crowd) {
      this.crowd.syncPopulation(pop);
    }
  }

  loadTrams() {
    [0, 1].forEach((idx) => {
      this.loader.load('./assets/train-tram-modern.glb', (gltf) => {
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
    // Asfalt yüzeyi: zemin 0.36 + karo 0.075 = 0.435
    v.mesh.position.set(startCell.x, 0.435, startCell.z);
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
    // Ray yüksekliği: 0.66
    t.mesh.position.set(startCell.x, 0.66, startCell.z);
  }

  // Afet Koşullarında Araç Hız Katsayısı:
  // - 45°C Sıcak Dalgası: Korunmasız asfalt yumuşar, araç trafiği %50 yavaşlar.
  // - Şiddetli Sağanak & Sel: Su direnci ve görüş kısıtı nedeniyle araçlar %55 yavaşlar.
  // - Eko-Cadde (permeable_road) ve solar tram hatlarında su emildiği için akış hızlıdır (%75).
  getVehicleEffectiveSpeed(cell, disasterType, baseSpeed = 1.0) {
    if (disasterType === 'HEATWAVE' && cell && cell.buildingType === 'road') {
      return baseSpeed * 0.5;
    }
    if (disasterType === 'FLOOD') {
      if (cell && cell.buildingType === 'permeable_road') {
        return baseSpeed * 0.75;
      }
      return baseSpeed * 0.45;
    }
    return baseSpeed;
  }

  // Fosil yakıtlı araç egzoz dumanı parçacığı üretici (Güneş tramvayı ve bisikletlilerde duman çıkmaz)
  spawnExhaust(x = 0, y = 0.45, z = 0, vehicleType = 'fossil', ux = 0, uz = 0) {
    if (vehicleType === 'tram' || vehicleType === 'cyclist') {
      return null;
    }
    if (!this.exhaustGroup) return null;
    if (this.exhaustParticles.length >= 60) return null;

    const pMesh = new THREE.Mesh(this.exhaustGeom, this.exhaustMat.clone());
    pMesh.position.set(x, y, z);
    const scale = 0.6 + Math.random() * 0.4;
    pMesh.scale.set(scale, scale, scale);
    this.exhaustGroup.add(pMesh);
    const particle = {
      mesh: pMesh,
      life: 0,
      maxLife: 0.55 + Math.random() * 0.35,
      vx: -ux * 0.2 + (Math.random() - 0.5) * 0.1,
      vz: -uz * 0.2 + (Math.random() - 0.5) * 0.1
    };
    this.exhaustParticles.push(particle);
    return particle;
  }

  update(dt, game) {
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
          v.mesh.position.set(v.currCell.x, 0.435, v.currCell.z);
          return;
        }
      }

      // 45°C Sıcak Dalgası: Korunmasız asfalt yumuşar, araç trafiği %50 yavaşlar.
      // Eko-Cadde (permeable_road) ve yeşil bulvarlarda (boulevard) yavaşlama olmaz.
      const disasterType = (game && game.crisisPhase === 'ACTIVE') ? game.currentDisaster : null;
      let currentSpeed = this.getVehicleEffectiveSpeed(v.currCell, disasterType, v.speed);

      // Şiddetli Sağanak & Sel Su Etkileşimi (Splash Spray, Beşik Salınımı & Dörtlü Flaşörler)
      if (!v.splashSprayGroup) {
        this.setupVehicleFx(v);
      }

      const isFlood = Boolean(game && (
        (game.crisisPhase === 'ACTIVE' && game.currentDisaster === 'FLOOD') ||
        (game.crisisPhase === 'WARNING' && game.currentDisaster === 'FLOOD' && game.crisisTimer <= 4.0)
      ));
      const waterY = (game && game.disasters && game.disasters.waterMesh) ? game.disasters.waterMesh.position.y : 0.42;
      const waterDepth = (isFlood && waterY > 0.435) ? (waterY - 0.435) : 0;
      const t = performance.now() * 0.001;

      if (isFlood) {
        // Su içinde ilerleme: Sıçratma sprey konisi aktif
        if (v.splashSprayGroup) {
          v.splashSprayGroup.visible = true;
          const sprayScale = 0.8 + Math.sin(t * 14.0 + idx) * 0.3;
          v.splashSprayGroup.scale.set(sprayScale, sprayScale, sprayScale);
        }

        // Araç su içinde beşik gibi sağa-sola ve öne-arkaya yalpalar (Cradle Rocking)
        const rockZ = Math.sin(t * 7.5 + idx * 1.5) * Math.min(0.08, Math.max(0.02, waterDepth * 0.8));
        const rockX = Math.cos(t * 6.0 + idx * 1.2) * Math.min(0.06, Math.max(0.015, waterDepth * 0.5));
        v.mesh.rotation.z = rockZ;
        v.mesh.rotation.x = rockX;

        // v11.0 Sel Felaketinde Gerçekçi Araç Kaosu & Zincirleme Trafik Kilitlenmesi:
        // Derin suda (waterDepth >= 0.045) motor su alır, araç stop eder (isStalled = true), arkadan gelenler duramayarak
        // birbirine girer, çapraz açılarla yolda yamulur ve dörtlü flaşörleri panikle yanıp söner.
        if (waterDepth >= 0.045) {
          v.isStalled = true;
          currentSpeed = 0; // Araç kilitlenir ve durur
          if (v.hazardMat) {
            v.hazardTimer = (v.hazardTimer || 0) + dt;
            const isFlash = (v.hazardTimer % 0.45) < 0.25;
            v.hazardMat.opacity = isFlash ? 0.95 : 0.0;
          }
        } else {
          v.isStalled = false;
          // Sel suyu derinliğine göre kademeli yavaşlama (Normal ilerleme tamamen engellendi)
          if (waterDepth >= 0.025) {
            currentSpeed *= 0.25; // Göllenmiş yolda yavaş sürünme
          } else if (waterDepth >= 0.005) {
            currentSpeed *= 0.40; // Su birikintisinde temkinli sürüş
          } else {
            currentSpeed *= 0.60; // Islak asfalt sağanak frenlemesi
          }

          // Sel ve yağmur altında araçlar dörtlü flaşörlerini yakarak ilerler
          if (v.hazardMat) {
            v.hazardTimer = (v.hazardTimer || 0) + dt;
            const isFlash = (v.hazardTimer % 0.7) < 0.38;
            v.hazardMat.opacity = isFlash ? 0.95 : 0.0;
          }
        }
      } else {
        v.isStalled = false;
        if (v.splashSprayGroup) v.splashSprayGroup.visible = false;
        if (v.hazardMat) v.hazardMat.opacity = 0.0;
        v.mesh.rotation.z = THREE.MathUtils.lerp(v.mesh.rotation.z, 0, dt * 6.0);
        v.mesh.rotation.x = THREE.MathUtils.lerp(v.mesh.rotation.x, 0, dt * 6.0);
      }

      v.progress += currentSpeed * dt;

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
          v.nextCell = forwardChoices.length > 0
            ? forwardChoices[Math.floor(Math.random() * forwardChoices.length)]
            : neighbors[0];
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

      const bobY = waterDepth > 0.008
        ? (0.435 + Math.min(0.04, waterDepth * 0.3) + Math.sin(t * 6.0 + idx) * 0.006)
        : 0.435;
      v.mesh.position.set(px, bobY, pz);

      // Selde stop etmiş araçlar birbirine çarparak hafif çapraz açılarla yamulur
      if (v.isStalled) {
        const skewAngle = Math.sin(idx * 2.3 + 1.2) * 0.35;
        const targetSkew = Math.atan2(ux, uz) + skewAngle;
        let diff = targetSkew - v.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        v.mesh.rotation.y += diff * Math.min(1, dt * 8);
      } else if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        const targetAngle = Math.atan2(ux, uz);
        let diff = targetAngle - v.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        v.mesh.rotation.y += diff * Math.min(1, dt * 12);
      }

      // Fosil yakıtlı araç egzoz dumanı parçacığı
      if (this.exhaustGroup && dt > 0) {
        v.exhaustTimer = (v.exhaustTimer || 0) + dt;
        const exhaustInterval = Math.max(0.06, 0.22 - currentSpeed * 0.08);
        if (v.exhaustTimer >= exhaustInterval) {
          v.exhaustTimer = 0;
          const rearX = px - ux * 0.42;
          const rearZ = pz - uz * 0.42;
          this.spawnExhaust(rearX, 0.45, rearZ, 'fossil', ux, uz);
        }
      }
    });

    // Egzoz dumanı parçacıklarını güncelle ve sönümle
    if (this.exhaustParticles && this.exhaustParticles.length > 0) {
      for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
        const ep = this.exhaustParticles[i];
        ep.life += dt;
        ep.mesh.position.y += dt * 0.28;
        ep.mesh.position.x += ep.vx * dt;
        ep.mesh.position.z += ep.vz * dt;
        const prog = ep.life / ep.maxLife;
        const s = 1.0 + prog * 2.2;
        ep.mesh.scale.set(s, s, s);
        if (ep.mesh.material) {
          ep.mesh.material.opacity = Math.max(0, (1.0 - prog) * 0.35);
        }
        if (ep.life >= ep.maxLife) {
          this.exhaustGroup.remove(ep.mesh);
          this.exhaustParticles.splice(i, 1);
        }
      }
    }

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
          t.mesh.position.set(t.currCell.x, 0.66, t.currCell.z);
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
          t.nextCell = forwardChoices.length > 0
            ? forwardChoices[Math.floor(Math.random() * forwardChoices.length)]
            : neighbors[0];
        }
      }

      const dx = t.nextCell.x - t.currCell.x;
      const dz = t.nextCell.z - t.currCell.z;
      const len = Math.hypot(dx, dz) || 1;
      const ux = dx / len;
      const uz = dz / len;

      const px = THREE.MathUtils.lerp(t.currCell.x, t.nextCell.x, t.progress);
      const pz = THREE.MathUtils.lerp(t.currCell.z, t.nextCell.z, t.progress);
      t.mesh.position.set(px, 0.66, pz);

      if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        const targetAngle = Math.atan2(ux, uz);
        let diff = targetAngle - t.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        t.mesh.rotation.y += diff * Math.min(1, dt * 10);
      }
    });

    if (this.crowd) {
      this.crowd.update(dt, game);
    }
  }
}

// 2. Akdeniz Şehri Kaldırım Yayaları ve Bisikletlileri (Crowd Simulation)
export class CrowdSystem {
  constructor(scene, grid) {
    this.scene = scene;
    this.grid = grid;
    this.pedestrians = [];
    this.cyclists = [];

    this.skinColors = [0xfcd34d, 0xf59e0b, 0xd97706, 0xfed7aa];
    this.shirtColors = [0x06b6d4, 0xf43f5e, 0xfacc15, 0x10b981, 0x8b5cf6, 0xf97316, 0x38bdf8];
    this.pantsColors = [0x1e3a8a, 0x334155, 0x0f172a, 0x78350f, 0x475569];
    this.hairColors = [0x1e293b, 0x78350f, 0xb45309, 0xd97706, 0x0284c7];

    this.sharedGeom = {
      head: new THREE.BoxGeometry(0.12, 0.12, 0.12),
      hair: new THREE.BoxGeometry(0.13, 0.06, 0.13),
      torso: new THREE.BoxGeometry(0.18, 0.22, 0.12),
      leg: new THREE.BoxGeometry(0.06, 0.22, 0.06),
      arm: new THREE.BoxGeometry(0.045, 0.18, 0.045),
      wheel: new THREE.CylinderGeometry(0.12, 0.12, 0.03, 10),
      bikeFrame: new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6),
      handlebar: new THREE.BoxGeometry(0.22, 0.02, 0.02)
    };
    this.sharedGeom.wheel.rotateZ(Math.PI / 2);

    this.beachGoers = [];
    this.beachGroup = new THREE.Group();
    this.scene.add(this.beachGroup);
    this.ball = null;
    this.ballTime = 0;
    this.parasols = [];
    this.setupFootSplashSystem();

    this.initCrowd();
    this.setupBeachCrowd();
  }

  setupFootSplashSystem() {
    this.footSplashGroup = new THREE.Group();
    if (this.scene && this.scene.add) {
      this.scene.add(this.footSplashGroup);
    }
    this.footSplashes = [];
    this.splashDropGeom = new THREE.SphereGeometry(0.035, 4, 4);
    this.splashDropMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
  }

  spawnFootSplash(x, y, z) {
    if (!this.footSplashGroup) return;
    if (this.footSplashes.length >= 45) return;
    const mesh = new THREE.Mesh(this.splashDropGeom, this.splashDropMat);
    mesh.position.set(x + (Math.random() - 0.5) * 0.1, y, z + (Math.random() - 0.5) * 0.1);
    this.footSplashGroup.add(mesh);
    this.footSplashes.push({
      mesh,
      life: 0,
      maxLife: 0.32,
      vy: 0.65 + Math.random() * 0.45,
      vx: (Math.random() - 0.5) * 0.35,
      vz: (Math.random() - 0.5) * 0.35
    });
  }

  updateFootSplashes(dt) {
    if (!this.footSplashes || !this.footSplashGroup) return;
    for (let i = this.footSplashes.length - 1; i >= 0; i--) {
      const sp = this.footSplashes[i];
      sp.life += dt;
      sp.mesh.position.x += sp.vx * dt;
      sp.mesh.position.y += sp.vy * dt;
      sp.vy -= 9.8 * 0.35 * dt;
      sp.mesh.position.z += sp.vz * dt;
      if (sp.life >= sp.maxLife) {
        this.footSplashGroup.remove(sp.mesh);
        this.footSplashes.splice(i, 1);
      }
    }
  }

  createPedestrianMesh() {
    const group = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({
      color: this.skinColors[Math.floor(Math.random() * this.skinColors.length)],
      roughness: 0.8
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: this.shirtColors[Math.floor(Math.random() * this.shirtColors.length)],
      roughness: 0.65
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: this.pantsColors[Math.floor(Math.random() * this.pantsColors.length)],
      roughness: 0.85
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: this.hairColors[Math.floor(Math.random() * this.hairColors.length)],
      roughness: 0.9
    });

    const torso = new THREE.Mesh(this.sharedGeom.torso, shirtMat);
    torso.position.y = 0.32;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(this.sharedGeom.head, skinMat);
    head.position.y = 0.49;
    head.castShadow = true;
    group.add(head);

    const hair = new THREE.Mesh(this.sharedGeom.hair, hairMat);
    hair.position.y = 0.54;
    group.add(hair);

    const legLGroup = new THREE.Group();
    legLGroup.position.set(-0.05, 0.22, 0);
    const legL = new THREE.Mesh(this.sharedGeom.leg, pantsMat);
    legL.position.y = -0.11;
    legL.castShadow = true;
    legLGroup.add(legL);
    group.add(legLGroup);

    const legRGroup = new THREE.Group();
    legRGroup.position.set(0.05, 0.22, 0);
    const legR = new THREE.Mesh(this.sharedGeom.leg, pantsMat);
    legR.position.y = -0.11;
    legR.castShadow = true;
    legRGroup.add(legR);
    group.add(legRGroup);

    const armLGroup = new THREE.Group();
    armLGroup.position.set(-0.11, 0.40, 0);
    const armL = new THREE.Mesh(this.sharedGeom.arm, shirtMat);
    armL.position.y = -0.09;
    armLGroup.add(armL);
    group.add(armLGroup);

    const armRGroup = new THREE.Group();
    armRGroup.position.set(0.11, 0.40, 0);
    const armR = new THREE.Mesh(this.sharedGeom.arm, shirtMat);
    armR.position.y = -0.09;
    armRGroup.add(armR);
    group.add(armRGroup);

    return {
      group,
      legL: legLGroup,
      legR: legRGroup,
      armL: armLGroup,
      armR: armRGroup
    };
  }

  createCyclistMesh() {
    const group = new THREE.Group();

    const bikeMat = new THREE.MeshStandardMaterial({
      color: this.shirtColors[Math.floor(Math.random() * this.shirtColors.length)],
      metalness: 0.6,
      roughness: 0.3
    });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });

    const wheelFront = new THREE.Mesh(this.sharedGeom.wheel, tireMat);
    wheelFront.position.set(0, 0.12, 0.26);
    wheelFront.castShadow = true;
    group.add(wheelFront);

    const wheelBack = new THREE.Mesh(this.sharedGeom.wheel, tireMat);
    wheelBack.position.set(0, 0.12, -0.26);
    wheelBack.castShadow = true;
    group.add(wheelBack);

    const frame = new THREE.Mesh(this.sharedGeom.bikeFrame, bikeMat);
    frame.position.set(0, 0.20, 0);
    frame.rotation.x = Math.PI / 4;
    group.add(frame);

    const frame2 = new THREE.Mesh(this.sharedGeom.bikeFrame, bikeMat);
    frame2.position.set(0, 0.20, 0);
    frame2.rotation.x = -Math.PI / 4;
    group.add(frame2);

    const handlebar = new THREE.Mesh(this.sharedGeom.handlebar, chromeMat);
    handlebar.position.set(0, 0.34, 0.22);
    group.add(handlebar);

    const rider = this.createPedestrianMesh();
    rider.group.position.set(0, 0.12, -0.06);
    rider.group.rotation.x = 0.18;
    rider.legL.rotation.x = 0.6;
    rider.legR.rotation.x = -0.6;
    rider.armL.rotation.x = -0.7;
    rider.armR.rotation.x = -0.7;
    group.add(rider.group);

    return {
      group,
      rider,
      wheelFront,
      wheelBack
    };
  }

  // En Yakın Yol Hücresi Bulucu
  findNearestRoadCell(x, z) {
    if (!this.grid || !this.grid.cells) return null;
    let best = null;
    let minDist = Infinity;
    for (const cell of this.grid.cells) {
      if (cell.occupied && cell.isRoad) {
        const dist = Math.hypot(cell.x - x, cell.z - z);
        if (dist < minDist) {
          minDist = dist;
          best = cell;
        }
      }
    }
    return best;
  }

  getShelterCapacity(bType) {
    if (!bType) return 0;
    if (BUILDINGS_CATALOG && BUILDINGS_CATALOG[bType] && typeof BUILDINGS_CATALOG[bType].shelterCapacity === 'number') {
      return BUILDINGS_CATALOG[bType].shelterCapacity;
    }
    if (bType === 'eco_house') return 4;
    if (bType === 'green_roof') return 20;
    if (bType === 'commercial_hub') return 40;
    if (bType === 'legacy_concrete') return 10;
    return 0;
  }

  // En Yakın Güvenli Bina / Sığınak Bulucu (Kapasiteli Ev Sığınması & Dengeli Dağılım)
  findNearestShelter(x, z) {
    let best = null;
    let minDist = Infinity;
    let fallbackBest = null;
    let fallbackMinDist = Infinity;

    if (this.grid && this.grid.cells) {
      for (const cell of this.grid.cells) {
        if (cell.occupied && !cell.isRoad && cell.buildingType) {
          const cap = this.getShelterCapacity(cell.buildingType);
          const currentOcc = cell.shelterOccupancy || 0;
          const isHouse = cell.buildingType === 'eco_house' || cell.buildingType === 'green_roof' || cell.buildingType === 'commercial_hub';
          const dist = Math.hypot(cell.x - x, cell.z - z) * (isHouse ? 0.72 : 1.0);

          if (dist < fallbackMinDist) {
            fallbackMinDist = dist;
            fallbackBest = cell;
          }

          // Kontenjanı olan binayı tercih et
          if (cap > 0 && currentOcc < cap) {
            if (dist < minDist) {
              minDist = dist;
              best = cell;
            }
          }
        }
      }
    }

    const targetCell = best || fallbackBest;
    if (!targetCell) {
      return { x: 0, z: 1.5, cell: null };
    }

    targetCell.shelterOccupancy = (targetCell.shelterOccupancy || 0) + 1;
    return { x: targetCell.x, z: targetCell.z, cell: targetCell };
  }

  // 3. Konyaaltı Plaj Yaşamı ve Eğlencesi (Top Atanlar, Güneşlenenler, Yüzenler, Kumdan Kale Yapanlar)
  setupBeachCrowd() {
    this.beachGoers = [];

    // 1. Plaj Şemsiyeleri ve Renkli Havlular
    const towelGeom = new THREE.PlaneGeometry(1.5, 0.85);
    towelGeom.rotateX(-Math.PI / 2);

    const towelMat1 = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.9 });
    const towel1 = new THREE.Mesh(towelGeom, towelMat1);
    towel1.position.set(-8.5, 0.165, 25.2);
    towel1.receiveShadow = true;
    this.beachGroup.add(towel1);

    const towelMat2 = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.9 });
    const towel2 = new THREE.Mesh(towelGeom, towelMat2);
    towel2.position.set(8.5, 0.165, 25.2);
    towel2.receiveShadow = true;
    this.beachGroup.add(towel2);

    // Renkli Plaj Şemsiyeleri
    const createParasol = (px, pz, colorHex) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(px, 0.16, pz);

      const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.75, roughness: 0.25 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.45, 6), poleMat);
      pole.position.y = 0.72;
      pole.rotation.z = -0.12;
      pole.castShadow = true;
      pGroup.add(pole);

      const canopyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5, side: THREE.DoubleSide });
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.92, 0.35, 7), canopyMat);
      canopy.position.set(0.08, 1.42, 0);
      canopy.rotation.z = -0.12;
      canopy.castShadow = true;
      pGroup.add(canopy);

      this.beachGroup.add(pGroup);
      const parasolObj = { group: pGroup, canopy, pole, baseRotZ: -0.12 };
      this.parasols.push(parasolObj);
      return pGroup;
    };

    createParasol(-9.6, 24.6, 0xfacc15); // Sarı şemsiye
    createParasol(9.6, 24.6, 0xec4899);  // Pembe şemsiye

    // 2. Birbirine Top Atan İki Arkadaş
    const throwerA = this.createPedestrianMesh();
    throwerA.group.position.set(-3.2, 0.18, 25.4);
    throwerA.group.rotation.y = Math.PI / 2;
    this.beachGroup.add(throwerA.group);

    const throwerB = this.createPedestrianMesh();
    throwerB.group.position.set(3.2, 0.18, 25.4);
    throwerB.group.rotation.y = -Math.PI / 2;
    this.beachGroup.add(throwerB.group);

    // Renkli Dilimli Akdeniz Plaj Topu (Sarı, Kırmızı, Mavi, Beyaz çizgili)
    let ballTexture = null;
    if (typeof document !== 'undefined') {
      const ballCanvas = document.createElement('canvas');
      ballCanvas.width = 128;
      ballCanvas.height = 64;
      const bctx = ballCanvas.getContext('2d');
      const colors = ['#f43f5e', '#ffffff', '#0284c7', '#facc15', '#ffffff', '#10b981'];
      const sliceW = 128 / colors.length;
      colors.forEach((col, idx) => {
        bctx.fillStyle = col;
        bctx.fillRect(idx * sliceW, 0, sliceW, 64);
      });
      ballTexture = new THREE.CanvasTexture(ballCanvas);
    }
    const ballGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTexture,
      color: ballTexture ? 0xffffff : 0xf97316,
      roughness: 0.2,
      metalness: 0.05
    });
    this.ball = new THREE.Mesh(ballGeom, ballMat);
    this.ball.position.set(-3.2, 0.45, 25.4);
    this.ball.castShadow = true;
    this.beachGroup.add(this.ball);

    this.ballThrowers = {
      pA: {
        mesh: throwerA,
        basePos: new THREE.Vector3(-3.2, 0.18, 25.4),
        baseRotY: Math.PI / 2,
        state: 'IDLE',
        speed: 0.75,
        animTime: 0
      },
      pB: {
        mesh: throwerB,
        basePos: new THREE.Vector3(3.2, 0.18, 25.4),
        baseRotY: -Math.PI / 2,
        state: 'IDLE',
        speed: 0.75,
        animTime: 0
      }
    };
    this.beachGoers.push(this.ballThrowers.pA, this.ballThrowers.pB);

    // 3. Havlularda Güneşlenenler
    const batherA = this.createPedestrianMesh();
    batherA.group.position.set(-8.5, 0.22, 25.2);
    batherA.group.rotation.x = -Math.PI / 2;
    batherA.group.rotation.z = 0.1;
    this.beachGroup.add(batherA.group);

    const batherB = this.createPedestrianMesh();
    batherB.group.position.set(8.5, 0.22, 25.2);
    batherB.group.rotation.x = -Math.PI / 2;
    batherB.group.rotation.z = -0.1;
    this.beachGroup.add(batherB.group);

    this.sunbathers = [
      {
        mesh: batherA,
        basePos: new THREE.Vector3(-8.5, 0.22, 25.2),
        baseRotY: 0,
        isLying: true,
        state: 'IDLE',
        speed: 0.7,
        animTime: 0
      },
      {
        mesh: batherB,
        basePos: new THREE.Vector3(8.5, 0.22, 25.2),
        baseRotY: 0,
        isLying: true,
        state: 'IDLE',
        speed: 0.7,
        animTime: 0
      }
    ];
    this.beachGoers.push(...this.sunbathers);

    // 4. Kumsalda Gezinen Yürüyüşçü
    const stroller = this.createPedestrianMesh();
    stroller.group.position.set(-12.0, 0.18, 26.8);
    stroller.group.rotation.y = Math.PI / 2;
    this.beachGroup.add(stroller.group);

    this.beachStroller = {
      mesh: stroller,
      basePos: new THREE.Vector3(-12.0, 0.18, 26.8),
      x: -12.0,
      dir: 1,
      state: 'IDLE',
      speed: 0.6,
      animTime: 0
    };
    this.beachGoers.push(this.beachStroller);

    // 5. Sığ Denizde Yüzen Kişi
    const swimmer = this.createPedestrianMesh();
    swimmer.group.position.set(0.0, -0.06, 29.5);
    swimmer.legL.rotation.x = 0.4;
    swimmer.legR.rotation.x = -0.4;
    this.beachGroup.add(swimmer.group);

    this.beachSwimmer = {
      mesh: swimmer,
      basePos: new THREE.Vector3(0.0, -0.06, 29.5),
      x: 0.0,
      dir: 1,
      state: 'IDLE',
      speed: 0.45,
      animTime: 0
    };
    this.beachGoers.push(this.beachSwimmer);

    // 6. Kumsalda Kumdan Kale Yapan ve Eğlenen Çocuk / Tatilci
    const castleGroup = new THREE.Group();
    castleGroup.position.set(0.0, 0.16, 25.5);
    const castleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0xecd99b, roughness: 0.95 }));
    castleBase.position.y = 0.11;
    castleGroup.add(castleBase);
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.22, 6), new THREE.MeshStandardMaterial({ color: 0xecd99b, roughness: 0.95 }));
    turret.position.y = 0.28;
    castleGroup.add(turret);
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 4), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    flagPole.position.set(0, 0.46, 0);
    castleGroup.add(flagPole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.01), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    flag.position.set(0.04, 0.54, 0);
    castleGroup.add(flag);
    this.beachGroup.add(castleGroup);
    this.sandcastle = castleGroup;

    const castleBuilder = this.createPedestrianMesh();
    castleBuilder.group.position.set(0.65, 0.18, 25.5);
    castleBuilder.group.rotation.y = -Math.PI / 2;
    castleBuilder.legL.rotation.x = 1.1; // Oturma / çömelme pozu
    castleBuilder.legR.rotation.x = 1.1;
    castleBuilder.armR.rotation.x = -0.7; // Kumla oynayan el
    this.beachGroup.add(castleBuilder.group);

    this.beachBuilder = {
      mesh: castleBuilder,
      basePos: new THREE.Vector3(0.65, 0.18, 25.5),
      baseRotY: -Math.PI / 2,
      isSitting: true,
      state: 'IDLE',
      speed: 0.7,
      animTime: 0
    };
    this.beachGoers.push(this.beachBuilder);
  }

  // Genel Tahliye & Eve Giriş Animasyon Yöneticisi
  updateAgentEvacuation(agent, dt, isFlood) {
    if (isFlood) {
      if (agent.state !== 'FLEEING' && agent.state !== 'ENTERING' && agent.state !== 'SHELTERED') {
        agent.state = 'FLEEING';
        agent.targetShelter = this.findNearestShelter(agent.mesh.group.position.x, agent.mesh.group.position.z);
        // Her ajana kapı önü için hafif bir rastgele sapma ver (hepsi tek noktada üst üste yığılmasın)
        agent.doorOffset = (agent.sideOffset || ((Math.random() - 0.5) * 0.8));
        if (agent.isLying) {
          agent.mesh.group.rotation.x = 0; // Havludan ayağa fırla
          agent.isLying = false;
        }
        if (agent.isSitting) {
          agent.mesh.legL.rotation.x = 0;
          agent.mesh.legR.rotation.x = 0;
          agent.isSitting = false;
        }
      }

      if (agent.state === 'FLEEING') {
        const currentPos = agent.mesh.group.position;
        // Binanın ön kapı eşiği (Güneye bakan cephe: z + 1.15)
        const targetX = agent.targetShelter.x + (agent.doorOffset * 0.35);
        const targetZ = agent.targetShelter.z + 1.15;
        const dx = targetX - currentPos.x;
        const dz = targetZ - currentPos.z;
        const dist = Math.hypot(dx, dz);

        // Hızlı telaşlı panik koşma & pedal çevirme animasyonu
        agent.animTime = (agent.animTime || 0) + dt * 18;
        const legAngle = Math.sin(agent.animTime) * 0.75;
        const armAngle = Math.cos(agent.animTime) * 0.65;
        if (agent.mesh.legL) agent.mesh.legL.rotation.x = legAngle;
        if (agent.mesh.legR) agent.mesh.legR.rotation.x = -legAngle;

        // Yağmur altında eller baş üstünde kaçış duruşu (hands over head)
        if (agent.mesh.armL && agent.mesh.armR && !agent.mesh.rider) {
          const armWave = Math.sin(agent.animTime * 1.2) * 0.15;
          agent.mesh.armL.rotation.x = -2.6 + armWave;
          agent.mesh.armL.rotation.z = 0.42;
          agent.mesh.armR.rotation.x = -2.6 - armWave;
          agent.mesh.armR.rotation.z = -0.42;
          agent.mesh.group.rotation.x = 0.22; // Yağmura ve fırtınaya karşı öne eğik koşu
        } else {
          if (agent.mesh.armL) agent.mesh.armL.rotation.x = -armAngle;
          if (agent.mesh.armR) agent.mesh.armR.rotation.x = armAngle;
        }

        // Islak yolda ayaklardan su damlacıkları sıçratma
        if (Math.random() < 0.28) {
          this.spawnFootSplash(currentPos.x, currentPos.y + 0.05, currentPos.z);
        }

        // Bisikletli için bacak ve tekerlek hareketi
        if (agent.mesh.rider) {
          if (agent.mesh.rider.legL) agent.mesh.rider.legL.rotation.x = legAngle;
          if (agent.mesh.rider.legR) agent.mesh.rider.legR.rotation.x = -legAngle;
          if (agent.mesh.wheelFront) agent.mesh.wheelFront.rotation.x += dt * 32;
          if (agent.mesh.wheelBack) agent.mesh.wheelBack.rotation.x += dt * 32;
        }

        if (dist > 0.05) {
          agent.mesh.group.rotation.y = Math.atan2(dx / dist, dz / dist);
        }

        // Panik kaçış hızı
        const sprintSpeed = Math.max(2.5, (agent.speed || 0.7) * 3.4);
        const moveStep = sprintSpeed * dt;

        if (dist <= 0.85) {
          // Binanın kapısına vardı, içeri girmeye başla!
          agent.state = 'ENTERING';
        } else {
          currentPos.x += (dx / dist) * moveStep;
          currentPos.z += (dz / dist) * moveStep;
          // Zemin seviyesi: Kumsalda y = 0.18, kordonda y = 0.44, şehirde y = 0.60 (asla havada uçmaz)
          const targetY = currentPos.z > 22.2 ? 0.18 : currentPos.z >= 21.0 ? 0.44 : 0.60;
          currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetY, dt * 10);
        }
        return true;
      }

      if (agent.state === 'ENTERING') {
        // Binanın kapısından içeri süzülüp küçülerek gözden kaybolma efekti
        const s = Math.max(0, agent.mesh.group.scale.x - dt * 3.6);
        agent.mesh.group.scale.set(s, s, s);
        if (s <= 0.05) {
          agent.mesh.group.visible = false;
          agent.state = 'SHELTERED';
        }
        return true;
      }

      if (agent.state === 'SHELTERED') {
        agent.mesh.group.visible = false;
        return true;
      }
    } else {
      // Afet bitti, evlerden geri çıkma
      if (agent.state === 'SHELTERED' || agent.state === 'ENTERING') {
        agent.mesh.group.visible = true;
        const s = Math.min(1.0, agent.mesh.group.scale.x + dt * 2.5);
        agent.mesh.group.scale.set(s, s, s);
        if (s >= 0.98) {
          agent.mesh.group.scale.set(1, 1, 1);
          agent.state = 'RETURNING';
        }
        return true;
      }

      if (agent.state === 'RETURNING') {
        const currentPos = agent.mesh.group.position;

        // Bacak & Kol animasyonu
        agent.animTime = (agent.animTime || 0) + dt * 8;
        const legAngle = Math.sin(agent.animTime) * 0.45;
        const armAngle = Math.cos(agent.animTime) * 0.35;
        if (agent.mesh.legL) agent.mesh.legL.rotation.x = legAngle;
        if (agent.mesh.legR) agent.mesh.legR.rotation.x = -legAngle;
        if (agent.mesh.armL) {
          agent.mesh.armL.rotation.x = -armAngle;
          agent.mesh.armL.rotation.z = 0;
        }
        if (agent.mesh.armR) {
          agent.mesh.armR.rotation.x = armAngle;
          agent.mesh.armR.rotation.z = 0;
        }
        if (!agent.isLying && !agent.isSitting && !agent.mesh.rider) {
          agent.mesh.group.rotation.x = 0;
        }
        if (agent.mesh.rider) {
          if (agent.mesh.rider.legL) agent.mesh.rider.legL.rotation.x = legAngle;
          if (agent.mesh.rider.legR) agent.mesh.rider.legR.rotation.x = -legAngle;
          if (agent.mesh.wheelFront) agent.mesh.wheelFront.rotation.x += dt * 14;
          if (agent.mesh.wheelBack) agent.mesh.wheelBack.rotation.x += dt * 14;
        }

        // 1. Durum: Plaj Sakinleri (Kendi plaj noktalarına yürüyerek dönerler)
        if (agent.basePos) {
          const dx = agent.basePos.x - currentPos.x;
          const dz = agent.basePos.z - currentPos.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 0.20) {
            agent.mesh.group.rotation.y = Math.atan2(dx / dist, dz / dist);
            const walkSpeed = (agent.speed || 0.7) * 1.6;
            currentPos.x += (dx / dist) * walkSpeed * dt;
            currentPos.z += (dz / dist) * walkSpeed * dt;
            const targetY = currentPos.z > 22.2 ? agent.basePos.y : currentPos.z >= 21.0 ? 0.44 : 0.60;
            currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetY, dt * 8);
          } else {
            currentPos.copy(agent.basePos);
            agent.mesh.group.rotation.y = agent.baseRotY || 0;
            if (agent.isLying !== undefined) {
              agent.mesh.group.rotation.x = -Math.PI / 2;
              agent.isLying = true;
            }
            if (agent.isSitting !== undefined) {
              agent.mesh.legL.rotation.x = 1.1;
              agent.mesh.legR.rotation.x = 1.1;
              agent.isSitting = true;
            }
            agent.state = 'IDLE';
          }
          return true;
        }

        // 2. Durum: Sahil Kordonu Yayaları & Bisikletlileri (Kordona doğru yürüyüp seyre devam ederler)
        if (agent.type === 'PROMENADE') {
          const targetZ = 21.25;
          const targetX = agent.promenadeX || currentPos.x;
          const dx = targetX - currentPos.x;
          const dz = targetZ - currentPos.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 0.45) {
            agent.mesh.group.rotation.y = Math.atan2(dx / dist, dz / dist);
            const walkSpeed = (agent.speed || 0.7) * 1.8;
            currentPos.x += (dx / dist) * walkSpeed * dt;
            currentPos.z += (dz / dist) * walkSpeed * dt;
            const targetY = currentPos.z >= 21.0 ? 0.44 : 0.60;
            currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetY, dt * 8);
            return true;
          } else {
            currentPos.set(agent.promenadeX, 0.44, 21.25);
            agent.mesh.group.rotation.y = (agent.promenadeDir > 0) ? Math.PI / 2 : -Math.PI / 2;
            agent.state = 'IDLE';
            return true;
          }
        }

        // 3. Durum: Kaldırım Yayaları & Bisikletlileri (Kapıdan en yakın yol kaldırımına yürüyerek pürüzsüz bağlanırlar, sıfır ışınlanma)
        const nearestRoad = this.findNearestRoadCell(currentPos.x, currentPos.z);
        if (nearestRoad) {
          const dx = nearestRoad.x - currentPos.x;
          const dz = nearestRoad.z - currentPos.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 1.25) {
            agent.mesh.group.rotation.y = Math.atan2(dx / dist, dz / dist);
            const walkSpeed = (agent.speed || 0.7) * 2.0;
            currentPos.x += (dx / dist) * walkSpeed * dt;
            currentPos.z += (dz / dist) * walkSpeed * dt;
            currentPos.y = 0.60;
            return true;
          } else {
            // Kaldırıma vardı, rotaya sorunsuz bağlan!
            agent.currCell = nearestRoad;
            const neighbors = this.getConnectedRoadNeighbors(nearestRoad);
            agent.nextCell = neighbors.length > 0 ? neighbors[Math.floor(Math.random() * neighbors.length)] : nearestRoad;
            agent.prevCell = null;
            agent.progress = 0;
            agent.state = 'IDLE';
            return true;
          }
        } else {
          agent.state = 'IDLE';
        }
      }
    }
    return false;
  }

  initCrowd() {
    for (let i = 0; i < 15; i++) {
      this.spawnPedestrian(i);
    }
    for (let i = 0; i < 6; i++) {
      this.spawnCyclist(i);
    }
  }

  spawnPedestrian(seed = 0) {
    const pMesh = this.createPedestrianMesh();
    this.scene.add(pMesh.group);

    const isPromenade = seed % 3 === 0;
    const baseSpeed = 0.65 + Math.random() * 0.25;
    const p = {
      mesh: pMesh,
      type: isPromenade ? 'PROMENADE' : 'SIDEWALK',
      currCell: null,
      nextCell: null,
      sideOffset: (seed % 2 === 0 ? 1 : -1) * 1.25,
      progress: Math.random(),
      speed: baseSpeed,
      baseSpeed: baseSpeed,
      animTime: Math.random() * 10,
      promenadeX: -36 + Math.random() * 72,
      promenadeDir: Math.random() > 0.5 ? 1 : -1,
      state: 'IDLE'
    };

    if (p.type === 'SIDEWALK') {
      this.assignSidewalkRoute(p, seed);
    } else {
      // Sahil kordonu (kaldırım üstü y = 0.44)
      p.mesh.group.position.set(p.promenadeX, 0.44, 21.25);
      p.mesh.group.rotation.y = p.promenadeDir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    this.pedestrians.push(p);
  }

  spawnCyclist(seed = 0) {
    const cMesh = this.createCyclistMesh();
    this.scene.add(cMesh.group);

    const isPromenade = seed % 2 === 0;
    const baseSpeed = 1.6 + Math.random() * 0.4;
    const c = {
      mesh: cMesh,
      type: isPromenade ? 'PROMENADE' : 'SIDEWALK',
      currCell: null,
      nextCell: null,
      sideOffset: (seed % 2 === 0 ? 1 : -1) * 1.20,
      progress: Math.random(),
      speed: baseSpeed,
      baseSpeed: baseSpeed,
      animTime: Math.random() * 10,
      promenadeX: -36 + Math.random() * 72,
      promenadeDir: Math.random() > 0.5 ? 1 : -1,
      state: 'IDLE'
    };

    if (c.type === 'SIDEWALK') {
      this.assignSidewalkRoute(c, seed);
    } else {
      // Sahil kordonu bisiklet yolu (kaldırım üstü y = 0.44)
      c.mesh.group.position.set(c.promenadeX, 0.44, 21.25);
      c.mesh.group.rotation.y = c.promenadeDir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    this.cyclists.push(c);
  }

  assignSidewalkRoute(agent, seed = 0) {
    if (!this.grid) return;
    const roadCells = this.grid.getRoadCells();
    if (roadCells.length === 0) {
      agent.mesh.group.visible = false;
      return;
    }

    const startCell = roadCells[(seed * 7 + Math.floor(Math.random() * roadCells.length)) % roadCells.length];
    const neighbors = this.getConnectedRoadNeighbors(startCell);

    agent.currCell = startCell;
    agent.prevCell = null;
    agent.nextCell = neighbors.length > 0 ? neighbors[Math.floor(Math.random() * neighbors.length)] : startCell;
    agent.progress = Math.random();
    agent.mesh.group.visible = true;

    // Kaldırım taşının üstünde durmalı: y = 0.60 (asfalt 0.435, kaldırım 0.58, ayaklar asla batmaz)
    agent.mesh.group.position.set(startCell.x, 0.60, startCell.z);
  }

  getConnectedRoadNeighbors(cell) {
    if (!cell || !this.grid) return [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const list = [];
    for (const [dr, dc] of dirs) {
      const n = this.grid.getCell(cell.row + dr, cell.col + dc);
      if (n && n.occupied && n.isRoad) {
        list.push(n);
      }
    }
    return list;
  }

  syncPopulation(population) {
    const pop = Math.max(100, Number(population) || 550);
    const target = Math.min(36, Math.max(18, Math.round(18 * Math.pow(pop / 550, 0.65))));

    const targetPeds = Math.round(target * 0.75);
    const targetCyclists = Math.round(target * 0.25);

    while (this.pedestrians.length < targetPeds) {
      this.spawnPedestrian(this.pedestrians.length + 13);
    }
    while (this.pedestrians.length > targetPeds && this.pedestrians.length > 10) {
      const p = this.pedestrians.pop();
      if (p && p.mesh && p.mesh.group) {
        this.scene.remove(p.mesh.group);
      }
    }

    while (this.cyclists.length < targetCyclists) {
      this.spawnCyclist(this.cyclists.length + 7);
    }
    while (this.cyclists.length > targetCyclists && this.cyclists.length > 4) {
      const c = this.cyclists.pop();
      if (c && c.mesh && c.mesh.group) {
        this.scene.remove(c.mesh.group);
      }
    }
  }

  update(dt, game) {
    // Afet (Sel / Fırtına Yağmuru) Kontrolü
    const isFlood = game && (
      (game.crisisPhase === 'ACTIVE' && game.currentDisaster === 'FLOOD') ||
      (game.crisisPhase === 'WARNING' && game.currentDisaster === 'FLOOD' && game.crisisTimer <= 4.0)
    );

    if (!isFlood && this.grid && this.grid.cells) {
      for (let i = 0; i < this.grid.cells.length; i++) {
        if (this.grid.cells[i].shelterOccupancy) {
          this.grid.cells[i].shelterOccupancy = 0;
        }
      }
    }

    // 1. Plaj Topu ve Plaj Halkını Güncelle
    if (this.ball && this.ballThrowers) {
      if (isFlood) {
        // Sel olunca top suya kapılıp su yüzeyinde yüzer ve dalgalarla hafifçe yalpalar
        const waterY = (game && game.disasters && game.disasters.waterMesh) ? game.disasters.waterMesh.position.y : 0.58;
        this.ball.position.y = Math.max(0.22, waterY + 0.12) + Math.sin(performance.now() * 0.005) * 0.04;
        this.ball.rotation.x += dt * 1.5;
        this.ball.rotation.y += dt * 1.8;
      } else if (this.ballThrowers.pA.state === 'IDLE' && this.ballThrowers.pB.state === 'IDLE') {
        this.ballTime += dt * 1.1;
        const prog = (this.ballTime % 2.2) / 2.2;
        if (prog < 0.5) {
          const t = prog / 0.5;
          this.ball.position.x = THREE.MathUtils.lerp(-3.2, 3.2, t);
          this.ball.position.y = 0.45 + Math.sin(t * Math.PI) * 1.4;
          this.ball.position.z = 25.4;
          this.ballThrowers.pA.mesh.armR.rotation.x = -Math.PI * 0.7 * (1.0 - t);
          this.ballThrowers.pB.mesh.armL.rotation.x = -0.6 * t;
          this.ballThrowers.pB.mesh.armR.rotation.x = -0.6 * t;
        } else {
          const t = (prog - 0.5) / 0.5;
          this.ball.position.x = THREE.MathUtils.lerp(3.2, -3.2, t);
          this.ball.position.y = 0.45 + Math.sin(t * Math.PI) * 1.4;
          this.ball.position.z = 25.4;
          this.ballThrowers.pB.mesh.armR.rotation.x = -Math.PI * 0.7 * (1.0 - t);
          this.ballThrowers.pA.mesh.armL.rotation.x = -0.6 * t;
          this.ballThrowers.pA.mesh.armR.rotation.x = -0.6 * t;
        }
        this.ball.rotation.x += dt * 6.0;
        this.ball.rotation.y += dt * 4.5;
      }
    }

    // Plaj Sakinleri Tahliye ve Simülasyonu
    this.beachGoers.forEach((bg) => {
      if (this.updateAgentEvacuation(bg, dt, isFlood)) {
        return;
      }

      // Normal güneşli hava plaj hareketleri
      if (bg === this.beachStroller) {
        bg.animTime += dt * 4.5;
        const legAngle = Math.sin(bg.animTime) * 0.45;
        bg.mesh.legL.rotation.x = legAngle;
        bg.mesh.legR.rotation.x = -legAngle;
        bg.x += bg.dir * dt * bg.speed;
        if (bg.x > 18) bg.dir = -1;
        if (bg.x < -18) bg.dir = 1;
        bg.mesh.group.position.set(bg.x, 0.18 + Math.abs(Math.sin(bg.animTime)) * 0.02, 26.8);
        bg.mesh.group.rotation.y = bg.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else if (bg === this.beachSwimmer) {
        let isPolluted = false;
        if (game) {
          if (typeof game.marineHealth === 'number') {
            isPolluted = game.marineHealth < 80 || (typeof game.carbon === 'number' && game.carbon > 35);
          } else if (typeof game.carbon === 'number') {
            isPolluted = game.carbon > 35;
          }
        }
        if (isPolluted) {
          // Deniz kirlendiğinde (müsilaj / çamur): Denize girmez, kumsalda durup uzaktan bakar
          bg.basePos.set(0.0, 0.18, 26.8);
          bg.baseRotY = 0;
          bg.animTime += dt * 1.5;
          bg.mesh.armL.rotation.x = 0;
          bg.mesh.armR.rotation.x = 0;
          bg.mesh.legL.rotation.x = 0;
          bg.mesh.legR.rotation.x = 0;
          bg.mesh.group.position.set(bg.x, 0.18, 26.8);
          bg.mesh.group.rotation.y = 0; // Denize (+Z) bakar
        } else {
          // Deniz temizlendiğinde (kristal Akdeniz turkuazı): Suya atlar ve yüzer!
          bg.basePos.set(0.0, -0.06, 29.5);
          bg.animTime += dt * 3.5;
          bg.x += bg.dir * dt * bg.speed * 0.5;
          if (bg.x > 12) bg.dir = -1;
          if (bg.x < -12) bg.dir = 1;
          bg.mesh.armL.rotation.x = Math.sin(bg.animTime) * 0.6;
          bg.mesh.armR.rotation.x = -Math.sin(bg.animTime) * 0.6;
          bg.mesh.group.position.set(bg.x, -0.06 + Math.sin(bg.animTime * 1.5) * 0.04, 29.5);
          bg.mesh.group.rotation.y = bg.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
      }
    });

    // 2. Yayaları Güncelle (Kaldırım Üstü ve Tahliye)
    const isHeatwave = Boolean(game && game.currentDisaster === 'HEATWAVE' && (game.crisisPhase === 'ACTIVE' || game.crisisPhase === 'WARNING'));
    const heatMult = isHeatwave ? 0.65 : 1.0;

    this.pedestrians.forEach((p, idx) => {
      if (this.updateAgentEvacuation(p, dt, isFlood)) {
        return;
      }

      const activeSpeed = (p.baseSpeed || p.speed || 0.65) * heatMult;
      p.speed = activeSpeed;
      p.animTime += dt * 6.5 * (activeSpeed / 0.65);
      const legAngle = Math.sin(p.animTime) * 0.55;
      const armAngle = Math.cos(p.animTime) * 0.45;
      p.mesh.legL.rotation.x = legAngle;
      p.mesh.legR.rotation.x = -legAngle;
      p.mesh.armL.rotation.x = -armAngle;
      p.mesh.armR.rotation.x = armAngle;
      const bob = Math.abs(Math.sin(p.animTime)) * 0.025;

      if (p.type === 'PROMENADE') {
        p.promenadeX += p.promenadeDir * activeSpeed * dt * 2.2;
        if (p.promenadeX > 38) {
          p.promenadeX = 38;
          p.promenadeDir = -1;
        } else if (p.promenadeX < -38) {
          p.promenadeX = -38;
          p.promenadeDir = 1;
        }
        // Sahil kordonu yürüyüş yolu (Kaldırım üstünde y = 0.44, asla içine batmaz)
        p.mesh.group.position.set(p.promenadeX, 0.44 + bob, 21.25);
        p.mesh.group.rotation.y = p.promenadeDir > 0 ? Math.PI / 2 : -Math.PI / 2;
        return;
      }

      if (!p.currCell || !p.currCell.occupied || !p.currCell.isRoad || !p.nextCell || !p.nextCell.occupied || !p.nextCell.isRoad) {
        this.assignSidewalkRoute(p, idx);
        return;
      }

      p.progress += (activeSpeed / 3.0) * dt;
      if (p.progress >= 1.0) {
        p.progress -= 1.0;
        p.prevCell = p.currCell;
        p.currCell = p.nextCell;

        const neighbors = this.getConnectedRoadNeighbors(p.currCell);
        if (neighbors.length === 0) {
          p.nextCell = p.currCell;
        } else {
          const forward = neighbors.filter((n) => n !== p.prevCell);
          p.nextCell = forward.length > 0 ? forward[Math.floor(Math.random() * forward.length)] : neighbors[0];
        }
      }

      const dx = p.nextCell.x - p.currCell.x;
      const dz = p.nextCell.z - p.currCell.z;
      const len = Math.hypot(dx, dz) || 1;
      const ux = dx / len;
      const uz = dz / len;

      const rx = -uz * p.sideOffset;
      const rz = ux * p.sideOffset;

      if (typeof p.currentRx === 'undefined') {
        p.currentRx = rx;
        p.currentRz = rz;
      } else {
        p.currentRx += (rx - p.currentRx) * Math.min(1.0, dt * 7.5);
        p.currentRz += (rz - p.currentRz) * Math.min(1.0, dt * 7.5);
      }

      const px = THREE.MathUtils.lerp(p.currCell.x, p.nextCell.x, p.progress) + p.currentRx;
      const pz = THREE.MathUtils.lerp(p.currCell.z, p.nextCell.z, p.progress) + p.currentRz;

      // Kaldırım taşının üstünde durmalı: y = 0.60 (asfalt 0.435, kaldırım 0.58, asla içine batmaz)
      p.mesh.group.position.set(px, 0.60 + bob, pz);

      if (isFlood && Math.random() < 0.15) {
        this.spawnFootSplash(px, 0.60, pz);
      }

      if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        p.mesh.group.rotation.y = Math.atan2(ux, uz);
      }
    });

    // 3. Bisikletlileri Güncelle (Kaldırım Üstü ve Tahliye)
    this.cyclists.forEach((c, idx) => {
      if (this.updateAgentEvacuation(c, dt, isFlood)) {
        return;
      }

      c.animTime += dt * 10 * (c.speed / 1.6);
      c.mesh.wheelFront.rotation.x += dt * 14 * c.speed;
      c.mesh.wheelBack.rotation.x += dt * 14 * c.speed;
      c.mesh.rider.legL.rotation.x = Math.sin(c.animTime) * 0.45;
      c.mesh.rider.legR.rotation.x = -Math.sin(c.animTime) * 0.45;

      if (c.type === 'PROMENADE') {
        c.promenadeX += c.promenadeDir * c.speed * dt * 2.4;
        if (c.promenadeX > 38) {
          c.promenadeX = 38;
          c.promenadeDir = -1;
        } else if (c.promenadeX < -38) {
          c.promenadeX = -38;
          c.promenadeDir = 1;
        }
        // Sahil kordonu bisiklet yolu (Kaldırım üstünde y = 0.44)
        c.mesh.group.position.set(c.promenadeX, 0.44, 21.25);
        c.mesh.group.rotation.y = c.promenadeDir > 0 ? Math.PI / 2 : -Math.PI / 2;
        return;
      }

      if (!c.currCell || !c.currCell.occupied || !c.currCell.isRoad || !c.nextCell || !c.nextCell.occupied || !c.nextCell.isRoad) {
        this.assignSidewalkRoute(c, idx);
        return;
      }

      c.progress += (c.speed / 3.0) * dt;
      if (c.progress >= 1.0) {
        c.progress -= 1.0;
        c.prevCell = c.currCell;
        c.currCell = c.nextCell;

        const neighbors = this.getConnectedRoadNeighbors(c.currCell);
        if (neighbors.length === 0) {
          c.nextCell = c.currCell;
        } else {
          const forward = neighbors.filter((n) => n !== c.prevCell);
          c.nextCell = forward.length > 0 ? forward[Math.floor(Math.random() * forward.length)] : neighbors[0];
        }
      }

      const dx = c.nextCell.x - c.currCell.x;
      const dz = c.nextCell.z - c.currCell.z;
      const len = Math.hypot(dx, dz) || 1;
      const ux = dx / len;
      const uz = dz / len;

      const rx = -uz * c.sideOffset;
      const rz = ux * c.sideOffset;

      if (typeof c.currentRx === 'undefined') {
        c.currentRx = rx;
        c.currentRz = rz;
      } else {
        c.currentRx += (rx - c.currentRx) * Math.min(1.0, dt * 7.5);
        c.currentRz += (rz - c.currentRz) * Math.min(1.0, dt * 7.5);
      }

      const px = THREE.MathUtils.lerp(c.currCell.x, c.nextCell.x, c.progress) + c.currentRx;
      const pz = THREE.MathUtils.lerp(c.currCell.z, c.nextCell.z, c.progress) + c.currentRz;

      // Kaldırım üstünde durmalı: y = 0.60 (asfalt 0.435, tekerlekler kaldırım taşının üstünde döner)
      c.mesh.group.position.set(px, 0.60, pz);

      if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        c.mesh.group.rotation.y = Math.atan2(ux, uz);
      }
    });

    // Plaj Şemsiyelerinin Fırtınada Kapanması & Rüzgarda Çırpınması
    if (this.parasols && this.parasols.length > 0) {
      const t = performance.now() * 0.001;
      this.parasols.forEach((p) => {
        if (isFlood) {
          // Fırtınada şemsiye kumaşı katlanıp kapanır ve rüzgardan savrulur
          p.canopy.scale.lerp(new THREE.Vector3(0.25, 1.45, 0.25), dt * 4.0);
          p.group.rotation.z = -0.12 + Math.sin(t * 12.0) * 0.18;
          p.group.rotation.x = Math.cos(t * 10.0) * 0.12;
        } else {
          // Güneşli havada şemsiye genişçe açılır
          p.canopy.scale.lerp(new THREE.Vector3(1.0, 1.0, 1.0), dt * 3.0);
          p.group.rotation.z = THREE.MathUtils.lerp(p.group.rotation.z, -0.12, dt * 3.0);
          p.group.rotation.x = THREE.MathUtils.lerp(p.group.rotation.x, 0.0, dt * 3.0);
        }
      });
    }

    this.updateFootSplashes(dt);
  }
}

