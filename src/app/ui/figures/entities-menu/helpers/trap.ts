import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Entity } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Summon } from 'src/app/game/model/Summon';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import {
  TrapApplyDialogComponent,
  TrapApplyTarget,
  trapTargetLabel
} from 'src/app/ui/figures/entities-menu/trap-apply-dialog/trap-apply-dialog';
import { ghsDialogClosingHelper, ghsRemoveDeadEntities, ghsValueSign } from 'src/app/ui/helper/Static';

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
    if (!(figure instanceof Character) || !gameManager.summonManager.canApplyTrap(figure, summon, targetEntity, targetFigure)) {
      return;
    }
    const targetName = trapTargetLabel(targetEntity, targetFigure);

    this.component.before('applyTrap', targetName);

    gameManager.summonManager.applyTrap(
      figure,
      summon,
      targetEntity,
      targetFigure,
      this.component.entityConditions,
      this.component.trapDamage,
      this.component.trapHeal
    );
    this.component.trapDamage = 0;
    this.component.trapHeal = 0;

    ghsRemoveDeadEntities([{ entity: summon, figure }]);
    gameManager.stateManager.after();

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
