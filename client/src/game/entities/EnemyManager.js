import * as THREE from 'three';
import { WORLD_WIDTH } from '../constants.js';

const HALF_W = WORLD_WIDTH / 2 - 0.5;

// ── Mesh helpers ──────────────────────────────────────────────────────────────

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ color }),
  );
  m.position.set(x, y, z);
  return m;
}

// 🦀 CRAWLER — red crab, patrols left/right
function buildCrawler() {
  const g = new THREE.Group();
  g.add(box(1.00, 0.55, 0.55, 0xff2244));
  g.add(box(0.22, 0.22, 0.12, 0xffffff, -0.22,  0.13, 0.30));
  g.add(box(0.22, 0.22, 0.12, 0xffffff,  0.22,  0.13, 0.30));
  g.add(box(0.10, 0.10, 0.10, 0x110000, -0.22,  0.13, 0.38));
  g.add(box(0.10, 0.10, 0.10, 0x110000,  0.22,  0.13, 0.38));
  g.add(box(0.32, 0.32, 0.40, 0xcc1122, -0.72,  0.05, 0.00));
  g.add(box(0.32, 0.32, 0.40, 0xcc1122,  0.72,  0.05, 0.00));
  [-0.32, -0.10, 0.10, 0.32].forEach(x =>
    g.add(box(0.10, 0.26, 0.10, 0xaa0022, x, -0.38, 0)));
  return g;
}

// 🦇 FLYER — green bat, flies horizontally
function buildFlyer() {
  const g = new THREE.Group();
  g.add(box(0.65, 0.65, 0.45, 0x00bb44));
  g.add(box(0.16, 0.16, 0.10, 0xffdd00, -0.16, 0.10, 0.26));
  g.add(box(0.16, 0.16, 0.10, 0xffdd00,  0.16, 0.10, 0.26));
  g.add(box(0.08, 0.26, 0.10, 0x004422,  0.00, -0.28, 0.22));  // fang
  const wL = box(0.88, 0.28, 0.07, 0x007733, -0.88, 0.08, 0);
  const wR = box(0.88, 0.28, 0.07, 0x007733,  0.88, 0.08, 0);
  g.add(wL, wR);
  g.add(box(0.38, 0.18, 0.06, 0x004422, -1.40, 0, 0));
  g.add(box(0.38, 0.18, 0.06, 0x004422,  1.40, 0, 0));
  g.userData.wingL = wL;
  g.userData.wingR = wR;
  return g;
}

// 🛸 SHOOTER — purple UFO, hovers and fires upward
function buildShooter() {
  const g = new THREE.Group();
  g.add(box(1.20, 0.18, 0.50, 0x00ccbb));
  g.add(box(0.60, 0.42, 0.42, 0xaa44ff, 0, 0.30, 0));
  g.add(box(0.30, 0.20, 0.10, 0x88ffff, 0, 0.30, 0.27));
  [-0.42, 0, 0.42].forEach(x =>
    g.add(box(0.10, 0.22, 0.10, 0x007766, x, -0.21, 0)));
  const ring = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.07, 0.07),
    new THREE.MeshBasicMaterial({ color: 0x00ffee, transparent: true, opacity: 0.55 }),
  );
  ring.position.y = 0.04;
  g.add(ring);
  g.userData.ring = ring;
  return g;
}

// 💀 DROPPER — orange spike ball, falls from above
function buildDropper() {
  const g = new THREE.Group();
  g.add(box(0.62, 0.62, 0.62, 0xff6600));
  [[0.60, 0], [-0.60, 0], [0, 0.60], [0, -0.60]].forEach(([sx, sy]) =>
    g.add(box(0.22, 0.22, 0.28, 0xff4400, sx, sy, 0)));
  [[0.42, 0.42], [-0.42, 0.42], [0.42, -0.42], [-0.42, -0.42]].forEach(([sx, sy]) => {
    const s = box(0.18, 0.18, 0.28, 0xdd3300, sx, sy, 0);
    s.rotation.z = Math.PI / 4;
    g.add(s);
  });
  g.add(box(0.14, 0.14, 0.10, 0xffff00, -0.14, 0.08, 0.34));
  g.add(box(0.14, 0.14, 0.10, 0xffff00,  0.14, 0.08, 0.34));
  return g;
}

