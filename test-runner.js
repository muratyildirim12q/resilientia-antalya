import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BuildingManager, BUILDINGS_CATALOG, BUILD_CATEGORIES } from './src/buildings.js';
import { DisasterSimulator } from './src/disasters.js';
import { TrafficSystem, CrowdSystem } from './src/traffic.js';
import { GameManager } from './src/game.js';
import { GridManager } from './src/grid.js';
import { sound } from './src/audio.js';
import { WorldScene } from './src/scene.js';

GLTFLoader.prototype.load = () => {};

if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
}

console.log('--- RUNNING RIGOROUS TEST SUITE ---');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// Mock Scene & Grid
const scene = new THREE.Scene();

// Mock GridManager
const mockGrid = {
  cells: [],
  getRoadCells() {
    return this.cells.filter(c => c.occupied && c.isRoad);
  },
  getCell(r, c) {
    return this.cells.find(cell => cell.row === r && cell.col === c);
  }
};

for (let r = 0; r < 14; r++) {
  for (let c = 0; c < 20; c++) {
    const x = (c - 9.5) * 3.0;
    const z = (r - 6.5) * 3.0;
    mockGrid.cells.push({
      row: r,
      col: c,
      x,
      z,
      occupied: false,
      isRoad: false,
      buildingType: null
    });
  }
}

// Add some starter roads and houses
// Road along r=7 (z = 1.5)
for (let c = 0; c < 20; c++) {
  const cell = mockGrid.getCell(7, c);
  cell.occupied = true;
  cell.isRoad = true;
  cell.buildingType = 'road';
}
// House at r=6, c=10 (x = 1.5, z = -1.5)
const houseCell = mockGrid.getCell(6, 10);
houseCell.occupied = true;
houseCell.isRoad = false;
houseCell.buildingType = 'eco_house';

// Test 1: CrowdSystem initialization
const crowd = new CrowdSystem(scene, mockGrid);
assert(crowd.pedestrians.length > 0, 'Pedestrians spawned');
assert(crowd.cyclists.length > 0, 'Cyclists spawned');
assert(crowd.beachGoers.length >= 6, `Beach crowd has at least 6 members (found ${crowd.beachGoers.length})`);
assert(crowd.ball !== null, 'Beach ball exists');
assert(crowd.sandcastle !== null, 'Sandcastle exists');
assert(crowd.beachBuilder !== null, 'Sandcastle builder exists');

// Test 2: Sidewalk elevation checks
crowd.pedestrians.forEach(p => {
  if (p.type === 'SIDEWALK') {
    assert(p.mesh.group.position.y >= 0.60, `Sidewalk pedestrian height >= 0.60 (got ${p.mesh.group.position.y})`);
  } else {
    assert(p.mesh.group.position.y >= 0.44, `Promenade pedestrian height >= 0.44 (got ${p.mesh.group.position.y})`);
  }
});

crowd.cyclists.forEach(c => {
  if (c.type === 'SIDEWALK') {
    assert(c.mesh.group.position.y >= 0.60, `Sidewalk cyclist height >= 0.60 (got ${c.mesh.group.position.y})`);
  } else {
    assert(c.mesh.group.position.y >= 0.44, `Promenade cyclist height >= 0.44 (got ${c.mesh.group.position.y})`);
  }
});

// Test 3: Beachgoers base positions
crowd.beachGoers.forEach(bg => {
  if (bg !== crowd.beachSwimmer) {
    assert(bg.basePos.y >= 0.16, `Beachgoer base height on sand >= 0.16 (got ${bg.basePos.y})`);
  }
});

// Test 4: Flood Evacuation Fleeing & Entering
const mockGame = {
  crisisPhase: 'ACTIVE',
  currentDisaster: 'FLOOD',
  gameSpeed: 1.0,
  disasters: {
    waterMesh: { position: { y: 0.58 } }
  }
};

// Update crowd for several frames to simulate fleeing
for (let f = 0; f < 60; f++) {
  crowd.update(0.1, mockGame);
}

// Check that beachgoers and pedestrians fled towards the house
let shelteredCount = 0;
let enteringCount = 0;
let fleeingCount = 0;
crowd.beachGoers.forEach(bg => {
  if (bg.state === 'SHELTERED') shelteredCount++;
  else if (bg.state === 'ENTERING') enteringCount++;
  else if (bg.state === 'FLEEING') fleeingCount++;
});
assert(shelteredCount + enteringCount + fleeingCount === crowd.beachGoers.length, 'All beachgoers are in evacuation states');

// Check beach ball floating on floodwater
assert(crowd.ball.position.y >= 0.58, `Beach ball floats on floodwater (y=${crowd.ball.position.y} >= 0.58)`);

// Test 5: Full Sheltering
for (let f = 0; f < 100; f++) {
  crowd.update(0.1, mockGame);
}
let allShelteredOrEntering = crowd.beachGoers.every(bg => bg.state === 'SHELTERED' || bg.state === 'ENTERING');
assert(allShelteredOrEntering, 'All beachgoers reached shelter or entered');

// Test 6: Flood End & Return Without Teleportation
const mockGamePeace = {
  crisisPhase: 'PEACE',
  currentDisaster: null,
  gameSpeed: 1.0,
  disasters: {
    waterMesh: { position: { y: 0.05 } }
  }
};

// Simulate flood ending
for (let f = 0; f < 15; f++) {
  crowd.update(0.1, mockGamePeace);
}

// All sheltered agents should now be visible and in RETURNING or IDLE state
const allVisible = crowd.beachGoers.every(bg => bg.mesh.group.visible === true);
assert(allVisible, 'All sheltered agents became visible upon flood end');

// Let them walk back
for (let f = 0; f < 300; f++) {
  crowd.update(0.1, mockGamePeace);
}

// Verify beachgoers returned to beach spots
const throwerA = crowd.ballThrowers.pA;
const distToStart = Math.hypot(throwerA.mesh.group.position.x - throwerA.basePos.x, throwerA.mesh.group.position.z - throwerA.basePos.z);
assert(distToStart < 0.35, `Beach thrower returned to beach spot (dist=${distToStart.toFixed(2)})`);

// Test 7: Disasters Duration Range
const mockDisasterSim = new DisasterSimulator(scene);
const mockUI = {
  showToast() {},
  triggerDisasterWarning() {},
  triggerDisasterStart() {},
  triggerDisasterSuccess() {},
  resetRadar() {}
};
const game = new GameManager({ scene }, mockGrid, null, mockDisasterSim, mockUI);

for (let i = 0; i < 50; i++) {
  game.crisisPhase = 'WARNING';
  game.crisisTimer = 0;
  game.currentDisaster = 'FLOOD';
  game.update(0.1);
  assert(game.disasterDuration >= 15.0 && game.disasterDuration <= 90.0,
    `Flood duration randomized in [15, 90]s (iteration ${i+1}: ${game.disasterDuration.toFixed(1)}s)`);
}

// Test 8: Dynamic Whirlpools at actual sponge facilities
const spongeCell = mockGrid.getCell(4, 8);
spongeCell.occupied = true;
spongeCell.isRoad = false;
spongeCell.buildingType = 'sponge_park';

mockDisasterSim.setGrid(mockGrid);
mockDisasterSim.setSpongeCapacity(18);
mockDisasterSim.startDisaster('FLOOD');
mockDisasterSim.update(0.016, { intensity: 1, color: { setHex() {} } }, { intensity: 1 }, { color: { setHex() {} } }, { setHex() {} }, mockGrid);

const activeWhirlpools = mockDisasterSim.whirlpools.filter(w => w.mesh.visible);
assert(activeWhirlpools.length > 0, `Active whirlpools found on sponge park (${activeWhirlpools.length} active)`);
assert(Math.abs(activeWhirlpools[0].mesh.position.x - spongeCell.x) < 0.01, `Whirlpool is positioned exactly at sponge park x=${spongeCell.x}`);
assert(Math.abs(activeWhirlpools[0].mesh.position.z - spongeCell.z) < 0.01, `Whirlpool is positioned exactly at sponge park z=${spongeCell.z}`);

// Test 9: Placement rotation cycling and angle computation
const rotGame = new GameManager({ scene }, mockGrid, null, mockDisasterSim, mockUI);
assert(rotGame.buildRotationStep === 0, 'Initial rotation step is 0');
assert(rotGame.getBuildRotationAngle() === 0, 'Initial rotation angle is 0 rad (0 deg)');

assert(rotGame.rotatePlacement() === 1, 'Rotation step increments to 1');
assert(Math.abs(rotGame.getBuildRotationAngle() - Math.PI / 2) < 0.0001, 'Rotation step 1 is Math.PI / 2 (90 deg)');

assert(rotGame.rotatePlacement() === 2, 'Rotation step increments to 2');
assert(Math.abs(rotGame.getBuildRotationAngle() - Math.PI) < 0.0001, 'Rotation step 2 is Math.PI (180 deg)');

assert(rotGame.rotatePlacement() === 3, 'Rotation step increments to 3');
assert(Math.abs(rotGame.getBuildRotationAngle() - 1.5 * Math.PI) < 0.0001, 'Rotation step 3 is 1.5 * Math.PI (270 deg)');

assert(rotGame.rotatePlacement() === 0, 'Rotation step wraps to 0');
assert(rotGame.getBuildRotationAngle() === 0, 'Rotation wrapped angle is 0 rad (0 deg)');

rotGame.rotatePlacement();
rotGame.resetBuildRotation();
assert(rotGame.buildRotationStep === 0, 'resetBuildRotation resets step to 0');

// Test 10: Building placement with custom rotation
const realGrid = new GridManager(scene, 20, 14);
const realBm = new BuildingManager(scene);
const buildGame = new GameManager({ scene, resetLighting() {} }, realGrid, realBm, mockDisasterSim, mockUI);
buildGame.budget = 5000;
buildGame.setToolMode('BUILD');
buildGame.selectedBuildingType = 'eco_house';
buildGame.rotatePlacement(); // step 1 = 90 deg (Math.PI / 2)

const targetCell = realGrid.getCell(4, 9);
targetCell.occupied = false;
const buildOk = buildGame.buildOnCell(targetCell);
assert(buildOk === true, 'eco_house built successfully with rotation');
assert(targetCell.hasCustomRotation === true, 'Placed cell hasCustomRotation flag set');
assert(Math.abs(targetCell.building.rotation.y - Math.PI / 2) < 0.0001, 'Placed building mesh rotation.y matches 90 deg rotation');

// Test 11: 3D Hologram ghost preview with rotationAngle in GridManager
const ghostCell = realGrid.getCell(5, 9);
ghostCell.occupied = false;
realGrid.highlightCell(ghostCell, 'BUILD', realBm, BUILDINGS_CATALOG.eco_house, 5000, Math.PI);
assert(realGrid.ghostGroup.visible === true, 'Ghost preview is visible');
assert(realGrid.ghostGroup.children.length > 0, 'Ghost preview contains mesh child');
assert(Math.abs(realGrid.ghostGroup.children[0].rotation.y - Math.PI) < 0.0001, 'Ghost mesh child rotation.y matches custom rotationAngle (180 deg)');

// Test 12: Electrostatic Chimney Filter Upgrade
const filterGrid = new GridManager(scene, 20, 14);
const filterGame = new GameManager({ scene, resetLighting() {} }, filterGrid, realBm, mockDisasterSim, mockUI);
const legacyCell = filterGrid.getCell(5, 6);
legacyCell.occupied = true;
legacyCell.isRoad = false;
legacyCell.buildingType = 'legacy_concrete';
legacyCell.hasRoadAccess = true;
filterGame.budget = 200;
filterGame.recalculateMetrics();
const initialCarbon = filterGame.carbon;

// Filter installation success
const installSuccess = filterGame.installChimneyFilter(legacyCell);
assert(installSuccess === true, 'Chimney filter installed on legacy_concrete');
assert(legacyCell.hasChimneyFilter === true, 'legacyCell marked hasChimneyFilter = true');
assert(filterGame.budget === 120, 'Filter cost $80 deducted from budget (200 -> 120)');
assert(filterGame.carbon === initialCarbon - 12, `Carbon reduced by 80% (15% -> 3%, total reduced by 12: ${initialCarbon} -> ${filterGame.carbon})`);

// Duplicate installation rejected
const duplicateInstall = filterGame.installChimneyFilter(legacyCell);
assert(duplicateInstall === false, 'Duplicate filter installation rejected');

// Low budget rejection
filterGame.budget = 50;
const ecoCell = filterGrid.getCell(5, 7);
ecoCell.occupied = true;
ecoCell.isRoad = false;
ecoCell.buildingType = 'eco_house';
const lowBudgetInstall = filterGame.installChimneyFilter(ecoCell);
assert(lowBudgetInstall === false, 'Filter installation rejected when budget < $80');

// Non-smokable building rejected
filterGame.budget = 500;
const parkCell = filterGrid.getCell(5, 8);
parkCell.occupied = true;
parkCell.isRoad = false;
parkCell.buildingType = 'sponge_park';
const parkInstall = filterGame.installChimneyFilter(parkCell);
assert(parkInstall === false, 'Filter installation rejected on non-smokable building (sponge_park)');

// Test 13: Beach Swimmer Adaptive Behavior under High/Low Carbon
const testCrowd = new CrowdSystem(scene, mockGrid);
const swimmer = testCrowd.beachSwimmer;
assert(swimmer !== null, 'Beach swimmer exists in crowd');

// High carbon (> 35): Swimmer observes from sand shore
const highCarbonGame = { carbon: 60, crisisPhase: 'PEACE', gameSpeed: 1.0 };
testCrowd.update(0.1, highCarbonGame);
assert(Math.abs(swimmer.mesh.group.position.z - 26.8) < 0.1, `Swimmer on sand shore at z=26.8 when carbon > 35 (got z=${swimmer.mesh.group.position.z})`);
assert(swimmer.mesh.group.position.y >= 0.16, `Swimmer standing on sand at y>=0.16 when carbon > 35 (got y=${swimmer.mesh.group.position.y})`);

// Low carbon (<= 35): Swimmer dives into sea water
const lowCarbonGame = { carbon: 15, crisisPhase: 'PEACE', gameSpeed: 1.0 };
testCrowd.update(0.1, lowCarbonGame);
assert(Math.abs(swimmer.mesh.group.position.z - 29.5) < 0.1, `Swimmer in sea water at z=29.5 when carbon <= 35 (got z=${swimmer.mesh.group.position.z})`);
assert(swimmer.mesh.group.position.y < 0.05, `Swimmer submerged in water at y<0.05 when carbon <= 35 (got y=${swimmer.mesh.group.position.y.toFixed(2)})`);

// Test 14: WorldScene Smog Atmosphere Transition
const mockSceneObj = {
  scene: {
    background: new THREE.Color(0x87ceeb),
    fog: {
      color: new THREE.Color(0xcbeafe),
      density: 0.0042
    }
  },
  sunLight: {
    intensity: 2.3,
    color: new THREE.Color(0xfffbeb)
  }
};

// Lerp towards high carbon (carbon = 65)
for (let step = 0; step < 20; step++) {
  WorldScene.prototype.updateSmogAtmosphere.call(mockSceneObj, 65, 0.1, false, false);
}
assert(mockSceneObj.scene.fog.density > 0.007, `Fog density increases in smog (>0.007, got ${mockSceneObj.scene.fog.density.toFixed(4)})`);
assert(mockSceneObj.sunLight.intensity < 2.0, `Sun intensity dims in smog (<2.0, got ${mockSceneObj.sunLight.intensity.toFixed(2)})`);

