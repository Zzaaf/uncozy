import * as THREE from 'three';
import { DOODLER, WORLD_WIDTH } from '../constants.js';

export class Doodler {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 3, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.size = { width: DOODLER.width, height: DOODLER.height };
    this.mesh = this.createMesh();
    this.scene.add(this.mesh);
    this.syncMesh();
  }

  createMesh() {
    const body = new THREE.Group();

    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(this.size.width, this.size.height * 0.75, 0.9),
      new THREE.MeshLambertMaterial({ color: 0x5fcb4f }),
    );
    torso.position.y = 0;
    body.add(torso);

    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    eye.position.set(this.size.width * 0.2, this.size.height * 0.2, 0.5);
    body.add(eye);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x111111 }),
    );
    pupil.position.set(this.size.width * 0.22, this.size.height * 0.2, 0.59);
    body.add(pupil);

    body.castShadow = false;
    return body;
  }

  reset(positionY) {
    this.position.set(0, positionY, 0);
    this.velocity.set(0, DOODLER.jumpVelocity, 0);
    this.syncMesh();
  }

  update(dt, moveAxis) {
    this.velocity.x = moveAxis * DOODLER.moveSpeed;
    this.velocity.y += DOODLER.gravity * dt;
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    const horizontalLimit = WORLD_WIDTH * 0.5;
    if (this.position.x < -horizontalLimit) {
      this.position.x = horizontalLimit;
    }
    if (this.position.x > horizontalLimit) {
      this.position.x = -horizontalLimit;
    }

    this.syncMesh();
  }

  bounce() {
    this.velocity.y = DOODLER.jumpVelocity;
  }

  getBottom() {
    return this.position.y - this.size.height * 0.5;
  }

  getBounds() {
    return {
      left: this.position.x - this.size.width * 0.45,
      right: this.position.x + this.size.width * 0.45,
      bottom: this.position.y - this.size.height * 0.5,
      top: this.position.y + this.size.height * 0.5,
    };
  }

  syncMesh() {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.z = THREE.MathUtils.clamp(-this.velocity.x * 0.03, -0.35, 0.35);
  }
}
