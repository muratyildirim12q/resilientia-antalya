import * as THREE from 'three';
import { WorldScene } from './scene.js';
import { GridManager } from './grid.js';
import { BuildingManager, BUILD_CATEGORIES, BUILDINGS_CATALOG, HEATMAP_DATA } from './buildings.js';
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
const valAirQuality = document.getElementById('val-air-quality');
const valZeroWaste = document.getElementById('val-zero-waste');
const valMarineHealth = document.getElementById('val-marine-health');
const valHealth = document.getElementById('val-health');
const valSponge = document.getElementById('val-sponge');
const barSponge = document.getElementById('bar-sponge');
const valCooling = document.getElementById('val-cooling');
const barCooling = document.getElementById('bar-cooling');

const radarStatus = document.getElementById('radar-status');
const radarDesc = document.getElementById('radar-desc');
const radarTime = document.getElementById('radar-time');
const radarBox = document.getElementById('radar-box');
const forecastContainer = document.getElementById('forecast-timeline-container');
const forecastLabel = document.getElementById('forecast-label');
const forecastEta = document.getElementById('forecast-eta');
const forecastBarFill = document.getElementById('forecast-bar-fill');
const crisisDiagnosticHud = document.getElementById('crisis-diagnostic-hud');
const diagCardTitle = document.getElementById('diag-card-title');
const diagMetricsList = document.getElementById('diag-metrics-list');
const emergencyActionsBar = document.getElementById('emergency-actions-bar');
const btnEmerg1 = document.getElementById('btn-emerg-1');
const btnEmerg2 = document.getElementById('btn-emerg-2');

// v11.1 / v11.2 Belediye Temizlik & Saha Operasyonları Elementleri
const btnCleanSea = document.getElementById('btn-clean-sea');
const btnCleanStreets = document.getElementById('btn-clean-streets');
const valCleanSeaHealth = document.getElementById('clean-status-marine');
const valCleanWasteRate = document.getElementById('clean-status-waste');
const btnToolOps = document.getElementById('btn-tool-ops');
const btnCloseOps = document.getElementById('btn-close-ops');
const opsSubbar = document.getElementById('ops-subbar');
const opsStatusMarine = document.getElementById('ops-status-marine');
const opsStatusWaste = document.getElementById('ops-status-waste');
let isOpsOpen = false;

// v10.0 Öğretici & Mikro-Olay DOM Elementleri
const tutorialBar = document.getElementById('tutorial-bar');
const tutStepBadge = document.getElementById('tut-step-badge');
const tutStepTitle = document.getElementById('tut-step-title');
const tutStepDesc = document.getElementById('tut-step-desc');
const tutStepReward = document.getElementById('tut-step-reward');
const btnTutSkip = document.getElementById('btn-tut-skip');

const microEventCard = document.getElementById('micro-event-card');
const meventTimer = document.getElementById('mevent-timer');
const meventBar = document.getElementById('mevent-bar');
const meventTitle = document.getElementById('mevent-title');
const meventDesc = document.getElementById('mevent-desc');
const btnMeventOpt1 = document.getElementById('btn-mevent-opt1');
const meventOpt1Label = document.getElementById('mevent-opt1-label');
const meventOpt1Sub = document.getElementById('mevent-opt1-sub');
const btnMeventOpt2 = document.getElementById('btn-mevent-opt2');
const meventOpt2Label = document.getElementById('mevent-opt2-label');
const meventOpt2Sub = document.getElementById('mevent-opt2-sub');

const auraContent = document.getElementById('aura-content');

// Alt Toolbar & Kategorili Mini Alt Bar Elementleri
const buildSubbar = document.getElementById('build-subbar');
const categoryTabsEl = document.getElementById('category-tabs');
const categoryItemsEl = document.getElementById('category-items');
const infoItemName = document.getElementById('info-item-name');
const infoItemDesc = document.getElementById('info-item-desc');
const btnCloseSubbar = document.getElementById('btn-close-subbar');

const btnToolHammer = document.getElementById('btn-tool-hammer');
const btnToolInspect = document.getElementById('btn-tool-inspect');
const btnToolCamera = document.getElementById('btn-tool-camera');

const valAggregate = document.getElementById('val-aggregate');
const valLegacyCount = document.getElementById('val-legacy-count');

const btnSpeed = document.getElementById('btn-speed');
const btnSound = document.getElementById('btn-sound');
const btnCamReset = document.getElementById('btn-cam-reset');
const btnHeatmap = document.getElementById('btn-heatmap');
const heatmapLegend = document.getElementById('heatmap-legend');
const btnCloseHeatmap = document.getElementById('btn-close-heatmap');

// Bina İnceleme Kartı Elementleri
const inspectCard = document.getElementById('inspect-card');
const btnCloseInspect = document.getElementById('btn-close-inspect');
const inspectCategoryBadge = document.getElementById('inspect-category-badge');
const inspectRoadStatus = document.getElementById('inspect-road-status');
const inspectCellCoord = document.getElementById('inspect-cell-coord');
const inspectBuildingName = document.getElementById('inspect-building-name');
const inspectBuildingDesc = document.getElementById('inspect-building-desc');
const inspectStatPop = document.getElementById('inspect-stat-pop');
const inspectStatCarbon = document.getElementById('inspect-stat-carbon');
const inspectStatSponge = document.getElementById('inspect-stat-sponge');
const inspectStatCooling = document.getElementById('inspect-stat-cooling');
const inspectStatIncome = document.getElementById('inspect-stat-income');
const inspectStatTemp = document.getElementById('inspect-stat-temp');
const inspectActions = document.getElementById('inspect-actions');
const btnInstallFilter = document.getElementById('btn-install-filter');
const filterActiveBadge = document.getElementById('filter-active-badge');
const btnInstallRainHarvest = document.getElementById('btn-install-rainharvest');
const badgeRainHarvest = document.getElementById('badge-rainharvest');
const btnInstallSolarKit = document.getElementById('btn-install-solarkit');
const badgeSolarKit = document.getElementById('badge-solarkit');
const btnInstallBioDrain = document.getElementById('btn-install-biodrain');
const badgeBioDrain = document.getElementById('badge-biodrain');
const btnInstallCompactor = document.getElementById('btn-install-compactor');
const badgeCompactor = document.getElementById('badge-compactor');

const startModal = document.getElementById('start-modal');
const mainMenuView = document.getElementById('main-menu-view');
const briefingStoryView = document.getElementById('briefing-story-view');
const btnMenuPlay = document.getElementById('btn-menu-play');
const btnMenuSettings = document.getElementById('btn-menu-settings');
const menuSettingsPanel = document.getElementById('menu-settings-panel');
const optSoundToggle = document.getElementById('opt-sound-toggle');
const optSpeedSelect = document.getElementById('opt-speed-select');
const optTutToggle = document.getElementById('opt-tut-toggle');
const btnBriefingBack = document.getElementById('btn-briefing-back');
const btnStart = document.getElementById('btn-start');
const victoryModal = document.getElementById('victory-modal');
const btnRestartVictory = document.getElementById('btn-restart-victory');
const gameoverModal = document.getElementById('gameover-modal');
const gameoverReason = document.getElementById('gameover-reason');
const btnRestartGameover = document.getElementById('btn-restart-gameover');
const toast = document.getElementById('toast');

