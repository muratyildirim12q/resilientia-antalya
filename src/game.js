import * as THREE from 'three';
import { BUILDINGS_CATALOG, HEATMAP_DATA } from './buildings.js';
import { sound } from './audio.js';

export class GameManager {
  constructor(worldScene, grid, buildingManager, disasterSim, ui) {
    this.scene = worldScene;
    this.grid = grid;
    this.bm = buildingManager;
    this.disasters = disasterSim;
    this.ui = ui;

    // Temel Metrikler & Gerçekçi Ekonomi Dengesi
    this.budget = 4800; // Başlangıç bütçesi dengelendi (stratejik kaynak yönetimi)
    this.carbon = 65; // %0 Net-Zero hedefi (0-100)
    this.health = 100.0; // Şehir Direnci (HP) %
    this.spongeCapacity = 0; // m³/s
    this.coolingPower = 0; // -°C
    this.population = 360;
    this.grossIncome = 240; // Brüt belediye vergisi
    this.maintenanceCost = 145; // Yapı & yol bakım giderleri
    this.taxIncome = 95; // Net nakit akışı (Brüt - Bakım)
    this.taxTimer = 5.0;

    this.gameSpeed = 1.0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;

    // Araç Modu: 'BUILD' | 'BULLDOZE' | 'INSPECT' | 'NONE'
    this.toolMode = 'NONE';
    this.selectedCategory = 'roads';
    this.selectedBuildingType = null;
    this.isHeatmapActive = false; // Kentsel Isı Adası (Heatmap) Görünümü

    // Döngüsel Ekonomi & Geri Dönüşüm
    this.recycledAggregate = 0; // Moloz agrega rezervi

    // v5.0 3'lü Ekolojik Savunma Metrikleri (0 - 100%)
    this.zeroWasteRate = 22; // Sıfır Atık Oranı % (Atık İstasyonları, Kompost Tesisi, Temiz Sokaklar)
    this.marineHealth = 35.0; // Deniz & Kıyı Sağlığı % (Arıtma Tesisi, Yüzer Bariyer, Caretta Yuvaları)
    this.marinePollutionDamage = 0; // Sel atıklarının kıyıya verdiği birikimli hasar
    this.airQuality = 35; // İklim & Hava Kalitesi % (Filtreli Bacalar, Dağılmış Smog, Kuru Caddeler)

    // Kriz Savuşturma Durumu
    this.survivedFlood = false;
    this.survivedHeatwave = false;

    // Afet Zamanlayıcısı
    this.crisisTimer = 18.0;
    this.crisisPhase = 'PEACE'; // 'PEACE', 'WARNING', 'ACTIVE'
    this.currentDisaster = null;
    this.nextDisasterType = 'FLOOD';
    this.disasterDuration = 10.0;
    this.emergencyGridProtectionTimer = 0;
    this.emergencyCoolingTimer = 0;

    // v10.0 İnteraktif 3 Adımlı Uygulamalı Öğretici (Onboarding Tutorial)
    this.tutorialActive = true;
    this.tutorialStep = 1;

    // v10.0 Barış Evresi Kentsel Mikro-Olay Motoru (Micro-Events Engine)
    this.microEventTimer = 14.0;
    this.activeMicroEvent = null;
    this.recentMicroEventIds = [];
    this.civicZeroWasteBonus = 0;
    this.civicMarineBonus = 0;
    this.civicSpongeBonus = 0;
    this.civicCoolingBonus = 0;

    // 'R' Tuşu ile 90 Derecelik İnşaat Rotasyonu (0°, 90°, 180°, 270°)
    this.buildRotationStep = 0;
    this.hasCustomRotation = false;

    // Dinamik "Tek Hedef" Sonsuz Görev Sistemi (Dynamic Infinite Mission Engine)
    this.dynamicMissionIndex = 0;
    this.dynamicMissions = [
      {
        id: 'mission_grate_flood',
        title: 'Sel Savunması Hazırlığı',
        desc: 'Sel sularını hızla çekmek için yollara 1 adet Fırtına Mazgalı yerleştirin.',
        category: 'roads',
        targetType: 'drain_grate',
        reward: 200,
        rewardText: '+$200 Hibe',
        check: (g) => g.grid.cells.filter(c => c.occupied && (c.buildingType === 'drain_grate' || c.buildingType === 'coastal_pump') && c.hasRoadAccess).length >= 2
      },
      {
        id: 'mission_shade_avenue',
        title: 'Kentsel Isı Kalkanı',
        desc: 'Hava ısınıyor! Şehre gölge ve serinlik katmak için 1 Ağaçlı Yeşil Bulvar döşeyin.',
        category: 'roads',
        targetType: 'boulevard',
        reward: 250,
        rewardText: '+$250 Hibe',
        check: (g) => g.grid.cells.filter(c => c.occupied && c.buildingType === 'boulevard').length >= 1
      },
      {
        id: 'mission_clean_marine',
        title: 'Mavi Vatan Kıyı Koruması',
        desc: 'Deniz kirleniyor! Kıyı ve arıtma altyapısı için 1 İleri Arıtma Tesisi kurun.',
        category: 'waste',
        targetType: 'water_treatment',
        reward: 400,
        rewardText: '+$400 Hibe',
        check: (g) => g.grid.cells.filter(c => c.occupied && c.buildingType === 'water_treatment').length >= 1
      },
      {
        id: 'mission_sponge_park',
        title: 'Yağmur Parkı Havzası',
        desc: 'Doğal drenajı güçlendirmek için boş bir parsele 1 Yağmur Parkı kurun.',
        category: 'parks',
        targetType: 'sponge_park',
        reward: 250,
        rewardText: '+$250 Hibe',
        check: (g) => g.grid.cells.filter(c => c.occupied && c.buildingType === 'sponge_park').length >= 2
      },
      {
        id: 'mission_solar_farm',
        title: 'Temiz Akdeniz Enerjisi',
        desc: 'Termal dalgalarda trafoları rahatlatmak için 1 Büyük Güneş Tarlası kurun.',
        category: 'parks',
        targetType: 'solar_farm',
        reward: 350,
        rewardText: '+$350 Hibe',
        check: (g) => g.grid.cells.filter(c => c.occupied && c.buildingType === 'solar_farm').length >= 1
      },
      {
        id: 'mission_recycle_legacy',
        title: 'Eski Sanayi Dönüşümü',
        desc: 'Buldozer (Kısayol: X) ile kalan eski kirletici beton tesisleri yıkıp şehri temizleyin.',
        category: 'waste',
        targetType: 'demolish_tool',
        reward: 300,
        rewardText: '+$300 Hibe',
        check: (g) => g.grid.cells.filter(c => c.occupied && c.buildingType === 'legacy_concrete').length === 0
      }
    ];
  }

  getCurrentMission() {
    if (this.tutorialActive) {
      return this.getTutorialInfo();
    }
    // Sonsuz dinamik görevler
    if (!this.dynamicMissions || this.dynamicMissions.length === 0) return null;
    const current = this.dynamicMissions[this.dynamicMissionIndex % this.dynamicMissions.length];
    return {
      step: (this.dynamicMissionIndex % this.dynamicMissions.length) + 1,
      totalSteps: this.dynamicMissions.length,
      title: current.title,
      desc: current.desc,
      rewardText: current.rewardText,
      targetType: current.targetType,
      targetCategory: current.category,
      isDynamic: true
    };
  }

  checkDynamicMissions() {
    if (this.tutorialActive || !this.dynamicMissions) return;
    const current = this.dynamicMissions[this.dynamicMissionIndex % this.dynamicMissions.length];
    if (current && current.check && current.check(this)) {
      this.budget += current.reward;
      const finishedTitle = current.title;
      const finishedReward = current.rewardText;
      this.dynamicMissionIndex++;
      sound.playVictory();
      if (this.ui?.showToast) {
        this.ui.showToast(`Görev Başarıyla Tamamlandı: ${finishedTitle} (${finishedReward})`, 'success');
      }
      if (this.ui?.speakMuratBey) {
        this.ui.speakMuratBey(`Harika iş Sayın Başkan! ${finishedTitle} görevi tamamlandı. Yeni hedef sisteme aktarıldı.`);
      }
    }
  }

  rotatePlacement() {
    this.hasCustomRotation = true;
    this.buildRotationStep = (this.buildRotationStep + 1) % 4;
    return this.buildRotationStep;
  }

  // v11.0 Gelişmiş 5 Adımlı Uygulamalı Öğretici Yönetimi
  getTutorialInfo() {
    if (!this.tutorialActive) return null;
    if (this.tutorialStep === 1) {
      return {
        step: 1,
        totalSteps: 5,
        title: 'Ulaşım Ağı Kurulumu',
        desc: 'İşaretli parsele bir Şehir Yolu (Kısayol: 1) döşeyin.',
        targetCell: { row: 6, col: 8 },
        rewardText: '+$150 Hibe'
      };
    } else if (this.tutorialStep === 2) {
      return {
        step: 2,
        totalSteps: 5,
        title: 'Doğal Taşkın Yatağı',
        desc: 'Açtığınız yolun kenarındaki parsele bir Yağmur Parkı kurun.',
        targetCell: { row: 5, col: 8 },
        rewardText: '+$200 Hibe'
      };
    } else if (this.tutorialStep === 3) {
      return {
        step: 3,
        totalSteps: 5,
        title: 'Döngüsel Kentsel Dönüşüm',
        desc: 'Buldozer (Kısayol: X) ile eski kömürlü beton tesisi yıkıp agrega kazanın.',
        targetCell: { row: 6, col: 9 },
        rewardText: '+$450 İade + 2 Agrega'
      };
    } else if (this.tutorialStep === 4) {
      return {
        step: 4,
        totalSteps: 5,
        title: 'Fırtına Tahliye Savunması',
        desc: 'Sağanak sel sularını hızla çekmek için caddeye bir Fırtına Mazgalı (Kısayol: 3) yerleştirin.',
        targetCell: { row: 7, col: 8 },
        rewardText: '+$200 Hibe'
      };
    } else if (this.tutorialStep === 5) {
      return {
        step: 5,
        totalSteps: 5,
        title: 'AKOM Saha Yönetimi',
        desc: 'Gelen ilk AKOM Saha Bildirimini (Mikro-Karar Kartı) değerlendirin ve kenti yönetin.',
        targetCell: null,
        rewardText: '+$150 Hibe'
      };
    }
    return null;
  }

