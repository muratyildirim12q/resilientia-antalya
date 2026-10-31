import { BUILDINGS_CATALOG } from './buildings.js';
import { sound } from './audio.js';

export class GameManager {
  constructor(worldScene, grid, buildingManager, disasterSim, ui) {
    this.scene = worldScene;
    this.grid = grid;
    this.bm = buildingManager;
    this.disasters = disasterSim;
    this.ui = ui;

    // Temel Metrikler
    this.budget = 9500;
    this.carbon = 65; // %0 Net-Zero hedefi (0-100)
    this.health = 100.0; // Şehir Direnci (HP) %
    this.spongeCapacity = 0; // m³/s
    this.coolingPower = 0; // -°C
    this.population = 360;
    this.taxIncome = 240; // Her 5 saniyede bir belediye geliri
    this.taxTimer = 5.0;

    this.gameSpeed = 1.0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;

    // Araç Modu: 'BUILD' | 'BULLDOZE' | 'INSPECT'
    this.toolMode = 'BUILD';
    this.selectedCategory = 'roads';
    this.selectedBuildingType = 'road';

    // Afet Zamanlayıcısı
    this.crisisTimer = 38.0;
    this.crisisPhase = 'PEACE'; // 'PEACE', 'WARNING', 'ACTIVE'
    this.currentDisaster = null;
    this.disasterDuration = 10.0;
  }

  setToolMode(mode) {
    this.toolMode = mode;
    this.grid.setZoningOverlayVisible(mode === 'BUILD' || mode === 'BULLDOZE');
    sound.playClick();
  }

  selectBuildingType(typeId) {
    if (!BUILDINGS_CATALOG[typeId]) return;
    this.selectedBuildingType = typeId;
    this.selectedCategory = BUILDINGS_CATALOG[typeId].category;
    this.toolMode = 'BUILD';
    this.grid.setZoningOverlayVisible(true);
    sound.playClick();
  }

  // Başlangıçta Gerçekçi Cities: Skylines Şehir Ağı ve İlk Mahalle Kurulumu
  initStarterCity() {
    this.grid.reset();

    // Başlangıç Metriklerini Sıfırla
    this.spongeCapacity = 0;
    this.coolingPower = 0;
    this.population = 0;
    this.taxIncome = 100;

    // 1. Ana Doğu-Batı Sahil Bulvarı (row = 6, Batı ve Doğu otoyollarına doğrudan bağlı)
    for (let c = 0; c < this.grid.size; c++) {
      this.placeFreeAt(6, c, c >= 4 && c <= 7 ? 'boulevard' : 'road', false);
    }

    // 2. Kuzey-Güney Kesişen Sokaklar ve Şehir Adası (Block Loop)
    for (let r = 2; r <= 9; r++) {
      if (r !== 6) {
        this.placeFreeAt(r, 4, 'road', false);
        this.placeFreeAt(r, 7, 'road', false);
      }
    }
    for (let c = 4; c <= 7; c++) {
      this.placeFreeAt(2, c, 'road', false);
      this.placeFreeAt(9, c, 'road', false);
    }

    // 3. Başlangıç Binaları (Yollara bakan başlangıç mahallesi: Sünger 18/45, Soğutma -16/-25°C)
    const starterBuildings = [
      [5, 3, 'eco_house'],
      [4, 3, 'eco_house'],
      [5, 5, 'green_roof'],
      [5, 6, 'commercial_hub'],
      [3, 5, 'eco_house'],
      [3, 6, 'eco_house'],
      [5, 8, 'commercial_hub'],
      [4, 8, 'eco_house'],
      [7, 3, 'eco_house']
    ];

    starterBuildings.forEach(([r, c, typeId]) => {
      this.placeFreeAt(r, c, typeId, false);
    });

    // Tüm yol bağlantılarını ve bina yönlerini güncelle
    this.grid.cells.forEach((cell) => {
      if (cell.occupied && cell.isRoad) {
        this.refreshRoadCell(cell.row, cell.col);
      }
    });
    this.grid.cells.forEach((cell) => {
      if (cell.occupied && !cell.isRoad && cell.building) {
        cell.building.rotation.y = this.grid.getRoadFacingAngle(cell.row, cell.col);
      }
    });

    // Başlangıç karbon değerini 65% olarak sabitle
    this.carbon = 65;
  }