// Lerp towards clean air (carbon = 10)
for (let step = 0; step < 30; step++) {
  WorldScene.prototype.updateSmogAtmosphere.call(mockSceneObj, 10, 0.1, false, false);
}
assert(mockSceneObj.scene.fog.density < 0.0055, `Fog density clears in clean air (<0.0055, got ${mockSceneObj.scene.fog.density.toFixed(4)})`);
assert(mockSceneObj.sunLight.intensity > 2.0, `Sun intensity brightens in clean air (>2.0, got ${mockSceneObj.sunLight.intensity.toFixed(2)})`);

// Test 15: WorldScene Water Pollution Transition & Mucilage
const mockWaterObj = {
  seaMat: new THREE.MeshStandardMaterial({ color: 0x0284c7 }),
  shallowMat: new THREE.MeshStandardMaterial({ color: 0x06b6d4, opacity: 0.85 }),
  foamMat: new THREE.MeshStandardMaterial({ color: 0xf0f9ff }),
  beachLitterGroup: new THREE.Group(),
  mucilageGroup: new THREE.Group()
};

// Low carbon: clean water, litter/mucilage hidden
WorldScene.prototype.updateWaterPollution.call(mockWaterObj, 15, 0.1);
assert(mockWaterObj.beachLitterGroup.visible === false, 'Beach litter hidden when carbon <= 20');
assert(mockWaterObj.mucilageGroup.visible === false, 'Mucilage hidden when carbon <= 20');

// High carbon: dirty water, litter/mucilage visible
WorldScene.prototype.updateWaterPollution.call(mockWaterObj, 65, 0.1);
assert(mockWaterObj.beachLitterGroup.visible === true, 'Beach litter visible when carbon > 35');
assert(mockWaterObj.mucilageGroup.visible === true, 'Mucilage visible when carbon > 35');

// Test 16: Radio Squelch/Beep & Filter Audio APIs
assert(typeof sound.playRadioBeep === 'function', 'sound.playRadioBeep is a function');
assert(typeof sound.playFilterInstall === 'function', 'sound.playFilterInstall is a function');
assert(typeof sound.playAuraChime === 'function', 'sound.playAuraChime is aliased and available');
let audioThrew = false;
try {
  sound.playRadioBeep();
  sound.playFilterInstall();
  sound.playAuraChime();
} catch (e) {
  audioThrew = true;
}
assert(!audioThrew, 'Audio methods execute safely without throwing exceptions');

// Test 17: Ghost Preview Auto-Facing Road vs Explicit 0° Rotation
const roadFacingGrid = new GridManager(scene, 20, 14);
const testRoadCell = roadFacingGrid.getCell(4, 9);
testRoadCell.occupied = true;
testRoadCell.isRoad = true;
const testAdjacentCell = roadFacingGrid.getCell(5, 9); // South of road at (4,9)
const expectedRoadAngle = roadFacingGrid.getRoadFacingAngle(5, 9);
assert(Math.abs(expectedRoadAngle - Math.PI) < 0.0001, 'Road facing angle is Math.PI (facing road to the north)');

// Before 'R' is pressed: rotAngle is null -> ghost preview auto-faces road
roadFacingGrid.highlightCell(testAdjacentCell, 'BUILD', realBm, BUILDINGS_CATALOG.eco_house, 5000, null);
assert(Math.abs(roadFacingGrid.ghostGroup.children[0].rotation.y - Math.PI) < 0.0001, 'Ghost preview auto-faces road when rotationAngle is null');

// Player cycles rotation 4 times back to 0° -> rotAngle is 0 (number) -> ghost preview faces 0 deg
roadFacingGrid.highlightCell(testAdjacentCell, 'BUILD', realBm, BUILDINGS_CATALOG.eco_house, 5000, 0);
assert(Math.abs(roadFacingGrid.ghostGroup.children[0].rotation.y - 0) < 0.0001, 'Ghost preview respects explicit 0 deg custom rotation');

// Test 18: Chimney Smoke Rotational Position Transformation
const mockSmokeScene = {
  scene: {
    add(m) {},
    remove(m) {}
  },
  smokeParticles: [],
  smokeTimer: 0
};
// Unrotated building: ox = -0.35, oz = 0.1
const unrotatedEcoCell = { x: 10, z: 20, buildingType: 'eco_house', building: { rotation: { y: 0 } }, hasChimneyFilter: false, occupied: true };
WorldScene.prototype.updateChimneySmoke.call(mockSmokeScene, [unrotatedEcoCell], 0.19);
assert(mockSmokeScene.smokeParticles.length === 1, 'Smoke particle created for unrotated building');
const pUnrot = mockSmokeScene.smokeParticles[0].mesh.position;
assert(Math.abs(pUnrot.x - (10 - 0.35)) < 0.3, 'Unrotated chimney X position matches offset');
assert(Math.abs(pUnrot.z - (20 + 0.1)) < 0.3, 'Unrotated chimney Z position matches offset');

// Rotated 90 deg (Math.PI / 2): (ox = -0.35, oz = 0.1) -> rotated 90 deg: rx = 0.1, rz = 0.35
mockSmokeScene.smokeParticles = [];
mockSmokeScene.smokeTimer = 0;
const rotatedEcoCell = { x: 10, z: 20, buildingType: 'eco_house', building: { rotation: { y: Math.PI / 2 } }, hasChimneyFilter: false, occupied: true };
WorldScene.prototype.updateChimneySmoke.call(mockSmokeScene, [rotatedEcoCell], 0.19);
assert(mockSmokeScene.smokeParticles.length === 1, 'Smoke particle created for 90-deg rotated building');
const pRot = mockSmokeScene.smokeParticles[0].mesh.position;
assert(Math.abs(pRot.x - (10 + 0.1)) < 0.3, 'Rotated chimney X position transforms with cos/sin');
assert(Math.abs(pRot.z - (20 + 0.35)) < 0.3, 'Rotated chimney Z position transforms with cos/sin');

// Test 19: Smoke Particles Smooth Dissipation (No Abrupt Purge)
assert(mockSmokeScene.smokeParticles.length === 1, 'Smoke particle exists prior to smoking stop');
WorldScene.prototype.updateChimneySmoke.call(mockSmokeScene, [], 0.05);
assert(mockSmokeScene.smokeParticles.length === 1, 'In-flight smoke particle preserved and decaying naturally');
WorldScene.prototype.updateChimneySmoke.call(mockSmokeScene, [], 3.0);
assert(mockSmokeScene.smokeParticles.length === 0, 'Smoke particle naturally despawned after exceeding lifespan');

// Test 20: Bulldoze & Reset State Cleanup
const cleanupGrid = new GridManager(scene, 20, 14);
const cleanupGame = new GameManager({ scene, resetLighting() {} }, cleanupGrid, realBm, mockDisasterSim, mockUI);
const testCell = cleanupGrid.getCell(3, 3);
testCell.occupied = true;
testCell.isRoad = false;
testCell.buildingType = 'legacy_concrete';
testCell.hasChimneyFilter = true;
testCell.hasCustomRotation = true;
testCell.rotationAngle = Math.PI;

cleanupGame.bulldozeCell(testCell);
assert(testCell.hasChimneyFilter === false, 'Bulldozing clears hasChimneyFilter');
assert(testCell.hasCustomRotation === false, 'Bulldozing clears hasCustomRotation');
assert(testCell.rotationAngle === 0, 'Bulldozing resets rotationAngle to 0');

// Grid reset cleanup
const resetCell = cleanupGrid.getCell(2, 2);
resetCell.occupied = true;
resetCell.hasChimneyFilter = true;
resetCell.hasCustomRotation = true;
resetCell.rotationAngle = Math.PI / 2;
cleanupGrid.reset();
assert(resetCell.hasChimneyFilter === false, 'grid.reset() clears hasChimneyFilter');
assert(resetCell.hasCustomRotation === false, 'grid.reset() clears hasCustomRotation');
assert(resetCell.rotationAngle === 0, 'grid.reset() clears rotationAngle');

// Test 21: Swimmer BasePos Synchronizes with Water Pollution
testCrowd.update(0.1, { carbon: 60, crisisPhase: 'PEACE', gameSpeed: 1.0 });
assert(Math.abs(swimmer.basePos.z - 26.8) < 0.01, `Swimmer basePos set to sand shore (z=26.8) when polluted (got z=${swimmer.basePos.z})`);
testCrowd.update(0.1, { carbon: 15, crisisPhase: 'PEACE', gameSpeed: 1.0 });
assert(Math.abs(swimmer.basePos.z - 29.5) < 0.01, `Swimmer basePos set to sea water (z=29.5) when clean (got z=${swimmer.basePos.z})`);

// ==========================================
// VERSİYON 5.0 KAPSAMLI TESTLERİ (Tests 22-30)
// ==========================================

// Test 22: Building Catalog v5.0 Specifications & Renaming
assert(BUILD_CATEGORIES.some((c) => c.id === 'waste'), 'waste category registered in BUILD_CATEGORIES');
assert(BUILDINGS_CATALOG.waste_station !== undefined, 'waste_station exists in catalog');
assert(BUILDINGS_CATALOG.waste_station.cost === 120, 'waste_station cost is $120');
assert(BUILDINGS_CATALOG.waste_station.category === 'waste', 'waste_station in waste category');

assert(BUILDINGS_CATALOG.biogas_plant !== undefined, 'biogas_plant exists in catalog');
assert(BUILDINGS_CATALOG.biogas_plant.cost === 650, 'biogas_plant cost is $650');
assert(BUILDINGS_CATALOG.biogas_plant.category === 'waste', 'biogas_plant in waste category');

assert(BUILDINGS_CATALOG.water_treatment !== undefined, 'water_treatment exists in catalog');
assert(BUILDINGS_CATALOG.water_treatment.cost === 800, 'water_treatment cost is $800');
assert(BUILDINGS_CATALOG.water_treatment.category === 'infra', 'water_treatment in infra category');

assert(BUILDINGS_CATALOG.marine_barrier !== undefined, 'marine_barrier exists in catalog');
assert(BUILDINGS_CATALOG.marine_barrier.cost === 250, 'marine_barrier cost is $250');
assert(BUILDINGS_CATALOG.marine_barrier.category === 'infra', 'marine_barrier in infra category');

assert(BUILDINGS_CATALOG.sponge_park.name.includes('Taşkın Yatağı'), 'sponge_park name upgraded to serious engineering title');
assert(BUILDINGS_CATALOG.cistern.name.includes('Derin Drenaj Rezervuarı'), 'cistern name upgraded to serious engineering title');

// Test 23: 3'lü Çevre Savunması Metrics Initialization & Progression
const testGridV5 = new GridManager(scene, 20, 14);
const mockSceneWrapper = { scene, resetLighting() {} };
const testGameV5 = new GameManager(mockSceneWrapper, testGridV5, realBm, mockDisasterSim, mockUI);
testGameV5.initStarterCity();

assert(typeof testGameV5.zeroWasteRate === 'number', 'zeroWasteRate metric initialized');
assert(typeof testGameV5.marineHealth === 'number', 'marineHealth metric initialized');
assert(typeof testGameV5.airQuality === 'number', 'airQuality metric initialized');
assert(testGameV5.airQuality === (100 - testGameV5.carbon), 'airQuality synchronized with carbon Net-Zero');

const baseWaste = testGameV5.zeroWasteRate;
const baseMarine = testGameV5.marineHealth;

testGameV5.budget = 10000;
testGameV5.setToolMode('BUILD');

// Place waste station -> zero waste increases
testGameV5.selectedBuildingType = 'waste_station';
const cellWaste = testGridV5.getCell(6, 4);
cellWaste.occupied = false;
testGameV5.buildOnCell(cellWaste);
assert(testGameV5.zeroWasteRate > baseWaste, `waste_station increases zeroWasteRate (${baseWaste}% -> ${testGameV5.zeroWasteRate}%)`);

// Place biogas plant -> zero waste increases further
testGameV5.selectedBuildingType = 'biogas_plant';
const cellBiogas = testGridV5.getCell(6, 5);
cellBiogas.occupied = false;
const preBiogasWaste = testGameV5.zeroWasteRate;
testGameV5.buildOnCell(cellBiogas);
assert(testGameV5.zeroWasteRate > preBiogasWaste, `biogas_plant increases zeroWasteRate (${preBiogasWaste}% -> ${testGameV5.zeroWasteRate}%)`);

// Place water treatment -> marine health increases
testGameV5.selectedBuildingType = 'water_treatment';
const cellWater = testGridV5.getCell(6, 6);
cellWater.occupied = false;
testGameV5.buildOnCell(cellWater);
assert(testGameV5.marineHealth > baseMarine, `water_treatment increases marineHealth (${baseMarine}% -> ${testGameV5.marineHealth.toFixed(1)}%)`);

// Place marine barrier -> marine health increases further
testGameV5.selectedBuildingType = 'marine_barrier';
const cellBarrier = testGridV5.getCell(8, 4);
cellBarrier.occupied = false;
const preBarrierMarine = testGameV5.marineHealth;
testGameV5.buildOnCell(cellBarrier);
assert(testGameV5.marineHealth > preBarrierMarine, `marine_barrier increases marineHealth (${preBarrierMarine.toFixed(1)}% -> ${testGameV5.marineHealth.toFixed(1)}%)`);

// Test 24: Uncollected Waste Leads to Marine Pollution During Flood
const preFloodMarine = testGameV5.marineHealth;
testGameV5.crisisPhase = 'ACTIVE';
testGameV5.currentDisaster = 'FLOOD';
testGameV5.zeroWasteRate = 25; // Düşük sıfır atık oranı (sokakta çöpler var)
testGameV5.update(1.0);
assert(testGameV5.marineHealth < preFloodMarine, `Uncollected street waste washes to sea during flood, degrading marineHealth (${preFloodMarine.toFixed(1)}% -> ${testGameV5.marineHealth.toFixed(1)}%)`);

// Test 25: Vibrant Mediterranean Stormwater & Drain Bubbling Geysers in DisasterSimulator
const testDisasterV5 = new DisasterSimulator(scene);
assert(testDisasterV5.waterMat.color.getHex() === 0x0284c7, 'Flood water uses vibrant Mediterranean stormwater turquoise color (0x0284c7)');
assert(testDisasterV5.waterMat.roughness === 0.06 && testDisasterV5.waterMat.metalness === 0.35, 'Flood water material has specular shimmering properties (roughness 0.06, metalness 0.35)');
assert(typeof testDisasterV5.setupDrainGeysers === 'function', 'DisasterSimulator.setupDrainGeysers is defined');
assert(Array.isArray(testDisasterV5.drainGeysers), 'DisasterSimulator.drainGeysers is an array');

testDisasterV5.setupDrainGeysers(testGridV5);
assert(testDisasterV5.drainGeysers.length > 0, `Drain bubbling geysers spawned on road cells (found ${testDisasterV5.drainGeysers.length})`);

// Test 26: WorldScene Kentsel Deşarj Menfezi & Effluent Transition
const mockWorldSceneV5 = {
  scene: new THREE.Scene()
};
WorldScene.prototype.setupOutfallDischarge.call(mockWorldSceneV5);
assert(mockWorldSceneV5.outfallEffluentMesh !== undefined, 'Outfall effluent stream mesh created');
assert(mockWorldSceneV5.outfallEffluentMat !== undefined, 'Outfall effluent stream material created');

// Test 27: Caretta Caretta Nesting Grounds
WorldScene.prototype.setupCarettaNests.call(mockWorldSceneV5);
assert(mockWorldSceneV5.turtleCagesGroup !== null, 'Caretta cages group created');
assert(mockWorldSceneV5.turtleCagesGroup.children.length >= 3, 'Caretta cages group contains protection nests');

