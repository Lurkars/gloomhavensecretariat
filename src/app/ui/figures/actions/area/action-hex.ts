import { Component, EventEmitter, Input, OnChanges, Output } from "@angular/core";
import { ActionHex, ActionHexFromString, ActionHexToString, ActionHexType } from "src/app/game/model/ActionHex";
import { Character } from "src/app/game/model/Character";
import { Action } from "src/app/game/model/data/Action";
import { ConditionName } from "src/app/game/model/data/Condition";

@Component({
  standalone: false,
  selector: 'ghs-action-hex',
  templateUrl: './action-hex.html',
  styleUrls: ['./action-hex.scss']
})
export class ActionHexComponent implements OnChanges {

  @Input() action!: Action;
  @Input() value!: string;
  @Input() size!: number;
  @Input('index') actionIndex: string = "";
  @Input('cardId') cardId: number | undefined;
  @Input('character') character: Character | undefined;
  @Output() clickCallback: EventEmitter<ActionHex> = new EventEmitter<ActionHex>();
  @Output() doubleclickCallback: EventEmitter<ActionHex> = new EventEmitter<ActionHex>();
  hexes: ActionHex[] = [];
  enhanceHexes: ActionHex[] = [];
  enhancedHexes: ActionHex[] = [];
  edit: boolean = false;
  editMode: boolean = false;
  ActionHex = ActionHex;
  ActionHexToString = ActionHexToString;

  doubleClick: any = null;

  ngOnChanges(changes: any) {
    this.hexes = [];
    this.enhanceHexes = [];
    this.enhancedHexes = [];
    if (!this.value) {
      this.value = '' + this.action.value;
    }
    this.value.split('|').forEach((hexValue) => {
      const hex: ActionHex | null = ActionHexFromString(hexValue);
      if (hex != null) {
        this.hexes.push(hex);
        if (hex.type == ActionHexType.enhance) {
          this.enhanceHexes.push(hex);
          if (this.character && this.cardId && this.actionIndex && this.character.progress.enhancements && this.character.progress.enhancements.find((e) => e.cardId == this.cardId && e.actionIndex == this.actionIndex && e.index == this.enhanceHexes.length - 1 && e.action == 'hex')) {
            this.enhancedHexes.push(hex);
          }
        }
        if (hex.type == ActionHexType.invisible) {
          this.editMode = true;
        }
      }
    })

    this.edit = this.character && this.character.tags.indexOf('edit-abilities') != -1 || false;
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

  hasCondition(hex: ActionHex): boolean {
    return hex.value && Object.keys(ConditionName).includes(hex.value) || false;
  }

}