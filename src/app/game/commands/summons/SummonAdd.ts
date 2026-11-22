import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { SummonColor } from 'src/app/game/model/Summon';

export class SummonAddCommand extends CommandImpl {
  id: string = 'summon.add';
  requiredParameters: number = 3;

  summonData(character: Character, name: BASE_TYPE, cardId: BASE_TYPE): SummonData | undefined {
    const summons: SummonData[] = character.availableSummons.filter(
      (summonData) => !summonData.level || summonData.level <= character.level
    );
    if (settingsManager.settings.characterItems && character.progress && character.progress.items) {
      character.progress.items.forEach((identifier) => {
        const item = gameManager.itemManager.getItem(identifier.name, identifier.edition, true);
        if (item && item.summon) {
          summons.push(Object.assign(new SummonData(), item.summon, { name: item.summon.name || item.name }));
        }
      });
    }
    return summons.find((summonData) => summonData.name === name && (!cardId || summonData.cardId === cardId));
  }

  color(character: Character, color: BASE_TYPE): SummonColor {
    if (color && Object.values(SummonColor).includes(color as SummonColor)) {
      return color as SummonColor;
    }
    return gameManager.isEditionRelevant(character.edition, 'fh') || gameManager.attackModifierManager.isRpgCharacter(character)
      ? SummonColor.fh
      : SummonColor.blue;
  }

  number(character: Character, summonData: SummonData, color: SummonColor, number: BASE_TYPE): number {
    if (!summonData.special && typeof number === 'number' && number > 0) {
      return number;
    }
    return gameManager.characterManager.nextSummonNumber(character, summonData, color);
  }

  validParameters(number: number, name: string, seed: number, cardId: string = ''): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const character = findCharacter(number);
    const summonData = character && this.summonData(character, name, cardId);
    return (
      !!character &&
      !!summonData &&
      (summonData.count || 1) >
        character.summons.filter(
          (summon) => summon.name === summonData.name && summon.cardId === summonData.cardId && gameManager.entityManager.isAlive(summon)
        ).length
    );
  }

  executeWithParameters(
    number: number,
    name: string,
    seed: number,
    cardId: string = '',
    summonNumber: number = 0,
    summonColor: string = ''
  ) {
    gameManager.game.seed = seed;
    const character = findCharacter(number);
    const summonData = character && this.summonData(character, name, cardId);
    if (character && summonData) {
      const color = this.color(character, summonColor);
      gameManager.characterManager.addSummonFromData(character, summonData, this.number(character, summonData, color, summonNumber), color);
    } else {
      this.executionError('character or summon not found');
    }
  }
}
