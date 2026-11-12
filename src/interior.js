import * as THREE from 'three';
import { addBox, addCyl, addPlane, addSphere, canvasTexture } from './core.js';

/* ------------------------------------------------------------------ *
 *  便利店室内：冷柜、货架、杂志、收银台、热食柜、ATM、吊牌
 * ------------------------------------------------------------------ */

function hangSign(title, sub, bg, fg = '#ffffff') {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.font = '800 82px "Yu Gothic", "Arial Black", sans-serif';
    ctx.fillText(title, w / 2, 118);
    ctx.font = '600 34px "Yu Gothic", "Meiryo", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.fillText(sub, w / 2, 186);
  });
}

function fridgeHeader() {
  return canvasTexture(1024, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#e9fbff');
    g.addColorStop(1, '#a9dcec');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0e5f6a';
    ctx.textAlign = 'center';
    ctx.font = '900 62px "Arial Black", sans-serif';
    ctx.fillText('DRINKS', 300, 86);
    ctx.font = '700 44px "Yu Gothic", sans-serif';
    ctx.fillText('つめた〜い', 740, 84);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 22px "Yu Gothic", sans-serif';
    ctx.fillText('COLD BEVERAGE', 300, 116);
  });
}

function tobaccoHeader() {
  return canvasTexture(512, 96, (ctx, w, h) => {
    ctx.fillStyle = '#272c33';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f6f2e9';
    ctx.textAlign = 'center';
    ctx.font = '700 44px "Yu Gothic", sans-serif';
    ctx.fillText('たばこ  TASSPO', w / 2, 62);
  });
}

function atmFace() {
  return canvasTexture(160, 220, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2a6fbd');
    g.addColorStop(1, '#123a6b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d7f0ff';
    ctx.textAlign = 'center';
    ctx.font = '900 40px "Arial Black", sans-serif';
    ctx.fillText('ATM', w / 2, 60);
    ctx.fillStyle = '#0b1a2b';
    ctx.fillRect(20, 84, w - 40, 60);
    ctx.fillStyle = '#7fd8ff';
    ctx.font = '600 16px "Arial", sans-serif';
    ctx.fillText('WELCOME', w / 2, 110);
    ctx.fillStyle = '#d7f0ff';
    ctx.font = '500 13px "Yu Gothic", sans-serif';
    ctx.fillText('24時間 ご利用いただけます', w / 2, 170);
    ctx.fillStyle = '#8fe6a8';
    ctx.fillRect(46, 186, 68, 12);
  });
}

