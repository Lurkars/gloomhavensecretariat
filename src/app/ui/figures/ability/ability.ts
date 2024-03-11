import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Monster } from "src/app/game/model/Monster";
import { Ability } from "src/app/game/model/data/Ability";
import { Action, ActionType } from "src/app/game/model/data/Action";
import { applyPlaceholder } from "../../helper/label";


@Component({
  selector: 'ghs-ability',
  templateUrl: './ability.html',
  styleUrls: ['./ability.scss']
})
export class AbilityComponent implements OnInit, OnDestroy, OnChanges {

  @Input() ability: Ability | undefined;
  @Input() abilities!: Ability[];
  @Input() monster: Monster | undefined;
  @Input() character: Character | undefined;
  @Input() flipped: boolean = false;
  @Input() reveal: boolean = false;
  @Input() relative: boolean = false;
  @Input() interactiveAbilities: boolean = false;
  @Input() statsCalculation: boolean = true;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  abilityIndex: number = -1;
  abilityLabel: string = "";
  interactiveActions: Action[] = [];

  ngOnInit() {
    this.update();
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.update();
      }
    });
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.update();
  }

  update() {
    this.abilityIndex = -1;
    this.abilityLabel = "";
    if (this.ability) {
      this.abilityIndex = this.getAbilityIndex(this.ability);
      this.abilityLabel = this.getAbilityLabel(this.ability);
      this.calcInteractiveActions(this.ability.actions);
    }
  }

  getAbilityIndex(ability: Ability): number {
    if (this.abilities && this.abilities.length > 0) {
      return this.abilities.indexOf(ability);
    } else if (this.monster) {
      return gameManager.abilities(this.monster).indexOf(ability);
    }
    return -1;
  }

  getAbilityLabel(ability: Ability): string {
    let label = ability.name || "";

    if (label) {
      label = 'data.ability.' + label;
    } else if (this.monster && this.monster.deck && this.monster.deck != this.monster.name) {
      label = 'data.deck.' + this.monster.deck;
      if (label.split('.')[label.split('.').length - 1] === applyPlaceholder(settingsManager.getLabel(label)) && this.monster.deck) {
        label = 'data.monster.' + this.monster.deck;
      }
    } else if (this.monster) {
      label = 'data.monster.' + this.monster.name;
    }

    return applyPlaceholder(settingsManager.getLabel(label));
  }

  onChange(revealed: boolean) {
    if (this.ability) {
      this.ability.revealed = revealed;
    }
  }

  calcInteractiveActions(actions: Action[], index: string = "") {
    if (!index) {
      this.interactiveActions = [];
    }

    actions.forEach((action, i) => {
      if (this.isIntactiveAction(action, (index ? index + '.' : '') + i)) {
        this.interactiveActions.push(action);
      } else if (action.subActions && action.subActions.length) {
        this.calcInteractiveActions(action.subActions, (index ? index + '.' : '') + i);
      }
    })

  }

  isIntactiveAction(action: Action, index: string): boolean {
    const actionTag = 'roundAction-' + index + '-' + action.type;
    if (this.monster &&
      (this.isInteractiveHealAction(action) ||
        this.isInteractiveConditionAction(action) ||
        this.isIntactiveElementAction(action) ||
        action.type == ActionType.sufferDamage ||
        action.type == ActionType.switchType)) {
      if (action.type == ActionType.heal && this.monster.entities.every((entity) => entity.dead || entity.health < 1 || entity.health >= entity.maxHealth)) {
        return false;
      }

      return this.interactiveAbilities && (this.monster.active && this.monster && this.monster.entities.find((entity) => action && gameManager.entityManager.isAlive(entity, true) && !entity.tags.find((tag) => tag == actionTag)) != undefined || false);
    }
    return false;
  }

  isInteractiveHealAction(action: Action): boolean {
    return action.type == ActionType.heal && action.subActions && action.subActions.length == 1 && action.subActions.find((subAction) => subAction.type == ActionType.specialTarget && ('' + subAction.value).startsWith('self')) != undefined;
  }

  isInteractiveConditionAction(action: Action): boolean {
    return action.type == ActionType.condition && action.subActions && action.subActions.length == 1 && action.subActions.find((subAction) => subAction.type == ActionType.specialTarget && ('' + subAction.value).startsWith('self')) != undefined;
  }

  isIntactiveElementAction(action: Action): boolean {
    return false;
  }
}