  updateTutorialTargetBeacon() {
    if (!this.grid) return;
    const info = this.getTutorialInfo();
    if (info && info.targetCell) {
      const cell = this.grid.getCell(info.targetCell.row, info.targetCell.col);
      if (cell) {
        const color = info.step === 3 ? 0xef4444 : (info.step === 2 ? 0x10b981 : (info.step === 4 ? 0x38bdf8 : 0x06b6d4));
        this.grid.setTutorialBeacon(cell, color);
      }
    } else {
      this.grid.hideTutorialBeacon();
    }
  }

  advanceTutorial(completedStep) {
    if (!this.tutorialActive || this.tutorialStep !== completedStep) return;

    if (completedStep === 1) {
      this.budget += 150;
      this.tutorialStep = 2;
      this.updateTutorialTargetBeacon();
      sound.playVictory();
      if (this.ui?.showToast) this.ui.showToast('1. Görev Tamamlandı: Ulaşım Ağı Kuruldu! (+$150 Hibe)', 'success');
      if (this.ui?.speakMuratBey) this.ui.speakMuratBey('Harika başlangıç! Binalar sadece yola cepheli olduğunda elektrik ve su hizmeti üretir.');
    } else if (completedStep === 2) {
      this.budget += 200;
      this.tutorialStep = 3;
      this.updateTutorialTargetBeacon();
      sound.playVictory();
      if (this.ui?.showToast) this.ui.showToast('2. Görev Tamamlandı: Yağmur Parkı Devrede! (+$200 Hibe)', 'success');
      if (this.ui?.speakMuratBey) this.ui.speakMuratBey('Tebrikler! Yağmur parkları sağanak yağışta suyu toprağa emerek caddelerimizi selden korur.');
    } else if (completedStep === 3) {
      this.tutorialStep = 4;
      this.updateTutorialTargetBeacon();
      sound.playVictory();
      if (this.ui?.showToast) this.ui.showToast('3. Görev Tamamlandı: Dönüşüm Başarılı! (+$450 İade, +2 Agrega)', 'success');
      if (this.ui?.speakMuratBey) this.ui.speakMuratBey('Harika! Eski kirleticiyi dönüştürdük. Şimdi sel savunması için caddeye fırtına mazgalı yerleştirin.');
    } else if (completedStep === 4) {
      this.budget += 200;
      this.tutorialStep = 5;
      this.updateTutorialTargetBeacon();
      sound.playVictory();
      if (this.ui?.showToast) this.ui.showToast('4. Görev Tamamlandı: Mazgal Aktif! (+$200 Hibe)', 'success');
      if (this.ui?.speakMuratBey) this.ui.speakMuratBey('Mükemmel! Mazgal sağanakta suyun debisini hızla düşürecek. Şimdi gelen saha bildirimine ilk kararınızı verin.');
      this.triggerMicroEvent('ecology_volunteers');
    } else if (completedStep === 5) {
      this.budget += 150;
      this.tutorialActive = false;
      this.tutorialStep = 0;
      this.isTutorialDismissed = true;
      this.updateTutorialTargetBeacon();
      sound.playVictory();
      if (this.ui?.showToast) this.ui.showToast('İntibak Eğitimi Başarıyla Tamamlandı! (+$150 Hibe)', 'success');
      if (this.ui?.speakMuratBey) this.ui.speakMuratBey('Kutlarım Sayın Başkanım! Tüm saha eğitimini tamamladınız. Artık Antalya iklim direncini bizzat yönetiyorsunuz!');
    }
  }

  advanceCurrentMission() {
    if (this.tutorialActive) {
      const curStep = this.tutorialStep;
      if (curStep < 5) {
        this.completeTutorialStep(curStep);
        if (this.ui?.showToast) this.ui.showToast(`Adım ${curStep} Geçildi -> Sıradaki Adım Açıldı`, 'info');
      } else {
        this.completeTutorialStep(5);
        this.tutorialActive = false;
        this.isTutorialDismissed = true;
        if (this.ui?.showToast) this.ui.showToast('Rehber Kapatıldı — Serbest Kentsel Yönetim Modu', 'success');
      }
    } else if (this.dynamicMissions && this.dynamicMissions.length > 0) {
      this.dynamicMissionIndex = (this.dynamicMissionIndex + 1) % this.dynamicMissions.length;
      const nextM = this.dynamicMissions[this.dynamicMissionIndex];
      sound.playClick();
      if (this.ui?.showToast) this.ui.showToast(`Sıradaki Görev: ${nextM.title}`, 'info');
    }
  }

  skipTutorial() {
    this.tutorialActive = false;
    this.tutorialStep = 0;
    this.isTutorialDismissed = true;
    if (this.grid) this.grid.hideTutorialBeacon();
    if (this.dynamicMissions && this.dynamicMissions.length > 0) {
      this.dynamicMissionIndex = (this.dynamicMissionIndex + 1) % this.dynamicMissions.length;
    }
    if (this.ui?.showToast) this.ui.showToast('Rehber Kapatıldı — Serbest Kentsel Yönetim Modu', 'info');
  }

  // v10.0 Barış Zamanı Kentsel Mikro-Olaylar (Micro-Events Engine)
  getMicroEventCatalog() {
    return [
      {
        id: 'beach_cleanup',
        title: 'Konyaaltı Kıyı Temizliği',
        desc: 'Kıyıda biriken atıklar sel sularıyla denizi kirletebilir.',
        optionA: {
          label: 'Temizlik Ekibi Sevk Et (-$25)',
          cost: 25,
          impact: 'Sıfır Atık +%12, Deniz Sağlığı +%5',
          zeroWasteBonus: 12,
          marineHealthBonus: 5,
          radioSuccess: 'Başkanım, temizlik teknesi körfezi atıklardan arındırdı.'
        },
        optionB: {
          label: 'Görmezden Gel ($0)',
          cost: 0,
          impact: 'Deniz Kirliliği Riski (-%6 Sağlık)',
          marineDamage: 6,
          zeroWasteBonus: -8,
          radioSuccess: 'Kıyı atıkları açığa sürüklendi, su kalitesi düştü.'
        }
      },
      {
        id: 'transformer_heat',
        title: 'Kentsel Trafo Soğutması',
        desc: 'Aşırı klima yükü ana dağıtım trafosunu ısıtıyor.',
        optionA: {
          label: 'Mobil Soğutucu Kur (-$30)',
          cost: 30,
          impact: 'Trafo Korunur, Karbon -%3',
          carbonBonus: -3,
          healthBonus: 2,
          radioSuccess: 'Trafo soğutuldu, şebeke normale döndü.'
        },
        optionB: {
          label: 'Müdahale Etme ($0)',
          cost: 0,
          impact: 'Şebeke Arıza Riski (-%2 Direnç)',
          healthBonus: -2,
          radioSuccess: 'Trafo ısısı yüksek, sıcak dalgasında risk sürüyor.'
        }
      },
      {
        id: 'ecology_volunteers',
        title: 'Ekoloji Kulübü Gönüllüleri',
        desc: 'Gönüllü öğrenciler yağmur parklarına hendek açmak istiyor.',
        optionA: {
          label: 'Fidan ve Gereç Sağla (-$15)',
          cost: 15,
          impact: 'Taşkın Tutma +4 m³/s, Isı -1°C',
          spongeBonus: 4,
          coolingBonus: 1,
          radioSuccess: 'Gençlerin desteğiyle yağmur parkı kapasitesi arttı.'
        },
        optionB: {
          label: 'Teşekkür Edip Geri Çevir ($0)',
          cost: 0,
          impact: 'Değişiklik Yok',
          radioSuccess: 'Gönüllü talebi arşive alındı.'
        }
      },
      {
        id: 'cliff_erosion',
        title: 'Falez Kıyı Tahkimatı',
        desc: 'Dalgalar falez tabanını aşındırıyor.',
        optionA: {
          label: 'Kaya Tahkimatı Dök (-$40)',
          cost: 40,
          impact: 'Şehir Direnci +%8 HP',
          healthBonus: 8,
          radioSuccess: 'Falez tahkim edildi, kıyı güvenliği sağlandı.'
        },
        optionB: {
          label: 'Erozyonu İzlemeye Al ($0)',
          cost: 0,
          impact: 'Kıyı Direnci Zayıflar (-%4 HP)',
          healthBonus: -4,
          radioSuccess: 'Falez aşınması kayda geçti, risk devam ediyor.'
        }
      }
    ];
  }

  triggerMicroEvent(forcedId = null) {
    if (this.activeMicroEvent || this.crisisPhase !== 'PEACE' || (this.tutorialActive && this.tutorialStep !== 5)) return;

    const catalog = this.getMicroEventCatalog();
    let candidates = catalog.filter(e => !this.recentMicroEventIds.includes(e.id));
    if (candidates.length === 0) {
      this.recentMicroEventIds = [];
      candidates = catalog;
    }

    const event = forcedId ? catalog.find(e => e.id === forcedId) : candidates[Math.floor(Math.random() * candidates.length)];
    if (!event) return;

    this.activeMicroEvent = {
      ...event,
      timeLeft: 10.0,
      totalTime: 10.0
    };
    this.recentMicroEventIds.push(event.id);
    if (this.recentMicroEventIds.length > 2) this.recentMicroEventIds.shift();

    sound.playRadioBeep();
    if (this.ui?.showMicroEvent) {
      this.ui.showMicroEvent(this.activeMicroEvent);
    }
  }

