import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  第一人称漫游 + 交互
 *  - WASD / 方向键移动，鼠标转视角，Shift 快走
 *  - 圆形碰撞体 + 简易 AABB 墙体，只允许在可行走区域活动
 *  - 靠近可交互物时准星旁提示，E / 左键触发
 *  - 便利店门口自动感应开门
 * ------------------------------------------------------------------ */

const EYE_HEIGHT = 1.16;          // 相对地面
const BODY_RADIUS = 0.20;
const WALK_SPEED = 1.35;
const RUN_SPEED = 2.4;
const ACCEL = 11;
const LOOK_SENS = 0.0022;
const MAX_PITCH = Math.PI / 2 - 0.08;

const GROUND_IN = 0.185;   // 店内地面
const GROUND_OUT = 0.16;   // 人行道

/* 可行走区域白名单（世界坐标，俯视矩形）。
 * 由 street.js / store.js 的实际尺寸推算：
 *   便利店  世界 x [-4.4, 1.2]，z [-4.4, 1.0]
 *   左邻    世界 x [-6.25, -5.31]
 *   人行道  前 z [1.0, 2.6] / 东 x [1.6, 2.6]
 */
const WALKABLE = [
  { x0: -4.28, z0: -4.28, x1: 1.08, z1: 1.30, indoor: true },  // 店内（越过门线，与门前区重叠）
  { x0: -4.55, z0: 0.50, x1: 2.45, z1: 2.42 },                  // 门前人行道（向店内延伸，保证重叠）
  { x0: 1.58, z0: -5.95, x1: 2.45, z1: 2.42 },                  // 东侧人行道
  { x0: -5.95, z0: -5.95, x1: 1.58, z1: 1.02 },                 // 街区地坪（含小巷）
];

/* 实心障碍（世界坐标）。镜头不可穿入。 */
const OBSTACLES = [
  // ---- 便利店外壳 ----
  { x0: -4.46, z0: -4.46, x1: -4.24, z1: 1.00 },   // 左墙
  { x0: -4.46, z0: -4.46, x1: 1.24, z1: -4.24 },   // 后墙
  { x0: 1.06, z0: -4.46, x1: 1.26, z1: 1.00 },     // 东侧玻璃幕墙
  { x0: -4.46, z0: 0.90, x1: -0.72, z1: 1.10 },    // 正立面玻璃（门左）
  { x0: 0.56, z0: 0.90, x1: 1.26, z1: 1.10 },      // 正立面玻璃（门右）
  // 门洞 x ∈ [-0.62, 0.46] 不设障碍，自动门滑开后即可通过

  // ---- 店内家具 ----
  { x0: -4.30, z0: -3.25, x1: -3.70, z1: -0.28 },  // 冷柜墙
  { x0: -3.72, z0: -2.58, x1: -1.78, z1: -1.92 },  // 中岛货架 A
  { x0: -3.72, z0: -1.48, x1: -1.78, z1: -0.82 },  // 中岛货架 B
  { x0: -3.58, z0: 0.18, x1: -1.42, z1: 0.66 },    // 杂志架
  { x0: -1.48, z0: -3.72, x1: 1.00, z1: -3.08 },   // 收银台
  { x0: -3.82, z0: -4.28, x1: -0.36, z1: -3.86 },  // 背柜货架
  { x0: -4.06, z0: -4.14, x1: -3.58, z1: -3.70 },  // ATM

  // ---- 左邻建筑 ----
  { x0: -6.30, z0: -6.30, x1: -5.29, z1: 1.02 },

  // ---- 店外道具 ----
  { x0: -4.48, z0: 1.12, x1: -3.36, z1: 1.92 },    // 自动贩卖机
  { x0: -3.06, z0: 1.22, x1: -2.02, z1: 1.94 },    // 自行车
  { x0: -5.62, z0: 1.80, x1: -4.44, z1: 2.26 },    // 公告栏
  { x0: -1.76, z0: 1.42, x1: -1.32, z1: 1.84 },    // 垃圾桶 A
  { x0: -1.34, z0: 1.42, x1: -0.96, z1: 1.84 },    // 垃圾桶 B
  { x0: -1.02, z0: 1.40, x1: -0.54, z1: 1.86 },    // 伞架
  { x0: -1.04, z0: 1.04, x1: -0.70, z1: 1.40 },    // 撑开的伞（门洞左侧）
  { x0: 0.94, z0: 1.02, x1: 1.34, z1: 1.78 },      // 车止柱
  { x0: 2.28, z0: 0.84, x1: 2.62, z1: 2.60 },      // 街角护栏
  { x0: -4.60, z0: 1.00, x1: -4.20, z1: 1.50 },    // 招牌柱
];

