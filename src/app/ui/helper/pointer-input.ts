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
  zoomDiff: number = -1;

  constructor() {
    this.currentZoom = settingsManager.settings.zoom;

    window.addEventListener('mousedown', (event: MouseEvent) => {
      this.active = this.find(event.target as HTMLElement);
      if (this.active) {
        if (this.active.clickBehind) {
          this.active = this.find(this.active.elementRef.nativeElement.parentElement);
          if (!this.active) {
            const elements = document.elementsFromPoint(event.clientX, event.clientY);
            for (let i = 0; i < elements.length; i++) {
              const element = elements[i];
              if (element != event.target) {
                this.active = this.directives.find((directive) => element && directive.elementRef.nativeElement == element);
                if (this.active) {
                  break;
                }
              }
            }
          }
        }

        if (this.active) {
          this.active.pointerdown(event);
          event.preventDefault();
          event.stopPropagation();
        }
      }
    });

    window.addEventListener('touchstart', (event: TouchEvent) => {
      if (event.touches.length == 1) {
        this.active = this.find(event.target as HTMLElement);
        if (this.active) {
          if (this.active.clickBehind) {
            this.behindActive = this.find(this.active.elementRef.nativeElement.parentElement);
            if (!this.behindActive) {
              const elements = document.elementsFromPoint(event.touches[0].clientX, event.touches[0].clientY);
              for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (element != event.target) {
                  this.behindActive = this.directives.find((directive) => element && directive.elementRef.nativeElement == element);
                  if (this.behindActive) {
                    this.behindActive.pointerdown(event);
                    break;
                  }
                }
              }
            }
          }

          if (this.active) {
            this.active.pointerdown(event);
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    });

    window.addEventListener('mousemove', (event: MouseEvent) => {
      if (this.active) {
        this.active.pointermove(event);
        window.document.body.classList.add('dragging');
        window.document.body.classList.add('no-pointer');
      }
    }, { passive: true });

    window.addEventListener('touchmove', (event: TouchEvent) => {
      if (event.touches.length == 1 && this.active) {
        this.active.pointermove(event);
        window.document.body.classList.add('dragging');
        window.document.body.classList.add('no-pointer');
        if (this.behindActive) {
          this.behindActive.cancel();
          this.behindActive = undefined;
        }
      } else {
        this.cancel();
        this.touchmove(event);
      }
    }, { passive: true });

    window.addEventListener('mouseup', (event: MouseEvent) => {
      if (this.active) {
        this.active.pointerup(event);
        this.active = undefined;
        event.preventDefault();
        event.stopPropagation();
      }
      window.document.body.classList.remove('dragging');
      window.document.body.classList.remove('no-pointer');
    });

    window.addEventListener('touchend', (event: TouchEvent) => {
      if (this.active) {
        this.active.pointerup(event);
        this.active = undefined;
        if (this.behindActive) {
          this.behindActive.pointerup(event);
          this.behindActive = undefined;
        }
        event.preventDefault();
        event.stopPropagation();
      } else {
        this.touchend(event);
      }
      window.document.body.classList.remove('dragging');
      window.document.body.classList.remove('no-pointer');
    });

    window.addEventListener('touchcancel', (event: TouchEvent) => {
      if (this.active) {
        this.active.pointerup(event);
        if (this.behindActive) {
          this.behindActive.pointerup(event);
          this.behindActive = undefined;
        }
        if (!this.active.clickBehind) {
          event.preventDefault();
          event.stopPropagation();
        }
        this.active = undefined;
      } else {
        this.touchend(event);
      }
      window.document.body.classList.remove('dragging');
      window.document.body.classList.remove('no-pointer');
    });

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (settingsManager.settings.keyboardShortcuts && this.active && event.key === 'Shift') {
        this.active.fast = true;
      }
    })

    window.addEventListener('keyup', (event: KeyboardEvent) => {
      if (settingsManager.settings.keyboardShortcuts && this.active && event.key === 'Shift') {
        this.active.fast = false;
      }
    })
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

  touchmove(event: TouchEvent) {
    if (settingsManager.settings.pinchZoom) {
      if (event.touches.length === 2) {
        const curDiff = Math.abs(event.touches[0].clientX - event.touches[1].clientX);
        if (this.zoomDiff > 0) {
          this.zoom(Math.ceil((this.zoomDiff - curDiff) * 0.25));
        }
        this.zoomDiff = curDiff;
      }
    }
  }

  touchend(event: TouchEvent) {
    if (settingsManager.settings.pinchZoom) {
      if (event.touches.length < 2 && this.zoomDiff > -1 && settingsManager.settings.zoom != this.currentZoom) {
        this.zoomDiff = -1;
        settingsManager.setZoom(this.currentZoom);
      }
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
  move: boolean = false;
  fast: boolean = false;
  fastOffset: number = 0;
  lastX: number = 0;

  constructor(public elementRef: ElementRef, private service: PointerInputService) {
    this.value = -1;
    this.elementRef.nativeElement.style['touch-action'] = 'pan-y';
  }

  ngOnInit(): void {
    this.service.register(this);
  }

  ngOnDestroy(): void {
    this.service.unregister(this);
  }

  pointerdown(event: TouchEvent | MouseEvent) {
    if (!(event instanceof MouseEvent) || !event.button) {
      this.down = true;
      this.startX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      if (!this.move && this.repeat && !this.doubleClick.observed) {
        this.repeats = -1;
        this.repeatTimeout(event);
      } else if (this.forcePress || settingsManager.settings.pressDoubleClick && !this.forceDoubleClick && this.doubleClick.observed && !this.move && !(event instanceof MouseEvent)) {
        this.timeout = setTimeout(() => {
          if ((event instanceof MouseEvent) || !this.onRelease) {
            this.doubleClick.emit(event);
          }
          this.timeout = null;
          this.clicks = 2;
        }, longPressTreshhold);
      }
    }
  }

  pointermove(event: TouchEvent | MouseEvent) {
    if (this.down) {
      const x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      if (!this.move && Math.abs(this.startX - x) > moveTreshhold) {
        this.panstart(event);
      } else if (this.move) {
        this.panmove(event);
      }
    }
  }

  pointerup(event: TouchEvent | MouseEvent) {
    if (this.down) {
      this.down = false;
      this.startX = 0;
      if (!this.move) {
        if (!this.forcePress && (event instanceof MouseEvent || !settingsManager.settings.pressDoubleClick || this.forceDoubleClick)) {
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
        } else if (!(event instanceof MouseEvent) && this.onRelease && this.clicks == 2) {
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

  panstart(event: TouchEvent | MouseEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed)) {
      this.elementRef.nativeElement.classList.add('dragging');
      this.move = true;

      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
    }
  }

  panmove(event: TouchEvent | MouseEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed)) {
      const rect = this.elementRef.nativeElement.getBoundingClientRect();
      const x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
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

  panend(event: TouchEvent | MouseEvent) {
    if (!this.disabled && settingsManager.settings.dragValues && (this.dragMove.observed || this.dragEnd.observed)) {
      if (this.value >= 0 || this.relative) {
        this.dragEnd.emit(this.value);
      }
      this.repeats = -1;
      this.startX = -1;
      this.move = false;
      this.value = -1;
      this.relativeValue = -1;
      this.fast = false;
      this.fastOffset = 0;
      this.elementRef.nativeElement.classList.remove('dragging');
    }
  }

  cancel() {
    this.down = false;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.dragCancel.emit(this.value);

    this.repeats = -1;
    this.clicks = 0;
    this.startX = -1;
    this.move = false;
    this.value = -1;
    this.relativeValue = -1;
    this.fast = false;
    this.fastOffset = 0;
    this.elementRef.nativeElement.classList.remove('dragging');
  }

  repeatTimeout(event: TouchEvent | MouseEvent) {
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