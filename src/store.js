import * as THREE from 'three';
import {
  addBox, addCyl, addPlane, addTube, addOutline, canvasTexture, PAL,
} from './core.js';
import { buildInterior } from './interior.js';

/* ------------------------------------------------------------------ *
 *  便利店建筑：外墙、玻璃幕、雨棚、招牌、屋顶
 * ------------------------------------------------------------------ */

function signTexture() {
  return canvasTexture(1536, 230, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0d5b63');
    g.addColorStop(0.55, '#0a4b53');
    g.addColorStop(1, '#083c43');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(127,224,216,0.28)';
    ctx.fillRect(0, 16, w, 4);
    ctx.fillRect(0, h - 20, w, 4);

    ctx.fillStyle = '#f4ffff';
    ctx.font = '800 92px "Arial Black", "Yu Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HIKARI', 62, 118);
    ctx.font = '600 27px "Yu Gothic", "Meiryo", sans-serif';
    ctx.fillStyle = '#9fe7df';
    ctx.fillText('CONVENIENCE  STORE', 66, 158);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 158px "Arial Black", "Yu Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MART', 900, 158);

    // 24H 红牌
    ctx.fillStyle = '#df4b3f';
    const bx = 1262;
    const by = 44;
    const bw = 214;
    const bh = 142;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 14);
    ctx.fill();
    ctx.fillStyle = '#fff7e8';
    ctx.font = '900 100px "Arial Black", sans-serif';
    ctx.fillText('24H', bx + bw / 2, by + 112);

    ctx.fillStyle = '#b9ede7';
    ctx.font = '500 22px "Yu Gothic", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('年中無休', w - 60, 202);
  });
}

function verticalSignTexture() {
  return canvasTexture(180, 760, (ctx, w, h) => {
    ctx.fillStyle = '#0a4b53';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(127,224,216,0.5)';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#f6fffe';
    ctx.textAlign = 'center';
    ctx.font = '900 112px "Arial Black", sans-serif';
    const letters = ['M', 'A', 'R', 'T'];
    letters.forEach((c, i) => ctx.fillText(c, w / 2, 138 + i * 126));
    ctx.fillStyle = '#df4b3f';
    ctx.beginPath();
    ctx.roundRect(28, 610, w - 56, 104, 10);
    ctx.fill();
    ctx.fillStyle = '#fff6e6';
    ctx.font = '900 70px "Arial Black", sans-serif';
    ctx.fillText('24H', w / 2, 683);
  });
}

function canopyText() {
  return canvasTexture(1024, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#eafefb';
    ctx.font = '700 30px "Yu Gothic", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIKARI MART  ·  ひかりマート  ·  OPEN 24 HOURS', w / 2, 42);
  });
}

function doorDecal() {
  return canvasTexture(384, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '600 34px "Yu Gothic", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('自 動 ド ア', w / 2, 44);
    ctx.fillStyle = 'rgba(140,220,215,0.9)';
    ctx.font = '500 20px "Yu Gothic", sans-serif';
    ctx.fillText('AUTOMATIC DOOR', w / 2, 76);
  });
}

function windowPoster(title, sub, accent) {
  return canvasTexture(256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#fbf6ea';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, 70);
    ctx.fillStyle = '#fff';
    ctx.font = '700 34px "Yu Gothic", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 50);
    ctx.fillStyle = '#3b342c';
    ctx.font = '600 30px "Yu Gothic", sans-serif';
    ctx.fillText(sub, w / 2, 130);
    ctx.fillStyle = '#eadfcd';
    ctx.fillRect(26, 160, 204, 8);
    ctx.fillRect(26, 186, 160, 8);
    ctx.fillRect(26, 212, 190, 8);
    ctx.fillStyle = accent;
    ctx.font = '800 44px "Arial Black", sans-serif';
    ctx.fillText('OPEN', w / 2, 282);
  });
}