function magazineCover(seed, bg, accent) {
  return canvasTexture(160, 220, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 34px "Yu Gothic", "Arial Black", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(['ANIME', 'CITY', 'GAME', 'MODEL', 'TRAVEL', 'FOOD'][seed % 6], 12, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(12, 66, w - 24, h - 130);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px "Yu Gothic", sans-serif';
    ctx.fillText(['特集', '新作', '夏号', '保存版'][seed % 4], 16, 110);
    ctx.fillStyle = accent;
    ctx.fillRect(12, h - 46, w - 24, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px "Arial", sans-serif';
    ctx.fillText('2026 / NIGHT', 16, h - 26);
  });
}

export function buildInterior(env, store) {
  const { art, builder } = env;
  const interior = new THREE.Group();
  store.add(interior);
  env.storeParts.interior = interior;

  const warmWall = art.toon(0xe6d8b8, { emissive: 0x4a3418, emissiveIntensity: 0.62 });
  const warmFloor = art.toon(0xd9cbae, {
    map: art.textures.floorTile.clone(),
    emissive: 0x3a2a10,
    emissiveIntensity: 0.42,
  });
  warmFloor.map.repeat.set(7, 7);
  warmFloor.map.needsUpdate = true;
  const ceilingMat = art.toon(0xf2ead2, { emissive: 0x55401e, emissiveIntensity: 0.6 });
  const shelfMat = art.toon(0xd6d0be, { emissive: 0x2b2216, emissiveIntensity: 0.26 });
  const shelfTrim = art.toon(0xb6b3aa);
  const counterMat = art.toon(0xece2cb, { emissive: 0x453218, emissiveIntensity: 0.46 });
  const counterDark = art.toon(0x4b5561);
  const basketMat = art.toon(0x2f8d86);

  /* ---------------------------- 室内地台 ---------------------------- */
  const floorGroup = new THREE.Group();
  interior.add(floorGroup);
  addPlane(floorGroup, 5.36, 5.16, warmFloor, 0, 0.062, 0, { rx: -Math.PI / 2, receive: true });
  // 入口地垫
  const entryMatTex = canvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1e3b3c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#7fded4';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = '#d9f7f2';
    ctx.textAlign = 'center';
    ctx.font = '600 28px "Yu Gothic", sans-serif';
    ctx.fillText('WELCOME', w / 2, h / 2 + 10);
  });
  addBox(floorGroup, 1.0, 0.012, 0.5, art.toon(0xffffff, { map: entryMatTex }), 1.55, 0.07, 2.28);
  builder.rise(floorGroup, 2.2, 0.7, { dist: 0.35, ease: 'outCubic' });

  /* ---------------------------- 天花板与灯 ---------------------------- */
  const ceiling = new THREE.Group();
  interior.add(ceiling);
  addBox(ceiling, 5.3, 0.08, 5.1, ceilingMat, 0, 2.99, 0);
  addBox(ceiling, 5.28, 0.04, 5.08, art.toon(0xd8d4c8), 0, 2.945, 0);
  const panelMat = art.neon(0xfff3d6);
  const panelPositions = [];
  for (const x of [-1.3, 1.3]) {
    for (const z of [-1.8, -0.6, 0.6, 1.8]) {
      addBox(ceiling, 1.05, 0.035, 0.46, panelMat, x, 2.918, z, { cast: false });
      const g = new THREE.Group();
      g.position.set(x, 2.9, z);
      ceiling.add(g);
      const p = addPlane(g, 1.2, 0.6, art.glowMat(0xffe9bf, 0.05), 0, 0, 0, { rx: Math.PI / 2 });
      p.renderOrder = 2;
      panelPositions.push(g);
    }
  }
  // 天花板管线
  addBox(ceiling, 5.0, 0.05, 0.05, art.toon(0xc2beb2), 0, 2.88, -2.2);
  addBox(ceiling, 0.05, 0.05, 4.9, art.toon(0xc2beb2), -2.4, 2.86, 0);
  builder.drop(ceiling, 2.3, 0.85, { dist: 1.3, ease: 'outCubic' });

  // 内墙饰面
  const innerShell = new THREE.Group();
  interior.add(innerShell);
  addPlane(innerShell, 5.3, 2.9, warmWall, 0, 1.55, -2.59);
  addBox(innerShell, 5.3, 0.12, 0.06, art.toon(0xc9c3b4), 0, 0.12, -2.57);
  builder.drop(innerShell, 2.24, 0.7, { dist: 0.9, ease: 'outCubic' });

  /* ---------------------------- 冷柜墙 ---------------------------- */
  const fridges = new THREE.Group();
  interior.add(fridges);
  const fridgeCenters = [-1.45, -0.5, 0.45, 1.4];
  const bottleGeo = new THREE.CylinderGeometry(0.03, 0.028, 0.15, 7);
  const bottleMat = art.toon(0xffffff);
  const drinkColors = [0xd93b2b, 0x2a72c4, 0xdcae2e, 0x3aa86a, 0xeee2c6, 0xc2498f, 0x6f4bc4];

  for (let i = 0; i < fridgeCenters.length; i++) {
    const zc = fridgeCenters[i];
    const unit = new THREE.Group();
    unit.position.set(0, 0.06, zc);
    fridges.add(unit);

    // 内发光背板
    addPlane(unit, 0.87, 1.9, new THREE.MeshBasicMaterial({ color: 0xbfeaf5, toneMapped: true }), -2.665, 1.05, 0, { ry: Math.PI / 2 });
    // 柜体框架
    addBox(unit, 0.54, 0.06, 0.9, shelfTrim, -2.42, 0.04, 0);
    addBox(unit, 0.54, 0.06, 0.9, shelfTrim, -2.42, 2.03, 0);
    addBox(unit, 0.5, 1.95, 0.045, shelfTrim, -2.44, 1.03, 0.445);
    addBox(unit, 0.5, 1.95, 0.045, shelfTrim, -2.44, 1.03, -0.445);
    addBox(unit, 0.5, 1.95, 0.06, shelfTrim, -2.68, 1.03, 0);
    // 层板与灯条
    for (const y of [0.52, 1.02, 1.52]) {
      addBox(unit, 0.46, 0.025, 0.86, shelfTrim, -2.42, y, 0);
      addBox(unit, 0.02, 0.02, 0.84, art.neon(0xd6f6ff), -2.2, y + 0.03, 0, { cast: false });
    }

    // 饮料（实例化）
    const count = 36;
    const inst = new THREE.InstancedMesh(bottleGeo, bottleMat, count);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    let n = 0;
    for (const y of [0.52, 1.02, 1.52]) {
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 6; c++) {
          dummy.position.set(-2.55 + r * 0.15, y + 0.09, -0.32 + c * 0.125);
          dummy.rotation.y = (i + r + c) * 0.2;
          dummy.scale.setScalar(0.9 + ((i * 7 + r * 3 + c) % 3) * 0.08);
          dummy.updateMatrix();
          inst.setMatrixAt(n, dummy.matrix);
          col.setHex(drinkColors[(i + r + c) % drinkColors.length]);
          inst.setColorAt(n, col);
          n++;
        }
      }
    }
    inst.castShadow = true;
    inst.receiveShadow = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    unit.add(inst);

    // 玻璃门
    const door = art.glassMat.clone();
    door.opacity = 0.16;
    addPlane(unit, 0.87, 1.9, door, -2.155, 1.05, 0, { ry: Math.PI / 2 });
    addBox(unit, 0.04, 1.94, 0.06, shelfTrim, -2.158, 1.05, 0.43);
    addBox(unit, 0.04, 1.94, 0.06, shelfTrim, -2.158, 1.05, -0.43);
    addBox(unit, 0.04, 0.06, 0.86, shelfTrim, -2.158, 2.01, 0);
    addBox(unit, 0.04, 0.06, 0.86, shelfTrim, -2.158, 0.1, 0);
    addBox(unit, 0.03, 0.5, 0.045, art.toon(0x767d87), -2.13, 1.1, 0.35);

    builder.grow(unit, 2.5 + i * 0.09, 0.75, { ease: 'outCubic' });
  }

  // 冷柜灯箱
  const headerTex = fridgeHeader();
  const headerMat = new THREE.MeshBasicMaterial({ map: headerTex, toneMapped: false });
  const header = addPlane(fridges, 3.8, 0.28, headerMat, -2.14, 2.24, -0.02, { ry: Math.PI / 2 });
  header.material.side = THREE.DoubleSide;
  const headerBar = addBox(fridges, 0.1, 0.34, 3.9, art.toon(0xd8d4c8), -2.19, 2.24, -0.02);
  builder.drop(headerBar, 2.92, 0.55, { dist: 0.5, ease: 'outCubic' });
  builder.drop(header, 2.92, 0.55, { dist: 0.5, ease: 'outCubic' });

  /* ---------------------------- 中岛货架 ---------------------------- */
  const goodsColors = [0xd93b2b, 0xe8892a, 0x2a72c4, 0x3aa86a, 0xdcb820, 0xc2498f, 0xf0e6cf, 0x6f4bc4, 0x2aa3a8];

  function gondola(x, z, length, at) {
    const g = new THREE.Group();
    g.position.set(x, 0.06, z);
    interior.add(g);

    addBox(g, length, 0.1, 0.62, shelfMat, 0, 0.05, 0);
    addBox(g, length, 1.24, 0.05, shelfMat, 0, 0.68, 0);
    addBox(g, 0.05, 1.3, 0.6, shelfTrim, -length / 2 + 0.03, 0.68, 0);
    addBox(g, 0.05, 1.3, 0.6, shelfTrim, length / 2 - 0.03, 0.68, 0);

    const levels = [0.33, 0.72, 1.11];
    const perSide = Math.max(6, Math.floor(length / 0.16));
    const count = levels.length * 2 * perSide;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const inst = new THREE.InstancedMesh(geo, art.toon(0xffffff), count);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    let n = 0;

    for (const y of levels) {
      for (const side of [-1, 1]) {
        addBox(g, length - 0.1, 0.025, 0.28, shelfTrim, 0, y, side * 0.17);
        addBox(g, length - 0.12, 0.02, 0.02, art.neon(0xf5fbff), 0, y + 0.015, side * 0.3, { cast: false });
        for (let c = 0; c < perSide; c++) {
          const px = -length / 2 + 0.16 + c * ((length - 0.3) / (perSide - 1));
          const h = 0.12 + ((c * 7 + n * 3) % 5) * 0.022;
          const w = 0.075 + ((c + n) % 3) * 0.012;
          dummy.position.set(px, y + 0.02 + h / 2, side * (0.17 + ((c + n) % 2) * 0.03));
          dummy.scale.set(w, h, 0.075);
          dummy.rotation.y = ((c + n) % 4) * 0.04;
          dummy.updateMatrix();
          inst.setMatrixAt(n, dummy.matrix);
          col.setHex(goodsColors[(c + n * 2) % goodsColors.length]);
          inst.setColorAt(n, col);
          n++;
        }
      }
    }
    inst.castShadow = true;
    inst.receiveShadow = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    g.add(inst);

    // 价签条
    for (const y of levels) {
      for (const side of [-1, 1]) {
        addBox(g, length - 0.12, 0.045, 0.012, art.toon(0xf7f4ea), 0, y - 0.04, side * 0.305, { cast: false });
      }
    }
    builder.grow(g, at, 0.85, { ease: 'outCubic' });
  }

  gondola(-1.15, -0.55, 1.9, 2.95);
  gondola(-1.15, 0.55, 1.9, 3.1);

  /* ---------------------------- 杂志架 ---------------------------- */
  const magazineRack = new THREE.Group();
  magazineRack.position.set(-0.9, 0.06, 2.12);
  interior.add(magazineRack);
  addBox(magazineRack, 2.1, 0.09, 0.42, shelfTrim, 0, 0.05, 0);
  addBox(magazineRack, 2.1, 0.72, 0.06, shelfMat, 0, 0.42, -0.18, { rx: 0.18 });
  addBox(magazineRack, 2.1, 0.62, 0.06, shelfMat, 0, 0.8, -0.1, { rx: 0.2 });
  addBox(magazineRack, 2.1, 0.05, 0.42, shelfTrim, 0, 0.72, 0.02);
  const mags = [
    magazineCover(0, '#e7ddc8', '#d34d43'), magazineCover(1, '#c9d8e8', '#305d91'),
    magazineCover(2, '#e7d3d8', '#a54364'), magazineCover(3, '#d6e3d1', '#3b7d5b'),
    magazineCover(4, '#e8dfc9', '#c98b32'), magazineCover(5, '#d9d2e8', '#6a4ea3'),
  ];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.MeshBasicMaterial({ map: mags[i], toneMapped: true });
    const p = addPlane(magazineRack, 0.23, 0.31, m, -0.82 + i * 0.28, 0.44, 0.11, { rx: -0.16 });
    p.position.y += 0.02;
    const p2 = addPlane(magazineRack, 0.23, 0.31, m, -0.82 + i * 0.28, 0.83, 0.02, { rx: -0.18 });
    p2.scale.setScalar(0.92);
  }
  addBox(magazineRack, 2.1, 0.03, 0.04, art.neon(0xfff1c8), 0, 1.16, -0.18, { cast: false });
  builder.grow(magazineRack, 3.35, 0.8, { ease: 'outCubic' });

  /* ---------------------------- 收银台 ---------------------------- */
  const counter = new THREE.Group();
  counter.position.set(0, 0.06, 0);
  interior.add(counter);
  env.storeParts.counter = counter;

  addBox(counter, 2.42, 0.8, 0.56, counterMat, 1.36, 0.43, -1.7, { outline: 0.003 });
  addBox(counter, 2.48, 0.05, 0.64, art.toon(0xeeeae0), 1.36, 0.855, -1.7);
  addBox(counter, 2.42, 0.16, 0.03, art.toon(0x39a39b), 1.36, 0.22, -1.42);
  addBox(counter, 0.9, 0.03, 0.42, art.toon(0xd7d3c8), 0.66, 0.895, -1.68);
  addBox(counter, 1.7, 0.04, 0.04, art.neon(0xfff0cf), 1.36, 1.34, -2.35, { cast: false });

  // 热食柜
  const hot = new THREE.Group();
  hot.position.set(0.68, 0.88, -1.68);
  counter.add(hot);
  addBox(hot, 0.74, 0.09, 0.44, art.toon(0xb9bcc0), 0, 0.04, 0);
  addBox(hot, 0.74, 0.04, 0.44, art.neon(0xffb46a), 0, 0.11, 0);
  addBox(hot, 0.72, 0.26, 0.06, art.glassMat, 0, 0.3, 0.2);
  addBox(hot, 0.06, 0.26, 0.4, art.glassMat, 0.36, 0.3, 0);
  const hotFood = art.toon(0xe3a05a);
  for (let i = 0; i < 4; i++) {
    addCyl(hot, 0.035, 0.035, 0.1, hotFood, -0.25 + i * 0.16, 0.18, 0.02, { seg: 8 });
    addSphereSafe(hot, 0.04, art.toon(0xd8874a), -0.25 + i * 0.16, 0.24, 0.02);
  }
  function addSphereSafe(parent, r, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat);
    m.position.set(x, y, z);
    parent.add(m);
  }
  addBox(hot, 0.5, 0.01, 0.03, art.neon(0xffd08a), 0, 0.25, 0.235, { cast: false });
  const hotSign = new THREE.MeshBasicMaterial({
    map: canvasTexture(256, 96, (ctx, w, h) => {
      ctx.fillStyle = '#d94f3f';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff3df';
      ctx.font = '900 42px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOT', w / 2, 46);
      ctx.font = '600 22px "Yu Gothic", sans-serif';
      ctx.fillText('おでん・フライド', w / 2, 76);
    }),
    toneMapped: false,
  });
  addPlane(hot, 0.4, 0.15, hotSign, 0, 0.62, 0.1);

  // 收银机
  addBox(counter, 0.34, 0.05, 0.26, art.toon(0x353b43), 1.6, 0.915, -1.66);
  addBox(counter, 0.08, 0.3, 0.08, art.toon(0x4d545e), 1.6, 1.06, -1.72);
  const screenMat = new THREE.MeshBasicMaterial({
    map: canvasTexture(192, 128, (ctx, w, h) => {
      ctx.fillStyle = '#0f2b3a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#82e7d7';
      ctx.font = '600 18px "Arial", sans-serif';
      ctx.fillText('HIKARI POS', 16, 32);
      ctx.fillStyle = '#c8f6ef';
      ctx.font = '700 26px "Arial", sans-serif';
      ctx.fillText('¥ 1,280', 16, 74);
      ctx.fillStyle = '#5e8f99';
      ctx.fillText('TOTAL', 16, 104);
    }),
    toneMapped: false,
  });
  addPlane(counter, 0.3, 0.2, screenMat, 1.6, 1.28, -1.6, { rx: -0.12 });
  addBox(counter, 0.32, 0.02, 0.18, art.toon(0x6b727c), 1.34, 0.885, -1.55);

  // 咖啡机
  addBox(counter, 0.4, 0.62, 0.4, art.toon(0x3d444c), 2.22, 1.19, -1.7, { outline: 0.003 });
  addPlane(counter, 0.24, 0.16, art.neon(0x9fe8ff), 2.22, 1.32, -1.49);
  addBox(counter, 0.16, 0.03, 0.1, art.toon(0x22262c), 2.22, 0.89, -1.54);
  addCyl(counter, 0.035, 0.03, 0.08, art.toon(0xf1ede2), 2.32, 0.93, -1.6, { seg: 8 });
  addCyl(counter, 0.035, 0.03, 0.08, art.toon(0xf1ede2), 2.32, 0.93, -1.72, { seg: 8 });

  // 柜台下的篮子
  addBox(counter, 0.5, 0.3, 0.35, basketMat, 0.55, 0.2, -1.7);
  addBox(counter, 0.46, 0.04, 0.3, art.toon(0x63b8b0), 0.55, 0.36, -1.7);

  // 后柜 / 香烟架
  addBox(counter, 2.5, 1.3, 0.16, art.toon(0x353b43), 1.32, 1.5, -2.5, { outline: 0.003 });
  const cigGeo = new THREE.BoxGeometry(0.075, 0.1, 0.045);
  const cigInst = new THREE.InstancedMesh(cigGeo, art.toon(0xffffff), 40);
  cigInst.castShadow = true;
  const cigDummy = new THREE.Object3D();
  const cigCol = new THREE.Color();
  const cigColors = [0xe8e3d6, 0xd94f43, 0x4a8ad0, 0xe9b84c, 0x7bc47f, 0xc6c9ce, 0x9a7be0];
  let cn = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 10; c++) {
      cigDummy.position.set(0.28 + c * 0.21, 0.97 + r * 0.26, -2.4);
      cigDummy.updateMatrix();
      cigInst.setMatrixAt(cn, cigDummy.matrix);
      cigCol.setHex(cigColors[(r * 3 + c) % cigColors.length]);
      cigInst.setColorAt(cn, cigCol);
      cn++;
    }
  }
  if (cigInst.instanceColor) cigInst.instanceColor.needsUpdate = true;
  counter.add(cigInst);
  addPlane(counter, 2.3, 0.24, new THREE.MeshBasicMaterial({
    map: tobaccoHeader(), toneMapped: false,
  }), 1.32, 2.22, -2.4);

  builder.grow(counter, 3.25, 0.9, { ease: 'outCubic' });

  /* ---------------------------- ATM ---------------------------- */
  const atm = new THREE.Group();
  atm.position.set(-2.25, 0.06, -2.28);
  interior.add(atm);
  addBox(atm, 0.72, 1.5, 0.5, art.toon(0xd9d6cb), 0, 0.75, 0, { outline: 0.004 });
  addPlane(atm, 0.56, 0.78, new THREE.MeshBasicMaterial({ map: atmFace(), toneMapped: false }), 0, 1.0, 0.256);
  addBox(atm, 0.5, 0.14, 0.02, art.toon(0x8c949e), 0, 0.55, 0.256);
  addBox(atm, 0.55, 0.03, 0.02, art.neon(0x6fd3ff), 0, 1.48, 0.256, { cast: false });
  builder.drop(atm, 3.45, 0.8, { dist: 1.3, ease: 'outBack' });

  /* ---------------------------- 吊牌 ---------------------------- */
  const hangData = [
    { title: 'ATM', sub: '24時間', bg: '#2a6fbd', x: -2.0, z: -0.2 },
    { title: 'おでん', sub: 'HOT FOOD', bg: '#d9543f', x: -0.2, z: 0.9 },
    { title: 'COFFEE', sub: 'HOT / ICE', bg: '#1aa7a2', x: 1.9, z: 0.6 },
  ];
  for (let i = 0; i < hangData.length; i++) {
    const hd = hangData[i];
    const g = new THREE.Group();
    g.position.set(hd.x, 2.06, hd.z);
    interior.add(g);
    const mat = new THREE.MeshBasicMaterial({ map: hangSign(hd.title, hd.sub, hd.bg), toneMapped: false, side: THREE.DoubleSide });
    addPlane(g, 0.72, 0.36, mat, 0, 0, 0);
    addBox(g, 0.72, 0.03, 0.06, art.toon(0x8a9099), 0, 0.19, 0);
    addBox(g, 0.03, 0.5, 0.02, art.toon(0x606873), -0.3, 0.45, 0);
    addBox(g, 0.03, 0.5, 0.02, art.toon(0x606873), 0.3, 0.45, 0);
    builder.drop(g, 3.6 + i * 0.08, 0.7, { dist: 0.8, ease: 'outBack' });
  }

  /* ---------------------------- 店内小物 ---------------------------- */
  // 购物篮
  const baskets = new THREE.Group();
  baskets.position.set(2.28, 0.06, 2.0);
  interior.add(baskets);
  for (let i = 0; i < 3; i++) {
    addBox(baskets, 0.5, 0.06, 0.36, basketMat, 0, 0.05 + i * 0.1, 0);
    addBox(baskets, 0.5, 0.14, 0.03, basketMat, 0, 0.13 + i * 0.1, 0.17);
    addBox(baskets, 0.5, 0.14, 0.03, basketMat, 0, 0.13 + i * 0.1, -0.17);
    addBox(baskets, 0.03, 0.14, 0.34, basketMat, 0.24, 0.13 + i * 0.1, 0);
    addBox(baskets, 0.03, 0.14, 0.34, basketMat, -0.24, 0.13 + i * 0.1, 0);
  }
  builder.pop(baskets, 3.75, 0.5, { ease: 'outBack' });

  // 小心地滑牌
  const wetFloor = new THREE.Group();
  wetFloor.position.set(0.9, 0.06, 1.62);
  interior.add(wetFloor);
  const yellowMat = art.toon(0xf2c341);
  const a = addBox(wetFloor, 0.42, 0.6, 0.02, yellowMat, 0, 0.3, -0.12, { rx: -0.26 });
  const b = addBox(wetFloor, 0.42, 0.6, 0.02, yellowMat, 0, 0.3, 0.12, { rx: 0.26 });
  addPlane(wetFloor, 0.3, 0.14, new THREE.MeshBasicMaterial({
    map: canvasTexture(192, 96, (ctx, w, h) => {
      ctx.fillStyle = '#f2c341';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#22262b';
      ctx.font = '800 30px "Yu Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('足元注意', w / 2, 56);
    }),
  }), 0, 0.3, 0.135, { rx: 0.26 });
  builder.pop(wetFloor, 3.8, 0.5, { ease: 'outBack' });

  // 小物与装饰（稍后出现）
  const decor = new THREE.Group();
  interior.add(decor);

  // 垃圾桶
  addBox(decor, 0.32, 0.5, 0.28, art.toon(0x39424d), 2.52, 0.31, 1.0, { outline: 0.002 });
  addBox(decor, 0.3, 0.03, 0.26, art.neon(0xd8e6ee), 2.52, 0.56, 1.0, { cast: false });

  // 天花摄像头
  addBox(decor, 0.18, 0.1, 0.18, art.toon(0x2f353d), 2.35, 2.85, 1.95);
  addSphere(decor, 0.05, art.toon(0x15191e), 2.35, 2.79, 2.0);
  addSphere(decor, 0.015, art.neon(0xff4d3f), 2.29, 2.85, 1.98);

  // 后墙整排商品架
  const backShelf = new THREE.Group();
  interior.add(backShelf);
  for (let r = 0; r < 3; r++) {
    const y = 0.5 + r * 0.56;
    addBox(backShelf, 3.4, 0.04, 0.34, shelfTrim, -0.5, y, -2.38);
    addBox(backShelf, 3.4, 0.02, 0.02, art.neon(0xf5fbff), -0.5, y + 0.03, -2.2, { cast: false });
  }
  const backGoods = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), art.toon(0xffffff), 90);
  const bgDummy = new THREE.Object3D();
  const bgCol = new THREE.Color();
  let bn = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 30; c++) {
      const y = 0.55 + r * 0.56;
      const h = 0.13 + ((c * 5 + r * 3) % 6) * 0.02;
      bgDummy.position.set(-2.16 + c * 0.112, y + h / 2, -2.36);
      bgDummy.scale.set(0.075, h, 0.075);
      bgDummy.rotation.y = ((c + r) % 4) * 0.05;
      bgDummy.updateMatrix();
      backGoods.setMatrixAt(bn, bgDummy.matrix);
      bgCol.setHex(goodsColors[(c * 2 + r * 5) % goodsColors.length]);
      backGoods.setColorAt(bn, bgCol);
      bn++;
    }
  }
  if (backGoods.instanceColor) backGoods.instanceColor.needsUpdate = true;
  backGoods.castShadow = true;
  backShelf.add(backGoods);
  builder.drop(backShelf, 3.15, 0.7, { dist: 0.5, ease: 'outCubic' });

  // 后墙装饰画
  addPlane(decor, 0.5, 0.65, new THREE.MeshBasicMaterial({ map: art.textures.posters[0], toneMapped: true }), -0.65, 1.85, -2.575);
  addPlane(decor, 0.5, 0.65, new THREE.MeshBasicMaterial({ map: art.textures.posters[3], toneMapped: true }), 2.1, 1.9, -2.575);
  addPlane(decor, 0.42, 0.56, new THREE.MeshBasicMaterial({ map: art.textures.posters[1], toneMapped: true }), 2.76, 1.72, -0.6, { ry: -Math.PI / 2 });

  // 收银台上方“24H”小灯牌
  addPlane(decor, 0.72, 0.3, new THREE.MeshBasicMaterial({
    map: canvasTexture(384, 160, (ctx, w, h) => {
      ctx.fillStyle = '#0b4d55';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#79e5da';
      ctx.font = '900 100px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('24H', w / 2, 112);
    }),
    toneMapped: false,
  }), 1.32, 2.62, -2.56);

  // 防犯贴纸
  addPlane(decor, 0.3, 0.4, new THREE.MeshBasicMaterial({
    map: canvasTexture(160, 220, (ctx, w, h) => {
      ctx.fillStyle = '#f6f2e6';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#d94f43';
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = '#d94f43';
      ctx.font = '800 30px "Yu Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('防犯', w / 2, 70);
      ctx.fillStyle = '#3a342c';
      ctx.font = '600 16px "Yu Gothic", sans-serif';
      ctx.fillText('カメラ作動中', w / 2, 120);
      ctx.beginPath();
      ctx.arc(w / 2, 160, 22, 0, Math.PI * 2);
      ctx.strokeStyle = '#3a342c';
      ctx.stroke();
    }),
    toneMapped: true,
  }), -0.1, 1.75, 2.69);

  builder.drop(decor, 3.9, 0.6, { dist: 0.5, ease: 'outCubic' });
}