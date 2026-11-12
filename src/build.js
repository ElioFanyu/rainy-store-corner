import { ease } from './core.js';

/* 自地面向上组装的入场时间线
 * 每一件在 at 时刻「出现」，随后完成上升 / 落下 / 生长 / 弹入，
 * 未到场的构件完全隐藏，形成由散件逐步拼装成完整模型的效果。 */
export class Builder {
  constructor() {
    this.time = 0;
    this.items = [];
    this.actions = [];
    this.done = false;
    this.endCallbacks = [];
    this.duration = 0;
  }

  _register(obj, at, dur, kind, opts = {}) {
    this.items.push({
      obj,
      at,
      dur,
      kind,
      dist: opts.dist ?? 1.4,
      ease: ease[opts.ease || (kind === 'drop' ? 'outBack' : 'outCubic')] || ease.outCubic,
      startScale: opts.startScale ?? 0.001,
      basePos: null,
      baseScale: null,
    });
    this.duration = Math.max(this.duration, at + dur);
    return this;
  }

  rise(obj, at, dur = 0.9, opts = {}) {
    return this._register(obj, at, dur, 'rise', opts);
  }

  drop(obj, at, dur = 0.9, opts = {}) {
    return this._register(obj, at, dur, 'drop', opts);
  }

  grow(obj, at, dur = 0.85, opts = {}) {
    return this._register(obj, at, dur, 'grow', opts);
  }

  pop(obj, at, dur = 0.55, opts = {}) {
    return this._register(obj, at, dur, 'pop', opts);
  }

  action(at, dur, fn) {
    this.actions.push({ at, dur, fn, done: false });
    this.duration = Math.max(this.duration, at + dur);
    return this;
  }

  onEnd(fn) {
    this.endCallbacks.push(fn);
  }

  prepare() {
    for (const it of this.items) {
      it.basePos = it.obj.position.clone();
      it.baseScale = it.obj.scale.clone();
      it.obj.visible = false;
      if (it.kind === 'rise') it.obj.position.y = it.basePos.y - it.dist;
      if (it.kind === 'drop') it.obj.position.y = it.basePos.y + it.dist;
      if (it.kind === 'grow') it.obj.scale.y = it.startScale;
      if (it.kind === 'pop') it.obj.scale.setScalar(it.startScale);
    }
    for (const a of this.actions) {
      if (a.at <= 0) a.fn(0);
    }
  }

  update(dt) {
    if (this.done) return;
    this.time += dt;
    const t = this.time;

    for (const it of this.items) {
      const raw = (t - it.at) / it.dur;
      if (raw <= 0) continue;
      const p = Math.min(1, raw);
      const e = it.ease(p);
      it.obj.visible = true;

      if (it.kind === 'rise') {
        it.obj.position.y = it.basePos.y - it.dist * (1 - e);
        const s = 0.9 + 0.1 * e;
        it.obj.scale.set(it.baseScale.x * s, it.baseScale.y * s, it.baseScale.z * s);
      } else if (it.kind === 'drop') {
        it.obj.position.y = it.basePos.y + it.dist * (1 - e);
        const s = 0.9 + 0.1 * e;
        it.obj.scale.set(it.baseScale.x * s, it.baseScale.y * s, it.baseScale.z * s);
      } else if (it.kind === 'grow') {
        it.obj.scale.y = it.startScale + (it.baseScale.y - it.startScale) * e;
        it.obj.scale.x = it.baseScale.x;
        it.obj.scale.z = it.baseScale.z;
      } else if (it.kind === 'pop') {
        it.obj.scale.setScalar(it.startScale + (it.baseScale.x - it.startScale) * e);
      }

      if (p >= 1) {
        if (it.kind === 'rise' || it.kind === 'drop') it.obj.position.copy(it.basePos);
        it.obj.scale.copy(it.baseScale);
      }
    }

    for (const a of this.actions) {
      if (a.done) continue;
      const p = Math.min(1, Math.max(0, (t - a.at) / a.dur));
      if (p <= 0) continue;
      a.fn(p);
      if (p >= 1) a.done = true;
    }

    if (t >= this.duration) {
      this.done = true;
      for (const it of this.items) {
        it.obj.visible = true;
        it.obj.position.copy(it.basePos);
        if (it.kind !== 'grow' && it.kind !== 'pop') it.obj.scale.copy(it.baseScale);
        else it.obj.scale.copy(it.baseScale);
      }
      this.endCallbacks.forEach((fn) => fn());
    }
  }
}