import { Component, Directive, ElementRef, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
  selector: 'ghs-drag-value',
  templateUrl: './drag.html',
  styleUrls: [ './drag.scss' ]
})
export class DragValueComponent implements OnInit {

  @Output('dragMove') dragMoveCallback = new EventEmitter<number>();
  @Output('dragEnd') dragEndCallback = new EventEmitter<number>();

  inputCount: number = 0;
  draggingTimeout: any;
  touchX: number = 0;
  touchY: number = 0;

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.elementRef.nativeElement.addEventListener('click', this.click);
  }

  click(event: any) {
    if (this.inputCount < 2) {
      this.clickBehind(event.clientX, event.clientY);
    }
  }

  clickBehind(x: number, y: number) {
    let elements = document.elementsFromPoint(x, y);
    if (elements.length > 2 && elements[ 0 ].classList.contains('drag-value-input')) {
      (elements[ 2 ] as HTMLElement).click();
    }
  }

  touchstart(event: any) {
    if (event.touches.length > 0) {
      this.touchX = event.touches[ 0 ].clientX;
      this.touchY = event.touches[ 0 ].clientY;
    }
  }

  touchend(event: any) {
    if (this.inputCount < 2 && this.touchX > 0 && this.touchY > 0) {
      this.clickBehind(this.touchX, this.touchY);
      this.touchX = 0;
      this.touchY = 0;
      this.inputCount = 0;
    }
  }

  change(event: any) {
    if (this.inputCount > 1) {
      this.dragEndCallback.emit(event.target.value);
      if (this.draggingTimeout) {
        clearTimeout(this.draggingTimeout);
      }
      this.draggingTimeout = setTimeout(() => {
        document.body.classList.remove('dragging');
      }, 200);
      this.elementRef.nativeElement.classList.remove('dragging');
      this.elementRef.nativeElement.firstChild.classList.remove('dragging');
    }
    this.inputCount = 0;
  }

  input(event: any) {
    this.inputCount++;
    if (this.inputCount == 2) {
      document.body.classList.add('dragging');
      this.elementRef.nativeElement.classList.add('dragging');
      this.elementRef.nativeElement.firstChild.classList.add('dragging');
    }

    if (this.inputCount > 2) {
      this.dragMoveCallback.emit(event.target.value);
    }
  }

}