export function buildStore(env) {
  const { art, root, builder } = env;
  const store = new THREE.Group();
  store.position.set(-1.6, 0.12, -1.7);
  root.add(store);
  env.store = store;
  env.storeNeon = [];
  env.storeParts = {};

  const wallMat = art.toon(0xe8e4d8);
  const wallShade = art.toon(0xcdc8bc);
  const trimMat = art.toon(0xf5f4ef);
  const tealMat = art.toon(0x169c9a);
  const steelMat = art.toon(0x8c949f);
  const darkMetal = art.toon(0x39404a);
  const whiteMetal = art.toon(0xdde2e6);

  /* --------------------------- 基础与楼板 --------------------------- */
  const foundation = new THREE.Group();
  foundation.position.set(0, 0, 0);
  store.add(foundation);
  addBox(foundation, 5.88, 0.06, 5.7, art.toon(0xb8b3a8), 0, 0.03, 0, { outline: 0.004 });
  builder.rise(foundation, 1.62, 0.7, { dist: 0.8, ease: 'outCubic' });

  const shell = new THREE.Group();
  store.add(shell);

  const wallGrow = (w, h, d, x, z, at, mat = wallMat) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.06, z);
    shell.add(pivot);
    addBox(pivot, w, h, d, mat, 0, h / 2, 0, { outline: 0.004 });
    builder.grow(pivot, at, 0.8, { ease: 'outCubic' });
    return pivot;
  };

  // 左墙、后墙
  const leftWall = wallGrow(0.2, 3.02, 5.4, -2.8, 0, 1.72);
  wallGrow(5.6, 3.02, 0.2, 0, -2.7, 1.8);

  // 结构柱
  const columns = new THREE.Group();
  shell.add(columns);
  addBox(columns, 0.22, 3.02, 0.22, wallShade, -2.8, 1.57, 2.68, { outline: 0.003 });
  addBox(columns, 0.22, 3.02, 0.22, wallShade, -2.8, 1.57, -2.68, { outline: 0.003 });
  addBox(columns, 0.22, 3.02, 0.22, wallShade, 2.8, 1.57, 2.68, { outline: 0.003 });
  addBox(columns, 0.22, 3.02, 0.22, wallShade, 2.8, 1.57, -2.68, { outline: 0.003 });
  addBox(columns, 0.22, 3.02, 0.22, wallShade, 2.8, 1.57, -0.3, { outline: 0.003 });
  builder.drop(columns, 1.86, 0.7, { dist: 0.9, ease: 'outCubic' });

  // 上下墙带
  const bands = new THREE.Group();
  shell.add(bands);
  addBox(bands, 5.6, 0.66, 0.18, wallMat, 0, 2.75, 2.7, { outline: 0.003 });
  addBox(bands, 5.6, 0.22, 0.18, wallShade, 0, 0.17, 2.7);
  addBox(bands, 0.18, 0.66, 5.4, wallMat, 2.79, 2.75, 0, { outline: 0.003 });
  addBox(bands, 0.18, 0.22, 5.4, wallShade, 2.79, 0.17, 0);
  addBox(bands, 5.6, 0.12, 5.4, tealMat, 0, 3.04, 0);
  addBox(bands, 5.6, 0.05, 5.4, trimMat, 0, 3.12, 0);
  builder.drop(bands, 2.02, 0.6, { dist: 0.55, ease: 'outCubic' });

  // 店铺正面门头（雨棚上方的白墙）
  addBox(bands, 5.5, 0.52, 0.2, wallMat, 0, 3.3, 2.68, { outline: 0.003 });

  /* ---------------------------- 玻璃幕墙 ---------------------------- */
  const glazing = new THREE.Group();
  glazing.position.set(0, 0, 0);
  store.add(glazing);
  env.storeParts.glazing = glazing;

  const glassPane = (w, h, x, y, z, ry = 0, opacity = 0.085) => {
    const mat = art.glassMat.clone();
    mat.opacity = opacity;
    addPlane(glazing, w, h, mat, x, y, z, { ry });
    const refl = art.glassStreakMat.clone();
    refl.opacity = 0.2;
    addPlane(glazing, w, h, refl, x + (ry ? 0.004 : 0), y, z + (ry ? 0 : 0.004), { ry });
  };

  // 正立面：左大窗 + 小窗 + 自动门 + 转角窗
  const frontZ = 2.7;
  glassPane(3.5, 2.14, -0.79, 1.35, frontZ, 0, 0.075);
  glassPane(0.5, 2.14, 2.33, 1.35, frontZ, 0, 0.075);
  // 右侧立面
  glassPane(5.1, 2.14, 2.79, 1.35, 0, Math.PI / 2, 0.075);

  // 竖框
  const mullions = new THREE.Group();
  glazing.add(mullions);
  const mullMat = art.toon(0x535b66);
  for (const x of [-2.58, -1.2, 0.15, 0.98, 2.08, 2.56]) {
    addBox(mullions, 0.07, 2.24, 0.1, mullMat, x, 1.35, 2.7, { outline: 0.002 });
  }
  for (const z of [-2.56, -1.3, 0, 1.3, 2.56]) {
    addBox(mullions, 0.1, 2.24, 0.07, mullMat, 2.79, 1.35, z, { outline: 0.002 });
  }
  addBox(mullions, 0.16, 2.24, 0.16, mullMat, 2.79, 1.35, 2.7);
  // 玻璃横档
  addBox(mullions, 5.5, 0.07, 0.1, mullMat, 0, 1.98, 2.7);
  addBox(mullions, 0.1, 0.07, 5.3, mullMat, 2.79, 1.98, 0);

  // 自动门
  const door = new THREE.Group();
  door.position.set(1.55, 0.06, 2.68);
  glazing.add(door);
  addBox(door, 1.06, 0.06, 0.13, mullMat, 0, 2.37, 0);
  const panelMat = art.glassMat.clone();
  panelMat.opacity = 0.12;
  const panel = (x, z) => {
    addPlane(door, 0.44, 2.2, panelMat, x, 1.16, z);
    addBox(door, 0.05, 2.24, 0.06, mullMat, x - 0.245, 1.16, z);
    addBox(door, 0.05, 2.24, 0.06, mullMat, x + 0.245, 1.16, z);
    addBox(door, 0.49, 0.05, 0.06, mullMat, x, 2.28, z);
    addBox(door, 0.49, 0.05, 0.06, mullMat, x, 0.05, z);
    addBox(door, 0.03, 0.5, 0.05, whiteMetal, x + 0.19, 1.15, z + 0.04);
  };
  panel(-0.27, 0.012);
  panel(0.27, 0.045);
  const decalMat = new THREE.MeshBasicMaterial({
    map: doorDecal(), transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
  });
  addPlane(door, 1.0, 0.25, decalMat, 0, 2.1, 0.07);

  builder.drop(glazing, 4.25, 0.95, { dist: 1.7, ease: 'outCubic' });

  // 大门地垫
  const matTex = canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#26333b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#4c666c';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#cfe8e2';
    ctx.font = '600 54px "Yu Gothic", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('いらっしゃいませ', w / 2, h / 2 + 18);
  });
  const storeDecor = new THREE.Group();
  store.add(storeDecor);
  const matMesh = addBox(storeDecor, 1.05, 0.018, 0.66, art.toon(0xffffff, { map: matTex }), 1.55, 0.045, 2.98);
  matMesh.castShadow = false;

  // 窗贴
  const posterMat1 = new THREE.MeshBasicMaterial({
    map: windowPoster('24H', 'OPEN', '#e0554a'), transparent: true, depthWrite: false, toneMapped: false,
  });
  const posterMat2 = new THREE.MeshBasicMaterial({
    map: windowPoster('ATM', '24時間', '#1aa7a2'), transparent: true, depthWrite: false, toneMapped: false,
  });
  addPlane(storeDecor, 0.44, 0.55, posterMat1, -2.2, 1.35, 2.716);
  addPlane(storeDecor, 0.4, 0.5, posterMat2, -1.72, 1.35, 2.716);
  addPlane(storeDecor, 0.44, 0.55, posterMat2, 2.77, 1.4, 1.9, { ry: Math.PI / 2 });
  builder.drop(storeDecor, 4.55, 0.8, { dist: 0.7, ease: 'outCubic' });

  /* ------------------------------ 雨棚 ------------------------------ */
  const canopy = new THREE.Group();
  canopy.position.set(0, 0, 0);
  store.add(canopy);
  env.storeParts.canopy = canopy;
  addBox(canopy, 5.95, 0.12, 1.16, trimMat, 0, 2.56, 3.24, { outline: 0.004 });
  addBox(canopy, 5.95, 0.2, 0.07, tealMat, 0, 2.48, 3.79);
  addBox(canopy, 5.85, 0.05, 1.04, art.toon(0xd8d4c9), 0, 2.49, 3.22);
  // 雨棚下的灯带
  for (let i = 0; i < 4; i++) {
    addBox(canopy, 1.05, 0.025, 0.42, art.neon(0xffeec6), -2.1 + i * 1.4, 2.47, 3.25, { cast: false });
  }
  // 斜撑
  for (const x of [-2.55, 2.55]) {
    addTube(canopy, new THREE.Vector3(x, 2.85, 2.74), new THREE.Vector3(x * 0.93, 2.54, 3.72), 0.028, darkMetal, 6);
  }
  const canopyLabel = new THREE.MeshBasicMaterial({
    map: canopyText(), transparent: true, depthWrite: false, toneMapped: false,
  });
  addPlane(canopy, 5.6, 0.18, canopyLabel, 0, 2.48, 3.83);
  builder.drop(canopy, 4.72, 0.95, { dist: 1.5, ease: 'outBack' });

  /* ------------------------------ 招牌 ------------------------------ */
  const sign = new THREE.Group();
  sign.position.set(0, 3.45, 2.84);
  store.add(sign);
  env.storeParts.sign = sign;
  addBox(sign, 5.45, 0.94, 0.18, tealMat, 0, 0, 0, { outline: 0.005 });
  const signMat = new THREE.MeshBasicMaterial({ map: signTexture(), toneMapped: false });
  addPlane(sign, 5.36, 0.8, signMat, 0, 0, 0.096);
  env.storeNeon.push({ mat: signMat, base: new THREE.Color(0xffffff), kind: 'steady' });
  addBox(sign, 5.5, 0.035, 0.2, art.neon(0xa8f4ec), 0, 0.49, 0.0, { cast: false });
  addBox(sign, 5.5, 0.035, 0.2, art.neon(0xa8f4ec), 0, -0.49, 0.0, { cast: false });
  for (const x of [-2.0, 2.0]) {
    addBox(sign, 0.1, 0.1, 0.5, art.toon(0x4a525d), x, -0.2, -0.32);
  }
  builder.drop(sign, 5.12, 0.9, { dist: 1.3, ease: 'outBack' });

  // 竖向灯箱（转角挑出）
  const blade = new THREE.Group();
  blade.position.set(3.02, 2.72, 1.2);
  store.add(blade);
  env.storeParts.blade = blade;
  addBox(blade, 0.56, 1.86, 0.16, tealMat, 0, 0, 0, { outline: 0.004 });
  const bladeMat = new THREE.MeshBasicMaterial({ map: verticalSignTexture(), toneMapped: false });
  addPlane(blade, 0.48, 1.76, bladeMat, 0, 0, 0.086);
  addPlane(blade, 0.48, 1.76, bladeMat, 0, 0, -0.086, { ry: Math.PI });
  env.storeNeon.push({ mat: bladeMat, base: new THREE.Color(0xffffff), kind: 'steady' });
  addBox(blade, 0.5, 0.06, 0.2, darkMetal, 0, 0.95, -0.1);
  addBox(blade, 0.5, 0.06, 0.2, darkMetal, 0, -0.95, -0.1);
  addBox(blade, 0.42, 0.07, 0.3, darkMetal, -0.5, 0.86, 0);
  addBox(blade, 0.42, 0.07, 0.3, darkMetal, -0.5, -0.86, 0);
  builder.drop(blade, 5.24, 0.85, { dist: 1.1, ease: 'outBack' });

  /* ------------------------------ 屋顶 ------------------------------ */
  const roof = new THREE.Group();
  store.add(roof);
  env.storeParts.roof = roof;
  addBox(roof, 5.78, 0.16, 5.56, art.toon(0x6d747e), 0, 3.28, 0, { outline: 0.004 });
  const paraMat = art.toon(0xd7d3c7);
  addBox(roof, 5.78, 0.26, 0.12, paraMat, 0, 3.48, 2.74);
  addBox(roof, 5.78, 0.26, 0.12, paraMat, 0, 3.48, -2.74);
  addBox(roof, 0.12, 0.26, 5.56, paraMat, 2.83, 3.48, 0);
  addBox(roof, 0.12, 0.26, 5.56, paraMat, -2.83, 3.48, 0);

  // 屋顶空调与风机
  const roofAcMat = art.toon(0xb9bec4);
  const fanMat = art.toon(0x555d68);
  const roofUnit = (x, z, w, d, ry = 0) => {
    const g = new THREE.Group();
    g.position.set(x, 3.36, z);
    g.rotation.y = ry;
    roof.add(g);
    addBox(g, w, 0.52, d, roofAcMat, 0, 0.26, 0, { outline: 0.003 });
    addCyl(g, d * 0.34, d * 0.34, 0.04, fanMat, 0, 0.54, 0, { seg: 18, rx: Math.PI / 2 });
    addCyl(g, d * 0.28, d * 0.28, 0.02, art.toon(0x2f353d), 0, 0.56, 0, { seg: 18, rx: Math.PI / 2 });
    for (let i = 0; i < 5; i++) {
      addBox(g, d * 0.52, 0.02, 0.03, fanMat, 0, 0.57, -d * 0.26 + i * (d * 0.13));
    }
    addBox(g, w + 0.04, 0.05, d + 0.04, art.toon(0x8d939b), 0, 0.03, 0);
    return g;
  };
  roofUnit(1.5, -1.1, 1.15, 0.8);
  roofUnit(-1.4, -1.6, 0.95, 0.75, Math.PI / 2);
  roofUnit(1.2, 1.5, 0.7, 0.55);

  // 天线、排气管
  addCyl(roof, 0.02, 0.03, 1.25, darkMetal, -1.95, 4.0, 1.9, { seg: 6 });
  addBox(roof, 0.7, 0.02, 0.02, darkMetal, -1.6, 4.4, 1.9, { rotY: 0, rz: 0 });
  addBox(roof, 0.5, 0.02, 0.02, darkMetal, -1.95, 4.2, 1.9);
  addCyl(roof, 0.09, 0.09, 0.55, steelMat, 0.3, 3.62, 2.4, { seg: 10 });
  addCyl(roof, 0.13, 0.13, 0.06, darkMetal, 0.3, 3.92, 2.4, { seg: 10 });
  addBox(roof, 0.7, 0.5, 0.5, art.toon(0x9ca2a9), -2.3, 3.62, -1.6, { outline: 0.003 });
  addCyl(roof, 0.16, 0.16, 0.06, fanMat, -2.3, 3.5, -1.3, { seg: 14, rx: Math.PI / 2 });
  builder.drop(roof, 3.98, 1.0, { dist: 2.6, ease: 'outCubic' });

  /* -------------------------- 背面服务设施 -------------------------- */
  const back = new THREE.Group();
  store.add(back);
  addBox(back, 0.92, 2.02, 0.08, art.toon(0x707a86), -0.9, 1.07, -2.82, { outline: 0.003 });
  addBox(back, 0.98, 0.08, 0.3, art.toon(0x505a66), -0.9, 2.12, -2.82);
  addPlane(back, 0.52, 0.18, art.neon(0xffd8a0), -0.9, 2.3, -2.79);
  addBox(back, 0.06, 2.0, 0.06, art.toon(0x4b535e), -1.45, 1.06, -2.76);
  addBox(back, 0.5, 0.6, 0.06, art.toon(0x3f4650), 1.8, 1.2, -2.78);
  // 背面室外机
  const acMat = art.toon(0xc3c7cc);
  for (const x of [-1.9, 1.1]) {
    addBox(back, 0.72, 0.52, 0.34, acMat, x, 0.78, -2.98, { outline: 0.002 });
    addCyl(back, 0.19, 0.19, 0.02, fanMat, x, 0.78, -3.16, { seg: 16, rx: Math.PI / 2 });
  }
  addBox(back, 0.9, 0.5, 0.7, art.toon(0xb4b8bd), 0.2, 0.37, -3.25, { outline: 0.002 });
  addBox(back, 0.55, 0.55, 0.4, art.toon(0x7d838b), -1.1, 0.4, -3.3);
  builder.drop(back, 3.6, 0.8, { dist: 0.9, ease: 'outCubic' });

  /* -------------------------- 侧墙与小巷设施 -------------------------- */
  const side = new THREE.Group();
  store.add(side);
  // 空调外机（左侧小巷墙面）
  for (const z of [-0.6, 0.8]) {
    addBox(side, 0.34, 0.52, 0.72, art.toon(0xc3c7cc), -2.98, 1.72, z, { outline: 0.002 });
    addCyl(side, 0.19, 0.19, 0.02, fanMat, -3.16, 1.72, z, { seg: 16, rz: Math.PI / 2 });
    addBox(side, 0.05, 0.55, 0.8, art.toon(0x7d838b), -2.9, 1.42, z);
  }
  // 管道与电表
  addCyl(side, 0.04, 0.04, 3.0, art.toon(0x8a9099), -2.93, 1.6, 2.1, { seg: 8 });
  addCyl(side, 0.04, 0.04, 2.6, art.toon(0x8a9099), -2.93, 1.4, -1.9, { seg: 8 });
  addBox(side, 0.28, 0.4, 0.12, art.toon(0x5a626d), -2.94, 1.3, 1.55);
  addBox(side, 0.22, 0.28, 0.1, art.toon(0x767e8a), -2.94, 0.85, -1.5);
  builder.drop(side, 3.9, 0.8, { dist: 1.0, ease: 'outCubic' });

  /* ------------------------------ 室内 ------------------------------ */
  buildInterior(env, store);

  /* --------------------------- 细节与装饰 --------------------------- */
  // 门檐下的小灯
  addBox(canopy, 0.16, 0.08, 0.1, art.neon(0xfff0ca), 1.55, 2.43, 2.76, { cast: false });

  // 屋顶到招牌的检修梯
  const ladder = new THREE.Group();
  store.add(ladder);
  for (let i = 0; i < 6; i++) {
    addBox(ladder, 0.6, 0.03, 0.03, art.toon(0x646c77), 2.72, 2.45 + i * 0.25, 2.5);
  }
  addBox(ladder, 0.03, 1.5, 0.03, art.toon(0x646c77), 2.44, 3.15, 2.5);
  addBox(ladder, 0.03, 1.5, 0.03, art.toon(0x646c77), 3.0, 3.15, 2.5);
  builder.drop(ladder, 5.0, 0.75, { dist: 0.9, ease: 'outCubic' });
}

