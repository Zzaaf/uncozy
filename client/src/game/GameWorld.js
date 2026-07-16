import * as THREE from 'three';
import { CAMERA, PLATFORM, WORLD_HEIGHT, WORLD_WIDTH, LEVEL_BG_COLORS, getLevelFromScore } from './constants.js';
import { Doodler } from './entities/Doodler.js';
import { PlatformManager } from './entities/PlatformManager.js';
import { BarrierManager } from './entities/BarrierManager.js';
import { EnemyManager } from './entities/EnemyManager.js';

const PROJECTILE_SPEED = 24;
const PROJ_W = 0.14;
const PROJ_H = 0.38;

export class GameWorld {
  constructor(canvasHost) {
    this.canvasHost = canvasHost;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(LEVEL_BG_COLORS[0]);
    this._bgTarget = new THREE.Color(LEVEL_BG_COLORS[0]);

    this.camera = new THREE.OrthographicCamera(
      -WORLD_WIDTH / 2,
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      -WORLD_HEIGHT / 2,
      0.1,
      100,
    );
    this.camera.position.set(0, WORLD_HEIGHT / 2, 20);
    this.camera.lookAt(0, WORLD_HEIGHT / 2, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.canvasHost.innerHTML = '';
    this.canvasHost.appendChild(this.renderer.domElement);

    this.addLights();
    this.addPixelGrid();

    this.platformManager = new PlatformManager(this.scene);
    this.barrierManager  = new BarrierManager(this.scene);
    this.enemyManager    = new EnemyManager(this.scene);
    this.doodler         = new Doodler(this.scene);

    // Shared projectile geometry/material (one projectile at a time)
    this._projGeo = new THREE.BoxGeometry(PROJ_W, PROJ_H, PROJ_W);
    this._projMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
    this._projectile = null; // { mesh, y, prevY }

    this.score         = 0;
    this.highestY      = 0;
    this.isGameOver    = false;
    this.heartPickedUp = false;
    this.levelChanged  = false;
    this._level        = 1;
    this.resize();
  }

  addLights() {
    const ambient = new THREE.AmbientLight(0xaabbff, 0.7);
    const directional = new THREE.DirectionalLight(0x00ffcc, 0.9);
    directional.position.set(8, 18, 20);
    const fill = new THREE.DirectionalLight(0xff44aa, 0.3);
    fill.position.set(-8, 5, 10);
    this.scene.add(ambient, directional, fill);
    this.addStarfield();
  }

  addStarfield() {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const starColors = [
      [1, 1, 1], [0.6, 0.9, 1], [1, 0.85, 0.65], [0.85, 0.65, 1], [0.6, 1, 0.85],
    ];
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = Math.random() * 3000;
      positions[i * 3 + 2] = -9;
      const c = starColors[Math.floor(Math.random() * starColors.length)];
      colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.14, vertexColors: true, sizeAttenuation: true });
    this.scene.add(new THREE.Points(geo, mat));
  }

  addPixelGrid() {
    const XMIN = -8, XMAX = 8, YMIN = -20, YMAX = 3000;
    const pts = [];
    for (let y = YMIN; y <= YMAX; y += 2) pts.push(XMIN, y, -7, XMAX, y, -7);
    for (let x = XMIN; x <= XMAX; x += 2) pts.push(x, YMIN, -7, x, YMAX, -7);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x1c1c44, transparent: true, opacity: 0.7 });
    this.scene.add(new THREE.LineSegments(geo, mat));
  }

  reset(skinId = 0) {
    this.score         = 0;
    this.highestY      = 5;
    this.isGameOver    = false;
    this.heartPickedUp = false;
    this.levelChanged  = false;
    this._level        = 1;
    this.camera.position.y = WORLD_HEIGHT / 2;
    this.platformManager.reset(0);
    this.barrierManager.reset();
    this.enemyManager.reset();
    this._removeProjectile();
    this._bgTarget.set(LEVEL_BG_COLORS[0]);
    this.scene.background.set(LEVEL_BG_COLORS[0]);
    this.doodler.setSkin(skinId);
    this.doodler.reset(5);
    this.render();
  }

  get level() { return this._level; }

  resize() {
    const width  = this.canvasHost.clientWidth  || 1;
    const height = this.canvasHost.clientHeight || 1;
    const aspect = width / height;
    const zoom   = this._zoom || 1;
    // Zoom shrinks the frustum → character appears larger
    const baseHeight = WORLD_HEIGHT / zoom;
    const baseWidth  = baseHeight * aspect;

    this.camera.left   = -baseWidth / 2;
    this.camera.right  =  baseWidth / 2;
    this.camera.top    =  baseHeight / 2;
    this.camera.bottom = -baseHeight / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  setZoom(factor) {
    this._zoom = Math.max(1, factor);
    this.resize();
  }

  shoot(x) {
    if (this._projectile) return; // one shot at a time
    const startY = this.doodler.position.y + this.doodler.size.height * 0.5;
    const mesh   = new THREE.Mesh(this._projGeo, this._projMat);
    mesh.position.set(x, startY, 0.5);
    this.scene.add(mesh);
    this._projectile = { mesh, x, y: startY, prevY: startY };
  }

  _removeProjectile() {
    if (!this._projectile) return;
    this.scene.remove(this._projectile.mesh);
    this._projectile = null;
  }

  update(dt, horizontalInput, doShoot = false) {
    if (this.isGameOver) return;

    // ── Player ──────────────────────────────────────────────
    const previousBottom  = this.doodler.getBottom();
    const previousTop     = this.doodler.getBounds().top;
    this.doodler.update(dt, horizontalInput);
    const bounds = this.doodler.getBounds();

    // Platform bounce
    const platform = this.platformManager.getCollidingPlatform(
      bounds, previousBottom, this.doodler.velocity.y < 0,
    );
    if (platform) {
      this.doodler.position.y =
        platform.position.y + PLATFORM.height * 0.5 + this.doodler.size.height / 2;
      if (platform.userData.type === 'super') this.doodler.superBounce();
      else this.doodler.bounce();
      // Float platform falls away after one bounce
      if (platform.userData.type === 'float' && !platform.userData.floatConsumed) {
        platform.userData.floatConsumed = true;
        platform.userData.floatTimer    = 0;
      }
    }

    // Barrier blocks player from below (bounce back)
    if (this.doodler.velocity.y > 0) {
      const barrier = this.barrierManager.checkPlayerCollision(bounds, previousTop);
      if (barrier) {
        this.doodler.velocity.y = -this.doodler.velocity.y * 0.25;
        this.doodler.position.y = barrier.y - 0.5 - this.doodler.size.height * 0.5;
        this.doodler.syncMesh();
      }
    }

    // Heart pickup
    if (this.platformManager.checkHeartPickup(bounds)) this.heartPickedUp = true;

    // Score
    if (this.doodler.position.y > this.highestY) {
      const delta = this.doodler.position.y - this.highestY;
      this.highestY = this.doodler.position.y;
      this.score += Math.max(1, Math.floor(delta * 10));
    }

    // Camera
    const targetY = Math.max(
      this.camera.position.y,
      this.doodler.position.y + CAMERA.followOffset,
    );
    this.camera.position.y = targetY;

    // ── Shoot ────────────────────────────────────────────────
    if (doShoot) this.shoot(this.doodler.position.x);

    // ── Projectile ───────────────────────────────────────────
    if (this._projectile) {
      const proj = this._projectile;
      proj.prevY = proj.y;
      proj.y    += PROJECTILE_SPEED * dt;
      proj.mesh.position.y = proj.y;

      // Platform blocks shot
      if (this.platformManager.isProjectileBlocked(proj.x, proj.prevY, proj.y)) {
        this._removeProjectile();
      }

      // Barrier hit
      if (this._projectile) {
        const hitBarrier = this.barrierManager.checkProjectileHit(proj.x, proj.y, proj.prevY);
        if (hitBarrier) {
          this.barrierManager.hitBarrier(hitBarrier);
          this._removeProjectile();
        }
      }

      // Off-screen above
      const topOfScreen = this.camera.position.y + WORLD_HEIGHT * 0.5 + 2;
      if (this._projectile && proj.y > topOfScreen) this._removeProjectile();
    }

    // ── Managers ─────────────────────────────────────────────
    this.platformManager.update(targetY + WORLD_HEIGHT * 0.6, this.score, dt);
    this.barrierManager.update(dt, this.camera.position.y, this._level, this.doodler.position.y);

    // Explosive barrier detonation damage
    if (this.barrierManager.playerHitByExplosion && !this.doodler.isInvincible) {
      this.isGameOver = true;
    }

    const cameraTop = this.camera.position.y + this.camera.top;

    // ── Level & background ────────────────────────────────────
    const newLevel = getLevelFromScore(this.score);
    if (newLevel !== this._level) {
      this._level = newLevel;
      this.levelChanged = true;
      this._bgTarget.set(LEVEL_BG_COLORS[newLevel - 1]);
    }
    this.scene.background.lerp(this._bgTarget, Math.min(dt * 0.7, 1));

    // ── Enemies ───────────────────────────────────────────────
    this.enemyManager.update(dt, this.camera.position.y, cameraTop, this._level);

    // Enemy body collision
    if (this.enemyManager.checkPlayerCollision(bounds, this.doodler.isInvincible)) {
      this.isGameOver = true;
    }
    // Shooter bullet collision
    if (!this.isGameOver &&
        this.enemyManager.checkBulletPlayerCollision(bounds, this.doodler.isInvincible)) {
      this.isGameOver = true;
    }

    // Enemy hit by player projectile
    if (this._projectile && this.enemyManager.checkProjectileHit(
      this._projectile.x, this._projectile.prevY, this._projectile.y,
    )) {
      this._removeProjectile();
    }

    // ── Game over ─────────────────────────────────────────────
    const visibleBottom = this.camera.position.y + this.camera.bottom;
    if (bounds.top < visibleBottom - CAMERA.bottomKillMargin) this.isGameOver = true;

    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  respawn() {
    this.isGameOver = false;
    const respawnY  = this.camera.position.y + this.camera.bottom + 3;
    this.doodler.reset(respawnY);
    this._removeProjectile();
  }

  dispose() {
    this.renderer.dispose();
    this.barrierManager.dispose();
  }
}
