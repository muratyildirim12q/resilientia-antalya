import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const BUILD_CATEGORIES = [
  {
    id: 'roads',
    name: 'Yollar',
    shortName: 'Yollar'
  },
  {
    id: 'buildings',
    name: 'Konut & Ticaret',
    shortName: 'Konut & Ticaret'
  },
  {
    id: 'parks',
    name: 'Doğal Drenaj & Parklar',
    shortName: 'Doğal Drenaj'
  },
  {
    id: 'waste',
    name: 'Sıfır Atık & Çevre',
    shortName: 'Sıfır Atık'
  },
  {
    id: 'infra',
    name: 'İklim & Mavi Vatan',
    shortName: 'Altyapı'
  },
  {
    id: 'demolish',
    name: 'Yıkım & Geri Dönüşüm',
    shortName: 'Yıkım'
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
    maintenance: 3,
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
    maintenance: 6,
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
    hidden: true, // v10.0: Tramvay yolu geçici olarak menüden kaldırıldı
    isRoad: true,
    name: 'Güneş Tramvayı & Yeşil Hat',
    shortName: 'Tramvay Hattı',
    cost: 1100,
    maintenance: 15,
    carbon: -12,
    spongePower: 3,
    coolingPower: 3,
    income: 40,
    population: 0,
    desc: 'Fosil yakıtlı trafiği azaltan çim zeminli modern elektrikli tramvay hattı.'
  },
  permeable_road: {
    id: 'permeable_road',
    category: 'roads',
    isRoad: true,
    name: 'Eko-Cadde',
    shortName: 'Eko-Cadde',
    cost: 25,
    maintenance: 1,
    carbon: -2,
    spongePower: 6,
    coolingPower: 3,
    income: 0,
    population: 0,
    shelterCapacity: 0,
    desc: 'Gözenekli mineral ve çim derzli yol kaplaması. Yağmur suyunu anında toprağa emer, su birikintisi ve göllenmeyi sıfırlar.'
  },

  // 2. KONUT & TİCARET
  eco_house: {
    id: 'eco_house',
    category: 'buildings',
    isRoad: false,
    name: 'Müstakil Ev',
    shortName: 'Müstakil Ev',
    cost: 650,
    maintenance: 15,
    carbon: -2,
    spongePower: 1,
    coolingPower: 1,
    income: 65,
    population: 45,
    shelterCapacity: 4,
    desc: 'Bahçeli, güneş panelli banliyö konutu. Nüfus ve vergi geliri sağlar. 4 kişilik fırtına sığınağı barındırır.'
  },
  green_roof: {
    id: 'green_roof',
    category: 'buildings',
    isRoad: false,
    name: 'Apartman',
    shortName: 'Apartman',
    cost: 950,
    maintenance: 30,
    carbon: -5,
    spongePower: 8,
    coolingPower: 6,
    income: 120,
    population: 120,
    shelterCapacity: 20,
    desc: 'Sedum yeşil çatılı çok katlı konut. 47°C ısıyı kırar ve 20 kişilik fırtına sığınağı barındırır.'
  },
  commercial_hub: {
    id: 'commercial_hub',
    category: 'buildings',
    isRoad: false,
    name: 'İş Merkezi',
    shortName: 'İş Merkezi',
    cost: 1450,
    maintenance: 65,
    carbon: 2,
    spongePower: 0,
    coolingPower: 0,
    income: 240,
    population: 80,
    shelterCapacity: 40,
    desc: 'Modern finans ve ticaret merkezi. Geniş bodrumunda 40 kişilik afet sığınağı barındırır.'
  },
  legacy_concrete: {
    id: 'legacy_concrete',
    category: 'buildings',
    isRoad: false,
    isLegacy: true,
    name: 'Eski Kömürlü Beton Tesis',
    shortName: 'Eski Beton Yapı',
    cost: 0,
    maintenance: 50,
    carbon: 15,
    spongePower: 0,
    coolingPower: -4,
    income: 20,
    population: 40,
    shelterCapacity: 10,
    desc: 'Geçirimsiz beton ve fosil yakıt kaynaklı kentsel kirletici. Yıkılarak yeşil altyapıya dönüştürülmeli!'
  },

  // 3. DOĞAL DRENAJ HAVZALARI & PARKLAR
  sponge_park: {
    id: 'sponge_park',
    category: 'parks',
    isRoad: false,
    name: 'Yağmur Parkı (Doğal Taşkın Yatağı)',
    shortName: 'Yağmur Parkı',
    cost: 1150,
    maintenance: 22,
    carbon: -6,
    spongePower: 22,
    coolingPower: 6,
    income: 0,
    population: 0,
    shelterCapacity: 0,
    desc: 'Doğal taşkın yatağı ve geçici gölet havzası. Tepe sel debisini geciktirir ve yeraltı suyunu besler.'
  },
  wind_corridor: {
    id: 'wind_corridor',
    category: 'parks',
    isRoad: false,
    name: 'Rüzgar Koridoru Korusu',
    shortName: 'Rüzgar Koridoru',
    cost: 600,
    maintenance: 12,
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
    maintenance: 12,
    carbon: -4,
    spongePower: 12,
    coolingPower: 8,
    income: 20,
    population: 0,
    desc: 'Serinletici fıskiye ve gölge ağaçlarıyla donatılmış geçirgen taş meydan.'
  },

  // 4. SIFIR ATIK & DÖNGÜSEL EKONOMİ
  waste_station: {
    id: 'waste_station',
    category: 'waste',
    isRoad: false,
    name: 'Akıllı Sıfır Atık Ayrıştırma İstasyonu',
    shortName: 'Atık İstasyonu',
    cost: 120,
    maintenance: 4,
    carbon: -2,
    spongePower: 0,
    coolingPower: 0,
    zeroWastePower: 20,
    income: 12,
    population: 0,
    desc: 'Mahallelere kurulan 4 hazneli (Cam, Plastik, Kağıt, Organik) akıllı geri dönüşüm noktası. Sokak çöplerini sıfırlar.'
  },
  biogas_plant: {
    id: 'biogas_plant',
    category: 'waste',
    isRoad: false,
    name: 'Biyogaz & Kompost Tesisi',
    shortName: 'Biyogaz Tesisi',
    cost: 650,
    maintenance: 20,
    carbon: -10,
    spongePower: 2,
    coolingPower: 2,
    zeroWastePower: 40,
    income: 65,
    population: 0,
    desc: 'Organik kentsel atığı biyogaz elektriğine ve parklar için doğal gübreye çevirir. Vahşi çöp depolamasını sıfırlar.'
  },
  compost_greenhouse: {
    id: 'compost_greenhouse',
    category: 'waste',
    isRoad: false,
    name: 'Organik Kompost & Sera Üretim Tesisi',
    shortName: 'Kompost Serası',
    cost: 480,
    maintenance: 14,
    carbon: -8,
    spongePower: 4,
    coolingPower: 4,
    zeroWastePower: 35,
    income: 45,
    population: 0,
    desc: 'Şehrin organik ve pazar atıklarını parklar ve ağaçlar için yüksek verimli doğal gübreye dönüştürür.'
  },

  // 5. İKLİM DİRENCİ & MAVİ VATAN ALTYAPISI
  cistern: {
    id: 'cistern',
    category: 'infra',
    isRoad: false,
    name: 'Kentsel Yağmur Suyu Terfi & Derin Drenaj Rezervuarı',
    shortName: 'Derin Drenaj Rezervuarı',
    cost: 1750,
    maintenance: 38,
    carbon: -3,
    spongePower: 32,
    coolingPower: 2,
    income: 0,
    population: 0,
    desc: 'Derin su toplama kuyuları ve yüksek debili terfi pompalarıyla ani taşkınları anında emip kentin su rezervine hapseder.'
  },
  cooling_tower: {
    id: 'cooling_tower',
    category: 'infra',
    isRoad: false,
    name: 'Termal Soğutma İstasyonu',
    shortName: 'Soğutma Merkezi',
    cost: 1600,
    maintenance: 35,
    carbon: -8,
    spongePower: 6,
    coolingPower: 16,
    income: 0,
    population: 0,
    desc: 'Deniz suyu kaynaklı bölgesel soğutma sağlayarak 47°C ısı kubbesini nötralize eder.'
  },
  solar_farm: {
    id: 'solar_farm',
    category: 'infra',
    isRoad: false,
    name: 'Büyük Ölçekli Güneş Tarlası',
    shortName: 'Güneş Tarlası',
    cost: 1350,
    maintenance: 18,
    carbon: -14,
    spongePower: 4,
    coolingPower: 4,
    income: 50,
    population: 0,
    desc: 'Antalya güneşinden sıfır emisyonlu temiz elektrik üreten fotovoltaik enerji santrali.'
  },
  water_treatment: {
    id: 'water_treatment',
    category: 'infra',
    isRoad: false,
    name: 'Biyolojik İleri Arıtma Tesisi',
    shortName: 'İleri Arıtma Tesisi',
    cost: 800,
    maintenance: 28,
    carbon: -6,
    spongePower: 8,
    coolingPower: 2,
    marineHealthPower: 30,
    income: 0,
    population: 0,
    desc: 'İleri membran ve biyolojik filtrelerle kentsel atık suları arıtır. Sahil menfezindeki kirli deşarjı durdurup berrak su akıtır.'
  },
  marine_barrier: {
    id: 'marine_barrier',
    category: 'infra',
    hidden: true, // v11.0: Menü sadeleştirmesi kapsamında gizlendi
    isRoad: false,
    name: 'Yüzer Müsilaj ve Atık Bariyeri',
    shortName: 'Yüzer Bariyer',
    cost: 250,
    maintenance: 6,
    carbon: -1,
    spongePower: 4,
    coolingPower: 1,
    marineHealthPower: 15,
    income: 0,
    population: 0,
    desc: 'Kıyı şeridine paralel yerleştirilen şamandıralı yüzer bariyer. Deniz salyası (müsilaj) ve yüzen plastiklerin kumsala vurmasını engeller.'
  },
  coastal_pump: {
    id: 'coastal_pump',
    category: 'infra',
    isRoad: false,
    name: 'Drenaj Pompası',
    shortName: 'Drenaj Pompası',
    cost: 350,
    maintenance: 10,
    carbon: -2,
    spongePower: 14,
    coolingPower: 2,
    marineHealthPower: 10,
    income: 0,
    population: 0,
    shelterCapacity: 0,
    desc: 'Fırtınalarda kıyı yollarındaki ve mahallelerdeki taşkın suyunu yüksek debili santrifüj pompalarla denize tahliye eder.'
  },
  drain_grate: {
    id: 'drain_grate',
    category: 'infra',
    isRoad: false,
    isGrate: true,
    name: 'Döküm Demir Yağmur Suyu Mazgalı',
    shortName: 'Mazgal',
    cost: 30,
    maintenance: 1,
    carbon: 0,
    spongePower: 5,
    coolingPower: 0,
    income: 0,
    population: 0,
    shelterCapacity: 0,
    desc: 'Yol kenarına yerleştirilen ağır döküm demir yağmur suyu ızgarası. Caddeden akan sel suyunu doğrudan ana kolektöre çeker.'
  },
  sea_breakwater: {
    id: 'sea_breakwater',
    category: 'infra',
    hidden: true, // v11.0: Menü sadeleştirmesi kapsamında gizlendi
    isRoad: false,
    name: 'Kıyı Dalga Kıran & Falez Tahkimatı',
    shortName: 'Dalga Kıran',
    cost: 280,
    maintenance: 8,
    carbon: -1,
    spongePower: 6,
    coolingPower: 1,
    marineHealthPower: 20,
    income: 0,
    population: 0,
    shelterCapacity: 0,
    desc: 'Kıyı sularına ve falez diplerine yerleştirilerek fırtına dalgalarını kırar, kıyı erozyonunu ve falez aşınmasını önler.'
  },

  // 6. YIKIM & GERİ DÖNÜŞÜM
  demolish_tool: {
    id: 'demolish_tool',
    category: 'demolish',
    isRoad: false,
    isTool: true,
    name: 'Buldozer & Geri Dönüşüm Aracı',
    shortName: 'Buldozer Aracı',
    cost: 0,
    maintenance: 0,
    carbon: 0,
    spongePower: 0,
    coolingPower: 0,
    income: 0,
    population: 0,
    desc: 'Yapıları ve yolları yıkar. Yıkılan binalardan %50 bütçe iadesi ve ekolojik yağmur parkları için Geri Dönüştürülmüş Agrega sağlar.'
  }
};
BUILDINGS_CATALOG.grate = BUILDINGS_CATALOG.drain_grate;

