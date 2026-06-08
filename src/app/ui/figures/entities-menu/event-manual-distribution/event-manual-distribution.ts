import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { LootType, materialResourceLootTypes } from 'src/app/game/model/data/Loot';
import {
  DistributionRow,
  EventManualDistributionHelper
} from 'src/app/ui/figures/entities-menu/helpers/event-manual-distribution';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, TabClickDirective, TrackUUIDPipe],
  selector: 'ghs-event-manual-distribution',
  templateUrl: './event-manual-distribution.html',
  styleUrls: ['./event-manual-distribution.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventManualDistributionComponent {
  private ghsManager = inject(GhsManager);

  helper = input.required<EventManualDistributionHelper>();
  closeOnApply = input<boolean>(false);
  applied = output<void>();

  gameManager: GameManager = gameManager;

  constructor() {
    this.ghsManager.uiChangeEffect(() => {});
  }
  settingsManager: SettingsManager = settingsManager;
  LootType = LootType;
  materialResourceLootTypes = materialResourceLootTypes;

  characters(): Character[] {
    return this.helper().characters;
  }

  rows(): DistributionRow[] {
    return this.helper().rows;
  }

  rowLabelArgs(row: DistributionRow): (string | number)[] {
    const effect = row.effect;
    if (row.kind === 'resource' && row.lootType) {
      return [+effect.values[0], row.lootType];
    }
    return effect.values.filter((value) => typeof value === 'string' || typeof value === 'number') as (string | number)[];
  }

  rowIcon(row: DistributionRow): string {
    switch (row.kind) {
      case 'gold':
        return './assets/images/' + (settingsManager.settings.fhStyle ? 'fh/' : '') + 'loot.svg';
      case 'experience':
        return './assets/images/status/experience.svg';
      case 'battleGoal':
        return './assets/images/checkmark.svg';
      case 'resource':
        return row.lootType ? './assets/images/fh/loot/' + row.lootType + '.svg' : './assets/images/fh/loot/lumber.svg';
      default:
        return './assets/images/fh/loot/lumber.svg';
    }
  }

  rowLabelKey(row: DistributionRow): string {
    return 'game.events.effects.' + row.effect.type + (row.effect.alt ? '.' + row.effect.alt : '');
  }

  currentGold(character: Character): number {
    return character.progress.gold || 0;
  }

  currentXP(character: Character): number {
    return character.progress.experience || 0;
  }

  currentBattleGoals(character: Character): number {
    return character.progress.battleGoals || 0;
  }

  currentResource(character: Character, type: LootType | undefined): number {
    return type ? character.progress.loot[type] || 0 : 0;
  }

  currentSupply(row: DistributionRow, lootType?: LootType): number {
    return this.helper().currentSupply(row, lootType);
  }

  canIncrease(row: DistributionRow, characterIndex?: number, lootType?: LootType): boolean {
    if (row.spent >= row.total) {
      return false;
    }
    if (row.anyMaterial) {
      if (!lootType) {
        return false;
      }
      if (characterIndex === undefined) {
        return row.useSupply;
      }
      const character = this.characters()[characterIndex];
      if (!row.isGain() && this.helper().availableForLoss(row, character, lootType) <= row.spentForType(lootType, characterIndex)) {
        return false;
      }
      return true;
    }
    if (characterIndex === undefined) {
      return row.useSupply;
    }
    const character = this.characters()[characterIndex];
    if (row.perCharacter > 0 && row.characterSpent[characterIndex] >= row.perCharacter) {
      return false;
    }
    if (!row.isGain() && this.helper().availableForLoss(row, character) <= row.characterSpent[characterIndex]) {
      return false;
    }
    return true;
  }

  canDecrease(row: DistributionRow, characterIndex?: number, lootType?: LootType): boolean {
    if (row.anyMaterial) {
      if (!lootType) {
        return false;
      }
      return row.spentForType(lootType, characterIndex) > 0;
    }
    if (characterIndex === undefined) {
      return row.supplySpent > 0;
    }
    return row.characterSpent[characterIndex] > 0;
  }

  tableColumns(row: DistributionRow): number {
    return 1 + (row.useSupply ? 1 : 0) + this.characters().length;
  }

  canAssignToCharacter(row: DistributionRow, character: Character): boolean {
    if (row.isGain()) {
      return true;
    }
    switch (row.kind) {
      case 'gold':
        return (character.progress.gold || 0) > 0;
      case 'experience':
        return (character.progress.experience || 0) > 0;
      case 'battleGoal':
        return (character.progress.battleGoals || 0) > 0;
      case 'resource':
        return row.lootType ? (character.progress.loot[row.lootType] || 0) > 0 : false;
      default:
        return true;
    }
  }

  changeValue(row: DistributionRow, characterIndex: number | undefined, value: number, lootType?: LootType) {
    this.helper().changeValue(row, characterIndex, value, lootType);
    gameManager.triggerUiChange(false);
  }

  apply() {
    if (!this.helper().apply()) {
      return;
    }
    gameManager.triggerUiChange(false);
    if (this.closeOnApply()) {
      this.applied.emit();
    }
  }

  label(key: string, args?: (string | number)[]): string {
    return settingsManager.getLabel(key, args?.map((a) => '' + a));
  }

  characterIconAlt(character: Character): string {
    return this.gameManager.characterManager.characterName(character, true);
  }

  rowIconAlt(row: DistributionRow): string {
    switch (row.kind) {
      case 'gold':
        return this.label('character.progress.gold');
      case 'experience':
        return this.label('game.experience');
      case 'battleGoal':
        return this.label('game.battleGoals');
      case 'resource':
        return row.lootType ? this.label('game.loot.' + row.lootType) : '';
      default:
        return '';
    }
  }
}
