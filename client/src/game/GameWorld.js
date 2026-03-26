import * as THREE from 'three';
import { CAMERA, PLATFORM, WORLD_HEIGHT, WORLD_WIDTH } from './constants.js';
import { Doodler } from './entities/Doodler.js';
import { PlatformManager } from './entities/PlatformManager.js';

export class GameWorld {
  constructor(canvasHost) {
    this.canvasHost = canvasHost;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd7f0ff);

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

    this.platformManager = new PlatformManager(this.scene);
    this.doodler = new Doodler(this.scene);
    this.score = 0;
    this.highestY = 0;
    this.isGameOver = false;
    this.resize();
  }

  addLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const directional = new THREE.DirectionalLight(0xffffff, 0.45);
    directional.position.set(8, 18, 20);
    this.scene.add(ambient, directional);
  }

  reset() {
    this.score = 0;
    this.highestY = 5;
    this.isGameOver = false;
    this.camera.position.y = WORLD_HEIGHT / 2;
    this.platformManager.reset(0);
    this.doodler.reset(5);
    this.render();
  }

  resize() {
    const width = this.canvasHost.clientWidth || 1;
    const height = this.canvasHost.clientHeight || 1;
    const aspect = width / height;
    const baseHeight = WORLD_HEIGHT;
    const baseWidth = baseHeight * aspect;

    this.camera.left = -baseWidth / 2;
    this.camera.right = baseWidth / 2;
    this.camera.top = baseHeight / 2;
    this.camera.bottom = -baseHeight / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
  }

  update(dt, horizontalInput) {
    if (this.isGameOver) {
      return;
    }

    const previousBottom = this.doodler.getBottom();
    this.doodler.update(dt, horizontalInput);
    const bounds = this.doodler.getBounds();

    const platform = this.platformManager.getCollidingPlatform(
      bounds,
      previousBottom,
      this.doodler.velocity.y < 0,
    );
    if (platform) {
      this.doodler.position.y =
        platform.position.y + PLATFORM.height * 0.5 + this.doodler.size.height / 2;
      this.doodler.bounce();
    }

    if (this.doodler.position.y > this.highestY) {
      const delta = this.doodler.position.y - this.highestY;
      this.highestY = this.doodler.position.y;
      this.score += Math.max(1, Math.floor(delta * 10));
    }

    const targetY = Math.max(
      this.camera.position.y,
      this.doodler.position.y + CAMERA.followOffset,
    );
    this.camera.position.y = targetY;
    this.platformManager.update(targetY + WORLD_HEIGHT * 0.6);

    const visibleBottom = this.camera.position.y + this.camera.bottom;
    if (bounds.top < visibleBottom - CAMERA.bottomKillMargin) {
      this.isGameOver = true;
    }

    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
