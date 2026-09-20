import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Entity } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon, SummonColor } from 'src/app/game/model/Summon';
import { applyPlaceholder, GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

export class TrapApplyTarget {
  constructor(
    public entity: Entity,
    public figure: Figure
  ) {}
}

export function trapTargetType(entity: Entity): 'character' | 'monsterEntity' | 'objectiveEntity' | 'summon' {
  if (entity instanceof Character) {
    return 'character';
  } else if (entity instanceof MonsterEntity) {
    return 'monsterEntity';
  } else if (entity instanceof ObjectiveEntity) {
    return 'objectiveEntity';
  }
  return 'summon';
}

export function trapTargetArgs(entity: Entity, figure: Figure): (string | number | boolean)[] {
  const titleInfo = gameManager.entityManager.titleInfo(entity, figure);
  if (entity instanceof MonsterEntity) {
    return [...titleInfo, entity.type];
  }
  return titleInfo;
}

export function trapTargetLabel(entity: Entity, figure: Figure): string {
  return applyPlaceholder(
    settingsManager.getLabel(
      'entities.title.' + trapTargetType(entity),
      trapTargetArgs(entity, figure).map((value) => '' + value)
    )
  );
}

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, TabClickDirective, TrackUUIDPipe],
  selector: 'ghs-trap-apply-dialog',
  templateUrl: './trap-apply-dialog.html',
  styleUrls: ['../entities-menu-dialog.scss', './trap-apply-dialog.scss']
})
export class TrapApplyDialogComponent {
  dialogRef = inject(DialogRef);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  SummonColor = SummonColor;

  selected: TrapApplyTarget | undefined;
  figures: Figure[] = [];
  summon: Summon;
  figure: Figure;

  data: { summon: Summon; figure: Figure } = inject(DIALOG_DATA);

  constructor() {
    this.summon = this.data.summon;
    this.figure = this.data.figure;

    this.figures = gameManager.game.figures.filter((figure) => {
      if (figure instanceof Character) {
        return !figure.absent;
      } else if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
        return figure.entities.some((entity) => !entity.dead);
      }
      return false;
    });

    const activeFigure = gameManager.game.figures.find((figure) => figure.active);
    if (activeFigure instanceof Character && !activeFigure.absent) {
      this.selected = new TrapApplyTarget(activeFigure, activeFigure);
    } else if (activeFigure instanceof Monster) {
      const activeEntity = activeFigure.entities
        .filter((entity) => entity.active && !entity.dead)
        .sort(gameManager.monsterManager.sortEntities)[0];
      if (activeEntity) {
        this.selected = new TrapApplyTarget(activeEntity, activeFigure);
      }
    }
  }

  summons(figure: Character): Summon[] {
    return figure.summons.filter((summon) => !summon.dead && !summon.trap);
  }

  entities(figure: Monster | ObjectiveContainer): Entity[] {
    return figure.entities.filter((entity) => !entity.dead);
  }

  targetType(entity: Entity): string {
    return trapTargetType(entity);
  }

  targetArgs(entity: Entity, figure: Figure): (string | number | boolean)[] {
    return trapTargetArgs(entity, figure);
  }

  select(entity: Entity, figure: Figure) {
    this.selected = this.selected && this.selected.entity === entity ? undefined : new TrapApplyTarget(entity, figure);
  }

  close(result: TrapApplyTarget | undefined = undefined) {
    ghsDialogClosingHelper(this.dialogRef, result);
  }
}
