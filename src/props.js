import * as THREE from 'three';
import { addBox, addCyl, addPlane, addSphere, addTube, addWire, canvasTexture, PAL } from './core.js';
import { makeVendingTexture } from './store.js';

/* ------------------------------------------------------------------ *
 *  街道道具：自动贩卖机、自行车、伞架、垃圾桶、公告栏、电线杆…
 * ------------------------------------------------------------------ */

const FONT = '"Yu Gothic", "Meiryo", sans-serif';

function signCanvas(w, h, draw) {
  return canvasTexture(w, h, draw);
}

export function buildProps(env) {
  const { art, root, builder } = env;
  const props = new THREE.Group();
  root.add(props);
  env.props = props;
  env.lampHeads = [];

  const white = art.toon(0xe8ecee);
  const offWhite = art.toon(0xd9d7ce);
  const darkMetal = art.toon(0x393f48);
  const steel = art.toon(0x878f99);
  const orange = art.toon(0xe07a3e);

  /* --------------------------- 自动贩卖机 --------------------------- */
  const vending = new THREE.Group();
  vending.position.set(-3.92, 0.16, 1.52);
  props.add(vending);
  addBox(vending, 1.0, 1.88, 0.7, offWhite, 0, 0.94, 0, { outline: 0.005 });
  addBox(vending, 1.04, 0.1, 0.74, art.toon(0xd94f43), 0, 1.93, 0, { outline: 0.003 });
  const faceMat = new THREE.MeshBasicMaterial({ map: makeVendingTexture('#d94f43'), toneMapped: false });
  addPlane(vending, 0.94, 1.41, faceMat, 0, 1.0, 0.357);
  addBox(vending, 0.94, 0.06, 0.03, art.neon(0xd8fbff), 0, 1.81, 0.36, { cast: false });
  addBox(vending, 0.6, 0.12, 0.04, darkMetal, 0, 0.32, 0.36);
  addBox(vending, 0.18, 0.3, 0.03, art.toon(0xc9ced3), 0.36, 1.02, 0.365);
  addBox(vending, 0.44, 0.1, 0.02, art.neon(0x8ff0ea), -0.18, 0.53, 0.365, { cast: false });
  // 侧面品牌条
  addBox(vending, 0.02, 0.4, 0.5, art.toon(0xd94f43), -0.51, 1.3, 0);
  addBox(vending, 0.4, 0.03, 0.03, darkMetal, 0, 2.0, 0.32);
  // 地面暖光
  const spill = addPlane(vending, 1.9, 1.2, art.glowMat(0xffb27a, 0.3), 0, 0.012, 0.63, { rx: -Math.PI / 2 });
  spill.renderOrder = 3;
  builder.rise(vending, 5.82, 1.0, { dist: 1.8, ease: 'outBack' });

  /* ----------------------------- 自行车 ----------------------------- */
  const bike = new THREE.Group();
  bike.position.set(-2.45, 0.16, 1.58);
  bike.rotation.y = -0.07;
  props.add(bike);
  const tyre = art.toon(0x222830);
  const rim = art.toon(0x8c949e);
  const frame = art.toon(0x2f6a70);
  const wheel = (x) => {
    const w = new THREE.Group();
    w.position.set(x, 0.3, 0);
    bike.add(w);
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.024, 6, 22), tyre);
    t.castShadow = true;
    w.add(t);
    const t2 = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.008, 5, 22), rim);
    w.add(t2);
    const hub = addCyl(w, 0.028, 0.028, 0.09, rim, 0, 0, 0, { seg: 8, rx: Math.PI / 2 });
    hub.castShadow = false;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      addTube(w, new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0), 0.005, rim, 4);
    }
    return w;
  };
  wheel(-0.55);
  wheel(0.55);
  const P = (x, y) => new THREE.Vector3(x, y, 0);
  addTube(bike, P(-0.55, 0.3), P(-0.02, 0.34), 0.022, frame, 6); // 下管后段
  addTube(bike, P(-0.02, 0.34), P(0.35, 0.86), 0.022, frame, 6); // 下管前段
  addTube(bike, P(-0.02, 0.34), P(-0.23, 0.9), 0.022, frame, 6); // 座管
  addTube(bike, P(-0.23, 0.9), P(0.35, 0.86), 0.022, frame, 6); // 上管
  addTube(bike, P(0.35, 0.86), P(0.55, 0.3), 0.02, frame, 6); // 前叉
  addTube(bike, P(-0.55, 0.3), P(-0.23, 0.9), 0.016, frame, 6); // 后叉
  addTube(bike, P(-0.55, 0.3), P(-0.2, 0.62), 0.014, frame, 6);
  addTube(bike, P(0.35, 0.86), P(0.38, 1.02), 0.016, rim, 6);
  addTube(bike, P(0.38, 1.02), P(0.38, 1.0), 0.018, rim, 5);
  // 车把
  addTube(bike, P(0.38, 1.02), P(0.38, 1.03), 0.02, rim, 5);
  addCyl(bike, 0.014, 0.014, 0.5, rim, 0.4, 1.03, 0, { seg: 8, rx: Math.PI / 2 });
  addCyl(bike, 0.02, 0.02, 0.09, darkMetal, 0.4, 1.03, -0.22, { seg: 8, rx: Math.PI / 2 });
  addCyl(bike, 0.02, 0.02, 0.09, darkMetal, 0.4, 1.03, 0.22, { seg: 8, rx: Math.PI / 2 });
  // 车座
  addBox(bike, 0.24, 0.05, 0.12, darkMetal, -0.25, 0.95, 0);
  addSphere(bike, 0.03, art.toon(0xc9a24a), 0.47, 1.06, 0.15);
  // 前筐
  const basketMat = art.toon(0x51586a);
  addBox(bike, 0.3, 0.22, 0.24, art.toon(0x39424d, { transparent: true, opacity: 0.45 }), 0.7, 0.83, 0);
  addBox(bike, 0.32, 0.02, 0.26, basketMat, 0.7, 0.72, 0);
  for (let i = 0; i < 4; i++) {
    addBox(bike, 0.32, 0.012, 0.012, basketMat, 0.7, 0.74 + i * 0.05, 0.125);
    addBox(bike, 0.012, 0.22, 0.012, basketMat, 0.56 + i * 0.09, 0.83, 0.125);
  }
  // 后货架与尾灯
  addBox(bike, 0.34, 0.02, 0.16, rim, -0.72, 0.72, 0);
  addTube(bike, P(-0.72, 0.72), P(-0.55, 0.3), 0.008, rim, 5);
  addBox(bike, 0.06, 0.05, 0.04, art.neon(0xff5546), -0.88, 0.6, 0, { cast: false });
  // 撑脚
  addTube(bike, P(-0.2, 0.36), P(-0.26, 0.02), 0.01, darkMetal, 5);
  // 车锁
  addTube(bike, P(-0.5, 0.48), P(0.35, 0.75), 0.009, art.toon(0xd94f43), 4);
  builder.rise(bike, 6.06, 0.95, { dist: 1.3, ease: 'outBack' });

  /* ----------------------------- 垃圾桶 ----------------------------- */
  const binTex = (color, label) => signCanvas(256, 192, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `700 28px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(label, w / 2, 70);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(w / 2, 128, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2 - 16, 128);
    ctx.lineTo(w / 2 + 18, 118);
    ctx.lineTo(w / 2 - 2, 142);
    ctx.lineTo(w / 2 + 18, 136);
    ctx.stroke();
  });
  const binData = [
    { x: -1.55, color: '#2f7fa3', label: 'かん・びん' },
    { x: -1.16, color: '#c57a3a', label: 'ペットボトル' },
  ];
  for (const b of binData) {
    const bin = new THREE.Group();
    bin.position.set(b.x, 0.16, 1.62);
    props.add(bin);
    addBox(bin, 0.34, 0.62, 0.32, art.toon(0xd8d6cd), 0, 0.31, 0, { outline: 0.003 });
    addBox(bin, 0.36, 0.06, 0.34, art.toon(0x4b5560), 0, 0.64, 0);
    addPlane(bin, 0.28, 0.3, new THREE.MeshBasicMaterial({ map: binTex(b.color, b.label), toneMapped: true }), 0, 0.34, 0.166);
    addBox(bin, 0.2, 0.04, 0.04, art.toon(0x2c333b), 0, 0.6, 0.12);
    builder.rise(bin, 6.14, 0.8, { dist: 1.1, ease: 'outBack' });
  }

  /* ----------------------------- 雨伞架 ----------------------------- */
  const umbrella = new THREE.Group();
  umbrella.position.set(-0.78, 0.16, 1.64);
  props.add(umbrella);
  addBox(umbrella, 0.4, 0.04, 0.3, darkMetal, 0, 0.03, 0);
  for (const sx of [-0.18, 0.18]) {
    for (const sz of [-0.13, 0.13]) {
      addBox(umbrella, 0.025, 0.52, 0.025, darkMetal, sx, 0.29, sz);
    }
  }
  addBox(umbrella, 0.4, 0.025, 0.025, darkMetal, 0, 0.54, -0.13);
  addBox(umbrella, 0.4, 0.025, 0.025, darkMetal, 0, 0.54, 0.13);
  const umbColors = [0x9fc6dd, 0xd6a2b4, 0x7fbfb0];
  for (let i = 0; i < 3; i++) {
    const u = new THREE.Group();
    u.position.set(-0.11 + i * 0.11, 0.08, 0);
    u.rotation.z = 0.06 - i * 0.05;
    umbrella.add(u);
    addCyl(u, 0.012, 0.012, 0.88, darkMetal, 0, 0.44, 0, { seg: 5 });
    addCyl(u, 0.045, 0.085, 0.42, art.toon(umbColors[i]), 0, 0.66, 0, { seg: 8 });
    addCyl(u, 0.012, 0.02, 0.09, darkMetal, 0, 0.12, 0, { seg: 6 });
    addSphere(u, 0.018, art.toon(0x30363e), 0, 0.9, 0);
  }
  // 撑开的伞靠在墙边
  const openU = new THREE.Group();
  openU.position.set(-1.12, 0.16, 1.15);
  openU.rotation.z = 0.42;
  openU.rotation.x = -0.08;
  props.add(openU);
  addCyl(openU, 0.014, 0.014, 1.1, art.toon(0x3d444d), 0, 0.55, 0, { seg: 6 });
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.52, 0.3, 10, 1, true),
    art.toon(0xf0a7bb),
  );
  canopy.position.set(0, 0.95, 0);
  canopy.castShadow = true;
  openU.add(canopy);
  const rimRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.012, 4, 10), art.toon(0xd4899f));
  rimRing.position.set(0, 0.82, 0);
  rimRing.rotation.x = Math.PI / 2;
  openU.add(rimRing);
  builder.rise(umbrella, 6.26, 0.85, { dist: 1.2, ease: 'outBack' });
  builder.rise(openU, 6.3, 0.9, { dist: 1.2, ease: 'outBack' });

  /* ----------------------------- 公告栏 ----------------------------- */
  const board = new THREE.Group();
  board.position.set(-5.02, 0.16, 2.02);
  board.rotation.y = 0.08;
  props.add(board);
  addBox(board, 0.07, 1.35, 0.07, art.toon(0x4a4238), -0.5, 0.67, 0);
  addBox(board, 0.07, 1.35, 0.07, art.toon(0x4a4238), 0.5, 0.67, 0);
  addBox(board, 1.14, 0.74, 0.06, art.toon(0x6b5a45), 0, 1.18, 0, { outline: 0.003 });
  addBox(board, 1.2, 0.05, 0.16, art.toon(0x50473b), 0, 1.56, 0);
  addBox(board, 1.14, 0.04, 0.06, art.toon(0x99835f), 0, 0.8, 0.02);
  const posters = [
    { x: -0.4, y: 1.24, ry: 0.02, tex: art.textures.posters[2] },
    { x: 0.04, y: 1.23, ry: -0.03, tex: art.textures.posters[0] },
    { x: 0.37, y: 1.12, ry: -0.07, tex: art.textures.posters[3] },
  ];
  for (const p of posters) {
    const mat = new THREE.MeshBasicMaterial({ map: p.tex, toneMapped: true });
    addPlane(board, 0.3, 0.4, mat, p.x, p.y, 0.04, { ry: p.ry });
  }
  builder.rise(board, 5.98, 0.9, { dist: 1.2, ease: 'outBack' });

  /* ----------------------------- 路牌 ----------------------------- */
  const pSign = new THREE.Group();
  pSign.position.set(-2.78, 0.16, 2.28);
  props.add(pSign);
  addCyl(pSign, 0.035, 0.035, 2.2, steel, 0, 1.1, 0, { seg: 8 });
  const pTex = signCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1c5fa8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#f4f7fa';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '900 148px "Arial Black", sans-serif';
    ctx.fillText('P', w / 2, 168);
    ctx.font = '700 30px "Yu Gothic", sans-serif';
    ctx.fillText('24H', w / 2, 218);
  });
  addPlane(pSign, 0.46, 0.46, new THREE.MeshBasicMaterial({ map: pTex, toneMapped: true }), 0, 1.92, 0.04);
  addBox(pSign, 0.44, 0.03, 0.03, steel, 0, 1.69, 0.02);
  builder.rise(pSign, 6.45, 0.8, { dist: 1.1, ease: 'outBack' });

  const stopSign = new THREE.Group();
  stopSign.position.set(2.25, 0.16, 2.34);
  props.add(stopSign);
  addCyl(stopSign, 0.032, 0.038, 2.6, steel, 0, 1.3, 0, { seg: 8 });
  const stopTex = signCanvas(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(16, 34);
    ctx.lineTo(w - 16, 34);
    ctx.lineTo(w / 2, h - 18);
    ctx.closePath();
    ctx.fillStyle = '#f6f3e8';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(34, 46);
    ctx.lineTo(w - 34, 46);
    ctx.lineTo(w / 2, h - 48);
    ctx.closePath();
    ctx.fillStyle = '#c8403b';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 46px "Yu Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('止まれ', w / 2, 112);
  });
  addPlane(stopSign, 0.62, 0.62, new THREE.MeshBasicMaterial({
    map: stopTex, transparent: true, toneMapped: true, side: THREE.DoubleSide,
  }), 0, 2.28, 0.052);
  const streetTex = signCanvas(512, 96, (ctx, w, h) => {
    ctx.fillStyle = '#1f5f52';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e8f4ec';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = '#f2fbf4';
    ctx.textAlign = 'center';
    ctx.font = '600 40px "Yu Gothic", sans-serif';
    ctx.fillText('さくら通り', w / 2, 60);
  });
  addPlane(stopSign, 0.64, 0.12, new THREE.MeshBasicMaterial({ map: streetTex, toneMapped: true }), 0, 1.72, 0.052);
  builder.rise(stopSign, 6.48, 0.8, { dist: 1.1, ease: 'outBack' });

  /* ----------------------------- 弯道镜 ----------------------------- */
  const mirror = new THREE.Group();
  mirror.position.set(-5.0, 0.16, 1.16);
  mirror.rotation.y = -0.7;
  props.add(mirror);
  addCyl(mirror, 0.035, 0.045, 2.3, art.toon(0xd9743f), 0, 1.15, 0, { seg: 8 });
  addTube(mirror, new THREE.Vector3(0, 2.26, 0), new THREE.Vector3(0, 2.32, 0.26), 0.028, art.toon(0xd9743f), 6);
  const back = new THREE.Mesh(new THREE.CircleGeometry(0.42, 28), art.toon(0xd9743f));
  back.position.set(0, 2.32, 0.28);
  mirror.add(back);
  const mirrorTex = signCanvas(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.4, h * 0.28, 6, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#eef8ff');
    g.addColorStop(0.45, '#a9c8d8');
    g.addColorStop(0.8, '#4f7288');
    g.addColorStop(1, '#2c4457');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(46, 22, 18, 210);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(120, 30, 9, 180);
    ctx.fillStyle = 'rgba(255,214,150,0.95)';
    ctx.beginPath();
    ctx.arc(180, 96, 9, 0, Math.PI * 2);
    ctx.fill();
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.38, 28), new THREE.MeshBasicMaterial({
    map: mirrorTex, toneMapped: false,
  }));
  face.position.set(0, 2.32, 0.285);
  mirror.add(face);
  const mirrorRim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 28), art.toon(0xe08446));
  mirrorRim.position.set(0, 2.32, 0.29);
  mirror.add(mirrorRim);
  builder.rise(mirror, 6.4, 0.9, { dist: 1.2, ease: 'outBack' });

  /* ---------------------------- 白色护栏 ---------------------------- */
  const rail = new THREE.Group();
  rail.position.set(2.48, 0.16, -3.9);
  props.add(rail);
  const railWhite = art.toon(0xdfe3e6);
  const railLen = 4.4;
  for (let i = 0; i < 5; i++) {
    addCyl(rail, 0.038, 0.042, 0.86, railWhite, 0, 0.43, -railLen / 2 + i * (railLen / 4), { seg: 8 });
    addCyl(rail, 0.05, 0.05, 0.05, art.neon(0xffb066), 0, 0.8, -railLen / 2 + i * (railLen / 4), { seg: 8, cast: false });
  }
  addBox(rail, 0.05, 0.1, railLen, railWhite, 0, 0.72, 0);
  addBox(rail, 0.04, 0.07, railLen, railWhite, 0, 0.42, 0);
  builder.rise(rail, 6.16, 0.9, { dist: 1.2, ease: 'outBack' });

  /* ----------------------------- 车止柱 ----------------------------- */
  const bollards = new THREE.Group();
  props.add(bollards);
  for (const z of [1.18, 1.62]) {
    const b = new THREE.Group();
    b.position.set(1.15, 0.16, z);
    bollards.add(b);
    addCyl(b, 0.07, 0.08, 0.82, art.toon(0xe4e7e9), 0, 0.41, 0, { seg: 10 });
    addCyl(b, 0.075, 0.075, 0.07, art.toon(0x343b44), 0, 0.66, 0, { seg: 10 });
    addSphere(b, 0.07, art.toon(0xe4e7e9), 0, 0.82, 0);
    addCyl(b, 0.04, 0.04, 0.02, art.neon(0xffc25e), 0, 0.76, 0.065, { seg: 8, rx: Math.PI / 2, cast: false });
  }
  builder.rise(bollards, 6.58, 0.8, { dist: 1.1, ease: 'outBack' });

  /* ----------------------------- 雪糕筒 ----------------------------- */
  const cone = new THREE.Group();
  cone.position.set(-3.25, 0.04, 4.3);
  props.add(cone);
  addBox(cone, 0.32, 0.04, 0.32, art.toon(0xc46a35), 0, 0.02, 0);
  addCyl(cone, 0.055, 0.14, 0.5, art.toon(0xe07a3e), 0, 0.29, 0, { seg: 12 });
  addCyl(cone, 0.095, 0.11, 0.08, art.toon(0xf2f1ea), 0, 0.24, 0, { seg: 12 });
  builder.rise(cone, 6.6, 0.7, { dist: 1.0, ease: 'outBack' });

  /* ---------------------------- 电线杆 ---------------------------- */
  const wireGroup = new THREE.Group();
  root.add(wireGroup);
  const wireMat = art.toon(0x10141b, { transparent: true, opacity: 0 });
  wireMat.depthWrite = false;

  const poleMat = art.toon(0x9ba1a6);
  const insulatorMat = art.toon(0xe3e6e4);

  function utilityPole(x, z, h, at, lampDir = 1, lampColor = 0xffd7a1) {
    const g = new THREE.Group();
    g.position.set(x, 0.12, z);
    props.add(g);
    addCyl(g, 0.13, 0.2, h, poleMat, 0, h / 2, 0, { seg: 12 });
    for (const y of [0.7, 2.4, 4.9]) {
      addCyl(g, 0.205, 0.205, 0.05, art.toon(0x6f767e), 0, y, 0, { seg: 12 });
    }
    // 横担
    const armY = h - 0.75;
    addBox(g, 2.2, 0.09, 0.11, steel, 0, armY, 0);
    addBox(g, 1.7, 0.09, 0.11, steel, 0, armY - 0.45, 0);
    for (const ax of [-0.95, -0.45, 0.45, 0.95]) {
      addCyl(g, 0.055, 0.055, 0.14, insulatorMat, ax, armY + 0.11, 0, { seg: 6 });
    }
    for (const ax of [-0.7, 0.7]) {
      addCyl(g, 0.055, 0.055, 0.14, insulatorMat, ax, armY - 0.34, 0, { seg: 6 });
    }
    // 变压器
    addCyl(g, 0.28, 0.28, 0.68, art.toon(0x767d85), 0.35, h - 2.1, 0, { seg: 12 });
    addCyl(g, 0.29, 0.29, 0.05, art.toon(0x565d66), 0.35, h - 1.74, 0, { seg: 12 });
    addBox(g, 0.16, 0.5, 0.16, art.toon(0x565d66), 0.35, h - 2.6, 0);
    // 脚踏钉
    for (let i = 0; i < 12; i++) {
      addBox(g, 0.22, 0.025, 0.025, art.toon(0x656c74), 0.12, 1.0 + i * 0.42, 0.05);
    }
    // 灯臂
    const lampY = h - 4.0;
    addTube(g, new THREE.Vector3(0, lampY, 0), new THREE.Vector3(0.25 * lampDir, lampY + 0.25, 0.9 * lampDir), 0.035, steel, 6);
    addTube(g, new THREE.Vector3(0.25 * lampDir, lampY + 0.25, 0.9 * lampDir), new THREE.Vector3(0.25 * lampDir, lampY + 0.28, 1.45 * lampDir), 0.035, steel, 6);
    addBox(g, 0.34, 0.12, 0.6, art.toon(0x5c636c), 0.25 * lampDir, lampY + 0.24, 1.5 * lampDir);
    addBox(g, 0.3, 0.02, 0.5, art.neon(lampColor), 0.25 * lampDir, lampY + 0.17, 1.5 * lampDir, { cast: false });
    // 小牌子
    addPlane(g, 0.3, 0.2, new THREE.MeshBasicMaterial({
      map: signCanvas(192, 128, (ctx, w, hh) => {
        ctx.fillStyle = '#e8c94e';
        ctx.fillRect(0, 0, w, hh);
        ctx.fillStyle = '#2a2a26';
        ctx.font = '700 30px "Yu Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('感電注意', w / 2, 78);
      }),
      toneMapped: true,
    }), 0, 3.2, 0.21);
    // 线圈
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.016, 4, 12), art.toon(0x1d222a));
    coil.position.set(0, h - 3.4, 0.24);
    coil.rotation.y = 0.5;
    g.add(coil);
    builder.grow(g, at, 1.1, { ease: 'outCubic' });
    env.lampHeads.push({
      pos: new THREE.Vector3(x + 0.25 * lampDir, 0.16 + lampY + 0.16, z + 1.5 * lampDir),
      color: lampColor,
      intensity: lampDir === 1 ? 26 : 18,
    });
    return g;
  }

  utilityPole(-6.02, 2.16, 7.3, 5.45, 1, 0xffd39a);
  utilityPole(2.18, -5.85, 6.9, 5.6, -1, 0xcfe4ff);

  // 电线：两根杆之间
  const wireSpan = (a, b, sag, r = 0.012) => {
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    mid.y -= sag;
    addWire(wireGroup, [a, mid, b], r, wireMat, 26);
  };
  const p1 = new THREE.Vector3(-6.02, 6.62, 2.16);
  const p2 = new THREE.Vector3(2.18, 6.22, -5.85);
  for (let i = 0; i < 3; i++) {
    const off = (i - 1) * 0.22;
    wireSpan(p1.clone().setY(6.62 - i * 0.2).setX(p1.x + off), p2.clone().setY(6.22 - i * 0.18).setX(p2.x + off), 0.62, 0.013);
  }
  wireSpan(new THREE.Vector3(-6.02, 5.55, 2.14), new THREE.Vector3(2.18, 5.25, -5.85), 0.8, 0.018);
  wireSpan(new THREE.Vector3(-6.02, 5.42, 2.14), new THREE.Vector3(2.18, 5.12, -5.85), 0.9, 0.015);
  // 引入线
  wireSpan(new THREE.Vector3(-6.02, 5.9, 2.14), new THREE.Vector3(-5.7, 3.95, -0.4), 0.3, 0.011);
  wireSpan(new THREE.Vector3(2.18, 5.8, -5.85), new THREE.Vector3(1.0, 3.6, -4.45), 0.35, 0.011);
  wireSpan(new THREE.Vector3(2.18, 5.68, -5.85), new THREE.Vector3(-0.5, 3.55, -4.45), 0.45, 0.011);
  builder.action(6.4, 0.9, (p) => { wireMat.opacity = p * 0.95; });
}