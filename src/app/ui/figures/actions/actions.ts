import { Component, Input } from "@angular/core";
import { Action, ActionType, ActionValueType } from "src/app/game/model/Action";
import { Monster } from "src/app/game/model/Monster";

@Component({
  selector: 'ghs-actions',
  templateUrl: './actions.html',
  styleUrls: [ './actions.scss' ]
})
export class ActionsComponent {

  @Input() monster!: Monster;
  @Input() actions!: Action[];
  @Input() relative: boolean = false;
  @Input() inline: boolean = false;
  @Input() right: boolean = false;
  @Input() statsCalculation: boolean = false;
  @Input() hexSize!: number;
  @Input() hint!: string | undefined;
  ActionType = ActionType;
  ActionValueType = ActionValueType;

}