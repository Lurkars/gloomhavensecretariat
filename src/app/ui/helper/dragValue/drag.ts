import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from "@angular/core";

@Component({
  selector: 'ghs-drag-value',
  templateUrl: './drag.html',
  styleUrls: ['./drag.scss']
})
export class DragValueComponent {

  @Input() relative: boolean = false;
  @Input() step: number = 1;
  @Input() min: number = 0;
  @Input() max: number = 99;
  @Output('dragMove') dragMoveCallback = new EventEmitter<number>();
  @Output('dragEnd') dragEndCallback = new EventEmitter<number>();

  inputCount: number = 0;
  draggingTimeout: any;
  touchX: number = 0;
  touchY: number = 0;
  relativeValue: number = -1;
  value: number = -1;
  clickBehindTimeout: any = null;
  inputEvent: boolean = false;

  constructor(private elementRef: ElementRef) {
    this.value = this.min - 1;
  }

  click(event: any) {
    if (this.inputCount < 2 && !this.clickBehindTimeout) {
      this.clickBehind(event.clientX, event.clientY);
    }
    this.inputCount = 0;
    this.relativeValue = -1;
    this.draggingTimeout = setTimeout(() => {
      document.body.classList.remove('dragging');
    }, 200);
    this.elementRef.nativeElement.classList.remove('dragging');
    this.elementRef.nativeElement.firstChild.classList.remove('dragging');
  }

  clickBehind(x: number, y: number) {
    if (!this.clickBehindTimeout) {
      let elements = document.elementsFromPoint(x, y);
      if (elements.length > 2 && elements[0].classList.contains('drag-value-input')) {
        (elements[2] as HTMLElement).click();
      }
      this.clickBehindTimeout = setTimeout(() => {
        clearTimeout(this.clickBehindTimeout);
        this.clickBehindTimeout = null;
      }, 100)
    }
  }

  touchstart(event: any) {
    if (event.touches.length > 0) {
      this.touchX = event.touches[0].clientX;
      this.touchY = event.touches[0].clientY;
    }
  }

  touchmove(event: any) {
    if (!this.inputEvent) {
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
    }
  }

  touchend(event: any) {
    if (this.inputCount < 2 && this.touchX > 0 && this.touchY > 0 && !this.clickBehindTimeout) {
      this.clickBehind(this.touchX, this.touchY);
    }
    this.touchX = 0;
    this.touchY = 0;
    this.endDrag();
  }

  change(event: any) {
    this.endDrag();
  }

  endDrag() {
    if (this.inputCount > 1 && this.value > this.min - 1) {
      this.dragEndCallback.emit(this.relative ? this.value - this.relativeValue : this.value);
    }
    this.value = this.min - 1;
    this.inputCount = 0;
    this.relativeValue = -1;
    this.draggingTimeout = setTimeout(() => {
      document.body.classList.remove('dragging');
    }, 200);
    this.elementRef.nativeElement.classList.remove('dragging');
    this.elementRef.nativeElement.firstChild.classList.remove('dragging');
    this.inputEvent = false;
  }

  input(event: any) {
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

  constructor(private elementRef: ElementRef) {
    this.value = this.min - 1;
  }

  click(event: MouseEvent) {
    if (this.inputCount < 2) {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
        if (this.inputCount < 2) {
          if (this.clickBehind) {
            this.emitClickBehind(event.clientX, event.clientY);
          } else {
            this.doubleClick.emit(event);
          }
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
          }
        }, doubleClickTreshhold);
      }
    }
    this.inputCount = 0;
    this.relativeValue = -1;
    this.draggingTimeout = setTimeout(() => {
      document.body.classList.remove('dragging');
    }, 200);
    this.elementRef.nativeElement.classList.remove('dragging');
    this.elementRef.nativeElement.firstChild.classList.remove('dragging');
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
      if (this.timeout && this.inputCount < 2) {
        if (this.clickBehind) {
          this.emitClickBehind(this.touchX, this.touchY);
        } else {
          this.doubleClick.emit(event);
        }
      }
      this.timeout = null;
    }, longTouchTreshhold);
  }

  touchmove(event: any) {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (!this.inputEvent) {
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
    }
  }

  touchend(event: TouchEvent) {
    if (this.inputCount < 2 && this.touchX > 0 && this.touchY > 0) {
      if (Date.now() - this.time < longTouchTreshhold) {
        if (this.clickBehind) {
          this.emitClickBehind(this.touchX, this.touchY)
        } else {
          this.singleClick.emit(event)
        }
      }
    }
    this.touchX = 0;
    this.touchY = 0;
    this.endDrag();
  }

  change(event: any) {
    this.endDrag();
  }

  endDrag() {
    if (this.inputCount > 1 && this.value > this.min - 1) {
      this.dragEndCallback.emit(this.relative ? this.value - this.relativeValue : this.value);
    }
    this.value = this.min - 1;
    this.relativeValue = -1;
    this.draggingTimeout = setTimeout(() => {
      document.body.classList.remove('dragging');
      this.draggingTimeout = null;
      this.inputCount = 0;
    }, 200);
    this.elementRef.nativeElement.classList.remove('dragging');
    this.elementRef.nativeElement.firstChild.classList.remove('dragging');
    this.inputEvent = false;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  input(event: any) {
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

  emitClickBehind(x: number, y: number) {
    if (!this.timeout) {
      let elements = document.elementsFromPoint(x, y);
      if (elements.length > 2 && elements[0].classList.contains('drag-value-input')) {
        (elements[2] as HTMLElement).click();
      }
      this.timeout = setTimeout(() => {
        clearTimeout(this.timeout);
        this.timeout = null;
      }, 100)
    }
  }
}