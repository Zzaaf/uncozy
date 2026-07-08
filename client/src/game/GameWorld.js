import * as THREE from 'three';
import { CAMERA, PLATFORM, WORLD_HEIGHT, WORLD_WIDTH } from './constants.js';
import { Doodler } from './entities/Doodler.js';
import { PlatformManager } from './entities/PlatformManager.js';

export class GameWorld {
  constructor(canvasHost) {
    this.canvasHost = canvasHost;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080820);

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
    this.doodler = new Doodler(this.scene);
    this.score        = 0;
    this.highestY     = 0;
    this.isGameOver   = false;
    this.heartPickedUp = false;
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
    const colors = new Float32Array(count * 3);
    const starColors = [
      [1, 1, 1], [0.6, 0.9, 1], [1, 0.85, 0.65], [0.85, 0.65, 1], [0.6, 1, 0.85],
    ];
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = Math.random() * 3000;
      positions[i * 3 + 2] = -9;
      const c = starColors[Math.floor(Math.random() * starColors.length)];
      colors[i * 3]     = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
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
    for (let y = YMIN; y <= YMAX; y += 2) {
      pts.push(XMIN, y, -7,  XMAX, y, -7);
    }
    for (let x = XMIN; x <= XMAX; x += 2) {
      pts.push(x, YMIN, -7,  x, YMAX, -7);
    }
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
    this.camera.position.y = WORLD_HEIGHT / 2;
    this.platformManager.reset(0);
    this.doodler.setSkin(skinId);
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
      if (platform.userData.type === 'super') {
        this.doodler.superBounce();
      } else {
        this.doodler.bounce();
      }
    }

    if (this.platformManager.checkHeartPickup(bounds)) {
      this.heartPickedUp = true;
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
    this.platformManager.update(targetY + WORLD_HEIGHT * 0.6, this.score, dt);

    const visibleBottom = this.camera.position.y + this.camera.bottom;
    if (bounds.top < visibleBottom - CAMERA.bottomKillMargin) {
      this.isGameOver = true;
    }

    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  respawn() {
    this.isGameOver = false;
    const respawnY = this.camera.position.y + this.camera.bottom + 3;
    this.doodler.reset(respawnY);
  }

  dispose() {
    this.renderer.dispose();
  }
}