function inRect(r, x, z, pad = 0) {
  return x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad;
}

export class Walker {
  constructor(env, opts = {}) {
    this.env = env;
    this.camera = env.camera;
    this.dom = env.renderer.domElement;

    this.active = false;
    this.yaw = 0;
    this.pitch = 0;
    this.velocity = new THREE.Vector3();
    this.keys = new Set();
    this.enabled = true;

    this.onEnter = opts.onEnter || (() => {});
    this.onExit = opts.onExit || (() => {});
    this.onPrompt = opts.onPrompt || (() => {});
    this.onMessage = opts.onMessage || (() => {});

    this.nearby = null;
    this.lookTarget = new THREE.Vector3();
    this._raycaster = new THREE.Raycaster();
    this._tmp = new THREE.Vector3();

    this._bindEvents();
  }

  /* ---------------------------- 进出 ---------------------------- */
  enter() {
    if (this.active) return;
    this.active = true;
    this.velocity.set(0, 0, 0);
    this.keys.clear();
    this.dom.style.cursor = 'crosshair';
    this.onEnter();
    this.refreshPrompt();
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.keys.clear();
    this.velocity.set(0, 0, 0);
    this.dom.style.cursor = '';
    this.lastMsgClear && this.lastMsgClear();
    this.onExit();
  }

  /* 从世界坐标起步（例如点「进店」按钮时从门口开始） */
  placeAt(x, z, yaw = 0) {
    this.camera.position.set(x, this._groundHeight(x, z) + EYE_HEIGHT, z);
    this.yaw = yaw;
    this.pitch = -0.04;
    this.applyLook();
  }

  applyLook() {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    this.camera.quaternion.copy(q);
  }

