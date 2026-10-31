import * as THREE from 'three';
import { WorldScene } from './scene.js';
import { GridManager } from './grid.js';
import { BuildingManager, BUILD_CATEGORIES, BUILDINGS_CATALOG } from './buildings.js';
import { TrafficSystem } from './traffic.js';
import { DisasterSimulator } from './disasters.js';
import { GameManager } from './game.js';
import { sound } from './audio.js';

// DOM Elementleri
const container = document.getElementById('canvas-container');
const valBudget = document.getElementById('val-budget');
const valIncome = document.getElementById('val-income');
const valPop = document.getElementById('val-pop');
const valCarbon = document.getElementById('val-carbon');
const valHealth = document.getElementById('val-health');
const valSponge = document.getElementById('val-sponge');
const barSponge = document.getElementById('bar-sponge');
const valCooling = document.getElementById('val-cooling');
const barCooling = document.getElementById('bar-cooling');

const radarStatus = document.getElementById('radar-status');
const radarDesc = document.getElementById('radar-desc');
const radarTime = document.getElementById('radar-time');
const radarBox = document.getElementById('radar-box');

const auraContent = document.getElementById('aura-content');

// Alt Toolbar & Kategorili Mini Alt Bar Elementleri
const buildSubbar = document.getElementById('build-subbar');
const categoryTabsEl = document.getElementById('category-tabs');
const categoryItemsEl = document.getElementById('category-items');
const infoItemName = document.getElementById('info-item-name');
const infoItemDesc = document.getElementById('info-item-desc');
const btnCloseSubbar = document.getElementById('btn-close-subbar');

const btnToolHammer = document.getElementById('btn-tool-hammer');
const btnToolRoad = document.getElementById('btn-tool-road');
const btnToolBulldoze = document.getElementById('btn-tool-bulldoze');
const btnToolInspect = document.getElementById('btn-tool-inspect');
const btnToolCamera = document.getElementById('btn-tool-camera');

const btnSpeed = document.getElementById('btn-speed');
const btnSound = document.getElementById('btn-sound');
const btnCamReset = document.getElementById('btn-cam-reset');

const startModal = document.getElementById('start-modal');
const btnStart = document.getElementById('btn-start');
const victoryModal = document.getElementById('victory-modal');
const btnRestartVictory = document.getElementById('btn-restart-victory');
const gameoverModal = document.getElementById('gameover-modal');
const gameoverReason = document.getElementById('gameover-reason');
const btnRestartGameover = document.getElementById('btn-restart-gameover');
const toast = document.getElementById('toast');

// Özel Vektör SVG İkon Kütüphanesi (Sıfır Emoji)
const CATEGORY_SVGS = {
  roads: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19L8 5M16 5l4 14M12 6v2m0 4v2m0 4v2"/></svg>`,
  buildings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-5 8v-5h4v5"/></svg>`,
  parks: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-7l-2-2M17 8v.8A6 6 0 0 1 13.8 20H10A6.5 6.5 0 0 1 7 8a5 5 0 0 1 10 0Z"/></svg>`,
  infra: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`
};

const ITEM_SVGS = {
  road: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19L8 5M16 5l4 14M12 6v2m0 4v2m0 4v2"/></svg>`,
  boulevard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 19L6 5M18 5l3 14M12 19v-6"/><circle cx="12" cy="9" r="4"/></svg>`,
  solar_tram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="12" height="14" rx="2"/><path d="M6 11h12M9 18l-2 3m8-3l2 3M9 15h.01M15 15h.01"/></svg>`,
  eco_house: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  green_roof: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="6" width="16" height="15" rx="1"/><path d="M8 6V3c4 0 4 3 8 3M9 10h2m2 0h2M9 14h2m2 0h2"/></svg>`,
  commercial_hub: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4"/></svg>`,
  sponge_park: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 18c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2"/><path d="M12 13V4m0 0L8 8m4-4 4 4"/></svg>`,
  wind_corridor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>`,
  botanical_plaza: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v2m0 12v2M4 12h2m12 0h2"/></svg>`,
  cistern: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg>`,
  cooling_tower: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h10l-1.5 8L18 21H6l2.5-10L7 3z"/><path d="M10 13h4m-3 4h2"/></svg>`
};

