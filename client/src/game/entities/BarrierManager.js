import * as THREE from 'three';
import { WORLD_WIDTH } from '../constants.js';

const BARRIER_H       = 0.5;
const CUBE_W          = 0.42;
const CUBE_GAP        = 0.14;
const CUBE_SLOT       = CUBE_W + CUBE_GAP;
const SPAWN_ABOVE     = 14;
const FLASH_DURATION  = 0.55;
const FLASH_RATE      = 14;
const GAP_CUBES       = 4;     // gap width in cubes (~2 world units)
const FUSE_TIME       = 3.5;   // explosive barrier fuse duration (s)
const EXPLODE_Y_RANGE = 4.5;   // Y distance that triggers explosion damage
const MOVE_RATE       = 0.65;  // rad/s — gap oscillation speed for moving barrier

const CUBE_COUNT = Math.floor((WORLD_WIDTH + CUBE_GAP) / CUBE_SLOT);
const ROW_W      = CUBE_COUNT * CUBE_SLOT - CUBE_GAP;
const START_X    = -ROW_W / 2 + CUBE_W / 2;

// Minimum level to unlock each barrier type
const TYPE_UNLOCK  = { destroy: 1, gap: 3, armored: 5, moving: 7, explosive: 9 };
// Higher weight = more likely to appear in random selection
const TYPE_WEIGHT  = { destroy: 4, gap: 3, armored: 2, moving: 2, explosive: 1 };

function rnd(a, b) { return a + Math.random() * (b - a); }
function rndInt(a, b) { return Math.floor(a + Math.random() * (b - a)); }

// Cooldown range [min, max] seconds between barrier spawns
function cooldownRange(level) {
  return [Math.max(10, 26 - level * 1.6), Math.max(16, 40 - level * 2.4)];
}

function pickType(level) {
  const types = Object.entries(TYPE_UNLOCK)
    .filter(([, lv]) => level >= lv)
    .map(([t]) => t);
  const total = types.reduce((s, t) => s + TYPE_WEIGHT[t], 0);
  let r = Math.random() * total;
  for (const t of types) { r -= TYPE_WEIGHT[t]; if (r <= 0) return t; }
  return types[types.length - 1];
}

// Random static gap: [gapStartIndex, gapEndIndex exclusive]
function randomGapRange() {
  const margin = 2;
  const start  = rndInt(margin, CUBE_COUNT - GAP_CUBES - margin);
  return [start, start + GAP_CUBES];
}

// World X bounds of a cube-index gap range
function gapWorldBounds(gS, gE) {
  return {
    start: START_X + gS * CUBE_SLOT - CUBE_W / 2,
    end:   START_X + (gE - 1) * CUBE_SLOT + CUBE_W / 2,
  };
}

export class BarrierManager {
  constructor(scene) {
    this.scene    = scene;
    this.barriers = [];
    this._time    = 0;
    this._timer   = rnd(25, 35); // initial grace before first barrier
    this.playerHitByExplosion = false;

    // Shared geometries — reused across all barriers
    this._cubeGeo = new THREE.BoxGeometry(CUBE_W, BARRIER_H, CUBE_W);
    this._glowGeo = new THREE.BoxGeometry(ROW_W + 0.4, BARRIER_H + 0.3, 0.3);
  }

  reset() {
    for (const b of this.barriers) this.scene.remove(b.group);
    this.barriers = [];
    this._time    = 0;
    this._timer   = rnd(25, 35);
    this.playerHitByExplosion = false;
  }

