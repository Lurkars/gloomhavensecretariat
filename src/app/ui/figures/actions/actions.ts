import { Component, Input } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Action, ActionType, ActionValueType } from "src/app/game/model/Action";
import { Monster } from "src/app/game/model/Monster";
import { MonsterType } from "src/app/game/model/MonsterType";

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
  @Input() highlightElements: boolean = false;
  @Input() hexSize!: number;
  @Input() hint!: string | undefined;
  ActionType = ActionType;
  ActionValueType = ActionValueType;
  additionalActions: Action[] = [];
  additionActionTypes: ActionType[] = [ ActionType.shield, ActionType.retaliate, ActionType.heal, ActionType.element, ActionType.elementHalf ];

  ngOnInit(): void {
    this.updateAdditionalActions();
    gameManager.uiChange.subscribe({
      next: () => {
        this.updateAdditionalActions();
      }
    })
  }

  updateAdditionalActions(): void {
    this.additionalActions = [];
    if (settingsManager.settings.calculateStats) {
      const stat = gameManager.monsterManager.getStat(this.monster, this.monster.boss ? MonsterType.boss : MonsterType.normal);
      let eliteStat = this.monster.boss ? undefined : gameManager.monsterManager.getStat(this.monster, MonsterType.elite);

      if (stat.actions) {
        stat.actions.filter((statAction) => this.additionActionTypes.indexOf(statAction.type) != -1).forEach((statAction) => {
          if (!eliteStat || eliteStat.actions && eliteStat.actions.some((eliteAction) => JSON.stringify(statAction) == JSON.stringify(eliteAction))) {
            this.additionalActions.push(JSON.parse(JSON.stringify(statAction)));
          } else if (eliteStat && (!eliteStat.actions || !eliteStat.actions.some((eliteAction) => JSON.stringify(statAction) == JSON.stringify(eliteAction)))) {
            this.additionalActions.push(new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, [ JSON.parse(JSON.stringify(statAction)) ]));
          }
        })
      }

      if (eliteStat) {
        eliteStat.actions.filter((eliteAction) => this.additionActionTypes.indexOf(eliteAction.type) != -1).forEach((eliteAction) => {
          if (!stat.actions || !stat.actions.some((statAction) => JSON.stringify(eliteAction) == JSON.stringify(statAction))) {
            this.additionalActions.push(new Action(ActionType.monsterType, MonsterType.elite, ActionValueType.fixed, [ JSON.parse(JSON.stringify(eliteAction)) ]));
          }
        })
      }

    }
  }

}