// Fütüristik AURA Diyalog Motoru (Rahatsız edici daktilo sesi yerine tek seferlik fütüristik chime)
let typeInterval = null;
function speakAURA(text) {
  if (typeInterval) clearInterval(typeInterval);
  auraContent.innerText = '';
  sound.playAuraChime();
  let idx = 0;
  typeInterval = setInterval(() => {
    if (idx < text.length) {
      auraContent.innerText += text[idx];
      idx++;
    } else {
      clearInterval(typeInterval);
    }
  }, 16);
}

// Toast
function showToast(msg, type = 'info') {
  toast.innerText = msg;
  toast.className = 'active';
  toast.style.borderColor =
    type === 'error'
      ? 'var(--color-rose)'
      : type === 'success'
      ? 'var(--color-emerald)'
      : 'var(--color-cyan)';
  clearTimeout(toast.tid);
  toast.tid = setTimeout(() => {
    toast.className = '';
  }, 2400);
}

// UI Callback Paketi
const ui = {
  showToast,
  inspectReport(text) {
    showToast(text, 'info');
    // AURA sürekli gereksiz yere her parsele basıldığında konuşup ekranı meşgul etmez
  },
  triggerDisasterWarning(type, seconds) {
    if (type === 'FLOOD') {
      radarStatus.innerText = 'KRİTİK UYARI: ANİ SEL BASKINI';
      radarStatus.style.color = 'var(--color-rose)';
      radarDesc.innerText = 'Toroslar’dan şiddetli taşkın kütlesi iniyor. Sünger parklar ve sarnıçlar kurun!';
      speakAURA('Uyarı Mimar: Toroslar’dan şiddetli taşkın iniyor! Sünger Parklar ve Sarnıçlarla suyu emmeliyiz.');
    } else {
      radarStatus.innerText = 'KRİTİK UYARI: 47°C ISI KUBBESİ';
      radarStatus.style.color = 'var(--color-amber)';
      radarDesc.innerText = 'Akdeniz üzerinden aşırı sıcak hava dalgası yaklaşıyor.';
      speakAURA('Sensörler 47°C sıcak dalgası tespit etti! Rüzgar koridorları ve yeşil çatılar kurun.');
    }
    radarBox.style.borderColor = 'var(--color-rose)';
    radarTime.innerText = `00:${seconds.toString().padStart(2, '0')}`;
  },
  triggerDisasterStart(type) {
    radarStatus.innerText = type === 'FLOOD' ? 'AFET AKTİF: ŞİDDETLİ TAŞKIN' : 'AFET AKTİF: 47°C ISI KUBBESİ';
    radarDesc.innerText = 'Kentsel direnç altyapısı gerçek zamanlı test ediliyor...';
  },
  resetRadar() {
    radarStatus.innerText = 'NORMAL METEOROLOJİ';
    radarStatus.style.color = 'var(--color-cyan)';
    radarDesc.innerText = 'Toros Havzası dengeli; taşkın riski tespit edilmedi.';
    radarBox.style.borderColor = 'rgba(14, 165, 233, 0.35)';
    radarTime.innerText = '--:--';
  },
  triggerDisasterSuccess(reward) {
    this.resetRadar();
    speakAURA(`Tebrikler Mimar! Altyapımız krizi başarıyla atlattı. COP31 Konseyi +$${reward} iklim fonu aktardı.`);
    showToast(`Kriz Savuşturuldu! +$${reward} Hibe Alındı`, 'success');
  },
  showVictory() {
    victoryModal.classList.remove('hidden');
  },
  showGameOver(reason) {
    gameoverReason.innerText = reason;
    gameoverModal.classList.remove('hidden');
  }
};