  // playerY: doodler world Y, used for explosion damage check
  update(dt, cameraY, level, playerY) {
    this._time += dt;
    this.playerHitByExplosion = false;

    // Spawn on timer
    this._timer -= dt;
    if (this._timer <= 0) {
      this._spawn(cameraY + SPAWN_ABOVE, level);
      const [min, max] = cooldownRange(level);
      this._timer = rnd(min, max);
    }

    for (let i = this.barriers.length - 1; i >= 0; i--) {
      const b = this.barriers[i];

      // Dying: flash then remove
      if (b.dying) {
        b.flashTimer += dt;
        b.group.visible = Math.floor(b.flashTimer * FLASH_RATE) % 2 === 0;
        if (b.flashTimer >= FLASH_DURATION) {
          this.scene.remove(b.group);
          this.barriers.splice(i, 1);
        }
        continue;
      }

      switch (b.type) {

        case 'moving': {
          // Slide the gap position back and forth across the row
          b.movePhase += dt * MOVE_RATE;
          const halfRange = (CUBE_COUNT - GAP_CUBES) / 2 - 1;
          const center    = CUBE_COUNT / 2 + Math.sin(b.movePhase) * halfRange;
          const gS = Math.max(0, Math.round(center - GAP_CUBES / 2));
          const gE = Math.min(CUBE_COUNT, gS + GAP_CUBES);
          for (let ci = 0; ci < b.cubes.length; ci++) {
            b.cubes[ci].visible = ci < gS || ci >= gE;
          }
          const wb = gapWorldBounds(gS, gE);
          b.gapWorldStart = wb.start;
          b.gapWorldEnd   = wb.end;
          if (b.glowMesh) {
            b.glowMesh.material.opacity = 0.15 + Math.abs(Math.sin(this._time * 4)) * 0.28;
          }
          break;
        }

        case 'explosive': {
          b.fuseTimer -= dt;
          const progress  = 1 - b.fuseTimer / FUSE_TIME;
          const pulseRate = 2 + progress * 16;
          if (b.glowMesh) {
            b.glowMesh.material.opacity = 0.2 + Math.abs(Math.sin(this._time * pulseRate)) * 0.55;
          }
          // Tint cubes from purple → red as fuse burns
          if (b.mat) {
            const t = Math.min(1, progress * 1.4);
            const r = Math.round(0xaa + t * (0xff - 0xaa));
            const g = Math.round(0x22 * (1 - t));
            const bv = Math.round(0xff * (1 - t));
            b.mat.color.setRGB(r / 255, g / 255, bv / 255);
          }
          if (b.fuseTimer <= 0) {
            if (Math.abs(playerY - b.y) < EXPLODE_Y_RANGE) {
              this.playerHitByExplosion = true;
            }
            this._startDying(b);
          }
          break;
        }

        default: {
          if (b.glowMesh) {
            b.glowMesh.material.opacity = 0.15 + Math.abs(Math.sin(this._time * 4)) * 0.28;
          }
          break;
        }
      }
    }
  }

  // Called from GameWorld when player projectile travels through this Y range.
  // projX needed to check if shot passes through a gap.
  // Returns barrier if hit (projectile consumed), null if nothing or passes through gap.
  checkProjectileHit(projX, projY, prevProjY) {
    for (const b of this.barriers) {
      if (b.dying) continue;
      const top = b.y + BARRIER_H * 0.5;
      const bot = b.y - BARRIER_H * 0.5;
      if (prevProjY >= top || projY < bot) continue; // not crossing

      // Gap: snap projX to the nearest cube slot, then check if that cube is visible.
      // This way shots landing in the inter-cube gap still register on the nearest cube.
      if (b.type === 'gap') {
        const slotIdx = Math.round((projX - START_X) / CUBE_SLOT);
        if (slotIdx < 0 || slotIdx >= CUBE_COUNT) continue;
        if (!b.cubes[slotIdx].visible) continue; // passes through a removed cube
        b._pendingHitCubeIdx = slotIdx;
        return b;
      }

      // Moving: projectile passes through gap, blocked by solid parts (indestructible)
      if (b.type === 'moving') {
        const inGap = projX >= b.gapWorldStart && projX <= b.gapWorldEnd;
        if (inGap) continue;
        return b;
      }

      return b;
    }
    return null;
  }

  // Apply one hit to a barrier. Returns true if destroyed.
  hitBarrier(barrier) {
    if (barrier.type === 'moving') {
      return false; // indestructible — just consume projectile
    }
    if (barrier.type === 'gap') {
      const ci = barrier._pendingHitCubeIdx ?? -1;
      if (ci >= 0 && barrier.cubes[ci]) {
        barrier.cubes[ci].visible = false;
        barrier._pendingHitCubeIdx = -1;
        // If every cube is gone, start dying animation
        if (barrier.cubes.every(c => !c.visible)) this._startDying(barrier);
      }
      return false;
    }
    if (barrier.type === 'armored') {
      barrier.hits--;
      if (barrier.hits <= 0) { this._startDying(barrier); return true; }
      // Crack color: 2 hits left = orange, 1 hit left = dark red
      if (barrier.mat) barrier.mat.color.setHex(barrier.hits === 2 ? 0xff8800 : 0xcc2200);
      return false;
    }
    // destroy, explosive
    this._startDying(barrier);
    return true;
  }