  resolveMicroEvent(optionIndex = 0) {
    if (!this.activeMicroEvent) return false;

    const event = this.activeMicroEvent;
    const opt = optionIndex === 0 ? event.optionA : event.optionB;

    if (opt.cost > 0) {
      if (this.budget < opt.cost) {
        if (this.ui?.showToast) this.ui.showToast(`Yetersiz Bütçe! ($${opt.cost} gerekli)`, 'error');
        return false;
      }
      this.budget -= opt.cost;
    }

    if (opt.zeroWasteBonus) {
      this.civicZeroWasteBonus = (this.civicZeroWasteBonus || 0) + opt.zeroWasteBonus;
      this.zeroWasteRate = Math.min(100, Math.max(10, this.zeroWasteRate + opt.zeroWasteBonus));
    }
    if (opt.marineHealthBonus) {
      this.civicMarineBonus = (this.civicMarineBonus || 0) + opt.marineHealthBonus;
      this.marineHealth = Math.min(100, Math.max(10, this.marineHealth + opt.marineHealthBonus));
    }
    if (opt.marineDamage) {
      this.marinePollutionDamage = Math.min(30, (this.marinePollutionDamage || 0) + opt.marineDamage);
      this.marineHealth = Math.max(5, this.marineHealth - opt.marineDamage);
    }
    if (opt.spongeBonus) {
      this.civicSpongeBonus = (this.civicSpongeBonus || 0) + opt.spongeBonus;
      this.spongeCapacity += opt.spongeBonus;
    }
    if (opt.coolingBonus) {
      this.civicCoolingBonus = (this.civicCoolingBonus || 0) + opt.coolingBonus;
      this.coolingPower += opt.coolingBonus;
    }
    if (opt.carbonBonus) {
      this.carbon = Math.max(0, Math.min(100, this.carbon + opt.carbonBonus));
    }
    if (opt.healthBonus) {
      this.health = Math.min(100, Math.max(1, this.health + opt.healthBonus));
    }

    this.recalculateMetrics();
    this.checkVictoryConditions();

    if (optionIndex === 0) {
      sound.playPlace();
      if (event.id === 'beach_cleanup' && this.scene?.triggerCleaningBoat) {
        this.scene.triggerCleaningBoat(this);
      }
    } else {
      sound.playClick();
    }

    if (this.ui?.showToast) {
      this.ui.showToast(`Karar Uygulandı: ${opt.label}`, 'info');
    }
    if (this.ui?.speakMuratBey && opt.radioSuccess) {
      this.ui.speakMuratBey(opt.radioSuccess);
    }

    this.activeMicroEvent = null;
    this.microEventTimer = 16.0 + Math.random() * 6.0;

    // v11.0 5. Adım: İlk AKOM Saha Kararı Tamamlanınca Öğretici Biter
    if (this.tutorialActive && this.tutorialStep === 5) {
      this.advanceTutorial(5);
    }

    if (this.ui?.hideMicroEvent) {
      this.ui.hideMicroEvent();
    }
    return true;
  }

  // v9.0 Canlı Kentsel Kriz Teşhis Telemetrisi (Live Diagnostic HUD)
  getDisasterTelemetry() {
    const cells = this.grid?.cells || [];
    const activeGrates = cells.filter(c => c.occupied && (c.buildingType === 'drain_grate' || c.buildingType === 'coastal_pump') && c.hasRoadAccess).length;
    const solarCount = cells.filter(c => c.occupied && (c.buildingType === 'solar_farm' || c.hasSolarKit) && c.hasRoadAccess).length;
    const biogasCount = cells.filter(c => c.occupied && c.buildingType === 'biogas_plant' && c.hasRoadAccess).length;
    const cleanPower = solarCount * 15 + biogasCount * 25;
    const coolingDemand = 30;
    const shadedAvenues = cells.filter(c => c.occupied && (c.buildingType === 'boulevard' || c.buildingType === 'botanical_plaza' || c.buildingType === 'wind_corridor') && c.hasRoadAccess).length;
    const smokeableCells = cells.filter(c => c.occupied && !c.isRoad && (c.buildingType === 'legacy_concrete' || c.buildingType === 'eco_house' || c.buildingType === 'green_roof' || c.buildingType === 'commercial_hub'));
    const filteredCount = smokeableCells.filter(c => c.hasChimneyFilter).length;
    const grateEfficiency = this.zeroWasteRate >= 50 ? 1.0 : 0.45;
    const drainRate = Number((activeGrates * 0.038 * grateEfficiency).toFixed(2));
    const effectiveCooling = this.coolingPower + (this.emergencyCoolingTimer > 0 ? 8 : 0);

    return {
      activeGrates,
      requiredGrates: 4,
      drainRate,
      spongeCapacity: this.spongeCapacity,
      requiredSponge: 45,
      zeroWasteRate: this.zeroWasteRate,
      clogRisk: this.zeroWasteRate < 50 ? 'YÜKSEK' : 'DÜŞÜK',
      cleanPower,
      coolingDemand,
      gridDeficit: Math.max(0, coolingDemand - cleanPower),
      coolingPower: effectiveCooling,
      requiredCooling: 25,
      shadedAvenues,
      requiredAvenues: 2,
      filteredCount,
      totalSmokeable: smokeableCells.length,
      emergencyGridProtected: this.emergencyGridProtectionTimer > 0,
      emergencyCoolingActive: this.emergencyCoolingTimer > 0
    };
  }

  // v9.0 Taktiksel Acil Durum Müdahale Protokolleri (Emergency Actions)
  executeEmergencyAction(actionId) {
    if (this.crisisPhase !== 'ACTIVE' && this.crisisPhase !== 'WARNING') return false;

    if (actionId === 'sluice_gates') {
      // Falez Deşarj Savaklarını Aç: Suyu anında 10cm düşürür ve süreyi kısaltır, deniz sağlığı %5 düşer
      if (this.disasters && this.disasters.waterMesh) {
        this.disasters.waterMesh.position.y = Math.max(0.05, this.disasters.waterMesh.position.y - 0.12);
      }
      this.disasterDuration = Math.max(1.5, this.disasterDuration - 10.0);
      this.marinePollutionDamage = Math.min(30, (this.marinePollutionDamage || 0) + 5.0);
      this.recalculateMetrics();
      if (sound.playConstruction) sound.playConstruction();
      if (this.ui?.showToast) this.ui.showToast('Falez Acil Deşarj Savakları Açıldı! Su seviyesi hızla düşüyor (-5% Kıyı Sağlığı).', 'warning');
      if (this.ui?.speakMuratBey) this.ui.speakMuratBey('Merkez, falez deşarj savakları tam kapasite açıldı. Taşkın suyu denize tahliye ediliyor.');
      return true;
    } else if (actionId === 'vacuum_truck') {
      // Acil Vidanjör Sevk Et ($40): Tıkanıklığı açar, sıfır atık oranına geçici destek verir ve suyu çeker
      if (this.budget < 40) {
        if (this.ui?.showToast) this.ui.showToast('Yetersiz Bütçe! Vidanjör sevki için $40 gerekli.', 'error');
        return false;
      }
      this.budget -= 40;
      this.zeroWasteRate = Math.min(100, this.zeroWasteRate + 25);
      if (this.disasters && this.disasters.waterMesh) {
        this.disasters.waterMesh.position.y = Math.max(0.05, this.disasters.waterMesh.position.y - 0.08);
      }
      this.disasterDuration = Math.max(1.0, this.disasterDuration - 8.0);
      if (sound.playConstruction) sound.playConstruction();
      if (this.ui?.showToast) this.ui.showToast('Acil Vidanjör Ekibi Mazgalları Açtı! (-$40)', 'success');
      return true;
    } else if (actionId === 'grid_protect') {
      // Acil Şebeke Koruması: Trafoları korur, elektrik kesintisini önler, 20 sn vergi geliri %50 azalır
      this.emergencyGridProtectionTimer = 20.0;
      this.isGridBlackout = false;
      if (sound.playClick) sound.playClick();
      if (this.ui?.showToast) this.ui.showToast('Acil Şebeke Koruması Devrede! Trafolar koruma altına alındı (20s gelir kısıtlaması).', 'info');
      if (this.ui?.speakMuratBey) this.ui.speakMuratBey('Merkez, yük tevzi şebeke koruması devreye alındı. Trafo arkları durduruldu.');
      return true;
    } else if (actionId === 'mist_fountains') {
      // Kentsel Sisleme Fıskiyeleri ($60): Geçici +8°C soğutma sağlar
      if (this.budget < 60) {
        if (this.ui?.showToast) this.ui.showToast('Yetersiz Bütçe! Sisleme fıskiyeleri için $60 gerekli.', 'error');
        return false;
      }
      this.budget -= 60;
      this.emergencyCoolingTimer = 20.0;
      this.health = Math.min(100, this.health + 5.0);
      if (sound.playConstruction) sound.playConstruction();
      if (this.ui?.showToast) this.ui.showToast('Kentsel Sisleme Fıskiyeleri Tam Güç Açıldı! (+8°C Soğutma, -$60)', 'success');
      return true;
    }
    return false;
  }

  // v11.1 Saha Temizlik Görevleri: Deniz & Kıyı Temizliği (Güneş Enerjili Katamaran)
  dispatchSeaCleanup() {
    const cost = 30;
    if (this.budget < cost) {
      if (this.ui?.showToast) this.ui.showToast(`Yetersiz Bütçe! Temizlik teknesi için $${cost} gerekli.`, 'error');
      return false;
    }
    this.budget -= cost;
    this.marineHealth = Math.min(100, Math.max(10, (this.marineHealth || 35) + 15));
    this.civicMarineBonus = (this.civicMarineBonus || 0) + 15;
    this.marinePollutionDamage = 0;
    if (this.scene && typeof this.scene.triggerCleaningBoat === 'function') {
      this.scene.triggerCleaningBoat(this);
    }
    this.recalculateMetrics();
    if (sound.playConstruction) sound.playConstruction();
    if (this.ui?.showToast) this.ui.showToast(`Güneş Enerjili Temizlik Teknesi Sevk Edildi! (-$${cost}) Deniz Sağlığı: %${Math.round(this.marineHealth)}`, 'success');
    if (this.ui?.speakMuratBey) this.ui.speakMuratBey('Güneş enerjili katamaran körfeze açıldı. Kıyı ve deniz atıkları toplanıyor.');
    return true;
  }