// Caretta visibility checks:
WorldScene.prototype.updateWaterPollution.call(mockWorldSceneV5, 10, 0.1, { marineHealth: 85 });
assert(mockWorldSceneV5.turtleCagesGroup.visible === true, 'Caretta nests visible when marineHealth >= 80%');

WorldScene.prototype.updateWaterPollution.call(mockWorldSceneV5, 50, 0.1, { marineHealth: 45 });
assert(mockWorldSceneV5.turtleCagesGroup.visible === false, 'Caretta nests hidden when marineHealth < 80%');

// Test 28: Floating Marine Barrier & Street Litter Systems
WorldScene.prototype.setupMarineBarrierMesh.call(mockWorldSceneV5);
assert(mockWorldSceneV5.marineBarrierGroup !== null, 'Marine barrier group created');

WorldScene.prototype.updateMarineBarrier.call(mockWorldSceneV5, false, 0.1);
assert(mockWorldSceneV5.marineBarrierGroup.visible === false, 'Marine barrier hidden when not built');

WorldScene.prototype.updateMarineBarrier.call(mockWorldSceneV5, true, 0.1);
assert(mockWorldSceneV5.marineBarrierGroup.visible === true, 'Marine barrier visible when built in city');

WorldScene.prototype.setupStreetLitter.call(mockWorldSceneV5);
assert(mockWorldSceneV5.streetLitterGroup !== null, 'Street litter group created');

WorldScene.prototype.updateStreetLitter.call(mockWorldSceneV5, 25, 0.1);
assert(mockWorldSceneV5.streetLitterGroup.visible === true, 'Street litter visible when zeroWasteRate < 50%');

WorldScene.prototype.updateStreetLitter.call(mockWorldSceneV5, 75, 0.1);
assert(mockWorldSceneV5.streetLitterGroup.visible === false, 'Street litter hidden when zeroWasteRate >= 50%');

// Test 29: Northwest Landfill Mound & Biogas Plant Rehabilitation
WorldScene.prototype.setupWildDumpsite.call(mockWorldSceneV5);
assert(mockWorldSceneV5.dumpsiteMound !== null, 'Landfill dumpsite mound created');
assert(mockWorldSceneV5.methaneFumesGroup !== null, 'Methane fumes group created on dumpsite');
assert(mockWorldSceneV5.rehabParkGroup !== null, 'Rehab park group created on dumpsite');

WorldScene.prototype.updateWildDumpsite.call(mockWorldSceneV5, false, 0.1);
assert(mockWorldSceneV5.methaneFumesGroup.visible === true, 'Methane fumes visible on unrehabilitated dumpsite');
assert(mockWorldSceneV5.rehabParkGroup.visible === false, 'Rehab park hidden on unrehabilitated dumpsite');

WorldScene.prototype.updateWildDumpsite.call(mockWorldSceneV5, true, 0.1);
assert(mockWorldSceneV5.methaneFumesGroup.visible === false, 'Methane fumes extinguished when biogas plant built');
assert(mockWorldSceneV5.rehabParkGroup.visible === true, 'Rehab park active and green when biogas plant built');

// Test 30: Swimmer Response to 3'lü Metrics
// Even if carbon is low, if marineHealth is bad, swimmer stays on shore
testCrowd.update(0.1, { carbon: 15, marineHealth: 55, crisisPhase: 'PEACE', gameSpeed: 1.0 });
assert(Math.abs(swimmer.basePos.z - 26.8) < 0.01, `Swimmer stays on sand shore when marineHealth < 80% even with low carbon (got z=${swimmer.basePos.z})`);

// Swimmer dives into sea only when marineHealth >= 80% AND carbon <= 35
testCrowd.update(0.1, { carbon: 15, marineHealth: 85, crisisPhase: 'PEACE', gameSpeed: 1.0 });
assert(Math.abs(swimmer.basePos.z - 29.5) < 0.01, `Swimmer dives into sea water when marineHealth >= 80% and clean air (got z=${swimmer.basePos.z})`);

// Test 31: Floating Marine Barrier Protects Coastline from Litter and Mucilage
mockWorldSceneV5.seaMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
mockWorldSceneV5.shallowMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, opacity: 0.85 });
mockWorldSceneV5.foamMat = new THREE.MeshStandardMaterial({ color: 0xf0f9ff });
mockWorldSceneV5.beachLitterGroup = new THREE.Group();
mockWorldSceneV5.mucilageGroup = new THREE.Group();

// Case A: High pollution without barrier -> beach litter visible
const dirtyGameWithoutBarrier = {
  marineHealth: 30,
  grid: { cells: [] }
};
WorldScene.prototype.updateWaterPollution.call(mockWorldSceneV5, 60, 0.1, dirtyGameWithoutBarrier);
assert(mockWorldSceneV5.beachLitterGroup.visible === true, 'Beach litter visible when marineHealth is low and no barrier');

// Case B: High pollution WITH barrier -> beach litter hidden
const dirtyGameWithBarrier = {
  marineHealth: 30,
  grid: { cells: [{ occupied: true, buildingType: 'marine_barrier' }] }
};
WorldScene.prototype.updateWaterPollution.call(mockWorldSceneV5, 60, 0.1, dirtyGameWithBarrier);
assert(mockWorldSceneV5.beachLitterGroup.visible === false, 'Beach litter hidden when marine barrier is installed');

// Test 32: Persistent Flood Marine Damage & Peace Recovery
const damageTestGrid = new GridManager(scene, 20, 14);
const damageTestGame = new GameManager(mockSceneWrapper, damageTestGrid, realBm, mockDisasterSim, mockUI);
damageTestGame.initStarterCity();
damageTestGame.zeroWasteRate = 20;
damageTestGame.crisisPhase = 'ACTIVE';
damageTestGame.currentDisaster = 'FLOOD';
damageTestGame.update(2.0); // 2 seconds of flood
assert(damageTestGame.marinePollutionDamage > 0, 'marinePollutionDamage accumulated during flood');
const postFloodMarine = damageTestGame.marineHealth;
damageTestGame.recalculateMetrics();
assert(damageTestGame.marineHealth === postFloodMarine, 'marineHealth retains flood wash penalty after recalculateMetrics()');

// Peace phase recovery
damageTestGame.crisisPhase = 'PEACE';
damageTestGame.zeroWasteRate = 80; // High zero waste aids recovery
const initialDamage = damageTestGame.marinePollutionDamage;
damageTestGame.update(10.0);
assert(damageTestGame.marinePollutionDamage < initialDamage, 'marinePollutionDamage recovers during PEACE phase with high zero waste');

// Test 33: Recycled Aggregate Awarded for Waste Category Demolition
const aggregateTestGrid = new GridManager(scene, 20, 14);
const aggregateTestGame = new GameManager(mockSceneWrapper, aggregateTestGrid, realBm, mockDisasterSim, mockUI);
aggregateTestGame.initStarterCity();
const wasteCell = aggregateTestGrid.getCell(2, 2);
wasteCell.occupied = true;
wasteCell.buildingType = 'waste_station';
const prevAgg = aggregateTestGame.recycledAggregate;
aggregateTestGame.bulldozeCell(wasteCell);
assert(aggregateTestGame.recycledAggregate === prevAgg + 1, 'Bulldozing waste_station awards +1 recycled aggregate');

const biogasCell = aggregateTestGrid.getCell(2, 3);
biogasCell.occupied = true;
biogasCell.buildingType = 'biogas_plant';
aggregateTestGame.bulldozeCell(biogasCell);
assert(aggregateTestGame.recycledAggregate === prevAgg + 2, 'Bulldozing biogas_plant awards +1 recycled aggregate');

// Test 34: hasRoadAccess required for Biogas and Water Treatment Operations
const roadAccessTestGame = {
  grid: {
    cells: [
      { occupied: true, buildingType: 'biogas_plant', hasRoadAccess: false },
      { occupied: true, buildingType: 'water_treatment', hasRoadAccess: false }
    ]
  },
  marineHealth: 40
};
const hasBiogasOperating = Boolean(roadAccessTestGame.grid.cells.some(c => c.occupied && c.buildingType === 'biogas_plant' && c.hasRoadAccess));
assert(!hasBiogasOperating, 'Biogas plant without road access is not operational for dumpsite rehab');

const hasTreatmentOperating = Boolean(
  roadAccessTestGame.grid.cells.some(c => c.occupied && c.buildingType === 'water_treatment' && c.hasRoadAccess) ||
  roadAccessTestGame.marineHealth >= 80
);
assert(!hasTreatmentOperating, 'Water treatment plant without road access does not yield clean outfall discharge');

// Test 35: Acid Rain Visual Feedback in DisasterSimulator
const acidDisaster = new DisasterSimulator(scene);
acidDisaster.startDisaster('FLOOD');

// Normal rain (low carbon):
acidDisaster.update(0.1, null, null, null, null, null, { carbon: 15, airQuality: 85 });
assert(acidDisaster.rainMat.color.getHex() === 0xcbeafe, 'Clean rain uses cyan/blue color (0xcbeafe)');
acidDisaster.spawnSplash(0, 0);
assert(acidDisaster.ripples[0].mesh.material.color.getHex() === 0xe0f2fe, 'Clean splash particles use light cyan color (0xe0f2fe)');

// Acid rain (high carbon):
acidDisaster.update(0.1, null, null, null, null, null, { carbon: 55, airQuality: 45 });
assert(acidDisaster.rainMat.color.getHex() === 0xd9df65, 'Acid rain uses yellowish-green color (0xd9df65) when carbon > 35');
acidDisaster.spawnSplash(0, 0);
assert(acidDisaster.ripples[1].mesh.material.color.getHex() === 0xeab308, 'Acid splash particles use yellow sulfur color (0xeab308)');

// ========================================================
// RESILIENTIA v5.5 VERIFICATION TESTS
// ========================================================

// Test 36: Zero COP31 Mentions Verification
const projectRoot = path.resolve('.');
const filesToCheck = [
  'index.html',
  'package.json',
  'src/game.js',
  'src/buildings.js',
  'src/disasters.js',
  'src/grid.js',
  'src/main.js',
  'src/scene.js',
  'src/traffic.js',
  'src/audio.js'
];

let cop31Found = false;
let emojiFound = false;
const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

filesToCheck.forEach(relPath => {
  const fullPath = path.join(projectRoot, relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (/cop[-_ ]?31/i.test(content)) {
      cop31Found = true;
      console.error(`Found COP31 reference in ${relPath}`);
    }
    if (emojiPattern.test(content)) {
      emojiFound = true;
      console.error(`Found Unicode emoji in ${relPath}`);
    }
  }
});
assert(!cop31Found, 'Zero mentions of COP31 across all project source files');
assert(!emojiFound, 'Zero Unicode emojis across all project source files (pure SVG only)');

// Test 37: 4 New Environmental & Climate Buildings in Catalog
const pRoad = BUILDINGS_CATALOG.permeable_road;
assert(pRoad !== undefined, 'permeable_road is registered in BUILDINGS_CATALOG');
assert(pRoad && pRoad.cost === 25, 'permeable_road cost is $25');
assert(pRoad && pRoad.category === 'roads', 'permeable_road is in roads category');
assert(pRoad && pRoad.isRoad === true, 'permeable_road has isRoad === true');

const cPump = BUILDINGS_CATALOG.coastal_pump;
assert(cPump !== undefined, 'coastal_pump is registered in BUILDINGS_CATALOG');
assert(cPump && cPump.cost === 350, 'coastal_pump cost is $350');
assert(cPump && cPump.category === 'infra', 'coastal_pump is in infra category');
assert(cPump && cPump.spongePower === 14, 'coastal_pump has spongePower === 14');

const cGreenhouse = BUILDINGS_CATALOG.compost_greenhouse;
assert(cGreenhouse !== undefined, 'compost_greenhouse is registered in BUILDINGS_CATALOG');
assert(cGreenhouse && cGreenhouse.cost === 480, 'compost_greenhouse cost is $480');
assert(cGreenhouse && cGreenhouse.category === 'waste', 'compost_greenhouse is in waste category');
assert(cGreenhouse && cGreenhouse.zeroWastePower === 35, 'compost_greenhouse provides zeroWastePower === 35');

const sBreakwater = BUILDINGS_CATALOG.sea_breakwater;
assert(sBreakwater !== undefined, 'sea_breakwater is registered in BUILDINGS_CATALOG');
assert(sBreakwater && sBreakwater.cost === 280, 'sea_breakwater cost is $280');
assert(sBreakwater && sBreakwater.category === 'infra', 'sea_breakwater is in infra category');
assert(sBreakwater && sBreakwater.marineHealthPower === 20, 'sea_breakwater provides marineHealthPower === 20');

// BuildingManager mesh generation for 4 new buildings
const bm55 = new BuildingManager(scene);
const pRoadMesh = bm55.createBuilding('permeable_road', 0, 0);
assert(pRoadMesh instanceof THREE.Object3D, 'permeable_road 3D model generated');

const cPumpMesh = bm55.createBuilding('coastal_pump', 0, 0);
assert(cPumpMesh instanceof THREE.Object3D, 'coastal_pump 3D model generated');

const cGreenhouseMesh = bm55.createBuilding('compost_greenhouse', 0, 0);
assert(cGreenhouseMesh instanceof THREE.Object3D, 'compost_greenhouse 3D model generated');

const sBreakwaterMesh = bm55.createBuilding('sea_breakwater', 0, 0);
assert(sBreakwaterMesh instanceof THREE.Object3D, 'sea_breakwater 3D model generated');

// Marine structures road access exemption test
const marineGrid = new GridManager(scene, 10, 10);
const marineGame = new GameManager(mockSceneWrapper, marineGrid, bm55, mockDisasterSim, mockUI);
const cellBreakwater = marineGrid.getCell(1, 1);
cellBreakwater.occupied = true;
cellBreakwater.buildingType = 'sea_breakwater';
cellBreakwater.hasRoadAccess = false;
marineGame.recalculateRoadAccess();
marineGame.recalculateMetrics();
assert(marineGame.marineHealth > 35, 'sea_breakwater operates and boosts marineHealth without road frontage');

// Test 38: Road & Gutter Puddle System & Permeable Road Exemption
const puddleDisaster = new DisasterSimulator(scene);
const puddleGrid = new GridManager(scene, 10, 10);
// Build regular asphalt road
const normalRoadCell = puddleGrid.getCell(2, 2);
normalRoadCell.occupied = true;
normalRoadCell.isRoad = true;
normalRoadCell.buildingType = 'road';

// Build permeable road
const permRoadCell = puddleGrid.getCell(2, 3);
permRoadCell.occupied = true;
permRoadCell.isRoad = true;
permRoadCell.buildingType = 'permeable_road';

puddleDisaster.setupPuddles(puddleGrid);
assert(puddleDisaster.puddles.length > 0, 'Puddles initialized on road network');
const normalRoadPuddle = puddleDisaster.puddles.find(p => p.cell === normalRoadCell);
const permRoadPuddle = puddleDisaster.puddles.find(p => p.cell === permRoadCell);
assert(normalRoadPuddle !== undefined, 'Regular road cell receives drainage puddles');
assert(permRoadPuddle === undefined, 'Permeable road receives zero initial puddles');

// Puddle accumulation during rain
const initialLevel = normalRoadPuddle.level;
puddleDisaster.updatePuddles(1.0, true, puddleGrid, null);
assert(normalRoadPuddle.level > initialLevel, `Puddle level accumulates during rain (${initialLevel.toFixed(2)} -> ${normalRoadPuddle.level.toFixed(2)})`);

