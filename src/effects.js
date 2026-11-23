import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  雨、地面涟漪、水汽、霓虹闪烁
 * ------------------------------------------------------------------ */

const splatVertex = /* glsl */`
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uScale;
  varying float vLife;
  void main() {
    float life = fract(uTime * 0.5 + aPhase);
    vLife = life;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = min(44.0, mix(0.03, 0.26, life) * aSize * uScale / max(1.0, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;

const splatFragment = /* glsl */`
  varying float vLife;
  uniform float uOpacity;
  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float d = length(uv);
    float ring = (1.0 - smoothstep(0.82, 0.98, d)) * smoothstep(0.62, 0.82, d);
    float a = ring * pow(1.0 - vLife, 1.6) * uOpacity;
    if (a < 0.012) discard;
    gl_FragColor = vec4(0.70, 0.85, 1.0, a);
  }
`;


// 屋顶遮挡范围（世界坐标）。屋顶下的雨滴直接跳过，避免室内下雨。
const ROOFS = [
  { x0: -4.55, z0: -4.55, x1: 1.35, z1: 1.15 },   // 便利店
  { x0: -6.30, z0: -6.30, x1: -5.30, z1: 1.05 },  // 左邻小酒馆
];
function underRoof(x, z, y) {
  if (y < 3.2) return false;   // 高于屋顶才需要判断
  for (const r of ROOFS) {
    if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return true;
  }
  return false;
}

export function buildEffects(env) {

  const { art, scene, builder } = env;
  const rainRoot = new THREE.Group();
  scene.add(rainRoot);

  /* ------------------------------- 雨丝 ------------------------------- */
  const COUNT = 1250;
  const positions = new Float32Array(COUNT * 6);
  const drops = [];
  for (let i = 0; i < COUNT; i++) {
    const x = -7.8 + Math.random() * 15.6;
    const z = -7.8 + Math.random() * 15.6;
    const y = -0.5 + Math.random() * 12.5;
    const speed = 8.5 + Math.random() * 5.5;
    const len = 0.35 + Math.random() * 0.55;
    drops.push({ x, y, z, speed, len });
    const o = i * 6;
    positions[o] = x;
    positions[o + 1] = y;
    positions[o + 2] = z;
    positions[o + 3] = x + 0.03;
    positions[o + 4] = y + len;
    positions[o + 5] = z + 0.01;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0xaec9ea,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  rainRoot.add(rain);
  builder.action(7.35, 1.4, (p) => { rainMat.opacity = p * 0.28; });

  /* ----------------------------- 地面雨点 ----------------------------- */
  const SPLASH = 110;
  const splatPositions = new Float32Array(SPLASH * 3);
  const phases = new Float32Array(SPLASH);
  const sizes = new Float32Array(SPLASH);
  for (let i = 0; i < SPLASH; i++) {
    let x = -6.9 + Math.random() * 13.8;
    let z = -6.9 + Math.random() * 13.8;
    let y = 0.06;
    if (x < 1.2 && z < 1.0) {
      // 避开建筑内部，落在后场或小巷
      if (Math.random() > 0.5) {
        x = -5.8 + Math.random() * 1.2;
        y = 0.135;
      } else {
        x = -4.2 + Math.random() * 5.2;
        z = -6.6 + Math.random() * 2.0;
        y = 0.135;
      }
    } else if (z > 2.4 || x > 2.4) {
      y = 0.035;
    } else {
      y = 0.17;
    }
    splatPositions[i * 3] = x;
    splatPositions[i * 3 + 1] = y;
    splatPositions[i * 3 + 2] = z;
    phases[i] = Math.random();
    sizes[i] = 0.4 + Math.random() * 0.5;
  }
  const splatGeo = new THREE.BufferGeometry();
  splatGeo.setAttribute('position', new THREE.BufferAttribute(splatPositions, 3));
  splatGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  splatGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const splatMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 900 },
      uOpacity: { value: 0 },
    },
    vertexShader: splatVertex,
    fragmentShader: splatFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const splats = new THREE.Points(splatGeo, splatMat);
  splats.frustumCulled = false;
  rainRoot.add(splats);
  builder.action(7.4, 1.2, (p) => { splatMat.uniforms.uOpacity.value = p * 0.34; });

  /* ------------------------------- 水汽 ------------------------------- */
  const mistCount = 26;
  const mistPositions = new Float32Array(mistCount * 3);
  const mistData = [];
  const emitterA = new THREE.Vector3(-5.15, 0.4, -3.3);
  const emitterB = new THREE.Vector3(0.65, 0.45, -5.5);
  for (let i = 0; i < mistCount; i++) {
    const base = i % 2 === 0 ? emitterA : emitterB;
    const p = {
      x: base.x + (Math.random() - 0.5) * 0.5,
      y: base.y + Math.random() * 1.4,
      z: base.z + (Math.random() - 0.5) * 0.5,
      vy: 0.12 + Math.random() * 0.16,
      vx: (Math.random() - 0.5) * 0.08,
      base,
    };
    mistData.push(p);
    mistPositions[i * 3] = p.x;
    mistPositions[i * 3 + 1] = p.y;
    mistPositions[i * 3 + 2] = p.z;
  }
  const mistGeo = new THREE.BufferGeometry();
  mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
  const mistMat = new THREE.PointsMaterial({
    map: art.textures.radial,
    color: 0x9dbdd4,
    size: 1.0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    toneMapped: false,
  });
  const mist = new THREE.Points(mistGeo, mistMat);
  mist.frustumCulled = false;
  scene.add(mist);
  builder.action(4.0, 1.6, (p) => { mistMat.opacity = p * 0.09; });

  /* ----------------------------- 灯光雾气 ----------------------------- */
  const halos = [];
  const haloAt = (color, scale, opacity, x, y, z) => {
    const mat = new THREE.SpriteMaterial({
      map: art.textures.radial,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(scale, scale, 1);
    scene.add(sprite);
    halos.push({ mat, base: opacity });
  };
  if (env.lampHeads[0]) haloAt(0xffcf96, 2.4, 0.16, env.lampHeads[0].pos.x, env.lampHeads[0].pos.y, env.lampHeads[0].pos.z);
  if (env.lampHeads[1]) haloAt(0xbcd9ff, 1.9, 0.12, env.lampHeads[1].pos.x, env.lampHeads[1].pos.y, env.lampHeads[1].pos.z);
  haloAt(0xffb08a, 1.3, 0.12, -3.92, 1.35, 2.1);
  haloAt(0xffd9a5, 1.6, 0.1, -1.6, 2.42, 1.7);

  /* ----------------------------- 霓虹抖动 ----------------------------- */
  const hash = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  let elapsed = 0;
  const tmpColor = new THREE.Color();

  function update(dt) {
    elapsed += dt;
    const t = elapsed;

    // 雨
    if (rainMat.opacity > 0.001) {
      const windX = 0.55;
      const windZ = 0.12;
      for (let i = 0; i < COUNT; i++) {
        const d = drops[i];
        d.y -= d.speed * dt;
        d.x += windX * dt;
        d.z += windZ * dt;
        if (d.y < -0.6 || underRoof(d.x, d.z, d.y)) {
          // 重新投放到屋顶之外，循环直到落在空旷处
          let tries = 0;
          do {
            d.y = 10.5 + Math.random() * 2.0;
            d.x = -7.8 + Math.random() * 15.6;
            d.z = -7.8 + Math.random() * 15.6;
            tries++;
          } while (underRoof(d.x, d.z, d.y) && tries < 12);
          if (underRoof(d.x, d.z, d.y)) {
            // 仍被遮住：贴到屋顶上方外沿，保证不穿过室内
            d.y = 10.5 + Math.random() * 2.0;
            d.x = 2.2 + Math.random() * 5.0;
          }
        }
        if (d.x > 8) d.x -= 16;
        const o = i * 6;
        positions[o] = d.x;
        positions[o + 1] = d.y;
        positions[o + 2] = d.z;
        positions[o + 3] = d.x + 0.06;
        positions[o + 4] = d.y + d.len;
        positions[o + 5] = d.z + 0.015;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }

    splatMat.uniforms.uTime.value = t;

    // 水汽
    if (mistMat.opacity > 0.001) {
      for (let i = 0; i < mistCount; i++) {
        const p = mistData[i];
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        if (p.y > p.base.y + 2.4) {
          p.y = p.base.y;
          p.x = p.base.x + (Math.random() - 0.5) * 0.5;
          p.z = p.base.z + (Math.random() - 0.5) * 0.5;
        }
        mistPositions[i * 3] = p.x;
        mistPositions[i * 3 + 1] = p.y;
        mistPositions[i * 3 + 2] = p.z;
      }
      mistGeo.attributes.position.needsUpdate = true;
    }

    // 霓虹启辉与呼吸
    const neon = env.storeNeon || [];
    for (let i = 0; i < neon.length; i++) {
      const item = neon[i];
      let k = 0.1;
      if (t > 5.1) {
        if (t < 6.45) {
          const step = Math.floor(t * 16);
          k = hash(step + i * 3.3) > 0.52 ? 1 : 0.16;
        } else {
          k = 0.93 + 0.07 * Math.sin(t * 4.2 + i);
          if (hash(Math.floor(t * 2.1) + i * 7) > 0.975) k = 0.42;
        }
      }
      item.mat.color.copy(item.base).multiplyScalar(k);
    }

    // 水雾光晕轻微呼吸
    for (let i = 0; i < halos.length; i++) {
      const h = halos[i];
      h.mat.opacity = (h.base + Math.sin(t * 1.7 + i) * 0.015) * Math.min(1, Math.max(0, (t - 6.3) / 1.5));
    }
  }

  function resize(height, fov, pixelRatio) {
    const scale = (height * pixelRatio) / (2 * Math.tan((fov * Math.PI) / 360));
    splatMat.uniforms.uScale.value = scale;
  }

  function fastForward(t) {
    elapsed = t;
    splatMat.uniforms.uTime.value = t;
    const neon = env.storeNeon || [];
    for (let i = 0; i < neon.length; i++) {
      const k = 0.93 + 0.07 * Math.sin(t * 4.2 + i);
      neon[i].mat.color.copy(neon[i].base).multiplyScalar(k);
    }
  }

  return { update, resize, fastForward };
}