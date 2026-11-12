import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { createArt, ease } from './core.js';
import { Builder } from './build.js';
import { buildStreet } from './street.js';
import { buildStore } from './store.js';
import { buildAlley } from './alley.js';
import { buildProps } from './props.js';
import { buildLights } from './lights.js';
import { buildEffects } from './effects.js';

/* ------------------------------------------------------------------ *
 *  雨夜便利店街角 · 微缩模型
 *  三渲二 / 自由环视 / 自地面向上组装
 * ------------------------------------------------------------------ */

const app = document.querySelector('#app');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b1526, 0.028);

// 深蓝夜空渐变
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(70, 32, 18),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x070e1c) },
      midColor: { value: new THREE.Color(0x122138) },
      bottomColor: { value: new THREE.Color(0x03050a) },
    },
    vertexShader: /* glsl */`
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      varying vec3 vPos;
      void main() {
        float h = normalize(vPos).y;
        vec3 c = mix(bottomColor, midColor, smoothstep(-0.35, 0.12, h));
        c = mix(c, topColor, smoothstep(0.08, 0.95, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  }),
);
scene.add(sky);

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 140);
const FINAL_CAM = new THREE.Vector3(10.4, 7.9, 14.4);
const START_CAM = new THREE.Vector3(15.6, 16.2, 20.8);
camera.position.copy(START_CAM);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-0.35, 1.55, 0.0);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 7.5;
controls.maxDistance = 34;
controls.minPolarAngle = 0.18;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.3;
controls.update();

const art = createArt();
const builder = new Builder();
const env = { THREE, scene, root: scene, art, builder, camera, renderer };

buildStreet(env);
buildStore(env);
buildAlley(env);
buildProps(env);
buildLights(env);
const effects = buildEffects(env);

builder.prepare();

/* ------------------------------ 后期 ------------------------------ */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.42, 0.5, 1.0);
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.setSize(window.innerWidth, window.innerHeight);
if (composer.renderTarget1) composer.renderTarget1.samples = 4;
if (composer.renderTarget2) composer.renderTarget2.samples = 4;

/* --------------------------- 镜头入场 --------------------------- */
let introActive = true;
let introTime = 0;
const INTRO_DUR = 10.2;
let lastInteraction = performance.now();

renderer.domElement.addEventListener('pointerdown', () => {
  introActive = false;
  lastInteraction = performance.now();
  controls.autoRotate = false;
});
renderer.domElement.addEventListener('wheel', () => {
  introActive = false;
  lastInteraction = performance.now();
  controls.autoRotate = false;
}, { passive: true });
controls.addEventListener('start', () => {
  introActive = false;
  lastInteraction = performance.now();
  controls.autoRotate = false;
});
controls.addEventListener('end', () => {
  lastInteraction = performance.now();
});

// 内联 favicon，避免 404
const favicon = document.createElement('link');
favicon.rel = 'icon';
favicon.href = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0b2a2e"/><rect x="6" y="12" width="20" height="4" fill="#1aa7a2"/><rect x="8" y="17" width="16" height="9" fill="#ffe3b0"/><circle cx="16" cy="8" r="2.4" fill="#7fe0d8"/></svg>`,
);
document.head.appendChild(favicon);

window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') window.location.reload();
});

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w, h);
  effects.resize(h, camera.fov, renderer.getPixelRatio());
});

const clock = new THREE.Clock();
effects.resize(window.innerHeight, camera.fov, renderer.getPixelRatio());

function animate() {
  const dt = Math.min(clock.getDelta(), 0.12);
  builder.update(dt);
  effects.update(dt);

  if (introActive) {
    introTime += dt;
    const p = Math.min(1, introTime / INTRO_DUR);
    const e = ease.inOutCubic(p);
    camera.position.lerpVectors(START_CAM, FINAL_CAM, e);
    // 开场时目标点略高，落幅时回到模型中心
    controls.target.set(-0.35, 1.55 + (1 - e) * 0.7, 0.0);
    if (p >= 1) introActive = false;
  } else {
    const idle = performance.now() - lastInteraction;
    controls.autoRotate = !introActive && builder.done && idle > 7000;
  }

  controls.update();

  // 轻微呼吸感，让模型像被展示灯照着
  sky.position.copy(camera.position);

  composer.render();
  requestAnimationFrame(animate);
}

// 心跳：桌面启动器启动的本地服务在页面关闭后自行退出
setInterval(() => {
  fetch('/__beat', { cache: 'no-store' }).catch(() => {});
}, 20000);
fetch('/__beat', { cache: 'no-store' }).catch(() => {});

window.__RAINY = {
  scene, camera, renderer, controls, builder, effects,
  setTime(t) {
    builder.time = t;
    builder.done = false;
    builder.update(0.0001);
  },
  finish() {
    introActive = false;
    builder.time = 200;
    builder.done = false;
    builder.update(0.0001);
    effects.fastForward(12);
    camera.position.copy(FINAL_CAM);
    controls.target.set(-0.35, 1.55, 0.0);
    controls.update();
  },
  finalCamera() {
    introActive = false;
    camera.position.copy(FINAL_CAM);
    controls.target.set(-0.35, 1.55, 0.0);
    controls.update();
  },
};

animate();