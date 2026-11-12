import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  雨夜灯光：冷月光 + 暖室内 + 街灯 + 霓虹
 *  全部使用物理衰减，强度以「灯下 1.5m 处约 1.0」为基准
 * ------------------------------------------------------------------ */

export function buildLights(env) {
  const { scene, builder } = env;

  scene.add(new THREE.HemisphereLight(0x4a6a9a, 0x0a0e15, 0.42));
  scene.add(new THREE.AmbientLight(0x24344d, 0.5));

  const moon = new THREE.DirectionalLight(0x9dbdf0, 1.35);
  moon.position.set(-9, 13, -7);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1536, 1536);
  moon.shadow.camera.left = -10;
  moon.shadow.camera.right = 10;
  moon.shadow.camera.top = 10;
  moon.shadow.camera.bottom = -10;
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 42;
  moon.shadow.bias = -0.0005;
  moon.shadow.normalBias = 0.03;
  scene.add(moon);
  scene.add(moon.target);
  moon.target.position.set(0, 0.8, 0);

  const rim = new THREE.DirectionalLight(0x4f7ab5, 0.5);
  rim.position.set(9, 6, -9);
  scene.add(rim);

  const pt = (color, target, distance, x, y, z, decay = 2) => {
    const light = new THREE.PointLight(color, 0, distance, decay);
    light.position.set(x, y, z);
    scene.add(light);
    return { light, target };
  };
  const ramp = (from, dur, items) => {
    builder.action(from, dur, (p) => {
      for (const it of items) it.light.intensity = it.target * p;
    });
  };

  const interiorA = pt(0xffc37a, 5.6, 9, -2.55, 2.55, -1.0);
  const interiorB = pt(0xffcf90, 4.9, 8.5, -0.3, 2.55, -2.2);
  const interiorC = pt(0xffc985, 4.2, 7.5, 1.6, 2.5, -0.4);
  const interiorD = pt(0xffd9a6, 3.4, 6.5, -0.6, 2.2, 1.1);
  const interiorE = pt(0xffe3b8, 2.2, 5.0, -2.3, 1.4, -2.2);
  const canopy = pt(0xffd49a, 1.6, 4.6, -1.35, 2.4, 2.15);
  const vending = pt(0xffa77e, 1.35, 3.4, -4.5, 1.3, 2.35);
  const alley = env.alleyLamp
    ? pt(0xffc48f, 1.7, 4.5, env.alleyLamp.x, env.alleyLamp.y, env.alleyLamp.z)
    : null;
  const lantern = pt(0xff7a5c, 0.9, 2.8, -6.1, 2.2, 1.7);
  const signGlow = pt(0x5fd8d0, 1.1, 4, -1.4, 3.2, 1.2);
  const street = env.lampHeads.map((lamp) => pt(lamp.color, lamp.intensity, 18, lamp.pos.x, lamp.pos.y, lamp.pos.z));

  ramp(2.95, 1.0, [interiorA, interiorB]);
  ramp(3.2, 0.9, [interiorC, interiorD]);
  ramp(3.55, 0.8, [interiorE]);
  ramp(3.7, 0.7, [lantern]);
  if (alley) ramp(3.6, 0.8, [alley]);
  ramp(4.75, 0.7, [canopy]);
  ramp(5.75, 0.8, [vending]);
  ramp(6.35, 0.9, [signGlow, ...street]);
}