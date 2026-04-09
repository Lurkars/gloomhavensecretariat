import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { LootType, resourceLootTypes } from 'src/app/game/model/data/Loot';
import { ghsValueSign } from 'src/app/ui/helper/Static';
import type { EntitiesMenuDialogComponent } from '../entities-menu-dialog';

export class CharacterProgressHelper {

  experience: number = 0;
  gold: number = 0;
  battleGoals: number = 0;
  loot: Partial<Record<LootType, number>> = {};
  lootColumns: LootType[] = [];

  constructor(private component: EntitiesMenuDialogComponent) { }

  update() {
    if (this.component.eventMenu) {
      this.component.shieldAndRetaliate = false;
    }

    this.lootColumns = gameManager.fhRules() ? resourceLootTypes : [];
  }


  changeLoot(type: LootType, value: number) {
    this.loot[type] = (this.loot[type] || 0) + value;
  }

  close() {
    const characterIcons = this.component.entities.filter((entity) => entity instanceof Character).map((character) => '%game.characterIconColored.' + character.name + '%').join(',');

    if (this.experience != 0) {
      gameManager.stateManager.before("eventEffect.changeCharacterXP", ghsValueSign(this.experience), characterIcons);
      this.component.entities.forEach((entity) => {
        if (entity instanceof Character) {
          entity.progress.experience += this.experience;
          if (entity.progress.experience < 0) {
            entity.progress.experience = 0;
          }
        }
      })
      gameManager.stateManager.after();
    }

    if (this.gold != 0) {
      gameManager.stateManager.before("eventEffect.changeCharacterGold", ghsValueSign(this.gold), characterIcons);
      this.component.entities.forEach((entity) => {
        if (entity instanceof Character) {
          entity.progress.gold += this.gold;
          if (entity.progress.gold < 0) {
            entity.progress.gold = 0;
          }
        }
      })
      gameManager.stateManager.after();
    }

    if (this.battleGoals != 0) {
      gameManager.stateManager.before("eventEffect.changeCharacterBattleGoals", ghsValueSign(this.battleGoals), characterIcons);
      this.component.entities.forEach((entity) => {
        if (entity instanceof Character) {
          entity.progress.battleGoals += this.battleGoals;
          if (entity.progress.battleGoals < 0) {
            entity.progress.battleGoals = 0;
          }
        }
      })
      gameManager.stateManager.after();
    }

    this.lootColumns.forEach((type) => {
      if (this.loot[type] && this.loot[type] != 0) {
        if (settingsManager.settings.fhShareResources) {
          gameManager.stateManager.before("eventEffect.changeCharacterResource", type, ghsValueSign(this.loot[type] || 0), '%party.campaign.sheet.supply%');
          gameManager.game.party.loot[type] = (gameManager.game.party.loot[type] || 0) + (this.loot[type] || 0);
          gameManager.stateManager.after();
        } else {
          gameManager.stateManager.before("eventEffect.changeCharacterResource", type, ghsValueSign(this.loot[type] || 0), characterIcons);
          this.component.entities.forEach((entity) => {
            if (entity instanceof Character) {
              entity.progress.loot[type] = (entity.progress.loot[type] || 0) + (this.loot[type] || 0);
              if (entity.progress.loot[type] < 0) {
                entity.progress.loot[type] = 0;
              }
            }
          })
          gameManager.stateManager.after();
        }
      }
    })
  }

}
