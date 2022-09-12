import { Component, Directive, ElementRef, Input, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Condition, ConditionName, ConditionType, EntityCondition } from "src/app/game/model/Condition";
import { Entity } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";

@Component({
  selector: 'ghs-conditions',
  templateUrl: './conditions.html',
  styleUrls: [ './conditions.scss' ]
})
export class ConditionsComponent implements OnInit {

  @Input() entity!: Entity;
  @Input() figure!: Figure;
  @Input() type!: string;
  @Input() columns: number = 3;

  gameManager: GameManager = gameManager;

  standardNegative: Condition[] = [];
  upgradeNegative: Condition[] = [];
  stackNegative: Condition[] = [];
  standardPositive: Condition[] = [];
  upgradePositive: Condition[] = [];
  stackPositive: Condition[] = [];

  constructor() {
    gameManager.uiChange.subscribe({
      next: () => {
        this.initializeConditions();
      }
    })
  }

  ngOnInit(): void {
    this.initializeConditions();
  }

  initializeConditions() {
    this.standardNegative = gameManager.conditionsForTypes('standard', 'negative', this.type);
    this.upgradeNegative = gameManager.conditionsForTypes('upgrade', 'negative', this.type);
    this.stackNegative = gameManager.conditionsForTypes('stack', 'negative', this.type);
    this.standardPositive = gameManager.conditionsForTypes('standard', 'positive', this.type);
    this.upgradePositive = gameManager.conditionsForTypes('upgrade', 'positive', this.type);
    this.stackPositive = gameManager.conditionsForTypes('stack', 'positive', this.type);
  }

  hasCondition(condition: Condition) {
    return gameManager.entityManager.hasCondition(this.entity, condition);
  }

  isImmune(conditionName: ConditionName) {

    if (!(this.figure instanceof Monster)) {
      return false;
    }

    if (!(this.entity instanceof MonsterEntity)) {
      return false;
    }

    return gameManager.entityManager.isImmune(this.figure, this.entity, conditionName);
  }

  inc(condition: Condition) {
    condition.value = this.getValue(condition) + 1;
    this.checkUpdate(condition);
  }

  dec(condition: Condition) {
    condition.value = this.getValue(condition) - 1;
    if (condition.value < 1) {
      condition.value = 1;
    }
    this.checkUpdate(condition);
  }

  getValue(condition: Condition): number {
    const entityCondition = this.entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);

    if (entityCondition) {
      return entityCondition.value;
    }

    return condition.value;
  }

  checkUpdate(condition: Condition) {
    const entityCondition = this.entity.entityConditions.find((entityCondition) => entityCondition.name == condition.name && !entityCondition.expired);
    if (entityCondition) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.figure, "setConditionValue"), "game.condition." + condition.name, "" + condition.value);
      entityCondition.value = condition.value;
      gameManager.stateManager.after();
    }
  }

  toggleCondition(condition: Condition) {
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.figure, this.hasCondition(condition) ? "removeCondition" : "addCondition"), "game.condition." + condition.name);
    gameManager.entityManager.toggleCondition(this.entity, condition, this.figure.active, this.figure.off);
    gameManager.stateManager.after();
  }
}


@Component({
  selector: 'ghs-highlight-conditions',
  templateUrl: './highlight.html',
  styleUrls: [ './highlight.scss' ]
})
export class HighlightConditionsComponent {

  @Input() entity!: Entity;
  @Input() figure!: Figure;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  ConditionType = ConditionType;

  applyCondition(name: ConditionName, event: any) {
    event.stopPropagation();
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.figure, "applyCondition"), "game.condition." + name);
    gameManager.entityManager.applyCondition(this.entity, name)
    gameManager.stateManager.after();
  }

  declineApplyCondition(name: ConditionName, event: any) {
    event.stopPropagation();
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.figure, "declineApplyCondition"), "game.condition." + name);
    gameManager.entityManager.declineApplyCondition(this.entity, name)
    gameManager.stateManager.after();
  }
}

@Directive({
  selector: '[conditionHighlight]'
})
export class ConditionHighlightAnimationDirective implements OnInit {


  @Input('conditionHighlight') condition!: EntityCondition;

  constructor(private el: ElementRef) { }

  ngOnInit(): void {

    gameManager.uiChange.subscribe({
      next: () => {
        if (this.condition.highlight && !settingsManager.settings.activeApplyConditions) {
          this.playAnimation();
        }
      }
    })

    this.playAnimation();
  }

  playAnimation() {
    this.el.nativeElement.classList.add("animation");
    setTimeout(() => {
      this.el.nativeElement.classList.remove("animation");
      if (this.condition.types.indexOf(ConditionType.turn) != -1 || !settingsManager.settings.activeApplyConditions) {
        this.condition.highlight = false;
        gameManager.stateManager.after();
      }
    }, 1100);
  }

}