import { Injectable } from "@angular/core";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { PointerInputDirective } from "./pointer-input";

export const doubleClickTreshhold: number = 250;
export const longPressTreshhold: number = 550;
export const holdTreshhold: number = 500;
export const moveTreshhold: number = 7;
export const repeatInterval: number = 100;
export const dragWidthThreshold: number = 1200;
export const dragWidthFactor: number = 0.4;
export const maxElementDepth: number = 50;

@Injectable({
  providedIn: 'root',
})
export class PointerInputService {

  directives: PointerInputDirective[] = [];
  active: PointerInputDirective | undefined;
  behindActive: PointerInputDirective | undefined;

  currentZoom: number = 0;
  currentPinchZoom: boolean = false;
  zoomDiff: number = -1;

  // Track active pointers for multi-touch
  private activePointers: Map<number, PointerEvent> = new Map();

  constructor() {
    this.currentZoom = settingsManager.settings.zoom;

    // Pointer Events
    window.addEventListener('pointerdown', (event: PointerEvent) => {
      this.activePointers.set(event.pointerId, event);

      // Multi-touch: handle pinch-zoom
      if (settingsManager.settings.pinchZoom && this.countActiveTouches() === 2) {
        this.zoomDiff = this.getTouchDistance();
        this.currentPinchZoom = true;
      }

      // Only handle primary pointer for normal interactions
      if (event.isPrimary) {
        this.active = this.find(event.target as HTMLElement);
        if (this.active) {
          if (this.active.clickBehind) {
            this.behindActive = this.find(this.active.elementRef.nativeElement.parentElement);
            if (!this.behindActive) {
              const elements = document.elementsFromPoint(event.clientX, event.clientY);
              for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (element != event.target) {
                  this.behindActive = this.directives.find((directive) => element && directive.elementRef.nativeElement == element);
                  if (this.behindActive) {
                    break;
                  }
                }
              }
            }
          }
          if (this.behindActive && this.active.clickBehind) {
            this.behindActive.pointerdown(event);
          }
          this.active.pointerdown(event);
          if (!this.active.isDragElement) {
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    });

    window.addEventListener('pointermove', (event: PointerEvent) => {
      if (settingsManager.settings.pinchZoom && this.activePointers.size >= 2) {
        this.activePointers.set(event.pointerId, event);
        this.handlePinchZoom();
        this.currentPinchZoom = true;
        return;
      }
      if (this.active && event.isPrimary && !this.active.isDragElement) {
        this.active.pointermove(event);
        window.document.body.classList.add('dragging');
        window.document.body.classList.add('no-pointer');
        if (this.behindActive) {
          this.behindActive.cancel();
          this.behindActive = undefined;
        }
      }
    }, { passive: true });

    window.addEventListener('pointerup', (event: PointerEvent) => {
      this.activePointers.delete(event.pointerId);

      if (this.active && event.isPrimary) {
        this.active.pointerup(event);
        if (!this.active.isDragElement) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.active = undefined;
      }
      if (this.behindActive && event.isPrimary) {
        this.behindActive.pointerup(event);
        this.behindActive = undefined;
      }
      if (settingsManager.settings.pinchZoom && this.activePointers.size < 2 && this.zoomDiff > -1 && settingsManager.settings.zoom != this.currentZoom) {
        this.zoomDiff = -1;
        settingsManager.setZoom(this.currentZoom);
      }
      if (this.activePointers.size === 0) {
        this.currentPinchZoom = false;
      }
      window.document.body.classList.remove('dragging');
      window.document.body.classList.remove('no-pointer');
    });

    window.addEventListener('pointercancel', (event: PointerEvent) => {
      this.activePointers.delete(event.pointerId);

      if (this.active && event.isPrimary) {
        this.active.pointerup(event);
        if (this.behindActive) {
          this.behindActive.pointerup(event);
          this.behindActive = undefined;
        }
        if (!this.active.clickBehind && !this.active.isDragElement) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.active = undefined;
      }
      window.document.body.classList.remove('dragging');
      window.document.body.classList.remove('no-pointer');
    });

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (settingsManager.settings.keyboardShortcuts && this.active && event.key === 'Shift') {
        this.active.fast = true;
      }
    });

    window.addEventListener('keyup', (event: KeyboardEvent) => {
      if (settingsManager.settings.keyboardShortcuts && this.active && event.key === 'Shift') {
        this.active.fast = false;
      }
    });
  }

  zoom(value: number) {
    this.currentZoom += value;
    document.body.style.setProperty('--ghs-factor', this.currentZoom + '');
    const maxWidth = +window.getComputedStyle(document.body).getPropertyValue('min-width').replace('px', '');
    if (value < 0 && maxWidth >= window.innerWidth) {
      this.currentZoom -= value;
      document.body.style.setProperty('--ghs-factor', this.currentZoom + '');
    }
  }

  // Helper: count active touch pointers
  private countActiveTouches(): number {
    let count = 0;
    this.activePointers.forEach(ev => {
      if (ev.pointerType === 'touch') count++;
    });
    return count;
  }

  // Helper: get distance between two active touch pointers
  private getTouchDistance(): number {
    const touches = Array.from(this.activePointers.values()).filter(ev => ev.pointerType === 'touch');
    if (touches.length < 2) return 0;
    const [a, b] = touches;
    return Math.abs(a.clientX - b.clientX);
  }

  // Handle pinch-zoom gesture
  private handlePinchZoom() {
    if (!settingsManager.settings.pinchZoom) return;
    const touches = Array.from(this.activePointers.values()).filter(ev => ev.pointerType === 'touch');
    if (touches.length === 2) {
      const curDiff = Math.abs(touches[0].clientX - touches[1].clientX);
      if (this.zoomDiff > 0) {
        this.zoom(Math.ceil((this.zoomDiff - curDiff) * 0.25));
      }
      this.zoomDiff = curDiff;
    }
  }

  cancel() {
    if (this.active) {
      this.active.cancel();
      this.active = undefined;
    }
    if (this.behindActive) {
      this.behindActive.cancel();
      this.behindActive = undefined;
    }
    window.document.body.classList.remove('dragging');
    window.document.body.classList.remove('no-pointer');
  }

  register(directive: PointerInputDirective) {
    this.directives.push(directive);
  }

  unregister(directive: PointerInputDirective) {
    this.directives.splice(this.directives.indexOf(directive), 1);
  }

  find(element: HTMLElement): PointerInputDirective | undefined {
    let target: HTMLElement = element;
    let active = this.directives.find((directive) => target && directive.elementRef.nativeElement == target);
    let depth = 0;
    while (!active && depth < maxElementDepth && target !== document.body && target.parentElement) {
      target = target.parentElement;
      active = this.directives.find((directive) => target && directive.elementRef.nativeElement == target);
      depth++;
    }

    return active;
  }
}