// Özel Vektör SVG İkon ve Model Önizleme Kütüphanesi (Sıfır Emoji)
const CATEGORY_SVGS = {
  roads: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19L8 5M16 5l4 14M12 6v2m0 4v2m0 4v2"/></svg>`,
  buildings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-5 8v-5h4v5"/></svg>`,
  parks: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-7l-2-2M17 8v.8A6 6 0 0 1 13.8 20H10A6.5 6.5 0 0 1 7 8a5 5 0 0 1 10 0Z"/></svg>`,
  waste: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 19 3 19 3 15"></polyline><path d="M10 19h11a2 2 0 0 0 2-2v-4"></path><polyline points="17 5 21 5 21 9"></polyline><path d="M14 5H3a2 2 0 0 0-2 2v4"></path><polyline points="3 11 7 11 7 7"></polyline><polyline points="21 13 17 13 17 17"></polyline></svg>`,
  infra: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  demolish: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="15" width="13" height="5" rx="2.5"/><circle cx="5" cy="17.5" r="0.8" fill="currentColor"/><circle cx="8.5" cy="17.5" r="0.8" fill="currentColor"/><circle cx="12" cy="17.5" r="0.8" fill="currentColor"/><path d="M4 15V9h6v6"/><path d="M6 11h2.5v2.5H6z"/><path d="M10 12h4v3"/><path d="M16 11l4 2v6l-4-1"/></svg>`
};

const ITEM_SVGS = {
  // 1. Şehir Yolu (Kenney Asfalt Cadde & Sokak Lambası Modeli)
  road: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,22" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
    <polygon points="8,22 32,36 32,41 8,27" fill="#334155"/>
    <polygon points="56,22 32,36 32,41 56,27" fill="#1e293b"/>
    <polygon points="32,10 40,14 37,16 29,12" fill="#94a3b8"/>
    <polygon points="8,22 16,26 13,28 5,24" fill="#94a3b8"/>
    <polygon points="56,22 48,26 51,28 59,24" fill="#94a3b8"/>
    <polygon points="32,36 40,32 37,30 29,34" fill="#94a3b8"/>
    <polygon points="32,21 36,23 32,25 28,23" fill="#f8fafc"/>
    <polygon points="22,26 26,28 22,30 18,28" fill="#f8fafc"/>
    <polygon points="42,16 46,18 42,20 38,18" fill="#f8fafc"/>
    <circle cx="26" cy="18" r="2.2" fill="#475569" stroke="#334155" stroke-width="0.8"/>
    <path d="M47 22v-11c0-2.5-2-3.5-4.5-3.5h-1" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
    <circle cx="41.5" cy="7.5" r="3" fill="#fef08a"/>
    <circle cx="41.5" cy="7.5" r="5.5" fill="#fef08a" opacity="0.3"/>
  </svg>`,

  // 2. Yeşil Bulvar (Ağaçlı & Çiçeklikli Bulvar Modeli)
  boulevard: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,22" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
    <polygon points="8,22 32,36 32,41 8,27" fill="#334155"/>
    <polygon points="56,22 32,36 32,41 56,27" fill="#1e293b"/>
    <polygon points="12,18 24,12 20,10 8,16" fill="#22c55e"/>
    <polygon points="44,32 56,26 52,24 40,30" fill="#22c55e"/>
    <line x1="20" y1="17" x2="44" y2="29" stroke="#f8fafc" stroke-width="1.6" stroke-dasharray="3,3"/>
    <rect x="15" y="11" width="2" height="6" fill="#78350f"/>
    <circle cx="16" cy="9" r="5" fill="#16a34a"/>
    <circle cx="14" cy="7" r="3" fill="#4ade80"/>
    <rect x="47" y="25" width="2" height="6" fill="#78350f"/>
    <circle cx="48" cy="23" r="5" fill="#16a34a"/>
    <circle cx="46" cy="21" r="3" fill="#4ade80"/>
    <rect x="25" y="24" width="5" height="2.5" rx="1" fill="#f43f5e"/>
    <rect x="34" y="16" width="5" height="2.5" rx="1" fill="#facc15"/>
  </svg>`,

  // 3. Güneş Tramvayı & Yeşil Hat Modeli
  solar_tram: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,22" fill="#16a34a" stroke="#15803d" stroke-width="1.2"/>
    <polygon points="8,22 32,36 32,41 8,27" fill="#15803d"/>
    <polygon points="56,22 32,36 32,41 56,27" fill="#14532d"/>
    <line x1="17" y1="18" x2="41" y2="30.5" stroke="#cbd5e1" stroke-width="1.8"/>
    <line x1="23" y1="15" x2="47" y2="27.5" stroke="#cbd5e1" stroke-width="1.8"/>
    <polygon points="27,15 39,21 37,29 25,23" fill="#06b6d4" stroke="#0891b2" stroke-width="1"/>
    <polygon points="27,15 39,21 38,18 26,12" fill="#e0f2fe"/>
    <polygon points="38,20.5 39,21 38,23 37,22.5" fill="#fef08a"/>
    <line x1="15" y1="28" x2="15" y2="10" stroke="#94a3b8" stroke-width="2"/>
    <line x1="15" y1="10" x2="26" y2="10" stroke="#94a3b8" stroke-width="1.5"/>
    <rect x="22" y="8" width="7" height="4" rx="0.5" fill="#1d4ed8" stroke="#38bdf8" stroke-width="0.8"/>
  </svg>`,

  // 4. Akdeniz Eko-Villa Modeli
  eco_house: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,12 56,24 32,36 8,24" fill="#4ade80"/>
    <polygon points="18,24 32,31 32,44 18,37" fill="#f8fafc"/>
    <polygon points="32,31 46,24 46,37 32,44" fill="#e2e8f0"/>
    <rect x="22" y="31" width="4.5" height="7" fill="#b45309"/>
    <rect x="36" y="27" width="5.5" height="5" rx="0.5" fill="#38bdf8"/>
    <polygon points="32,13 16,22 32,30 48,22" fill="#ea580c"/>
    <polygon points="32,13 48,22 46,24 32,16" fill="#c2410c"/>
    <polygon points="32,16 41,21 38,25 29,20" fill="#1d4ed8" stroke="#60a5fa" stroke-width="0.8"/>
    <rect x="12" y="24" width="1.8" height="6" fill="#78350f"/>
    <circle cx="13" cy="23" r="4" fill="#15803d"/>
    <circle cx="13" cy="21" r="2.5" fill="#22c55e"/>
  </svg>`,

  // 5. Yeşil Çatılı Rezidans Modeli
  green_roof: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="16,22 34,31 34,50 16,41" fill="#334155"/>
    <polygon points="34,31 50,23 50,42 34,50" fill="#1e293b"/>
    <rect x="20" y="28" width="4" height="3" fill="#fef08a"/>
    <rect x="26" y="31" width="4" height="3" fill="#fef08a"/>
    <rect x="20" y="35" width="4" height="3" fill="#bae6fd"/>
    <rect x="26" y="38" width="4" height="3" fill="#fef08a"/>
    <rect x="38" y="28" width="5" height="3" fill="#fef08a"/>
    <rect x="38" y="35" width="5" height="3" fill="#bae6fd"/>
    <polygon points="33,13 50,22 34,30 17,21" fill="#10b981"/>
    <circle cx="28" cy="20" r="3" fill="#059669"/>
    <circle cx="38" cy="21" r="3" fill="#059669"/>
    <circle cx="34" cy="24" r="1.8" fill="#f43f5e"/>
    <circle cx="23" cy="22" r="1.5" fill="#facc15"/>
  </svg>`,

  // 6. Eko-Ticari Merkez (Ofis Kulesi Modeli)
  commercial_hub: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,24 52,34 32,44 12,34" fill="#0f172a"/>
    <polygon points="18,14 32,21 32,46 18,39" fill="#0284c7"/>
    <polygon points="32,21 46,14 46,39 32,46" fill="#0369a1"/>
    <polygon points="32,7 46,14 32,21 18,14" fill="#38bdf8"/>
    <line x1="22" y1="18" x2="22" y2="40" stroke="#bae6fd" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="27" y1="20" x2="27" y2="42" stroke="#bae6fd" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="37" y1="20" x2="37" y2="42" stroke="#bae6fd" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="42" y1="18" x2="42" y2="40" stroke="#bae6fd" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="32" y1="7" x2="32" y2="2" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="32" cy="2" r="1.5" fill="#ef4444"/>
  </svg>`,

  // 7. Sünger Park (Yağmur Bahçesi & Gölet Modeli)
  sponge_park: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,24" fill="#22c55e"/>
    <path d="M22,24 C20,19 28,15 36,17 C44,19 44,28 36,30 C28,32 24,28 22,24 Z" fill="#06b6d4" stroke="#0891b2" stroke-width="1"/>
    <path d="M31,23 Q27,15 25,18 M33,23 Q37,15 39,18 M32,23 V14" stroke="#e0f2fe" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="14" r="1.8" fill="#ffffff"/>
    <circle cx="28" cy="22" r="2" fill="#10b981"/>
    <circle cx="28" cy="22" r="1" fill="#ec4899"/>
    <rect x="36" y="24" width="7" height="3" fill="#b45309"/>
    <circle cx="15" cy="18" r="5" fill="#15803d"/>
    <circle cx="15" cy="16" r="3" fill="#22c55e"/>
  </svg>`,

  // 8. Rüzgar Koridoru Korusu Modeli
  wind_corridor: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,12 56,24 32,36 8,24" fill="#16a34a"/>
    <rect x="19" y="18" width="2" height="9" fill="#78350f"/>
    <ellipse cx="20" cy="17" rx="6.5" ry="4" fill="#15803d"/>
    <rect x="33" y="14" width="2.2" height="10" fill="#78350f"/>
    <ellipse cx="34" cy="13" rx="7.5" ry="4.5" fill="#166534"/>
    <rect x="43" y="20" width="1.8" height="8" fill="#78350f"/>
    <ellipse cx="44" cy="19" rx="6" ry="3.5" fill="#15803d"/>
    <path d="M10,14 Q24,7 38,14 T54,12" stroke="#38bdf8" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.95"/>
    <path d="M6,26 Q20,19 34,26 T52,22" stroke="#67e8f9" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.85"/>
  </svg>`,

  // 9. Kentsel Meydan & Çeşme Parkı Modeli
  botanical_plaza: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,24" fill="#64748b"/>
    <ellipse cx="32" cy="23" rx="14" ry="7.5" fill="#475569" stroke="#94a3b8" stroke-width="1"/>
    <ellipse cx="32" cy="24" rx="9.5" ry="5" fill="#0284c7" stroke="#cbd5e1" stroke-width="1.6"/>
    <ellipse cx="32" cy="20" rx="5.5" ry="2.8" fill="#38bdf8" stroke="#cbd5e1" stroke-width="1.4"/>
    <ellipse cx="32" cy="16" rx="2.8" ry="1.4" fill="#e0f2fe" stroke="#cbd5e1" stroke-width="1.2"/>
    <path d="M32,16 V10 M32,13 Q28,15 27,18 M32,13 Q36,15 37,18" stroke="#ffffff" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <circle cx="16" cy="18" r="4" fill="#15803d"/>
    <circle cx="48" cy="24" r="4" fill="#15803d"/>
  </svg>`,

  // 10. Yeraltı Akıllı Su Sarnıcı Modeli
  cistern: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,8 56,20 32,32 8,20" fill="#475569"/>
    <rect x="27" y="16" width="10" height="7" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
    <polygon points="8,20 32,32 32,50 8,38" fill="#1e293b"/>
    <polygon points="32,32 56,20 56,38 32,50" fill="#0f172a"/>
    <polygon points="12,32 32,42 52,32 32,23" fill="#0284c7" opacity="0.9"/>
    <rect x="18" y="24" width="3.5" height="18" fill="#64748b"/>
    <rect x="30" y="29" width="3.5" height="18" fill="#94a3b8"/>
    <rect x="42" y="24" width="3.5" height="18" fill="#64748b"/>
    <line x1="32" y1="20" x2="32" y2="36" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="32" cy="36" r="2" fill="#38bdf8"/>
  </svg>`,

  // 11. Termal Soğutma İstasyonu Modeli
  cooling_tower: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="16,24 32,32 32,48 16,40" fill="#334155"/>
    <polygon points="32,32 48,24 48,40 32,48" fill="#1e293b"/>
    <ellipse cx="32" cy="22" rx="11" ry="6" fill="#0f172a" stroke="#0ea5e9" stroke-width="1.8"/>
    <path d="M25,18 Q22,7 28,5 Q34,3 36,8 Q43,5 41,15 Z" fill="#67e8f9" opacity="0.9"/>
    <path d="M28,14 Q30,7 34,9 Q38,11 36,17 Z" fill="#ffffff" opacity="0.95"/>
    <circle cx="24" cy="34" r="2.5" fill="#38bdf8"/>
    <path d="M32 20v4m-2-2h4" stroke="#a5f3fc" stroke-width="1.5"/>
  </svg>`,

  // 12. Büyük Ölçekli Güneş Tarlası Modeli
  solar_farm: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,24" fill="#15803d"/>
    <polygon points="15,15 32,24 28,30 11,21" fill="#1d4ed8" stroke="#60a5fa" stroke-width="1.2"/>
    <line x1="19" y1="17" x2="15" y2="23" stroke="#93c5fd" stroke-width="1"/>
    <line x1="23" y1="19" x2="19" y2="25" stroke="#93c5fd" stroke-width="1"/>
    <line x1="27" y1="21" x2="23" y2="27" stroke="#93c5fd" stroke-width="1"/>
    <polygon points="35,20 52,29 48,35 31,26" fill="#1d4ed8" stroke="#60a5fa" stroke-width="1.2"/>
    <line x1="39" y1="22" x2="35" y2="28" stroke="#93c5fd" stroke-width="1"/>
    <line x1="43" y1="24" x2="39" y2="30" stroke="#93c5fd" stroke-width="1"/>
    <line x1="47" y1="26" x2="43" y2="32" stroke="#93c5fd" stroke-width="1"/>
    <rect x="22" y="28" width="4.5" height="5.5" rx="0.5" fill="#e2e8f0"/>
  </svg>`,

  // 13. Buldozer & Geri Dönüşüm Aracı Modeli (Özel İş Makinesi İkonu)
  demolish_tool: `<svg viewBox="0 0 64 64" fill="none">
    <!-- Palet / Tırtıl Paletler -->
    <rect x="10" y="44" width="36" height="12" rx="6" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <circle cx="16" cy="50" r="3.2" fill="#64748b"/>
    <circle cx="24" cy="50" r="3.2" fill="#64748b"/>
    <circle cx="32" cy="50" r="3.2" fill="#64748b"/>
    <circle cx="40" cy="50" r="3.2" fill="#64748b"/>
    <!-- Gövde ve Motor Bloğu -->
    <path d="M14 44V26h18v18H14z" fill="#facc15"/>
    <path d="M14 26l6-6h12v6H14z" fill="#eab308"/>
    <!-- Kabin ve Cam -->
    <path d="M18 28h10v10H18z" fill="#38bdf8" opacity="0.95"/>
    <path d="M32 34h14v10H32z" fill="#eab308"/>
    <!-- Egzoz Borusu -->
    <line x1="38" y1="34" x2="38" y2="24" stroke="#475569" stroke-width="2.5"/>
    <circle cx="39" cy="22" r="2" fill="#94a3b8" opacity="0.6"/>
    <!-- Buldozer Bıçağı / Kepçesi -->
    <path d="M44 36l8 2v16l-8-2z" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
    <!-- Hidrolik Kol -->
    <line x1="26" y1="42" x2="46" y2="44" stroke="#ca8a04" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`,

  // 14. Eski Kirletici Beton Tesis
  legacy_concrete: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="16,22 34,31 34,48 16,39" fill="#475569"/>
    <polygon points="34,31 50,23 50,40 34,48" fill="#334155"/>
    <polygon points="16,22 34,31 50,23 32,14" fill="#64748b"/>
    <rect x="22" y="10" width="4" height="14" fill="#1e293b"/>
    <path d="M24,10 C20,4 28,2 26,0" stroke="#64748b" stroke-width="2.5" fill="none" opacity="0.7"/>
  </svg>`,

  // 15. Akıllı Sıfır Atık Ayrıştırma İstasyonu
  waste_station: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,22" fill="#334155" stroke="#64748b" stroke-width="1.2"/>
    <polygon points="8,22 32,36 32,46 8,32" fill="#1e293b"/>
    <polygon points="56,22 32,36 32,46 56,32" fill="#0f172a"/>
    <rect x="15" y="24" width="7" height="12" rx="1" fill="#0284c7" stroke="#38bdf8" stroke-width="0.8"/>
    <rect x="24" y="27" width="7" height="12" rx="1" fill="#eab308" stroke="#fde047" stroke-width="0.8"/>
    <rect x="33" y="27" width="7" height="12" rx="1" fill="#16a34a" stroke="#4ade80" stroke-width="0.8"/>
    <rect x="42" y="24" width="7" height="12" rx="1" fill="#78350f" stroke="#b45309" stroke-width="0.8"/>
    <path d="M26,16 L38,16 L32,22 Z" fill="#10b981"/>
    <circle cx="32" cy="18" r="1.5" fill="#ffffff"/>
  </svg>`,

  // 16. Biyogaz & Organik Kompost Tesisi
  biogas_plant: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,12 56,24 32,36 8,24" fill="#15803d"/>
    <polygon points="8,24 32,36 32,48 8,36" fill="#14532d"/>
    <polygon points="56,24 32,36 32,48 56,36" fill="#052e16"/>
    <ellipse cx="27" cy="27" rx="11" ry="8" fill="#065f46" stroke="#10b981" stroke-width="1.5"/>
    <ellipse cx="27" cy="24" rx="7" ry="5" fill="#10b981"/>
    <circle cx="43" cy="23" r="8" fill="#475569" stroke="#94a3b8" stroke-width="1.2"/>
    <line x1="33" y1="26" x2="38" y2="24" stroke="#e2e8f0" stroke-width="2"/>
    <polygon points="20,38 30,38 27,45 17,45" fill="#78350f"/>
    <path d="M43,14 Q45,10 43,7" stroke="#facc15" stroke-width="1.5" fill="none"/>
  </svg>`,

  // 17. Biyolojik İleri Arıtma Tesisi
  water_treatment: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,22" fill="#334155" stroke="#475569" stroke-width="1.2"/>
    <polygon points="8,22 32,36 32,44 8,30" fill="#1e293b"/>
    <polygon points="56,22 32,36 32,44 56,30" fill="#0f172a"/>
    <ellipse cx="32" cy="26" rx="18" ry="9" fill="#0369a1" stroke="#94a3b8" stroke-width="2"/>
    <ellipse cx="32" cy="26" rx="14" ry="7" fill="#0284c7"/>
    <line x1="16" y1="24" x2="48" y2="28" stroke="#cbd5e1" stroke-width="2.5"/>
    <circle cx="32" cy="26" r="3" fill="#e2e8f0" stroke="#0284c7" stroke-width="1"/>
    <path d="M46,28 L54,32 L51,36 L43,32 Z" fill="#38bdf8"/>
  </svg>`,

  // 18. Yüzer Deniz Süpürgesi ve Müsilaj Bariyeri
  marine_barrier: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,22" fill="#0284c7"/>
    <polygon points="8,22 32,36 32,44 8,30" fill="#0369a1"/>
    <polygon points="56,22 32,36 32,44 56,30" fill="#075985"/>
    <line x1="12" y1="28" x2="52" y2="24" stroke="#1e293b" stroke-width="3"/>
    <circle cx="16" cy="27" r="4.5" fill="#f59e0b" stroke="#d97706" stroke-width="1"/>
    <circle cx="28" cy="26" r="4.5" fill="#f59e0b" stroke="#d97706" stroke-width="1"/>
    <circle cx="40" cy="25" r="4.5" fill="#f59e0b" stroke="#d97706" stroke-width="1"/>
    <circle cx="50" cy="24" r="4.5" fill="#f59e0b" stroke="#d97706" stroke-width="1"/>
    <circle cx="50" cy="19" r="2" fill="#ef4444"/>
    <line x1="50" y1="21" x2="50" y2="23" stroke="#cbd5e1" stroke-width="1.2"/>
  </svg>`,

  // 19. Geçirgen Yeşil Yol (Gözenekli Parke)
  permeable_road: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,22" fill="#52525b" stroke="#71717a" stroke-width="1.2"/>
    <polygon points="8,22 32,36 32,46 8,32" fill="#27272a"/>
    <polygon points="56,22 32,36 32,46 56,32" fill="#18181b"/>
    <line x1="14" y1="21" x2="14" y2="25" stroke="#22c55e" stroke-width="2"/>
    <line x1="20" y1="18" x2="20" y2="22" stroke="#22c55e" stroke-width="2"/>
    <line x1="44" y1="26" x2="44" y2="30" stroke="#22c55e" stroke-width="2"/>
    <line x1="50" y1="23" x2="50" y2="27" stroke="#22c55e" stroke-width="2"/>
    <circle cx="28" cy="22" r="1.5" fill="#10b981"/>
    <circle cx="36" cy="24" r="1.5" fill="#10b981"/>
    <circle cx="32" cy="28" r="1.5" fill="#10b981"/>
    <path d="M22 28l6 3m8-3l6 3" stroke="#a1a1aa" stroke-width="1.2" stroke-dasharray="2 2"/>
  </svg>`,

  // 20. Kıyı Fırtına Tahliye Pompası
  coastal_pump: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,22" fill="#334155" stroke="#475569" stroke-width="1.2"/>
    <polygon points="8,22 32,36 32,46 8,32" fill="#1e293b"/>
    <polygon points="56,22 32,36 32,46 56,32" fill="#0f172a"/>
    <rect x="16" y="18" width="14" height="12" fill="#475569" stroke="#64748b" stroke-width="1"/>
    <circle cx="38" cy="24" r="6" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5"/>
    <circle cx="38" cy="24" r="2.5" fill="#e0f2fe"/>
    <path d="M38 30v8l10 5" stroke="#0ea5e9" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="23" cy="14" r="2.2" fill="#f59e0b"/>
  </svg>`,

  // 21. Organik Kompost ve Sera Üretim Tesisi
  compost_greenhouse: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,22" fill="#14532d" stroke="#16a34a" stroke-width="1.2"/>
    <polygon points="8,22 32,36 32,46 8,32" fill="#052e16"/>
    <polygon points="56,22 32,36 32,46 56,32" fill="#022c22"/>
    <path d="M16 26 C16 16 36 16 36 26" fill="#86efac" stroke="#22c55e" stroke-width="1.5" opacity="0.85"/>
    <line x1="26" y1="18" x2="26" y2="28" stroke="#15803d" stroke-width="1.2"/>
    <rect x="40" y="24" width="10" height="7" rx="2" fill="#78350f" stroke="#b45309" stroke-width="1"/>
    <circle cx="21" cy="26" r="1.5" fill="#15803d"/>
    <circle cx="31" cy="26" r="1.5" fill="#15803d"/>
  </svg>`,

  // 22. Kıyı Dalga Kıran & Falez Tahkimatı
  sea_breakwater: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,22" fill="#0284c7" stroke="#0369a1" stroke-width="1.2"/>
    <polygon points="8,22 32,36 32,46 8,32" fill="#0369a1"/>
    <polygon points="56,22 32,36 32,46 56,32" fill="#075985"/>
    <polygon points="18,22 28,16 34,24 24,30" fill="#64748b" stroke="#475569" stroke-width="1.2"/>
    <polygon points="32,24 42,18 48,26 38,32" fill="#475569" stroke="#334155" stroke-width="1.2"/>
    <path d="M14 28 Q 24 34 34 28 Q 44 34 54 28" stroke="#f0f9ff" stroke-width="2.5" fill="none"/>
    <circle cx="32" cy="14" r="2.5" fill="#facc15" stroke="#eab308" stroke-width="1"/>
    <line x1="32" y1="17" x2="32" y2="22" stroke="#64748b" stroke-width="1.5"/>
  </svg>`,

  // 23. Döküm Demir Mazgal & Fırtına Su Kolektörü
  drain_grate: `<svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,10 56,22 32,36 8,22" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
    <polygon points="8,22 32,36 32,44 8,30" fill="#0f172a"/>
    <polygon points="56,22 32,36 32,44 56,30" fill="#0f172a"/>
    <rect x="20" y="18" width="24" height="12" rx="1.5" fill="#334155" stroke="#64748b" stroke-width="1"/>
    <line x1="23" y1="20" x2="23" y2="28" stroke="#1e293b" stroke-width="1.6"/>
    <line x1="26" y1="20" x2="26" y2="28" stroke="#1e293b" stroke-width="1.6"/>
    <line x1="29" y1="20" x2="29" y2="28" stroke="#1e293b" stroke-width="1.6"/>
    <line x1="32" y1="20" x2="32" y2="28" stroke="#1e293b" stroke-width="1.6"/>
    <line x1="35" y1="20" x2="35" y2="28" stroke="#1e293b" stroke-width="1.6"/>
    <line x1="38" y1="20" x2="38" y2="28" stroke="#1e293b" stroke-width="1.6"/>
    <line x1="41" y1="20" x2="41" y2="28" stroke="#1e293b" stroke-width="1.6"/>
    <circle cx="32" cy="24" r="7" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2,2"/>
  </svg>`
};
ITEM_SVGS.grate = ITEM_SVGS.drain_grate;