  // Returns barrier if player body (moving upward) is blocked by it.
  // bounds: { left, right, top, bottom }; prevPlayerTop: top before this frame.
  checkPlayerCollision(bounds, prevPlayerTop) {
    for (const b of this.barriers) {
      if (b.dying) continue;
      const bot = b.y - BARRIER_H * 0.5;
      if (prevPlayerTop > bot || bounds.top <= bot) continue;

      // Full-width barriers
      if (b.type === 'destroy' || b.type === 'armored' || b.type === 'explosive') {
        return b;
      }

      // Gap: blocked only if any visible cube overlaps the player's X range
      if (b.type === 'gap') {
        const pw     = bounds.right - bounds.left;
        const pLeft  = bounds.left  + pw * 0.1;
        const pRight = bounds.right - pw * 0.1;
        let blocked = false;
        for (let ci = 0; ci < b.cubes.length; ci++) {
          if (!b.cubes[ci].visible) continue;
          const cx = START_X + ci * CUBE_SLOT;
          if (pRight > cx - CUBE_W / 2 && pLeft < cx + CUBE_W / 2) { blocked = true; break; }
        }
        if (!blocked) continue;
        return b;
      }

      // Moving: allow passage if player fits inside the sliding gap
      const pw     = bounds.right - bounds.left;
      const pLeft  = bounds.left  + pw * 0.1;
      const pRight = bounds.right - pw * 0.1;
      if (pLeft >= b.gapWorldStart && pRight <= b.gapWorldEnd) continue;
      return b;
    }
    return null;
  }

  getLiveBarriers() {
    return this.barriers.filter(b => !b.dying);
  }

  dispose() {
    for (const b of this.barriers) this.scene.remove(b.group);
  }

  // ── Private ────────────────────────────────────────────────

  _startDying(b) {
    b.dying      = true;
    b.flashTimer = 0;
  }

  _spawn(y, level) {
    this._buildBarrier(pickType(level), y);
  }

  _buildBarrier(type, y) {
    const group = new THREE.Group();
    group.position.set(0, y, 0);

    const b = { type, group, y, dying: false, flashTimer: 0, glowMesh: null, mat: null, cubes: [] };

    switch (type) {

      case 'destroy': {
        b.mat      = new THREE.MeshBasicMaterial({ color: 0xff2244 });
        b.cubes    = this._addCubes(group, b.mat);
        b.glowMesh = this._addGlow(group, 0xff6677);
        break;
      }

      case 'gap': {
        const [gS, gE] = randomGapRange();
        const wb = gapWorldBounds(gS, gE);
        b.gapWorldStart = wb.start;
        b.gapWorldEnd   = wb.end;
        b.mat      = new THREE.MeshBasicMaterial({ color: 0x0088ff });
        b.cubes    = this._addCubes(group, b.mat, new Set(
          Array.from({ length: gE - gS }, (_, i) => gS + i),
        ));
        b.glowMesh = this._addGlow(group, 0x44aaff);
        break;
      }

      case 'armored': {
        b.mat      = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        b.cubes    = this._addCubes(group, b.mat);
        b.glowMesh = this._addGlow(group, 0xffee88);
        b.hits     = 3;
        break;
      }

      case 'moving': {
        b.mat      = new THREE.MeshBasicMaterial({ color: 0xff7700 });
        b.cubes    = this._addCubes(group, b.mat);
        b.glowMesh = this._addGlow(group, 0xffbb44);
        b.movePhase     = Math.random() * Math.PI * 2; // random start position
        b.gapWorldStart = 0;
        b.gapWorldEnd   = 0;
        break;
      }

      case 'explosive': {
        b.mat      = new THREE.MeshBasicMaterial({ color: 0xaa22ff });
        b.cubes    = this._addCubes(group, b.mat);
        b.glowMesh = this._addGlow(group, 0xcc66ff);
        b.fuseTimer = FUSE_TIME;
        break;
      }
    }

    this.scene.add(group);
    this.barriers.push(b);
  }

  _addCubes(group, mat, gapSet = new Set()) {
    const cubes = [];
    for (let i = 0; i < CUBE_COUNT; i++) {
      const cube = new THREE.Mesh(this._cubeGeo, mat);
      cube.position.set(START_X + i * CUBE_SLOT, 0, 0);
      cube.visible = !gapSet.has(i);
      group.add(cube);
      cubes.push(cube);
    }
    return cubes;
  }

  _addGlow(group, color) {
    const mat  = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28 });
    const mesh = new THREE.Mesh(this._glowGeo, mat);
    mesh.position.z = -0.1;
    group.add(mesh);
    return mesh;
  }
}