  placeFreeAt(row, col, typeId, animate = false) {
    const cell = this.grid.getCell(row, col);
    const spec = BUILDINGS_CATALOG[typeId];
    if (!cell || !spec || cell.occupied) return;

    cell.occupied = true;
    cell.isRoad = Boolean(spec.isRoad);
    cell.buildingType = spec.id;

    this.spongeCapacity += spec.spongePower;
    this.coolingPower += spec.coolingPower;
    this.population += spec.population || 0;
    this.taxIncome += spec.income || 0;

    if (cell.isRoad) {
      this.refreshRoadCell(row, col);
    } else {
      const facing = this.grid.getRoadFacingAngle(row, col);
      const mesh = this.bm.createBuilding(spec.id, cell.variantSeed, facing);
      mesh.position.set(cell.x, 0.36, cell.z);
      this.scene.scene.add(mesh);
      cell.building = mesh;
      if (animate) this.bm.animateSpawn(mesh);
    }
  }

  refreshRoadCell(row, col) {
    const cell = this.grid.getCell(row, col);
    if (!cell || !cell.occupied || !cell.isRoad) return;

    if (cell.building) {
      this.scene.scene.remove(cell.building);
    }

    const neighbors = this.grid.getRoadNeighbors(row, col);
    const roadMesh = this.bm.createRoadMesh(cell.buildingType, neighbors, row, col);
    roadMesh.position.set(cell.x, 0.36, cell.z);
    this.scene.scene.add(roadMesh);
    cell.building = roadMesh;
  }

  refreshRoadAndNeighbors(row, col) {
    const coords = [
      [row, col],
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1]
    ];