/* ------------------------------------------------------------------ *
 *  贴图化的小物
 * ------------------------------------------------------------------ */
export function makeVendingTexture(accent = '#e0554a') {
  return canvasTexture(512, 768, (ctx, w, h) => {
    ctx.fillStyle = '#f2f4f6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 54px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DRINK', w / 2, 78);
    ctx.fillStyle = '#252b33';
    ctx.fillRect(30, 150, w - 60, 360);
    ctx.fillStyle = '#343b45';
    ctx.fillRect(44, 164, w - 88, 332);
    ctx.fillStyle = '#d9dee2';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        ctx.fillStyle = ['#e0554a', '#4d9de0', '#f0b34a', '#6fc08a', '#e8e2d4'][(r + c) % 5];
        ctx.fillRect(62 + c * 76, 186 + r * 100, 56, 66);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(62 + c * 76, 186 + r * 100, 56, 10);
      }
    }
    ctx.fillStyle = '#cdd3d9';
    ctx.fillRect(52, 540, 130, 70);
    ctx.fillStyle = '#8f979f';
    ctx.font = '600 22px "Arial", sans-serif';
    ctx.fillText('COIN', 117, 582);
    ctx.fillStyle = '#1d2229';
    ctx.fillRect(300, 540, 150, 92);
    ctx.fillStyle = '#9fe0da';
    ctx.fillRect(320, 560, 110, 12);
    ctx.fillStyle = '#dbe2e6';
    ctx.font = '500 20px "Yu Gothic", sans-serif';
    ctx.fillText('つめた〜い', w / 2, 730);
  });
}