function buildBullet() {
  return new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.36, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xff44aa }),
  );
}

// ── Spawn config ──────────────────────────────────────────────────────────────

// Frontier spawns only crawlers & shooters; flyers/droppers use timers
const FRONTIER_WEIGHTS = [
  [7, 3], [7, 3], [6, 4], [6, 4], [5, 5],
  [4, 6], [3, 7], [3, 7], [2, 8], [2, 8],
];

function pickFrontierType(level) {
  const [wc, ws] = FRONTIER_WEIGHTS[Math.min(level - 1, 9)];
  return Math.random() * (wc + ws) < wc ? 'crawler' : 'shooter';
}

const spawnInterval  = l => Math.max(7,   15  - l * 0.80);
const crawlerSpeed   = l => 1.8 + l * 0.35;
const flyerSpeed     = l => 2.5 + l * 0.40;
const dropperSpeed   = l => 4.0 + l * 0.55;
const shootCooldown  = l => Math.max(1.5,  4.0 - l * 0.25);
const flyerCooldown  = l => Math.max(3.0,  8.0 - l * 0.50);
const dropperCooldown = l => Math.max(3.5, 10.0 - l * 0.65);

const BULLET_SPEED = 9;

// ── EnemyManager ─────────────────────────────────────────────────────────────

