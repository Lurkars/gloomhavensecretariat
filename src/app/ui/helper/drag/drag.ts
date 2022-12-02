import { Component, ElementRef, EventEmitter, Input, Output } from "@angular/core";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";

export const doubleClickTreshhold: number = 250;
export const longTouchTreshhold: number = 500;

@Component({
  selector: 'ghs-drag-click',
  templateUrl: './drag.html',
  styleUrls: ['./drag.scss']
})
export class DragClickComponent {

  @Input() clickBehind: boolean = false;
  @Input() relative: boolean = false;
  @Input() step: number = 1;
  @Input() min: number = 0;
  @Input() max: number = 99;
  @Output('dragMove') dragMoveCallback = new EventEmitter<number>();
  @Output('dragEnd') dragEndCallback = new EventEmitter<number>();

  @Output('singleClick') singleClick: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter<MouseEvent | TouchEvent>();
  @Output('doubleClick') doubleClick: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter<MouseEvent | TouchEvent>();

  timeout: any = null;
  time: number = -1;

  inputCount: number = 0;
  draggingTimeout: any;
  touchX: number = 0;
  touchY: number = 0;
  relativeValue: number = -1;
  value: number = -1;
  inputEvent: boolean = false;
  settingsManager: SettingsManager = settingsManager;

  constructor(private elementRef: ElementRef) {
    this.value = this.min - 1;
  }

  click(event: MouseEvent) {
    if (this.inputCount < 2 && !window.document.body.classList.contains('scrolling')) {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
        if (this.inputCount < 2) {
          if (this.clickBehind) {
            this.emitClickBehind(event.clientX, event.clientY);
          } else {
            this.doubleClick.emit(event);
          }
          this.inputCount = 0;
        }
      } else {
        this.timeout = setTimeout(() => {
          if (this.timeout) {
            this.timeout = null;
            if (this.inputCount < 2) {
              if (this.clickBehind) {
                this.emitClickBehind(event.clientX, event.clientY);
              } else {
                this.singleClick.emit(event);
              }
            }
            this.inputCount = 0;
          }
        }, doubleClickTreshhold);
      }
    }
    this.inputCount = 0;
    this.relativeValue = -1;

    if (settingsManager.settings.dragValues) {
      this.draggingTimeout = setTimeout(() => {
        document.body.classList.remove('dragging');
      }, 200);
      this.elementRef.nativeElement.classList.remove('dragging');
      this.elementRef.nativeElement.firstChild.classList.remove('dragging');
    }
  }

  touchstart(event: TouchEvent) {
    if (event.touches.length > 0) {
      this.touchX = event.touches[0].clientX;
      this.touchY = event.touches[0].clientY;
    }

    this.time = Date.now();
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.timeout = setTimeout(() => {
      if (this.timeout && this.inputCount < 2 && !window.document.body.classList.contains('scrolling')) {
        if (this.clickBehind) {
          this.emitClickBehind(this.touchX, this.touchY);
        } else {
          this.doubleClick.emit(event);
        }
      }
      this.timeout = null;
      this.inputCount = 0;
    }, longTouchTreshhold);
  }

  touchmove(event: any) {
    if (!this.inputEvent && settingsManager.settings.dragValues) {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      this.inputCount++;
      if (this.inputCount == 2) {
        document.body.classList.add('dragging');
        this.elementRef.nativeElement.classList.add('dragging');
        this.elementRef.nativeElement.firstChild.classList.add('dragging');
      }

      if (this.inputCount > 3 && event.touches.length > 0) {
        const rect = this.elementRef.nativeElement.getBoundingClientRect();
        this.value = Math.min(99, Math.max(0, Math.floor((event.touches[0].clientX - rect.left) / rect.width * 100)));
        if (this.relative && this.relativeValue == -1) {
          this.relativeValue = this.value;
        }
        this.dragMoveCallback.emit(this.relative ? this.value - this.relativeValue : this.value);
      }
    } else if (!this.inputEvent) {
      this.inputCount += 0.2;
    }
  }

  touchend(event: TouchEvent) {
    if (this.inputCount < 2 && this.touchX > 0 && this.touchY > 0 && !window.document.body.classList.contains('scrolling') && (Date.now() - this.time < longTouchTreshhold)) {
      if (this.clickBehind) {
        this.emitClickBehind(this.touchX, this.touchY)
      } else {
        this.singleClick.emit(event)
      }
    }
    this.touchX = 0;
    this.touchY = 0;
    if (settingsManager.settings.dragValues) {
      this.endDrag();
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  change(event: any) {
    if (settingsManager.settings.dragValues) {
      this.endDrag();
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  endDrag() {
    if (this.inputCount > 1 && this.value >= this.min) {
      this.dragEndCallback.emit(this.relative ? this.value - this.relativeValue : this.value);
    }
    this.value = this.min - 1;
    this.relativeValue = -1;
    this.draggingTimeout = setTimeout(() => {
      document.body.classList.remove('dragging');
      this.elementRef.nativeElement.classList.remove('dragging');
      this.elementRef.nativeElement.firstChild.classList.remove('dragging');
      this.inputEvent = false;
      this.inputCount = 0;
      this.draggingTimeout = null;
    }, 200);
  }

  input(event: any) {
    if (settingsManager.settings.dragValues) {
      this.inputEvent = true;
      this.value = event.target.value;
      this.inputCount++;
      if (this.inputCount == 2) {
        document.body.classList.add('dragging');
        this.elementRef.nativeElement.classList.add('dragging');
        this.elementRef.nativeElement.firstChild.classList.add('dragging');
      }

      if (this.inputCount > 3) {
        if (this.relative && this.relativeValue == -1) {
          this.relativeValue = this.value;
        }
        this.dragMoveCallback.emit(this.relative ? this.value - this.relativeValue : this.value);
      }
    }
  }

  emitClickBehind(x: number, y: number) {
    if (!this.timeout) {
      let elements = document.elementsFromPoint(x, y);
      if (elements.length > 2 && elements[0].classList.contains('drag-value-input')) {
        (elements[2] as HTMLElement).click();
      }
      this.timeout = setTimeout(() => {
        clearTimeout(this.timeout);
        this.timeout = null;
        this.inputCount = 0;
      }, 100)
    }
  }
}