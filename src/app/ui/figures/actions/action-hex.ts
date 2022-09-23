import { Component, Input, OnChanges } from "@angular/core";
import { ActionHex } from "src/app/game/model/Action";

@Component({
  selector: 'ghs-action-hex',
  templateUrl: './action-hex.html',
  styleUrls: [ './action-hex.scss' ]
})
export class ActionHexComponent implements OnChanges {

  @Input() value!: string;
  @Input() size!: number;
  hexes: ActionHex[] = [];
  ActionHex = ActionHex;

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