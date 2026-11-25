import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Condition, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { Entity } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Game } from 'src/app/game/model/Game';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';

export type SummonStatType = 'maxHp' | 'attack' | 'trapHeal' | 'movement' | 'trapDamage' | 'range';

export class SummonManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  addSummon(character: Character, summon: Summon) {
    character.summons = character.summons.filter(
      (value) => value.name !== summon.name || value.number !== summon.number || value.color !== summon.color
    );

    if (
      character.edition === 'cs' &&
      character.name === 'skull' &&
      summon.cardId &&
      character.availableSummons.find((s) => s.cardId === summon.cardId)
    ) {
      summon.tags.push('cs-skull-spirit');
      summon.afterTurn = true;
      summon.state = SummonState.true;
    }

    if (summon.trap) {
      summon.state = SummonState.true;
    }

    character.summons.push(summon);

    gameManager.specialActionsManager.addSummon(character, summon);
  }

  canApplyTrap(character: Character, trap: Summon, target: Entity, targetFigure: Figure): boolean {
    return (
      trap.trap &&
      character.summons.includes(trap) &&
      gameManager.entityManager.isAlive(trap) &&
      target !== trap &&
      gameManager.entityManager.entitiesAll(targetFigure).includes(target)
    );
  }

  applyTrap(
    character: Character,
    trap: Summon,
    target: Entity,
    targetFigure: Figure,
    conditions: EntityCondition[] = trap.entityConditions,
    damageChange: number = 0,
    healChange: number = 0
  ): boolean {
    if (!this.canApplyTrap(character, trap, target, targetFigure)) {
      return false;
    }
    const damage = trap.movement + damageChange;
    const heal = trap.attack === 'X' ? 0 : +trap.attack + healChange;
    if (damage) {
      gameManager.entityManager.changeHealth(target, targetFigure, -damage);
    }
    if (heal) {
      gameManager.entityManager.changeHealth(target, targetFigure, heal);
    }
    conditions
      .filter((entityCondition) => !entityCondition.expired && entityCondition.state !== EntityConditionState.removed)
      .forEach((entityCondition) =>
        gameManager.conditionManager.addCondition(target, targetFigure, new Condition(entityCondition.name, entityCondition.value))
      );
    trap.dead = true;
    return true;
  }

  removeSummon(character: Character, summon: Summon) {
    const index = character.summons.indexOf(summon);
    if (index === -1) {
      return;
    }
    character.summons.splice(index, 1);
    gameManager.specialActionsManager.removeSummon(character, summon);
  }

  toggleSummonActive(character: Character, summon: Summon) {
    if (summon.active) {
      if (settingsManager.settings.activeSummons && character.active) {
        gameManager.turnManager.toggleFigure(character);
      } else {
        summon.active = false;
      }
      return;
    }
    const activeSummon = character.summons.find((other) => other.active);
    if (
      settingsManager.settings.activeSummons &&
      character.active &&
      gameManager.entityManager.isAlive(summon, true) &&
      (!activeSummon || character.summons.indexOf(activeSummon) < character.summons.indexOf(summon))
    ) {
      while (!summon.active && character.active) {
        gameManager.turnManager.toggleFigure(character);
      }
    } else {
      character.summons.forEach((other) => (other.active = false));
      summon.active = true;
    }
  }

  initSummon(
    character: Character,
    summon: Summon,
    changes: { health?: number; maxHp?: number; attack?: number; movement?: number; range?: number } = {}
  ) {
    this.removeSummon(character, summon);
    summon.init = false;
    if (changes.health) {
      gameManager.entityManager.changeHealth(summon, character, changes.health, false, false);
    }
    if (changes.attack && typeof summon.attack === 'number') {
      summon.attack += changes.attack;
    }
    if (changes.movement) {
      summon.movement += changes.movement;
    }
    if (changes.range) {
      summon.range += changes.range;
    }
    if (changes.maxHp) {
      if (summon.maxHealth + changes.maxHp < summon.maxHealth || summon.health === summon.maxHealth) {
        summon.health = summon.maxHealth + changes.maxHp;
      }
      summon.maxHealth += changes.maxHp;
    }
    this.addSummon(character, summon);
  }

  changeSummonStat(summon: Summon, stat: SummonStatType, value: number) {
    switch (stat) {
      case 'maxHp':
        summon.maxHealth += value;
        break;
      case 'attack':
      case 'trapHeal':
        if (!isNaN(+summon.attack)) {
          summon.attack = +summon.attack + value;
        }
        break;
      case 'movement':
      case 'trapDamage':
        summon.movement += value;
        break;
      case 'range':
        summon.range += value;
        break;
    }
  }

  summonAvailable(character: Character, summonData: SummonData, number: number, color: SummonColor): boolean {
    return (
      color !== SummonColor.custom &&
      number !== 0 &&
      character.summons.every(
        (summon) =>
          summon.dead ||
          summon.name !== summonData.name ||
          (summonData.special ? summon.number !== 0 : summon.number !== number) ||
          (summonData.special ? summon.color !== SummonColor.custom : summon.color !== color)
      ) &&
      this.canAddSummon(character, summonData)
    );
  }

  nextSummonNumber(character: Character, summonData: SummonData, color: SummonColor): number {
    if (summonData.special) {
      return 0;
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

  // summons of the character's level and of items (owned ones with character items, otherwise all of the relevant editions)
  availableSummons(character: Character): SummonData[] {
    const summons: SummonData[] = character.availableSummons.filter(
      (summonData) => !summonData.level || summonData.level <= character.level
    );
    // TODO: items not implemented for RPG yet
    if (gameManager.characterRpgManager.isRpgCharacter(character)) {
      return summons;
    }
    const items = settingsManager.settings.characterItems
      ? (character.progress.items || []).map((identifier) => gameManager.itemManager.getItem(identifier.name, identifier.edition, true))
      : gameManager.editionManager.relevantEditions().flatMap((edition) => gameManager.itemManager.getItems(edition, true));
    items.forEach((item) => {
      if (item && item.summon) {
        summons.push(Object.assign(new SummonData(), item.summon, { name: item.summon.name || item.name, count: item.summon.count || 1 }));
      }
    });
    return summons;
  }

  defaultSummonColor(character: Character): SummonColor {
    return gameManager.editionManager.isEditionRelevant(character.edition, 'fh') ||
      gameManager.characterRpgManager.isRpgCharacter(character)
      ? SummonColor.fh
      : SummonColor.blue;
  }

  canAddSummon(character: Character, summonData: SummonData): boolean {
    return (
      (summonData.count || 1) >
      character.summons.filter(
        (summon) => summon.name === summonData.name && summon.cardId === summonData.cardId && gameManager.entityManager.isAlive(summon)
      ).length
    );
  }

  addSummonFromData(character: Character, summonData: SummonData, number: number, color: SummonColor): Summon | undefined {
    if (!this.canAddSummon(character, summonData)) {
      return undefined;
    }
    const summon: Summon = new Summon(
      gameManager.randomManager.uuid(),
      summonData.name,
      summonData.cardId,
      character.level,
      summonData.special ? 0 : number,
      summonData.special ? SummonColor.custom : color,
      summonData
    );
    summon.state = summonData.special ? SummonState.true : SummonState.new;
    summon.init = false;
    this.addSummon(character, summon);
    return summon;
  }

  canAddCustomSummon(character: Character, name: string, number: number, color: SummonColor): boolean {
    return (
      typeof name === 'string' &&
      Number.isInteger(number) &&
      number > 0 &&
      Object.values(SummonColor).includes(color) &&
      !character.summons.some(
        (summon) => gameManager.entityManager.isAlive(summon) && summon.name === name && summon.number === number && summon.color === color
      )
    );
  }

  addCustomSummon(character: Character, name: string, number: number, color: SummonColor): Summon | undefined {
    if (!this.canAddCustomSummon(character, name, number, color)) {
      return undefined;
    }
    const summon: Summon = new Summon(gameManager.randomManager.uuid(), name, '', character.level, number, color);
    summon.state = SummonState.new;
    this.addSummon(character, summon);
    return summon;
  }

  createSpecialSummon(character: Character, summonData: SummonData) {
    character.summons = character.summons.filter(
      (summon) => summon.name !== summonData.name || summon.number !== 0 || summon.color !== SummonColor.custom
    );
    if (!summonData.level || summonData.level <= character.level) {
      const summon: Summon = new Summon(
        gameManager.randomManager.uuid(),
        summonData.name,
        summonData.cardId,
        character.level,
        0,
        SummonColor.custom,
        summonData
      );
      summon.state = SummonState.true;
      summon.init = false;
      this.addSummon(character, summon);
    }
  }
}