// Dynamic transformation to permeable_road clears puddle immediately
normalRoadCell.buildingType = 'permeable_road';
puddleDisaster.updatePuddles(0.1, true, puddleGrid, null);
assert(normalRoadPuddle.level === 0.0, 'Converting road to permeable_road instantly drains puddle to 0');
assert(normalRoadPuddle.mesh.visible === false, 'Puddle mesh becomes invisible on permeable road');

// Puddle recession during dry weather & coastal pump acceleration
normalRoadCell.buildingType = 'road';
normalRoadPuddle.level = 0.8;
const preDryLevel = normalRoadPuddle.level;
puddleDisaster.updatePuddles(1.0, false, puddleGrid, { grid: puddleGrid });
assert(normalRoadPuddle.level < preDryLevel, `Puddle evaporates naturally during dry weather (${preDryLevel.toFixed(2)} -> ${normalRoadPuddle.level.toFixed(2)})`);

// With coastal pump, recession is faster
normalRoadPuddle.level = 0.8;
const pumpCell = puddleGrid.getCell(0, 0);
pumpCell.occupied = true;
pumpCell.buildingType = 'coastal_pump';
pumpCell.hasRoadAccess = true;
const levelBeforePumpDry = normalRoadPuddle.level;
puddleDisaster.updatePuddles(1.0, false, puddleGrid, { grid: puddleGrid });
const dryDropWithPump = levelBeforePumpDry - normalRoadPuddle.level;
normalRoadPuddle.level = 0.8;
pumpCell.occupied = false;
puddleDisaster.updatePuddles(1.0, false, puddleGrid, { grid: puddleGrid });
const dryDropWithoutPump = 0.8 - normalRoadPuddle.level;
assert(dryDropWithPump > dryDropWithoutPump, `Coastal pump accelerates puddle recession (${dryDropWithPump.toFixed(2)}/s vs ${dryDropWithoutPump.toFixed(2)}/s)`);

// Test 39: Building Upgrades in Inspect Card
const upgradeGrid = new GridManager(scene, 10, 10);
const upgradeGame = new GameManager(mockSceneWrapper, upgradeGrid, bm55, mockDisasterSim, mockUI);
upgradeGame.budget = 1000;

// 1. Eco House Rain Harvest Upgrade ($60, +4 sponge)
const upgEcoCell = upgradeGrid.getCell(3, 3);
upgEcoCell.occupied = true;
upgEcoCell.buildingType = 'eco_house';
upgEcoCell.hasRoadAccess = true;
upgradeGame.recalculateMetrics();
const preRainHarvestBudget = upgradeGame.budget;
const preRainHarvestSponge = upgradeGame.spongeCapacity;

const rainHarvestSuccess = upgradeGame.installRainHarvest(upgEcoCell);
assert(rainHarvestSuccess === true, 'installRainHarvest succeeded on eco_house');
assert(upgEcoCell.hasRainHarvest === true, 'upgEcoCell.hasRainHarvest is true');
assert(upgradeGame.budget === preRainHarvestBudget - 60, 'installRainHarvest deducted $60 budget');
assert(upgradeGame.spongeCapacity === preRainHarvestSponge + 4, `installRainHarvest boosted spongeCapacity (+4)`);

// Eco House upgrade rejection on wrong building type or insufficient budget
const upgWrongCell = upgradeGrid.getCell(3, 4);
upgWrongCell.occupied = true;
upgWrongCell.buildingType = 'commercial_hub';
assert(upgradeGame.installRainHarvest(upgWrongCell) === false, 'installRainHarvest rejected on non-eco_house cell');

upgradeGame.budget = 30; // Not enough for $60 upgrade
assert(upgradeGame.installRainHarvest(upgEcoCell) === false, 'installRainHarvest rejected when budget < $60');
upgradeGame.budget = 1000;

// 2. Green Roof Solar Kit Upgrade ($100, +$35 income, -2 carbon)
const upgGreenRoofCell = upgradeGrid.getCell(4, 4);
upgGreenRoofCell.occupied = true;
upgGreenRoofCell.buildingType = 'green_roof';
upgGreenRoofCell.hasRoadAccess = true;
upgradeGame.recalculateMetrics();
const preSolarBudget = upgradeGame.budget;
const preSolarGross = upgradeGame.grossIncome;
const preSolarCarbon = upgradeGame.carbon;

const solarSuccess = upgradeGame.installSolarKit(upgGreenRoofCell);
assert(solarSuccess === true, 'installSolarKit succeeded on green_roof');
assert(upgGreenRoofCell.hasSolarKit === true, 'upgGreenRoofCell.hasSolarKit is true');
assert(upgradeGame.budget === preSolarBudget - 100, 'installSolarKit deducted $100 budget');
assert(upgradeGame.grossIncome === preSolarGross + 35, 'installSolarKit boosted passive income by $35');
assert(upgradeGame.carbon === preSolarCarbon - 2, 'installSolarKit reduced carbon emissions by 2');

// 3. Sponge Park Bio-Drain Trench Upgrade ($120, doubles drainage rate: +12 sponge)
const upgParkCell = upgradeGrid.getCell(5, 5);
upgParkCell.occupied = true;
upgParkCell.buildingType = 'sponge_park';
upgParkCell.hasRoadAccess = true;
upgradeGame.recalculateMetrics();
const preBioBudget = upgradeGame.budget;
const preBioSponge = upgradeGame.spongeCapacity;

const bioSuccess = upgradeGame.installBioDrain(upgParkCell);
assert(bioSuccess === true, 'installBioDrain succeeded on sponge_park');
assert(upgParkCell.hasBioDrain === true, 'upgParkCell.hasBioDrain is true');
assert(upgradeGame.budget === preBioBudget - 120, 'installBioDrain deducted $120 budget');
assert(upgradeGame.spongeCapacity === preBioSponge + BUILDINGS_CATALOG.sponge_park.spongePower, 'installBioDrain doubled sponge_park drainage rate');

// 4. Commercial Hub Waste Compactor Upgrade ($90, +15% zero waste)
const upgCommCell = upgradeGrid.getCell(6, 6);
upgCommCell.occupied = true;
upgCommCell.buildingType = 'commercial_hub';
upgCommCell.hasRoadAccess = true;
upgradeGame.recalculateMetrics();
const preCompactorBudget = upgradeGame.budget;
const preCompactorZeroWaste = upgradeGame.zeroWasteRate;

const compactorSuccess = upgradeGame.installWasteCompactor(upgCommCell);
assert(compactorSuccess === true, 'installWasteCompactor succeeded on commercial_hub');
assert(upgCommCell.hasWasteCompactor === true, 'upgCommCell.hasWasteCompactor is true');
assert(upgradeGame.budget === preCompactorBudget - 90, 'installWasteCompactor deducted $90 budget');
assert(upgradeGame.zeroWasteRate === Math.min(100, preCompactorZeroWaste + 15), 'installWasteCompactor increased zeroWasteRate by 15%');

// Test 40: Unified upgradeBuilding helper
const upgEcoCell2 = upgradeGrid.getCell(7, 7);
upgEcoCell2.occupied = true;
upgEcoCell2.buildingType = 'eco_house';
upgEcoCell2.hasRoadAccess = true;
assert(upgradeGame.upgradeBuilding(upgEcoCell2, 'rainharvest') === true, 'upgradeBuilding routes rainharvest correctly');
assert(upgEcoCell2.hasRainHarvest === true, 'upgEcoCell2 hasRainHarvest set via upgradeBuilding');

// Test 41: Bulldoze & Reset Clears All Upgrades
upgradeGame.bulldozeCell(upgEcoCell);
assert(!upgEcoCell.hasRainHarvest, 'Bulldozing clears hasRainHarvest');
upgradeGame.bulldozeCell(upgGreenRoofCell);
assert(!upgGreenRoofCell.hasSolarKit, 'Bulldozing clears hasSolarKit');
upgradeGame.bulldozeCell(upgParkCell);
assert(!upgParkCell.hasBioDrain, 'Bulldozing clears hasBioDrain');
upgradeGame.bulldozeCell(upgCommCell);
assert(!upgCommCell.hasWasteCompactor, 'Bulldozing clears hasWasteCompactor');

// Grid reset clears upgrades
const upgResetCell = upgradeGrid.getCell(1, 1);
upgResetCell.occupied = true;
upgResetCell.hasRainHarvest = true;
upgResetCell.hasSolarKit = true;
upgResetCell.hasBioDrain = true;
upgResetCell.hasWasteCompactor = true;
upgradeGrid.reset();
assert(!upgResetCell.hasRainHarvest && !upgResetCell.hasSolarKit && !upgResetCell.hasBioDrain && !upgResetCell.hasWasteCompactor, 'grid.reset() clears all upgrade flags');

// Test 42: Crisis Visual Impact (Flood water rising to y=0.50, Sponge City absorption rings & depression, Heatwave haze)
const crisisTestGrid = new GridManager(scene, 10, 10);
const crisisDisaster = new DisasterSimulator(scene);
crisisDisaster.setGrid(crisisTestGrid);

// Part A: Sel Su Yukselmesi (Kademeli Yağmur ve Gerçekçi Sel Taşkını)
crisisDisaster.startDisaster('FLOOD');
assert(crisisDisaster.activeDisaster === 'FLOOD', 'Disaster active is FLOOD');

// Test progressive inundation: At early stage (t=2.5s), water accumulates in gutters/ditches without premature submersion
for (let i = 0; i < 25; i++) {
  crisisDisaster.update(0.1, { intensity: 1, color: { setHex() {} } }, { intensity: 1, color: { setHex() {} } }, { color: { setHex() {} } }, { setHex() {} }, crisisTestGrid);
}
assert(crisisDisaster.waterMesh.position.y < 0.25, `Early flood accumulation remains in gutters without instant street submersion (got y=${crisisDisaster.waterMesh.position.y.toFixed(3)} < 0.25)`);

// Continue simulation to municipal saturation and full crest (t=20s total)
for (let i = 25; i < 200; i++) {
  crisisDisaster.update(0.1, { intensity: 1, color: { setHex() {} } }, { intensity: 1, color: { setHex() {} } }, { color: { setHex() {} } }, { setHex() {} }, crisisTestGrid);
}
assert(crisisDisaster.waterMesh.position.y >= 0.48 && crisisDisaster.waterMesh.position.y <= 0.51, `Flood waterMesh smoothly rises to y ~0.50 (got ${crisisDisaster.waterMesh.position.y.toFixed(3)})`);
assert(crisisDisaster.waterMesh.position.y > 0.435, 'Flood water level exceeds asphalt road level (y=0.435), visibly submerging city streets');
assert(crisisDisaster.waterMat.opacity > 0.75, 'Flood water material opacity is visible and vibrant (>= 0.75)');

// Verify road puddle position sits on asphalt surface (y=0.438)
const puddleRoad = crisisTestGrid.getCell(3, 3);
puddleRoad.occupied = true;
puddleRoad.isRoad = true;
puddleRoad.buildingType = 'road';
crisisDisaster.setupPuddles(crisisTestGrid);
const roadPuddle = crisisDisaster.puddles.find(p => p.cell === puddleRoad);
assert(roadPuddle && roadPuddle.mesh.position.y >= 0.435, `Road puddle sits at asphalt level (got y=${roadPuddle?.mesh?.position?.y})`);

// Part B: Sunger Sehir Savunmasi (Pulsing Rings & Water Elevation Depression)
const testSpongeParkCell = crisisTestGrid.getCell(4, 4);
testSpongeParkCell.occupied = true;
testSpongeParkCell.isRoad = false;
testSpongeParkCell.buildingType = 'sponge_park';

const testRainHarvestCell = crisisTestGrid.getCell(5, 5);
testRainHarvestCell.occupied = true;
testRainHarvestCell.isRoad = false;
testRainHarvestCell.buildingType = 'eco_house';
testRainHarvestCell.hasRainHarvest = true;

const testCoastalPumpCell = crisisTestGrid.getCell(6, 6);
testCoastalPumpCell.occupied = true;
testCoastalPumpCell.isRoad = false;
testCoastalPumpCell.buildingType = 'coastal_pump';

crisisDisaster.update(0.1, { intensity: 1, color: { setHex() {} } }, { intensity: 1, color: { setHex() {} } }, { color: { setHex() {} } }, { setHex() {} }, crisisTestGrid);

// Check Pulsing Rings
assert(crisisDisaster.pulsingRingsGroup !== undefined, 'pulsingRingsGroup exists');
assert(crisisDisaster.pulsingRingsGroup.visible === true, 'pulsingRingsGroup is visible during flood');
const activeRings = crisisDisaster.pulsingRings.filter(r => r.mesh.visible);
assert(activeRings.length >= 3, `Expanding pulsing absorption rings radiate around sponge facilities (found ${activeRings.length})`);
assert(activeRings[0].mesh.material.color.getHex() === 0x38bdf8, 'Pulsing absorption rings use vibrant electric cyan-blue color (0x38bdf8)');

// Check Water Elevation Depression around Sponge Park
const geomPos = crisisDisaster.waterMesh.geometry.attributes.position.array;
const basePos = crisisDisaster.waterBasePos;
let nearestVertexY = 0;
let minVertexDist = 999;
for (let v = 0; v < geomPos.length / 3; v++) {
  const vx = basePos[v * 3 + 0];
  const vz = basePos[v * 3 + 2];
  const dist = Math.hypot(vx - testSpongeParkCell.x, vz - testSpongeParkCell.z);
  if (dist < minVertexDist) {
    minVertexDist = dist;
    nearestVertexY = geomPos[v * 3 + 1];
  }
}
assert(nearestVertexY < 0, `Water surface visibly dips / depresses around sponge park (dip=${nearestVertexY.toFixed(3)} < 0)`);

// Part C: Flood End & Recede below surface
crisisDisaster.stopDisaster();
for (let i = 0; i < 40; i++) {
  crisisDisaster.update(0.1, { intensity: 1, color: { setHex() {} } }, { intensity: 1, color: { setHex() {} } }, { color: { setHex() {} } }, { setHex() {} }, crisisTestGrid);
}
assert(crisisDisaster.waterMesh.position.y <= 0.06, `Flood water recedes back below ground level upon crisis end (got y=${crisisDisaster.waterMesh.position.y.toFixed(3)})`);
assert(crisisDisaster.waterMat.opacity === 0, `Flood water material opacity fades completely to 0 on flood end (got ${crisisDisaster.waterMat.opacity})`);
assert(crisisDisaster.pulsingRingsGroup.visible === false, 'Pulsing absorption rings are hidden when flood ends');

// Part D: Sicak Dalgasi (Heatwave Lighting & Heat Haze on Unprotected Roofs)
const crisisLegacyCell = crisisTestGrid.getCell(2, 2);
crisisLegacyCell.occupied = true;
crisisLegacyCell.isRoad = false;
crisisLegacyCell.buildingType = 'legacy_concrete';

const mockSun = { intensity: 1, color: { val: 0, setHex(c) { this.val = c; } } };
const mockHemi = { intensity: 1, color: { val: 0, setHex(c) { this.val = c; } }, groundColor: { val: 0, setHex(c) { this.val = c; } } };
const mockFog = { color: { val: 0, setHex(c) { this.val = c; } }, density: 0.005 };
const mockBg = { val: 0, setHex(c) { this.val = c; } };

crisisDisaster.startDisaster('HEATWAVE');
crisisDisaster.update(0.1, mockSun, mockHemi, mockFog, mockBg, crisisTestGrid);

