import { Component, ElementRef, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: 'ghs-drag-value',
  templateUrl: './drag.html',
  styleUrls: [ './drag.scss' ]
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
      if (elements.length > 2 && elements[ 0 ].classList.contains('drag-value-input')) {
        (elements[ 2 ] as HTMLElement).click();
      }
      this.clickBehindTimeout = setTimeout(() => {
        clearTimeout(this.clickBehindTimeout);
        this.clickBehindTimeout = null;
      }, 100)
    }
  }

  touchstart(event: any) {
    if (event.touches.length > 0) {
      this.touchX = event.touches[ 0 ].clientX;
      this.touchY = event.touches[ 0 ].clientY;
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
        this.value = Math.min(99, Math.max(0, Math.floor((event.touches[ 0 ].clientX - rect.left) / rect.width * 100)));
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