import * as THREE from 'three';
import { DOODLER, WORLD_WIDTH, SUPER_JUMP_MULTIPLIER } from '../constants.js';

export class Doodler {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 3, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.size = { width: DOODLER.width, height: DOODLER.height };
    this.mesh = this._buildSkin(0);
    this.scene.add(this.mesh);
    this.syncMesh();
  }

  setSkin(skinId) {
    this.scene.remove(this.mesh);
    this.mesh = this._buildSkin(skinId);
    this.scene.add(this.mesh);
    this.syncMesh();
  }

  _buildSkin(skinId) {
    switch (skinId) {
      case 1:  return this._buildRobot();
      case 2:  return this._buildWizard();
      default: return this._buildHero();
    }
  }

  // ── Skin 0: Hero ──────────────────────────────────────────
  _buildHero() {
    const g = new THREE.Group();
    const W = this.size.width, H = this.size.height;

    g.add(this._box(W, H * 0.75, 0.9, 0xffdd00, 0, 0, 0));          // body
    g.add(this._box(W * 0.9, H * 0.22, 0.95, 0xff006e, 0, H * 0.15, 0)); // visor
    g.add(this._box(0.22, 0.22, 0.1, 0xffffff, W * 0.18, H * 0.18, 0.52)); // eye white
    g.add(this._box(0.1, 0.1, 0.1, 0x00e5ff, W * 0.21, H * 0.17, 0.6));   // pupil
    return g;
  }

  // ── Skin 1: Robot ─────────────────────────────────────────
  _buildRobot() {
    const g = new THREE.Group();
    const W = this.size.width, H = this.size.height;

    g.add(this._box(W, H * 0.75, 0.9, 0x7788aa, 0, 0, 0));          // body
    g.add(this._box(W * 0.55, H * 0.18, 1.0, 0x222244, 0, -H * 0.05, 0)); // chest panel
    g.add(this._box(W * 0.07, H * 0.45, 0.1, 0x00ff88, 0, H * 0.58, 0));  // antenna stick
    g.add(this._box(W * 0.2, H * 0.12, 0.15, 0x00ff88, 0, H * 0.82, 0));  // antenna top
    g.add(this._box(W * 0.75, H * 0.16, 1.0, 0xff2200, 0, H * 0.28, 0));  // LED eye
    g.add(this._box(W * 0.25, H * 0.09, 1.0, 0xff6644, 0, H * 0.28, 0));  // eye glow
    g.add(this._box(0.06, H * 0.15, 0.1, 0x00ff88, -W * 0.22, H * 0.0, 0.45)); // left indicator
    g.add(this._box(0.06, H * 0.15, 0.1, 0xff2200, W * 0.22, H * 0.0, 0.45));  // right indicator
    return g;
  }

  // ── Skin 2: Wizard ────────────────────────────────────────
  _buildWizard() {
    const g = new THREE.Group();
    const W = this.size.width, H = this.size.height;

    g.add(this._box(W, H * 0.75, 0.9, 0x7700cc, 0, 0, 0));           // robe body
    g.add(this._box(W, H * 0.08, 0.95, 0xffdd00, 0, H * 0.08, 0));   // belt
    g.add(this._box(W * 0.55, H * 0.6, 0.85, 0x9900ee, 0, H * 0.65, 0));  // hat body
    g.add(this._box(W * 1.2, H * 0.12, 0.8, 0xffdd00, 0, H * 0.37, 0));   // hat brim
    g.add(this._box(0.12, 0.12, 0.95, 0xffdd00, -W * 0.18, H * 0.2, 0));  // left eye star
    g.add(this._box(0.12, 0.12, 0.95, 0xffdd00, W * 0.18, H * 0.2, 0));   // right eye star
    g.add(this._box(0.06, 0.06, 0.95, 0xffffff, -W * 0.18, H * 0.2, 0));  // left pupil
    g.add(this._box(0.06, 0.06, 0.95, 0xffffff, W * 0.18, H * 0.2, 0));   // right pupil
    g.add(this._box(0.15, 0.15, 0.9, 0xffdd00, 0, H * 0.7, 0));     // hat star
    return g;
  }

  _box(w, h, d, color, x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color }),
    );
    mesh.position.set(x, y, z);
    return mesh;
  }

  reset(positionY) {
    this.position.set(0, positionY, 0);
    this.velocity.set(0, DOODLER.jumpVelocity, 0);
    this._blinkTimer = 2.0;   // seconds of post-respawn blinking
    this._blinkPhase = 0;
    this.mesh.visible = true;
    this.syncMesh();
  }

  update(dt, moveAxis) {
    this.velocity.x = moveAxis * DOODLER.moveSpeed;
    this.velocity.y += DOODLER.gravity * dt;
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    const horizontalLimit = WORLD_WIDTH * 0.5;
    if (this.position.x < -horizontalLimit) this.position.x = horizontalLimit;
    if (this.position.x > horizontalLimit)  this.position.x = -horizontalLimit;

    if (this._blinkTimer > 0) {
      this._blinkTimer -= dt;
      this._blinkPhase += dt;
      this.mesh.visible = Math.floor(this._blinkPhase / 0.08) % 2 === 0;
      if (this._blinkTimer <= 0) this.mesh.visible = true;
    }

    this.syncMesh();
  }

  bounce() {
    this.velocity.y = DOODLER.jumpVelocity;
  }

  superBounce() {
    this.velocity.y = DOODLER.jumpVelocity * SUPER_JUMP_MULTIPLIER;
  }

  get isInvincible() { return (this._blinkTimer ?? 0) > 0; }

  getBottom() {
    return this.position.y - this.size.height * 0.5;
  }

  getBounds() {
    return {
      left:   this.position.x - this.size.width  * 0.45,
      right:  this.position.x + this.size.width  * 0.45,
      bottom: this.position.y - this.size.height * 0.5,
      top:    this.position.y + this.size.height * 0.5,
    };
  }

  syncMesh() {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.z = THREE.MathUtils.clamp(-this.velocity.x * 0.03, -0.35, 0.35);
  }
}
