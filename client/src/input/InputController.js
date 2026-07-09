export class InputController {
  constructor(targetElement) {
    this.targetElement = targetElement;
    this.horizontal = 0;
    this.pointerActive = false;
    this.pointerX = 0;

    this.pressedKeys = new Set();
    this._shootQueued = false;
    this._tapStart   = null;

    this.onKeyDown      = this.onKeyDown.bind(this);
    this.onKeyUp        = this.onKeyUp.bind(this);
    this.onPointerDown  = this.onPointerDown.bind(this);
    this.onPointerMove  = this.onPointerMove.bind(this);
    this.onPointerUp    = this.onPointerUp.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup',   this.onKeyUp);
    this.targetElement.addEventListener('pointerdown', this.onPointerDown);
    this.targetElement.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup',   this.onKeyUp);
    this.targetElement.removeEventListener('pointerdown', this.onPointerDown);
    this.targetElement.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  getHorizontal() {
    if (this.pointerActive) return this.pointerX;
    if (this.pressedKeys.has('ArrowLeft') || this.pressedKeys.has('KeyA')) return -1;
    if (this.pressedKeys.has('ArrowRight') || this.pressedKeys.has('KeyD')) return 1;
    return 0;
  }

  // One-shot: returns true once per shoot gesture
  consumeShoot() {
    const fired = this._shootQueued;
    this._shootQueued = false;
    return fired;
  }

  onKeyDown(event) {
    this.pressedKeys.add(event.code);
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      this._shootQueued = true;
    }
  }

  onKeyUp(event) {
    this.pressedKeys.delete(event.code);
  }

  onPointerDown(event) {
    this.pointerActive = true;
    this._tapStart = { x: event.clientX, y: event.clientY, t: Date.now() };
    this.updatePointer(event);
    this.targetElement.setPointerCapture(event.pointerId);
  }

  onPointerMove(event) {
    if (!this.pointerActive) return;
    this.updatePointer(event);
  }

  onPointerUp(event) {
    // Quick tap with < 180ms and < 25px movement → shoot
    if (this._tapStart) {
      const dx   = event.clientX - this._tapStart.x;
      const dy   = event.clientY - this._tapStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt   = Date.now() - this._tapStart.t;
      if (dt < 180 && dist < 25) this._shootQueued = true;
      this._tapStart = null;
    }
    this.pointerActive = false;
    this.pointerX = 0;
  }

  updatePointer(event) {
    const rect = this.targetElement.getBoundingClientRect();
    if (rect.width === 0) { this.pointerX = 0; return; }
    const normalized = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerX = Math.max(-1, Math.min(1, normalized));
  }
}