export class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.enemies  = [];
    this._bullets = [];
    this._spawnFrontier = 30;
    this._flyerTimer    = 4;
    this._dropperTimer  = 7;
    this._time = 0;
  }

  reset() {
    this.enemies.forEach(e  => this.scene.remove(e.mesh));
    this._bullets.forEach(b => this.scene.remove(b.mesh));
    this.enemies  = [];
    this._bullets = [];
    this._spawnFrontier = 30;
    this._flyerTimer    = 4;
    this._dropperTimer  = 7;
    this._time = 0;
  }

  update(dt, cameraY, cameraTop, level) {
    this._time += dt;
    const cameraHalfH  = cameraTop - cameraY;
    const cameraBottom = cameraY - cameraHalfH;

    // Advance Y-frontier (crawlers & shooters)
    while (this._spawnFrontier < cameraTop + 6) {
      const x    = (Math.random() - 0.5) * WORLD_WIDTH * 0.75;
      const type = pickFrontierType(level);
      this._spawnEnemy(type, x, this._spawnFrontier, level);
      this._spawnFrontier += spawnInterval(level);
    }

    // Flyer timer
    this._flyerTimer -= dt;
    if (this._flyerTimer <= 0) {
      const spawnY  = cameraY + (Math.random() * 0.5 + 0.1) * cameraHalfH;
      const goRight = Math.random() < 0.5;
      this._spawnEnemy(
        'flyer',
        goRight ? -HALF_W - 1.5 : HALF_W + 1.5,
        spawnY,
        level,
        (goRight ? 1 : -1) * flyerSpeed(level),
      );
      this._flyerTimer = flyerCooldown(level) + Math.random() * 2;
    }

    // Dropper timer
    this._dropperTimer -= dt;
    if (this._dropperTimer <= 0) {
      const x = (Math.random() - 0.5) * WORLD_WIDTH * 0.72;
      this._spawnEnemy('dropper', x, cameraTop + 1, level);
      this._dropperTimer = dropperCooldown(level) + Math.random() * 3;
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      this._stepEnemy(e, dt, level);
      if (e.y < cameraBottom - 4 || e.x > HALF_W + 4 || e.x < -HALF_W - 4) {
        this.scene.remove(e.mesh);
        this.enemies.splice(i, 1);
      }
    }

    // Update shooter bullets
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const b = this._bullets[i];
      b.y += b.vy * dt;
      b.mesh.position.y = b.y;
      if (b.y > cameraTop + 4 || b.y < cameraBottom - 4) {
        this.scene.remove(b.mesh);
        this._bullets.splice(i, 1);
      }
    }
  }

  // Returns true if an enemy was hit (player projectile consumed)
  checkProjectileHit(projX, projY1, projY2) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e  = this.enemies[i];
      const hr = this._hitRadius(e.type);
      if (Math.abs(projX - e.x) <= hr + 0.15 &&
          projY2 >= e.y - hr && projY1 <= e.y + hr) {
        this.scene.remove(e.mesh);
        this.enemies.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  // Returns true if player body overlaps an enemy
  checkPlayerCollision(bounds, isInvincible) {
    if (isInvincible) return false;
    for (const e of this.enemies) {
      const hr = this._hitRadius(e.type);
      if (bounds.right  >= e.x - hr && bounds.left   <= e.x + hr &&
          bounds.top    >= e.y - hr && bounds.bottom  <= e.y + hr) {
        return true;
      }
    }
    return false;
  }

  // Returns true if a shooter bullet hits the player
  checkBulletPlayerCollision(bounds, isInvincible) {
    if (isInvincible) return false;
    for (let i = this._bullets.length - 1; i >= 0; i--) {
      const b = this._bullets[i];
      if (bounds.right  >= b.x - 0.18 && bounds.left   <= b.x + 0.18 &&
          bounds.top    >= b.y - 0.22 && bounds.bottom  <= b.y + 0.22) {
        this.scene.remove(b.mesh);
        this._bullets.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _hitRadius(type) {
    return type === 'flyer' || type === 'dropper' ? 0.52 : 0.58;
  }

  _spawnEnemy(type, x, y, level, vxOverride) {
    let mesh, vx = vxOverride ?? 0, vy = 0, extra = {};
    switch (type) {
      case 'crawler':
        mesh = buildCrawler();
        vx   = crawlerSpeed(level) * (Math.random() < 0.5 ? 1 : -1);
        break;
      case 'flyer':
        mesh = buildFlyer();
        break;
      case 'shooter':
        mesh = buildShooter();
        extra.shootTimer = shootCooldown(level) * Math.random();
        break;
      case 'dropper':
        mesh = buildDropper();
        vy   = -dropperSpeed(level);
        break;
    }
    mesh.position.set(x, y, 0);
    this.scene.add(mesh);
    this.enemies.push({ type, mesh, x, y, vx, vy, level, ...extra });
  }

  _stepEnemy(e, dt, level) {
    switch (e.type) {
      case 'crawler': {
        e.x += e.vx * dt;
        if (e.x >  HALF_W) { e.x =  HALF_W; e.vx = -Math.abs(e.vx); }
        if (e.x < -HALF_W) { e.x = -HALF_W; e.vx =  Math.abs(e.vx); }
        e.mesh.scale.x    = e.vx >= 0 ? 1 : -1;
        e.mesh.position.x = e.x;
        break;
      }
      case 'flyer': {
        e.x += e.vx * dt;
        e.mesh.position.x = e.x;
        e.mesh.scale.x    = e.vx >= 0 ? 1 : -1;
        const flap = Math.sin(this._time * 9) * 0.22;
        if (e.mesh.userData.wingL) e.mesh.userData.wingL.position.y = 0.08 + flap;
        if (e.mesh.userData.wingR) e.mesh.userData.wingR.position.y = 0.08 + flap;
        break;
      }
      case 'shooter': {
        e.mesh.position.y = e.y + Math.sin(this._time * 2.2 + e.x) * 0.18;
        if (e.mesh.userData.ring) {
          e.mesh.userData.ring.material.opacity =
            0.28 + Math.abs(Math.sin(this._time * 3.5)) * 0.48;
        }
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = shootCooldown(level);
          const cy = e.mesh.position.y;
          this._fireBullet(e.x, cy + 0.52,  BULLET_SPEED);  // up
          this._fireBullet(e.x, cy - 0.52, -BULLET_SPEED);  // down
        }
        break;
      }
      case 'dropper': {
        e.y += e.vy * dt;
        e.mesh.position.y = e.y;
        e.mesh.rotation.z += dt * 2.5;
        break;
      }
    }
  }

  _fireBullet(x, y, vy) {
    const mesh = buildBullet();
    mesh.position.set(x, y, 0.3);
    this.scene.add(mesh);
    this._bullets.push({ mesh, x, y, vy });
  }
}
