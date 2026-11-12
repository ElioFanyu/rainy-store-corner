import * as THREE from 'three';
import { addBox, addCyl, addPlane, addSphere, canvasTexture } from './core.js';

/* ------------------------------------------------------------------ *
 *  左邻小酒馆（底座西缘）、窄巷入口、便利店后场
 *  小巷：x ∈ [-5.35, -4.64]，z ∈ [-6.25, 1.0]
 * ------------------------------------------------------------------ */

function norenTexture() {
  return canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = '#243b58';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e9edf3';
    ctx.font = '700 56px "Yu Gothic", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('さくら', w / 2, 92);
    ctx.fillStyle = 'rgba(233,237,243,0.35)';
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(w / 2 - 3, 0, 6, h);
  });
}

function izakayaSign() {
  return canvasTexture(220, 800, (ctx, w, h) => {
    ctx.fillStyle = '#f3e7cc';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b23a33';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#b23a33';
    ctx.textAlign = 'center';
    ctx.font = '800 86px "Yu Gothic", serif';
    ['酒', '処', 'さ', 'く', 'ら'].forEach((c, i) => ctx.fillText(c, w / 2, 130 + i * 128));
  });
}

function shutterTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#6d757f');
    g.addColorStop(1, '#454c56');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 10) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(0, y, w, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(0, y + 7, w, 2);
    }
  });
}