// 1. Üç Boyutlu Çekirdeği Başlat
const worldScene = new WorldScene(container);
const grid = new GridManager(worldScene.scene, 12);
const bm = new BuildingManager(worldScene.scene);
const disasters = new DisasterSimulator(worldScene.scene);
const game = new GameManager(worldScene, grid, bm, disasters, ui);
// Başlangıç modalı açıkken simülasyon duraklatılmış başlar
game.isPaused = true;
let traffic = null;

// Modelleri Önden Yükle ve Başlangıç Şehrini Kur
bm.preloadAll(() => {
  game.initStarterCity();
  traffic = new TrafficSystem(worldScene.scene, grid);
});

// 2. Kategorili Cities: Skylines İnşaat Alt Barı Yönetimi
let activeCategory = 'roads';
let isSubbarOpen = true;

function updateInfoStrip(spec) {
  if (!spec) return;
  const isSelected = game.toolMode === 'BUILD' && game.selectedBuildingType === spec.id;
  infoItemName.innerText = `${spec.name} • $${spec.cost}${isSelected ? ' (SEÇİLİ)' : ''}`;
  infoItemDesc.innerText = `${spec.desc} — ${spec.isRoad ? 'Tıklayarak veya sürükleyerek döşeyin' : 'Boş parsele tıklayarak inşa edin'} [ESC: İptal]`;
}

function renderCategoryTabs() {
  categoryTabsEl.innerHTML = '';
  BUILD_CATEGORIES.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = `cat-tab ${cat.id === activeCategory ? 'active' : ''}`;
    btn.innerHTML = `${CATEGORY_SVGS[cat.id] || ''}<span>${cat.name}</span>`;
    btn.addEventListener('click', () => {
      activeCategory = cat.id;
      sound.playClick();
      renderCategoryTabs();
      renderCategoryItems();
    });
    categoryTabsEl.appendChild(btn);
  });
}

function renderCategoryItems() {
  categoryItemsEl.innerHTML = '';
  const items = Object.values(BUILDINGS_CATALOG).filter((b) => b.category === activeCategory);

  items.forEach((spec) => {
    const card = document.createElement('div');
    const isSelected = game.toolMode === 'BUILD' && game.selectedBuildingType === spec.id;
    card.className = `build-item-card ${isSelected ? 'active' : ''}`;

    const badges = [];
    if (spec.population > 0) badges.push(`<span class="stat-pill stat-pop">+${spec.population} Nüfus</span>`);
    if (spec.income > 0) badges.push(`<span class="stat-pill stat-inc">+$${spec.income} Gelir</span>`);
    if (spec.spongePower > 0) badges.push(`<span class="stat-pill stat-sponge">+${spec.spongePower} m³/s Sünger</span>`);
    if (spec.coolingPower > 0) badges.push(`<span class="stat-pill stat-cool">-${spec.coolingPower}°C Isı</span>`);
    if (spec.carbon < 0) badges.push(`<span class="stat-pill stat-carbon">${spec.carbon}% CO₂</span>`);
    if (spec.isRoad && badges.length === 0) badges.push('<span class="stat-pill">Otomatik Bağlantı</span>');

    card.innerHTML = `
      <div class="item-icon-box">
        ${ITEM_SVGS[spec.id] || CATEGORY_SVGS[spec.category]}
      </div>
      <div class="item-details">
        <div class="item-top-line">
          <span class="item-title">${spec.shortName}</span>
          <span class="item-price">$${spec.cost}</span>
        </div>
        <div class="item-badges">
          ${badges.join('')}
          ${isSelected ? '<span class="stat-pill stat-active">SEÇİLİ</span>' : ''}
        </div>
      </div>
    `;

    card.addEventListener('mouseenter', () => {
      updateInfoStrip(spec);
    });

    card.addEventListener('click', () => {
      game.selectBuildingType(spec.id);
      setActivePrimaryTool('HAMMER');
      renderCategoryItems();
      updateInfoStrip(spec);
    });

    categoryItemsEl.appendChild(card);
  });

  const currentSpec = BUILDINGS_CATALOG[game.selectedBuildingType] || items[0];
  if (currentSpec) updateInfoStrip(currentSpec);
}