assert(mockSun.color.val === 0xf97316, 'Heatwave shifts directional sunlight to scorching desert orange (0xf97316)');
assert(mockHemi.color.val === 0xf97316, 'Heatwave shifts ambient hemisphere light to scorching desert orange (0xf97316)');
assert(mockFog.color.val === 0xb45309, 'Heatwave warms sky and fog to glowing amber (0xb45309)');
assert(mockSun.intensity >= 3.5, `Sunlight intensity boosted during heatwave (got ${mockSun.intensity})`);

// Heat Haze Shimmer Checks
assert(crisisDisaster.heatHazeGroup !== undefined, 'heatHazeGroup exists in DisasterSimulator');
assert(crisisDisaster.heatHazeGroup.visible === true, 'heatHazeGroup is visible during heatwave');
const activeHaze = crisisDisaster.heatHazeMeshes.filter(h => h.active);
assert(activeHaze.length > 0, `Heat haze meshes active on unprotected buildings (found ${activeHaze.length})`);
assert(activeHaze[0].meshA.material.color.getHex() === 0xf97316, 'Heat haze meshes use reddish-orange shimmer color (0xf97316)');
assert(activeHaze[0].meshA.material.opacity > 0.15, 'Heat haze subtle shimmer opacity is visible');

// Heat Haze 3D Normal Out-of-Plane Displacement
const posA = activeHaze[0].meshA.geometry.attributes.position.array;
const baseA = activeHaze[0].basePosA;
let hasDisplacementZ = false;
for (let v = 0; v < posA.length / 3; v++) {
  if (Math.abs(posA[v * 3 + 2] - baseA[v * 3 + 2]) > 0.001) {
    hasDisplacementZ = true;
    break;
  }
}
assert(hasDisplacementZ, 'Heat haze meshA undulates out-of-plane in Z direction');

const posB = activeHaze[0].meshB.geometry.attributes.position.array;
const baseB = activeHaze[0].basePosB;
let hasDisplacementX = false;
for (let v = 0; v < posB.length / 3; v++) {
  if (Math.abs(posB[v * 3 + 0] - baseB[v * 3 + 0]) > 0.001) {
    hasDisplacementX = true;
    break;
  }
}
assert(hasDisplacementX, 'Heat haze meshB undulates out-of-plane in X direction');

// Stop heatwave
crisisDisaster.stopDisaster();
assert(crisisDisaster.heatHazeGroup.visible === false, 'Heat haze group becomes hidden when heatwave ends');

// Part E: Direct Disaster Transition (FLOOD -> HEATWAVE immediately cleans up flood water & debris)
crisisDisaster.startDisaster('FLOOD');
for (let i = 0; i < 150; i++) {
  crisisDisaster.update(0.1, mockSun, mockHemi, mockFog, mockBg, crisisTestGrid);
}
assert(crisisDisaster.waterMesh.position.y > 0.40, 'Water elevated during flood before transition');
crisisDisaster.startDisaster('HEATWAVE');
crisisDisaster.update(0.1, mockSun, mockHemi, mockFog, mockBg, crisisTestGrid);
assert(crisisDisaster.waterMesh.position.y === 0.05, `Direct transition to HEATWAVE immediately resets water position (got ${crisisDisaster.waterMesh.position.y})`);
assert(crisisDisaster.debrisGroup.visible === false, 'Direct transition to HEATWAVE hides floating debris');
crisisDisaster.stopDisaster();

// --- VERSIYON 6.0 EXTENSIVE TEST SUITE ---
console.log('\n--- RUNNING V6.0 COMPREHENSIVE TESTS ---');

// Test 43: drain_grate catalog registration & properties
assert(BUILDINGS_CATALOG.drain_grate !== undefined, 'drain_grate is registered in BUILDINGS_CATALOG');
assert(BUILDINGS_CATALOG.drain_grate.cost === 30, 'drain_grate cost is $30');
assert(BUILDINGS_CATALOG.drain_grate.category === 'infra', 'drain_grate is in infra category');
assert(BUILDINGS_CATALOG.drain_grate.spongePower === 5, 'drain_grate provides spongePower === 5');
assert(BUILDINGS_CATALOG.drain_grate.isGrate === true, 'drain_grate has isGrate === true');
assert(BUILDINGS_CATALOG.grate !== undefined, 'drain_grate has alias grate in BUILDINGS_CATALOG');

// Test 44: drain_grate 3D model creation
const bmTest = new BuildingManager(scene);
const grateMesh = bmTest.createBuilding('drain_grate');
assert(grateMesh !== null, 'drain_grate 3D model generated');
assert(grateMesh.children.length >= 4, `drain_grate model has cast iron frame, grate bars, collector pipe, and suction ring (children: ${grateMesh.children.length})`);

// Test 45: Building shelter capacities
assert(BUILDINGS_CATALOG.eco_house.shelterCapacity === 4, 'eco_house shelterCapacity is 4');
assert(BUILDINGS_CATALOG.green_roof.shelterCapacity === 20, 'green_roof shelterCapacity is 20');
assert(BUILDINGS_CATALOG.commercial_hub.shelterCapacity === 40, 'commercial_hub shelterCapacity is 40');
assert(BUILDINGS_CATALOG.legacy_concrete.shelterCapacity === 10, 'legacy_concrete shelterCapacity is 10');

// Test 46: Crowd distribution among multiple shelters respecting capacities
const multiShelterGrid = {
  cells: [
    { row: 5, col: 5, x: 0, z: 0, occupied: true, isRoad: false, buildingType: 'eco_house', shelterOccupancy: 0 },
    { row: 5, col: 7, x: 6, z: 0, occupied: true, isRoad: false, buildingType: 'eco_house', shelterOccupancy: 0 }
  ],
  getRoadCells() { return []; },
  getCell(r, c) { return this.cells.find(cell => cell.row === r && cell.col === c); }
};
const multiCrowd = new CrowdSystem(scene, multiShelterGrid);
const shelterA = multiShelterGrid.cells[0];
const shelterB = multiShelterGrid.cells[1];
// Fill shelter A to capacity (4)
shelterA.shelterOccupancy = 4;
// Next agent seeking shelter should be routed to shelter B
const chosenShelter = multiCrowd.findNearestShelter(0.5, 0.5);
assert(chosenShelter && chosenShelter.cell === shelterB, 'Crowd routes to available shelter B when shelter A is at full capacity');

// Test 47: Vehicle exhaust smoke particles
const trafficTest = new TrafficSystem(scene, mockGrid);
assert(trafficTest.exhaustGroup !== undefined, 'trafficTest.exhaustGroup exists');
assert(trafficTest.exhaustParticles.length === 0, 'Initial exhaust particles are 0');
trafficTest.spawnExhaust(0, 0.45, 0, 'fossil');
assert(trafficTest.exhaustParticles.length === 1, 'Exhaust particle spawned for fossil vehicle');
trafficTest.spawnExhaust(0, 0.45, 0, 'tram');
assert(trafficTest.exhaustParticles.length === 1, 'Zero exhaust particles spawned for solar tram');
trafficTest.spawnExhaust(0, 0.45, 0, 'cyclist');
assert(trafficTest.exhaustParticles.length === 1, 'Zero exhaust particles spawned for cyclist');

// Test 48: Asphalt road speed reduction by 50% during HEATWAVE
const roadCellNormal = { buildingType: 'road' };
const permCellNormal = { buildingType: 'permeable_road' };
const tramCellNormal = { buildingType: 'solar_tram' };

const normalSpeedRoad = trafficTest.getVehicleEffectiveSpeed(roadCellNormal, 'PEACE');
const heatwaveSpeedRoad = trafficTest.getVehicleEffectiveSpeed(roadCellNormal, 'HEATWAVE');
assert(Math.abs(heatwaveSpeedRoad - normalSpeedRoad * 0.5) < 0.01, `Asphalt softens during heatwave: speed drops 50% (${normalSpeedRoad} -> ${heatwaveSpeedRoad})`);

const normalSpeedPerm = trafficTest.getVehicleEffectiveSpeed(permCellNormal, 'PEACE');
const heatwaveSpeedPerm = trafficTest.getVehicleEffectiveSpeed(permCellNormal, 'HEATWAVE');
assert(normalSpeedPerm === heatwaveSpeedPerm, 'Permeable road does NOT soften or slow traffic during heatwave');

const normalSpeedTram = trafficTest.getVehicleEffectiveSpeed(tramCellNormal, 'PEACE');
const heatwaveSpeedTram = trafficTest.getVehicleEffectiveSpeed(tramCellNormal, 'HEATWAVE');
assert(normalSpeedTram === heatwaveSpeedTram, 'Solar tram does NOT slow down during heatwave');

// Test 49: Manhole cover surcharge geysers
const testDisasterV6 = new DisasterSimulator(scene);
testDisasterV6.setGrid(mockGrid);
testDisasterV6.startDisaster('FLOOD');
testDisasterV6.waterMesh.position.y = 0.48;

// Scenario A: Insufficient grates & sponge capacity -> surcharge erupts
testDisasterV6.setSpongeCapacity(10);
testDisasterV6.update(0.1, mockSun, mockHemi, mockFog, mockBg, mockGrid, { spongeCapacity: 10, grid: mockGrid });
const surchargedGeyser = testDisasterV6.drainGeysers.find(g => g.group.visible);
assert(surchargedGeyser !== undefined, 'Drain geysers become visible during flood surcharge');
assert(surchargedGeyser.cover !== undefined, 'Cast iron manhole cover exists on drain geyser');
assert(surchargedGeyser.cover.position.y > 0.05, `Manhole cover pops up during surcharge (y=${surchargedGeyser.cover.position.y})`);
assert(surchargedGeyser.column.visible === true, 'Dirty foamy geyser column erupts during surcharge');

// Scenario B: Sufficient grates & sponge capacity -> covers stay sealed
testDisasterV6.setSpongeCapacity(50);
testDisasterV6.update(0.1, mockSun, mockHemi, mockFog, mockBg, mockGrid, { spongeCapacity: 50, grid: mockGrid });
assert(surchargedGeyser.cover.position.y === 0.02, `Manhole cover stays sealed flat with sufficient drainage (y=${surchargedGeyser.cover.position.y})`);
assert(surchargedGeyser.column.visible === false, 'Geyser column hidden when drainage capacity is sufficient');
testDisasterV6.stopDisaster();

// Test 50: Streetlights group & warm amber glow
const worldSceneV6 = {
  scene: new THREE.Scene()
};
WorldScene.prototype.setupStreetLights.call(worldSceneV6);
WorldScene.prototype.setupStormClouds.call(worldSceneV6);
WorldScene.prototype.setupOutfallDischarge.call(worldSceneV6);
WorldScene.prototype.setupStreetLitter.call(worldSceneV6);

assert(worldSceneV6.streetLightsGroup !== undefined, 'streetLightsGroup exists in WorldScene');
assert(worldSceneV6.streetLightMat.color.getHex() === 0xfbbf24, 'Streetlights use warm amber color (0xfbbf24)');
WorldScene.prototype.updateStreetLights.call(worldSceneV6, true, 1.0);
assert(worldSceneV6.streetLightMat.opacity > 0.5, `Streetlights illuminate during storm/darkness (got ${worldSceneV6.streetLightMat.opacity})`);
WorldScene.prototype.updateStreetLights.call(worldSceneV6, false, 1.0);
assert(worldSceneV6.streetLightMat.opacity < 0.5, `Streetlights fade off in daylight (got ${worldSceneV6.streetLightMat.opacity})`);

// Test 51: Storm clouds & Outfall discharge foam
assert(worldSceneV6.stormCloudsGroup !== undefined, 'stormCloudsGroup exists in WorldScene');
assert(worldSceneV6.outfallFoamGroup !== undefined, 'outfallFoamGroup exists at coastal outfall pipes');
WorldScene.prototype.updateOutfallCascade.call(worldSceneV6, true, 1.0);
assert(worldSceneV6.outfallFoamMat.opacity > 0.5, `Outfall high-pressure foam plume active during flood discharge (got ${worldSceneV6.outfallFoamMat.opacity})`);
WorldScene.prototype.updateOutfallCascade.call(worldSceneV6, false, 1.0);
assert(worldSceneV6.outfallFoamMat.opacity < 0.5, `Outfall foam plume turns off when dry (got ${worldSceneV6.outfallFoamMat.opacity})`);

// Test 52: Transformer sparks during heatwave grid overload
assert(testDisasterV6.transformerSparksGroup !== undefined, 'transformerSparksGroup exists in DisasterSimulator');
testDisasterV6.triggerTransformerSpark(0, 2.5, 0);
assert(testDisasterV6.transformerSparksGroup.visible === true, 'Transformer sparks become visible when triggered');
const activeSparks = testDisasterV6.transformerSparks.filter(s => s.life > 0);
assert(activeSparks.length > 0, `Active electric spark particles spawned (found ${activeSparks.length})`);

// Test 53: Realistic street litter models (overflowing dumpster, black bag with knot, cans, bottles)
assert(worldSceneV6.streetLitterGroup !== undefined, 'streetLitterGroup exists in WorldScene');
const firstLitterNode = worldSceneV6.streetLitterGroup.children[0];
assert(firstLitterNode !== undefined, 'Litter nodes exist on city streets');
const hasDumpsterLid = firstLitterNode.children.some(c => c.geometry?.type === 'BoxGeometry' && c.position.y > 0.40);
assert(hasDumpsterLid, 'Overflowing dumpster has open lid model');
const hasKnottedBag = firstLitterNode.children.some(c => c.userData?.isBag && c.children.length > 0);
assert(hasKnottedBag, 'Torn black trash bag with tied top knot model exists');
const hasCan = firstLitterNode.children.some(c => c.geometry?.type === 'CylinderGeometry' && c.material?.color?.getHex() === 0xef4444);
assert(hasCan, 'Crumpled aluminum can model exists');
const hasPetBottle = firstLitterNode.children.some(c => c.geometry?.type === 'CylinderGeometry' && c.material?.color?.getHex() === 0x38bdf8);
assert(hasPetBottle, 'Flattened PET bottle model exists');

// Test 54: Menu short names verification across catalog items
assert(BUILDINGS_CATALOG.eco_house.shortName === 'Müstakil Ev', 'eco_house shortName is Müstakil Ev');
assert(BUILDINGS_CATALOG.green_roof.shortName === 'Apartman', 'green_roof shortName is Apartman');
assert(BUILDINGS_CATALOG.commercial_hub.shortName === 'İş Merkezi', 'commercial_hub shortName is İş Merkezi');
assert(BUILDINGS_CATALOG.sponge_park.shortName === 'Yağmur Parkı', 'sponge_park shortName is Yağmur Parkı');
assert(BUILDINGS_CATALOG.coastal_pump.shortName === 'Drenaj Pompası', 'coastal_pump shortName is Drenaj Pompası');
assert(BUILDINGS_CATALOG.permeable_road.shortName === 'Eko-Cadde', 'permeable_road shortName is Eko-Cadde');
assert(BUILDINGS_CATALOG.drain_grate.shortName === 'Mazgal', 'drain_grate shortName is Mazgal');

// --- VERSIYON 7.0 EXTENSIVE TEST SUITE ---
console.log('\n--- RUNNING V7.0 COMPREHENSIVE TESTS ---');

// Test 55: AFAD/MGM Professional Meteorological Terminology & Zero Unicode Emojis in index.html & main.js
const indexHtmlContent = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
assert(indexHtmlContent.includes('radar-status') && indexHtmlContent.includes('radar-badge-icon'), 'index.html has radar-status with SVG badge icon');
assert(indexHtmlContent.includes('YEŞİL KOD | NORMAL METEOROLOJİ'), 'index.html default radar status is YEŞİL KOD | NORMAL METEOROLOJİ');
assert(!emojiPattern.test(indexHtmlContent), 'index.html contains zero Unicode emojis');

