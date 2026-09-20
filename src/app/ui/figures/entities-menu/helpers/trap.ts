import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Condition } from 'src/app/game/model/data/Condition';
import { Entity } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Summon } from 'src/app/game/model/Summon';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import {
  TrapApplyDialogComponent,
  TrapApplyTarget,
  trapTargetLabel
} from 'src/app/ui/figures/entities-menu/trap-apply-dialog/trap-apply-dialog';
import { ghsDialogClosingHelper, ghsValueSign } from 'src/app/ui/helper/Static';

export class TrapHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  changeTrapDamage(value: number) {
    if (this.component.entity instanceof Summon) {
      this.component.trapDamage += value;
      if (this.component.entity.movement + this.component.trapDamage < 0) {
        this.component.trapDamage = -this.component.entity.movement;
      }
    }
  }

  changeTrapHeal(value: number) {
    if (this.component.entity instanceof Summon && this.component.entity.attack !== 'X') {
      this.component.trapHeal += value;
      if (+this.component.entity.attack + this.component.trapHeal < 0) {
        this.component.trapHeal = -+this.component.entity.attack;
      }
    }
  }

  applyTrap() {
    if (this.component.entity instanceof Summon && this.component.entity.trap) {
      const summon = this.component.entity;
      const figure = this.component.figureForEntity(summon);
      const dialog = this.component.dialog.open(TrapApplyDialogComponent, {
        panelClass: ['dialog'],
        data: { summon, figure }
      });

      dialog.closed.subscribe({
        next: (result) => {
          if (result instanceof TrapApplyTarget) {
            this.applyTrapEffect(summon, figure, result.entity, result.figure);
          }
        }
      });
    }
  }

  private applyTrapEffect(summon: Summon, figure: Figure, targetEntity: Entity, targetFigure: Figure) {
    const targetName = trapTargetLabel(targetEntity, targetFigure);

    this.component.before('applyTrap', targetName);

    const damage = summon.movement + this.component.trapDamage;
    const heal = summon.attack === 'X' ? 0 : +summon.attack + this.component.trapHeal;
    this.component.trapDamage = 0;
    this.component.trapHeal = 0;

    if (damage) {
      gameManager.entityManager.changeHealth(targetEntity, targetFigure, -damage);
    }

    if (heal) {
      gameManager.entityManager.changeHealth(targetEntity, targetFigure, heal);
    }

    this.component.entityConditions.forEach((entityCondition) => {
      gameManager.entityManager.addCondition(targetEntity, targetFigure, new Condition(entityCondition.name, entityCondition.value));
    });

    summon.dead = true;
    gameManager.triggerUiChange(false);

    setTimeout(
      () => {
        if (figure instanceof Character) {
          gameManager.characterManager.removeSummon(figure, summon);
        }
        gameManager.stateManager.after();
      },
      settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0
    );

    ghsDialogClosingHelper(this.component.dialogRef, true);
  }

  close() {
    if (this.component.entity instanceof Summon && this.component.entity.trap) {
      const summon = this.component.entity;
      const figure = this.component.figureForEntity(summon);
      const summonLabel = summon.title ? summon.title : 'data.summon.' + summon.name;
      const characterName = figure instanceof Character ? gameManager.characterManager.characterName(figure, true, true) : figure.name;

      if (this.component.trapDamage !== 0) {
        this.component.before('changeSummonDamage', characterName, summonLabel, ghsValueSign(this.component.trapDamage));
        summon.movement += this.component.trapDamage;
        this.component.trapDamage = 0;
        gameManager.stateManager.after();
      }

      if (this.component.trapHeal !== 0 && summon.attack !== 'X') {
        this.component.before('changeSummonHeal', characterName, summonLabel, ghsValueSign(this.component.trapHeal));
        summon.attack = +summon.attack + this.component.trapHeal;
        this.component.trapHeal = 0;
        gameManager.stateManager.after();
      }
    }
  }
}
