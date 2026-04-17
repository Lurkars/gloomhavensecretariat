import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { Monster } from 'src/app/game/model/Monster';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsHasSpoilers, ghsIsSpoiled, ghsNotSpoiled, ghsTextSearch } from 'src/app/ui/helper/Static';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, FormsModule, GhsLabelDirective, TabClickDirective, TrackUUIDPipe],
  selector: 'ghs-monster-menu',
  templateUrl: 'monster.html',
  styleUrls: ['../menu.scss', 'monster.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonsterMenuComponent {
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  hasSpoilers = ghsHasSpoilers;
  isSpoiled = ghsIsSpoiled;
  notSpoiled = ghsNotSpoiled;

  filter: string = '';
  allEditions: boolean = false;

  hasMonster(monsterData: MonsterData) {
    return gameManager.game.figures.some((figure) => {
      return figure instanceof Monster && monsterData.name == figure.name && monsterData.edition == figure.edition;
    });
  }

  hasBossMonster(): boolean {
    return gameManager.currentEditions().some((edition) => gameManager.monstersData(edition).some((monsterData) => monsterData.boss));
  }

  hasHiddenMonster(): boolean {
    return gameManager.currentEditions().some((edition) => gameManager.monstersData(edition).some((monsterData) => monsterData.hidden));
  }

  monsterData(edition: string | undefined = undefined, filter: string = ''): MonsterData[] {
    return gameManager
      .monstersData(edition)
      .filter(
        (monsterData) =>
          (!monsterData.boss || monsterData.boss == settingsManager.settings.showBossMonster) &&
          (!monsterData.hidden || monsterData.hidden == settingsManager.settings.showHiddenMonster) &&
          (!filter ||
            ghsTextSearch(monsterData.name, filter) ||
            ghsTextSearch(settingsManager.getLabel('data.monster.' + monsterData.name), filter))
      )
      .sort((a, b) => {
        const aName = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
        const bName = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();

        if (a.spoiler && !b.spoiler) {
          return 1;
        }
        if (!a.spoiler && b.spoiler) {
          return -1;
        }

        if (a.boss && !b.boss) {
          return 1;
        }
        if (!a.boss && b.boss) {
          return -1;
        }

        if (a.hidden && !b.hidden) {
          return 1;
        }
        if (!a.hidden && b.hidden) {
          return -1;
        }

        if (a.spoiler && b.spoiler) {
          if (!this.isSpoiled(a) && this.isSpoiled(b)) {
            return 1;
          }
          if (this.isSpoiled(a) && !this.isSpoiled(b)) {
            return -1;
          }
        }

        if (aName > bName) {
          return 1;
        }
        if (aName < bName) {
          return -1;
        }
        return 0;
      });
  }

  addMonster(monsterData: MonsterData) {
    gameManager.stateManager.before('addMonster', 'data.monster.' + monsterData.name);
    const monster = gameManager.monsterManager.addMonster(monsterData, gameManager.game.level);
    monster.tags.push('addedManually');
    gameManager.stateManager.after();
  }

  noResults(): boolean {
    return gameManager.currentEditions().every((edition) => this.monsterData(edition, this.filter).length == 0);
  }
}