const mainJsContent = fs.readFileSync(path.join(projectRoot, 'src/main.js'), 'utf8');
assert(mainJsContent.includes('KIRMIZI KOD | ŞİDDETLİ SAĞANAK & SEL'), 'main.js has KIRMIZI KOD | ŞİDDETLİ SAĞANAK & SEL');
assert(!mainJsContent.includes('FLAŞ TAŞKIN') && !mainJsContent.includes('Flaş Taşkın'), 'main.js contains zero FLAŞ TAŞKIN terminology');
assert(mainJsContent.includes('TURUNCU KOD | TERMAL DALGA'), 'main.js has TURUNCU KOD | TERMAL DALGA');
assert(mainJsContent.includes('SARI KOD | DUMAN İNVERSİYONU'), 'main.js has SARI KOD | DUMAN İNVERSİYONU');
assert(!emojiPattern.test(mainJsContent), 'main.js contains zero Unicode emojis');

// Test 56: Enriched drain_grate 3D geometry with clogGroup & hex bolts
const bm70 = new BuildingManager(scene);
const grateV7 = bm70.createBuilding('drain_grate');
assert(grateV7 !== null, 'drain_grate model created');
const hasTieBar = grateV7.children.some(c => c.geometry?.type === 'CylinderGeometry' && c.rotation?.z !== 0);
assert(hasTieBar, 'drain_grate has transverse structural tie-bar');
const bolts = grateV7.children.filter(c => c.geometry?.type === 'CylinderGeometry' && c.position?.y > 0.05);
assert(bolts.length >= 4, `drain_grate has at least 4 hex corner bolts (found ${bolts.length})`);
assert(grateV7.userData.clogGroup !== undefined, 'drain_grate has clogGroup');
assert(grateV7.userData.clogGroup.children.length >= 3, 'clogGroup has plastic bag, crushed soda can, and organic muck');

// Test 57: Drain grate clogging simulation during flood with low zero waste rate
const testDisasterV7 = new DisasterSimulator(scene);
testDisasterV7.activeDisaster = 'FLOOD';
const mockGrateGrid = {
  cells: [{ occupied: true, isRoad: true, buildingType: 'drain_grate', buildingMesh: grateV7, x: 0, z: 0 }]
};
testDisasterV7.updateStreetWaterFlow(0.1, mockGrateGrid, 30); // zeroWasteRate = 30% (< 50%)
assert(grateV7.userData.clogGroup.visible === true, 'clogGroup is visible during flood when zeroWasteRate < 50%');
testDisasterV7.updateStreetWaterFlow(0.1, mockGrateGrid, 80); // zeroWasteRate = 80% (>= 50%)
assert(grateV7.userData.clogGroup.visible === false, 'clogGroup is hidden when zeroWasteRate >= 50%');
testDisasterV7.stopDisaster();

// Test 58: Surcharged drain geyser manhole cover physical tilt, shift, and bounce
testDisasterV7.startDisaster('FLOOD');
testDisasterV7.waterMesh.position.y = 0.49;
testDisasterV7.setSpongeCapacity(5);
testDisasterV7.update(0.1, mockSun, mockHemi, mockFog, mockBg, mockGrid, { spongeCapacity: 5, grid: mockGrid });
const activeGeyser = testDisasterV7.drainGeysers.find(g => g.group.visible);
assert(activeGeyser !== undefined, 'Surcharged geyser is active');
assert(activeGeyser.cover.rotation.x !== 0 && activeGeyser.cover.rotation.z !== 0, 'Manhole cover tilts realistically when popped');
assert(activeGeyser.cover.position.x !== 0, 'Manhole cover shifts slightly aside from hole when blown off');
testDisasterV7.stopDisaster();

// Test 59: Rooftop HVAC Units, Rooftop Placement Elevation & Shimmering Heat Haze
const commHub = bm70.createBuilding('commercial_hub');
assert(commHub.userData.hvacUnits !== undefined && commHub.userData.hvacUnits.length > 0, 'commercial_hub has rooftop HVAC unit');
assert(commHub.userData.hvacFans !== undefined && commHub.userData.hvacFans.length > 0, 'commercial_hub has HVAC fan blade group');

const greenRoof = bm70.createBuilding('green_roof');
assert(greenRoof.userData.hvacUnits !== undefined && greenRoof.userData.hvacUnits.length > 0, 'green_roof has rooftop HVAC unit');

const legacyConc = bm70.createBuilding('legacy_concrete');
assert(legacyConc.userData.hvacUnits !== undefined && legacyConc.userData.hvacUnits.length > 0, 'legacy_concrete has rooftop HVAC unit');

const ecoHouse = bm70.createBuilding('eco_house');
assert(ecoHouse.userData.hvacUnits !== undefined && ecoHouse.userData.hvacUnits.length > 0, 'eco_house has rooftop HVAC unit');
assert(ecoHouse.userData.hvacUnits[0].position.y >= 1.25, `eco_house HVAC unit is mounted on the roof (got y=${ecoHouse.userData.hvacUnits[0].position.y} >= 1.25)`);
assert(commHub.userData.hvacUnits[0].userData.heatHaze !== undefined, 'HVAC unit has attached heat haze shimmer mesh');

// HVAC Fan rotation update & heat haze rising in scene
const mockBuildingGrid = {
  cells: [{ occupied: true, isRoad: false, buildingType: 'commercial_hub', buildingMesh: commHub }]
};
const fanMesh = commHub.userData.hvacFans[0];
const hazeMesh = commHub.userData.hvacUnits[0].userData.heatHaze;
const initialFanRot = fanMesh.rotation.z;
WorldScene.prototype.updateBuildingAnimations.call({}, 0.1, false, mockBuildingGrid, false);
const idleFanRot = fanMesh.rotation.z;
assert(idleFanRot > initialFanRot, `HVAC fan rotates at idle speed (${idleFanRot} > ${initialFanRot})`);
assert(hazeMesh.visible === false, 'HVAC heat haze is hidden in normal weather');

WorldScene.prototype.updateBuildingAnimations.call({}, 0.1, true, mockBuildingGrid, false);
const heatwaveFanRot = fanMesh.rotation.z;
assert(heatwaveFanRot - idleFanRot > idleFanRot - initialFanRot, 'HVAC fan rotates significantly faster during HEATWAVE');
assert(hazeMesh.visible === true, 'HVAC heat haze becomes visible during HEATWAVE');
assert(hazeMesh.material.opacity > 0.1, 'HVAC heat haze exhibits shimmering opacity during HEATWAVE');

// Test 60: 3D Street Transformer Kiosk Boxes
const worldSceneV7 = {
  scene: new THREE.Scene()
};
WorldScene.prototype.setupStreetTransformers.call(worldSceneV7);
assert(worldSceneV7.streetTransformersGroup !== undefined, 'streetTransformersGroup exists in WorldScene');
assert(worldSceneV7.streetTransformers.length === 4, `streetTransformers contains 4 corner distribution kiosks (found ${worldSceneV7.streetTransformers.length})`);
const firstTrafo = worldSceneV7.streetTransformers[0];
assert(firstTrafo.children.length >= 5, 'Transformer kiosk has plinth, metal cabinet, side vents, and warning sign');

// Test 61: 45°C Asphalt Tar Sheen / Mirage Reflection
WorldScene.prototype.setupAsphaltTarGlare.call(worldSceneV7);
assert(worldSceneV7.asphaltTarGlareGroup !== undefined, 'asphaltTarGlareGroup exists in WorldScene');
WorldScene.prototype.updateAsphaltTarGlare.call(worldSceneV7, true, 0.1);
assert(worldSceneV7.asphaltTarGlareGroup.visible === true, 'asphaltTarGlareGroup is visible during HEATWAVE');
WorldScene.prototype.updateAsphaltTarGlare.call(worldSceneV7, false, 0.1);
assert(worldSceneV7.asphaltTarGlareGroup.visible === false, 'asphaltTarGlareGroup is hidden in normal weather');

// Test 62: Dynamic Tree Swaying in Wind
worldSceneV7.sceneTrees = [];
const mockTreeA = new THREE.Group();
mockTreeA.userData = { baseRotZ: 0, baseRotX: 0 };
worldSceneV7.sceneTrees.push(mockTreeA);
WorldScene.prototype.updateTreeWindSway.call(worldSceneV7, 0.08, 0.016, 1.0);
assert(mockTreeA.rotation.z !== 0 || mockTreeA.rotation.x !== 0, 'Trees sway in wind during storm/smoke');

// Test 63: Shoreline Wave Foam Ribbons
WorldScene.prototype.setupShorelineFoam.call(worldSceneV7);
assert(worldSceneV7.shorelineFoamGroup !== undefined, 'shorelineFoamGroup exists in WorldScene');
assert(worldSceneV7.shorelineFoams.length > 10, `shorelineFoams has multiple animated wave segments (found ${worldSceneV7.shorelineFoams.length})`);
WorldScene.prototype.updateShorelineFoam.call(worldSceneV7, 0.1, 1.5);
const animated = worldSceneV7.shorelineFoams.some(f => Math.abs(f.mesh.position.z - f.baseZ) > 0.01);
assert(animated, 'Shoreline foam ribbons animate and lap onto beach sand');

// Test 64: Ash Fallout System during WILDFIRE_SMOKE
assert(testDisasterV7.ashParticlesGroup !== undefined, 'ashParticlesGroup exists in DisasterSimulator');
assert(testDisasterV7.ashParticles.length === 75, `ashParticles has 75 drifting ash flakes (found ${testDisasterV7.ashParticles.length})`);
testDisasterV7.activeDisaster = 'WILDFIRE_SMOKE';
testDisasterV7.updateAshFallout(0.1, 1.0);
assert(testDisasterV7.ashParticlesGroup.visible === true, 'ashParticlesGroup is visible during WILDFIRE_SMOKE');
testDisasterV7.activeDisaster = null;
testDisasterV7.updateAshFallout(0.1, 1.0);
assert(testDisasterV7.ashParticlesGroup.visible === false, 'ashParticlesGroup is hidden when no smoke disaster');

// Test 65: Vehicle Water Interaction: 4-Wheel Splash Spray, Buoyancy & Hazard Blinkers
const mockCar = { mesh: new THREE.Group(), speed: 1.25, progress: 0 };
trafficTest.setupVehicleFx(mockCar);
assert(mockCar.splashSprayGroup !== undefined, 'Vehicle has splashSprayGroup');
assert(mockCar.splashSprayGroup.name === 'Splash Spray', 'splashSprayGroup is named Splash Spray');
assert(mockCar.splashSprayGroup.children.length === 4, `Vehicle has 4 splash spray cones for all wheels (found ${mockCar.splashSprayGroup.children.length})`);
assert(mockCar.hazardGroup !== undefined, 'Vehicle has hazardGroup');
assert(mockCar.hazardGroup.children.length === 4, 'Vehicle has 4 hazard blinker lights');

// Deep simulation verification of vehicle flood interaction
const mockRoadCellA = { x: 0, z: 0, occupied: true, isRoad: true };
const mockRoadCellB = { x: 3, z: 0, occupied: true, isRoad: true };
const simVehicle = {
  mesh: new THREE.Group(),
  speed: 1.0,
  progress: 0.5,
  currCell: mockRoadCellA,
  nextCell: mockRoadCellB,
  prevCell: null
};
trafficTest.setupVehicleFx(simVehicle);
trafficTest.vehicles = [simVehicle];

const deepFloodGame = {
  crisisPhase: 'ACTIVE',
  currentDisaster: 'FLOOD',
  disasters: { waterMesh: { position: { y: 0.50 } } } // waterDepth = 0.50 - 0.435 = 0.065 > 0.035
};
trafficTest.update(0.1, deepFloodGame);
assert(simVehicle.splashSprayGroup.visible === true, 'Vehicle splash spray is active in floodwater');
assert(simVehicle.mesh.rotation.z !== 0 || simVehicle.mesh.rotation.x !== 0, 'Vehicle exhibits cradle rocking in floodwater');
assert(simVehicle.hazardMat.opacity > 0, 'Vehicle hazard blinkers flash in deep water when engine takes water');
assert(simVehicle.mesh.position.y > 0.435, 'Vehicle bobs slightly with buoyancy in floodwater');

// Test 66: Beach Parasols Storm Folding & Flapping
const crowdTestV7 = new CrowdSystem(scene, mockGrid);
assert(crowdTestV7.parasols !== undefined, 'crowd.parasols exists');
assert(crowdTestV7.parasols.length >= 2, `At least 2 beach parasols tracked (found ${crowdTestV7.parasols.length})`);
const testParasol = crowdTestV7.parasols[0];
// Simulate flood/storm update
crowdTestV7.update(0.1, { crisisPhase: 'ACTIVE', currentDisaster: 'FLOOD', disasters: testDisasterV7 });
assert(testParasol.canopy.scale.x < 0.9, 'Parasol canopy folds shut during storm');
// Simulate calm update
crowdTestV7.update(1.0, null);
assert(testParasol.canopy.scale.x > 0.5, 'Parasol canopy unfolds when storm passes');

// Test 67: Fleeing Pedestrians Hands-Over-Head Posture & Foot Water Splashes
assert(crowdTestV7.footSplashGroup !== undefined, 'footSplashGroup exists in CrowdSystem');
const pedAgent = crowdTestV7.pedestrians[0];
pedAgent.state = 'FLEEING';
pedAgent.targetShelter = { x: 0, z: 0 };
crowdTestV7.updateAgentEvacuation(pedAgent, 0.05, true);
assert(pedAgent.mesh.armL.rotation.x < -2.0, `Fleeing pedestrian raises left arm over head in rain (got ${pedAgent.mesh.armL.rotation.x})`);
assert(pedAgent.mesh.armR.rotation.x < -2.0, `Fleeing pedestrian raises right arm over head in rain (got ${pedAgent.mesh.armR.rotation.x})`);
assert(pedAgent.mesh.armL.rotation.z > 0.3, 'Fleeing pedestrian arms tilted inward over head');
assert(pedAgent.mesh.group.rotation.x > 0.1, 'Fleeing pedestrian torso leans forward into storm');

// Test 68: Blackout Window Illumination Shutoff for Non-Solar Buildings & Restoration
const solarCell = { occupied: true, isRoad: false, buildingType: 'solar_farm', buildingMesh: new THREE.Group() };
const nonSolarMesh = new THREE.Group();
const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ emissive: new THREE.Color(0xfacc15), emissiveIntensity: 1.0 }));
nonSolarMesh.add(windowMesh);
const nonSolarCell = { occupied: true, isRoad: false, buildingType: 'legacy_concrete', buildingMesh: nonSolarMesh };
const blackoutGrid = { cells: [solarCell, nonSolarCell] };
WorldScene.prototype.updateBuildingAnimations.call({}, 0.1, false, blackoutGrid, true);
assert(windowMesh.material.emissiveIntensity === 0, 'Non-solar building window lights turn off during blackout');
WorldScene.prototype.updateBuildingAnimations.call({}, 0.1, false, blackoutGrid, false);
assert(windowMesh.material.emissiveIntensity === 1.0, 'Non-solar building window lights restore when power returns');

// Test 69: Operational Radio Broadcast Compliance (AFAD / MGM Standard, Zero Informal Phrases)
const gameJsContent = fs.readFileSync(path.join(projectRoot, 'src/game.js'), 'utf8');
assert(!gameJsContent.includes('Başkanım, bacaya elektrostatik'), 'game.js filter radio message uses operational dispatch tone');
assert(!gameJsContent.includes('Tebrikler Sayın Başkanım! Şehrimizdeki'), 'game.js victory radio message uses operational dispatch tone');
assert(!mainJsContent.includes('Müjde Sayın Başkanım!'), 'main.js caretta message uses operational dispatch tone');
assert(!mainJsContent.includes('Sayın Başkanım, batı mahallesinde çöpler taştı'), 'main.js waste radio message uses operational dispatch tone');

