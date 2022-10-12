import { Component, EventEmitter, Input, OnChanges, Output } from "@angular/core";
import { ActionHex } from "src/app/game/model/Action";

@Component({
  selector: 'ghs-action-hex',
  templateUrl: './action-hex.html',
  styleUrls: ['./action-hex.scss']
})
export class ActionHexComponent implements OnChanges {

  @Input() value!: string;
  @Input() size!: number;
  @Output() clickCallback: EventEmitter<ActionHex> = new EventEmitter<ActionHex>();
  @Output() doubleclickCallback: EventEmitter<ActionHex> = new EventEmitter<ActionHex>();
  hexes: ActionHex[] = [];
  ActionHex = ActionHex;

  doubleClick: any = null;

  ngOnChanges(changes: any) {
    this.hexes = [];
    this.value.split('|').forEach((hexValue) => {
      const hex: ActionHex | null = ActionHex.fromString(hexValue);
      if (hex != null) {
        this.hexes.push(hex);
      }
    })
  }

  click(hex: ActionHex) {
    if (this.doubleClick) {
      clearTimeout(this.doubleClick);
      this.doubleClick = null;
      this.doubleclickCallback.emit(hex);
    } else {
      this.doubleClick = setTimeout(() => {
        if (this.doubleClick) {
          this.clickCallback.emit(hex);
          this.doubleClick = null;
        }
      }, 200)
    }
  }

}