  /* ---------------------------- 输入 ---------------------------- */
  _bindEvents() {
    this._onKeyDown = (e) => {
      if (!this.active) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
        this.keys.add(k);
        e.preventDefault();
      }
      if (k === 'e') {
        e.preventDefault();
        this.trigger();
      }
    };
    this._onKeyUp = (e) => {
      this.keys.delete(e.key.toLowerCase());
    };
    this._onMouseMove = (e) => {
      if (!this.active) return;
      if (document.pointerLockElement === this.dom) {
        this.yaw -= e.movementX * LOOK_SENS;
        this.pitch -= e.movementY * LOOK_SENS;
      } else if (this._dragging) {
        this.yaw -= e.movementX * LOOK_SENS * 1.4;
        this.pitch -= e.movementY * LOOK_SENS * 1.4;
      } else {
        return;
      }
      this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch));
      this.applyLook();
    };
    this._onMouseDown = (e) => {
      if (!this.active) return;
      if (e.button === 0) {
        if (document.pointerLockElement !== this.dom) {
          this._dragging = true;
          this.dom.requestPointerLock && this.dom.requestPointerLock();
        } else {
          this.trigger();
        }
      }
    };
    this._onMouseUp = () => { this._dragging = false; };
    this._onPointerLockChange = () => {
      if (document.pointerLockElement !== this.dom) this._dragging = false;
    };
    this._onBlur = () => this.keys.clear();

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    this.dom.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    window.addEventListener('blur', this._onBlur);
  }

  /* ---------------------------- 碰撞 ---------------------------- */
  _groundHeight(x, z) {
    return inRect(WALKABLE[0], x, z, -0.02) ? GROUND_IN : GROUND_OUT;
  }

  _blocked(x, z) {
    // 必须在某个可行走矩形内
    let ok = false;
    for (const r of WALKABLE) {
      if (inRect(r, x, z, -BODY_RADIUS)) { ok = true; break; }
    }
    if (!ok) return true;
    // 且不能落在障碍里
    for (const o of OBSTACLES) {
      if (inRect(o, x, z, BODY_RADIUS)) return true;
    }
    return false;
  }

  _move(dx, dz) {
    const p = this.camera.position;
    // 分轴滑动：撞墙时沿墙走，而不是整体卡死
    if (!this._blocked(p.x + dx, p.z)) p.x += dx;
    if (!this._blocked(p.x, p.z + dz)) p.z += dz;
  }

  /* ---------------------------- 交互 ---------------------------- */
  refreshPrompt() {
    if (!this.active) { this.onPrompt(null); this.nearby = null; return; }
    const p = this.camera.position;
    let best = null;
    let bestD = Infinity;
    for (const it of this.env.interactables || []) {
      const target = it.world
        ? it.world
        : this._toWorld(it.local);
      const d = Math.hypot(target.x - p.x, target.z - p.z);
      if (d < it.radius && d < bestD) {
        // 还要大致朝着它看，避免背对也提示
        this._tmp.set(target.x - p.x, 0, target.z - p.z).normalize();
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).setY(0).normalize();
        if (fwd.dot(this._tmp) > 0.2) {
          best = it;
          bestD = d;
        }
      }
    }
    if (best !== this.nearby) {
      this.nearby = best;
      this.onPrompt(best);
    }
  }

  _toWorld(local) {
    const store = this.env.store;
    this._tmp.copy(local);
    if (store) {
      store.updateMatrixWorld();
      this._tmp.applyMatrix4(store.matrixWorld);
    }
    return this._tmp.clone();
  }

  trigger() {
    const it = this.nearby;
    if (it && typeof it.action === 'function') {
      it.action(it);
      return;
    }
    this.onMessage(it ? `${it.title}：${it.desc}` : '这里没有可交互的东西。');
  }

  /* 自动感应门：靠近店门时开 */
  _updateDoor(dt) {
    const door = this.env.storeParts && this.env.storeParts.door;
    if (!door) return;
    const store = this.env.store;
    const near = new THREE.Vector3(1.55, 0, 2.68);
    if (store) { store.updateMatrixWorld(); near.applyMatrix4(store.matrixWorld); }
    const p = this.camera.position;
    const d = Math.hypot(p.x - near.x, p.z - near.z);
    const want = this.active && d < 1.9 ? 1 : 0;
    const cur = door.userData.openAmount || 0;
    const next = THREE.MathUtils.damp(cur, want, 7, dt);
    door.userData.openAmount = next;
    for (const leaf of door.userData.leaves || []) {
      leaf.group.position.x = leaf.closedX + leaf.sign * 0.44 * next;
      // 门滑开后淡出，避免第一人称穿过时看到两层门板叠影
      leaf.group.children.forEach((c) => {
        if (c.material && c.material.transparent) {
          if (c.userData.baseOpacity == null) c.userData.baseOpacity = c.material.opacity;
          c.material.opacity = c.userData.baseOpacity * (1 - next * 0.85);
        }
      });
    }
  }

  /* 冷柜门：靠近时风扇式微开（只是视觉反馈） */
  _updateFridges(dt) {
    const fridges = this.env.storeParts && this.env.storeParts.fridges;
    if (!fridges) return;
    // 交互触发时由 action 直接改，这里只做缓动回弹
    for (const u of fridges.children) {
      if (!u.userData.doorTarget) continue;
      const g = u.userData.doorGroup;
      if (!g) continue;
      g.position.z = THREE.MathUtils.damp(g.position.z, u.userData.doorTarget, 6, dt);
    }
  }

  update(dt) {
    if (!this.active) return;

    // 移动方向
    const f = (this.keys.has('w') || this.keys.has('arrowup') ? 1 : 0) -
              (this.keys.has('s') || this.keys.has('arrowdown') ? 1 : 0);
    const r = (this.keys.has('d') || this.keys.has('arrowright') ? 1 : 0) -
              (this.keys.has('a') || this.keys.has('arrowleft') ? 1 : 0);

    const speed = this.keys.has('shift') ? RUN_SPEED : WALK_SPEED;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));  // yaw=0 面向 -z
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const wish = new THREE.Vector3()
      .addScaledVector(fwd, f)
      .addScaledVector(right, r);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed);

    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, wish.x, ACCEL, dt);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, wish.z, ACCEL, dt);

    if (Math.abs(this.velocity.x) > 1e-4 || Math.abs(this.velocity.z) > 1e-4) {
      this._move(this.velocity.x * dt, this.velocity.z * dt);
    }
    const groundY = this._groundHeight(this.camera.position.x, this.camera.position.z);

    // 轻微走路晃动，增加沉浸感
    const sp = Math.hypot(this.velocity.x, this.velocity.z);
    this._bob = (this._bob || 0) + dt * sp * 8;
    const targetY = groundY + EYE_HEIGHT + Math.sin(this._bob) * 0.012 * Math.min(1, sp);
    // 门槛上下有轻微过渡，不要瞬移
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetY, 12, dt);

    this._updateDoor(dt);
    this._updateFridges(dt);
    this.refreshPrompt();
  }
}

