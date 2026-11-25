import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { SummonState } from 'src/app/game/model/Summon';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { MonsterNumberPickerDialog } from 'src/app/ui/figures/monster/dialogs/numberpicker-dialog';
import { ghsDefaultDialogPositions, ghsDialogClosingHelper, ghsRemoveDeadEntities } from 'src/app/ui/helper/Static';

export class MonsterHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  update() {
    this.component.isMonster = !!this.component.figure && gameManager.attackModifierManager.isMonsterDeck(this.component.figure);

    if (
      gameManager.buildingsManager.petsEnabled &&
      this.component.entity instanceof MonsterEntity &&
      this.component.figure instanceof Monster &&
      this.component.figure.pet
    ) {
      this.component.catching = true;
      this.component.catchingDisabled = !gameManager.monsterManager.petCaptureCharacter();
    }

    if (this.component.figure instanceof Monster && this.component.entity instanceof MonsterEntity) {
      this.component.actionHints = gameManager.actionsManager
        .calcActionHints(this.component.figure, this.component.entity)
        .map(
          (actionHint) =>
            new Action(
              actionHint.type,
              actionHint.value,
              ActionValueType.fixed,
              actionHint.range ? [new Action(ActionType.range, actionHint.range, ActionValueType.fixed, [], true)] : []
            )
        );
    }
  }

  toggleType() {
    if (this.component.figure instanceof Monster) {
      const monster = this.component.figure;
      if (
        this.component.entities.some(
          (entity) => entity instanceof MonsterEntity && (entity.type === MonsterType.normal || entity.type === MonsterType.elite)
        )
      ) {
        this.component.before('toggleType');
        this.component.entities.forEach((entity) => {
          if (this.component.figure && gameManager.entityManager.isAlive(entity) && entity instanceof MonsterEntity) {
            gameManager.monsterManager.changeType(entity, monster);
          }
        });
        gameManager.stateManager.after();
      }
    }
  }

  toggleSummon() {
    if (this.component.entity instanceof MonsterEntity) {
      let summonState = SummonState.false;
      if (this.component.entity.summon === SummonState.false) {
        summonState = SummonState.new;
      } else if (this.component.entity.summon === SummonState.new) {
        summonState = SummonState.true;
      }

      this.component.before('setSummonState', summonState);
      gameManager.monsterManager.setSummonState(this.component.entity, summonState);
      gameManager.stateManager.after();
    }
  }

  changeMonsterEntity() {
    if (this.component.figure instanceof Monster && this.component.entity instanceof MonsterEntity) {
      if (gameManager.monsterManager.monsterStandeeMax(this.component.figure) > 1 || this.component.entity.type !== MonsterType.boss) {
        this.component.dialog.open(MonsterNumberPickerDialog, {
          panelClass: ['dialog'],
          data: {
            monster: this.component.figure,
            entity: this.component.entity,
            change: true
          },
          positionStrategy: this.component.overlay
            .position()
            .flexibleConnectedTo(this.component.data.positionElement)
            .withPositions(ghsDefaultDialogPositions())
        });
        ghsDialogClosingHelper(this.component.dialogRef, false);
      }
    }
  }

  catchMonster(force: boolean = false) {
    if (
      this.component.figure instanceof Monster &&
      this.component.entity instanceof MonsterEntity &&
      this.component.catching &&
      (!this.component.catchingDisabled || force)
    ) {
      gameManager.stateManager.before(
        'buildings.stables.pets.catch',
        'data.monster.' + this.component.figure.name,
        '%game.monsterType.' + this.component.entity.type + '%',
        '%game.monsterType.' + this.component.entity.type + '.' + this.component.entity.number + '%'
      );

      gameManager.monsterManager.catchMonster(this.component.figure, this.component.entity, force);

      ghsRemoveDeadEntities([{ entity: this.component.entity, figure: this.component.figure }]);
      gameManager.stateManager.after();
      ghsDialogClosingHelper(this.component.dialogRef, true);
    }
  }
}