export const HEATMAP_DATA = {
  legacy_concrete: { temp: 49, color: 0xef4444, label: '49°C Aşırı Sıcak (Beton & Fosil)' },
  road: { temp: 45, color: 0xf97316, label: '45°C Yüksek Isı (Asfalt Yüzey)' },
  commercial_hub: { temp: 41, color: 0xfb923c, label: '41°C Sıcak (Ticari Yoğunluk)' },
  eco_house: { temp: 33, color: 0xfacc15, label: '33°C Ilıman (Müstakil Ev)' },
  waste_station: { temp: 28, color: 0x10b981, label: '28°C Sıfır Atık (Geri Dönüşüm İstasyonu)' },
  biogas_plant: { temp: 27, color: 0x14b8a6, label: '27°C Biyogaz Enerjisi (Organik Dönüşüm)' },
  boulevard: { temp: 28, color: 0x84cc16, label: '28°C Serin (Ağaçlı Bulvar)' },
  green_roof: { temp: 26, color: 0x10b981, label: '26°C Serin (Yeşil Çatı Sedum)' },
  solar_farm: { temp: 25, color: 0x14b8a6, label: '25°C Temiz Enerji (Fotovoltaik)' },
  solar_tram: { temp: 24, color: 0x06b6d4, label: '24°C Çim Ray (Güneş Tramvayı)' },
  botanical_plaza: { temp: 23, color: 0x0ea5e9, label: '23°C Serin Meydan (Çeşme Parkı)' },
  water_treatment: { temp: 22, color: 0x0ea5e9, label: '22°C Biyolojik Arıtma (Temiz Su Döngüsü)' },
  wind_corridor: { temp: 21, color: 0x3b82f6, label: '21°C Doğal Meltem (Koruluk)' },
  sponge_park: { temp: 20, color: 0x2563eb, label: '20°C Doğal Taşkın Yatağı (Yağmur Parkı)' },
  marine_barrier: { temp: 20, color: 0x3b82f6, label: '20°C Deniz Koruma (Yüzer Bariyer)' },
  cistern: { temp: 19, color: 0x38bdf8, label: '19°C Derin Rezervuar (Yeraltı Drenajı)' },
  cooling_tower: { temp: 18, color: 0x67e8f9, label: '18°C Termal Soğurma (Aktif Soğutma)' },
  permeable_road: { temp: 26, color: 0x10b981, label: '26°C Gözenekli Serin Yol (Geçirgen Parke)' },
  compost_greenhouse: { temp: 25, color: 0x14b8a6, label: '25°C Ekolojik Sera (Organik Kompost)' },
  coastal_pump: { temp: 20, color: 0x0ea5e9, label: '20°C Kıyı Drenajı (Tahliye Pompası)' },
  sea_breakwater: { temp: 19, color: 0x3b82f6, label: '19°C Kıyı Kalkanı (Dalga Kıran & Tahkimat)' },
  drain_grate: { temp: 28, color: 0x94a3b8, label: '28°C Döküm Demir Mazgal (Yol Drenajı)' }
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

    // v5.0 Çevre, Atık ve Mavi Vatan Materyalleri
    this.terraceStoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    this.gravelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.95 });
    this.reedMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    this.bioDomeMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.35, metalness: 0.1 });
    this.gasTankMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.6 });
    this.clarifierBridgeMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4, metalness: 0.7 });
    this.barrierFloatMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4, metalness: 0.1 });
    this.recycleBlueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    this.recycleYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });
    this.recycleGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 });
    this.recycleBrownMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
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
  createRoadMesh(typeId, neighbors = {}, row = 0, col = 0) {
    const group = new THREE.Group();
    const N = Boolean(neighbors.N || neighbors.n);
    const S = Boolean(neighbors.S || neighbors.s);
    const W = Boolean(neighbors.W || neighbors.w);
    const E = Boolean(neighbors.E || neighbors.e);
    const isHighway = Boolean(neighbors.isHighway);
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
        roadFile = 'road-straight.glb';
        rotY = 0;
      } else if (W && E) {
        roadFile = 'road-straight.glb';
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
      roadFile = 'road-straight.glb';
      rotY = W || E ? Math.PI / 2 : 0;
    } else {
      roadFile = 'road-straight.glb';
      rotY = 0;
    }

    // Alt taban plakası (Z-fighting'i %100 önler, asfalt yüzey y = 0.025 seviyesinde başlar)
    const basePad = new THREE.Mesh(new THREE.BoxGeometry(2.98, 0.02, 2.98), this.asphaltBaseMat);
    basePad.position.y = 0.012;
    basePad.receiveShadow = true;
    group.add(basePad);

    const tile = this.cloneModel(roadFile, 3.0, 2.2, 3.0);
    if (tile) {
      tile.position.y = 0.025;
      tile.rotation.y = rotY;
      group.add(tile);
    }

    // Şerit Çizgileri (Asfalt yüzey y = 0.02 üzerinde y = 0.026'da tam yapışık)
    this.addRoadMarkings(group, { N, S, W, E, count, isHighway });

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

    // Geçirgen Yeşil Yol: Yağmur suyunu anında toprağa emen çim derzli gözenekli parke ve biyo-hendek bordürleri
    if (typeId === 'permeable_road') {
      [-1.22, 1.22].forEach((vx) => {
        const verge = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 2.92), this.turfMat);
        verge.position.set(vx, 0.082, 0);
        group.add(verge);
      });
      for (let pz = -1.2; pz <= 1.2; pz += 0.6) {
        const porousBand = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.08), this.gravelMat);
        porousBand.rotateX(-Math.PI / 2);
        porousBand.position.set(0, 0.083, pz);
        group.add(porousBand);
      }
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

  addRoadMarkings(group, { N, S, W, E, count, isHighway = false }) {
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

    // Ekolojik Yağmur Suyu Mazgalı (Kaldırım Kenarı Drenajı)
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
      if (!isHighway) {
        addDrainGrate(-0.92, 0, false);
        addDrainGrate(0.92, 0, false);
      }
    } else if (W && E) {
      [-0.75, 0.75].forEach((xOff) => {
        const d = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.12), this.stripeMat);
        d.rotateX(-Math.PI / 2);
        d.position.set(xOff, y, 0);
        group.add(d);
      });
      if (!isHighway) {
        addDrainGrate(0, -0.92, true);
        addDrainGrate(0, 0.92, true);
      }
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

  // 3D Çatı Klima / Havalandırma (HVAC) Dış Ünitesi Modeli
  createHvacUnit(scale = 1.0) {
    const hvac = new THREE.Group();
    hvac.name = 'HVAC_Unit';

    // Metal kasa (Condenser Cabinet)
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.6,
      metalness: 0.5
    });
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.38 * scale, 0.32 * scale, 0.24 * scale), cabinetMat);
    cabinet.position.y = 0.16 * scale;
    cabinet.castShadow = true;
    hvac.add(cabinet);

    // Dairesel fan ızgarası (Fan Grille Guard)
    const grilleMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.7
    });
    const grille = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * scale, 0.11 * scale, 0.02 * scale, 12), grilleMat);
    grille.rotation.x = Math.PI / 2;
    grille.position.set(0, 0.16 * scale, 0.125 * scale);
    hvac.add(grille);

    // Dönen 4 kanatlı fan pervanesi (Rotating Fan Blade)
    const fanMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.8
    });
    const fanGroup = new THREE.Group();
    fanGroup.position.set(0, 0.16 * scale, 0.118 * scale);

    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.025 * scale, 0.008 * scale), fanMat);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.025 * scale, 0.18 * scale, 0.008 * scale), fanMat);
    fanGroup.add(b1);
    fanGroup.add(b2);
    fanGroup.userData = { isHvacFan: true, spinSpeed: 5.0 };
    hvac.add(fanGroup);
    hvac.userData.fan = fanGroup;

    // Bakır / Çelik soğutucu boru hattı (Refrigerant Pipes)
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.7 });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.016 * scale, 0.016 * scale, 0.16 * scale, 6), pipeMat);
    pipe.position.set(0.14 * scale, 0.08 * scale, -0.09 * scale);
    hvac.add(pipe);

    // Sıcak hava dalgalanması (HVAC Heat Haze Shimmer Ring) - Alev benzeri dikey turuncu panel yerine gerçekçi şeffaf ısı halkası
    const hazeGeom = new THREE.RingGeometry(0.04 * scale, 0.22 * scale, 12);
    hazeGeom.rotateX(-Math.PI / 2);
    const hazeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const hazeMesh = new THREE.Mesh(hazeGeom, hazeMat);
    hazeMesh.position.set(0, 0.32 * scale, -0.06 * scale);
    hazeMesh.name = 'HVAC_HeatHaze';
    hazeMesh.visible = false;
    hvac.add(hazeMesh);
    hvac.userData.heatHaze = hazeMesh;
    hvac.userData.scale = scale;

    return hvac;
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
      let roofY = 1.35;
      if (house) {
        house.position.set(0, 0.11, -0.15);
        group.add(house);

        // Çatı yüksekliğini tam ölçerek güneş paneli yerleştir
        const box = new THREE.Box3().setFromObject(house);
        roofY = Math.max(1.25, box.max.y - 0.08);
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

      // Çatı Üstü 3D HVAC Havalandırma Ünitesi (Inverter Mini Split AC Dış Ünitesi)
      const acUnit = this.createHvacUnit(0.75);
      acUnit.position.set(-0.55, roofY, -0.2);
      group.add(acUnit);
      group.userData.hvacUnits = [acUnit];
      group.userData.hvacFans = [acUnit.userData.fan];
    } else if (typeId === 'green_roof') {
      // 2. YEŞİL ÇATILI APARTMAN KOMPLEKSİ (Çok Katlı Konut + Gerçek Çatı Çimi + Güneş Panelleri + Çatı HVAC)
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
      let roofW = 1.8;
      let roofD = 1.8;
      let roofY = 2.6;
      if (apt) {
        apt.position.set(0, 0.11, 0);
        group.add(apt);

        const box = new THREE.Box3().setFromObject(apt);
        roofW = Math.max(0.9, (box.max.x - box.min.x) * 0.78);
        roofD = Math.max(0.9, (box.max.z - box.min.z) * 0.78);
        roofY = box.max.y;
      }

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

      // Çatı Katı 3D HVAC Havalandırma Ünitesi
      const hvac = this.createHvacUnit(0.95);
      hvac.position.set(-roofW * 0.22, roofY + 0.04, 0);
      group.add(hvac);
      group.userData.hvacUnits = [hvac];
      group.userData.hvacFans = [hvac.userData.fan];

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
      // 3. EKO-TİCARET & OFİS KULESİ (Cities: Skylines Gökdelen / İş Merkezi Silüeti + İkiz Çatı HVAC)
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

      let roofY = 3.6;
      if (tower) {
        tower.position.set(0, 0.11, -0.08);
        group.add(tower);

        const box = new THREE.Box3().setFromObject(tower);
        roofY = Math.max(2.6, box.max.y);
      }

      // İkiz Çatı Ticari HVAC Kondenser Üniteleri
      const hvac1 = this.createHvacUnit(1.1);
      hvac1.position.set(-0.55, roofY + 0.02, -0.35);
      group.add(hvac1);

      const hvac2 = this.createHvacUnit(1.1);
      hvac2.position.set(0.55, roofY + 0.02, 0.35);
      group.add(hvac2);

      group.userData.hvacUnits = [hvac1, hvac2];
      group.userData.hvacFans = [hvac1.userData.fan, hvac2.userData.fan];

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

      // v9.0 Profesyonel Akdeniz Güneş Kırıcı Louvre Cephe & Zemin Kat Gölgelikli Arkad Pasajı
      const louverMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.3 });
      const louverGroup = new THREE.Group();
      louverGroup.name = 'MediterraneanLouvers';
      for (let ly = 0.85; ly <= Math.min(roofY - 0.3, 2.85); ly += 0.38) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.04, 0.16), louverMat);
        fin.position.set(0, ly, 0.82);
        fin.rotation.x = 0.25;
        louverGroup.add(fin);
      }
      group.add(louverGroup);
      group.userData.louverGroup = louverGroup;

      // Zemin Kat Gölgelikli Arkad Sütunları ve Kanopi
      const arcadeGroup = new THREE.Group();
      arcadeGroup.name = 'GroundArcadeCanopy';
      const canopyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 0.55), this.terraceStoneMat);
      canopyMesh.position.set(0, 0.62, 0.96);
      arcadeGroup.add(canopyMesh);
      [-0.82, -0.28, 0.28, 0.82].forEach((colX) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.52, 0.10), louverMat);
        pillar.position.set(colX, 0.35, 1.16);
        arcadeGroup.add(pillar);
      });
      group.add(arcadeGroup);
      group.userData.arcadeGroup = arcadeGroup;
    } else if (typeId === 'sponge_park') {
      // 4. EKOLOJİK YAĞMUR PARKI & DOĞAL TAŞKIN YATAĞI (Kademeli Su Tutma Terasları, Fitoremediasyon Sazlıkları, Çakıllı Drenaj)
      const grassTile = this.cloneModel('grass.glb', 3.0, 2.0, 3.0);
      if (grassTile) group.add(grassTile);

      // Kademeli Su Tutma Terasları (1. Dış Kademe Taş Terası)
      const outerTerrace = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.42, 0.10, 20), this.terraceStoneMat);
      outerTerrace.position.set(0, 0.10, 0);
      group.add(outerTerrace);

      // Çakıllı Drenaj Yatağı & Hendek Dolgusu (2. İç Kademe)
      const gravelBed = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.12, 20), this.gravelMat);
      gravelBed.position.set(0, 0.12, 0);
      group.add(gravelBed);

      // Doğal Biyolojik Tutma Göleti (Fitoremediasyon Su Havzası)
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.15, 20), this.waterMat);
      pond.position.set(0, 0.14, 0);
      group.add(pond);

      // Biyolojik Havalandırma & Oksijen Fıskiyesi
      const fountain = this.cloneModel('pavement-fountain.glb', 1.1, 1.1, 1.1);
      if (fountain) {
        fountain.position.set(0, 0.13, 0);
        group.add(fountain);
      }

      // Fitoremediasyon Sazlıkları (Cattails & Reeds) - Su Kenarında Doğal Filtreleme Kümeleri
      const reedPositions = [
        [-0.75, 0.55], [-0.85, -0.45], [0.80, 0.50], [0.70, -0.60],
        [0.0, 0.90], [0.0, -0.90], [-0.95, 0.0], [0.95, 0.0]
      ];
      reedPositions.forEach(([rx, rz]) => {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.42, 5), this.reedMat);
        stalk.position.set(rx, 0.28, rz);
        stalk.rotation.z = (Math.random() - 0.5) * 0.2;
        group.add(stalk);

        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 6), this.terraceStoneMat);
        tip.position.set(rx, 0.46, rz);
        group.add(tip);
      });

      // Köşelere Doğal Akdeniz Kıyı Ağaçları (Söğüt & Çınar)
      [
        [-1.0, -1.0, 'grass-trees-tall.glb', 1.25],
        [1.0, 1.0, 'grass-trees.glb', 1.25],
        [-1.05, 1.05, 'suburban/tree-large.glb', 1.8],
        [1.05, -1.05, 'suburban/tree-large.glb', 1.7]
      ].forEach(([tx, tz, file, s]) => {
        const t = this.cloneModel(file, s, s, s);
        if (t) {
          t.position.set(tx, 0.11, tz);
          group.add(t);
        }
      });

      // v9.0 Ahşap Seyir İskelesi / Yaya Köprüsü (Wooden Observation Deck & Footbridge) ve Taş Savak (Stone Spillway Weir)
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.85, metalness: 0.05 });
      const boardwalkGroup = new THREE.Group();
      boardwalkGroup.name = 'WoodenBoardwalk';
      for (let bx = -0.65; bx <= 0.65; bx += 0.16) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.42), woodMat);
        plank.position.set(bx, 0.25, 0.35);
        boardwalkGroup.add(plank);
      }
      const railL = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.03, 0.03), woodMat);
      railL.position.set(0, 0.38, 0.16);
      boardwalkGroup.add(railL);
      const railR = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.03, 0.03), woodMat);
      railR.position.set(0, 0.38, 0.54);
      boardwalkGroup.add(railR);
      group.add(boardwalkGroup);
      group.userData.boardwalkGroup = boardwalkGroup;

      // Taş Savak Kapısı (Stone Spillway Weir) ve Gabion İstinat Setleri
      const weirGroup = new THREE.Group();
      weirGroup.name = 'StoneSpillwayWeir';
      const weirWall = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.18), this.terraceStoneMat);
      weirWall.position.set(0, 0.20, 1.18);
      weirGroup.add(weirWall);
      group.add(weirGroup);
      group.userData.weirGroup = weirGroup;
      group.userData.pondMesh = pond;
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
    } else if (typeId === 'solar_farm') {
      // 9. GÜNEŞ TARLASI (Büyük Ölçekli Temiz Güneş Enerjisi Santrali)
      const gravelTile = this.cloneModel('pavement.glb', 3.0, 1.8, 3.0);
      if (gravelTile) group.add(gravelTile);

      // 3 Sıra Çiftli Güneş Paneli Masaları (Güneye 24° açıyla eğimli)
      const panelGeom = new THREE.BoxGeometry(1.15, 0.04, 0.62);
      const standMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });

      [-0.85, 0.0, 0.85].forEach((pz) => {
        [-0.72, 0.72].forEach((px) => {
          const panelGroup = new THREE.Group();
          panelGroup.position.set(px, 0.12, pz);

          // Ayaklar
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), standMat);
          leg.position.set(0, 0.175, 0);
          panelGroup.add(leg);

          // Panel tablası
          const pMesh = new THREE.Mesh(panelGeom, this.solarMat);
          pMesh.position.set(0, 0.36, 0);
          pMesh.rotation.x = Math.PI / 8;
          pMesh.castShadow = true;
          panelGroup.add(pMesh);

          group.add(panelGroup);
        });
      });

      // İnverter / Transformatör Kabini
      const inverterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.5 });
      const inverter = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.38), inverterMat);
      inverter.position.set(1.15, 0.38, -1.15);
      inverter.castShadow = true;
      group.add(inverter);

      const statusLed = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8), this.glowCyanMat);
      statusLed.position.set(1.15, 0.68, -1.15);
      group.add(statusLed);
    } else if (typeId === 'legacy_concrete') {
      // 10. ESKİ KÖMÜRLÜ / BETON YAPI (Geçirimsiz, Kirletici ve Isı Kaynağı Fosil Tesis)
      const dirtyTile = this.cloneModel('pavement.glb', 3.0, 2.0, 3.0);
      if (dirtyTile) group.add(dirtyTile);

      const oldFactoryVariants = [
        'commercial/building-d.glb',
        'building-small-d.glb',
        'commercial/building-a.glb'
      ];
      const vKey = oldFactoryVariants[seed % oldFactoryVariants.length];
      const factory = this.cloneModel(vKey, 1.95, 1.95, 1.95);
      if (factory) {
        factory.position.set(0, 0.11, 0);
        // Eski yıpranmış gri/antrasit ton
        factory.traverse((c) => {
          if (c.isMesh && c.material) {
            c.material = c.material.clone();
            c.material.color.multiplyScalar(0.72);
            c.material.roughness = 0.95;
          }
        });
        group.add(factory);
      }

      // Kömür / Fosil Egzoz Bacası (Smokestack)
      const chimneyMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.88,
        metalness: 0.2
      });
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 2.4, 12), chimneyMat);
      chimney.position.set(0.85, 1.3, -0.75);
      chimney.castShadow = true;
      group.add(chimney);

      // Baca üstü koyu kirlilik bileziği
      const capMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.18, 12), capMat);
      cap.position.set(0.85, 2.45, -0.75);
      group.add(cap);

      // Çatıda eski paslı havalandırma kasası
      const rustMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.65), rustMat);
      vent.position.set(-0.65, 1.45, 0.35);
      vent.castShadow = true;
      group.add(vent);

      // Çatı Endüstriyel HVAC Kondenser Üniteleri
      const hvac1 = this.createHvacUnit(1.0);
      hvac1.position.set(-0.45, 2.75, 0.25);
      group.add(hvac1);

      const hvac2 = this.createHvacUnit(1.0);
      hvac2.position.set(0.35, 2.75, -0.35);
      group.add(hvac2);

      group.userData.hvacUnits = [hvac1, hvac2];
      group.userData.hvacFans = [hvac1.userData.fan, hvac2.userData.fan];
    } else if (typeId === 'waste_station') {
      // 11. AKILLI SIFIR ATIK AYRIŞTIRMA İSTASYONU (4 Hazneli Akıllı Geri Dönüşüm Noktası)
      const paveTile = this.cloneModel('pavement.glb', 3.0, 2.0, 3.0);
      if (paveTile) group.add(paveTile);

      // İstasyon Taban Platformu ve Koruyucu Arka Duvar
      const stationBase = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 1.4), this.curbMat);
      stationBase.position.set(0, 0.13, 0);
      group.add(stationBase);

      const backWall = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.25, 0.08), this.asphaltBaseMat);
      backWall.position.set(0, 0.72, -0.62);
      backWall.castShadow = true;
      group.add(backWall);

      // 4 Ayrı Renkli Ayrıştırma Haznesi: Mavi (Kağıt), Sarı (Plastik), Yeşil (Cam), Kahverengi (Organik)
      const podConfigs = [
        { x: -0.81, mat: this.recycleBlueMat, label: 'KAĞIT' },
        { x: -0.27, mat: this.recycleYellowMat, label: 'PLASTİK' },
        { x: 0.27, mat: this.recycleGreenMat, label: 'CAM' },
        { x: 0.81, mat: this.recycleBrownMat, label: 'ORGANİK' }
      ];

      podConfigs.forEach((cfg) => {
        const binBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.72, 0.48), cfg.mat);
        binBody.position.set(cfg.x, 0.48, -0.15);
        binBody.castShadow = true;
        group.add(binBody);

        // Atık atma ağzı (Slot Lid)
        const lid = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.10, 0.44), this.asphaltBaseMat);
        lid.position.set(cfg.x, 0.88, -0.15);
        group.add(lid);

        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.08), this.glowCyanMat);
        slot.position.set(cfg.x, 0.87, 0.06);
        group.add(slot);
      });

      // Solar Sundurma Çatısı (Güneş Enerjili Akıllı İstasyon)
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 1.6), roofMat);
      roof.position.set(0, 1.42, -0.05);
      roof.rotation.x = Math.PI / 18;
      roof.castShadow = true;
      group.add(roof);

      // Çatı Güneş Paneli
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.03, 1.1), this.solarMat);
      panel.position.set(0, 1.47, -0.05);
      panel.rotation.x = Math.PI / 18;
      group.add(panel);

      // Dijital Bilgilendirme ve Seviye LED Paneli
      const ledBanner = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.04), this.glowCyanMat);
      ledBanner.position.set(0, 1.25, -0.56);
      group.add(ledBanner);

      // Yan Çiçeklik ve Ağaç
      const planter = this.cloneModel('suburban/planter.glb', 1.6, 1.6, 1.6);
      if (planter) {
        planter.position.set(-1.15, 0.11, 0.75);
        group.add(planter);
      }
      const tree = this.cloneModel('suburban/tree-small.glb', 1.6, 1.6, 1.6);
      if (tree) {
        tree.position.set(1.15, 0.11, 0.75);
        group.add(tree);
      }
    } else if (typeId === 'biogas_plant') {
      // 12. BİYOGAZ & KOMPOST TESİSİ (Organik Atık Fermantasyon Reaktörü & Temiz Enerji Santrali)
      const paveTile = this.cloneModel('pavement.glb', 3.0, 2.0, 3.0);
      if (paveTile) group.add(paveTile);

      // Ana Biyodijester Fermantasyon Kubbesi (Yeşil Küresel Reaktör)
      const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.88, 0.75, 24), this.bioDomeMat);
      domeBase.position.set(-0.48, 0.46, -0.32);
      domeBase.castShadow = true;
      group.add(domeBase);

      const domeTop = new THREE.Mesh(new THREE.SphereGeometry(0.82, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), this.bioDomeMat);
      domeTop.position.set(-0.48, 0.83, -0.32);
      domeTop.castShadow = true;
      group.add(domeTop);

      // Basınç Emniyet Vanası ve Havalandırma Başlığı
      const reliefVent = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8), this.glowCyanMat);
      reliefVent.position.set(-0.48, 1.72, -0.32);
      group.add(reliefVent);

      // Biyogaz Depolama Gazometresi (Gümüş Küresel Tank)
      const gasTank = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 14), this.gasTankMat);
      gasTank.position.set(0.78, 0.65, -0.45);
      gasTank.castShadow = true;
      group.add(gasTank);

      const tankStand = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.32, 12), this.asphaltBaseMat);
      tankStand.position.set(0.78, 0.22, -0.45);
      group.add(tankStand);

      // Organik Atık Besleme Hunisi & Kompost İşleme Hangarı
      const hopper = this.cloneModel('building-garage.glb', 1.45, 1.5, 1.45);
      if (hopper) {
        hopper.position.set(0.35, 0.11, 0.62);
        group.add(hopper);
      }

      // Kojenerasyon Elektrik Türbin Ünitesi
      const turbineBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.55), this.terraceStoneMat);
      turbineBox.position.set(-0.85, 0.36, 0.65);
      turbineBox.castShadow = true;
      group.add(turbineBox);

      // Paslanmaz Filtreli Egzoz Bacası
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.55, 8), this.gasTankMat);
      stack.position.set(-1.05, 0.88, 0.65);
      stack.castShadow = true;
      group.add(stack);

      // Reaktörler Arası Transfer Boru Hattı
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.25 });
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25, 8), pipeMat);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0.15, 0.72, -0.38);
      group.add(pipe);

      // v9.0 Profesyonel Gaz Meşalesi Bacası (Flare Stack), Yeşil Emniyet Vanaları ve Kompost Depolama Bunkeri
      const flareGroup = new THREE.Group();
      flareGroup.name = 'BiogasFlareStack';
      const flareTower = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 1.85, 8), this.gasTankMat);
      flareTower.position.set(1.05, 1.02, 0.55);
      flareGroup.add(flareTower);
      const flareFlameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const flareFlame = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 8), flareFlameMat);
      flareFlame.position.set(1.05, 2.04, 0.55);
      flareGroup.add(flareFlame);
      group.add(flareGroup);
      group.userData.flareGroup = flareGroup;

      // Yeşil Emniyet Vanaları (Safety Valves)
      const valveGroup = new THREE.Group();
      valveGroup.name = 'SafetyValves';
      const valveMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.6, roughness: 0.3 });
      [-0.12, 0.32].forEach((vx) => {
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.018, 6, 12), valveMat);
        wheel.position.set(vx, 0.79, -0.38);
        valveGroup.add(wheel);
      });
      group.add(valveGroup);
      group.userData.valveGroup = valveGroup;
    } else if (typeId === 'water_treatment') {
      // 13. BİYOLOJİK İLERİ ARITMA TESİSİ (Çökeltme Havuzu, Sıyırıcı Köprü, Biyoreaktör & UV Dezenfeksiyon)
      const paveTile = this.cloneModel('pavement.glb', 3.0, 2.0, 3.0);
      if (paveTile) group.add(paveTile);

      // Dairesel Çökeltme & Berraklaştırma Havuzu
      const clarifierRim = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 1.02, 0.42, 28, 1, true), this.curbMat);
      clarifierRim.position.set(-0.45, 0.28, 0.0);
      clarifierRim.castShadow = true;
      group.add(clarifierRim);

      const clarifierWater = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.36, 28), this.waterMat);
      clarifierWater.position.set(-0.45, 0.26, 0.0);
      group.add(clarifierWater);

      // Dönen Çamur Sıyırıcı Köprüsü (Clarifier Bridge)
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 0.14), this.clarifierBridgeMat);
      bridge.position.set(-0.45, 0.52, 0.0);
      bridge.rotation.y = Math.PI / 4;
      bridge.castShadow = true;
      group.add(bridge);

      const centerPivot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.58, 12), this.asphaltBaseMat);
      centerPivot.position.set(-0.45, 0.32, 0.0);
      group.add(centerPivot);

      // Biyolojik Havalandırma Tankı (Aeration Basin)
      const basin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.85), this.terraceStoneMat);
      basin.position.set(0.85, 0.28, -0.58);
      basin.castShadow = true;
      group.add(basin);

      const basinWater = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.75), this.waterMat);
      basinWater.position.set(0.85, 0.45, -0.58);
      group.add(basinWater);

      // Pompa & Membran Filtrasyon Binası
      const pumpHouse = this.cloneModel('building-garage.glb', 1.45, 1.6, 1.45);
      if (pumpHouse) {
        pumpHouse.position.set(0.85, 0.11, 0.62);
        group.add(pumpHouse);
      }

      // Mavi Çelik Dağıtım Boruları
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.2 });
      const mainPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 8), pipeMat);
      mainPipe.rotation.x = Math.PI / 2;
      mainPipe.position.set(0.85, 0.52, 0.0);
      group.add(mainPipe);
    } else if (typeId === 'marine_barrier') {
      // 14. YÜZER MÜSİLAJ VE ATIK BARİYERİ (Şamandıralı Yüzer Koruma Hattı)
      const paveTile = this.cloneModel('pavement.glb', 3.0, 1.8, 3.0);
      if (paveTile) group.add(paveTile);

      // Kıyı İçi Dalgakıran ve Sabitleme Taş Bloğu
      const anchorBlock = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.22, 0.6), this.terraceStoneMat);
      anchorBlock.position.set(0, 0.15, -0.9);
      anchorBlock.castShadow = true;
      group.add(anchorBlock);

      // Su Yüzey Tabakası
      const waterPad = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.8), this.waterMat);
      waterPad.position.set(0, 0.16, 0.3);
      group.add(waterPad);

      // Yüzer Şamandıralı Bariyer Hattı (5 Adet Birbirine Bağlı Turuncu Silindirik Duba)
      const floatXPositions = [-1.0, -0.5, 0.0, 0.5, 1.0];
      floatXPositions.forEach((fx, idx) => {
        const floatMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.45, 8), this.barrierFloatMat);
        floatMesh.rotation.z = Math.PI / 2;
        floatMesh.position.set(fx, 0.26, 0.25 + Math.sin(idx * 0.9) * 0.12);
        floatMesh.castShadow = true;
        group.add(floatMesh);
      });

      // Bağlantı Çelik Kablosu
      const cableMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.3 });
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.5, 6), cableMat);
      cable.rotation.z = Math.PI / 2;
      cable.position.set(0, 0.26, 0.3);
      group.add(cable);

      // Flaşörlü Güneş Enerjili Navigasyon İkaz Şamandıraları
      [-0.95, 0.95].forEach((bx) => {
        const beaconPost = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6), this.asphaltBaseMat);
        beaconPost.position.set(bx, 0.46, 0.28);
        group.add(beaconPost);

        const beaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), this.recycleYellowMat);
        beaconLight.position.set(bx, 0.68, 0.28);
        group.add(beaconLight);
      });

      // Sualtı Atık Tutucu Perde Ağı (Subsurface Mesh)
      const netMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, wireframe: true, transparent: true, opacity: 0.7 });
      const netMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.35, 12, 3), netMat);
      netMesh.position.set(0, 0.08, 0.3);
      group.add(netMesh);
    } else if (typeId === 'coastal_pump') {
      // 15. KIYI FIRTINA TAHLİYE POMPASI (Santrifüj Pompa İstasyonu)
      const pad = this.cloneModel('pavement.glb', 3.0, 1.8, 3.0);
      if (pad) group.add(pad);

      // Pompa İstasyonu Kumanda ve Jeneratör Binası
      const pumpShed = this.cloneModel('building-garage.glb', 1.35, 1.5, 1.35);
      if (pumpShed) {
        pumpShed.position.set(-0.75, 0.11, -0.65);
        group.add(pumpShed);
      }

      // Derin Emme Havuzu (Su Giriş Izgarası)
      const sumpGeom = new THREE.BoxGeometry(1.2, 0.28, 1.1);
      const sump = new THREE.Mesh(sumpGeom, this.terraceStoneMat);
      sump.position.set(0.65, 0.16, -0.65);
      sump.castShadow = true;
      group.add(sump);

      const grateMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.9), grateMat);
      grate.rotateX(-Math.PI / 2);
      grate.position.set(0.65, 0.31, -0.65);
      group.add(grate);

      // İkiz Yüksek Debili Dalgıç/Santrifüj Pompalar
      const pumpBodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.25 });
      [-0.15, 0.35].forEach((px) => {
        const pumpCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.58, 12), pumpBodyMat);
        pumpCylinder.position.set(px, 0.42, 0.25);
        pumpCylinder.castShadow = true;
        group.add(pumpCylinder);

        const motorCap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 10), this.asphaltBaseMat);
        motorCap.position.set(px, 0.78, 0.25);
        group.add(motorCap);
      });

      // Büyük Çaplı Kıyı Tahliye Borusu (Güneye / Denize doğru yönlenmiş)
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.85, roughness: 0.2 });
      const outfallPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.45, 12), pipeMat);
      outfallPipe.rotation.x = Math.PI / 2;
      outfallPipe.position.set(0.1, 0.35, 0.75);
      outfallPipe.castShadow = true;
      group.add(outfallPipe);

      // Flaşörlü Uyarı Lambası
      const beaconPost = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), this.asphaltBaseMat);
      beaconPost.position.set(-0.75, 1.25, -0.65);
      group.add(beaconPost);
      const beaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), this.recycleYellowMat);
      beaconLight.position.set(-0.75, 1.5, -0.65);
      group.add(beaconLight);

      // v9.0 Profesyonel Yarı Şeffaf Cam Kontrol Kabini, Dönen Manometre Göstergeleri ve Çift Emiş Manifoldu
      const cabinGlassMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        metalness: 0.6
      });
      const controlCabin = new THREE.Group();
      controlCabin.name = 'GlassControlCabin';
      const cabinFrame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.62, 0.58), cabinGlassMat);
      cabinFrame.position.set(-0.82, 0.42, 0.45);
      controlCabin.add(cabinFrame);
      group.add(controlCabin);
      group.userData.controlCabin = controlCabin;

      // Manometre Basınç Göstergeleri (Pressure Gauges)
      const gaugeGroup = new THREE.Group();
      gaugeGroup.name = 'PressureGauges';
      const gaugeFaceMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      [-0.15, 0.35].forEach((gx) => {
        const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 12), gaugeFaceMat);
        dial.rotation.x = Math.PI / 2;
        dial.position.set(gx, 0.62, 0.52);
        gaugeGroup.add(dial);
      });
      group.add(gaugeGroup);
      group.userData.gaugeGroup = gaugeGroup;

      // Çift Emiş Manifoldu (Twin Suction Manifold)
      const manifoldGroup = new THREE.Group();
      manifoldGroup.name = 'TwinSuctionManifold';
      const manifoldBar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.85, 10), pumpBodyMat);
      manifoldBar.rotation.z = Math.PI / 2;
      manifoldBar.position.set(0.10, 0.42, -0.15);
      manifoldGroup.add(manifoldBar);
      group.add(manifoldGroup);
      group.userData.manifoldGroup = manifoldGroup;
    } else if (typeId === 'compost_greenhouse') {
      // 16. ORGANİK KOMPOST & SERA ÜRETİM TESİSİ
      const grassBase = this.cloneModel('grass.glb', 3.0, 1.8, 3.0);
      if (grassBase) group.add(grassBase);

      // Şeffaf Ekolojik Sera Kubbesi
      const ghWidth = 2.1;
      const ghLength = 1.6;
      const ghGeom = new THREE.CylinderGeometry(0.72, 0.72, ghLength, 16, 1, false, 0, Math.PI);
      ghGeom.rotateZ(Math.PI / 2);
      const ghGlassMat = new THREE.MeshStandardMaterial({
        color: 0x86efac,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55
      });
      const greenhouseMesh = new THREE.Mesh(ghGeom, ghGlassMat);
      greenhouseMesh.position.set(-0.35, 0.78, 0.0);
      greenhouseMesh.castShadow = true;
      group.add(greenhouseMesh);

      // Sera Taban Çerçevesi
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
      const baseFrame = new THREE.Mesh(new THREE.BoxGeometry(ghLength + 0.1, 0.15, ghWidth + 0.1), frameMat);
      baseFrame.position.set(-0.35, 0.15, 0.0);
      group.add(baseFrame);

      // Sera İçi Zengin Kompost Yatakları ve Fideler
      const soilMat = new THREE.MeshStandardMaterial({ color: 0x3f2314, roughness: 0.95 });
      [-0.45, 0.45].forEach((oz) => {
        const bed = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.42), soilMat);
        bed.position.set(-0.35, 0.22, oz);
        group.add(bed);

        for (let bx = -0.85; bx <= 0.15; bx += 0.25) {
          const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), this.reedMat);
          plant.position.set(bx, 0.35, oz);
          group.add(plant);
        }
      });

      // Döner Kompost Tamburları (Organik fermantasyon silindirleri)
      const drumMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6, metalness: 0.2 });
      [-0.35, 0.35].forEach((dz) => {
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.65, 10), drumMat);
        drum.rotation.z = Math.PI / 2;
        drum.position.set(0.95, 0.38, dz);
        drum.castShadow = true;
        group.add(drum);

        const support = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.45), frameMat);
        support.position.set(0.95, 0.18, dz);
        group.add(support);
      });
    } else if (typeId === 'sea_breakwater') {
      // 17. KIYI DALGA KIRAN & FALEZ TAHKİMATI
      const waterBase = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.1, 2.96), this.waterMat);
      waterBase.position.set(0, 0.06, 0);
      group.add(waterBase);

      // Doğal Granit ve Bazalt Falez Blokları (Erozyon Önleyici Tahkimat)
      const rockCoords = [
        [-0.85, 0.32, -0.65, 0.82, 0.65],
        [0.0, 0.42, -0.72, 1.05, 0.78],
        [0.85, 0.35, -0.60, 0.88, 0.70],
        [-0.95, 0.26, 0.15, 0.75, 0.55],
        [-0.25, 0.38, 0.20, 0.95, 0.72],
        [0.65, 0.32, 0.18, 0.85, 0.62],
        [-0.55, 0.22, 0.85, 0.70, 0.50],
        [0.35, 0.25, 0.82, 0.76, 0.52]
      ];

      rockCoords.forEach(([rx, ry, rz, s, h]) => {
        const rockGeom = new THREE.DodecahedronGeometry(s * 0.42, 1);
        const rock = new THREE.Mesh(rockGeom, this.terraceStoneMat);
        rock.scale.set(1.15, h / (s * 0.42), 1.05);
        rock.position.set(rx, ry, rz);
        rock.rotation.set(rx * 1.5, rz * 2.1, ry);
        rock.castShadow = true;
        group.add(rock);
      });

      // Kırılan Dalga Köpük Halkaları (Beyaz Fırtına Köpüğü)
      const splashMat = new THREE.MeshBasicMaterial({ color: 0xf0f9ff, transparent: true, opacity: 0.75 });
      [-0.45, 0.45].forEach((sx) => {
        const foamRing = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.68, 12), splashMat);
        foamRing.rotateX(-Math.PI / 2);
        foamRing.position.set(sx, 0.14, 0.65);
        group.add(foamRing);
      });

      // Deniz Navigasyon İkaz Feneri (Solar Şamandıra Kulesi)
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.85, 8), this.asphaltBaseMat);
      tower.position.set(0.0, 0.85, -0.72);
      group.add(tower);

      const beaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), this.recycleYellowMat);
      beaconLight.position.set(0.0, 1.32, -0.72);
      group.add(beaconLight);
    } else if (typeId === 'drain_grate') {
      // 18. DÖKÜM DEMİR YAĞMUR SUYU MAZGALI
      // Zemin beton bordür / asfalt geçiş çerçevesi (2.9 x 0.12 x 2.9)
      const curbFrame = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.12, 2.9), this.curbMat);
      curbFrame.position.set(0, 0.06, 0);
      curbFrame.receiveShadow = true;
      group.add(curbFrame);

      // Mazgal çukuru (Derin drenaj haznesi)
      const pitGeom = new THREE.BoxGeometry(2.1, 0.32, 1.4);
      const pitMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
      const pit = new THREE.Mesh(pitGeom, pitMat);
      pit.position.set(0, 0.04, 0);
      group.add(pit);

      // Döküm demir ızgara çerçevesi
      const grateFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.35 });
      const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.06, 1.46), grateFrameMat);
      frameMesh.position.set(0, 0.14, 0);
      frameMesh.castShadow = true;
      group.add(frameMesh);

      // Çerçeve köşe montaj cıvataları (Cast Iron Hex Corner Bolts)
      const boltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
      [
        [-0.98, -0.63], [0.98, -0.63],
        [-0.98, 0.63], [0.98, 0.63]
      ].forEach(([bx, bz]) => {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 6), boltMat);
        bolt.position.set(bx, 0.175, bz);
        group.add(bolt);
      });

      // Izgara yarıkları / döküm demir lamalar (11 adet ağır paralel döküm çubuk)
      const barMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.25 });
      for (let bx = -0.92; bx <= 0.92; bx += 0.185) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 1.34), barMat);
        bar.position.set(bx, 0.15, 0);
        bar.castShadow = true;
        group.add(bar);
      }

      // Enine takviye bağlama çubuğu (Transverse Tie-Bar)
      const tieBar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.95, 8), barMat);
      tieBar.rotation.z = Math.PI / 2;
      tieBar.position.set(0, 0.148, 0);
      group.add(tieBar);

      // Alt kolektör tahliye borusu girişi
      const collectorPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }));
      collectorPipe.rotation.x = Math.PI / 2;
      collectorPipe.position.set(0, 0.02, 0.95);
      group.add(collectorPipe);

      // Su emiş girdap / akıntı göstergesi (hafif şeffaf mavi halka)
      const vortex = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.55, 16), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
      vortex.rotateX(-Math.PI / 2);
      vortex.position.set(0, 0.165, 0);
      group.add(vortex);

      // Tıkanma Hissi Veren Sürüklenmiş Çöp Grubu (Clogged Street Litter Debris)
      const clogGroup = new THREE.Group();
      clogGroup.name = 'CloggedLitter';

      // 1. Izgaraya yapışmış ıslak siyah poşet parçası
      const wetBagMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.1 });
      const wetBag = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.32), wetBagMat);
      wetBag.position.set(-0.35, 0.175, 0.1);
      wetBag.rotation.y = 0.25;
      clogGroup.add(wetBag);

      // 2. Parmaklıkların arasına sıkışmış ezik alüminyum kutu
      const squashedCanMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.3 });
      const squashedCan = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.11, 6), squashedCanMat);
      squashedCan.rotation.z = Math.PI / 2.1;
      squashedCan.position.set(0.18, 0.17, -0.15);
      clogGroup.add(squashedCan);

      // 3. Suya doymuş tortu / organik yaprak tortusu
      const muckMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
      const muck = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 0), muckMat);
      muck.scale.set(1.4, 0.3, 1.1);
      muck.position.set(0.42, 0.17, 0.22);
      clogGroup.add(muck);

      clogGroup.visible = false;
      group.add(clogGroup);
      group.userData.clogGroup = clogGroup;
    }

    group.rotation.y = facingAngle;
    return group;
  }

  // İnşaat Efekti: Fiziksel Ağır Düşüş + Bounce & Toz Bulutu Halkası
  animateSpawn(object, duration = 340, cellX = null, cellZ = null) {
    const origY = object.position.y;
    object.scale.set(0.01, 0.01, 0.01);
    object.position.y = origY + 0.55;
    const start = performance.now();

    const px = cellX !== null ? cellX : object.position.x;
    const pz = cellZ !== null ? cellZ : object.position.z;
    this.createConstructionDustPuff(px, origY, pz);

    const step = (now) => {
      const p = Math.min((now - start) / duration, 1.0);
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const ease = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);

      const s = Math.max(0.01, ease);
      object.scale.set(s, s, s);
      object.position.y = THREE.MathUtils.lerp(origY + 0.55, origY, Math.min(1.0, p * 1.3));

      if (p < 1.0) {
        requestAnimationFrame(step);
      } else {
        object.scale.set(1.0, 1.0, 1.0);
        object.position.y = origY;
      }
    };
    requestAnimationFrame(step);
  }

  // İnşaat Anı Zemin Toz Halkası
  createConstructionDustPuff(x, y, z) {
    const puffGroup = new THREE.Group();
    puffGroup.position.set(x, y + 0.05, z);
    this.scene.add(puffGroup);

    const puffGeom = new THREE.DodecahedronGeometry(0.24, 0);
    const puffMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.9,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    const count = 12;
    const puffs = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const dist = 0.55 + Math.random() * 0.3;
      const mesh = new THREE.Mesh(puffGeom, puffMat.clone());
      mesh.scale.set(0.6, 0.4, 0.6);
      puffGroup.add(mesh);
      puffs.push({
        mesh,
        angle,
        startDist: dist,
        maxDist: dist + 0.9 + Math.random() * 0.4,
        speed: 1.8 + Math.random() * 0.8,
        rotSpeed: (Math.random() - 0.5) * 4
      });
    }

    const start = performance.now();
    const duration = 480;

    const anim = (now) => {
      const p = Math.min((now - start) / duration, 1.0);
      puffs.forEach((puf) => {
        const curDist = THREE.MathUtils.lerp(puf.startDist, puf.maxDist, Math.sin((p * Math.PI) / 2));
        puf.mesh.position.x = Math.cos(puf.angle) * curDist;
        puf.mesh.position.z = Math.sin(puf.angle) * curDist;
        puf.mesh.position.y = Math.sin(p * Math.PI) * 0.35;
        puf.mesh.rotation.y += puf.rotSpeed * 0.02;
        const s = (0.5 + p * 0.9) * (1.0 - p * 0.4);
        puf.mesh.scale.set(s, s * 0.55, s);
        puf.mesh.material.opacity = (1.0 - p) * 0.75;
      });

      if (p < 1.0) {
        requestAnimationFrame(anim);
      } else {
        this.scene.remove(puffGroup);
        puffs.forEach((puf) => {
          puf.mesh.material.dispose();
        });
        puffGeom.dispose();
        puffMat.dispose();
      }
    };
    requestAnimationFrame(anim);
  }

  // Yıkım / Buldozer Efekti: Yapı Titremesi & Zemine Çöküş + Moloz & Toz Püskürmesi
  animateDemolition(object, cellX, cellZ, onComplete) {
    if (!object) {
      if (onComplete) onComplete();
      return;
    }

    const origY = object.position.y;
    const origX = object.position.x;
    const origZ = object.position.z;
    const start = performance.now();
    const duration = 280;

    this.createDemolitionDebris(cellX, origY, cellZ);

    const step = (now) => {
      const p = Math.min((now - start) / duration, 1.0);
      const shake = (1.0 - p) * 0.09;
      object.position.x = origX + (Math.random() - 0.5) * shake;
      object.position.z = origZ + (Math.random() - 0.5) * shake;

      const sy = Math.max(0.01, 1.0 - Math.pow(p, 1.8));
      const sHoriz = 1.0 + p * 0.22;
      object.scale.set(sHoriz, sy, sHoriz);
      object.position.y = THREE.MathUtils.lerp(origY, origY - 0.15, p);

      if (p < 1.0) {
        requestAnimationFrame(step);
      } else {
        this.disposeHierarchy(object);
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(step);
  }

  disposeHierarchy(obj) {
    if (!obj) return;
    obj.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  // Yıkım Anı Moloz & Beton Parçacıkları (Debris & Smoke)
  createDemolitionDebris(x, y, z) {
    const debrisGroup = new THREE.Group();
    debrisGroup.position.set(x, y + 0.12, z);
    this.scene.add(debrisGroup);

    const debrisGeom = new THREE.DodecahedronGeometry(0.18, 0);
    const colors = [0x64748b, 0x94a3b8, 0x475569, 0xd97706, 0x78716c];

    const count = 18;
    const pieces = [];
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.9,
        transparent: true,
        opacity: 0.95
      });
      const mesh = new THREE.Mesh(debrisGeom, mat);
      const s = 0.5 + Math.random() * 0.7;
      mesh.scale.set(s, s * (0.6 + Math.random() * 0.6), s);
      debrisGroup.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speedH = 1.8 + Math.random() * 2.8;
      const speedV = 3.2 + Math.random() * 3.5;

      pieces.push({
        mesh,
        vx: Math.cos(angle) * speedH,
        vy: speedV,
        vz: Math.sin(angle) * speedH,
        rx: (Math.random() - 0.5) * 10,
        ry: (Math.random() - 0.5) * 10,
        x: (Math.random() - 0.5) * 0.6,
        y: 0.1 + Math.random() * 0.4,
        z: (Math.random() - 0.5) * 0.6
      });
    }

    let lastT = performance.now();
    const duration = 650;
    const startTime = lastT;

    const anim = (now) => {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      const p = Math.min((now - startTime) / duration, 1.0);

      pieces.forEach((piece) => {
        piece.vy -= 12.0 * dt;
        piece.x += piece.vx * dt;
        piece.y = Math.max(0.02, piece.y + piece.vy * dt);
        piece.z += piece.vz * dt;

        piece.mesh.position.set(piece.x, piece.y, piece.z);
        piece.mesh.rotation.x += piece.rx * dt;
        piece.mesh.rotation.y += piece.ry * dt;

        piece.mesh.material.opacity = Math.max(0, 1.0 - p * 1.15);
      });

      if (p < 1.0) {
        requestAnimationFrame(anim);
      } else {
        this.scene.remove(debrisGroup);
        pieces.forEach((piece) => {
          piece.mesh.material.dispose();
        });
        debrisGeom.dispose();
      }
    };
    requestAnimationFrame(anim);
  }
}
