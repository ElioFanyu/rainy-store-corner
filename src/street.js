import * as THREE from 'three';
import { addBox, addCyl, addPlane, addTube, canvasTexture } from './core.js';

/* ------------------------------------------------------------------ *
 *  底座 + 街道
 *  底座 12.5 × 12.5；L 形街道沿南、东两侧切边，街角在 (2.6, 2.6)
 *  街区内部：x ∈ [-6.25, 1.6]，z ∈ [-6.25, 1.0]
 * ------------------------------------------------------------------ */

const HALF = 6.25;
const ROAD_IN = 2.6;   // 道路内侧
const ROAD_OUT = 5.4;  // 道路外侧（对面人行道）
const CURB_H = 0.16;

function makePuddleTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r = 0.74 + Math.sin(a * 3.1) * 0.05 + Math.sin(a * 7.3 + 1.2) * 0.035 + Math.cos(a * 2.2) * 0.03;
      const x = cx + Math.cos(a) * r * w * 0.5;
      const y = cy + Math.sin(a) * r * h * 0.5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy, w * 0.55);
    g.addColorStop(0, 'rgba(38,64,90,0.96)');
    g.addColorStop(0.6, 'rgba(16,32,48,0.94)');
    g.addColorStop(1, 'rgba(8,16,26,0.9)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,190,220,0.28)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(190,225,255,0.09)';
    ctx.lineWidth = 7;
    ctx.stroke();
  });
}

function makeTactileTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#9c7f2a';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const cx = 16 + x * 32;
        const cy = 16 + y * 32;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#c09a33';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 2, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,224,140,0.42)';
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(80,60,10,0.28)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);
  }, { repeat: [1, 1] });
}

function puddle(env, x, z, sx, sz, ry = 0, y = 0.045) {
  const { art, street } = env;
  const mat = new THREE.MeshBasicMaterial({
    map: env.puddleTexture,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    toneMapped: false,
  });
  const p = addPlane(street.details, 2.2, 2.2, mat, x, y, z, { rx: -Math.PI / 2 });
  p.scale.set(sx, sz, 1);
  p.rotation.z = ry;
  p.renderOrder = 2;
  const sheen = addPlane(street.details, 1, 1, art.glowMat(0x6fa9d6, 0.09), x, y + 0.002, z, { rx: -Math.PI / 2 });
  sheen.scale.set(sx * 1.4, sz * 1.4, 1);
  sheen.renderOrder = 3;
  return p;
}

function reflection(env, color, opacity, w, h, x, z, ry = 0, y = 0.05) {
  const { art, street } = env;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  street.details.add(g);
  const p = addPlane(g, w, h, art.streakMat(color, opacity), 0, 0, 0, { rx: -Math.PI / 2 });
  p.renderOrder = 4;
  return p;
}

