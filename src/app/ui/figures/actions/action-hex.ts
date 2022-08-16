import { AfterViewChecked, Component, ElementRef, Input, OnChanges } from "@angular/core";
import { ActionHex } from "src/app/game/model/Action";

@Component({
  selector: 'ghs-action-hex',
  templateUrl: './action-hex.html',
  styleUrls: [ './action-hex.scss' ]
})
export class ActionHexComponent implements OnChanges, AfterViewChecked {

  @Input() value!: string;
  @Input() size!: number;
  hexes: ActionHex[] = [];
  ActionHex = ActionHex;

  constructor(private elem: ElementRef) { }

  ngAfterViewChecked(): void {
    let parent = this.elem.nativeElement.parentNode;
    let body: boolean = false;

    while ((parent.localName != 'ghs-actions' || parent.classList.contains('subactions')) && !body) {
      parent = parent.parentNode;
      if (!parent || parent.localName == 'body') {
        body = true;
      }
    }

    if (!body) {
      const parentRect = parent.getBoundingClientRect();
      const rect = this.elem.nativeElement.getBoundingClientRect();
      if (parentRect.top > rect.top) {
        this.elem.nativeElement.style.top = (parentRect.top - rect.top + 1) + "px";
      }
    }
  }

  checkOverflow() {
  }

  ngOnChanges(changes: any) {
    this.hexes = [];
    this.value.split('|').forEach((hexValue) => {
      const hex: ActionHex | null = ActionHex.fromString(hexValue);
      if (hex != null) {
        this.hexes.push(hex);
      }
    })
  }

}