function setSubbarOpen(open) {
  isSubbarOpen = open;
  if (open) {
    buildSubbar.classList.remove('collapsed');
  } else {
    buildSubbar.classList.add('collapsed');
  }
}

function setActivePrimaryTool(toolKey) {
  [btnToolHammer, btnToolRoad, btnToolBulldoze, btnToolInspect].forEach((b) =>
    b.classList.remove('active')
  );

  if (toolKey === 'HAMMER') {
    btnToolHammer.classList.add('active');
  } else if (toolKey === 'ROAD') {
    btnToolHammer.classList.add('active');
    btnToolRoad.classList.add('active');
  } else if (toolKey === 'BULLDOZE') {
    btnToolBulldoze.classList.add('active');
  } else if (toolKey === 'INSPECT') {
    btnToolInspect.classList.add('active');
  }
}

// Çekiç (İnşaat) Butonu: Kategorili Mini Alt Barı Açar / Kapatır
btnToolHammer.addEventListener('click', () => {
  if (game.toolMode === 'BUILD' && isSubbarOpen) {
    setSubbarOpen(false);
    btnToolHammer.classList.remove('active');
    sound.playClick();
  } else {
    game.setToolMode('BUILD');
    setSubbarOpen(true);
    setActivePrimaryTool('HAMMER');
    renderCategoryTabs();
    renderCategoryItems();
  }
});

// Hızlı Yollar Butonu
btnToolRoad.addEventListener('click', () => {
  activeCategory = 'roads';
  game.selectBuildingType('road');
  setSubbarOpen(true);
  setActivePrimaryTool('ROAD');
  renderCategoryTabs();
  renderCategoryItems();
  showToast('Yol Döşeme Modu: Tıklayarak veya sürükleyerek yol inşa edin.', 'info');
});

// Yıkım / Buldozer Butonu
btnToolBulldoze.addEventListener('click', () => {
  if (game.toolMode === 'BULLDOZE') {
    game.setToolMode('BUILD');
    setSubbarOpen(true);
    setActivePrimaryTool('HAMMER');
  } else {
    game.setToolMode('BULLDOZE');
    setSubbarOpen(false);
    setActivePrimaryTool('BULLDOZE');
    showToast('Yıkım (Buldozer) Modu: Kaldırmak istediğiniz yapıya veya yola tıklayın.', 'info');
  }
});

// İnceleme / Analitik Butonu
btnToolInspect.addEventListener('click', () => {
  if (game.toolMode === 'INSPECT') {
    game.setToolMode('BUILD');
    setSubbarOpen(true);
    setActivePrimaryTool('HAMMER');
  } else {
    game.setToolMode('INSPECT');
    setSubbarOpen(false);
    setActivePrimaryTool('INSPECT');
    showToast('İnceleme Modu: Detaylarını görmek istediğiniz parsele tıklayın.', 'info');
  }
});

// Kamera Açısı Değiştirme Butonu
let isTopView = false;
btnToolCamera.addEventListener('click', () => {
  isTopView = !isTopView;
  if (isTopView) {
    worldScene.setTopDownView();
    btnToolCamera.classList.add('active');
    showToast('Kuşbakışı Şehir Planlama Kamerası', 'info');
  } else {
    worldScene.resetCamera();
    btnToolCamera.classList.remove('active');
    showToast('İzometrik 3D Şehir Kamerası', 'info');
  }
  sound.playClick();
});

btnCloseSubbar.addEventListener('click', () => {
  setSubbarOpen(false);
  btnToolHammer.classList.remove('active');
  sound.playClick();
});

// İlk Açılışta Kategorileri Renderla
renderCategoryTabs();
renderCategoryItems();