  // v11.1 / v11.2 Saha Temizlik Görevleri: Sokak Atıklarını Toplama Ekipleri
  dispatchStreetWasteCleanup() {
    const cost = 25;
    if (this.budget < cost) {
      if (this.ui?.showToast) this.ui.showToast(`Yetersiz Bütçe! Atık ekipleri için $${cost} gerekli.`, 'error');
      return false;
    }
    if (this.scene?.garbageTruck?.active) {
      if (this.ui?.showToast) this.ui.showToast('Sokak çöp kamyonu ve temizlik ekibi şu an sahada görev yapıyor!', 'warning');
      return false;
    }
    this.budget -= cost;
    this.zeroWasteRate = Math.min(100, Math.max(10, (this.zeroWasteRate || 22) + 20));
    this.civicZeroWasteBonus = (this.civicZeroWasteBonus || 0) + 20;
    if (this.scene && typeof this.scene.triggerGarbageTruck === 'function') {
      this.scene.triggerGarbageTruck(this);
    }
    this.recalculateMetrics();
    if (sound.playConstruction) sound.playConstruction();
    if (this.ui?.showToast) this.ui.showToast(`Sokak Çöp Kamyonu ve 2 Görevli Sevk Edildi! (-$${cost})`, 'success');
    if (this.ui?.speakMuratBey) this.ui.speakMuratBey('Belediye çöp kamyonu ve saha görevlilerimiz mahalledeki tüm atıkları toplamaya başladı.');
    return true;
  }

  getBuildRotationAngle() {
    return (this.buildRotationStep * Math.PI) / 2;
  }

  resetBuildRotation() {
    this.buildRotationStep = 0;
    this.hasCustomRotation = false;
  }

  // Elektrostatik Baca Filtresi Yükseltmesi ($80)
  installChimneyFilter(cell) {
    if (!cell || !cell.occupied) return false;
    if (cell.hasChimneyFilter) return false;
    const canSmoke =
      cell.buildingType === 'legacy_concrete' ||
      cell.buildingType === 'eco_house' ||
      cell.buildingType === 'green_roof' ||
      cell.buildingType === 'commercial_hub';
    if (!canSmoke) return false;

    if (this.budget < 80) {
      if (this.ui && this.ui.showToast) {
        this.ui.showToast('Yetersiz Bütçe! ($80 gerekli)', 'error');
      }
      return false;
    }

    this.budget -= 80;
    cell.hasChimneyFilter = true;
    this.recalculateMetrics();
    this.checkVictoryConditions();
    sound.playFilterInstall();

    if (this.ui && this.ui.showToast) {
      this.ui.showToast('Elektrostatik Baca Filtresi Takıldı! (-%80 Karbon, Duman Kesildi)', 'success');
    }
    const msg = 'Merkez, elektrostatik filtre montajı tamamlandı. Baca emisyonu kesildi, hava kalitesi yükseliyor.';
    if (this.ui && this.ui.speakMuratBey) {
      this.ui.speakMuratBey(msg);
    } else if (this.ui && this.ui.speakAURA) {
      this.ui.speakAURA(msg);
    }
    return true;
  }

  // 1. Eco House: Çatı Yağmur Hasadı Deposu ($60) — Taşkın akıntısını azaltır
  installRainHarvest(cell) {
    if (!cell || !cell.occupied || cell.buildingType !== 'eco_house') return false;
    if (cell.hasRainHarvest) return false;

    if (this.budget < 60) {
      if (this.ui && this.ui.showToast) {
        this.ui.showToast('Yetersiz Bütçe! ($60 gerekli)', 'error');
      }
      return false;
    }

    this.budget -= 60;
    cell.hasRainHarvest = true;
    this.recalculateMetrics();
    this.checkVictoryConditions();
    sound.playFilterInstall();

    if (this.ui && this.ui.showToast) {
      this.ui.showToast('Çatı Yağmur Hasadı Deposu Takıldı! (+4 m³/s Taşkın Tutma)', 'success');
    }
    return true;
  }

  // 2. Green Roof: Balkon Güneş Paneli Kiti ($100) — Düzenli pasif gelir üretir
  installSolarKit(cell) {
    if (!cell || !cell.occupied || cell.buildingType !== 'green_roof') return false;
    if (cell.hasSolarKit) return false;

    if (this.budget < 100) {
      if (this.ui && this.ui.showToast) {
        this.ui.showToast('Yetersiz Bütçe! ($100 gerekli)', 'error');
      }
      return false;
    }

    this.budget -= 100;
    cell.hasSolarKit = true;
    this.recalculateMetrics();
    this.checkVictoryConditions();
    sound.playFilterInstall();

    if (this.ui && this.ui.showToast) {
      this.ui.showToast('Balkon Güneş Paneli Kiti Takıldı! (+$35/5s Gelir, -2% Karbon)', 'success');
    }
    return true;
  }

  // 3. Sponge Park: Derin Biyo-Drenaj Hendekleri ($120) — Drenaj kapasitesini ikiye katlar
  installBioDrain(cell) {
    if (!cell || !cell.occupied || cell.buildingType !== 'sponge_park') return false;
    if (cell.hasBioDrain) return false;

    if (this.budget < 120) {
      if (this.ui && this.ui.showToast) {
        this.ui.showToast('Yetersiz Bütçe! ($120 gerekli)', 'error');
      }
      return false;
    }

    this.budget -= 120;
    cell.hasBioDrain = true;
    this.recalculateMetrics();
    this.checkVictoryConditions();
    sound.playFilterInstall();

    if (this.ui && this.ui.showToast) {
      this.ui.showToast('Derin Biyo-Drenaj Hendekleri Kuruldu! (2x Drenaj: +22 m³/s)', 'success');
    }
    return true;
  }

  // 4. Commercial Hub: Sıfır Atık Kompaktörü ($90) — Sokak atık taşmasını engeller
  installWasteCompactor(cell) {
    if (!cell || !cell.occupied || cell.buildingType !== 'commercial_hub') return false;
    if (cell.hasWasteCompactor) return false;

    if (this.budget < 90) {
      if (this.ui && this.ui.showToast) {
        this.ui.showToast('Yetersiz Bütçe! ($90 gerekli)', 'error');
      }
      return false;
    }

    this.budget -= 90;
    cell.hasWasteCompactor = true;
    this.recalculateMetrics();
    this.checkVictoryConditions();
    sound.playFilterInstall();

    if (this.ui && this.ui.showToast) {
      this.ui.showToast('Sıfır Atık Kompaktörü Kuruldu! (+15% Sıfır Atık, Atık Taşması Engellendi)', 'success');
    }
    return true;
  }

  upgradeBuilding(cell, type = null) {
    if (!cell || !cell.occupied) return false;
    if (type === 'rain_harvest' || type === 'rainharvest' || cell.buildingType === 'eco_house') return this.installRainHarvest(cell);
    if (type === 'solar_kit' || type === 'solarkit' || cell.buildingType === 'green_roof') return this.installSolarKit(cell);
    if (type === 'bio_drain' || type === 'biodrain' || cell.buildingType === 'sponge_park') return this.installBioDrain(cell);
    if (type === 'waste_compactor' || type === 'wastecompactor' || cell.buildingType === 'commercial_hub') return this.installWasteCompactor(cell);
    if (type === 'chimney_filter' || type === 'filter' || cell.buildingType === 'factory_old') return this.installChimneyFilter(cell);
    return false;
  }

  get activeTool() {
    if (this.toolMode === 'NONE' || !this.toolMode) return null;
    if (this.toolMode === 'BULLDOZE') return 'bulldoze';
    return this.selectedBuildingType;
  }

  set activeTool(val) {
    if (!val || val === 'NONE') {
      this.setToolMode('NONE');
    } else if (val === 'BULLDOZE' || val === 'bulldoze') {
      this.setToolMode('BULLDOZE');
    } else {
      this.selectBuildingType(val);
    }
  }

  setToolMode(mode) {
    this.toolMode = mode;
    this.resetBuildRotation();
    if (mode === 'NONE' || !mode) {
      this.selectedBuildingType = null;
      this.grid.setZoningOverlayVisible(false);
      this.grid.clearHighlight();
    } else {
      this.grid.setZoningOverlayVisible(mode === 'BUILD' || mode === 'BULLDOZE');
    }
    sound.playClick();
  }

  selectBuildingType(typeId) {
    if (!BUILDINGS_CATALOG[typeId]) return;
    this.resetBuildRotation();
    this.selectedBuildingType = typeId;
    this.selectedCategory = BUILDINGS_CATALOG[typeId].category;
    this.toolMode = 'BUILD';
    this.grid.setZoningOverlayVisible(true);
    sound.playClick();
  }

  // 3B "Yol Bağlantısı Yok" Uyarı Rozeti Oluşturucu (SimCity / Skylines Tarzı 3D Billboard)
  createNoRoadBadge() {
    if (typeof document === 'undefined') {
      const sprite = new THREE.Sprite();
      sprite.scale.set(1.4, 1.4, 1.4);
      return sprite;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Dairesel Kırmızı-Turuncu Uyarı Zemin
    ctx.beginPath();
    ctx.arc(64, 64, 54, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();

    // Ünlem İkonu
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 64, 52);

    // "YOL YOK" Yazısı
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText('YOL YOK', 64, 94);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.4, 1.4, 1.4);
    return sprite;
  }