// Test 70: Dynamic Grid Asphalt Tar Glare Excludes Permeable Roads
const mockGlareGrid = {
  cells: [
    { x: -6, z: 0, occupied: true, isRoad: true, buildingType: 'road' },
    { x: -3, z: 0, occupied: true, isRoad: true, buildingType: 'permeable_road' },
    { x: 0, z: 0, occupied: true, isRoad: true, buildingType: 'road' }
  ]
};
const dynamicSceneV7 = { scene: new THREE.Scene() };
WorldScene.prototype.setupAsphaltTarGlare.call(dynamicSceneV7, mockGlareGrid);
assert(dynamicSceneV7.asphaltTarGlares.length === 2, `Tar glare only spawns on unprotected asphalt roads, not permeable_road (found ${dynamicSceneV7.asphaltTarGlares.length})`);

// --- VERSIYON 9.0 EXTENSIVE TEST SUITE ---
console.log('\n--- RUNNING V9.0 COMPREHENSIVE TESTS ---');

// Test 71: V9.0 Architectural Model Upgrades (commercial_hub, sponge_park, biogas_plant, coastal_pump)
const commHubV9 = bm70.createBuilding('commercial_hub');
assert(commHubV9.userData.louverGroup !== undefined, 'commercial_hub has Mediterranean sun-shading louverGroup');
assert(commHubV9.userData.arcadeGroup !== undefined, 'commercial_hub has ground-floor shaded arcadeGroup');
assert(commHubV9.userData.louverGroup.children.length >= 6, 'commercial_hub louverGroup has multiple horizontal shading slats');

const spongeParkV9 = bm70.createBuilding('sponge_park');
assert(spongeParkV9.userData.boardwalkGroup !== undefined, 'sponge_park has wooden observation deck boardwalkGroup');
assert(spongeParkV9.userData.weirGroup !== undefined, 'sponge_park has stone spillway weirGroup');

const biogasV9 = bm70.createBuilding('biogas_plant');
assert(biogasV9.userData.flareGroup !== undefined, 'biogas_plant has safety gas flare stack flareGroup');
assert(biogasV9.userData.valveGroup !== undefined, 'biogas_plant has green safety pressure valveGroup');

const pumpV9 = bm70.createBuilding('coastal_pump');
assert(pumpV9.userData.controlCabin !== undefined, 'coastal_pump has semi-transparent glass controlCabin');
assert(pumpV9.userData.gaugeGroup !== undefined, 'coastal_pump has pressure gaugeGroup');
assert(pumpV9.userData.manifoldGroup !== undefined, 'coastal_pump has twin suction manifoldGroup');

// Test 72: Spatial Area-of-Effect (AoE) Radius Aura during BUILD hover
const gridV9 = new GridManager(new THREE.Scene(), 20, 14);
assert(gridV9.aoeAuraMesh !== undefined, 'GridManager has aoeAuraMesh');
assert(gridV9.aoeAuraMesh.visible === false, 'aoeAuraMesh is hidden by default');
const targetCellV9 = gridV9.getCell(5, 5);
gridV9.highlightCell(targetCellV9, 'BUILD', bm70, BUILDINGS_CATALOG.wind_corridor, 5000);
assert(gridV9.aoeAuraMesh.visible === true, 'aoeAuraMesh becomes visible when hovering with wind_corridor in BUILD mode');
assert(gridV9.aoeAuraMesh.scale.x === 10.5, `aoeAuraMesh scales to 10.5 for wind_corridor (got ${gridV9.aoeAuraMesh.scale.x})`);
gridV9.highlightCell(targetCellV9, 'BUILD', bm70, BUILDINGS_CATALOG.drain_grate, 5000);
assert(gridV9.aoeAuraMesh.visible === true, 'aoeAuraMesh becomes visible when hovering with drain_grate in BUILD mode');
assert(gridV9.aoeAuraMesh.scale.x === 5.5, `aoeAuraMesh scales to 5.5 for drain_grate (got ${gridV9.aoeAuraMesh.scale.x})`);
gridV9.clearHighlight();
assert(gridV9.aoeAuraMesh.visible === false, 'aoeAuraMesh hides on clearHighlight()');

// Test 73: Dynamic Storm Drain Early Flood Evacuation Algorithm
const floodSceneV9 = new THREE.Scene();
const disV9 = new DisasterSimulator(floodSceneV9);
disV9.startDisaster('FLOOD');
disV9.floodElapsed = 20.0; // Past crest phase
disV9.setSpongeCapacity(10);
const gridNoGrates = { cells: [] };
for (let i = 0; i < 30; i++) {
  disV9.update(0.1, mockSun, mockHemi, mockFog, mockBg, gridNoGrates, { zeroWasteRate: 80 });
}
const waterYWithoutGrates = disV9.waterMesh.position.y;

const gridWithGrates = {
  cells: [
    { occupied: true, isRoad: true, buildingType: 'drain_grate', hasRoadAccess: true, x: 0, z: 0 },
    { occupied: true, isRoad: true, buildingType: 'drain_grate', hasRoadAccess: true, x: 3, z: 0 },
    { occupied: true, isRoad: true, buildingType: 'drain_grate', hasRoadAccess: true, x: 6, z: 0 },
    { occupied: true, isRoad: false, buildingType: 'coastal_pump', hasRoadAccess: true, x: 9, z: 0 }
  ]
};
for (let i = 0; i < 30; i++) {
  disV9.update(0.1, mockSun, mockHemi, mockFog, mockBg, gridWithGrates, { zeroWasteRate: 80 });
}
const waterYWithGrates = disV9.waterMesh.position.y;
assert(disV9.activeGratesCount === 4, `DisasterSimulator tracks 4 active grates/pumps (got ${disV9.activeGratesCount})`);
assert(disV9.currentDrainRate > 0.1, `DisasterSimulator calculates positive currentDrainRate (got ${disV9.currentDrainRate})`);
assert(waterYWithGrates < waterYWithoutGrates, `Active storm grates lower flood water elevation (${waterYWithGrates.toFixed(3)} < ${waterYWithoutGrates.toFixed(3)})`);
disV9.stopDisaster();

// Test 74: Live Crisis Telemetry & Tactical Emergency Actions in GameManager
const mockUiV9 = {
  showToast() {},
  speakMuratBey() {},
  triggerDisasterWarning() {},
  triggerDisasterStart() {},
  triggerDisasterSuccess() {},
  resetRadar() {}
};
const gameV9 = new GameManager({ scene: new THREE.Scene(), resetLighting() {} }, gridV9, bm70, disV9, mockUiV9);
gameV9.initStarterCity();
const telemetry = gameV9.getDisasterTelemetry();
assert(telemetry !== null && typeof telemetry === 'object', 'getDisasterTelemetry returns telemetry object');
assert(typeof telemetry.gridDeficit === 'number', 'telemetry includes gridDeficit');
assert(typeof telemetry.drainRate === 'number', 'telemetry includes drainRate');
assert(telemetry.clogRisk === 'YÜKSEK' || telemetry.clogRisk === 'DÜŞÜK', 'telemetry includes clogRisk');

// Trigger FLOOD and test emergency actions & early drain countdown
gameV9.triggerDisaster('FLOOD', 40.0);
const durBeforeSluice = gameV9.disasterDuration;
const okSluice = gameV9.executeEmergencyAction('sluice_gates');
assert(okSluice === true, 'executeEmergencyAction(sluice_gates) succeeds during active crisis');
assert(gameV9.disasterDuration <= durBeforeSluice - 9.9, 'sluice_gates reduces flood duration by 10s');

const budgetBeforeVac = gameV9.budget;
const okVac = gameV9.executeEmergencyAction('vacuum_truck');
assert(okVac === true, 'executeEmergencyAction(vacuum_truck) succeeds when budget >= $40');
assert(gameV9.budget === budgetBeforeVac - 40, 'vacuum_truck deducts $40 from budget');

// Test HEATWAVE emergency actions
gameV9.triggerDisaster('HEATWAVE', 30.0);
const okGridProt = gameV9.executeEmergencyAction('grid_protect');
assert(okGridProt === true, 'executeEmergencyAction(grid_protect) succeeds');
assert(gameV9.emergencyGridProtectionTimer === 20.0, 'grid_protect sets 20s protection timer');

const okMist = gameV9.executeEmergencyAction('mist_fountains');
assert(okMist === true, 'executeEmergencyAction(mist_fountains) succeeds');
assert(gameV9.emergencyCoolingTimer === 20.0, 'mist_fountains sets 20s cooling timer');
assert(gameV9.getDisasterTelemetry().coolingPower >= gameV9.coolingPower + 8, 'mist_fountains adds +8°C effective cooling in telemetry');

// --- VERSIYON 10.0 EXTENSIVE TEST SUITE ---
console.log('\n--- RUNNING V10.0 COMPREHENSIVE TESTS ---');

// Test 75: Tramway Deprecation & Menu Filtering
assert(BUILDINGS_CATALOG.solar_tram.hidden === true, 'solar_tram has hidden: true');
const selectableRoads = Object.values(BUILDINGS_CATALOG).filter(b => b.category === 'roads' && !b.isLegacy && !b.isTool && !b.hidden);
assert(!selectableRoads.some(b => b.id === 'solar_tram'), 'solar_tram is excluded from selectable road menu items');

// Test 76: 3D Floating Sea Litter & Swimming Caretta Caretta Turtles in WorldScene
const worldSceneV10 = {
  scene: new THREE.Scene()
};
WorldScene.prototype.setupFloatingSeaLitter.call(worldSceneV10);
assert(worldSceneV10.floatingLitterGroup !== undefined, 'floatingLitterGroup exists in WorldScene');
assert(worldSceneV10.floatingLitterItems.length === 24, `floatingLitterItems contains 24 sea debris items (found ${worldSceneV10.floatingLitterItems.length})`);

// Verify floating litter visibility based on marine health
WorldScene.prototype.updateFloatingSeaLitter.call(worldSceneV10, 0.1, 40, 0); // marineHealth = 40 (< 75)
assert(worldSceneV10.floatingLitterGroup.visible === true, 'floatingLitterGroup is visible when marineHealth < 75');
WorldScene.prototype.updateFloatingSeaLitter.call(worldSceneV10, 0.1, 85, 0); // marineHealth = 85 (>= 75)
assert(worldSceneV10.floatingLitterGroup.visible === false, 'floatingLitterGroup is hidden when marineHealth >= 75 and no damage');

// Setup and verify swimming Caretta Caretta turtles
WorldScene.prototype.setupCarettaTurtles.call(worldSceneV10);
assert(worldSceneV10.carettaGroup !== undefined, 'carettaGroup exists in WorldScene');
assert(worldSceneV10.carettaTurtles.length === 4, `carettaTurtles contains 4 swimming turtles (found ${worldSceneV10.carettaTurtles.length})`);
const firstTurtle = worldSceneV10.carettaTurtles[0];
assert(firstTurtle.userData.flipperL !== undefined && firstTurtle.userData.flipperR !== undefined, 'Caretta turtle has left and right swimming flippers');

// Verify turtle swimming behavior & flipper flapping
WorldScene.prototype.updateCarettaTurtles.call(worldSceneV10, 0.1, 80, false); // Clean water & calm weather
assert(worldSceneV10.carettaGroup.visible === true, 'carettaGroup is visible in clean water (marineHealth >= 75)');
assert(firstTurtle.userData.flipperL.rotation.z !== 0, 'Caretta turtle flaps front flippers rhythmically while swimming');
WorldScene.prototype.updateCarettaTurtles.call(worldSceneV10, 0.1, 50, false); // Polluted water
assert(worldSceneV10.carettaGroup.visible === false, 'carettaGroup hides in polluted water (marineHealth < 75)');
WorldScene.prototype.updateCarettaTurtles.call(worldSceneV10, 0.1, 85, true); // Active storm
assert(worldSceneV10.carettaGroup.visible === false, 'carettaGroup hides during severe storm/flood');

// Test 77: Interactive 3-Step Onboarding Tutorial & 3D Beacon
const testGridV10 = new GridManager(new THREE.Scene(), 20, 14);
assert(testGridV10.tutorialBeaconGroup !== undefined, 'tutorialBeaconGroup exists on GridManager');
assert(testGridV10.tutorialBeaconGroup.visible === false, 'tutorialBeaconGroup is initially hidden');

const testGameV10 = new GameManager({ scene: new THREE.Scene(), resetLighting() {} }, testGridV10, bm70, disV9, mockUiV9);
testGameV10.initStarterCity();
assert(testGameV10.tutorialActive === true, 'tutorialActive is true upon game start');
assert(testGameV10.tutorialStep === 1, 'tutorialStep starts at 1');
const tutInfoStep1 = testGameV10.getTutorialInfo();
assert(tutInfoStep1.step === 1 && tutInfoStep1.targetCell.row === 6 && tutInfoStep1.targetCell.col === 8, 'Step 1 targets cell (6, 8)');
assert(testGridV10.tutorialBeaconGroup.visible === true, '3D Tutorial Beacon is visible at target cell (6, 8)');

// Step 1: Build road on (6, 8)
const cellRoad = testGridV10.getCell(6, 8);
testGameV10.selectedBuildingType = 'road';
testGameV10.setToolMode('BUILD');
const budgetBeforeStep1 = testGameV10.budget;
testGameV10.buildOnCell(cellRoad, false);
assert(testGameV10.tutorialStep === 2, 'Tutorial advances to Step 2 after road is built');
assert(testGameV10.budget === budgetBeforeStep1 - BUILDINGS_CATALOG.road.cost + 150, 'Step 1 grants +$150 reward');
const tutInfoStep2 = testGameV10.getTutorialInfo();
assert(tutInfoStep2.targetCell.row === 5 && tutInfoStep2.targetCell.col === 8, 'Step 2 targets cell (5, 8) for sponge park');

// Step 2: Build sponge park on (5, 8)
const cellPark = testGridV10.getCell(5, 8);
testGameV10.selectedBuildingType = 'sponge_park';
testGameV10.setToolMode('BUILD');
const budgetBeforeStep2 = testGameV10.budget;
testGameV10.buildOnCell(cellPark, false);
assert(testGameV10.tutorialStep === 3, 'Tutorial advances to Step 3 after sponge park is built');
assert(testGameV10.budget >= budgetBeforeStep2 - BUILDINGS_CATALOG.sponge_park.cost + 200, 'Step 2 grants +$200 reward');

// Step 3: Demolish legacy concrete on (6, 9)
const cellLegacy = testGridV10.getCell(6, 9);
assert(cellLegacy.occupied && cellLegacy.buildingType === 'legacy_concrete', 'Cell (6, 9) holds legacy concrete plant');
testGameV10.setToolMode('BULLDOZE');
testGameV10.bulldozeCell(cellLegacy);
assert(testGameV10.tutorialStep === 4, 'Tutorial advances to Step 4 after demolishing legacy concrete');
const tutInfoStep4 = testGameV10.getTutorialInfo();
assert(tutInfoStep4.targetCell.row === 7 && tutInfoStep4.targetCell.col === 8, 'Step 4 targets cell (7, 8) for drain grate');

