import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';

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
    return gameManager.isEditionRelevant(character.edition, 'fh') ? SummonColor.fh : SummonColor.blue;
  }

  number(character: Character, summonData: SummonData, color: SummonColor, number: BASE_TYPE): number {
    if (summonData.special) {
      return 0;
    }
    if (typeof number === 'number' && number > 0) {
      return number;
    }
    const maxNumber = Math.max(8, summonData.count || 1);
    for (let i = 1; i <= maxNumber; i++) {
      if (
        character.summons.every((summon) => summon.dead || summon.name !== summonData.name || summon.number !== i || summon.color !== color)
      ) {
        return i;
      }
    }
    return 1;
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
      const summon: Summon = new Summon(
        gameManager.randomManager.uuid(),
        summonData.name,
        summonData.cardId,
        character.level,
        this.number(character, summonData, color, summonNumber),
        summonData.special ? SummonColor.custom : color,
        summonData
      );
      summon.state = summonData.special ? SummonState.true : SummonState.new;
      summon.init = false;
      gameManager.characterManager.addSummon(character, summon);
    } else {
      this.executionError('character or summon not found');
    }
  }
}