  // Şehirdeki Tüm Parsellerin Yola Cephe Şartını Denetle
  recalculateRoadAccess() {
    let newlyConnected = 0;
    let newlyDisconnected = 0;

    this.grid.cells.forEach((cell) => {
      if (!cell.occupied || !cell.building) return;

      if (cell.isRoad || cell.buildingType === 'marine_barrier' || cell.buildingType === 'sea_breakwater') {
        cell.hasRoadAccess = true;
        if (cell.noRoadBadge) {
          cell.building.remove(cell.noRoadBadge);
          if (cell.noRoadBadge.material.map) cell.noRoadBadge.material.map.dispose();
          cell.noRoadBadge.material.dispose();
          cell.noRoadBadge = null;
        }
        return;
      }

      const hasRoad = this.grid.hasRoadAccess(cell.row, cell.col);
      const hadRoad = cell.hasRoadAccess !== false;

      cell.hasRoadAccess = hasRoad;

      if (!hasRoad) {
        if (!cell.noRoadBadge) {
          const badge = this.createNoRoadBadge();
          let h = 2.4;
          if (cell.building) {
            const bBox = new THREE.Box3().setFromObject(cell.building);
            if (!Number.isNaN(bBox.max.y) && Number.isFinite(bBox.max.y)) {
              h = Math.max(2.4, (bBox.max.y - cell.building.position.y) + 0.65);
            }
          }
          badge.userData.baseY = h;
          badge.position.set(0, h, 0);
          cell.building.add(badge);
          cell.noRoadBadge = badge;
          if (hadRoad) newlyDisconnected++;
        }
      } else {
        if (cell.noRoadBadge) {
          cell.building.remove(cell.noRoadBadge);
          if (cell.noRoadBadge.material.map) cell.noRoadBadge.material.map.dispose();
          cell.noRoadBadge.material.dispose();
          cell.noRoadBadge = null;
          newlyConnected++;
        }
      }
    });

    return { newlyConnected, newlyDisconnected };
  }

  // Tüm Şehir Metriklerini ve Bütçe / Bakım Gideri Dengesini Hesapla
  recalculateMetrics() {
    let pop = 0;
    let sponge = 0;
    let cooling = 0;
    let gross = 0;
    let maintenance = 0;
    let netZeroDelta = 0;
    let zeroWastePower = 0;
    let marinePower = 0;

    this.grid.cells.forEach((cell) => {
      if (!cell.occupied || !cell.buildingType) return;
      const spec = BUILDINGS_CATALOG[cell.buildingType];
      if (!spec) return;

      // Bakım gideri: Şehirde var olan her yapı ve yol düzenli bakım masrafı üretir
      maintenance += (spec.maintenance || 0);

      // Sadece yola bağlı binalar ve yollar hizmet üretir (marine_barrier ve sea_breakwater açık denizde çalışır)
      if (cell.hasRoadAccess || cell.isRoad || cell.buildingType === 'marine_barrier' || cell.buildingType === 'sea_breakwater') {
        pop += (spec.population || 0);

        let cellSponge = (spec.spongePower || 0);
        let cellGross = (spec.income || 0);
        let cellCarbon = (spec.carbon || 0);
        let cellZeroWaste = (spec.zeroWastePower || 0);

        // Bina Yükseltmeleri Etkisi:
        if (cell.hasRainHarvest) {
          cellSponge += 4; // Çatı Yağmur Hasadı Deposu ($60) taşkın tutmayı artırır
        }
        if (cell.hasSolarKit) {
          cellGross += 35; // Balkon Güneş Paneli Kiti ($100) pasif gelir üretir
          cellCarbon -= 2; // Temiz güneş enerjisi karbonu düşürür
        }
        if (cell.hasBioDrain) {
          cellSponge += (spec.spongePower || 0); // Derin Biyo-Drenaj Hendekleri ($120) drenaj debisini 2 katına çıkarır
        }
        if (cell.hasWasteCompactor) {
          cellZeroWaste += 15; // Sıfır Atık Kompaktörü ($90) sokak çöpü taşmasını önler
        }

        sponge += cellSponge;
        cooling += (spec.coolingPower || 0);
        gross += cellGross;
        zeroWastePower += cellZeroWaste;
        marinePower += (spec.marineHealthPower || 0);

        if (cell.hasChimneyFilter) {
          if (cellCarbon > 0) {
            cellCarbon = Math.round(cellCarbon * 0.2); // %80 reduction!
          } else {
            cellCarbon -= 4; // Clean filtered air bonus
          }
        }
        netZeroDelta += cellCarbon;
      } else if (spec.isLegacy || (spec.carbon && spec.carbon > 0)) {
        // Eski kirletici tesisler yol bağlantısı kopsa dahi şehri kirletmeye devam eder!
        let carbonVal = (spec.carbon || 0);
        if (cell.hasChimneyFilter && carbonVal > 0) {
          carbonVal = Math.round(carbonVal * 0.2); // %80 reduction!
        }
        netZeroDelta += carbonVal;
      }
    });

    this.population = pop;
    this.spongeCapacity = sponge + (this.civicSpongeBonus || 0);
    this.coolingPower = cooling + (this.civicCoolingBonus || 0);
    this.grossIncome = gross;
    this.maintenanceCost = maintenance;
    this.taxIncome = gross - maintenance; // Net bütçe nakit akışı

    // Baz karbon seviyesi (65%) + binaların karbon dengesi
    this.carbon = Math.max(0, Math.min(100, 65 + netZeroDelta));

    // v5.0 3'lü Ekolojik Savunma Metrikleri
    // 1. Sıfır Atık Oranı (%): Baz %22 + Atık İstasyonu (+20%) + Biyogaz Tesisi (+40%) + Kentsel Karar Desteği
    this.zeroWasteRate = Math.min(100, Math.max(10, 22 + zeroWastePower + (this.civicZeroWasteBonus || 0)));

    // 2. Deniz & Kıyı Sağlığı (%): Baz %35 + Biyolojik İleri Arıtma (+45%) + Yüzer Bariyer (+25%) + Sıfır Atık Bonusu + Doğal Drenaj - Afet Çöp Hasarı + Kentsel Karar Desteği
    let wasteBonus = 0;
    if (this.zeroWasteRate >= 75) wasteBonus = 15;
    else if (this.zeroWasteRate < 40) wasteBonus = -10;

    let spongeBonus = 0;
    if (this.spongeCapacity >= 45) spongeBonus = 10;
    else if (this.spongeCapacity >= 20) spongeBonus = 5;

    this.marineHealth = Math.min(100, Math.max(10, 35 + marinePower + wasteBonus + spongeBonus - (this.marinePollutionDamage || 0) + (this.civicMarineBonus || 0)));

    // 3. İklim & Hava Kalitesi (%): Net-Zero karbon dengesi ve kentsel serinletme
    this.airQuality = Math.max(0, Math.min(100, Math.round(100 - this.carbon)));
  }