// 3. Raycasting, 3B Hologram Önizleme & Sürükleyerek Yol Döşeme (Click-and-Drag Road Laying)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const hitMeshes = grid.cells.map((c) => c.hitMesh);
let isDraggingBuild = false;
let lastActedCell = null;
let pointerDownPos = null;
let pointerDownCell = null;

function refreshCellHighlight(cell) {
  const spec = BUILDINGS_CATALOG[game.selectedBuildingType] || null;
  grid.highlightCell(cell, game.toolMode, bm, spec, game.budget);
}

function getHoveredCell(e) {
  const rect = container.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, worldScene.camera);
  const intersects = raycaster.intersectObjects(hitMeshes, false);
  if (intersects.length > 0) {
    return grid.getCellFromIntersection(intersects[0].object);
  }
  return null;
}

window.addEventListener('pointermove', (e) => {
  if (e.target.closest('#dashboard-overlay') || !startModal.classList.contains('hidden')) {
    grid.clearHighlight();
    return;
  }

  const cell = getHoveredCell(e);
  refreshCellHighlight(cell);

  // Sol tuş basılı tutulurken yol sürükleme
  if (isDraggingBuild && cell && cell !== lastActedCell) {
    const spec = BUILDINGS_CATALOG[game.selectedBuildingType];
    if (game.toolMode === 'BUILD' && spec && spec.isRoad) {
      game.handleCellAction(cell, true);
      lastActedCell = cell;
      refreshCellHighlight(cell);
    }
  }
});

// Capture fazında dinleyerek OrbitControls'un yol çizimi sırasında kamerayı döndürmesini %100 engelle
container.addEventListener(
  'pointerdown',
  (e) => {
    if (e.target.closest('#dashboard-overlay') || e.button !== 0) return;

    const cell = getHoveredCell(e);
    pointerDownPos = { x: e.clientX, y: e.clientY };
    pointerDownCell = cell;

    if (cell) {
      const spec = BUILDINGS_CATALOG[game.selectedBuildingType];
      if (game.toolMode === 'BUILD' && spec && spec.isRoad) {
        isDraggingBuild = true;
        lastActedCell = cell;
        worldScene.controls.enabled = false;
        game.handleCellAction(cell, false);
        refreshCellHighlight(cell);
      }
    }
  },
  { capture: true }
);

window.addEventListener('pointerup', (e) => {
  if (e.button === 0 && pointerDownPos && pointerDownCell && !isDraggingBuild) {
    const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    // Kamera döndürme sürüklemesi değilse (tıklama ise) binayı kur / yık / incele
    if (moveDist < 7) {
      const cell = getHoveredCell(e) || pointerDownCell;
      game.handleCellAction(cell, false);
      refreshCellHighlight(cell);
    }
  }
  isDraggingBuild = false;
  lastActedCell = null;
  pointerDownPos = null;
  pointerDownCell = null;
  worldScene.controls.enabled = true;
});

// 4. Klavye Kısayolları
window.addEventListener('keydown', (e) => {
  if (!startModal.classList.contains('hidden')) return;
  if (e.key === 'b' || e.key === 'B') {
    btnToolHammer.click();
  } else if (e.key === '1') {
    btnToolRoad.click();
  } else if (e.key === 'x' || e.key === 'X') {
    btnToolBulldoze.click();
  } else if (e.key === 'i' || e.key === 'I') {
    btnToolInspect.click();
  } else if (e.key === 'v' || e.key === 'V') {
    btnToolCamera.click();
  } else if (e.code === 'Space') {
    e.preventDefault();
    game.isPaused = !game.isPaused;
    btnSpeed.innerText = game.isPaused ? 'DUR' : `${game.gameSpeed}x`;
    showToast(game.isPaused ? 'Simülasyon Duraklatıldı' : 'Simülasyon Devam Ediyor', 'info');
  } else if (e.key === 'r' || e.key === 'R') {
    isTopView = false;
    btnToolCamera.classList.remove('active');
    worldScene.resetCamera();
    sound.playClick();
  } else if (e.key === 'Escape') {
    // ESC ile seçim iptal ve inceleme moduna dön
    if (game.toolMode !== 'INSPECT') {
      game.setToolMode('INSPECT');
      setSubbarOpen(false);
      setActivePrimaryTool('INSPECT');
      showToast('İnceleme & Gözlem Modu [ESC]', 'info');
    }
  } else if (e.key === 'h' || e.key === 'H') {
    startModal.classList.toggle('hidden');
    sound.playClick();
  }
});