// Murat Bey Telsiz İletişim Motoru (Telsiz bip ve mandallama sesi)
let typeInterval = null;
function speakMuratBey(text) {
  if (typeInterval) clearInterval(typeInterval);
  auraContent.innerText = '';
  sound.playRadioBeep();
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
const speakAURA = speakMuratBey;

const radioFlags = {
  wasteWarning: false,
  biogasPraise: false,
  treatmentPraise: false,
  carettaPraise: false
};

function checkEnvironmentalRadioMilestones() {
  if (!game || game.isPaused) return;

  if (game.population > 100 && game.zeroWasteRate < 40 && !radioFlags.wasteWarning) {
    radioFlags.wasteWarning = true;
    speakMuratBey("Merkez, batı sektöründe atık birikimi tespit edildi. Yağış öncesi Katı Atık Ayrıştırma Tesisi kurulumu önerilmektedir.");
  } else if (!radioFlags.biogasPraise && game.grid && game.grid.cells && game.grid.cells.some(c => c.occupied && c.buildingType === 'biogas_plant')) {
    radioFlags.biogasPraise = true;
    speakMuratBey("Merkez, biyogaz ve kompost ünitesi senkronize edildi. Vahşi depolama alanı rehabilite edildi.");
  } else if (!radioFlags.treatmentPraise && game.grid && game.grid.cells && game.grid.cells.some(c => c.occupied && c.buildingType === 'water_treatment')) {
    radioFlags.treatmentPraise = true;
    speakMuratBey("AKOM / MGM: İleri Biyolojik Arıtma tesisi tam kapasite devrede. Konyaaltı sahil hattında deşarj kalitesi optimize edildi.");
  } else if (!radioFlags.carettaPraise && game.marineHealth >= 80) {
    radioFlags.carettaPraise = true;
    speakMuratBey("MGM / Çevre İzleme: Kıyı su kalitesi ve biyoçeşitlilik parametreleri normale ulaştı. Caretta caretta habitatı güvenli.");
  }
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

// Bina İnceleme Kartı Gösterim Fonksiyonları
let currentInspectCell = null;

function showInspectPopup(cell) {
  if (!cell || !cell.occupied) {
    closeInspectPopup();
    return;
  }
  const spec = BUILDINGS_CATALOG[cell.buildingType];
  if (!spec) {
    closeInspectPopup();
    return;
  }
  currentInspectCell = cell;
  const heat = HEATMAP_DATA[cell.buildingType] || { temp: 35, label: '35°C (Orta)' };

  let catLabel = 'KENTSEL PARSEL';
  if (spec.isLegacy) catLabel = 'ESKİ YAPILAŞMA';
  else if (spec.category === 'roads') catLabel = 'ULAŞIM & YOL';
  else if (spec.category === 'buildings') catLabel = 'KONUT & TİCARET';
  else if (spec.category === 'parks') catLabel = 'DOĞAL DRENAJ & PARKLAR';
  else if (spec.category === 'waste') catLabel = 'SIFIR ATIK DÖNGÜSÜ';
  else if (spec.category === 'infra') catLabel = 'DİRENÇ ALTYAPISI';

  if (inspectCategoryBadge) inspectCategoryBadge.innerText = catLabel;
  if (inspectCellCoord) inspectCellCoord.innerText = `Sıra ${cell.row + 1}, Sütun ${cell.col + 1}`;
  if (inspectBuildingName) inspectBuildingName.innerText = spec.name || spec.shortName;
  if (inspectBuildingDesc) inspectBuildingDesc.innerText = spec.desc || '';

  // Yola Cephe Durumu
  if (inspectRoadStatus) {
    if (spec.isRoad) {
      inspectRoadStatus.innerText = 'YOL AĞI';
      inspectRoadStatus.className = 'inspect-road-badge road-ok';
    } else if (cell.hasRoadAccess) {
      inspectRoadStatus.innerText = 'YOLA CEPHELİ';
      inspectRoadStatus.className = 'inspect-road-badge road-ok';
    } else {
      inspectRoadStatus.innerText = 'YOL BAĞLANTISI YOK (HİZMET DIŞI)';
      inspectRoadStatus.className = 'inspect-road-badge road-missing';
    }
  }

  // Nüfus (Yol yoksa hizmet dışı)
  if (inspectStatPop) {
    if (!cell.hasRoadAccess && !spec.isRoad && spec.population > 0) {
      inspectStatPop.innerText = '0 Kişi (Yol Yok)';
      inspectStatPop.className = 'istat-val val-rose';
    } else {
      inspectStatPop.innerText = spec.population > 0 ? `+${spec.population} Kişi` : (spec.population < 0 ? `${spec.population} Kişi` : '0 Kişi');
      inspectStatPop.className = spec.population > 0 ? 'istat-val val-cyan' : 'istat-val';
    }
  }
  
  if (inspectStatCarbon) {
    let carbonVal = spec.carbon;
    if (cell.hasSolarKit) {
      carbonVal -= 2;
    }
    if (cell.hasChimneyFilter && carbonVal > 0) {
      carbonVal = Math.round(carbonVal * 0.2);
    }
    if (carbonVal < 0) {
      inspectStatCarbon.innerText = `${carbonVal}% Net-Zero`;
      inspectStatCarbon.className = 'istat-val val-emerald';
    } else if (carbonVal > 0) {
      inspectStatCarbon.innerText = `+${carbonVal}% Net-Zero${cell.hasChimneyFilter ? ' (Filtreli)' : ''}`;
      inspectStatCarbon.className = cell.hasChimneyFilter ? 'istat-val val-emerald' : 'istat-val val-rose';
    } else {
      inspectStatCarbon.innerText = 'Nötr';
      inspectStatCarbon.className = 'istat-val val-cyan';
    }
  }

  if (inspectStatSponge) {
    let spongeVal = spec.spongePower || 0;
    if (cell.hasRainHarvest) spongeVal += 4;
    if (cell.hasBioDrain) spongeVal += (spec.spongePower || 0);

    if (!cell.hasRoadAccess && !spec.isRoad && spongeVal > 0) {
      inspectStatSponge.innerText = '0 m³/s (Yol Yok)';
      inspectStatSponge.className = 'istat-val val-rose';
    } else {
      inspectStatSponge.innerText = spongeVal > 0 ? `+${spongeVal} m³/s` : '0 m³/s';
      inspectStatSponge.className = spongeVal > 0 ? 'istat-val val-cyan' : 'istat-val';
    }
  }

  if (inspectStatCooling) {
    if (!cell.hasRoadAccess && !spec.isRoad && spec.coolingPower > 0) {
      inspectStatCooling.innerText = '0°C (Yol Yok)';
      inspectStatCooling.className = 'istat-val val-rose';
    } else if (spec.coolingPower > 0) {
      inspectStatCooling.innerText = `-${spec.coolingPower}°C`;
      inspectStatCooling.className = 'istat-val val-emerald';
    } else if (spec.coolingPower < 0) {
      inspectStatCooling.innerText = `+${Math.abs(spec.coolingPower)}°C (Isıtıcı)`;
      inspectStatCooling.className = 'istat-val val-rose';
    } else {
      inspectStatCooling.innerText = '0°C';
      inspectStatCooling.className = 'istat-val val-cyan';
    }
  }

  // Gelir ve Bakım Gideri Dengesi
  if (inspectStatIncome) {
    let gross = (cell.hasRoadAccess || spec.isRoad) ? (spec.income || 0) : 0;
    if (cell.hasSolarKit) gross += 35;
    const maintenance = spec.maintenance || 0;
    const net = gross - maintenance;
    if (net > 0) {
      inspectStatIncome.innerText = `+$${net} (Gelir: +$${gross}, Bakım: -$${maintenance})`;
      inspectStatIncome.className = 'istat-val val-emerald';
    } else if (net < 0) {
      inspectStatIncome.innerText = `-$${Math.abs(net)} (Gelir: +$${gross}, Bakım: -$${maintenance})`;
      inspectStatIncome.className = 'istat-val val-rose';
    } else {
      inspectStatIncome.innerText = `$0 (Bakım: -$${maintenance})`;
      inspectStatIncome.className = 'istat-val';
    }
  }
  
  if (inspectStatTemp) {
    inspectStatTemp.innerText = heat.label || `${heat.temp}°C`;
    if (heat.temp >= 40) {
      inspectStatTemp.className = 'istat-val val-rose';
    } else if (heat.temp >= 30) {
      inspectStatTemp.className = 'istat-val val-amber';
    } else {
      inspectStatTemp.className = 'istat-val val-cyan';
    }
  }

  // Bina Yükseltme Eylemleri (Inspect Card Actions)
  if (inspectActions) {
    // Önce tüm buton ve rozetleri gizle
    if (btnInstallRainHarvest) btnInstallRainHarvest.classList.add('hidden');
    if (badgeRainHarvest) badgeRainHarvest.classList.add('hidden');
    if (btnInstallSolarKit) btnInstallSolarKit.classList.add('hidden');
    if (badgeSolarKit) badgeSolarKit.classList.add('hidden');
    if (btnInstallBioDrain) btnInstallBioDrain.classList.add('hidden');
    if (badgeBioDrain) badgeBioDrain.classList.add('hidden');
    if (btnInstallCompactor) btnInstallCompactor.classList.add('hidden');
    if (badgeCompactor) badgeCompactor.classList.add('hidden');
    if (btnInstallFilter) btnInstallFilter.classList.add('hidden');
    if (filterActiveBadge) filterActiveBadge.classList.add('hidden');

    let hasAnyAction = false;

    // 1. Eco House: Çatı Yağmur Hasadı Deposu ($60)
    if (cell.buildingType === 'eco_house') {
      hasAnyAction = true;
      if (cell.hasRainHarvest) {
        if (badgeRainHarvest) badgeRainHarvest.classList.remove('hidden');
      } else if (btnInstallRainHarvest) {
        btnInstallRainHarvest.classList.remove('hidden');
        const canAfford = game.budget >= 60;
        btnInstallRainHarvest.disabled = !canAfford;
        btnInstallRainHarvest.style.opacity = canAfford ? '1.0' : '0.5';
        btnInstallRainHarvest.title = canAfford
          ? 'Çatı yağmur suyunu depolayarak taşkın akıntısını azaltır ($60)'
          : 'Yetersiz bütçe! ($60 gerekli)';
      }
    }

    // 2. Green Roof: Balkon Güneş Paneli Kiti ($100)
    if (cell.buildingType === 'green_roof') {
      hasAnyAction = true;
      if (cell.hasSolarKit) {
        if (badgeSolarKit) badgeSolarKit.classList.remove('hidden');
      } else if (btnInstallSolarKit) {
        btnInstallSolarKit.classList.remove('hidden');
        const canAfford = game.budget >= 100;
        btnInstallSolarKit.disabled = !canAfford;
        btnInstallSolarKit.style.opacity = canAfford ? '1.0' : '0.5';
        btnInstallSolarKit.title = canAfford
          ? 'Balkonlara fotovoltaik kit takarak düzenli pasif gelir üretir ($100)'
          : 'Yetersiz bütçe! ($100 gerekli)';
      }
    }

    // 3. Sponge Park: Derin Biyo-Drenaj Hendekleri ($120)
    if (cell.buildingType === 'sponge_park') {
      hasAnyAction = true;
      if (cell.hasBioDrain) {
        if (badgeBioDrain) badgeBioDrain.classList.remove('hidden');
      } else if (btnInstallBioDrain) {
        btnInstallBioDrain.classList.remove('hidden');
        const canAfford = game.budget >= 120;
        btnInstallBioDrain.disabled = !canAfford;
        btnInstallBioDrain.style.opacity = canAfford ? '1.0' : '0.5';
        btnInstallBioDrain.title = canAfford
          ? 'Parkın su emme ve tahliye kapasitesini iki katına çıkarır ($120)'
          : 'Yetersiz bütçe! ($120 gerekli)';
      }
    }

    // 4. Commercial Hub: Sıfır Atık Kompaktörü ($90)
    if (cell.buildingType === 'commercial_hub') {
      hasAnyAction = true;
      if (cell.hasWasteCompactor) {
        if (badgeCompactor) badgeCompactor.classList.remove('hidden');
      } else if (btnInstallCompactor) {
        btnInstallCompactor.classList.remove('hidden');
        const canAfford = game.budget >= 90;
        btnInstallCompactor.disabled = !canAfford;
        btnInstallCompactor.style.opacity = canAfford ? '1.0' : '0.5';
        btnInstallCompactor.title = canAfford
          ? 'Ticari atıkları presleyerek sokak çöpü taşmasını önler ($90)'
          : 'Yetersiz bütçe! ($90 gerekli)';
      }
    }

    // 5. Eski Kömürlü Beton Tesis: Elektrostatik Baca Filtresi ($80)
    if (cell.buildingType === 'legacy_concrete') {
      hasAnyAction = true;
      if (cell.hasChimneyFilter) {
        if (filterActiveBadge) filterActiveBadge.classList.remove('hidden');
      } else if (btnInstallFilter) {
        btnInstallFilter.classList.remove('hidden');
        const canAfford = game.budget >= 80;
        btnInstallFilter.disabled = !canAfford;
        btnInstallFilter.style.opacity = canAfford ? '1.0' : '0.5';
        btnInstallFilter.title = canAfford
          ? 'Bacadan çıkan dumanı kes ve karbon salınımını %80 azalt ($80)'
          : 'Yetersiz bütçe! ($80 gerekli)';
      }
    }

    if (hasAnyAction) {
      inspectActions.classList.remove('hidden');
    } else {
      inspectActions.classList.add('hidden');
    }
  }

  if (inspectCard) {
    inspectCard.classList.remove('hidden');
    inspectCard.style.display = 'block';
  }
}

function closeInspectPopup() {
  currentInspectCell = null;
  if (inspectCard) inspectCard.classList.add('hidden');
}

if (btnInstallFilter) {
  btnInstallFilter.addEventListener('click', () => {
    if (!currentInspectCell) return;
    const ok = game.installChimneyFilter(currentInspectCell);
    if (ok) {
      showInspectPopup(currentInspectCell);
      updateHUD();
    }
  });
}

if (btnInstallRainHarvest) {
  btnInstallRainHarvest.addEventListener('click', () => {
    if (!currentInspectCell) return;
    const ok = game.installRainHarvest(currentInspectCell);
    if (ok) {
      showInspectPopup(currentInspectCell);
      updateHUD();
    }
  });
}

if (btnInstallSolarKit) {
  btnInstallSolarKit.addEventListener('click', () => {
    if (!currentInspectCell) return;
    const ok = game.installSolarKit(currentInspectCell);
    if (ok) {
      showInspectPopup(currentInspectCell);
      updateHUD();
    }
  });
}

if (btnInstallBioDrain) {
  btnInstallBioDrain.addEventListener('click', () => {
    if (!currentInspectCell) return;
    const ok = game.installBioDrain(currentInspectCell);
    if (ok) {
      showInspectPopup(currentInspectCell);
      updateHUD();
    }
  });
}

if (btnInstallCompactor) {
  btnInstallCompactor.addEventListener('click', () => {
    if (!currentInspectCell) return;
    const ok = game.installWasteCompactor(currentInspectCell);
    if (ok) {
      showInspectPopup(currentInspectCell);
      updateHUD();
    }
  });
}

// UI Callback Paketi
const ui = {
  showToast,
  speakMuratBey(text) {
    speakMuratBey(text);
  },
  speakAURA(text) {
    speakMuratBey(text);
  },
  inspectReport(text) {
    showToast(text, 'info');
  },
  onHeatmapToggle(isActive) {
    if (btnHeatmap) btnHeatmap.classList.toggle('active', isActive);
    if (heatmapLegend) heatmapLegend.classList.toggle('hidden', !isActive);
    showToast(isActive ? 'Kentsel Isı Haritası (Termal Görünüm) Açık' : 'Normal Görünüme Dönüldü', 'info');
  },
  showInspectCard(cell) {
    showInspectPopup(cell);
  },
  closeInspectCard() {
    closeInspectPopup();
  },
  triggerDisasterWarning(type, seconds) {
    if (type === 'FLOOD') {
      radarStatus.innerHTML = '<span class="radar-badge-icon pulse"><svg viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4.5" fill="#ef4444"/></svg></span> KIRMIZI KOD | ŞİDDETLİ SAĞANAK & SEL';
      radarStatus.style.color = 'var(--color-rose)';
      radarDesc.innerText = 'MGM: Havzada ani sağanak ve cadde taşkını riski.';
      speakMuratBey('Başkanım, fırtına yaklaşıyor! Mazgal ve yağmur parklarını artıralım.');
    } else if (type === 'HEATWAVE') {
      radarStatus.innerHTML = '<span class="radar-badge-icon pulse"><svg viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4.5" fill="#f97316"/></svg></span> TURUNCU KOD | TERMAL DALGA';
      radarStatus.style.color = 'var(--color-amber)';
      radarDesc.innerText = 'MGM: Aşırı sıcak hava dalgası ve termal yük.';
      speakMuratBey('Başkanım, aşırı sıcak dalgası kapıda! Ağaçlı bulvarlarla şehri serinletelim.');
    } else {
      radarStatus.innerHTML = '<span class="radar-badge-icon pulse"><svg viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4.5" fill="#eab308"/></svg></span> SARI KOD | DUMAN İNVERSİYONU';
      radarStatus.style.color = 'var(--color-amber)';
      radarDesc.innerText = 'MGM: Duman inversiyonu ve partikül birikimi.';
      speakMuratBey('Başkanım, duman partikülleri şehre iniyor! Ağaçlandırma ve filtreleri artıralım.');
    }
    radarBox.style.borderColor = type === 'FLOOD' ? 'var(--color-rose)' : 'var(--color-amber)';
    radarTime.innerText = `00:${seconds.toString().padStart(2, '0')}`;
  },
  triggerDisasterStart(type) {
    if (type === 'FLOOD') {
      radarStatus.innerHTML = '<span class="radar-badge-icon"><svg viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4.5" fill="#ef4444"/></svg></span> KIRMIZI KOD | ŞİDDETLİ SAĞANAK & SEL';
      radarDesc.innerText = 'MGM: Sağanak sel tepe debisinde. Drenaj sistemleri devrede.';
      speakMuratBey('Cadde suları yükseliyor! Mazgal ekleyin ya da acil savakları açın.');
    } else if (type === 'HEATWAVE') {
      radarStatus.innerHTML = '<span class="radar-badge-icon"><svg viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4.5" fill="#f97316"/></svg></span> TURUNCU KOD | TERMAL DALGA';
      radarDesc.innerText = 'MGM: Termal dalga tepe noktada. Şebeke yükü izleniyor.';
      speakMuratBey('Aşırı sıcaklar başladı! Güneş panelleri ve serin alanlarla yükü düşürün.');
    } else {
      radarStatus.innerHTML = '<span class="radar-badge-icon"><svg viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4.5" fill="#eab308"/></svg></span> SARI KOD | DUMAN İNVERSİYONU';
      radarDesc.innerText = 'MGM: Duman tabakası havzada asılı duruyor.';
      speakMuratBey('Duman kentsel alana indi. Ağaçlı koridorlarla hava akışını sağlayalım.');
    }
  },
  resetRadar() {
    radarStatus.innerHTML = '<span class="radar-badge-icon"><svg viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4.5" fill="#10b981"/></svg></span> YEŞİL KOD | NORMAL METEOROLOJİ';
    radarStatus.style.color = 'var(--color-cyan)';
    radarDesc.innerText = 'MGM: Meteorolojik parametreler sakin ve dengeli.';
    radarBox.style.borderColor = 'rgba(14, 165, 233, 0.35)';
    radarTime.innerText = '--:--';
  },
  triggerDisasterSuccess(reward) {
    this.resetRadar();
    speakMuratBey(`Tebrikler Başkanım! Afeti başarıyla atlattık. Afet Fonu +$${reward} hibe aktardı.`);
    showToast(`Kriz Savuşturuldu! +$${reward} Hibe Alındı`, 'success');
  },
  showVictory() {
    closeInspectPopup();
    victoryModal.classList.remove('hidden');
  },
  showGameOver(reason) {
    closeInspectPopup();
    gameoverReason.innerText = reason;
    gameoverModal.classList.remove('hidden');
  },
  showMicroEvent(event) {
    if (!microEventCard) return;
    if (meventTitle) meventTitle.innerText = event.title;
    if (meventDesc) meventDesc.innerText = event.desc;
    if (meventOpt1Label) meventOpt1Label.innerText = event.optionA.label;
    if (meventOpt1Sub) meventOpt1Sub.innerText = event.optionA.impact;
    if (meventOpt2Label) meventOpt2Label.innerText = event.optionB.label;
    if (meventOpt2Sub) meventOpt2Sub.innerText = event.optionB.impact;
    if (meventTimer) meventTimer.innerText = `${Math.ceil(event.timeLeft)}s`;
    if (meventBar) meventBar.style.width = '100%';
    microEventCard.classList.remove('hidden');
  },
  hideMicroEvent() {
    if (microEventCard) microEventCard.classList.add('hidden');
  }
};

// 1. Üç Boyutlu Çekirdeği Başlat
const worldScene = new WorldScene(container);
const grid = new GridManager(worldScene.scene, 20, 14);
const bm = new BuildingManager(worldScene.scene);
const disasters = new DisasterSimulator(worldScene.scene);
const game = new GameManager(worldScene, grid, bm, disasters, ui);
// Başlangıç modalı açıkken simülasyon duraklatılmış başlar
game.isPaused = true;
let traffic = null;

if (typeof window !== 'undefined') {
  window.game = game;
  window.worldScene = worldScene;
  window.grid = grid;
}

// Modelleri Önden Yükle ve Başlangıç Şehrini Kur
bm.preloadAll(() => {
  if (typeof worldScene.setupModularHighway === 'function') {
    worldScene.setupModularHighway(bm);
  }
  game.initStarterCity();
  traffic = new TrafficSystem(worldScene.scene, grid);
});

// 2. Kategorili Cities: Skylines İnşaat Alt Barı Yönetimi (5 Entegre Sekme)
let activeCategory = 'roads';
let isSubbarOpen = false;

function updateInfoStrip(spec) {
  if (game.toolMode === 'BULLDOZE') {
    infoItemName.innerText = 'Buldozer & Geri Dönüşüm (SEÇİLİ)';
    infoItemDesc.innerText = 'Yapı veya yollara tıklayarak yıkın. %50 bütçe iadesi ve ekolojik yağmur parkları için Geri Dönüştürülmüş Agrega sağlar. [ESC: İptal]';
    return;
  }
  if (!spec) return;
  const isSelected = game.toolMode === 'BUILD' && game.selectedBuildingType === spec.id;
  infoItemName.innerText = `${spec.name} • $${spec.cost}${isSelected ? ' (SEÇİLİ)' : ''}`;
  infoItemDesc.innerText = `${spec.desc} — ${spec.isRoad ? 'Tıklayarak veya sürükleyerek döşeyin' : 'Boş parsele tıklayarak inşa edin'} [ESC: İptal]`;
}

// 3 Temel Sadeleştirilmiş İnşaat Grubu (Kullanıcı İsteği: Ulaşım, Yeşil & Gölge, Geri Dönüşüm)
const SIMPLIFIED_CATEGORIES = [
  { id: 'roads', name: 'Ulaşım', hint: 'Yol, Bulvar & Mazgal' },
  { id: 'parks', name: 'Yeşil & Gölge', hint: 'Park, Ağaç & Güneş' },
  { id: 'waste', name: 'Geri Dönüşüm', hint: 'Atık, Arıtma & Yıkım' }
];

function renderCategoryTabs() {
  categoryTabsEl.innerHTML = '';
  const mission = game ? game.getCurrentMission() : null;
  const tutStep = (game && game.tutorialActive) ? game.tutorialStep : -1;
  const tutTargetCat = tutStep === 1 || tutStep === 4 ? 'roads' : tutStep === 2 ? 'parks' : tutStep === 3 ? 'waste' : (mission?.targetCategory || null);

  SIMPLIFIED_CATEGORIES.forEach((cat) => {
    const btn = document.createElement('button');
    const isTutCat = isSubbarOpen && tutTargetCat === cat.id && activeCategory !== cat.id;
    btn.className = `cat-tab ${cat.id === activeCategory ? 'active' : ''} ${isTutCat ? 'tut-btn-glow' : ''}`;
    btn.dataset.catId = cat.id;
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
  const mission = game ? game.getCurrentMission() : null;
  const tutStep = (game && game.tutorialActive) ? game.tutorialStep : -1;
  const tutTargetItem = tutStep === 1 ? 'road' : tutStep === 2 ? 'sponge_park' : tutStep === 3 ? 'demolish_tool' : tutStep === 4 ? 'drain_grate' : (mission?.targetType || null);

  // 3 Temel Kategoride Gösterilecek Sadeleştirilmiş Yapı Listesi
  let targetItems = [];
  if (activeCategory === 'roads') {
    targetItems = ['road', 'boulevard', 'drain_grate'];
  } else if (activeCategory === 'parks') {
    targetItems = ['sponge_park', 'solar_farm', 'eco_house'];
  } else if (activeCategory === 'waste') {
    targetItems = ['demolish_tool', 'waste_station', 'water_treatment'];
  } else {
    targetItems = ['road', 'sponge_park', 'demolish_tool'];
  }

  targetItems.forEach((typeId) => {
    const spec = BUILDINGS_CATALOG[typeId];
    if (!spec) return;

    const card = document.createElement('div');
    const isDemolish = typeId === 'demolish_tool';
    const isSelected = isDemolish ? (game.toolMode === 'BULLDOZE') : (game.toolMode === 'BUILD' && game.selectedBuildingType === spec.id);
    const isTutItem = tutTargetItem === typeId;
    card.className = `build-item-card ${isSelected ? 'active' : ''} ${isTutItem ? 'tut-btn-glow' : ''}`;
    card.dataset.itemId = spec.id;

    const badges = [];
    if (isDemolish) {
      badges.push('<span class="stat-pill stat-pop">+%50 İade</span>');
      badges.push('<span class="stat-pill stat-sponge">+Agrega</span>');
    } else {
      if (spec.population > 0) badges.push(`<span class="stat-pill stat-pop">+${spec.population} Nüfus</span>`);
      if (spec.income > 0) badges.push(`<span class="stat-pill stat-inc">+$${spec.income} Gelir</span>`);
      if (spec.spongePower > 0) badges.push(`<span class="stat-pill stat-sponge">+${spec.spongePower} m³/s Sel</span>`);
      if (spec.coolingPower > 0) badges.push(`<span class="stat-pill stat-cool">-${spec.coolingPower}°C Isı</span>`);
      if (spec.isRoad && badges.length === 0) badges.push('<span class="stat-pill">Yol Ağı</span>');
    }

    card.innerHTML = `
      <div class="item-icon-box">
        ${ITEM_SVGS[spec.id] || CATEGORY_SVGS[spec.category] || ''}
      </div>
      <div class="item-details">
        <div class="item-top-line">
          <span class="item-title">${spec.shortName || spec.name}</span>
          <span class="item-price">${isDemolish ? 'Yıkım' : '$' + spec.cost}</span>
        </div>
        <div class="item-badges">
          ${badges.join('')}
          ${isSelected ? '<span class="stat-pill stat-active">SEÇİLİ</span>' : ''}
        </div>
      </div>
    `;

    card.addEventListener('mouseenter', () => updateInfoStrip(spec));

    card.addEventListener('click', () => {
      if (isDemolish) {
        game.setToolMode('BULLDOZE');
        btnToolHammer.classList.add('active');
        btnToolInspect.classList.remove('active');
        showToast('Buldozer & Geri Dönüşüm: Yıkmak istediğiniz yapıya tıklayın.', 'info');
      } else {
        game.selectBuildingType(spec.id);
        btnToolHammer.classList.add('active');
        btnToolInspect.classList.remove('active');
      }
      renderCategoryItems();
      updateInfoStrip(spec);
    });

    categoryItemsEl.appendChild(card);
  });

  const curSpec = BUILDINGS_CATALOG[game.selectedBuildingType] || BUILDINGS_CATALOG[targetItems[0]];
  if (curSpec) updateInfoStrip(curSpec);
}

function setSubbarOpen(open) {
  isSubbarOpen = open;
  if (open) {
    buildSubbar.classList.remove('collapsed');
    if (isOpsOpen) setOpsSubbarOpen(false);
  } else {
    buildSubbar.classList.add('collapsed');
  }
}

function setOpsSubbarOpen(open) {
  isOpsOpen = open;
  if (!opsSubbar) return;
  if (open) {
    opsSubbar.classList.remove('collapsed');
    if (btnToolOps) btnToolOps.classList.add('active');
    setSubbarOpen(false);
    btnToolHammer.classList.remove('active');
    btnToolInspect.classList.remove('active');
    game.setToolMode('NONE');
    grid.clearHighlight();
  } else {
    opsSubbar.classList.add('collapsed');
    if (btnToolOps) btnToolOps.classList.remove('active');
  }
}

// Çekiç (İnşaat) Butonu: 5 Sekmeli Kategorili Alt Barı Açar / Kapatır
btnToolHammer.addEventListener('click', () => {
  if (isSubbarOpen) {
    setSubbarOpen(false);
    game.setToolMode('NONE');
    grid.clearHighlight();
    btnToolHammer.classList.remove('active');
    sound.playClick();
  } else {
    setSubbarOpen(true);
    btnToolHammer.classList.add('active');
    btnToolInspect.classList.remove('active');
    if (activeCategory === 'demolish') {
      game.setToolMode('BULLDOZE');
    } else {
      const items = Object.values(BUILDINGS_CATALOG).filter((b) => b.category === activeCategory && !b.isLegacy && !b.isTool && !b.hidden);
      if (!game.selectedBuildingType || BUILDINGS_CATALOG[game.selectedBuildingType]?.category !== activeCategory) {
        game.selectBuildingType(items[0]?.id || 'road');
      } else {
        game.setToolMode('BUILD');
      }
    }
    renderCategoryTabs();
    renderCategoryItems();
    sound.playClick();
  }
});

// İnceleme / Analitik Butonu
btnToolInspect.addEventListener('click', () => {
  if (game.toolMode === 'INSPECT') {
    game.setToolMode('NONE');
    btnToolInspect.classList.remove('active');
    grid.clearHighlight();
    showToast('İnceleme Modu Kapatıldı', 'info');
  } else {
    setSubbarOpen(false);
    btnToolHammer.classList.remove('active');
    game.setToolMode('INSPECT');
    btnToolInspect.classList.add('active');
    grid.clearHighlight();
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
  game.setToolMode('NONE');
  grid.clearHighlight();
  btnToolHammer.classList.remove('active');
  sound.playClick();
});

// Saha & Çevre Operasyonları Butonu
if (btnToolOps) {
  btnToolOps.addEventListener('click', () => {
    setOpsSubbarOpen(!isOpsOpen);
    sound.playClick();
  });
}

if (btnCloseOps) {
  btnCloseOps.addEventListener('click', () => {
    setOpsSubbarOpen(false);
    sound.playClick();
  });
}

// İlk Açılışta Kategorileri Renderla
renderCategoryTabs();
renderCategoryItems();

// 3. Raycasting, 3B Hologram Önizleme & Sürükleyerek Yol Döşeme (Click-and-Drag Road Laying)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const hitMeshes = grid.cells.map((c) => c.hitMesh);
let isDraggingBuild = false;
let lastActedCell = null;
let currentHoverCell = null;
let pointerDownPos = null;
let pointerDownCell = null;

function refreshCellHighlight(cell) {
  if (game.toolMode === 'NONE' || !game.toolMode) {
    grid.clearHighlight();
    return;
  }
  const spec = BUILDINGS_CATALOG[game.selectedBuildingType] || null;
  const rotAngle = (game.hasCustomRotation && game.getBuildRotationAngle) ? game.getBuildRotationAngle() : null;
  grid.highlightCell(cell, game.toolMode, bm, spec, game.budget, rotAngle);
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
  if (e.target.closest('#dashboard-overlay') || !startModal.classList.contains('hidden') || game.toolMode === 'NONE' || !game.toolMode) {
    currentHoverCell = null;
    grid.clearHighlight();
    return;
  }

  const cell = getHoveredCell(e);
  currentHoverCell = cell;
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

// Sağ tık: Varsayılan tarayıcı menüsünü engelle ve fare jestlerinin sayfadan atmasını önle
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
}, { capture: true });

// Çift tıklama ve yardımcı tuşların tarayıcı navigasyonunu tetiklemesini önle
window.addEventListener('dblclick', (e) => {
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
  }
});

const unlockAudioContext = () => {
  if (sound.init()) {
    sound.startCityAmbience();
  }
};
window.addEventListener('pointerdown', unlockAudioContext);
window.addEventListener('click', unlockAudioContext);

window.addEventListener('pointerdown', (e) => {
  if (e.button === 2) {
    closeInspectPopup();
    if (game.toolMode !== 'NONE' || isSubbarOpen) {
      game.setToolMode('NONE');
      setSubbarOpen(false);
      btnToolHammer.classList.remove('active');
      btnToolInspect.classList.remove('active');
      grid.clearHighlight();
      showToast('Seçim Temizlendi [Sağ Tık]', 'info');
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

    if (cell && game.toolMode === 'BUILD') {
      const spec = BUILDINGS_CATALOG[game.selectedBuildingType];
      if (spec && spec.isRoad) {
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
  if (e.target.closest('#dashboard-overlay') || e.target.closest('#inspect-card')) {
    isDraggingBuild = false;
    lastActedCell = null;
    pointerDownPos = null;
    pointerDownCell = null;
    worldScene.controls.enabled = true;
    return;
  }
  if (e.button === 0 && pointerDownPos && !isDraggingBuild) {
    const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    // Kamera döndürme sürüklemesi değilse (tıklama ise) binayı kur / yık / incele
    if (moveDist < 7) {
      const cell = getHoveredCell(e) || pointerDownCell;
      if (game.toolMode === 'INSPECT') {
        if (cell && cell.occupied) {
          showInspectPopup(cell);
          sound.playClick();
        } else if (cell) {
          closeInspectPopup();
          showToast(`Parsel [${cell.row + 1}, ${cell.col + 1}]: Boş İmar Alanı`, 'info');
          sound.playClick();
        }
      } else if (game.toolMode === 'BUILD' || game.toolMode === 'BULLDOZE') {
        closeInspectPopup();
        if (cell) {
          game.handleCellAction(cell, false);
          refreshCellHighlight(cell);
        }
      } else {
        // Normal mod (toolMode === 'NONE'): Dolu parsele tıklandığında bilgi kartını aç
        if (cell && cell.occupied) {
          showInspectPopup(cell);
          sound.playClick();
        } else {
          closeInspectPopup();
        }
      }
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
  if (e.key === 'F1' || e.key === '?') {
    e.preventDefault();
    startModal.classList.toggle('hidden');
    sound.playClick();
    return;
  }
  if (!startModal.classList.contains('hidden')) {
    if (e.key === 'Escape') {
      startModal.classList.add('hidden');
      sound.playClick();
    }
    return;
  }
  if (e.key === 'b' || e.key === 'B') {
    btnToolHammer.click();
  } else if (e.key === '1') {
    activeCategory = 'roads';
    setSubbarOpen(true);
    btnToolHammer.classList.add('active');
    btnToolInspect.classList.remove('active');
    game.selectBuildingType('road');
    renderCategoryTabs();
    renderCategoryItems();
    sound.playClick();
  } else if (e.key === 'x' || e.key === 'X') {
    activeCategory = 'demolish';
    setSubbarOpen(true);
    btnToolHammer.classList.add('active');
    btnToolInspect.classList.remove('active');
    game.setToolMode('BULLDOZE');
    renderCategoryTabs();
    renderCategoryItems();
    sound.playClick();
  } else if (e.key === 'i' || e.key === 'I') {
    btnToolInspect.click();
  } else if (e.key === 'v' || e.key === 'V') {
    btnToolCamera.click();
  } else if (e.key === 'o' || e.key === 'O') {
    if (btnToolOps) btnToolOps.click();
  } else if (e.code === 'Space') {
    e.preventDefault();
    game.isPaused = !game.isPaused;
    btnSpeed.innerText = game.isPaused ? 'DUR' : `${game.gameSpeed}x`;
    showToast(game.isPaused ? 'Simülasyon Duraklatıldı' : 'Simülasyon Devam Ediyor', 'info');
  } else if (e.key === 'r' || e.key === 'R') {
    if (game.toolMode === 'BUILD' && game.selectedBuildingType) {
      const step = game.rotatePlacement();
      const deg = step * 90;
      sound.playClick();
      grid.invalidateGhost();
      if (!currentHoverCell) {
        raycaster.setFromCamera(mouse, worldScene.camera);
        const intersects = raycaster.intersectObjects(hitMeshes, false);
        if (intersects.length > 0) {
          currentHoverCell = grid.getCellFromIntersection(intersects[0].object);
        }
      }
      if (currentHoverCell) {
        refreshCellHighlight(currentHoverCell);
      }
      showToast(`Bina Rotasyonu: ${deg}°`, 'info');
    } else {
      isTopView = false;
      btnToolCamera.classList.remove('active');
      worldScene.resetCamera();
      sound.playClick();
    }
  } else if (e.key === 'Escape') {
    closeInspectPopup();
    if (isOpsOpen) setOpsSubbarOpen(false);
    if (game.toolMode !== 'NONE' || isSubbarOpen) {
      game.setToolMode('NONE');
      setSubbarOpen(false);
      btnToolHammer.classList.remove('active');
      btnToolInspect.classList.remove('active');
      grid.clearHighlight();
      showToast('Seçim Temizlendi [ESC]', 'info');
    }
  } else if (e.key === 'h' || e.key === 'H') {
    game.toggleHeatmap();
  } else if (e.key === 'f' || e.key === 'F') {
    if (game.crisisPhase === 'PEACE') {
      game.nextDisasterType = 'FLOOD';
      game.crisisTimer = 3.0;
      sound.playThunder(0.2);
      showToast('Jüri / Sunum Hızlı Tetikleme: Sağanak ve Sel Afeti Başlatılıyor...', 'warning');
    }
  } else if (e.key === 't' || e.key === 'T') {
    if (game.crisisPhase === 'PEACE') {
      game.nextDisasterType = 'HEATWAVE';
      game.crisisTimer = 3.0;
      sound.playAlarm();
      showToast('Jüri / Sunum Hızlı Tetikleme: Termal Sıcak Dalgası Başlatılıyor...', 'warning');
    }
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

if (btnHeatmap) {
  btnHeatmap.addEventListener('click', () => {
    game.toggleHeatmap();
  });
}

if (radarBox) {
  radarBox.style.cursor = 'pointer';
  radarBox.setAttribute('title', 'Tıkla: Yaklaşan Afeti Hızlandır (Jüri / Sunum Modu)');
  radarBox.addEventListener('click', () => {
    if (game.crisisPhase === 'PEACE') {
      game.crisisTimer = 2.5;
      sound.playClick();
      showToast('Meteoroloji Radarı: Afet erken başlatılıyor...', 'warning');
    }
  });
}

if (btnCloseHeatmap) {
  btnCloseHeatmap.addEventListener('click', () => {
    if (game.isHeatmapActive) {
      game.toggleHeatmap();
    }
  });
}

if (inspectCard) {
  inspectCard.addEventListener('pointerdown', (e) => e.stopPropagation());
  inspectCard.addEventListener('pointerup', (e) => e.stopPropagation());
}

if (btnCloseInspect) {
  btnCloseInspect.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeInspectPopup();
    sound.playClick();
  });
}

// v9.0 Taktiksel Acil Durum Butonu Dinleyicileri
if (btnEmerg1) {
  btnEmerg1.addEventListener('click', () => {
    const act = btnEmerg1.dataset.action;
    if (act && game.executeEmergencyAction(act)) {
      updateHUD();
    }
  });
}
if (btnEmerg2) {
  btnEmerg2.addEventListener('click', () => {
    const act = btnEmerg2.dataset.action;
    if (act && game.executeEmergencyAction(act)) {
      updateHUD();
    }
  });
}

// v10.0 Öğretici & Mikro-Olay Buton Dinleyicileri
if (btnTutSkip) {
  btnTutSkip.addEventListener('click', () => {
    game.skipTutorial();
    game.isTutorialDismissed = true;
    if (tutorialBar) tutorialBar.classList.add('hidden');
    sound.playClick();
    updateHUD();
  });
}

// v11.1 Belediye Saha Temizlik Görevleri Dinleyicileri
if (btnCleanSea) {
  btnCleanSea.addEventListener('click', () => {
    if (typeof game.dispatchSeaCleanup === 'function') {
      game.dispatchSeaCleanup();
      updateHUD();
    }
  });
}

if (btnCleanStreets) {
  btnCleanStreets.addEventListener('click', () => {
    if (typeof game.dispatchStreetWasteCleanup === 'function') {
      game.dispatchStreetWasteCleanup();
      updateHUD();
    }
  });
}

if (btnMeventOpt1) {
  btnMeventOpt1.addEventListener('click', () => {
    game.resolveMicroEvent(0);
    updateHUD();
  });
}

if (btnMeventOpt2) {
  btnMeventOpt2.addEventListener('click', () => {
    game.resolveMicroEvent(1);
    updateHUD();
  });
}

const btnAuraGuide = document.getElementById('btn-aura-guide');
if (btnAuraGuide) {
  btnAuraGuide.addEventListener('click', () => {
    if (mainMenuView && briefingStoryView) {
      mainMenuView.classList.add('hidden');
      briefingStoryView.classList.remove('hidden');
    }
    startModal.classList.toggle('hidden');
    sound.playClick();
  });
}

if (btnMenuPlay) {
  btnMenuPlay.addEventListener('click', () => {
    sound.init();
    sound.playClick();
    if (mainMenuView) mainMenuView.classList.add('hidden');
    if (briefingStoryView) briefingStoryView.classList.remove('hidden');
  });
}

if (btnBriefingBack) {
  btnBriefingBack.addEventListener('click', () => {
    sound.playClick();
    if (briefingStoryView) briefingStoryView.classList.add('hidden');
    if (mainMenuView) mainMenuView.classList.remove('hidden');
  });
}

if (btnMenuSettings && menuSettingsPanel) {
  btnMenuSettings.addEventListener('click', () => {
    sound.init();
    sound.playClick();
    menuSettingsPanel.classList.toggle('hidden');
  });
}

if (optSoundToggle) {
  optSoundToggle.addEventListener('click', () => {
    const isMuted = sound.toggleMute();
    optSoundToggle.innerText = isMuted ? 'KAPALI' : 'AÇIK';
    optSoundToggle.classList.toggle('active', !isMuted);
    btnSound.style.opacity = isMuted ? '0.4' : '1.0';
  });
}

if (optSpeedSelect) {
  optSpeedSelect.addEventListener('click', () => {
    game.gameSpeed = game.gameSpeed === 1.0 ? 2.0 : 1.0;
    optSpeedSelect.innerText = game.gameSpeed === 2.0 ? '2x Hızlı' : '1x Normal';
    optSpeedSelect.classList.toggle('active', game.gameSpeed === 2.0);
    btnSpeed.innerText = `${game.gameSpeed}x`;
    sound.playClick();
  });
}

if (optTutToggle) {
  optTutToggle.addEventListener('click', () => {
    if (game.tutorialActive) {
      game.skipTutorial();
      optTutToggle.innerText = 'KAPALI';
      optTutToggle.classList.remove('active');
    } else {
      game.tutorialActive = true;
      game.tutorialStep = 1;
      if (typeof game.syncTutorialState === 'function') game.syncTutorialState();
      optTutToggle.innerText = 'AKTİF';
      optTutToggle.classList.add('active');
    }
    sound.playClick();
    updateHUD();
  });
}

btnStart.addEventListener('click', () => {
  sound.init();
  sound.startCityAmbience(); // Şehir gürültüsü ve Akdeniz esintisi ambiyansı başlar
  startModal.classList.add('hidden');
  game.isPaused = false;
  btnSpeed.innerText = `${game.gameSpeed}x`;
  sound.playRadioBeep();
  showToast('Başkanlık Görevi Başladı! Rehberi takip ederek şehri yönetin.', 'success');
});

function resetRadioFlags() {
  radioFlags.wasteWarning = false;
  radioFlags.biogasPraise = false;
  radioFlags.treatmentPraise = false;
  radioFlags.carettaPraise = false;
}

btnRestartVictory.addEventListener('click', () => {
  closeInspectPopup();
  victoryModal.classList.add('hidden');
  setSubbarOpen(false);
  btnToolHammer.classList.remove('active');
  btnToolInspect.classList.remove('active');
  grid.clearHighlight();
  resetRadioFlags();
  game.restart();
  sound.playClick();
});

btnRestartGameover.addEventListener('click', () => {
  closeInspectPopup();
  gameoverModal.classList.add('hidden');
  setSubbarOpen(false);
  btnToolHammer.classList.remove('active');
  btnToolInspect.classList.remove('active');
  grid.clearHighlight();
  resetRadioFlags();
  game.restart();
  sound.playClick();
});

// 5. Canlı HUD Güncellemesi
function updateHUD() {
  valBudget.innerText = `$${Math.floor(game.budget).toLocaleString()}`;
  if (game.taxIncome >= 0) {
    valIncome.innerText = `+$${game.taxIncome}/5s`;
    valIncome.style.color = 'var(--color-emerald)';
    valIncome.title = `Net Nakit Akışı: +$${game.taxIncome} (Brüt: +$${game.grossIncome} | Bakım Gideri: -$${game.maintenanceCost})`;
  } else {
    valIncome.innerText = `-$${Math.abs(game.taxIncome)}/5s`;
    valIncome.style.color = 'var(--color-rose)';
    valIncome.title = `Bütçe Açığı! Net: -$${Math.abs(game.taxIncome)} (Brüt: +$${game.grossIncome} | Bakım Gideri: -$${game.maintenanceCost})`;
  }
  valPop.innerText = `${game.population.toLocaleString()}`;
  if (valCarbon) valCarbon.innerText = `${game.carbon}% NET-ZERO`;
  valHealth.innerText = `${game.health.toFixed(1)}%`;

  if (valAirQuality) {
    const airVal = game.airQuality ?? Math.max(0, 100 - game.carbon);
    valAirQuality.innerText = `${airVal}%`;
    valAirQuality.className = airVal >= 70 ? 'metric-val val-emerald' : (airVal >= 45 ? 'metric-val val-cyan' : 'metric-val val-rose');
  }
  if (valZeroWaste) {
    const zwVal = game.zeroWasteRate ?? 22;
    valZeroWaste.innerText = `${zwVal}%`;
    valZeroWaste.className = zwVal >= 70 ? 'metric-val val-emerald' : (zwVal >= 45 ? 'metric-val val-cyan' : 'metric-val val-amber');
  }
  if (valMarineHealth) {
    const mhVal = game.marineHealth ?? 35;
    valMarineHealth.innerText = `${mhVal.toFixed(1)}%`;
    valMarineHealth.className = mhVal >= 75 ? 'metric-val val-emerald' : (mhVal >= 50 ? 'metric-val val-cyan' : 'metric-val val-rose');
  }

  // Murat Bey Telsiz Anonsları (v5.0 Çevre Savunması Tetikleyicileri)
  checkEnvironmentalRadioMilestones();

  valSponge.innerText = `${game.spongeCapacity} m³/s`;
  barSponge.style.width = `${Math.min(100, (game.spongeCapacity / 45) * 100)}%`;

  valCooling.innerText = `-${game.coolingPower}°C`;
  barCooling.style.width = `${Math.min(100, (game.coolingPower / 25) * 100)}%`;

  if (valAggregate) {
    valAggregate.innerText = `${game.recycledAggregate} Adet`;
  }
  if (valLegacyCount) {
    const legacyRemaining = game.grid.cells.filter((c) => c.occupied && c.buildingType === 'legacy_concrete').length;
    valLegacyCount.innerText = `${legacyRemaining} Adet`;
    valLegacyCount.style.color = legacyRemaining === 0 ? 'var(--color-emerald)' : 'var(--color-rose)';
  }

  if (game.crisisPhase === 'WARNING') {
    radarTime.innerText = `00:${Math.ceil(game.crisisTimer).toString().padStart(2, '0')}`;
  } else if (game.crisisPhase === 'ACTIVE') {
    const totalSec = Math.ceil(game.disasterDuration);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    radarTime.innerText = m > 0 ? `AKTİF ${m}d ${s.toString().padStart(2, '0')}s` : `AKTİF ${s}s`;
  }

  // v9.0 Meteorolojik Erken Uyarı Barometresi & Canlı Kentsel Kriz Teşhis HUD
  if (forecastContainer && crisisDiagnosticHud) {
    if (game.crisisPhase === 'PEACE') {
      forecastContainer.classList.remove('hidden');
      crisisDiagnosticHud.classList.add('hidden');
      if (emergencyActionsBar) emergencyActionsBar.classList.add('hidden');

      const nextType = game.nextDisasterType || 'FLOOD';
      const nextName =
        nextType === 'FLOOD'
          ? 'Şiddetli Sağanak & Sel'
          : nextType === 'HEATWAVE'
          ? 'Termal Dalga'
          : 'Duman İnversiyonu';
      const etaSec = Math.max(0, Math.ceil(game.crisisTimer - 10));
      if (forecastLabel) forecastLabel.innerText = `Yaklaşan: ${nextName}`;
      if (forecastEta) forecastEta.innerText = `${etaSec}s`;
      if (forecastBarFill) {
        const pct = Math.min(100, Math.max(0, ((32 - etaSec) / 32) * 100));
        forecastBarFill.style.width = `${pct}%`;
        forecastBarFill.style.background =
          nextType === 'FLOOD' ? 'var(--color-rose)' : 'var(--color-amber)';
      }
    } else {
      forecastContainer.classList.add('hidden');
      crisisDiagnosticHud.classList.remove('hidden');
      const tel = game.getDisasterTelemetry ? game.getDisasterTelemetry() : null;
      const activeType = game.currentDisaster || game.nextDisasterType || 'FLOOD';

      if (tel && diagMetricsList) {
        if (activeType === 'FLOOD') {
          if (diagCardTitle) diagCardTitle.innerText = 'SAĞANAK & SEL TELEMETRİSİ';
          const spongeOk = tel.spongeCapacity >= tel.requiredSponge;
          const grateOk = tel.activeGrates >= tel.requiredGrates;
          const clogLow = tel.zeroWasteRate >= 50;
          diagMetricsList.innerHTML = `
            <div class="diag-metric-row">
              <span class="diag-metric-label">Taşkın Emilimi:</span>
              <span class="diag-metric-val ${spongeOk ? 'diag-ok' : 'diag-danger'}">${tel.spongeCapacity} / ${tel.requiredSponge} m³/s</span>
            </div>
            <div class="diag-metric-row">
              <span class="diag-metric-label">Aktif Mazgal & Pompa:</span>
              <span class="diag-metric-val ${grateOk ? 'diag-ok' : 'diag-warn'}">${tel.activeGrates} Adet (-${tel.drainRate} m/s)</span>
            </div>
            <div class="diag-metric-row">
              <span class="diag-metric-label">Mazgal Tıkanma Riski:</span>
              <span class="diag-metric-val ${clogLow ? 'diag-ok' : 'diag-danger'}">${tel.clogRisk} (%${tel.zeroWasteRate} Atık)</span>
            </div>
          `;
          if (emergencyActionsBar && btnEmerg1 && btnEmerg2) {
            emergencyActionsBar.classList.remove('hidden');
            btnEmerg1.dataset.action = 'sluice_gates';
            btnEmerg1.innerText = 'Falez Deşarj Savaklarını Aç (-5% Kıyı)';
            btnEmerg2.dataset.action = 'vacuum_truck';
            btnEmerg2.innerText = 'Acil Vidanjör Sevk Et ($40)';
          }
        } else if (activeType === 'HEATWAVE') {
          if (diagCardTitle) diagCardTitle.innerText = 'TERMAL DALGA TELEMETRİSİ';
          const powerOk = tel.cleanPower >= tel.coolingDemand || tel.emergencyGridProtected;
          const coolOk = tel.coolingPower >= tel.requiredCooling;
          const aveOk = tel.shadedAvenues >= tel.requiredAvenues;
          diagMetricsList.innerHTML = `
            <div class="diag-metric-row">
              <span class="diag-metric-label">Şebeke Klima Yükü:</span>
              <span class="diag-metric-val ${powerOk ? 'diag-ok' : 'diag-danger'}">${tel.cleanPower} / ${tel.coolingDemand} kW ${tel.emergencyGridProtected ? '(KORUMALI)' : ''}</span>
            </div>
            <div class="diag-metric-row">
              <span class="diag-metric-label">Termal Soğutma:</span>
              <span class="diag-metric-val ${coolOk ? 'diag-ok' : 'diag-danger'}">-${tel.coolingPower}°C / -${tel.requiredCooling}°C</span>
            </div>
            <div class="diag-metric-row">
              <span class="diag-metric-label">Gölgeli Bulvar Ağı:</span>
              <span class="diag-metric-val ${aveOk ? 'diag-ok' : 'diag-warn'}">${tel.shadedAvenues} / ${tel.requiredAvenues} Koridor</span>
            </div>
          `;
          if (emergencyActionsBar && btnEmerg1 && btnEmerg2) {
            emergencyActionsBar.classList.remove('hidden');
            btnEmerg1.dataset.action = 'grid_protect';
            btnEmerg1.innerText = tel.emergencyGridProtected ? 'Şebeke Koruması Aktif' : 'Acil Şebeke Koruması (-%50 Vergi)';
            btnEmerg2.dataset.action = 'mist_fountains';
            btnEmerg2.innerText = 'Kentsel Sisleme Fıskiyeleri ($60)';
          }
        } else {
          if (diagCardTitle) diagCardTitle.innerText = 'İNVERSİYON TELEMETRİSİ';
          const airOk = tel.coolingPower >= 18;
          const filterOk = tel.filteredCount >= tel.totalSmokeable;
          diagMetricsList.innerHTML = `
            <div class="diag-metric-row">
              <span class="diag-metric-label">Rüzgar & Hava Akışı:</span>
              <span class="diag-metric-val ${airOk ? 'diag-ok' : 'diag-danger'}">${tel.coolingPower} / 18 Birim</span>
            </div>
            <div class="diag-metric-row">
              <span class="diag-metric-label">Filtreli Baca Oranı:</span>
              <span class="diag-metric-val ${filterOk ? 'diag-ok' : 'diag-warn'}">${tel.filteredCount} / ${tel.totalSmokeable} Yapı</span>
            </div>
          `;
          if (emergencyActionsBar) emergencyActionsBar.classList.add('hidden');
        }
      }
    }
  }

  // "Tek Hedef" (Görev) & Öğretici HUD Senkronizasyonu
  if (tutorialBar) {
    const showTutorial = Boolean(game.tutorialActive && !game.isTutorialDismissed);
    if (showTutorial) {
      const mission = game.getTutorialInfo ? game.getTutorialInfo() : null;
      if (mission) {
        tutorialBar.classList.remove('hidden');
        if (tutStepBadge) tutStepBadge.innerText = `ADIM ${mission.step} / ${mission.totalSteps}`;
        if (tutStepTitle) tutStepTitle.innerText = mission.title;
        if (tutStepDesc) tutStepDesc.innerText = mission.desc;
        if (tutStepReward) tutStepReward.innerText = mission.rewardText;

        // Hedef UI Butonlarını Parlat (.tut-btn-glow)
        const targetCat = mission.targetCategory || (game.tutorialStep === 1 || game.tutorialStep === 4 ? 'roads' : game.tutorialStep === 2 ? 'parks' : game.tutorialStep === 3 ? 'waste' : null);
        const targetItem = mission.targetType || (game.tutorialStep === 1 ? 'road' : game.tutorialStep === 2 ? 'sponge_park' : game.tutorialStep === 3 ? 'demolish_tool' : game.tutorialStep === 4 ? 'drain_grate' : null);

        if (btnToolHammer) {
          btnToolHammer.classList.toggle('tut-btn-glow', Boolean(targetItem) && !isSubbarOpen);
        }
        if (btnMeventOpt1) {
          btnMeventOpt1.classList.toggle('tut-btn-glow', game.tutorialActive && game.tutorialStep === 5);
        }
        if (isSubbarOpen && categoryTabsEl && targetCat) {
          categoryTabsEl.querySelectorAll('.cat-tab').forEach((tab) => {
            tab.classList.toggle('tut-btn-glow', tab.dataset.catId === targetCat && activeCategory !== targetCat);
          });
        }
        if (isSubbarOpen && categoryItemsEl && targetItem) {
          categoryItemsEl.querySelectorAll('.build-item-card').forEach((card) => {
            const isTarget = card.dataset.itemId === targetItem;
            const isAlreadyActive = card.classList.contains('active');
            card.classList.toggle('tut-btn-glow', isTarget && !isAlreadyActive);
          });
        }
      } else {
        tutorialBar.classList.add('hidden');
      }
    } else {
      tutorialBar.classList.add('hidden');
      if (btnToolHammer) btnToolHammer.classList.remove('tut-btn-glow');
      if (btnMeventOpt1) btnMeventOpt1.classList.remove('tut-btn-glow');
    }
  }

  // v11.1 / v11.2 Saha Temizlik & Operasyonlar Göstergeleri
  if (valCleanSeaHealth && game) {
    valCleanSeaHealth.innerText = `%${Math.round(game.marineHealth || 35)}`;
  }
  if (valCleanWasteRate && game) {
    valCleanWasteRate.innerText = `%${Math.round(game.zeroWasteRate || 22)}`;
  }
  if (opsStatusMarine && game) {
    opsStatusMarine.innerText = `%${Math.round(game.marineHealth || 35)}`;
  }
  if (opsStatusWaste && game) {
    opsStatusWaste.innerText = `%${Math.round(game.zeroWasteRate || 22)}`;
  }

  // Operasyon Butonları Durum Senkronizasyonu
  if (btnCleanSea) {
    const isBoatActive = Boolean(worldScene?.cleaningBoat?.active);
    const canAffordSea = (game?.budget || 0) >= 30;
    btnCleanSea.disabled = isBoatActive || !canAffordSea;
    btnCleanSea.innerText = isBoatActive ? 'Körfezde Görevde...' : 'Tekneyi Sevk Et';
  }
  if (btnCleanStreets) {
    const isTruckActive = Boolean(worldScene?.garbageTruck?.active);
    const canAffordTruck = (game?.budget || 0) >= 25;
    btnCleanStreets.disabled = isTruckActive || !canAffordTruck;
    btnCleanStreets.innerText = isTruckActive ? 'Ekipler Sahada...' : 'Ekibi Sevk Et';
  }

  // v10.0 Barış Evresi Kentsel Mikro-Olay Kartı Canlı Senkronizasyonu
  if (microEventCard) {
    const showMevent = game.activeMicroEvent && game.crisisPhase === 'PEACE' && (!game.tutorialActive || game.tutorialStep === 5);
    if (showMevent) {
      microEventCard.classList.remove('hidden');
      if (meventTimer) meventTimer.innerText = `${Math.ceil(game.activeMicroEvent.timeLeft)}s`;
      if (meventBar) {
        const pct = Math.max(0, Math.min(100, (game.activeMicroEvent.timeLeft / (game.activeMicroEvent.totalTime || 10.0)) * 100));
        meventBar.style.width = `${pct}%`;
      }
    } else {
      microEventCard.classList.add('hidden');
    }
  }
}

// 6. Ana Render ve Simülasyon Döngüsü
let lastTime = performance.now();

function animate(currentTime) {
  requestAnimationFrame(animate);

if (new URLSearchParams(window.location.search).has('autostart')) {
  if (startModal) startModal.classList.add('hidden');
  game.isPaused = false;
}

  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  game.update(dt);
  if (traffic && !game.isPaused) {
    traffic.syncPopulation(game.population);
    traffic.update(dt * game.gameSpeed, game);
  }
  worldScene.update(dt, game);
  updateHUD();
  worldScene.render();
}

requestAnimationFrame(animate);

if (new URLSearchParams(window.location.search).has('autostart')) {
  if (startModal) startModal.classList.add('hidden');
  game.isPaused = false;
}