  // Başlangıçta 20x14 Cities: Skylines Şehir Ağı ve İlk Mahalle Kurulumu
  initStarterCity() {
    this.grid.reset();

    // Başlangıç Metriklerini Sıfırla
    this.spongeCapacity = 0;
    this.coolingPower = 0;
    this.civicZeroWasteBonus = 0;
    this.civicMarineBonus = 0;
    this.civicSpongeBonus = 0;
    this.civicCoolingBonus = 0;
    this.population = 0;
    this.grossIncome = 0;
    this.maintenanceCost = 0;
    this.taxIncome = 0;
    this.recycledAggregate = 0;
    this.zeroWasteRate = 22;
    this.marineHealth = 35.0;
    this.marinePollutionDamage = 0;
    this.airQuality = 35;
    this.survivedFlood = false;
    this.survivedHeatwave = false;

    // 1. Ana Doğu-Batı Sahil Bulvarı (row = 7, 20 sütun boyunca, otoyollara doğrudan bağlı)
    for (let c = 0; c < this.grid.cols; c++) {
      this.placeFreeAt(7, c, (c >= 8 && c <= 11) ? 'boulevard' : 'road', false);
    }

    // 2. Küçük Başlangıç Kasabası Merkez Sokak Halkası (row = 4..9, col = 6..12)
    for (let c = 6; c <= 12; c++) {
      this.placeFreeAt(4, c, 'road', false);
      this.placeFreeAt(9, c, 'road', false);
    }
    for (let r = 5; r <= 8; r++) {
      if (r !== 7) {
        this.placeFreeAt(r, 6, 'road', false);
        this.placeFreeAt(r, 12, 'road', false);
      }
    }

    // 3. Küçük ve Şirin Başlangıç Şehri (Promenade / yürüyüş yolunda sıfır bina, büyümeye açık merkez mahalle)
    const starterBuildings = [
      // Merkez Mahalle Konut ve Ticaret Çekirdeği
      [5, 7, 'eco_house'],
      [5, 10, 'eco_house'],
      [5, 11, 'commercial_hub'],
      [6, 7, 'eco_house'],
      [6, 9, 'legacy_concrete'], // TUTORIAL STEP 3 HEDEFİ
      [6, 10, 'eco_house'],
      [6, 11, 'green_roof'],
      [8, 7, 'legacy_concrete'],
      [8, 8, 'eco_house'],
      [8, 9, 'sponge_park'],
      [8, 10, 'eco_house'],
      [8, 11, 'commercial_hub']
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

    // Yola cephe ve metrik durumunu hesapla
    this.recalculateRoadAccess();
    this.recalculateMetrics();
    this.updateTutorialTargetBeacon();
  }

    getThermalMaterial(colorHex) {
    if (!this.thermalMatCache) this.thermalMatCache = new Map();
    if (!this.thermalMatCache.has(colorHex)) {
      this.thermalMatCache.set(
        colorHex,
        new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: 0.55,
          roughness: 0.35,
          metalness: 0.1
        })
      );
    }
    return this.thermalMatCache.get(colorHex);
  }

  // Kentsel Isı Adası (Thermal Heatmap) Uygulama ve Geri Alma
  applyCellHeatmap(cell) {
    if (!this.isHeatmapActive || !cell || !cell.occupied || !cell.building) return;
    const heat = HEATMAP_DATA[cell.buildingType] || { temp: 32, color: 0xeab308 };
    const thermalMat = this.getThermalMaterial(heat.color);
    cell.building.traverse((c) => {
      if (c.isMesh) {
        if (!c.userData.originalMat) c.userData.originalMat = c.material;
        c.material = thermalMat;
      }
    });
  }

  restoreCellHeatmap(cell) {
    if (!cell || !cell.occupied || !cell.building) return;
    cell.building.traverse((c) => {
      if (c.isMesh && c.userData.originalMat) {
        c.material = c.userData.originalMat;
        delete c.userData.originalMat;
      }
    });
  }

  toggleHeatmap() {
    this.isHeatmapActive = !this.isHeatmapActive;
    if (this.isHeatmapActive) {
      this.grid.cells.forEach((cell) => {
        if (cell.occupied && cell.building) {
          this.applyCellHeatmap(cell);
        }
      });
      // Termal kontrast gökyüzü ve atmosfer
      this.scene.scene.background.setHex(0x0f172a);
      this.scene.scene.fog.color.setHex(0x0f172a);
      this.scene.scene.fog.density = 0.006;
      this.scene.sunLight.intensity = 1.2;
      this.scene.hemiLight.intensity = 0.4;
    } else {
      this.grid.cells.forEach((cell) => {
        if (cell.occupied && cell.building) {
          this.restoreCellHeatmap(cell);
        }
      });
      this.scene.resetLighting();
    }
    sound.playClick();
    if (this.ui && this.ui.onHeatmapToggle) {
      this.ui.onHeatmapToggle(this.isHeatmapActive);
    }
    return this.isHeatmapActive;
  }

  placeFreeAt(row, col, typeId, animate = false) {
    const cell = this.grid.getCell(row, col);
    const spec = BUILDINGS_CATALOG[typeId];
    if (!cell || !spec || cell.occupied) return;

    cell.occupied = true;
    cell.isRoad = Boolean(spec.isRoad);
    cell.buildingType = spec.id;
    if (cell.emptyPadGroup) cell.emptyPadGroup.visible = false;

    if (cell.isRoad) {
      this.refreshRoadCell(row, col);
    } else {
      const facing = this.grid.getRoadFacingAngle(row, col);
      const mesh = this.bm.createBuilding(spec.id, cell.variantSeed, facing);
      mesh.position.set(cell.x, 0.36, cell.z);
      this.scene.scene.add(mesh);
      cell.building = mesh;
      if (this.isHeatmapActive) this.applyCellHeatmap(cell);
      if (animate) this.bm.animateSpawn(mesh, 340, cell.x, cell.z);
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
    if (cell.hasCustomRotation && typeof cell.rotationAngle === 'number') {
      roadMesh.rotation.y = cell.rotationAngle;
    }
    this.scene.scene.add(roadMesh);
    cell.building = roadMesh;
    if (this.isHeatmapActive) this.applyCellHeatmap(cell);
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
        if (!cell.hasCustomRotation) {
          cell.building.rotation.y = this.grid.getRoadFacingAngle(r, c);
        }
      }
    });
  }

  // Hücre Üzerinde Etkileşim (İnşaat / Yıkım / İnceleme / Boş Tıklama Güvenliği)
  handleCellAction(cell, isDrag = false) {
    if (!cell || this.isGameOver || this.isVictory || this.toolMode === 'NONE' || !this.toolMode) {
      return false;
    }

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
    if (this.isGameOver || this.isVictory || !cell || this.toolMode !== 'BUILD') return false;

    const spec = BUILDINGS_CATALOG[this.selectedBuildingType];
    if (!spec || spec.isTool || spec.isLegacy) return false;

    // Sürükleyerek inşa etme sadece yollar için aktiftir
    if (isDrag && !spec.isRoad) return false;

    // Eğer parsel doluysa
    if (cell.occupied) {
      // Normal asfalt yolu Yeşil Bulvar, Eko-Cadde veya Fırtına Mazgalına yükseltmeye / entegre etmeye izin ver
      if (cell.isRoad && (spec.isRoad || spec.id === 'drain_grate') && cell.buildingType !== spec.id) {
        return this.upgradeRoadCell(cell, spec);
      }
      if (!isDrag) {
        this.ui.showToast('Bu parsel dolu! Önce Yıkım (Buldozer) aracını kullanın.', 'error');
      }
      return false;
    }

    // Döngüsel Ekonomi & Geri Dönüşüm: Yağmur parklarında %30 maliyet indirimi
    let finalCost = spec.cost;
    let usedRecycled = false;
    if (spec.category === 'parks' && this.recycledAggregate > 0) {
      finalCost = Math.round(spec.cost * 0.7);
      this.recycledAggregate--;
      usedRecycled = true;
    }

    if (this.budget < finalCost) {
      if (!isDrag) {
        this.ui.showToast(`Yetersiz Bütçe! ($${finalCost} gerekli)`, 'error');
      }
      return false;
    }

    this.budget -= finalCost;

    cell.occupied = true;
    cell.isRoad = Boolean(spec.isRoad);
    cell.buildingType = spec.id;
    if (cell.emptyPadGroup) cell.emptyPadGroup.visible = false;

    const hasCustomRot = Boolean(this.hasCustomRotation || this.buildRotationStep !== 0);
    const rotAngle = this.getBuildRotationAngle();

    if (cell.isRoad) {
      if (hasCustomRot) {
        cell.hasCustomRotation = true;
        cell.rotationAngle = rotAngle;
      }
      this.refreshRoadAndNeighbors(cell.row, cell.col);
      if (hasCustomRot && cell.building) {
        cell.building.rotation.y = rotAngle;
      }
      if (cell.building) this.bm.animateSpawn(cell.building, 220, cell.x, cell.z);
    } else {
      const facing = hasCustomRot ? rotAngle : this.grid.getRoadFacingAngle(cell.row, cell.col);
      const mesh = this.bm.createBuilding(spec.id, cell.variantSeed, facing);
      mesh.position.set(cell.x, 0.36, cell.z);
      mesh.rotation.y = facing;
      if (hasCustomRot) {
        cell.hasCustomRotation = true;
        cell.rotationAngle = facing;
      }
      this.scene.scene.add(mesh);
      cell.building = mesh;
      if (this.isHeatmapActive) this.applyCellHeatmap(cell);
      this.bm.animateSpawn(mesh, 380, cell.x, cell.z);
    }

    const { newlyConnected } = this.recalculateRoadAccess();
    this.recalculateMetrics();

    if (this.grid.invalidateGhost) this.grid.invalidateGhost();

    if (cell.isRoad) {
      if (newlyConnected > 0) {
        sound.playRoadConnected();
        this.ui.showToast(`${spec.name} döşendi (${newlyConnected} yapı şebekeye bağlandı)`, 'success');
      } else {
        sound.playConstruction();
        if (!isDrag) this.ui.showToast(`${spec.name} döşendi.`, 'success');
      }
    } else {
      sound.playConstruction();
      if (!cell.hasRoadAccess) {
        sound.playNoRoadWarning();
        this.ui.showToast(`${spec.name} inşa edildi fakat YOLA BAĞLANTISI YOK! Hizmet dışı.`, 'warning');
      } else {
        if (!isDrag) {
          if (usedRecycled) {
            this.ui.showToast(`${spec.name} inşa edildi. (Geri Dönüştürülmüş Agrega ile -%30 Tasarruf: -$${spec.cost - finalCost})`, 'success');
          } else {
            this.ui.showToast(`${spec.name} inşa edildi.`, 'success');
          }
          if (spec.id === 'water_treatment' && this.scene?.triggerCleaningBoat) {
            this.scene.triggerCleaningBoat(this);
            if (this.ui?.speakMuratBey) {
              this.ui.speakMuratBey('Başkanım, İleri Arıtma ve Deniz Temizleme Teknesi körfeze açıldı. Kıyı atıkları toplanıyor.');
            }
          }
        }
      }
    }

    // v11.0 Öğretici Adım Kontrolü
    if (this.tutorialActive) {
      if (this.tutorialStep === 1 && cell.row === 6 && cell.col === 8 && spec.isRoad) {
        this.advanceTutorial(1);
      } else if (this.tutorialStep === 2 && cell.row === 5 && cell.col === 8 && spec.id === 'sponge_park') {
        this.advanceTutorial(2);
      } else if (this.tutorialStep === 4 && cell.row === 7 && cell.col === 8 && spec.id === 'drain_grate') {
        this.advanceTutorial(4);
      }
    } else {
      this.checkDynamicMissions();
    }

    this.checkVictoryConditions();
    return true;
  }

  upgradeRoadCell(cell, newSpec) {
    if (this.budget < newSpec.cost) {
      this.ui.showToast(`Yetersiz Bütçe! ($${newSpec.cost} gerekli)`, 'error');
      return false;
    }

    this.budget -= newSpec.cost;
    cell.buildingType = newSpec.id;
    if (newSpec.id === 'drain_grate') {
      cell.isRoad = true;
    }
    this.refreshRoadAndNeighbors(cell.row, cell.col);
    if (cell.building) this.bm.animateSpawn(cell.building, 240, cell.x, cell.z);
    if (this.grid.invalidateGhost) this.grid.invalidateGhost();

    const { newlyConnected } = this.recalculateRoadAccess();
    this.recalculateMetrics();

    if (newlyConnected > 0) {
      sound.playRoadConnected();
    } else {
      sound.playPlace();
    }
    this.ui.showToast(`Yol ${newSpec.shortName} seviyesine yükseltildi!`, 'success');

    // v11.0 4. Adım Öğretici Kontrolü
    if (this.tutorialActive && this.tutorialStep === 4 && cell.row === 7 && cell.col === 8 && newSpec.id === 'drain_grate') {
      this.advanceTutorial(4);
    } else if (!this.tutorialActive) {
      this.checkDynamicMissions();
    }

    this.checkVictoryConditions();
    return true;
  }

  bulldozeCell(cell) {
    if (!cell || !cell.occupied) return false;

    const spec = BUILDINGS_CATALOG[cell.buildingType];
    const isLegacy = cell.buildingType === 'legacy_concrete';
    const oldMesh = cell.building;
    const cellX = cell.x;
    const cellZ = cell.z;

    if (cell.noRoadBadge) {
      if (oldMesh) oldMesh.remove(cell.noRoadBadge);
      if (cell.noRoadBadge.material.map) cell.noRoadBadge.material.map.dispose();
      cell.noRoadBadge.material.dispose();
      cell.noRoadBadge = null;
    }

    if (oldMesh) {
      this.bm.animateDemolition(oldMesh, cellX, cellZ, () => {
        this.scene.scene.remove(oldMesh);
      });
    }

    const refund = isLegacy ? 450 : (spec ? Math.floor(spec.cost * 0.5) : 50);
    this.budget += refund;

    // Döngüsel Ekonomi & Sıfır Atık: Yıkılan binalardan agrega kazanımı
    if (isLegacy) {
      this.recycledAggregate += 2;
    } else if (spec && (spec.category === 'buildings' || spec.category === 'infra' || spec.category === 'waste')) {
      this.recycledAggregate += 1;
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

    this.refreshRoadAndNeighbors(cell.row, cell.col);
    const { newlyDisconnected } = this.recalculateRoadAccess();
    this.recalculateMetrics();

    if (this.grid.invalidateGhost) this.grid.invalidateGhost();
    sound.playDemolition();

    if (newlyDisconnected > 0) {
      sound.playNoRoadWarning();
      this.ui.showToast(`Yol yıkıldı: ${newlyDisconnected} yapının yol bağlantısı koptu (Hizmet dışı)!`, 'warning');
    }

    if (isLegacy) {
      const remainingLegacy = this.grid.cells.filter((c) => c.occupied && c.buildingType === 'legacy_concrete').length;
      if (remainingLegacy === 0) {
        const victoryMsg = 'Merkez, riskli eski beton yapı stokunun kentsel dönüşümü tamamlandı. Ekolojik yağmur altyapısı ve iklim direnci operasyonu devrede.';
        if (this.ui.speakMuratBey) {
          this.ui.speakMuratBey(victoryMsg);
        } else if (this.ui.speakAURA) {
          this.ui.speakAURA(victoryMsg);
        }
        this.ui.showToast('Tüm Eski Beton Yapılar Temizlendi! (+2 Agrega)', 'success');
      } else {
        this.ui.showToast(`Eski beton yapı yıkıldı (+$${refund} İade, +2 Agrega. Kalan: ${remainingLegacy})`, 'success');
      }
    } else {
      this.ui.showToast(`${spec ? spec.shortName : 'Yapı'} yıkıldı (+$${refund} iade)`, 'info');
    }

    // v10.0 Öğretici Adım Kontrolü
    if (this.tutorialActive && this.tutorialStep === 3 && cell.row === 6 && cell.col === 9 && isLegacy) {
      this.advanceTutorial(3);
    } else if (!this.tutorialActive) {
      this.checkDynamicMissions();
    }

    this.checkVictoryConditions();
    return true;
  }

  inspectCell(cell) {
    sound.playClick();
    if (!cell || !cell.occupied) {
      if (this.ui && this.ui.closeInspectCard) this.ui.closeInspectCard();
      if (!cell) return;
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

    if (this.ui && this.ui.showInspectCard) {
      this.ui.showInspectCard(cell);
      return;
    }

    if (cell.buildingType === 'legacy_concrete') {
      this.ui.inspectReport(
        'Eski Kömürlü Beton Tesis | Karbon: +15% | Geçirimsiz Beton (0 m³/s) | Isı Adasını Artırır (+4°C) | Bakım: -$20/5s | Kentsel Dönüşüm: Yıkıp yerine yeşil altyapı kurun!'
      );
      return;
    }

    const spec = BUILDINGS_CATALOG[cell.buildingType];
    if (spec) {
      const roadText = cell.isRoad ? 'Yol Ağı' : cell.hasRoadAccess ? 'Yola Cepheli (Hizmette)' : 'Yol Yok (Hizmet Dışı)';
      this.ui.inspectReport(
        `${spec.name} | ${roadText} | Taşkın Tutma: +${spec.spongePower} m³/s | Soğutma: -${spec.coolingPower}°C | Net Gelir: +$${(spec.income || 0) - (spec.maintenance || 0)}/5s`
      );
    }
  }

  update(dt) {
    if (this.isPaused || this.isGameOver || this.isVictory) return;

    const delta = dt * this.gameSpeed;

    if (this.emergencyGridProtectionTimer > 0) {
      this.emergencyGridProtectionTimer = Math.max(0, this.emergencyGridProtectionTimer - delta);
    }
    if (this.emergencyCoolingTimer > 0) {
      this.emergencyCoolingTimer = Math.max(0, this.emergencyCoolingTimer - delta);
    }

    // v10.0 3B Öğretici Kılavuz Beacon Animasyonu
    if (this.grid && this.grid.updateTutorialBeacon) {
      this.grid.updateTutorialBeacon(delta);
    }

    // v10.0 Barış Evresi Kentsel Mikro-Olay Motoru
    if (this.crisisPhase === 'PEACE' && !this.tutorialActive) {
      if (this.activeMicroEvent) {
        this.activeMicroEvent.timeLeft -= delta;
        if (this.activeMicroEvent.timeLeft <= 0) {
          this.resolveMicroEvent(1);
        }
      } else if (this.crisisTimer > 12.0) {
        this.microEventTimer -= delta;
        if (this.microEventTimer <= 0) {
          this.triggerMicroEvent();
        }
      }
    } else if (this.activeMicroEvent) {
      this.activeMicroEvent = null;
      if (this.ui?.hideMicroEvent) this.ui.hideMicroEvent();
    }

    // Düzenli Belediye Bütçe Nakit Akışı (Her 5 saniyede bir: Net = Gelir - Bakım Gideri)
    this.taxTimer -= delta;
    if (this.taxTimer <= 0) {
      this.taxTimer = 5.0;
      const effectiveTax = this.emergencyGridProtectionTimer > 0 ? Math.floor(this.taxIncome * 0.5) : this.taxIncome;
      this.budget += effectiveTax;
      if (this.budget < 0) {
        if (this.budget < -1200) {
          this.triggerGameOver('İFLAS: Belediye bütçesi tükendi ve borç limiti aşıldı! Bakım giderleri geliri aştı.');
          return;
        } else {
          this.ui.showToast(`Bütçe Uyarısı: Bütçe eksiye düştü ($${this.budget})! Bakım giderlerini azaltın veya nüfusu artırın.`, 'warning');
        }
      }
    }

    // Afet Döngüsü - Yüksek Karbon afeti hızlandırır (>50% karbon iklim stres katsayısı)
    const climateStress = this.carbon > 50 ? 1.0 + ((this.carbon - 50) / 50) * 0.75 : 1.0;

    // Afet Döngüsü: Sel ve Sıcak Dalgası sıralı ve adil şekilde dönüşümlü ilerler
    if (!this.nextDisasterType) {
      this.nextDisasterType = this.survivedFlood ? 'HEATWAVE' : 'FLOOD';
    }

    if (this.crisisPhase === 'PEACE') {
      if (this.health < 100.0) {
        if (this.spongeCapacity >= 45 && this.coolingPower >= 25) {
          this.health = Math.min(100.0, this.health + 2.0 * delta);
        } else if (this.spongeCapacity >= 20 || this.coolingPower >= 15) {
          this.health = Math.min(100.0, this.health + 0.8 * delta);
        }
      }

      // Deniz kirliliği temizleme döngüsü: Arıtma tesisi devredeyse veya sıfır atık >= %70 ise birikmiş sel çöpü hasarı yavaşça iyileşir
      if (this.marinePollutionDamage > 0) {
        const hasTreatment = Boolean(this.grid && this.grid.cells && this.grid.cells.some(c => c.occupied && c.buildingType === 'water_treatment' && c.hasRoadAccess));
        const recoveryRate = ((hasTreatment ? 0.35 : 0.12) + (this.zeroWasteRate >= 70 ? 0.25 : 0)) * delta;
        this.marinePollutionDamage = Math.max(0, this.marinePollutionDamage - recoveryRate);
        this.recalculateMetrics();
      }

      this.crisisTimer -= delta * climateStress;
      if (this.crisisTimer <= 10.0) {
        this.crisisPhase = 'WARNING';
        this.currentDisaster = this.nextDisasterType || 'FLOOD';
        sound.playAlarm();
        if (this.currentDisaster === 'FLOOD') {
          sound.playThunder(0.08); // Toroslar üzerinden uzaktan gök gürültüsü
        }
        this.ui.triggerDisasterWarning(this.currentDisaster, Math.ceil(this.crisisTimer));
      }
    } else if (this.crisisPhase === 'WARNING') {
      this.crisisTimer -= delta;

      // Sel uyarısının son 4 saniyesinde hafif çisenti başlar
      if (this.currentDisaster === 'FLOOD' && this.crisisTimer <= 4.0) {
        if (this.disasters) {
          this.disasters.drizzleProgress = Math.max(0.1, (4.0 - this.crisisTimer) / 4.0);
        }
      }

      if (this.crisisTimer <= 0) {
        this.crisisPhase = 'ACTIVE';
        if (this.currentDisaster === 'FLOOD') {
          // Yağmur / Sel süresi: 15 saniye ile 90 saniye (1 dk 30 sn) arasında rastgele
          this.disasterDuration = 15.0 + Math.random() * 75.0;
        } else {
          this.disasterDuration = 15.0 + Math.random() * 15.0;
        }
        this.disasterTotalDuration = this.disasterDuration;
        this.disasters.startDisaster(this.currentDisaster);
        if (this.currentDisaster === 'FLOOD') sound.playThunder(0.35);
        this.ui.triggerDisasterStart(this.currentDisaster);
      }
    } else if (this.crisisPhase === 'ACTIVE') {
      this.disasterDuration -= delta;

      if (this.currentDisaster === 'FLOOD') {
        // v9.0 Dinamik Mazgal Erken Boşaltım Algoritması:
        // Yola bağlı her aktif mazgal sel süresini ve su seviyesini aktif olarak hızla düşürür!
        const activeGrates = this.grid?.cells ? this.grid.cells.filter((c) => c.occupied && (c.buildingType === 'drain_grate' || c.buildingType === 'coastal_pump') && c.hasRoadAccess).length : 0;
        if (activeGrates > 0) {
          const grateEff = this.zeroWasteRate >= 50 ? 1.0 : 0.45;
          const earlyDrainBonus = activeGrates * 0.45 * grateEff * delta;
          this.disasterDuration = Math.max(0, this.disasterDuration - earlyDrainBonus);
        }

        // v6.0 Kademeli Yağış: İlk 10-15 sn çisenti, sonra sağanak, bitişte yavaşça azalma
        const elapsed = (this.disasterTotalDuration || 30.0) - this.disasterDuration;
        let prog = Math.min(1.0, elapsed / 12.0);
        if (this.disasterDuration <= 8.0) {
          prog = Math.max(0.2, this.disasterDuration / 8.0);
        }
        if (this.disasters) this.disasters.drizzleProgress = prog;

        const requiredSponge = 45;
        if (this.spongeCapacity < requiredSponge) {
          // 15-90 sn yağmur süresine göre dengeli kentsel taşkın hasarı
          const damageRate = (requiredSponge - this.spongeCapacity) * 0.045 * delta;
          this.health = Math.max(0, this.health - damageRate);
        }
        // Sıfır Atık Döngüsü: Karadaki toplanmamış çöpler sel suyuyla denize akar ve kıyıyı zehirler!
        if (this.zeroWasteRate < 50) {
          const wasteWashDamage = ((50 - this.zeroWasteRate) / 50) * 0.32 * delta;
          this.marinePollutionDamage = Math.min(30, (this.marinePollutionDamage || 0) + wasteWashDamage);
          this.marineHealth = Math.max(5, this.marineHealth - wasteWashDamage);
        }
      } else if (this.currentDisaster === 'HEATWAVE') {
        // v6.0 Elektrik Şebekesi Yüklenmesi: Klima talebi (30kW) güneş ve biyogaz kapasitesini aşarsa trafo kıvılcımı ve elektrik kesintisi
        const solarCount = this.grid?.cells ? this.grid.cells.filter((c) => c.occupied && (c.buildingType === 'solar_farm' || c.hasSolarKit) && c.hasRoadAccess).length : 0;
        const biogasCount = this.grid?.cells ? this.grid.cells.filter((c) => c.occupied && c.buildingType === 'biogas_plant' && c.hasRoadAccess).length : 0;
        const totalCleanPower = solarCount * 15 + biogasCount * 25;
        const coolingDemand = 30;
        const isGridOverloaded = (totalCleanPower < coolingDemand) && (this.emergencyGridProtectionTimer <= 0);
        this.isGridBlackout = isGridOverloaded;

        if (isGridOverloaded) {
          this.sparkTimer = (this.sparkTimer || 0) + delta;
          if (this.sparkTimer >= 0.5) {
            this.sparkTimer = 0;
            if (this.disasters?.triggerTransformerSpark) {
              let sparkX = 0, sparkY = 2.5, sparkZ = 0;
              if (this.scene?.streetTransformers && this.scene.streetTransformers.length > 0 && Math.random() < 0.7) {
                const trafo = this.scene.streetTransformers[Math.floor(Math.random() * this.scene.streetTransformers.length)];
                sparkX = trafo.position.x;
                sparkY = trafo.position.y + 0.55;
                sparkZ = trafo.position.z;
              } else {
                const sparkTargets = this.grid?.cells ? this.grid.cells.filter((c) => c.occupied && !c.isRoad && (c.buildingType === 'commercial_hub' || c.buildingType === 'legacy_concrete' || c.buildingType === 'green_roof')) : [];
                if (sparkTargets.length > 0) {
                  const target = sparkTargets[Math.floor(Math.random() * sparkTargets.length)];
                  sparkX = target.x;
                  sparkY = 2.5;
                  sparkZ = target.z;
                }
              }
              this.disasters.triggerTransformerSpark(sparkX, sparkY, sparkZ);
              if (sound.playTransformerSpark) sound.playTransformerSpark();
            }
          }
          if (!this.blackoutWarned) {
            this.blackoutWarned = true;
            if (this.ui && this.ui.speakMuratBey) {
              this.ui.speakMuratBey('Merkez, aşırı klima yüklenmesi trafo arkına yol açtı. Şebeke koruma kesintisi devrede. Yenilenebilir enerji hatlarını devreye alın.');
            }
          }
        } else {
          this.isGridBlackout = false;
        }

        // Gölgesiz kordonda ısı çarpması (yeşil bulvar, çeşme meydanı veya rüzgar koridoru yoksa sağlık düşer)
        const shadedTreeAvenues = this.grid?.cells ? this.grid.cells.filter(c => c.occupied && (c.buildingType === 'boulevard' || c.buildingType === 'botanical_plaza' || c.buildingType === 'wind_corridor') && c.hasRoadAccess).length : 0;
        if (shadedTreeAvenues < 2) {
          const heatstrokeRate = 0.08 * delta;
          this.health = Math.max(0, this.health - heatstrokeRate);
        }

        const requiredCooling = 25;
        const effectiveCooling = this.coolingPower + (this.emergencyCoolingTimer > 0 ? 8 : 0);
        if (effectiveCooling < requiredCooling) {
          const damageRate = (requiredCooling - effectiveCooling) * 0.18 * delta;
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

    if (this.crisisPhase === 'ACTIVE' && this.currentDisaster === 'HEATWAVE') {
      if (this.scene.setHeatwaveAtmosphere) this.scene.setHeatwaveAtmosphere(true);
    } else {
      if (this.scene.setHeatwaveAtmosphere) this.scene.setHeatwaveAtmosphere(false);
    }

    this.disasters.update(
      delta,
      this.scene.sunLight,
      this.scene.hemiLight,
      this.scene.scene.fog,
      this.scene.scene.background,
      this.grid,
      this
    );


    // Yolu Olmayan Binaların 3D Uyarı Rozetlerini Yavaşça Havada Dalgalandır
    const nowTime = performance.now() * 0.003;
    for (let i = 0; i < this.grid.cells.length; i++) {
      const cell = this.grid.cells[i];
      if (cell.noRoadBadge) {
        const baseY = cell.noRoadBadge.userData?.baseY || 2.4;
        cell.noRoadBadge.position.y = baseY + Math.sin(nowTime + cell.row * 0.5 + cell.col * 0.5) * 0.12;
      }
    }
  }

  onDisasterSurvive() {
    if (this.currentDisaster === 'FLOOD') {
      this.survivedFlood = true;
    } else if (this.currentDisaster === 'HEATWAVE') {
      this.survivedHeatwave = true;
    }

    // Kriz başarıyla savuşturulduğunda direnç (Health) onarım takviyesi
    this.health = Math.min(100.0, this.health + 15.0);

    this.checkDynamicMissions();

    this.crisisPhase = 'PEACE';
    this.crisisTimer = 26.0;
    this.isGridBlackout = false;
    this.blackoutWarned = false;
    this.emergencyGridProtectionTimer = 0;
    this.emergencyCoolingTimer = 0;

    // Afet türlerini adil ve dengeli olarak sırayla dönüştür
    if (this.currentDisaster === 'FLOOD') {
      this.nextDisasterType = 'HEATWAVE';
    } else if (this.currentDisaster === 'HEATWAVE') {
      this.nextDisasterType = 'FLOOD';
    } else {
      this.nextDisasterType = 'FLOOD';
    }
    this.disasters.stopDisaster();
    if (this.isHeatmapActive) {
      this.scene.scene.background.setHex(0x0f172a);
      this.scene.scene.fog.color.setHex(0x0f172a);
      this.scene.scene.fog.density = 0.006;
      this.scene.sunLight.intensity = 1.2;
      this.scene.hemiLight.intensity = 0.4;
    } else {
      this.scene.resetLighting();
    }
    if (this.scene.setStormAtmosphere) this.scene.setStormAtmosphere(false);
    if (this.scene.setHeatwaveAtmosphere) this.scene.setHeatwaveAtmosphere(false);

    const reward = 2000;
    this.budget += reward;
    sound.playVictory();
    this.ui.triggerDisasterSuccess(reward);

    this.checkVictoryConditions();
  }

  checkVictoryConditions() {
    if (this.isVictory || this.isGameOver) return;

    const remainingLegacy = this.grid.cells.filter((c) => c.occupied && c.buildingType === 'legacy_concrete').length;
    const isZeroCarbon = this.carbon <= 0;
    const isFullResilience = this.health >= 99.5;
    const survivedBothCrises = this.survivedFlood && this.survivedHeatwave;

    // Zafer Şartı: 3 Eski Beton Tesis Dönüştürülmeli, Karbon 0 olmalı, %100 Direnç korunmalı, Sel ve Isı Afetleri savuşturulmalı
    if (remainingLegacy === 0 && isZeroCarbon && isFullResilience && survivedBothCrises) {
      this.triggerVictory();
    }
  }

  triggerVictory() {
    this.isVictory = true;
    sound.playVictory();
    this.ui.showVictory();
  }

  triggerDisaster(type = 'FLOOD', duration = null) {
    this.crisisPhase = 'ACTIVE';
    this.currentDisaster = type;
    this.disasterDuration = duration || (type === 'FLOOD' ? 15.0 + Math.random() * 75.0 : 20.0);
    this.disasterTotalDuration = this.disasterDuration;
    this.disasters.startDisaster(type);
    if (type === 'FLOOD') sound.playThunder();
    this.ui.triggerDisasterStart(type);
  }

  restart() {
    this.budget = 4800;
    this.health = 100.0;
    this.crisisTimer = 18.0;
    this.crisisPhase = 'PEACE';
    this.currentDisaster = null;
    this.disasterDuration = 15.0 + Math.random() * 75.0;
    this.disasterTotalDuration = this.disasterDuration;
    this.isGameOver = false;
    this.isVictory = false;
    this.recycledAggregate = 0;
    this.zeroWasteRate = 22;
    this.marineHealth = 35.0;
    this.marinePollutionDamage = 0;
    this.airQuality = 35;
    this.survivedFlood = false;
    this.survivedHeatwave = false;
    this.nextDisasterType = 'FLOOD';
    this.emergencyGridProtectionTimer = 0;
    this.emergencyCoolingTimer = 0;
    this.civicZeroWasteBonus = 0;
    this.civicMarineBonus = 0;
    this.civicSpongeBonus = 0;
    this.civicCoolingBonus = 0;
    this.tutorialActive = true;
    this.tutorialStep = 1;
    this.activeMicroEvent = null;
    this.microEventTimer = 14.0;
    if (this.ui && this.ui.hideMicroEvent) this.ui.hideMicroEvent();
    this.setToolMode('NONE');

    if (this.isHeatmapActive) {
      this.toggleHeatmap();
    }

    this.disasters.stopDisaster();
    this.scene.resetLighting();
    if (this.ui && this.ui.resetRadar) this.ui.resetRadar();
    this.initStarterCity();
  }
}