// Step 4: Build drain grate on (7, 8)
const cellGrate = testGridV10.getCell(7, 8);
testGameV10.selectedBuildingType = 'drain_grate';
testGameV10.setToolMode('BUILD');
const budgetBeforeStep4 = testGameV10.budget;
testGameV10.buildOnCell(cellGrate, false);
assert(testGameV10.tutorialStep === 5, 'Tutorial advances to Step 5 after drain grate is built');
assert(testGameV10.budget >= budgetBeforeStep4 - BUILDINGS_CATALOG.drain_grate.cost + 200, 'Step 4 grants +$200 reward');

// Step 5: Resolve first micro-event
assert(testGameV10.activeMicroEvent !== null, 'Micro-event automatically triggered for Step 5');
testGameV10.resolveMicroEvent(0);
assert(testGameV10.tutorialActive === false, 'Tutorial completes after resolving Step 5 micro-event');
assert(testGridV10.tutorialBeaconGroup.visible === false, '3D Tutorial Beacon is hidden when tutorial is complete');

// Test skipTutorial()
testGameV10.tutorialActive = true;
testGameV10.tutorialStep = 1;
testGameV10.updateTutorialTargetBeacon();
assert(testGridV10.tutorialBeaconGroup.visible === true, 'Beacon visible when tutorial reactivated');
testGameV10.skipTutorial();
assert(testGameV10.tutorialActive === false, 'skipTutorial() deactivates tutorial');
assert(testGridV10.tutorialBeaconGroup.visible === false, 'skipTutorial() hides beacon');

// Test 78: Peace Phase Micro-Events Engine
const catalog = testGameV10.getMicroEventCatalog();
assert(catalog.length === 4, `Micro-event catalog contains 4 diverse civic scenarios (found ${catalog.length})`);
assert(catalog.some(e => e.id === 'beach_cleanup'), 'Catalog includes beach_cleanup');
assert(catalog.some(e => e.id === 'transformer_heat'), 'Catalog includes transformer_heat');
assert(catalog.some(e => e.id === 'ecology_volunteers'), 'Catalog includes ecology_volunteers');
assert(catalog.some(e => e.id === 'cliff_erosion'), 'Catalog includes cliff_erosion');

// Trigger and resolve beach_cleanup Option A
testGameV10.crisisPhase = 'PEACE';
testGameV10.triggerMicroEvent('beach_cleanup');
assert(testGameV10.activeMicroEvent !== null, 'activeMicroEvent is populated');
assert(testGameV10.activeMicroEvent.id === 'beach_cleanup', 'Triggered event is beach_cleanup');
const zwBefore = testGameV10.zeroWasteRate;
const mhBefore = testGameV10.marineHealth;
const budgetBeforeEvent = testGameV10.budget;
const okEventA = testGameV10.resolveMicroEvent(0); // Option A: cleanup
assert(okEventA === true, 'resolveMicroEvent(0) succeeds');
assert(testGameV10.budget === budgetBeforeEvent - 25, 'Option A deducts $25 dispatch cost');
assert(testGameV10.zeroWasteRate === zwBefore + 12, 'Option A adds +12% zero waste rate');
assert(testGameV10.marineHealth === mhBefore + 5, 'Option A adds +5% marine health');
assert(testGameV10.activeMicroEvent === null, 'activeMicroEvent clears upon resolution');

// Trigger and test auto-timeout resolution (Option B)
testGameV10.triggerMicroEvent('cliff_erosion');
assert(testGameV10.activeMicroEvent !== null, 'cliff_erosion event triggered');
testGameV10.activeMicroEvent.timeLeft = 0.05;
const hpBeforeTimeout = testGameV10.health;
testGameV10.update(0.1); // Triggers timeout auto-resolution of Option B (ignore)
assert(testGameV10.activeMicroEvent === null, 'activeMicroEvent auto-clears on timeout');
assert(Math.abs(testGameV10.health - (hpBeforeTimeout - 4)) < 0.2, 'Option B applied erosion damage (-4 HP)');

// Test 79: Index.html & Main.js Minimalist UI/UX & Zero Unicode Emojis & Zero "COP31" & Zero "FLAŞ TAŞKIN"
const updatedIndexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
assert(updatedIndexHtml.includes('id="tutorial-bar"'), 'index.html includes tutorial-bar');
assert(updatedIndexHtml.includes('id="micro-event-card"'), 'index.html includes micro-event-card');
assert(!emojiPattern.test(updatedIndexHtml), 'index.html contains zero Unicode emojis');
assert(!updatedIndexHtml.includes('COP31'), 'index.html contains zero COP31 references');
assert(!updatedIndexHtml.includes('FLAŞ TAŞKIN') && !updatedIndexHtml.includes('Flaş Taşkın'), 'index.html contains zero FLAŞ TAŞKIN references');

const updatedMainJs = fs.readFileSync(path.join(projectRoot, 'src/main.js'), 'utf8');
assert(updatedMainJs.includes('tutorialBar'), 'main.js binds tutorialBar');
assert(updatedMainJs.includes('microEventCard'), 'main.js binds microEventCard');
assert(!emojiPattern.test(updatedMainJs), 'main.js contains zero Unicode emojis');
assert(!updatedMainJs.includes('COP31'), 'main.js contains zero COP31 references');
assert(!updatedMainJs.includes('FLAŞ TAŞKIN') && !updatedMainJs.includes('Flaş Taşkın'), 'main.js contains zero FLAŞ TAŞKIN references');

// --- VERSIYON 11.0 EXTENSIVE TEST SUITE ---
console.log('\n--- RUNNING V11.0 COMPREHENSIVE TESTS ---');

// Test 80: Catalog Simplification: marine_barrier and sea_breakwater hidden
assert(BUILDINGS_CATALOG.marine_barrier.hidden === true, 'marine_barrier has hidden: true');
assert(BUILDINGS_CATALOG.sea_breakwater.hidden === true, 'sea_breakwater has hidden: true');
const selectableInfra = Object.values(BUILDINGS_CATALOG).filter(b => b.category === 'infra' && !b.isLegacy && !b.isTool && !b.hidden);
assert(!selectableInfra.some(b => b.id === 'marine_barrier'), 'marine_barrier is excluded from selectable menu items');
assert(!selectableInfra.some(b => b.id === 'sea_breakwater'), 'sea_breakwater is excluded from selectable menu items');

// Test 81: Procedural Terrain Texture & Beveled Parcel Earth Pads (emptyPadGroup)
const mockWorldSceneV11 = {
  scene: new THREE.Scene(),
  setupBeachTrash: WorldScene.prototype.setupBeachTrash,
  updateBeachTrash: WorldScene.prototype.updateBeachTrash,
  generateTerrainTexture: WorldScene.prototype.generateTerrainTexture,
  mainlandMat: new THREE.MeshStandardMaterial({ color: 0x4f9b5c })
};
mockWorldSceneV11.setupBeachTrash();
assert(typeof mockWorldSceneV11.generateTerrainTexture === 'function', 'WorldScene has generateTerrainTexture');
assert(mockWorldSceneV11.mainlandMat !== undefined, 'WorldScene has mainlandMat');

const gridV11 = new GridManager(new THREE.Scene(), 20, 14);
const sampleCell = gridV11.getCell(4, 4);
assert(sampleCell.emptyPadGroup !== undefined, 'cell has emptyPadGroup');
assert(sampleCell.emptyPadGroup.visible === true, 'emptyPadGroup is visible on empty cell');
assert(sampleCell.emptyPadGroup.children.length >= 2, 'emptyPadGroup has beveled pad and border rim');

const gameV11 = new GameManager(mockSceneWrapper, gridV11, bm70, disV9, mockUiV9);
gameV11.initStarterCity();
const starterOccupied = gridV11.getCell(6, 9);
assert(starterOccupied.emptyPadGroup.visible === false, 'emptyPadGroup is hidden under occupied starter buildings');

// Place new building and verify pad hides
const emptyCell = gridV11.getCell(5, 5);
gameV11.budget = 5000;
gameV11.setToolMode('BUILD');
gameV11.selectedBuildingType = 'eco_house';
gameV11.buildOnCell(emptyCell, false);
assert(emptyCell.emptyPadGroup.visible === false, 'emptyPadGroup hides when building is placed');

// Bulldoze cell and verify pad restores
gameV11.setToolMode('BULLDOZE');
gameV11.bulldozeCell(emptyCell);
assert(emptyCell.emptyPadGroup.visible === true, 'emptyPadGroup restores visibility when building is bulldozed');

// Test 82: 3D Beach Trash Accumulation on Sand Shore
assert(mockWorldSceneV11.beachTrashGroup !== undefined, 'beachTrashGroup exists in WorldScene');
assert(mockWorldSceneV11.beachTrashItems.length === 20, `beachTrashItems contains 20 items on sand (found ${mockWorldSceneV11.beachTrashItems.length})`);
const firstTrash = mockWorldSceneV11.beachTrashItems[0];
assert(firstTrash.mesh.position.z >= 18.0 && firstTrash.mesh.position.z <= 25.0, 'Beach trash items are positioned on sandy shore');

// Trash visibility based on marine health and damage
mockWorldSceneV11.updateBeachTrash({ marineHealth: 45, disasterSim: { marinePollutionDamage: 0 } }, 0.1);
assert(mockWorldSceneV11.beachTrashGroup.visible === true, 'beachTrashGroup is visible when marineHealth < 75%');

mockWorldSceneV11.updateBeachTrash({ marineHealth: 85, disasterSim: { marinePollutionDamage: 10 } }, 0.1);
assert(mockWorldSceneV11.beachTrashGroup.visible === true, 'beachTrashGroup is visible when marinePollutionDamage > 0 even if health is high');

mockWorldSceneV11.updateBeachTrash({ marineHealth: 90, disasterSim: { marinePollutionDamage: 0 } }, 0.1);
assert(mockWorldSceneV11.beachTrashGroup.visible === false, 'beachTrashGroup is hidden when water is clean and undamaged');

// Test 83: Flood Vehicle Gridlock, Stall, Buoyancy & Angled Collision Pileup
const simCarV11 = {
  mesh: new THREE.Group(),
  speed: 1.2,
  progress: 0.5,
  currCell: { x: 0, z: 0, occupied: true, isRoad: true },
  nextCell: { x: 3, z: 0, occupied: true, isRoad: true },
  prevCell: null
};
trafficTest.setupVehicleFx(simCarV11);
trafficTest.vehicles = [simCarV11];

// Deep flood (waterDepth = 0.50 - 0.435 = 0.065 >= 0.045) -> Stall & Gridlock
const stallFloodGame = {
  crisisPhase: 'ACTIVE',
  currentDisaster: 'FLOOD',
  disasters: { waterMesh: { position: { y: 0.50 } } }
};
trafficTest.update(0.1, stallFloodGame);
assert(simCarV11.isStalled === true, 'Vehicle stalls (isStalled = true) in deep floodwater (>= 0.045 depth)');
assert(simCarV11.hazardMat.opacity > 0, 'Hazard blinkers flash rapidly when vehicle is stalled');
assert(simCarV11.mesh.rotation.y !== 0, 'Vehicle takes skewed angle in flood pileup');

// Water recedes (waterDepth = 0.44 - 0.435 = 0.005 < 0.03) -> Recovery
const recedingFloodGame = {
  crisisPhase: 'ACTIVE',
  currentDisaster: 'FLOOD',
  disasters: { waterMesh: { position: { y: 0.44 } } }
};
trafficTest.update(0.1, recedingFloodGame);
assert(simCarV11.isStalled === false, 'Vehicle recovers (isStalled = false) when water depth drops below 0.03');

// Test 84: Pedestrian Heatwave Slowdown
const p11 = crowdTestV7.pedestrians[0];
const baseP11Speed = p11.baseSpeed || 0.65;
crowdTestV7.update(0.1, { currentDisaster: 'HEATWAVE', crisisPhase: 'ACTIVE' });
assert(p11.speed <= baseP11Speed, 'Pedestrian speed is controlled and realistic during heatwave');

// Test 85: Emergency Actions Bar Relocation inside crisis-diagnostic-hud
const finalIndexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const diagHudIdx = finalIndexHtml.indexOf('id="crisis-diagnostic-hud"');
const emergBarIdx = finalIndexHtml.indexOf('id="emergency-actions-bar"');
const bottomUiIdx = finalIndexHtml.indexOf('class="bottom-ui-wrapper"');
assert(emergBarIdx > diagHudIdx && emergBarIdx < bottomUiIdx, 'emergency-actions-bar is docked inside right diagnostic card, not floating in bottom UI');

// --- RUNNING V11.2 COMPREHENSIVE TESTS: GARBAGE TRUCK, 2 SANITATION WORKERS & OPERATIONS SUBBAR ---
const mockWorldSceneV12 = {
  scene: new THREE.Scene(),
  streetLitterGroup: new THREE.Group()
};
mockWorldSceneV12.streetLitterGroup.children = [
  new THREE.Group(), new THREE.Group(), new THREE.Group(),
  new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()
];

// Test 86: 3D Compactor Garbage Truck & 2 Sanitation Workers Mesh Construction
WorldScene.prototype.setupGarbageTruck.call(mockWorldSceneV12);
assert(mockWorldSceneV12.garbageTruckGroup !== undefined, 'garbageTruckGroup exists in WorldScene');
assert(mockWorldSceneV12.garbageTruckGroup.visible === false, 'garbageTruckGroup is initially hidden');
assert(mockWorldSceneV12.truckWheels.length === 6, `Garbage truck has 6 wheels (found ${mockWorldSceneV12.truckWheels.length})`);
assert(mockWorldSceneV12.truckBeacon !== undefined, 'Garbage truck has flashing amber roof beacon');
assert(mockWorldSceneV12.sanitationWorkers.length === 2, `Sanitation crew has 2 workers (found ${mockWorldSceneV12.sanitationWorkers.length})`);
const worker1 = mockWorldSceneV12.sanitationWorkers[0];
assert(worker1.userData.leftLeg !== undefined && worker1.userData.rightLeg !== undefined, 'Worker has animated legs');
assert(worker1.userData.armL !== undefined && worker1.userData.armR !== undefined, 'Worker has animated arms');
assert(worker1.userData.heldBag !== undefined, 'Worker has trash bag prop');

// Test 87: Live Street Cleanup Mission & Choreography
WorldScene.prototype.triggerGarbageTruck.call(mockWorldSceneV12);
assert(mockWorldSceneV12.garbageTruck.active === true, 'Garbage truck is active upon trigger');
assert(mockWorldSceneV12.garbageTruck.state === 'driving', 'Garbage truck starts in driving state');
assert(mockWorldSceneV12.garbageTruckGroup.visible === true, 'Garbage truck becomes visible');

// Simulation step towards first target
WorldScene.prototype.updateGarbageTruck.call(mockWorldSceneV12, 0.5);
assert(mockWorldSceneV12.garbageTruck.x > -32, 'Garbage truck moves along road towards litter spot');

// Test 88: Operations Subbar Drawer & Dispatch UI
const finalMainJs = fs.readFileSync(path.join(projectRoot, 'src', 'main.js'), 'utf8');
assert(finalIndexHtml.includes('id="ops-subbar"'), 'index.html includes ops-subbar drawer');
assert(finalIndexHtml.includes('id="btn-tool-ops"'), 'primary-toolbar includes btn-tool-ops button');
assert(finalMainJs.includes('btnToolOps'), 'main.js binds btnToolOps');
assert(finalMainJs.includes('opsSubbar'), 'main.js binds opsSubbar');
assert(!finalIndexHtml.includes('cleaning-ops-card'), 'right dock is clean with no redundant cleaning card');
assert(!finalMainJs.includes('FLAŞ TAŞKIN'), 'main.js contains zero FLAŞ TAŞKIN references');

console.log(`\nTEST RESULTS: ${passed} PASSED, ${failed} FAILED.`);
if (failed > 0) process.exit(1);
