import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  雨夜便利店街角 —— 美术基础层
 *  三渲二：MeshToonMaterial + 阶梯渐变 + 反向外壳描边
 * ------------------------------------------------------------------ */

export const PAL = {
  ink: 0x11151c,
  night: 0x050911,
  fog: 0x07101c,
  asphalt: 0x252c38,
  asphaltDark: 0x1b212b,
  sidewalk: 0x9aa0a8,
  sidewalkDark: 0x767c86,
  curb: 0xb3b8bf,
  concrete: 0x7b828b,
  wall: 0xe8e4d8,
  wallShade: 0xcfcabd,
  teal: 0x1aa7a2,
  tealDeep: 0x0d5b62,
  tealLight: 0x7fe0d8,
  warm: 0xffe3b0,
  warmDeep: 0xf3b45c,
  red: 0xe0554a,
  pink: 0xff6e94,
  blue: 0x6fa8ff,
  glass: 0xa9d8e4,
  white: 0xf4f6f8,
  steel: 0x8d949e,
  steelDark: 0x4c525c,
  wood: 0x6b4b38,
  roof: 0x3d4652,
};

/* 画布贴图 ---------------------------------------------------------- */

export function canvasTexture(w, h, draw, opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (opts.repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
  tex.needsUpdate = true;
  return tex;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeAsphalt() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const rnd = seeded(11);
    ctx.fillStyle = '#252b36';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = 22 + rnd() * 70;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const dark = rnd() > 0.45;
      g.addColorStop(0, dark ? 'rgba(16,20,27,0.30)' : 'rgba(70,80,96,0.18)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    for (let i = 0; i < 4200; i++) {
      const v = 26 + Math.floor(rnd() * 50);
      ctx.fillStyle = `rgba(${v},${v + 5},${v + 12},${0.16 + rnd() * 0.2})`;
      const s = 1 + rnd() * 2.4;
      ctx.fillRect(rnd() * w, rnd() * h, s, s);
    }
  }, { repeat: [5, 2] });
}

function makeSidewalk() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const rnd = seeded(29);
    ctx.fillStyle = '#868c96';
    ctx.fillRect(0, 0, w, h);
    const n = 4;
    const cell = w / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = 128 + Math.floor(rnd() * 24);
        ctx.fillStyle = `rgb(${v},${v + 4},${v + 10})`;
        ctx.fillRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4);
      }
    }
    ctx.strokeStyle = 'rgba(70,76,86,0.85)';
    ctx.lineWidth = 4;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, h);
      ctx.moveTo(0, i * cell);
      ctx.lineTo(w, i * cell);
      ctx.stroke();
    }
    for (let i = 0; i < 1800; i++) {
      const v = 100 + Math.floor(rnd() * 65);
      ctx.fillStyle = `rgba(${v},${v},${v + 8},${0.12 + rnd() * 0.2})`;
      ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
    }
  }, { repeat: [4, 1] });
}

function makeConcrete() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const rnd = seeded(71);
    ctx.fillStyle = '#6f7580';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const v = 70 + Math.floor(rnd() * 70);
      ctx.fillStyle = `rgba(${v},${v + 3},${v + 8},0.25)`;
      ctx.fillRect(rnd() * w, rnd() * h, 1.5, 1.5);
    }
    ctx.strokeStyle = 'rgba(50,55,62,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }, { repeat: [3, 3] });
}

function makeFloorTile() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const rnd = seeded(7);
    ctx.fillStyle = '#d9d2c2';
    ctx.fillRect(0, 0, w, h);
    const n = 4;
    const cell = w / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = 214 + Math.floor(rnd() * 18);
        ctx.fillStyle = `rgb(${v},${v - 5},${v - 20})`;
        ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      }
    }
    ctx.strokeStyle = 'rgba(150,142,126,0.7)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, h);
      ctx.moveTo(0, i * cell);
      ctx.lineTo(w, i * cell);
      ctx.stroke();
    }
  }, { repeat: [8, 8] });
}

function makeRadial(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, inner);
    g.addColorStop(0.45, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function makeSoftStreak() {
  return canvasTexture(128, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.28, 'rgba(255,255,255,0.34)');
    g.addColorStop(0.72, 'rgba(255,255,255,0.10)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 46; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.3})`;
      ctx.fillRect(x, y, 2 + Math.random() * 10, 4 + Math.random() * 24);
    }
  });
}

function makeGlassStreak() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.5);
    const g = ctx.createLinearGradient(-w * 0.6, 0, w * 0.6, 0);
    g.addColorStop(0, 'rgba(210,240,255,0)');
    g.addColorStop(0.34, 'rgba(210,240,255,0.06)');
    g.addColorStop(0.45, 'rgba(225,248,255,0.34)');
    g.addColorStop(0.52, 'rgba(180,220,255,0.08)');
    g.addColorStop(0.62, 'rgba(255,255,255,0.2)');
    g.addColorStop(0.7, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-w, -h, w * 2, h * 2);
    ctx.restore();
  });
}

