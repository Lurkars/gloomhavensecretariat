import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";

@Component({
  template: '',
  styleUrls: [ './popup.scss' ]
})
export class PopupComponent implements OnInit {

  @Input() left: boolean = false;
  @ViewChild('popup', { static: true }) popup!: ElementRef;
  popupBackdrop!: HTMLElement | null;

  opened: boolean = false;
  doubleClick: any = null;


  ngOnInit(): void {
    this.popup.nativeElement.classList.add('popup');

    let closeBtn = window.document.createElement("span");
    closeBtn.classList.add('close');

    closeBtn.addEventListener('click', () => {
      this.close();
    })

    this.popup.nativeElement.appendChild(closeBtn);

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
    if (!this.opened) {
      if (this.doubleClick) {
        clearTimeout(this.doubleClick);
        this.doubleClick = null;
        this.doubleClickCallback();
      } else {
        this.doubleClick = setTimeout(() => {
          if (this.doubleClick) {
            this.openPopup();
            this.doubleClick = null;
          }
        }, 200)
      }
    }
  }

  doubleClickCallback(): void { }

  openPopup() {
    this.opened = true;
    this.popupBackdrop = window.document.createElement("div");
    this.popupBackdrop.classList.add('popup-backdrop');

    document.body.appendChild(this.popupBackdrop);
    document.body.appendChild(this.popup.nativeElement);

    this.popup.nativeElement.classList.add('opened');

    setTimeout(() => {
      if (this.popupBackdrop) {
        this.popupBackdrop.addEventListener('click', (event: Event) => {
          if (event.target == this.popupBackdrop) {
            this.close();
          }
        });
      }
    }, 200);
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