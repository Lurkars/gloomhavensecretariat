import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { ghsUnit } from "src/app/app.component";

@Component({
  template: '',
  styleUrls: [ './popup.scss' ]
})
export class PopupComponent implements OnInit {

  @ViewChild('popup', { static: true }) popup!: ElementRef;
  popupBackdrop!: HTMLElement | null;

  opened: boolean = false;
  @Input() left: boolean = false;


  ngOnInit(): void {
    this.popup.nativeElement.classList.add('popup');

    if (this.popup.nativeElement.parentElement) {
      this.popup.nativeElement.parentElement.removeChild(this.popup.nativeElement);
    }
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
    this.popupBackdrop = window.document.createElement("div");
    this.popupBackdrop.classList.add('popup-backdrop');
    this.popupBackdrop.addEventListener('click', (event: Event) => {
      if (event.target == this.popupBackdrop) {
        this.close();
      }
    });

    document.body.appendChild(this.popupBackdrop);
    document.body.appendChild(this.popup.nativeElement);

    this.popup.nativeElement.classList.add('opened');
  }



  close(): void {
    this.opened = false;

    if (this.popupBackdrop) {
      this.popup.nativeElement.parentElement.removeChild(this.popupBackdrop);
      this.popupBackdrop = null;
    }
    this.popup.nativeElement.classList.remove('opened');
    if (this.popup.nativeElement.parentElement) {
      this.popup.nativeElement.parentElement.removeChild(this.popup.nativeElement);
    }
  }
}