function posterTexture(seed, accent, headline, sub) {
  return canvasTexture(256, 360, (ctx, w, h) => {
    const rnd = seeded(seed);
    ctx.fillStyle = '#f6f1e4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, 86);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '700 40px "Yu Gothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(headline, w / 2, 58);
    ctx.fillStyle = '#39332c';
    ctx.font = '600 26px "Yu Gothic", "Meiryo", sans-serif';
    ctx.fillText(sub, w / 2, 128);
    ctx.fillStyle = '#d8cfc0';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(24, 158 + i * 26, 208 - rnd() * 70, 9);
    }
    ctx.fillStyle = accent;
    ctx.font = '700 30px "Yu Gothic", "Meiryo", sans-serif';
    ctx.fillText('NEW!', w / 2, 316);
    ctx.strokeStyle = 'rgba(40,36,30,0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(7, 7, w - 14, h - 14);
  });
}

/* 美术工具 ---------------------------------------------------------- */

export function createArt() {
  const gradientData = new Uint8Array([46, 104, 158, 210, 255]);
  const gradientMap = new THREE.DataTexture(gradientData, gradientData.length, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;

  const toon = (color, opts = {}) => new THREE.MeshToonMaterial({ color, gradientMap, ...opts });
  const flat = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });
  const neon = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, toneMapped: false, ...opts });

  const asphalt = makeAsphalt();
  const sidewalk = makeSidewalk();
  const concrete = makeConcrete();
  const floorTile = makeFloorTile();
  const radial = makeRadial();
  const streak = makeSoftStreak();
  const glassStreak = makeGlassStreak();

  const glassMat = new THREE.MeshBasicMaterial({
    color: 0xa9d6e4,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const glassStreakMat = new THREE.MeshBasicMaterial({
    map: glassStreak,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const glowMat = (color, opacity = 0.7) => new THREE.MeshBasicMaterial({
    map: radial,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const streakMat = (color, opacity = 0.4) => new THREE.MeshBasicMaterial({
    map: streak,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });

  const posters = [
    posterTexture(3, '#1aa7a2', '新発売', '期間限定'),
    posterTexture(19, '#e0554a', 'SALE', '本日限り'),
    posterTexture(31, '#4f6fbf', '地域情報', 'お知らせ'),
    posterTexture(47, '#f0a84a', 'HOT', 'あったか〜い'),
  ];

  return {
    gradientMap, toon, flat, neon,
    textures: { asphalt, sidewalk, concrete, floorTile, radial, streak, glassStreak, posters },
    glassMat, glassStreakMat, glowMat, streakMat,
    palette: PAL,
  };
}

/* 几何工具 ---------------------------------------------------------- */

export function addOutline(mesh, thickness = 0.0042, color = 0x0a0e15) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: /* glsl */`
      uniform float uThickness;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec4 clip = projectionMatrix * mv;
        vec3 n = normalize(normalMatrix * normal);
        clip.xy += n.xy * uThickness * clip.w;
        gl_Position = clip;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      void main() {
        gl_FragColor = vec4(uColor, 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  const outline = new THREE.Mesh(mesh.geometry, mat);
  outline.castShadow = false;
  outline.receiveShadow = false;
  mesh.add(outline);
  return outline;
}

export function addBox(parent, w, h, d, mat, x = 0, y = 0, z = 0, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  if (opts.rx) mesh.rotation.x = opts.rx;
  if (opts.ry) mesh.rotation.y = opts.ry;
  if (opts.rz) mesh.rotation.z = opts.rz;
  mesh.castShadow = opts.cast !== false;
  mesh.receiveShadow = opts.receive !== false;
  parent.add(mesh);
  if (opts.outline) addOutline(mesh, opts.outline);
  return mesh;
}

export function addCyl(parent, rTop, rBottom, h, mat, x = 0, y = 0, z = 0, opts = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, opts.seg || 14, 1, opts.open || false),
    mat,
  );
  mesh.position.set(x, y, z);
  if (opts.rx) mesh.rotation.x = opts.rx;
  if (opts.ry) mesh.rotation.y = opts.ry;
  if (opts.rz) mesh.rotation.z = opts.rz;
  mesh.castShadow = opts.cast !== false;
  mesh.receiveShadow = opts.receive !== false;
  parent.add(mesh);
  if (opts.outline) addOutline(mesh, opts.outline);
  return mesh;
}

export function addSphere(parent, r, mat, x = 0, y = 0, z = 0, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, opts.seg || 14, opts.seg || 10), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = opts.cast !== false;
  mesh.receiveShadow = opts.receive !== false;
  if (opts.sx || opts.sy || opts.sz) mesh.scale.set(opts.sx || 1, opts.sy || 1, opts.sz || 1);
  parent.add(mesh);
  return mesh;
}

export function addPlane(parent, w, h, mat, x = 0, y = 0, z = 0, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(opts.rx ?? 0, opts.ry ?? 0, opts.rz ?? 0);
  mesh.castShadow = false;
  mesh.receiveShadow = opts.receive !== false;
  parent.add(mesh);
  return mesh;
}

export function addTube(parent, a, b, r, mat, seg = 7) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg, 1), mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function addWire(parent, points, r, mat, tubular = 28) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const geo = new THREE.TubeGeometry(curve, tubular, r, 4, false);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

export function enableShadows(root) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
}

export const ease = {
  linear: (t) => t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t) => {
    const c1 = 1.2;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};