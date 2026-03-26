export class InputController {
  constructor(targetElement) {
    this.targetElement = targetElement;
    this.horizontal = 0;
    this.pointerActive = false;
    this.pointerX = 0;

    this.pressedKeys = new Set();
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.targetElement.addEventListener('pointerdown', this.onPointerDown);
    this.targetElement.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.targetElement.removeEventListener('pointerdown', this.onPointerDown);
    this.targetElement.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  getHorizontal() {
    if (this.pointerActive) {
      return this.pointerX;
    }
    if (this.pressedKeys.has('ArrowLeft') || this.pressedKeys.has('KeyA')) {
      return -1;
    }
    if (this.pressedKeys.has('ArrowRight') || this.pressedKeys.has('KeyD')) {
      return 1;
    }
    return 0;
  }

  onKeyDown(event) {
    this.pressedKeys.add(event.code);
  }

  onKeyUp(event) {
    this.pressedKeys.delete(event.code);
  }

  onPointerDown(event) {
    this.pointerActive = true;
    this.updatePointer(event);
    this.targetElement.setPointerCapture(event.pointerId);
  }

  onPointerMove(event) {
    if (!this.pointerActive) {
      return;
    }
    this.updatePointer(event);
  }

  onPointerUp() {
    this.pointerActive = false;
    this.pointerX = 0;
  }

  updatePointer(event) {
    const rect = this.targetElement.getBoundingClientRect();
    if (rect.width === 0) {
      this.pointerX = 0;
      return;
    }
    const normalized = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerX = Math.max(-1, Math.min(1, normalized));
  }
}
