import { Component, Directive, ElementRef, Input, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { GhsManager } from "src/app/game/businesslogic/GhsManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ConditionName, ConditionType, EntityCondition } from "src/app/game/model/data/Condition";
import { Entity } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";

@Component({
  standalone: false,
  selector: 'ghs-highlight-conditions',
  templateUrl: './highlight.html',
  styleUrls: ['./highlight.scss']
})
export class HighlightConditionsComponent implements OnInit, OnDestroy {

  @Input() entity!: Entity;
  @Input() figure!: Figure;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  ConditionType = ConditionType;
  highlightedConditions: EntityCondition[] = [];

  constructor(private ghsManager: GhsManager) { }

  ngOnInit(): void {
    this.update();
    this.uiChangeSubscription = this.ghsManager.onUiChange().subscribe({
      next: () => {
        this.update();
      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update() {
    this.highlightedConditions = gameManager.entityManager.highlightedConditions(this.entity);
  }

  applyCondition(name: ConditionName, event: any, double: boolean = false) {
    event.stopPropagation();
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.figure, "applyCondition"), name);
    gameManager.entityManager.applyCondition(this.entity, this.figure, name);
    if (double) {
      gameManager.entityManager.applyCondition(this.entity, this.figure, name);
    }

    this.after();
  }

  declineApplyCondition(name: ConditionName, event: any) {
    event.stopPropagation();
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.figure, "declineApplyCondition"), name);
    gameManager.entityManager.declineApplyCondition(this.entity, this.figure, name)
    this.after();
  }

  after() {
    gameManager.entityManager.checkHealth(this.entity, this.figure);
    if (this.figure instanceof Monster && this.entity instanceof MonsterEntity && this.entity.dead && (this.entity.entityConditions.length == 0 || this.entity.entityConditions.every((entityCondition) => !entityCondition.highlight || !entityCondition.types.includes(ConditionType.turn) && !entityCondition.types.includes(ConditionType.apply)))) {
      setTimeout(() => {
        if (this.figure instanceof Monster && this.entity instanceof MonsterEntity) {
          gameManager.monsterManager.removeMonsterEntity(this.figure, this.entity);
          if (this.figure.entities.every((monsterEntity) => !gameManager.entityManager.isAlive(monsterEntity))) {
            if (this.figure.active) {
              gameManager.roundManager.toggleFigure(this.figure);
            }
          }
        }
        gameManager.stateManager.after();
      }, settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0);
    } else {
      gameManager.stateManager.after();
    }
  }
}

@Directive({
  standalone: false,
  selector: '[conditionHighlight]'
})
export class ConditionHighlightAnimationDirective implements OnInit, OnDestroy {


  @Input('conditionHighlight') condition!: EntityCondition;

  constructor(private el: ElementRef, private ghsManager: GhsManager) { }

  ngOnInit(): void {
    this.uiChangeSubscription = this.ghsManager.onUiChange().subscribe({
      next: () => {
        if (this.condition.highlight && !this.condition.expired && (!settingsManager.settings.applyConditions || !settingsManager.settings.activeApplyConditions || settingsManager.settings.activeApplyConditionsExcludes.includes(this.condition.name))) {
          this.playAnimation();
        }
      }
    })

    this.playAnimation();
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  playAnimation() {
    this.el.nativeElement.classList.add("animation");
    setTimeout(() => {
      this.el.nativeElement.classList.remove("animation");
      if (this.condition.types.includes(ConditionType.turn) || !settingsManager.settings.applyConditions || !settingsManager.settings.activeApplyConditions || settingsManager.settings.activeApplyConditionsExcludes.includes(this.condition.name)) {
        this.condition.highlight = false;
        gameManager.stateManager.saveLocal();
      }
    }, settingsManager.settings.animations ? 1100 * settingsManager.settings.animationSpeed : 0);
  }

}