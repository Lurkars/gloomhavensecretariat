import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { LootType, resourceLootTypes } from 'src/app/game/model/data/Loot';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { ghsValueSign } from 'src/app/ui/helper/Static';

export class CharacterProgressHelper {
  experience: number = 0;
  gold: number = 0;
  battleGoals: number = 0;
  loot: Partial<Record<LootType, number>> = {};
  lootColumns: LootType[] = [];

  constructor(private component: EntitiesMenuDialogComponent) {}

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
    const characterIcons = this.component.entities
      .filter((entity) => entity instanceof Character)
      .map((character) => '%game.characterIconColored.' + character.name + '%')
      .join(',');

    const characters = this.component.entities.filter((entity) => entity instanceof Character) as Character[];

    if (this.experience !== 0) {
      gameManager.stateManager.before('eventEffect.changeCharacterXP', ghsValueSign(this.experience), characterIcons);
      gameManager.eventCardManager.changeCharacterValue(characters, 'experience', this.experience);
      gameManager.stateManager.after();
    }

    if (this.gold !== 0) {
      gameManager.stateManager.before('eventEffect.changeCharacterGold', ghsValueSign(this.gold), characterIcons);
      gameManager.eventCardManager.changeCharacterValue(characters, 'gold', this.gold);
      gameManager.stateManager.after();
    }

    if (this.battleGoals !== 0) {
      gameManager.stateManager.before('eventEffect.changeCharacterBattleGoals', ghsValueSign(this.battleGoals), characterIcons);
      gameManager.eventCardManager.changeCharacterValue(characters, 'battleGoals', this.battleGoals);
      gameManager.stateManager.after();
    }

    this.lootColumns.forEach((type) => {
      const value = this.loot[type] || 0;
      if (value !== 0) {
        if (settingsManager.settings.fhShareResources) {
          gameManager.stateManager.before(
            'eventEffect.changeCharacterResource',
            type,
            ghsValueSign(value),
            '%party.campaign.sheet.supply%'
          );
          gameManager.eventCardManager.changeSupplyResource(type, value);
        } else {
          gameManager.stateManager.before('eventEffect.changeCharacterResource', type, ghsValueSign(value), characterIcons);
          gameManager.eventCardManager.changeCharacterValue(characters, 'resource', value, type);
        }
        gameManager.stateManager.after();
      }
    });
  }
}
