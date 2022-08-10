import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { ghsUnit } from "../helper/Static";


@Component({
  template: '',
  styleUrls: [ './dialog.scss' ]
})
export class DialogComponent implements OnInit {

  @ViewChild('button', { static: true }) button!: ElementRef;
  @ViewChild('dialog', { static: true }) dialog!: ElementRef;
  @ViewChild('highlight', { static: true }) highlight!: ElementRef;

  @Input() left: boolean = false;
  @Input() clone: boolean = false;

  dialogBackdrop!: HTMLElement | null;

  opened: boolean = false;


  ngOnInit(): void {
    this.dialog.nativeElement.classList.add('dialog');

    if (this.dialog.nativeElement.parentElement) {
      this.dialog.nativeElement.parentElement.removeChild(this.dialog.nativeElement);
    }

    this.button.nativeElement.addEventListener('click', (event: Event) => {
      this.toggle();
    });
  }

  toggle(): void {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    this.opened = true;
    this.dialogBackdrop = window.document.createElement("div");
    this.dialogBackdrop.classList.add('dialog-backdrop');
    this.dialogBackdrop.addEventListener('click', (event: Event) => {
      if (event.target == this.dialogBackdrop) {
        this.close();
      }
    });


    document.body.appendChild(this.dialogBackdrop);
    document.body.appendChild(this.dialog.nativeElement);

    this.dialog.nativeElement.classList.add('opened');
    this.button.nativeElement.classList.add('active-button');
    if (this.highlight) {
      this.highlight.nativeElement.classList.add('highlight');
    }

    this.setDialogPosition();

    if (this.clone) {
      const buttonRect: DOMRect = this.button.nativeElement.getBoundingClientRect();
      let buttonClone = this.button.nativeElement.cloneNode(true);
      buttonClone.classList.add('active-outline');
      buttonClone.style.position = 'absolute';
      buttonClone.style.left = buttonRect.left + 'px';
      buttonClone.style.right = buttonRect.right + 'px';
      buttonClone.style.top = buttonRect.top + 'px';
      buttonClone.style.bottom = buttonRect.bottom + 'px';
      buttonClone.style.width = buttonRect.width + 'px';
      buttonClone.style.height = buttonRect.height + 'px';
      buttonClone.style.margin = '0';
      buttonClone.addEventListener('click', () => {
        this.close();
      })
      this.dialogBackdrop.appendChild(buttonClone);
    }
  }

  setDialogPosition() {
    const unit = ghsUnit();
    const buttonRect: DOMRect = this.button.nativeElement.getBoundingClientRect();
    const dialogRect: DOMRect = this.dialog.nativeElement.getBoundingClientRect();

    let left: number = (buttonRect.x + buttonRect.width + (unit * 1));

    if (this.left || (left + dialogRect.width > window.innerWidth - unit * 1.5)) {
      this.dialog.nativeElement.classList.add('left');
      this.button.nativeElement.classList.add('left');
      left = (buttonRect.x - dialogRect.width - (unit * 1));
    }

    if (left < unit * 1.5) {
      left = unit * 1.5;
    }

    this.dialog.nativeElement.style.left = left + 'px';

    let top: number = buttonRect.y + (buttonRect.height / 2) - unit * 4.5;
    if (top + dialogRect.height > window.innerHeight - unit * 1.5) {
      top = window.innerHeight - dialogRect.height - unit * 1.5;
    }

    if (top < unit * 1.5) {
      top = unit * 1.5;
    }

    this.dialog.nativeElement.style.top = top + 'px';
  }

  close(): void {
    this.opened = false;

    if (this.dialogBackdrop) {
      this.dialog.nativeElement.parentElement.removeChild(this.dialogBackdrop);
      this.dialogBackdrop = null;
    }
    this.dialog.nativeElement.classList.remove('opened');
    this.button.nativeElement.classList.remove('active-button');
    if (this.highlight) {
      this.highlight.nativeElement.classList.remove('highlight');
    }
    if (this.dialog.nativeElement.parentElement) {
      this.dialog.nativeElement.parentElement.removeChild(this.dialog.nativeElement);
    }
  }
}