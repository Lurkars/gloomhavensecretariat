import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { gameManager } from "src/app/game/businesslogic/GameManager";

import { Action, ActionType } from "src/app/game/model/Action";
import { AttackModifier, AttackModifierType, defaultAttackModifier } from "src/app/game/model/AttackModifier";
import { Character } from "src/app/game/model/Character";

@Component({
  selector: 'ghs-attackmodifier',
  templateUrl: './attackmodifier.html',
  styleUrls: [ './attackmodifier.scss' ],
  encapsulation: ViewEncapsulation.None
})
export class AttackModifierComponent implements OnInit {

  @Input() attackModifier!: AttackModifier;
  @Input() characterIcon!: string;
  @Input() numeration: string = "";
  @Input() number: number = 0;
  @Input() reveal: boolean = false;
  @Input() flipped: boolean = false;
  actionClasses: string = "";
  AttackModifierType = AttackModifierType;
  ActionType = ActionType;
  defaultType : boolean = true;

  ngOnInit(): void {
    if (this.attackModifier) {
      if (this.attackModifier.actions) {
        this.attackModifier.actions.forEach((action) => {
          if (action.type != ActionType.heal && action.type != ActionType.shield) {
            this.defaultType = false;
          }

          if (action.type == ActionType.condition || action.type == ActionType.element) {
            this.actionClasses += " " + action.value;
          } else {
            this.actionClasses += " " + action.type;
          }
        })
      }
    }
  }

  onChange(revealed: boolean) {
    this.attackModifier.revealed = revealed;
  }

  getTarget(action: Action): string {
    if (action.subActions) {
      const specialTarget = action.subActions.find((subAction) => subAction.type == ActionType.specialTarget);
      if (specialTarget) {
        return "" + specialTarget.value;
      }
    }
    return "";
  }

}