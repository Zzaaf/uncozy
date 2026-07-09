import * as THREE from 'three';
import { PLATFORM, SUPER_SCORE_THRESHOLD, HEART_SCORE_THRESHOLD } from '../constants.js';

const COLORS        = [0x00ff88, 0x00e5ff, 0xff006e, 0xffdd00, 0xaa44ff];
const CUBE_SIZE     = 0.38;
const CUBE_GAP      = 0.07;
const CUBE_COUNT    = 6;
const SUPER_CHANCE  = 0.18;
const FLOAT_CHANCE  = 0.13;
const HEART_CHANCE  = 0.07;
const FLOAT_ANIM_SPEED   = 3.5;  // rad/s
const FLOAT_AMPLITUDE    = 0.09; // world units
const FLOAT_FALL_SPEED   = 12;   // world units/s
const FLOAT_FALL_DURATION = 0.3; // seconds before recycle

const TOTAL_W = CUBE_COUNT * CUBE_SIZE + (CUBE_COUNT - 1) * CUBE_GAP;
const START_X = -TOTAL_W / 2 + CUBE_SIZE / 2;

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export class PlatformManager {
  constructor(scene) {
    this.scene     = scene;
    this.platforms = [];
    this._colorIdx = 0;
    this._time     = 0;

    // Shared geometries
    this._cubeGeo      = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    this._glowGeo      = new THREE.BoxGeometry(TOTAL_W + 0.3, CUBE_SIZE + 0.22, CUBE_SIZE + 0.22);
    this._heartBumpGeo = new THREE.SphereGeometry(0.13, 5, 4);
    this._heartBodyGeo = new THREE.BoxGeometry(0.24, 0.24, 0.1);

    // Shared materials
    this._normalMats = COLORS.map((c) => new THREE.MeshBasicMaterial({ color: c }));
    this._superMat   = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this._glowMat    = new THREE.MeshBasicMaterial({ color: 0x88ffff, transparent: true, opacity: 0.2 });
    this._heartMat   = new THREE.MeshBasicMaterial({ color: 0xff1177 });
  }

  // ── Public API ────────────────────────────────────────────

  reset(startY) {
    this._disposePlatforms();
    this.platforms = [];
    this._colorIdx = 0;
    this._time     = 0;
    let y = startY - 1;
    for (let i = 0; i < PLATFORM.initialCount; i++) {
      const x = randomRange(-PLATFORM.horizontalSpread, PLATFORM.horizontalSpread);
      this._addPlatform(x, y, 0);
      y += randomRange(PLATFORM.verticalMinGap, PLATFORM.verticalMaxGap);
    }
  }

  update(topVisibleY, score = 0, dt = 0) {
    this._time += dt;

    // Pulse glow for all super platforms simultaneously
    this._glowMat.opacity = 0.08 + Math.abs(Math.sin(this._time * 3.5)) * 0.32;

    const highest = this._getHighestY();

    for (const platform of this.platforms) {
      // Animate floating heart
      const heart = platform.userData.heart;
      if (heart && !platform.userData.heartCollected) {
        heart.rotation.y  = this._time * 2.5;
        heart.position.y  = CUBE_SIZE + 0.22 + Math.sin(this._time * 3 + platform.position.x) * 0.07;
      }

      // Float platform: wave each cube individually
      if (platform.userData.type === 'float' && !platform.userData.floatConsumed) {
        for (let c = 1; c <= CUBE_COUNT; c++) {
          const cube = platform.children[c];
          if (cube && cube.userData.floatPhase !== undefined) {
            cube.position.y = cube.userData.baseY +
              Math.sin(this._time * FLOAT_ANIM_SPEED + cube.userData.floatPhase) * FLOAT_AMPLITUDE;
          }
        }
      }

      // Fall-away animation for consumed float platforms
      if (platform.userData.floatConsumed) {
        platform.userData.floatTimer += dt;
        platform.position.y -= FLOAT_FALL_SPEED * dt;
        if (platform.userData.floatTimer >= FLOAT_FALL_DURATION) {
          this._recyclePlatform(platform, highest, score);
        }
        continue;
      }

      // Recycle off-screen platforms
      if (platform.position.y < topVisibleY - 30) {
        this._recyclePlatform(platform, highest, score);
      }
    }
  }

  getCollidingPlatform(doodlerBounds, previousBottom, isFalling) {
    if (!isFalling) return null;
    for (const platform of this.platforms) {
      if (platform.userData.floatConsumed) continue;
      const pLeft  = platform.position.x - PLATFORM.width  * 0.5;
      const pRight = platform.position.x + PLATFORM.width  * 0.5;
      const pTop   = platform.position.y + PLATFORM.height * 0.5;
      if (doodlerBounds.right >= pLeft && doodlerBounds.left <= pRight &&
          previousBottom >= pTop - 0.12 && doodlerBounds.bottom <= pTop + 0.35) {
        return platform;
      }
    }
    return null;
  }

  // Returns true if any platform top is between fromY and toY at the given X
  isProjectileBlocked(x, fromY, toY) {
    for (const platform of this.platforms) {
      if (platform.userData.floatConsumed) continue;
      const pLeft  = platform.position.x - PLATFORM.width * 0.5;
      const pRight = platform.position.x + PLATFORM.width * 0.5;
      if (x < pLeft || x > pRight) continue;
      const pTop = platform.position.y + PLATFORM.height * 0.5;
      if (pTop > fromY && pTop <= toY) return true;
    }
    return false;
  }

  checkHeartPickup(doodlerBounds) {
    for (const platform of this.platforms) {
      if (!platform.userData.heart || platform.userData.heartCollected) continue;
      const hx = platform.position.x;
      const hy = platform.position.y + CUBE_SIZE + 0.3;
      const r  = 0.42;
      if (doodlerBounds.right  >= hx - r && doodlerBounds.left   <= hx + r &&
          doodlerBounds.top    >= hy - r && doodlerBounds.bottom  <= hy + r) {
        platform.userData.heartCollected  = true;
        platform.userData.heart.visible   = false;
        return true;
      }
    }
    return false;
  }

  // ── Private helpers ───────────────────────────────────────

  _addPlatform(x, y, score) {
    const isSuper = score >= SUPER_SCORE_THRESHOLD && Math.random() < SUPER_CHANCE;
    const isFloat = !isSuper && Math.random() < FLOAT_CHANCE;
    const group   = this._buildGroup(isSuper, isFloat);

    if (score >= HEART_SCORE_THRESHOLD && Math.random() < HEART_CHANCE) {
      const h       = this._buildHeartPickup();
      h.position.y  = CUBE_SIZE + 0.22;
      group.add(h);
      group.userData.heart = h;
    }

    group.position.set(x, y, 0);
    this.scene.add(group);
    this.platforms.push(group);
  }

  _recyclePlatform(platform, highest, score) {
    const x = randomRange(-PLATFORM.horizontalSpread, PLATFORM.horizontalSpread);
    const y = highest.value + randomRange(PLATFORM.verticalMinGap, PLATFORM.verticalMaxGap);
    highest.value = y;

    // Clear all children
    while (platform.children.length) platform.remove(platform.children[0]);

    // Rebuild children
    const isSuper = score >= SUPER_SCORE_THRESHOLD && Math.random() < SUPER_CHANCE;
    const isFloat = !isSuper && Math.random() < FLOAT_CHANCE;
    this._fillGroup(platform, isSuper, isFloat);

    // Maybe add heart
    platform.userData.heart          = null;
    platform.userData.heartCollected = false;
    if (score >= HEART_SCORE_THRESHOLD && Math.random() < HEART_CHANCE) {
      const h      = this._buildHeartPickup();
      h.position.y = CUBE_SIZE + 0.22;
      platform.add(h);
      platform.userData.heart = h;
    }

    platform.position.set(x, y, 0);
  }

  _buildGroup(isSuper, isFloat = false) {
    const group = new THREE.Group();
    group.userData.heart          = null;
    group.userData.heartCollected = false;
    this._fillGroup(group, isSuper, isFloat);
    return group;
  }

  _fillGroup(group, isSuper, isFloat = false) {
    // Glow halo (only visible for super)
    const glow    = new THREE.Mesh(this._glowGeo, this._glowMat);
    glow.position.z      = -0.15;
    glow.visible         = isSuper;
    group.add(glow); // index 0 — always the glow

    // Cubes
    const mat = isSuper
      ? this._superMat
      : this._normalMats[this._colorIdx++ % this._normalMats.length];

    for (let i = 0; i < CUBE_COUNT; i++) {
      const cube = new THREE.Mesh(this._cubeGeo, mat);
      const baseY = (Math.random() - 0.5) * 0.05;
      cube.position.set(
        START_X + i * (CUBE_SIZE + CUBE_GAP),
        baseY,
        0,
      );
      if (isFloat) {
        cube.userData.baseY       = baseY;
        // Spread phases evenly across the row so cubes wave sequentially
        cube.userData.floatPhase  = (i / CUBE_COUNT) * Math.PI * 2;
      }
      group.add(cube); // indices 1..6
    }

    group.userData.type          = isSuper ? 'super' : isFloat ? 'float' : 'normal';
    group.userData.floatConsumed = false;
    group.userData.floatTimer    = 0;
  }

  _buildHeartPickup() {
    const g = new THREE.Group();
    // Two upper bumps
    for (const sx of [-0.1, 0.1]) {
      const s = new THREE.Mesh(this._heartBumpGeo, this._heartMat);
      s.position.set(sx, 0.09, 0);
      g.add(s);
    }
    // Lower diamond body
    const body = new THREE.Mesh(this._heartBodyGeo, this._heartMat);
    body.rotation.z = Math.PI / 4;
    body.position.set(0, -0.06, 0);
    g.add(body);
    return g;
  }

  _getHighestY() {
    let max = -Infinity;
    for (const p of this.platforms) if (p.position.y > max) max = p.position.y;
    return { value: max };
  }

  _disposePlatforms() {
    for (const p of this.platforms) this.scene.remove(p);
  }
}
