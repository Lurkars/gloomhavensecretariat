import { Component, Directive, ElementRef, Input, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
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
export class HighlightConditionsComponent {

  @Input() entity!: Entity;
  @Input() figure!: Figure;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  ConditionType = ConditionType;

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
    if (this.figure instanceof Monster && this.entity instanceof MonsterEntity && this.entity.dead && (this.entity.entityConditions.length == 0 || this.entity.entityConditions.every((entityCondition) => !entityCondition.highlight || entityCondition.types.indexOf(ConditionType.turn) == -1 && entityCondition.types.indexOf(ConditionType.apply) == -1))) {
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
      }, !settingsManager.settings.animations ? 0 : 1500);
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

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        if (this.condition.highlight && !this.condition.expired &&(!settingsManager.settings.applyConditions || !settingsManager.settings.activeApplyConditions || settingsManager.settings.activeApplyConditionsExcludes.indexOf(this.condition.name) != -1)) {
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
      if (this.condition.types.indexOf(ConditionType.turn) != -1 || !settingsManager.settings.applyConditions || !settingsManager.settings.activeApplyConditions || settingsManager.settings.activeApplyConditionsExcludes.indexOf(this.condition.name) != -1) {
        this.condition.highlight = false;
        gameManager.stateManager.saveLocal();
      }
    }, !settingsManager.settings.animations ? 0 : 1100);
  }

}