// Üst Bar Kontrolleri
btnSpeed.addEventListener('click', () => {
  game.isPaused = false;
  game.gameSpeed = game.gameSpeed === 1.0 ? 2.0 : 1.0;
  btnSpeed.innerText = `${game.gameSpeed}x`;
  sound.playClick();
});

btnSound.addEventListener('click', () => {
  const isMuted = sound.toggleMute();
  btnSound.style.opacity = isMuted ? '0.4' : '1.0';
  showToast(isMuted ? 'Sesler Kapatıldı' : 'Sesler Açıldı', 'info');
});

btnCamReset.addEventListener('click', () => {
  isTopView = false;
  btnToolCamera.classList.remove('active');
  worldScene.resetCamera();
  sound.playClick();
});

const btnAuraGuide = document.getElementById('btn-aura-guide');
if (btnAuraGuide) {
  btnAuraGuide.addEventListener('click', () => {
    startModal.classList.remove('hidden');
    sound.playClick();
  });
}

btnStart.addEventListener('click', () => {
  sound.init();
  sound.startCityAmbience(); // Şehir gürültüsü ve Akdeniz esintisi ambiyansı başlar
  startModal.classList.add('hidden');
  game.isPaused = false;
  btnSpeed.innerText = `${game.gameSpeed}x`;
  sound.playAuraChime();
  showToast('Şehir Planlaması Devrede! Yollar ve eko-yapılar inşa edin.', 'success');
});

btnRestartVictory.addEventListener('click', () => {
  victoryModal.classList.add('hidden');
  game.restart();
  sound.playClick();
});

btnRestartGameover.addEventListener('click', () => {
  gameoverModal.classList.add('hidden');
  game.restart();
  sound.playClick();
});

// 5. Canlı HUD Güncellemesi
function updateHUD() {
  valBudget.innerText = `$${Math.floor(game.budget).toLocaleString()}`;
  valIncome.innerText = `+$${game.taxIncome}`;
  valPop.innerText = `${game.population.toLocaleString()}`;
  valCarbon.innerText = `${game.carbon}% NET-ZERO`;
  valHealth.innerText = `${game.health.toFixed(1)}%`;

  valSponge.innerText = `${game.spongeCapacity} m³/s`;
  barSponge.style.width = `${Math.min(100, (game.spongeCapacity / 45) * 100)}%`;

  valCooling.innerText = `-${game.coolingPower}°C`;
  barCooling.style.width = `${Math.min(100, (game.coolingPower / 25) * 100)}%`;

  if (game.crisisPhase === 'WARNING') {
    radarTime.innerText = `00:${Math.ceil(game.crisisTimer).toString().padStart(2, '0')}`;
  } else if (game.crisisPhase === 'ACTIVE') {
    radarTime.innerText = `AKTİF ${Math.ceil(game.disasterDuration)}s`;
  }
}

// 6. Ana Render ve Simülasyon Döngüsü
let lastTime = performance.now();

function animate(currentTime) {
  requestAnimationFrame(animate);

  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  game.update(dt);
  if (traffic && !game.isPaused) {
    traffic.syncPopulation(game.population);
    traffic.update(dt * game.gameSpeed);
  }
  worldScene.update(dt);
  updateHUD();
  worldScene.render();
}

requestAnimationFrame(animate);
