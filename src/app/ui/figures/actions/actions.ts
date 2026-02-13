import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { InteractiveAction } from "src/app/game/businesslogic/ActionsManager";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { GhsManager } from "src/app/game/businesslogic/GhsManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Monster } from "src/app/game/model/Monster";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";
import { Action, ActionType, ActionValueType } from "src/app/game/model/data/Action";
import { MonsterType } from "src/app/game/model/data/MonsterType";

@Component({
  standalone: false,
  selector: 'ghs-actions',
  templateUrl: './actions.html',
  styleUrls: ['./actions.scss']
})
export class ActionsComponent implements OnInit {

  @Input() monster: Monster | undefined;
  @Input() monsterType: MonsterType | undefined;
  @Input() objective: ObjectiveContainer | undefined;
  @Input() actions!: Action[];
  @Input() relative: boolean = false;
  @Input() inline: boolean = false;
  @Input() textBlack: boolean = false;
  @Input() right: boolean = false;
  @Input() statsCalculation: boolean = false;
  @Input() interactiveAbilities: boolean = false;
  @Input() interactiveActions: InteractiveAction[] = [];
  @Output() interactiveActionsChange = new EventEmitter<InteractiveAction[]>();
  @Input() highlightActions: ActionType[] = [];
  @Input() hexSize!: number;
  @Input('index') actionIndex: string = "";
  @Input() style: 'gh' | 'fh' | false = false;
  @Input() noDivider: boolean = false;
  @Input() character: Character | undefined;
  @Input() cardId: number | undefined;

  divider: boolean[] = [];
  spacing: boolean[] = [];

  settingsManager: SettingsManager = settingsManager;

  ActionType = ActionType;
  ActionValueType = ActionValueType;
  additionalActions: Action[] = [];
  additionActionTypes: ActionType[] = [ActionType.shield, ActionType.retaliate, ActionType.heal, ActionType.element, ActionType.elementHalf];

  constructor(private ghsManager: GhsManager) {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }


  update(): void {
    this.additionalActions = [];
    if (this.monster && settingsManager.settings.calculateStats) {
      const stat = gameManager.monsterManager.getStat(this.monster, this.monster.boss ? MonsterType.boss : MonsterType.normal);
      let eliteStat = this.monster.boss || this.monster.bb ? undefined : gameManager.monsterManager.getStat(this.monster, MonsterType.elite);

      if (stat.actions) {
        stat.actions.filter((statAction) => this.additionActionTypes.includes(statAction.type)).forEach((statAction) => {
          if (!eliteStat || eliteStat.actions && eliteStat.actions.some((eliteAction) => JSON.stringify(statAction) == JSON.stringify(eliteAction))) {
            this.additionalActions.push(JSON.parse(JSON.stringify(statAction)));
          } else if (eliteStat && (!eliteStat.actions || !eliteStat.actions.some((eliteAction) => JSON.stringify(statAction) == JSON.stringify(eliteAction)))) {
            this.additionalActions.push(new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, [JSON.parse(JSON.stringify(statAction))]));
          }
        })
      }

      if (eliteStat) {
        eliteStat.actions.filter((eliteAction) => this.additionActionTypes.includes(eliteAction.type)).forEach((eliteAction) => {
          if (!stat.actions || !stat.actions.some((statAction) => JSON.stringify(eliteAction) == JSON.stringify(statAction))) {
            this.additionalActions.push(new Action(ActionType.monsterType, MonsterType.elite, ActionValueType.fixed, [JSON.parse(JSON.stringify(eliteAction))]));
          }
        })
      }
    }

    if (!this.noDivider && this.actions) {
      this.actions.forEach((action, index) => {
        this.divider[index] = this.calcDivider(action, index);
        this.spacing[index] = this.calcSpacing(action, index);
      })
    }

  }

  calcDivider(action: Action, index: number): boolean {
    if (index < 1 || this.inline || action.noDivider) {
      return false;
    }

    if (((action.type == ActionType.element || action.type == ActionType.elementHalf) && action.valueType != ActionValueType.minus)) {
      return false;
    }

    if (action.type == ActionType.card || action.type == ActionType.hint || action.type == ActionType.round) {
      return false;
    }

    if (this.actions[index - 1].type == ActionType.box) {
      return false;
    }

    if (settingsManager.settings.calculate && this.actions[index - 1].type == ActionType.monsterType && this.monster && !this.monster.entities.find((monsterEntity) => gameManager.entityManager.isAlive(monsterEntity) && monsterEntity.type == this.actions[index - 1].value)) {
      return false;
    }

    if (action.type == ActionType.concatenation && action.subActions.every((subAction) => subAction.type == ActionType.card || subAction.type == ActionType.element || subAction.type == ActionType.elementHalf || subAction.type == ActionType.concatenationSpacer)) {
      return false;
    }

    return true;
  }

  calcSpacing(action: Action, index: number): boolean {
    if (index < 1 || this.inline) {
      return false;
    }

    if (this.actions[index - 1].type == ActionType.box || this.actions[index - 1].type == ActionType.round) {
      return false;
    }

    if (action.type == ActionType.concatenation && action.subActions.every((subAction) => [ActionType.card, ActionType.concatenationSpacer].includes(subAction.type))) {
      return false;
    }

    return true;
  }

  onInteractiveActionsChange(change: InteractiveAction[]) {
    this.interactiveActionsChange.emit(change);
  }

} 