    coords.forEach(([r, c]) => {
      const cell = this.grid.getCell(r, c);
      if (!cell || !cell.occupied) return;
      if (cell.isRoad) {
        this.refreshRoadCell(r, c);
      } else if (cell.building) {
        cell.building.rotation.y = this.grid.getRoadFacingAngle(r, c);
      }
    });
  }

  // Hücre Üzerinde Etkileşim (İnşaat / Yıkım / İnceleme)
  handleCellAction(cell, isDrag = false) {
    if (!cell || this.isGameOver || this.isVictory) return false;

    if (this.toolMode === 'BULLDOZE') {
      return this.bulldozeCell(cell);
    }
    if (this.toolMode === 'INSPECT') {
      if (!isDrag) this.inspectCell(cell);
      return false;
    }

    return this.buildOnCell(cell, isDrag);
  }

  buildOnCell(cell, isDrag = false) {
    if (this.isGameOver || this.isVictory || !cell) return false;

    const spec = BUILDINGS_CATALOG[this.selectedBuildingType];
    if (!spec) return false;

    // Sürükleyerek inşa etme sadece yollar için aktiftir
    if (isDrag && !spec.isRoad) return false;

    // Eğer aynı tip yapı zaten varsa işlem yapma
    if (cell.occupied) {
      // Normal asfalt yolu Yeşil Bulvar veya Tramvay Hattına yükseltmeye izin ver
      if (cell.isRoad && spec.isRoad && cell.buildingType !== spec.id) {
        return this.upgradeRoadCell(cell, spec);
      }
      if (!isDrag) {
        this.ui.showToast('Bu parsel dolu! Önce Yıkım (Buldozer) aracını kullanın.', 'error');
      }
      return false;
    }

    if (this.budget < spec.cost) {
      if (!isDrag) {
        this.ui.showToast(`Yetersiz Bütçe! ($${spec.cost} gerekli)`, 'error');
      }
      return false;
    }

    this.budget -= spec.cost;
    this.carbon = Math.max(0, Math.min(100, this.carbon + spec.carbon));
    this.spongeCapacity += spec.spongePower;
    this.coolingPower += spec.coolingPower;
    this.population += spec.population || 0;
    this.taxIncome += spec.income || 0;

    cell.occupied = true;
    cell.isRoad = Boolean(spec.isRoad);
    cell.buildingType = spec.id;

    if (cell.isRoad) {
      this.refreshRoadAndNeighbors(cell.row, cell.col);
      if (cell.building) this.bm.animateSpawn(cell.building, 220);
    } else {
      const facing = this.grid.getRoadFacingAngle(cell.row, cell.col);
      const mesh = this.bm.createBuilding(spec.id, cell.variantSeed, facing);
      mesh.position.set(cell.x, 0.36, cell.z);
      this.scene.scene.add(mesh);
      cell.building = mesh;
      this.bm.animateSpawn(mesh, 380);
    }

    if (this.grid.invalidateGhost) this.grid.invalidateGhost();
    sound.playPlace();
    if (!isDrag) {
      this.ui.showToast(`${spec.name} inşa edildi.`, 'success');
    }

    if (this.carbon === 0 && this.health >= 80) {
      this.triggerVictory();
    }
    return true;
  }

  upgradeRoadCell(cell, newSpec) {
    const oldSpec = BUILDINGS_CATALOG[cell.buildingType];
    if (this.budget < newSpec.cost) {
      this.ui.showToast(`Yetersiz Bütçe! ($${newSpec.cost} gerekli)`, 'error');
      return false;
    }

    this.budget -= newSpec.cost;
    if (oldSpec) {
      this.carbon = Math.max(0, Math.min(100, this.carbon - oldSpec.carbon));
      this.spongeCapacity = Math.max(0, this.spongeCapacity - oldSpec.spongePower);
      this.coolingPower = Math.max(0, this.coolingPower - oldSpec.coolingPower);
      this.taxIncome = Math.max(0, this.taxIncome - (oldSpec.income || 0));
    }

    this.carbon = Math.max(0, Math.min(100, this.carbon + newSpec.carbon));
    this.spongeCapacity += newSpec.spongePower;
    this.coolingPower += newSpec.coolingPower;
    this.taxIncome += newSpec.income || 0;

    cell.buildingType = newSpec.id;
    this.refreshRoadAndNeighbors(cell.row, cell.col);
    if (this.grid.invalidateGhost) this.grid.invalidateGhost();
    sound.playPlace();
    this.ui.showToast(`Yol ${newSpec.shortName} seviyesine yükseltildi!`, 'success');

    if (this.carbon === 0 && this.health >= 80) {
      this.triggerVictory();
    }
    return true;
  }

  bulldozeCell(cell) {
    if (!cell || !cell.occupied) return false;

    const spec = BUILDINGS_CATALOG[cell.buildingType];
    if (cell.building) {
      this.scene.scene.remove(cell.building);
    }

    const refund = spec ? Math.floor(spec.cost * 0.5) : 50;
    this.budget += refund;

    if (spec) {
      this.carbon = Math.max(0, Math.min(100, this.carbon - spec.carbon));
      this.spongeCapacity = Math.max(0, this.spongeCapacity - spec.spongePower);
      this.coolingPower = Math.max(0, this.coolingPower - spec.coolingPower);
      this.population = Math.max(0, this.population - (spec.population || 0));
      this.taxIncome = Math.max(50, this.taxIncome - (spec.income || 0));
    }

    cell.occupied = false;
    cell.isRoad = false;
    cell.building = null;
    cell.buildingType = null;

    this.refreshRoadAndNeighbors(cell.row, cell.col);
    if (this.grid.invalidateGhost) this.grid.invalidateGhost();
    sound.playClick();
    this.ui.showToast(`${spec ? spec.shortName : 'Yapı'} yıkıldı (+$${refund} iade)`, 'info');
    return true;
  }

  inspectCell(cell) {
    sound.playClick();
    if (!cell.occupied) {
      const nearRoad =
        this.grid.isRoadAt(cell.row - 1, cell.col) ||
        this.grid.isRoadAt(cell.row + 1, cell.col) ||
        this.grid.isRoadAt(cell.row, cell.col - 1) ||
        this.grid.isRoadAt(cell.row, cell.col + 1);
      this.ui.inspectReport(
        `Parsel [${cell.row + 1}, ${cell.col + 1}]: Boş İmar Alanı. ${
          nearRoad ? 'Cadde bağlantısı mevcut, inşaat için ideal.' : 'Cadde bağlantısı yok, önce yol döşeyebilirsiniz.'
        }`
      );
      return;
    }

    const spec = BUILDINGS_CATALOG[cell.buildingType];
    if (spec) {
      this.ui.inspectReport(
        `${spec.name} | Sünger: +${spec.spongePower} m³/s | Soğutma: -${spec.coolingPower}°C | Gelir: +$${spec.income || 0}`
      );
    }
  }

  update(dt) {
    if (this.isPaused || this.isGameOver || this.isVictory) return;

    const delta = dt * this.gameSpeed;

    // Düzenli Belediye Vergi & Yeşil Ekonomi Geliri (Her 5 saniyede bir)
    this.taxTimer -= delta;
    if (this.taxTimer <= 0) {
      this.taxTimer = 5.0;
      this.budget += this.taxIncome;
    }

    // Afet Döngüsü
    if (this.crisisPhase === 'PEACE') {
      this.crisisTimer -= delta;
      if (this.crisisTimer <= 10.0) {
        this.crisisPhase = 'WARNING';
        const rand = Math.random();
        this.currentDisaster = rand < 0.45 ? 'FLOOD' : rand < 0.75 ? 'HEATWAVE' : 'WILDFIRE_SMOKE';
        sound.playAlarm();
        this.ui.triggerDisasterWarning(this.currentDisaster, Math.ceil(this.crisisTimer));
      }
    } else if (this.crisisPhase === 'WARNING') {
      this.crisisTimer -= delta;
      if (this.crisisTimer <= 0) {
        this.crisisPhase = 'ACTIVE';
        this.disasterDuration = 10.0;
        this.disasters.startDisaster(this.currentDisaster);
        if (this.currentDisaster === 'FLOOD') sound.playThunder();
        this.ui.triggerDisasterStart(this.currentDisaster);
      }
    } else if (this.crisisPhase === 'ACTIVE') {
      this.disasterDuration -= delta;

      if (this.currentDisaster === 'FLOOD') {
        const requiredSponge = 45;
        if (this.spongeCapacity < requiredSponge) {
          const damageRate = (requiredSponge - this.spongeCapacity) * 0.14 * delta;
          this.health = Math.max(0, this.health - damageRate);
        }
      } else if (this.currentDisaster === 'HEATWAVE') {
        const requiredCooling = 25;
        if (this.coolingPower < requiredCooling) {
          const damageRate = (requiredCooling - this.coolingPower) * 0.18 * delta;
          this.health = Math.max(0, this.health - damageRate);
        }
      } else if (this.currentDisaster === 'WILDFIRE_SMOKE') {
        const requiredCleanAir = 18;
        const currentCleanAir = this.coolingPower;
        if (currentCleanAir < requiredCleanAir) {
          const damageRate = (requiredCleanAir - currentCleanAir) * 0.16 * delta;
          this.health = Math.max(0, this.health - damageRate);
        }
      }

      if (this.health <= 0) {
        this.triggerGameOver('İKLİM İFLASI: Aşırı hava olayı kentsel direnç sınırlarını aştı.');
        return;
      }

      if (this.disasterDuration <= 0) {
        this.onDisasterSurvive();
      }
    }

    this.disasters.setSpongeCapacity(this.spongeCapacity);
    if (this.crisisPhase === 'ACTIVE' && this.currentDisaster === 'FLOOD') {
      if (this.scene.setStormAtmosphere) this.scene.setStormAtmosphere(true);
    } else {
      if (this.scene.setStormAtmosphere) this.scene.setStormAtmosphere(false);
    }

    this.disasters.update(
      delta,
      this.scene.sunLight,
      this.scene.hemiLight,
      this.scene.scene.fog,
      this.scene.scene.background
    );
  }

  onDisasterSurvive() {
    this.crisisPhase = 'PEACE';
    this.crisisTimer = 42.0;
    this.disasters.stopDisaster();
    this.scene.resetLighting();
    if (this.scene.setStormAtmosphere) this.scene.setStormAtmosphere(false);

    const reward = 2000;
    this.budget += reward;
    sound.playVictory();
    this.ui.triggerDisasterSuccess(reward);
  }

  triggerVictory() {
    this.isVictory = true;
    sound.playVictory();
    this.ui.showVictory();
  }

  triggerGameOver(reason) {
    this.isGameOver = true;
    this.ui.showGameOver(reason);
  }

  restart() {
    this.budget = 9500;
    this.health = 100.0;
    this.crisisTimer = 38.0;
    this.crisisPhase = 'PEACE';
    this.currentDisaster = null;
    this.isGameOver = false;
    this.isVictory = false;

    this.disasters.stopDisaster();
    this.scene.resetLighting();
    if (this.ui && this.ui.resetRadar) this.ui.resetRadar();
    this.initStarterCity();
  }
}