/* ------------------------------------------------------------------ *
 *  HUD：准星、交互提示、消息、操作说明
 *  这是「游戏界面」，与模型区的纯画面区分开；可随时隐藏
 * ------------------------------------------------------------------ */

const HUD_CSS = `
#hud {
  position: fixed; inset: 0; pointer-events: none; z-index: 10;
  font-family: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
  color: #eaf3f8; opacity: 0; visibility: hidden;
  transition: opacity .35s ease, visibility .35s ease;
  -webkit-user-select: none; user-select: none;
}
#hud.on { opacity: 1; visibility: visible; }
#hud .crosshair {
  position: absolute; left: 50%; top: 50%; width: 22px; height: 22px;
  margin: -11px 0 0 -11px;
}
#hud .crosshair::before,
#hud .crosshair::after {
  content: ""; position: absolute; background: rgba(232,244,252,.8);
  box-shadow: 0 0 6px rgba(0,0,0,.8);
}
#hud .crosshair::before { left: 50%; top: 0; width: 2px; height: 100%; margin-left: -1px; }
#hud .crosshair::after { top: 50%; left: 0; height: 2px; width: 100%; margin-top: -1px; }
#hud .crosshair.live::before,
#hud .crosshair.live::after { background: #7fe0d8; }
#hud .prompt {
  position: absolute; left: 50%; top: calc(50% + 34px); transform: translateX(-50%);
  padding: 7px 14px; border-radius: 8px; background: rgba(8,16,24,.72);
  border: 1px solid rgba(127,224,216,.35); backdrop-filter: blur(6px);
  font-size: 13px; white-space: nowrap; opacity: 0; transition: opacity .2s;
}
#hud .prompt.on { opacity: 1; }
#hud .prompt b { color: #7fe0d8; font-weight: 700; margin-right: 6px; }
#hud .prompt i {
  font-style: normal; margin-left: 8px; padding: 1px 6px; border-radius: 4px;
  background: rgba(127,224,216,.16); color: #a8f4ec; font-size: 11px;
}
#hud .msg {
  position: absolute; left: 50%; bottom: 96px; transform: translateX(-50%);
  max-width: 60vw; padding: 10px 18px; border-radius: 10px;
  background: rgba(8,16,24,.8); border: 1px solid rgba(127,224,216,.25);
  backdrop-filter: blur(8px); font-size: 14px; line-height: 1.5; text-align: center;
  opacity: 0; transition: opacity .25s, transform .25s;
}
#hud .msg.on { opacity: 1; transform: translateX(-50%) translateY(-6px); }
#hud .hint {
  position: absolute; left: 24px; bottom: 22px; font-size: 12px; line-height: 1.8;
  color: rgba(220,236,246,.7); text-shadow: 0 1px 3px rgba(0,0,0,.9);
}
#hud .hint kbd {
  display: inline-block; min-width: 16px; padding: 1px 5px; margin-right: 2px;
  border-radius: 4px; background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.2); font-family: inherit; font-size: 11px;
}
#hud .esc {
  position: absolute; right: 24px; top: 22px; font-size: 12px;
  color: rgba(220,236,246,.62); text-shadow: 0 1px 3px rgba(0,0,0,.9);
}
`;

export function createHUD() {
  const style = document.createElement('style');
  style.textContent = HUD_CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'hud';
  root.innerHTML = `
    <div class="crosshair"></div>
    <div class="prompt"></div>
    <div class="msg"></div>
    <div class="esc"><kbd>Esc</kbd> 退出漫游</div>
    <div class="hint">
      <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动 ·
      <kbd>Shift</kbd> 快走 · 鼠标 转身 · <kbd>E</kbd> 交互
    </div>
  `;
  document.body.appendChild(root);

  const cross = root.querySelector('.crosshair');
  const prompt = root.querySelector('.prompt');
  const msg = root.querySelector('.msg');
  let msgTimer = 0;

  return {
    root,
    show(on) { root.classList.toggle('on', on); },
    setPrompt(it) {
      cross.classList.toggle('live', !!it);
      if (it) {
        prompt.innerHTML = `<b>${it.title}</b>${it.desc}<i>E</i>`;
        prompt.classList.add('on');
      } else {
        prompt.classList.remove('on');
      }
    },
    message(text, ms = 2600) {
      msg.textContent = text;
      msg.classList.add('on');
      clearTimeout(msgTimer);
      msgTimer = setTimeout(() => msg.classList.remove('on'), ms);
    },
    clearMessage() {
      clearTimeout(msgTimer);
      msg.classList.remove('on');
    },
  };
}