export function buildStreet(env) {
  const { art, root, builder } = env;

  /* ------------------------------ 底座 ------------------------------ */
  const base = new THREE.Group();
  root.add(base);
  env.base = base;

  addBox(base, 12.5, 0.58, 12.5, art.toon(0x1a1f28), 0, -0.29, 0, { outline: 0.005 });
  const rimMat = art.toon(0x3f4653);
  addBox(base, 12.56, 0.07, 0.1, rimMat, 0, -0.015, HALF - 0.02, { cast: false });
  addBox(base, 12.56, 0.07, 0.1, rimMat, 0, -0.015, -HALF + 0.02, { cast: false });
  addBox(base, 0.1, 0.07, 12.56, rimMat, HALF - 0.02, -0.015, 0, { cast: false });
  addBox(base, 0.1, 0.07, 12.56, rimMat, -HALF + 0.02, -0.015, 0, { cast: false });
  addBox(base, 12.2, 0.06, 12.2, art.toon(0x10141c), 0, -0.61, 0, { cast: false });
  addBox(base, 1.05, 0.014, 0.035, art.toon(0x7d8593), -4.9, 0.007, HALF - 0.06, { cast: false });
  builder.rise(base, 0.05, 1.1, { dist: 3.4, ease: 'outQuint' });

  /* ------------------------------ 地面 ------------------------------ */
  const ground = new THREE.Group();
  root.add(ground);
  env.street = { ground, details: new THREE.Group() };

  const roadTexA = art.textures.asphalt;
  const roadTexB = roadTexA.clone();
  roadTexB.repeat.set(1.6, 3.2);
  roadTexB.needsUpdate = true;
  const roadMatA = art.toon(0x39424f, { map: roadTexA });
  const roadMatB = art.toon(0x39424f, { map: roadTexB });

  // 南侧道路（东西向）
  addBox(ground, 12.5, 0.05, ROAD_OUT - ROAD_IN, roadMatA, 0, 0, (ROAD_IN + ROAD_OUT) / 2, { cast: false });
  // 东侧道路（南北向）
  addBox(ground, ROAD_OUT - ROAD_IN, 0.05, HALF + ROAD_IN, roadMatB, (ROAD_IN + ROAD_OUT) / 2, 0, (ROAD_IN - HALF) / 2, { cast: false });

  // 近侧人行道（南）
  const walkTex = art.textures.sidewalk;
  const walkMat = art.toon(0x9aa1ab, { map: walkTex });
  addBox(ground, 8.85, CURB_H, 1.6, walkMat, -1.825, CURB_H / 2, 1.8, { cast: false });

  // 近侧人行道（东）
  const walkTexB = walkTex.clone();
  walkTexB.repeat.set(1, 4.6);
  walkTexB.needsUpdate = true;
  addBox(ground, 1.0, CURB_H, 7.25, art.toon(0x9aa1ab, { map: walkTexB }), 2.1, CURB_H / 2, -2.625, { cast: false });

  // 街区内部地坪
  addBox(ground, 7.85, 0.12, 7.25, art.toon(0x7b828d, { map: art.textures.concrete }), -2.325, 0.06, -2.625, { cast: false });

  // 对面人行道
  const farTexA = walkTex.clone();
  farTexA.repeat.set(6, 1);
  farTexA.needsUpdate = true;
  addBox(ground, 12.5, CURB_H, 0.85, art.toon(0x939aa4, { map: farTexA }), 0, CURB_H / 2, (ROAD_OUT + HALF) / 2, { cast: false });
  const farTexB = walkTex.clone();
  farTexB.repeat.set(1, 5.5);
  farTexB.needsUpdate = true;
  addBox(ground, 0.85, CURB_H, 11.5, art.toon(0x939aa4, { map: farTexB }), (ROAD_OUT + HALF) / 2, CURB_H / 2, (ROAD_OUT - HALF) / 2, { cast: false });

  // 路缘石
  const curbMat = art.toon(0xaeb4bc);
  addBox(ground, 8.85, 0.19, 0.13, curbMat, -1.825, 0.075, ROAD_IN + 0.045);
  addBox(ground, 0.13, 0.19, 7.25, curbMat, ROAD_IN + 0.045, 0.075, -2.625);
  addBox(ground, 12.5, 0.19, 0.13, curbMat, 0, 0.075, ROAD_OUT - 0.045);
  addBox(ground, 0.13, 0.19, 11.5, curbMat, ROAD_OUT - 0.045, 0.075, (ROAD_OUT - HALF) / 2);

  // 盲道
  const tactileTex = makeTactileTexture();
  tactileTex.wrapS = tactileTex.wrapT = THREE.RepeatWrapping;
  tactileTex.repeat.set(21, 1);
  addBox(ground, 8.5, 0.014, 0.2, art.toon(0xffffff, { map: tactileTex }), -1.85, 0.168, 2.12, { cast: false });
  const tactileTex2 = tactileTex.clone();
  tactileTex2.repeat.set(18, 1);
  tactileTex2.needsUpdate = true;
  addBox(ground, 6.9, 0.014, 0.2, art.toon(0xffffff, { map: tactileTex2 }), 2.1, 0.168, -2.7, { cast: false, ry: Math.PI / 2 });
  addBox(ground, 0.34, 0.014, 0.34, art.toon(0xffffff, { map: tactileTex }), 2.12, 0.169, 2.12, { cast: false });

  builder.rise(ground, 0.62, 1.0, { dist: 1.35, ease: 'outCubic' });

  /* ---------------------------- 路面标线 ---------------------------- */
  const marks = new THREE.Group();
  root.add(marks);
  env.street.marks = marks;
  const paint = new THREE.MeshBasicMaterial({ color: 0xc9d1d8, transparent: true, opacity: 0.44, toneMapped: true });
  const paintWorn = new THREE.MeshBasicMaterial({ color: 0xb6bec6, transparent: true, opacity: 0.34, toneMapped: true });
  const mid = (ROAD_IN + ROAD_OUT) / 2;

  addBox(marks, 8.6, 0.014, 0.07, paintWorn, -1.95, 0.033, ROAD_IN + 0.2, { cast: false });
  addBox(marks, 11.2, 0.014, 0.07, paintWorn, ROAD_IN + 0.2, 0.033, -0.55, { cast: false });

  for (let x = -6.0; x < 0.2; x += 1.9) {
    addBox(marks, 0.85, 0.014, 0.1, paintWorn, x, 0.033, mid, { cast: false });
  }
  for (let z = -6.0; z < 0.2; z += 1.9) {
    addBox(marks, 0.1, 0.014, 0.85, paintWorn, mid, 0.033, z, { cast: false });
  }

  // 斑马线（南侧，正对店门，靠西）
  for (let i = 0; i < 5; i++) {
    addBox(marks, 0.4, 0.015, ROAD_OUT - ROAD_IN - 0.5, paint, -0.05 + i * 0.62, 0.035, mid, { cast: false });
  }
  // 斑马线（东侧，街角以北）
  for (let i = 0; i < 5; i++) {
    addBox(marks, ROAD_OUT - ROAD_IN - 0.5, 0.015, 0.4, paint, mid, 0.035, -0.05 + i * 0.62, { cast: false });
  }

  // 停止线
  addBox(marks, 0.2, 0.015, ROAD_OUT - ROAD_IN - 0.5, paint, ROAD_IN + 0.22, 0.035, mid, { cast: false });
  addBox(marks, ROAD_OUT - ROAD_IN - 0.5, 0.015, 0.2, paint, mid, 0.035, ROAD_IN + 0.22, { cast: false });

  // 门前停车位
  addBox(marks, 0.08, 0.015, 1.8, paintWorn, -3.55, 0.035, 3.55, { cast: false });
  addBox(marks, 0.08, 0.015, 1.8, paintWorn, -1.45, 0.035, 3.55, { cast: false });
  addBox(marks, 2.2, 0.015, 0.08, paintWorn, -2.5, 0.035, 2.72, { cast: false });

  builder.rise(marks, 1.25, 0.9, { dist: 1.1, ease: 'outCubic' });

  /* ----------------------------- 街面细节 ----------------------------- */
  const details = env.street.details;
  root.add(details);

  const gutterMat = art.toon(0x171c25);
  addBox(details, 8.5, 0.02, 0.15, gutterMat, -1.85, 0.033, ROAD_IN + 0.2, { cast: false });
  addBox(details, 0.15, 0.02, 6.9, gutterMat, ROAD_IN + 0.2, 0.033, -2.7, { cast: false });
  addBox(details, 12.3, 0.02, 0.15, gutterMat, 0, 0.033, ROAD_OUT - 0.2, { cast: false });
  addBox(details, 0.15, 0.02, 11.2, gutterMat, ROAD_OUT - 0.2, 0.033, -0.5, { cast: false });

  const grateMat = art.toon(0x2a313b);
  const grateBar = art.toon(0x555d69);
  const makeGrate = (x, z, ry) => {
    const g = new THREE.Group();
    g.position.set(x, 0.028, z);
    g.rotation.y = ry;
    details.add(g);
    addBox(g, 0.5, 0.02, 0.22, grateMat, 0, 0, 0, { cast: false });
    for (let i = 0; i < 6; i++) {
      addBox(g, 0.048, 0.024, 0.19, grateBar, -0.2 + i * 0.08, 0.005, 0, { cast: false });
    }
  };
  makeGrate(-5.4, ROAD_IN + 0.2, 0);
  makeGrate(-2.7, ROAD_IN + 0.2, 0);
  makeGrate(-0.3, ROAD_IN + 0.2, 0);
  makeGrate(ROAD_IN + 0.2, -4.4, Math.PI / 2);
  makeGrate(ROAD_IN + 0.2, -1.2, Math.PI / 2);
  makeGrate(-1.0, ROAD_OUT - 0.2, 0);
  makeGrate(3.4, ROAD_OUT - 0.2, 0);

  const manholeMat = art.toon(0x3e4652);
  for (const [x, z] of [[-0.9, 4.4], [4.5, -0.7], [4.6, 4.4]]) {
    addCyl(details, 0.3, 0.3, 0.02, manholeMat, x, 0.032, z, { seg: 22, cast: false });
    addCyl(details, 0.23, 0.23, 0.023, art.toon(0x333b45), x, 0.036, z, { seg: 20, cast: false });
    addBox(details, 0.32, 0.01, 0.032, art.toon(0x525b67), x, 0.046, z, { cast: false });
  }

  env.puddleTexture = makePuddleTexture();
  puddle(env, -1.0, 3.75, 1.35, 0.42, 0.16);
  puddle(env, 3.95, 1.0, 0.44, 0.9, 1.55);
  puddle(env, -4.5, 4.5, 0.7, 0.32, 0.42);
  puddle(env, 0.7, 4.75, 0.58, 0.25, -0.2);
  puddle(env, -2.4, -5.35, 0.7, 0.32, 0, 0.128);
  puddle(env, -5.0, -1.0, 0.5, 0.4, 0.25, 0.128);

  reflection(env, 0x36d3c9, 0.26, 1.2, 2.4, -1.3, 2.62, 0.0, 0.172);
  reflection(env, 0xffbd76, 0.22, 2.2, 1.8, -2.2, 2.2, 0.0, 0.172);
  reflection(env, 0xff6b52, 0.22, 0.85, 1.5, -4.2, 2.55, 0.05, 0.172);
  reflection(env, 0xffb877, 0.18, 1.3, 2.8, -6.3, 3.2, 0.26);
  reflection(env, 0x9ec6ff, 0.1, 0.7, 1.6, 6.05, 3.6, -0.16);
  reflection(env, 0x7fd8ff, 0.1, 0.55, 1.2, 2.4, 1.55, 1.2, 0.172);

  const pool = (color, x, z, s, o, y = 0.05) => {
    const m = addPlane(details, s, s, art.glowMat(color, o), x, y, z, { rx: -Math.PI / 2 });
    m.renderOrder = 3;
  };
  pool(0xffd39a, -6.0, 4.5, 4.2, 0.13);
  pool(0xffc98a, 5.4, 2.7, 3.0, 0.1, 0.168);
  pool(0xbcd8ff, 5.0, 4.5, 3.4, 0.09);
  pool(0xffb27a, -4.0, 2.7, 2.0, 0.18, 0.172);
  pool(0xffd9a8, -1.4, 1.8, 2.8, 0.12, 0.172);
  pool(0x53e0d6, -1.3, 2.62, 2.4, 0.08);

  builder.rise(details, 1.55, 0.85, { dist: 0.9, ease: 'outCubic' });

  /* --------------------------- 对面人行道设施 --------------------------- */
  const far = new THREE.Group();
  root.add(far);

  const railWhite = art.toon(0xdde1e4);
  const railSeg = (x0, z0, len, horizontal) => {
    const g = new THREE.Group();
    g.position.set(x0, CURB_H, z0);
    g.rotation.y = horizontal ? Math.PI / 2 : 0;
    far.add(g);
    const n = Math.max(2, Math.round(len / 0.95));
    for (let i = 0; i <= n; i++) {
      addCyl(g, 0.032, 0.036, 0.74, railWhite, 0, 0.37, -len / 2 + (i * len) / n, { seg: 8 });
    }
    addBox(g, 0.05, 0.08, len, railWhite, 0, 0.63, 0);
    addBox(g, 0.04, 0.05, len, railWhite, 0, 0.38, 0);
  };
  railSeg(-4.3, ROAD_OUT + 0.34, 3.0, true);
  railSeg(3.0, ROAD_OUT + 0.34, 4.4, true);
  railSeg(ROAD_OUT + 0.34, -1.8, 4.2, false);

  const lampPost = new THREE.Group();
  lampPost.position.set(-4.6, CURB_H, ROAD_OUT + 0.44);
  far.add(lampPost);
  addCyl(lampPost, 0.06, 0.085, 4.1, art.toon(0x6e7783), 0, 2.05, 0, { seg: 10 });
  addCyl(lampPost, 0.11, 0.11, 0.14, art.toon(0x565e69), 0, 0.06, 0, { seg: 10 });
  addTube(lampPost, new THREE.Vector3(0, 4.05, 0), new THREE.Vector3(0, 4.25, -0.55), 0.045, art.toon(0x6e7783), 6);
  addTube(lampPost, new THREE.Vector3(0, 4.25, -0.55), new THREE.Vector3(0, 4.2, -1.05), 0.045, art.toon(0x6e7783), 6);
  addBox(lampPost, 0.4, 0.14, 0.5, art.toon(0x505863), 0, 4.14, -1.05);
  addBox(lampPost, 0.32, 0.02, 0.4, art.neon(0xffe1b0), 0, 4.05, -1.05, { cast: false });
  env.lampHeads = env.lampHeads || [];
  env.lampHeads.push({
    pos: new THREE.Vector3(-4.6, CURB_H + 4.24, ROAD_OUT + 0.44 - 1.05),
    color: 0xffd9a8,
    intensity: 26,
  });

  const miniSign = new THREE.Group();
  miniSign.position.set(4.5, CURB_H, ROAD_OUT + 0.4);
  far.add(miniSign);
  addCyl(miniSign, 0.03, 0.035, 1.9, art.toon(0x7d8590), 0, 0.95, 0, { seg: 8 });
  addPlane(miniSign, 0.42, 0.3, new THREE.MeshBasicMaterial({
    map: canvasTexture(256, 180, (ctx, w, h) => {
      ctx.fillStyle = '#e7edf1';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2f6f8a';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = '#20525f';
      ctx.textAlign = 'center';
      ctx.font = '800 34px "Yu Gothic", sans-serif';
      ctx.fillText('さくら通り', w / 2, 74);
      ctx.font = '600 22px "Yu Gothic", sans-serif';
      ctx.fillText('桜町一丁目', w / 2, 116);
      ctx.font = '500 16px "Arial", sans-serif';
      ctx.fillText('SAKURA-DORI', w / 2, 148);
    }),
    toneMapped: true,
    side: THREE.DoubleSide,
  }), 0, 1.82, 0.03);

  const lampPost2 = new THREE.Group();
  lampPost2.position.set(ROAD_OUT + 0.44, CURB_H, 2.9);
  lampPost2.rotation.y = Math.PI / 2;
  far.add(lampPost2);
  addCyl(lampPost2, 0.055, 0.08, 3.7, art.toon(0x6e7783), 0, 1.85, 0, { seg: 10 });
  addCyl(lampPost2, 0.1, 0.1, 0.13, art.toon(0x565e69), 0, 0.055, 0, { seg: 10 });
  addTube(lampPost2, new THREE.Vector3(0, 3.66, 0), new THREE.Vector3(0, 3.84, -0.5), 0.04, art.toon(0x6e7783), 6);
  addTube(lampPost2, new THREE.Vector3(0, 3.84, -0.5), new THREE.Vector3(0, 3.8, -0.95), 0.04, art.toon(0x6e7783), 6);
  addBox(lampPost2, 0.36, 0.12, 0.44, art.toon(0x505863), 0, 3.75, -0.95);
  addBox(lampPost2, 0.28, 0.02, 0.36, art.neon(0xffe1b0), 0, 3.67, -0.95, { cast: false });
  env.lampHeads.push({
    pos: new THREE.Vector3(ROAD_OUT + 0.44 - 0.95, CURB_H + 3.86, 2.9),
    color: 0xffd9a8,
    intensity: 20,
  });

  addBox(far, 0.34, 0.62, 0.3, art.toon(0x4a5560), 3.7, 0.47, ROAD_OUT + 0.45, { outline: 0.002 });
  addBox(far, 0.36, 0.05, 0.32, art.toon(0x2f3841), 3.7, 0.8, ROAD_OUT + 0.45);
  addBox(far, 1.0, 0.34, 0.4, art.toon(0x5c5a52), 0.3, 0.36, ROAD_OUT + 0.52, { outline: 0.002 });
  addBox(far, 0.9, 0.12, 0.32, art.toon(0x2f4a34), 0.3, 0.56, ROAD_OUT + 0.52);
  for (let i = 0; i < 5; i++) {
    addBox(far, 0.11, 0.19, 0.1, art.toon(0x3c6342), -0.12 + i * 0.21, 0.68, ROAD_OUT + 0.52);
  }

  builder.rise(far, 2.05, 0.9, { dist: 1.2, ease: 'outCubic' });
}