export function buildAlley(env) {
  const { art, root, builder } = env;

  /* ------------------------------ 左邻建筑 ------------------------------ */
  const neighbor = new THREE.Group();
  neighbor.position.set(-5.78, 0.12, -2.625);
  root.add(neighbor);
  env.neighbor = neighbor;

  const wood = art.toon(0x584437);
  const woodDark = art.toon(0x3a2e27);
  const plaster = art.toon(0xb2a58f);
  const roofMat = art.toon(0x2c3641);

  // 主楼体 0.94 × 4.3 × 7.25
  addBox(neighbor, 0.94, 4.3, 7.25, plaster, 0, 2.15, 0, { outline: 0.006 });
  addBox(neighbor, 0.98, 0.46, 7.29, woodDark, 0, 0.23, 0);

  // 面向小巷的木格栅（东面 x = +0.47）
  for (let i = 0; i < 12; i++) {
    addBox(neighbor, 0.05, 3.3, 0.07, wood, 0.48, 2.2, -3.25 + i * 0.59);
  }
  addBox(neighbor, 0.06, 0.11, 7.2, woodDark, 0.5, 3.82, 0);
  addBox(neighbor, 0.06, 0.11, 7.2, woodDark, 0.5, 1.08, 0);

  // 小巷侧窗
  const windowLight = art.neon(0xffc98a);
  for (const z of [-1.4, 1.5]) {
    addBox(neighbor, 0.06, 0.6, 0.86, woodDark, 0.5, 2.52, z, { outline: 0.002 });
    addPlane(neighbor, 0.7, 0.44, windowLight, 0.535, 2.52, z, { ry: Math.PI / 2 });
    addBox(neighbor, 0.05, 0.03, 0.86, woodDark, 0.535, 2.52, z);
    addBox(neighbor, 0.05, 0.62, 0.03, woodDark, 0.535, 2.52, z + 0.43);
  }

  // 小巷侧卷帘门
  addPlane(neighbor, 1.05, 1.45, new THREE.MeshBasicMaterial({ map: shutterTexture(), toneMapped: true }), 0.49, 0.98, -3.0, { ry: Math.PI / 2 });

  // 空调外机与管线
  addBox(neighbor, 0.34, 0.5, 0.6, art.toon(0xbfc3c7), 0.68, 1.5, -0.3, { outline: 0.002 });
  addCyl(neighbor, 0.16, 0.16, 0.02, art.toon(0x59616a), 0.86, 1.5, -0.3, { seg: 14, rz: Math.PI / 2 });
  addCyl(neighbor, 0.033, 0.033, 2.4, art.toon(0x8e949b), 0.58, 2.4, 3.2, { seg: 8 });
  addBox(neighbor, 0.14, 0.34, 0.24, art.toon(0x5a626c), 0.56, 1.8, 3.35);
  addBox(neighbor, 0.14, 0.34, 0.24, art.toon(0x5a626c), 0.56, 1.8, 2.75);

  // 正面（南面 z = +3.625）
  addBox(neighbor, 0.72, 1.9, 0.1, woodDark, -0.08, 0.96, 3.66);
  addBox(neighbor, 0.58, 1.74, 0.03, art.toon(0x2b2119), -0.08, 0.88, 3.71);
  addBox(neighbor, 0.46, 0.05, 0.04, art.neon(0xffb066), -0.08, 1.8, 3.72, { cast: false });
  addPlane(neighbor, 0.74, 0.4, new THREE.MeshBasicMaterial({ map: norenTexture(), toneMapped: true, side: THREE.DoubleSide }), -0.08, 2.15, 3.76);

  const lantern = new THREE.Group();
  lantern.position.set(-0.32, 2.2, 3.74);
  neighbor.add(lantern);
  addCyl(lantern, 0.095, 0.095, 0.32, art.neon(0xff7e63), 0, 0, 0, { seg: 10 });
  addCyl(lantern, 0.1, 0.1, 0.028, art.toon(0x2b2119), 0, 0.16, 0, { seg: 10 });
  addCyl(lantern, 0.1, 0.1, 0.028, art.toon(0x2b2119), 0, -0.16, 0, { seg: 10 });

  // 竖向灯箱
  const neonSign = new THREE.MeshBasicMaterial({ map: izakayaSign(), toneMapped: false });
  addBox(neighbor, 0.34, 1.42, 0.11, art.toon(0x2b2119), -0.28, 3.0, 3.68, { outline: 0.003 });
  addPlane(neighbor, 0.3, 1.32, neonSign, -0.28, 3.0, 3.745);
  env.storeNeon = env.storeNeon || [];
  env.storeNeon.push({ mat: neonSign, base: new THREE.Color(0xffffff), kind: 'steady' });

  // 屋顶
  const roof = new THREE.Group();
  neighbor.add(roof);
  addBox(roof, 1.14, 0.12, 7.4, roofMat, 0, 4.42, 0, { outline: 0.004 });
  addBox(roof, 1.06, 0.17, 7.3, art.toon(0x37434e), 0, 4.53, 0);
  addBox(roof, 0.86, 0.22, 0.11, woodDark, 0, 4.16, 3.62);
  addBox(roof, 0.86, 0.22, 0.11, woodDark, 0, 4.16, -3.62);
  addCyl(roof, 0.028, 0.028, 0.95, art.toon(0x6b727a), 0.08, 4.95, -2.1, { seg: 6 });
  addBox(roof, 0.44, 0.3, 0.44, art.toon(0x9ca2a9), -0.08, 4.72, 2.2);
  builder.drop(roof, 2.95, 0.9, { dist: 1.8, ease: 'outCubic' });

  builder.grow(neighbor, 1.92, 1.0, { ease: 'outCubic' });

  /* ------------------------------ 小巷道具 ------------------------------ */
  const alley = new THREE.Group();
  root.add(alley);
  env.alley = alley;

  addBox(alley, 0.08, 0.015, 6.4, art.toon(0x222831), -5.0, 0.127, -1.6, { cast: false });
  addBox(alley, 1.6, 0.07, 0.42, art.toon(0x8b8f96), -4.9, 0.155, 0.72);

  // 啤酒筐 + 纸箱
  const crateColors = [0xa3453d, 0x2f5f8f, 0x3f7a52];
  for (let i = 0; i < 4; i++) {
    const x = -5.06 + (i % 2) * 0.3;
    const z = -3.2 + Math.floor(i / 2) * 0.32;
    const yy = 0.12 + (i >= 2 ? 0.26 : 0.13);
    addBox(alley, 0.28, 0.24, 0.28, art.toon(crateColors[i % 3]), x, yy, z, { outline: 0.002 });
  }
  addBox(alley, 0.34, 0.3, 0.32, art.toon(0x9a7f5c), -4.85, 0.27, -1.2);
  addBox(alley, 0.28, 0.24, 0.28, art.toon(0x8a7355), -4.88, 0.5, -1.25);
  addCyl(alley, 0.12, 0.1, 0.24, art.toon(0x4c8a8a), -5.15, 0.24, -2.5, { seg: 10 });
  addCyl(alley, 0.011, 0.011, 0.95, art.toon(0x8b7350), -5.12, 0.66, -2.5, { seg: 5 });

  // 靠墙的窄自动贩卖机
  const miniVend = new THREE.Group();
  miniVend.position.set(-5.18, 0.12, 0.2);
  miniVend.rotation.y = Math.PI / 2;
  alley.add(miniVend);
  addBox(miniVend, 0.4, 1.56, 0.4, art.toon(0xdfe3e5), 0, 0.78, 0, { outline: 0.003 });
  addBox(miniVend, 0.42, 0.07, 0.42, art.toon(0x2b6fa8), 0, 1.59, 0);
  addPlane(miniVend, 0.36, 1.2, new THREE.MeshBasicMaterial({
    map: canvasTexture(320, 640, (ctx, w, h) => {
      ctx.fillStyle = '#eef2f4';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2b6fa8';
      ctx.fillRect(0, 0, w, 88);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '900 40px "Arial Black", sans-serif';
      ctx.fillText('COLD', w / 2, 58);
      ctx.fillStyle = '#1d232b';
      ctx.fillRect(20, 108, w - 40, 300);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          ctx.fillStyle = ['#e0554a', '#4d9de0', '#f0b34a', '#6fc08a'][(r + c) % 4];
          ctx.fillRect(38 + c * 64, 130 + r * 88, 46, 56);
        }
      }
      ctx.fillStyle = '#c7ccd1';
      ctx.fillRect(36, 470, 100, 52);
      ctx.fillStyle = '#84e0d6';
      ctx.fillRect(190, 470, 100, 40);
    }),
    toneMapped: false,
  }), 0, 0.8, 0.203);

  // 小巷壁灯
  const wallLamp = new THREE.Group();
  wallLamp.position.set(-4.7, 2.55, -1.9);
  alley.add(wallLamp);
  addBox(wallLamp, 0.14, 0.1, 0.14, art.toon(0x3e444c), 0, 0, 0);
  addCyl(wallLamp, 0.2, 0.09, 0.13, art.toon(0x3e444c), 0.2, -0.02, 0, { seg: 10, rz: Math.PI / 2 });
  addSphere(wallLamp, 0.075, art.neon(0xffd7a3), 0.28, -0.06, 0);
  env.alleyLamp = new THREE.Vector3(-4.42, 2.45, -1.9);

  builder.drop(alley, 3.3, 0.9, { dist: 1.2, ease: 'outCubic' });

  /* ------------------------------ 便利店后场 ------------------------------ */
  const back = new THREE.Group();
  root.add(back);
  env.backyard = back;

  addBox(back, 1.25, 0.11, 0.62, art.toon(0x8d9196), -2.7, 0.175, -4.95);
  addBox(back, 1.45, 0.05, 0.22, art.toon(0x5e666f), -2.7, 0.255, -4.6);

  addBox(back, 0.86, 0.92, 0.58, art.toon(0x3e6a52), 0.55, 0.58, -5.85, { outline: 0.003 });
  addBox(back, 0.9, 0.09, 0.62, art.toon(0x2e4f3e), 0.55, 1.06, -5.85);
  addBox(back, 0.58, 0.03, 0.1, art.toon(0x223b2f), 0.55, 1.02, -5.52);

  addBox(back, 0.46, 0.32, 0.38, art.toon(0x9c825e), -4.1, 0.34, -5.6);
  addBox(back, 0.4, 0.28, 0.36, art.toon(0x8f7654), -4.05, 0.64, -5.65);
  addBox(back, 0.36, 0.26, 0.32, art.toon(0x33678f), 0.05, 0.3, -5.5);
  addBox(back, 0.34, 0.24, 0.3, art.toon(0xa34a41), 0.07, 0.56, -5.52);

  for (const x of [-3.6, -3.38]) {
    addCyl(back, 0.13, 0.15, 0.5, art.toon(0x9aa0a5), x, 0.4, -4.85, { seg: 10 });
    addCyl(back, 0.055, 0.055, 0.09, art.toon(0x6b727a), x, 0.67, -4.85, { seg: 8 });
  }
  addBox(back, 5.4, 0.015, 0.07, art.toon(0x262d36), -1.7, 0.128, -4.62, { cast: false });

  builder.drop(back, 3.5, 0.9, { dist: 1.2, ease: 'outCubic' });
}