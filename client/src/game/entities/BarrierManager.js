import * as THREE from 'three';
import { WORLD_WIDTH } from '../constants.js';

const SCORE_INTERVAL  = 1000;
const BARRIER_H       = 0.5;
const CUBE_W          = 0.42;
const CUBE_GAP        = 0.14;
const SPAWN_ABOVE     = 14;   // world units above camera centre when spawned
const FLASH_DURATION  = 0.55; // seconds
const FLASH_RATE      = 14;   // toggles per second

const CUBE_COUNT = Math.floor((WORLD_WIDTH + CUBE_GAP) / (CUBE_W + CUBE_GAP));
const ROW_W      = CUBE_COUNT * (CUBE_W + CUBE_GAP) - CUBE_GAP;
const START_X    = -ROW_W / 2 + CUBE_W / 2;

export class BarrierManager {
  constructor(scene) {
    this.scene    = scene;
    this.barriers = [];
    this._next    = SCORE_INTERVAL;
    this._time    = 0;

    this._cubeGeo = new THREE.BoxGeometry(CUBE_W, BARRIER_H, CUBE_W);
    this._glowGeo = new THREE.BoxGeometry(ROW_W + 0.4, BARRIER_H + 0.3, 0.3);
    this._cubeMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });
    this._glowMat = new THREE.MeshBasicMaterial({ color: 0xff6677, transparent: true, opacity: 0.28 });
  }

  reset() {
    for (const b of this.barriers) this.scene.remove(b.group);
    this.barriers = [];
    this._next    = SCORE_INTERVAL;
    this._time    = 0;
  }

  update(score, cameraY, dt) {
    this._time += dt;

    // Pulse glow
    this._glowMat.opacity = 0.15 + Math.abs(Math.sin(this._time * 4)) * 0.3;

    // Spawn barrier when score crosses threshold
    if (score >= this._next) {
      this._spawn(cameraY + SPAWN_ABOVE);
      this._next += SCORE_INTERVAL;
    }

    // Flash-then-remove dying barriers
    for (let i = this.barriers.length - 1; i >= 0; i--) {
      const b = this.barriers[i];
      if (!b.dying) continue;
      b.flashTimer += dt;
      b.group.visible = Math.floor(b.flashTimer * FLASH_RATE) % 2 === 0;
      if (b.flashTimer >= FLASH_DURATION) {
        this.scene.remove(b.group);
        this.barriers.splice(i, 1);
      }
    }
  }

  // Returns live barrier if projectile passed through it this frame
  checkProjectileHit(projY, prevProjY) {
    for (const b of this.barriers) {
      if (b.dying) continue;
      const top = b.y + BARRIER_H * 0.5;
      const bot = b.y - BARRIER_H * 0.5;
      if (prevProjY < top && projY >= bot) return b;
    }
    return null;
  }

  // Returns live barrier if player is colliding with it from below
  checkPlayerCollision(playerTop, prevPlayerTop) {
    for (const b of this.barriers) {
      if (b.dying) continue;
      const bot = b.y - BARRIER_H * 0.5;
      if (prevPlayerTop <= bot && playerTop > bot) return b;
    }
    return null;
  }

  destroy(barrier) {
    barrier.dying      = true;
    barrier.flashTimer = 0;
  }

  getLiveBarriers() {
    return this.barriers.filter(b => !b.dying);
  }

  _spawn(y) {
    const group = new THREE.Group();

    const glow = new THREE.Mesh(this._glowGeo, this._glowMat);
    glow.position.z = -0.1;
    group.add(glow);

    for (let i = 0; i < CUBE_COUNT; i++) {
      const cube = new THREE.Mesh(this._cubeGeo, this._cubeMat);
      cube.position.set(START_X + i * (CUBE_W + CUBE_GAP), 0, 0);
      group.add(cube);
    }

    group.position.set(0, y, 0);
    this.scene.add(group);

    this.barriers.push({ group, y, dying: false, flashTimer: 0 });
  }

  dispose() {
    for (const b of this.barriers) this.scene.remove(b.group);
  }
}
