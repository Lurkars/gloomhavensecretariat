import { Component, Directive, ElementRef, Input, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Condition, ConditionName, ConditionType, EntityCondition } from "src/app/game/model/Condition";
import { Entity } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";

@Component({
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
    gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.figure, "applyCondition"), "game.condition." + name);
    gameManager.entityManager.applyCondition(this.entity, name);
    if (double) {
      gameManager.entityManager.applyCondition(this.entity, name);
    }
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
        gameManager.stateManager.saveLocal();
      }
    }, settingsManager.settings.disableAnimations ? 0 : 1100);
  }

}