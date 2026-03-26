import * as THREE from 'three';
import { PLATFORM } from '../constants.js';

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export class PlatformManager {
  constructor(scene) {
    this.scene = scene;
    this.platforms = [];
    this.platformMaterial = new THREE.MeshLambertMaterial({ color: 0x3d6fe1 });
    this.platformGeometry = new THREE.BoxGeometry(
      PLATFORM.width,
      PLATFORM.height,
      1.1,
    );
  }

  reset(startY) {
    this.disposePlatforms();
    this.platforms = [];

    let currentY = startY - 1;
    for (let i = 0; i < PLATFORM.initialCount; i += 1) {
      const x = randomRange(-PLATFORM.horizontalSpread, PLATFORM.horizontalSpread);
      this.createPlatform(x, currentY);
      currentY += randomRange(PLATFORM.verticalMinGap, PLATFORM.verticalMaxGap);
    }
  }

  update(topVisibleY) {
    const highest = this.getHighestY();
    for (const platform of this.platforms) {
      if (platform.position.y < topVisibleY - 30) {
        const x = randomRange(-PLATFORM.horizontalSpread, PLATFORM.horizontalSpread);
        const y = highest.value + randomRange(
          PLATFORM.verticalMinGap,
          PLATFORM.verticalMaxGap,
        );
        highest.value = y;
        platform.position.set(x, y, 0);
      }
    }
  }

  getCollidingPlatform(doodlerBounds, previousBottom, isFalling) {
    if (!isFalling) {
      return null;
    }

    for (const platform of this.platforms) {
      const pLeft = platform.position.x - PLATFORM.width * 0.5;
      const pRight = platform.position.x + PLATFORM.width * 0.5;
      const pTop = platform.position.y + PLATFORM.height * 0.5;

      const horizontalHit =
        doodlerBounds.right >= pLeft && doodlerBounds.left <= pRight;
      const verticalPass =
        previousBottom >= pTop - 0.12 && doodlerBounds.bottom <= pTop + 0.35;

      if (horizontalHit && verticalPass) {
        return platform;
      }
    }

    return null;
  }

  createPlatform(x, y) {
    const mesh = new THREE.Mesh(this.platformGeometry, this.platformMaterial);
    mesh.position.set(x, y, 0);
    this.scene.add(mesh);
    this.platforms.push(mesh);
  }

  getHighestY() {
    let max = -Infinity;
    for (const platform of this.platforms) {
      if (platform.position.y > max) {
        max = platform.position.y;
      }
    }
    return { value: max };
  }

  disposePlatforms() {
    for (const platform of this.platforms) {
      this.scene.remove(platform);
    }
  }
}
