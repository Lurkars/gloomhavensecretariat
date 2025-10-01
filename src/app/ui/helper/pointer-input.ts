import { Directive, ElementRef, EventEmitter, Injectable, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

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
      if (this.active && event.isPrimary) {
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


@Directive({
  standalone: false,
  selector: 'ghs-pointer-input, [ghs-pointer-input]'
})
export class PointerInputDirective implements OnInit, OnDestroy {

  @Input() clickBehind: boolean = false;
  @Input() relative: boolean = false;
  @Input() screenWidth: boolean = false;
  @Input() repeat: boolean = false;
  @Input() disabled: boolean = false;
  @Input() forcePress: boolean = false;
  @Input() forceDoubleClick: boolean = false;
  @Input() onRelease: boolean = false;
  @Input() fastShift: boolean = false;
  @Output('dragMove') dragMove = new EventEmitter<number>();
  @Output('dragEnd') dragEnd = new EventEmitter<number>();
  @Output('dragCancel') dragCancel = new EventEmitter<number>();

  @Output('singleClick') singleClick: EventEmitter<any> = new EventEmitter<any>();
  @Output('doubleClick') doubleClick: EventEmitter<any> = new EventEmitter<any>();

  timeout: any = null;
  relativeValue: number = -1;
  value: number = -1;
  repeats: number = -1;
  down: boolean = false;
  clicks: number = 0;
  startX: number = 0;
  startY: number = 0;
  move: boolean = false;
  fast: boolean = false;
  fastOffset: number = 0;
  lastX: number = 0;
  isDragElement: boolean = false;

  constructor(public elementRef: ElementRef, private service: PointerInputService) {
    this.value = -1;
    this.elementRef.nativeElement.style['touch-action'] = 'pan-y';
    this.isDragElement = elementRef.nativeElement.hasAttribute('cdkdrag') ||
      elementRef.nativeElement.hasAttribute('cdkdraghandle') ||
      elementRef.nativeElement.classList.contains('cdk-drag') ||
      elementRef.nativeElement.classList.contains('cdk-drag-handle') ||
      elementRef.nativeElement.classList.contains('cdk-drag-preview') ||
      elementRef.nativeElement.classList.contains('cdk-drag-placeholder');
  }

  ngOnInit(): void {
    this.service.register(this);
  }

  ngOnDestroy(): void {
    this.service.unregister(this);
  }

  pointerdown(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.down = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    if (!this.move && this.repeat && !this.doubleClick.observed) {
      this.repeats = -1;
      this.repeatTimeout(event);
    } else if (this.forcePress || settingsManager.settings.pressDoubleClick && !this.forceDoubleClick && this.doubleClick.observed && !this.move && event.pointerType === 'touch') {
      this.timeout = setTimeout(() => {
        if (event.pointerType === 'mouse' || !this.onRelease) {
          this.doubleClick.emit(event);
        }
        this.timeout = null;
        this.clicks = 2;
      }, longPressTreshhold);
    }
  }

  pointermove(event: PointerEvent) {
    if (this.down) {
      const x = event.clientX;
      const y = event.clientY;
      if (!this.move && Math.max(Math.abs(this.startX - x), Math.abs(this.startY - y)) > moveTreshhold) {
        this.panstart(event);
      } else if (this.move) {
        this.panmove(event);
      }
    }
  }

  pointerup(event: PointerEvent) {
    if (this.down) {
      this.down = false;
      this.startX = 0;
      this.startY = 0;
      if (this.service.currentPinchZoom) {
        this.clicks = 0;
        if (this.timeout) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
      } else if (!this.move) {
        if (!this.forcePress && (event.pointerType === 'mouse' || !settingsManager.settings.pressDoubleClick || this.forceDoubleClick)) {
          this.clicks++;
          if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
          }
          if (this.clicks == 2 && this.doubleClick.observed) {
            this.doubleClick.emit(event);
            this.clicks = 0;
          } else {
            this.timeout = setTimeout(() => {
              if (this.clicks > 0 && (!this.repeat || this.doubleClick.observed)) {
                this.singleClick.emit(event);
              }
              this.clicks = 0;
              this.timeout = null;
            }, this.doubleClick.observed ? doubleClickTreshhold : 0)
          }
        } else if (event.pointerType === 'touch' && this.onRelease && this.clicks == 2) {
          this.doubleClick.emit(event);
          this.clicks = 0;
        } else {
          if (this.clicks < 2 && (!this.repeat || this.doubleClick.observed)) {
            this.singleClick.emit(event);
          }
          if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
          }
          this.clicks = 0;
        }
      } else {
        this.clicks = 0;
      }
      this.panend(event);
    }
  }

  panstart(event: PointerEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed)) {
      this.elementRef.nativeElement.classList.add('dragging');
    }
    this.move = true;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  panmove(event: PointerEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed)) {
      const rect = this.elementRef.nativeElement.getBoundingClientRect();
      const x = event.clientX;
      if (this.screenWidth) {
        if (document.body.clientWidth > dragWidthThreshold) {
          this.value = Math.min(99, Math.max(0, x * (dragWidthThreshold / document.body.clientWidth) / document.body.clientWidth * 100));
        } else {
          this.value = Math.min(99, Math.max(0, x / document.body.clientWidth * 100));
          if (this.relative) {
            this.value = this.value * dragWidthFactor;
          }
        }
      } else {
        this.value = Math.min(99, Math.max(0, (x - rect.left) / rect.width * 100));
      }
      if (this.relative && this.relativeValue == -1) {
        this.relativeValue = this.value;
      }
      if (this.fast) {
        this.fastOffset += (x - this.lastX) < 0 ? -1 : 1;
      }
      this.value = Math.floor(this.relative ? this.value - this.relativeValue : this.value) + this.fastOffset;
      this.lastX = x;
      this.dragMove.emit(this.value);
    }
  }

  panend(event: PointerEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed) && (this.value >= 0 || this.relative)) {
      this.dragEnd.emit(this.value);
    }
    this.reset();
  }

  cancel() {
    this.down = false;
    this.clicks = 0;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.dragCancel.emit(this.value);
    this.reset();
  }

  reset() {
    this.repeats = -1;
    this.startX = -1;
    this.startY = -1;
    this.move = false;
    this.value = -1;
    this.relativeValue = -1;
    this.fast = false;
    this.fastOffset = 0;
    this.elementRef.nativeElement.classList.remove('dragging');
  }

  repeatTimeout(event: PointerEvent) {
    if (this.down && !this.move) {
      this.singleClick.emit(event);
      if (this.repeats == -1) {
        this.repeats = holdTreshhold;
      } else {
        this.repeats -= 25;
        if (this.repeats < 25) {
          this.repeats = 25;
        }
      }
      this.timeout = setTimeout(() => {
        this.repeatTimeout(event);
      }, this.repeats);
    }
  }

}
