import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { AttackModifier, AttackModifierType, CsOakDeckAttackModifier } from 'src/app/game/model/data/AttackModifier';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Condition, ConditionName } from 'src/app/game/model/data/Condition';
import { Enhancement } from 'src/app/game/model/data/Enhancement';
import { FigureError, FigureErrorType } from 'src/app/game/model/data/FigureError';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';

export type SummonStatType = 'maxHp' | 'attack' | 'trapHeal' | 'movement' | 'trapDamage' | 'range';

export class CharacterManager {
  game: Game;
  xpMap: number[] = [0, 45, 95, 150, 210, 275, 345, 420, 500];

  constructor(game: Game) {
    this.game = game;
  }

  characterIcon(character: CharacterData | string, edition: string = ''): string {
    let characterData: CharacterData;
    if (character instanceof CharacterData) {
      characterData = character;
    } else {
      characterData = gameManager.getCharacterData(character, edition);
    }

    if (characterData.iconUrl) {
      return characterData.iconUrl;
    }

    if (characterData.icon) {
      return './assets/images/character/icons/' + characterData.icon + '.svg';
    }

    return './assets/images/character/icons/' + characterData.edition + '-' + characterData.name + '.svg';
  }

  characterIdentityIcon(character: string, index: number): string {
    const characterData = gameManager.getCharacterData(character);
    if (!characterData.identities || characterData.identities.length === 0) {
      return this.characterIcon(character);
    }

    return (
      './assets/images/character/icons/' + characterData.edition + '-' + characterData.name + '-' + characterData.identities[index] + '.svg'
    );
  }

  characterIdentityColor(character: string, index: number): string {
    const characterData = gameManager.getCharacterData(character);
    return characterData.identityColors[index] || characterData.color;
  }

  characterName(character: Character, full: boolean = false, icon: boolean = false, identity: boolean = true): string {
    let name = settingsManager.getLabel('data.character.' + character.edition + '.' + character.name);
    let hasTitle = false;
    if (identity && character.identities.length > 0 && settingsManager.settings.characterIdentities) {
      if (character.title && character.title.split('|')[character.identity] && character.title.split('|')[character.identity]) {
        name = character.title.split('|')[character.identity];
        hasTitle = true;
      } else if (settingsManager.settings.characterIdentityHint && !full) {
        name +=
          ' (' +
          settingsManager.getLabel(
            'data.character.' + character.edition + '.' + character.name + '.' + character.identities[character.identity]
          ) +
          ')';
      }
    } else if (character.title) {
      name = character.title;
      hasTitle = true;
    }
    if (full && hasTitle) {
      name += ' (' + settingsManager.getLabel('data.character.' + character.edition + '.' + character.name) + ')';
    }

    if (icon) {
      name = '%game.characterIconColored.' + character.name + '%' + name;
    }

    if (
      this.game.figures.find(
        (figure) => figure instanceof Character && figure.name === character.name && figure.edition !== character.edition
      )
    ) {
      name += ' [' + settingsManager.getLabel('data.edition.' + character.edition) + ']';
    }

    return name;
  }

  characterColor(character: CharacterData | string): string {
    let characterData: CharacterData;
    if (character instanceof CharacterData) {
      characterData = character;
    } else {
      characterData = gameManager.getCharacterData(character);
    }

    return characterData.color;
  }

  characterThumbnail(characterData: CharacterData) {
    if (characterData.thumbnailUrl) {
      return characterData.thumbnailUrl;
    }

    if (characterData.thumbnail) {
      return './assets/images/character/thumbnail/' + characterData.thumbnail + '.png';
    }

    return './assets/images/character/thumbnail/' + characterData.edition + '-' + characterData.name + '.png';
  }

  characterCount(figuresOnly: boolean = false): number {
    if (!figuresOnly && this.game.playerCount > 0) {
      return this.game.playerCount;
    }

    return this.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length;
  }

  addCharacter(characterData: CharacterData, level: number) {
    if (
      !this.game.figures.some((figure) => {
        return figure instanceof Character && figure.name === characterData.name && figure.edition === characterData.edition;
      })
    ) {
      const character: Character = new Character(characterData, level);
      character.availableSummons
        .filter((summonData) => summonData.special)
        .forEach((summonData) => this.createSpecialSummon(character, summonData));

      character.number = 1;
      while (gameManager.game.figures.some((figure) => figure instanceof Character && figure.number === character.number)) {
        character.number++;
      }

      if (this.game.party.retirements) {
        this.game.party.retirements.forEach((retirementModel) => {
          if (retirementModel.number === character.number) {
            character.progress.retirements++;
          }
        });
      }

      if (character.progress.gold === 0) {
        if (gameManager.fhRules()) {
          character.progress.gold = 10 * gameManager.campaignManager.prosperityLevel() + 20;
        } else if (gameManager.gh2eRules()) {
          character.progress.gold = 10 * gameManager.campaignManager.prosperityLevel() + 15;
        } else if (!gameManager.editionRules('jotl')) {
          character.progress.gold = 15 * (character.level + 1);
        }
      }

      character.tags.push('new-character');

      this.game.figures.push(character);
      gameManager.addEntityCount(character);

      this.previousEnhancements(character, gameManager.enhancementsManager.temporary);

      if (this.game.state === GameState.next) {
        gameManager.attackModifierManager.shuffleModifiers(character.attackModifierDeck);
      }
      gameManager.sortFigures(character);
    }
    if (this.game.levelCalculation) {
      gameManager.levelManager.calculateScenarioLevel();
    }
    gameManager.trialsManager.applyTrialCards();
  }

  setAsideCharacter(character: Character) {
    this.game.party.availableCharacters = this.game.party.availableCharacters || [];
    this.game.party.availableCharacters.push(character.toModel());
    this.removeCharacter(character);
  }

  replayCharacter(character: Character) {
    this.game.party.availableCharacters = this.game.party.availableCharacters.filter(
      (model) => model.name !== character.name || model.edition !== character.edition || model.number !== character.number
    );
    this.game.figures
      .filter((figure) => figure instanceof Character && figure.number === character.number)
      .forEach((figure) => {
        this.game.party.availableCharacters.push((figure as Character).toModel());
        this.removeCharacter(figure as Character);
      });
    this.game.figures.push(character);
  }

  donationsAvailable(character: Character | undefined = undefined): boolean {
    if (character && gameManager.attackModifierManager.isRpgCharacter(character)) {
      return false;
    }
    if (gameManager.fhRules(false)) {
      return this.game.party.buildings.some(
        (buildingModel) => buildingModel.name === 'temple' && buildingModel.level > 0 && buildingModel.state !== 'wrecked'
      );
    }
    return !gameManager.editionRules('jotl');
  }

  donationCosts(): number {
    return gameManager.fhRules(false) && this.donationsAvailable() ? 5 : 10;
  }

  canDonate(character: Character): boolean {
    return this.game.round < 1 && this.donationsAvailable(character) && character.progress.gold >= this.donationCosts();
  }

  donate(character: Character) {
    const costs = this.donationCosts();
    character.progress.donations += 1;
    character.donations += 1;
    this.game.party.donations += 1;
    character.progress.gold -= costs;
    gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.donations);
    gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.donatedGold);
  }

  characterUnlocked(edition: string, name: string): boolean {
    return this.game.unlockedCharacters.includes(edition + ':' + name);
  }

  unlockCharacter(edition: string, name: string): boolean {
    if (this.characterUnlocked(edition, name)) {
      return false;
    }
    this.game.unlockedCharacters.push(edition + ':' + name);
    if (settingsManager.settings.events) {
      const characterData = gameManager.charactersData(edition).find((data) => data.name === name && data.edition === edition);
      gameManager.eventCardManager.addEvents(characterData && characterData.unlockEvent);
    }
    return true;
  }

  lockCharacter(edition: string, name: string) {
    this.game.unlockedCharacters = this.game.unlockedCharacters.filter((unlock) => unlock !== edition + ':' + name);
  }

  removeCharacter(character: Character, retirement: boolean = false) {
    const index = this.game.figures.indexOf(character);
    if (index === -1) {
      return;
    }
    this.game.figures.splice(index, 1);

    if (retirement && settingsManager.settings.applyRetirement) {
      gameManager.campaignManager.changeProsperity(gameManager.fhRules(true) ? 2 : 1);

      if (settingsManager.settings.events) {
        gameManager.eventCardManager.addEvents(character.retireEvent);
      }
    }

    if (character.marker) {
      // remove marker
      const marker = character.edition + '-' + character.name;
      this.game.figures.forEach((figure) => {
        if (figure instanceof Character) {
          figure.markers = (figure.markers || []).filter((value) => value !== marker);
          if (figure.summons) {
            figure.summons.forEach((summon) => {
              summon.markers = (summon.markers || []).filter((value) => value !== marker);
            });
          }
        } else if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
          figure.entities.forEach((entity) => {
            entity.markers = (entity.markers || []).filter((value) => value !== marker);
          });
        }
      });
    }
    if (this.game.levelCalculation) {
      gameManager.levelManager.calculateScenarioLevel();
    }

    if (retirement) {
      gameManager.personalQuestManager.trackPersonalQuestProgressForParty(PersonalQuestAutotrackType.retiredChars);
    }
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

  removeSummon(character: Character, summon: Summon) {
    const index = character.summons.indexOf(summon);
    if (index === -1) {
      return;
    }
    character.summons.splice(index, 1);
    gameManager.specialActionsManager.removeSummon(character, summon);
  }

  addXP(character: Character, value: number, levelUp: boolean = true) {
    character.progress.experience = Math.max(0, character.progress.experience + value);
    if (levelUp) {
      this.setLevel(character, this.levelForXp(character.progress.experience));
    }
  }

  levelForXp(xp: number) {
    let level: number = 0;
    this.xpMap.forEach((value, index) => {
      if (xp >= value) {
        level = index + 1;
      }
    });
    return level;
  }

  availablePerks(character: Character): number {
    const gained = (character.progress.perks || []).reduce((a, b) => a + (b || 0), 0);
    if (gameManager.attackModifierManager.isRpgCharacter(character)) {
      return character.level - 1 + character.progress.extraPerks - gained;
    }
    return (
      character.level +
      Math.min(6, Math.floor(character.progress.battleGoals / 3)) -
      gained -
      1 +
      character.progress.extraPerks +
      character.progress.retirements +
      character.progress.masteries.length
    );
  }

  private activateSummonsAfterTurn(character: Character): boolean {
    const summonsAfterTurn = character.summons.filter((summon) => summon.afterTurn);
    return (
      settingsManager.settings.activeSummons &&
      character.active &&
      !character.summons.some((summon) => summon.active) &&
      summonsAfterTurn.length > 0 &&
      !summonsAfterTurn.some((summon) => summon.active)
    );
  }

  toggleActiveUndoInfos(character: Character): string[] {
    const name = this.characterName(character, true, true);
    const activeSummon = character.summons.find((summon) => summon.active);
    if (this.activateSummonsAfterTurn(character)) {
      const summonAfterTurn = character.summons.find((summon) => summon.afterTurn);
      return ['summonInactive', name, 'data.summon.' + (summonAfterTurn ? summonAfterTurn.name : '')];
    } else if (settingsManager.settings.activeSummons && character.active && activeSummon) {
      return ['summonInactive', name, 'data.summon.' + activeSummon.name];
    }
    return [character.active ? 'unsetActive' : 'setActive', name];
  }

  moveResourceToSupply(character: Character, type: LootType, value: number): number {
    const moved = Math.min(value, character.progress.loot[type] || 0);
    if (moved > 0) {
      gameManager.eventCardManager.changeSupplyResource(type, moved);
      character.progress.loot[type] = (character.progress.loot[type] || 0) - moved;
    }
    return moved;
  }

  changeLoot(character: Character, value: number) {
    const lootBefore = character.loot;
    character.loot = Math.max(0, character.loot + value);
    gameManager.personalQuestManager.trackMoneyTokens(character, character.loot - lootBefore);
  }

  toggleSummonActive(character: Character, summon: Summon) {
    if (summon.active) {
      if (settingsManager.settings.activeSummons && character.active) {
        gameManager.roundManager.toggleFigure(character);
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
        gameManager.roundManager.toggleFigure(character);
      }
    } else {
      character.summons.forEach((other) => (other.active = false));
      summon.active = true;
    }
  }

  toggleActive(character: Character) {
    if (this.activateSummonsAfterTurn(character)) {
      character.summons.filter((summon) => summon.afterTurn).forEach((summon) => (summon.afterTurnActive = true));
    }
    gameManager.roundManager.toggleFigure(character);
  }

  setPerk(character: Character, index: number, value: number) {
    const shackles = character.name === 'shackles' && character.edition === 'fh' && index === 11;
    const lowerShacklesHP = shackles && character.progress.perks[index] === 2;
    character.progress.perks[index] = value;

    const perk = character.perks[index];
    if (perk.monsterDeck) {
      this.game.monsterAttackModifierDeck = gameManager.attackModifierManager.buildMonsterAttackModifierDeck();
      gameManager.attackModifierManager.shuffleModifiers(this.game.monsterAttackModifierDeck);
    } else {
      gameManager.attackModifierManager.mergeAttackModifierDeck(
        character.attackModifierDeck,
        gameManager.attackModifierManager.buildCharacterAttackModifierDeck(character)
      );
      gameManager.attackModifierManager.shuffleModifiers(character.attackModifierDeck);

      if (shackles) {
        if (character.progress.perks[index] === 2 && !lowerShacklesHP) {
          character.maxHealth += 5;
        } else if (lowerShacklesHP && character.progress.perks[index] !== 2) {
          character.maxHealth -= 5;
        }
        character.health = character.maxHealth;
      }
    }
  }

  setLevel(character: Character, level: number) {
    const stat = character.stats.find((characterStat) => characterStat.level === level);
    if (!stat) {
      character.errors = character.errors || [];
      if (
        !character.errors.find((figureError) => figureError.type === FigureErrorType.unknown) &&
        !character.errors.find((figureError) => figureError.type === FigureErrorType.stat)
      ) {
        console.error('No character stat found for level: ' + level);
        character.errors.push(new FigureError(FigureErrorType.stat, 'character', character.name, character.edition, '', '' + level));
      }
      character.stat = new CharacterStat(level, 0);
    } else {
      character.stat = stat;
    }

    character.level = level;

    const adjustHealth = character.health === character.maxHealth;

    character.maxHealth = character.stat.health;

    if (character.name === 'shackles' && character.edition === 'fh' && character.progress.perks[11] === 2) {
      character.maxHealth += 5;
    }

    character.maxHealth += gameManager.specialActionsManager.maxHealthBonus(character);

    if (character.progress.equippedItems.find((identifier) => identifier.edition === 'fh' && identifier.name === '3')) {
      character.maxHealth += 1;
    }

    if (character.health > character.maxHealth || adjustHealth) {
      character.health = character.maxHealth;
    }

    character.availableSummons
      .filter((summonData) => summonData.special)
      .forEach((summonData) => this.createSpecialSummon(character, summonData));

    if (
      character.progress.experience < gameManager.characterManager.xpMap[level - 1] ||
      character.progress.experience >= gameManager.characterManager.xpMap[level]
    ) {
      character.progress.experience = gameManager.characterManager.xpMap[level - 1];
    }

    if (this.game.levelCalculation) {
      gameManager.levelManager.calculateScenarioLevel();
    }

    if (character.editionRules === 'bb') {
      character.attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(character);
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
      (summonData.count || 1) >
        character.summons.filter(
          (summon) => summon.name === summonData.name && summon.cardId === summonData.cardId && gameManager.entityManager.isAlive(summon)
        ).length
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

  addSummonFromData(character: Character, summonData: SummonData, number: number, color: SummonColor): Summon {
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

  addCustomSummon(character: Character, name: string, number: number, color: SummonColor): Summon {
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

  ignoreNegativeItemEffects(character: Character): boolean {
    const perk = character.perks.find(
      (perk) =>
        perk.custom &&
        (perk.custom.includes('%game.custom.perks.ignoreNegativeItem%') || perk.custom.includes('%game.custom.perks.ignoreNegativeItemFh%'))
    );
    if (!perk) {
      return false;
    } else {
      const perkIndex = character.perks.indexOf(perk);
      return character.progress.perks[perkIndex] && perk.combined
        ? character.progress.perks[perkIndex] === perk.count
        : character.progress.perks[perkIndex] > 0;
    }
  }

  ignoreNegativeScenarioffects(character: Character): boolean {
    const perk = character.perks.find(
      (perk) =>
        perk.custom &&
        (perk.custom.includes('%game.custom.perks.ignoreNegativeScenario%') || perk.custom.includes('%game.custom.perks.ignoreScenario%'))
    );
    if (!perk) {
      return false;
    } else {
      const perkIndex = character.perks.indexOf(perk);
      return character.progress.perks[perkIndex] && perk.combined
        ? character.progress.perks[perkIndex] === perk.count
        : character.progress.perks[perkIndex] > 0;
    }
  }

  itemEffect(itemData: ItemData): boolean {
    if (itemData.edition === 'gh') {
      return typeof itemData.id === 'number' && [16, 38, 52, 101, 103, 108].includes(itemData.id);
    } else if (itemData.edition === 'cs') {
      return typeof itemData.id === 'number' && [157, 71].includes(itemData.id);
    } else if (itemData.edition === 'toa') {
      return typeof itemData.id === 'number' && [101, 107].includes(itemData.id);
    } else if (itemData.edition === 'fh') {
      return typeof itemData.id === 'number' && [3, 11, 41, 60, 132, 138, 178].includes(itemData.id);
    }
    return false;
  }

  applyDonations(character: Character) {
    for (let i = 0; i < character.donations; i++) {
      if (gameManager.editionRules('cs')) {
        const oakDouble = CsOakDeckAttackModifier.filter(
          (attackModifier) =>
            !attackModifier.rolling &&
            !this.game.figures.find(
              (figure) => figure instanceof Character && figure.attackModifierDeck.cards.find((am) => am.id === attackModifier.id)
            )
        );
        const oakRolling = CsOakDeckAttackModifier.filter(
          (attackModifier) =>
            attackModifier.rolling &&
            !this.game.figures.find(
              (figure) => figure instanceof Character && figure.attackModifierDeck.cards.find((am) => am.id === attackModifier.id)
            )
        );

        if (oakDouble.length > 0) {
          gameManager.attackModifierManager.addModifier(
            character.attackModifierDeck,
            oakDouble[gameManager.randomManager.int(oakDouble.length)]
          );
        }
        if (oakRolling.length > 0) {
          gameManager.attackModifierManager.addModifier(
            character.attackModifierDeck,
            oakRolling[gameManager.randomManager.int(oakRolling.length)]
          );
        }
      } else {
        gameManager.attackModifierManager.addModifier(character.attackModifierDeck, new AttackModifier(AttackModifierType.bless));
        gameManager.attackModifierManager.addModifier(character.attackModifierDeck, new AttackModifier(AttackModifierType.bless));
      }
    }

    character.donations = 0;
  }

  next() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.initiative = 0;
        figure.initiativeVisible = false;
        figure.off = false;
        if (!settingsManager.settings.characterAttackModifierDeckPermanent) {
          figure.attackModifierDeckVisible = false;
        }
        figure.lootCardsVisible = false;
        figure.longRest = false;

        const summonsToRemove = figure.summons.filter((summon) => !gameManager.entityManager.isAlive(summon));
        summonsToRemove.forEach((summon) => this.removeSummon(figure, summon));

        figure.summons.forEach((summon) => {
          summon.off = false;
          summon.active = false;
          summon.afterTurnActive = false;
          if (summon.state === SummonState.new) {
            summon.state = SummonState.true;
          }
        });

        gameManager.specialActionsManager.next(figure);
        gameManager.trialsManager.next(figure);

        if (
          figure.progress.equippedItems.find((identifier) => identifier.edition === 'cs' && identifier.name === '57') &&
          gameManager.entityManager.hasCondition(figure, new Condition(ConditionName.wound)) &&
          !gameManager.entityManager.hasCondition(figure, new Condition(ConditionName.regenerate))
        ) {
          gameManager.entityManager.addCondition(figure, figure, new Condition(ConditionName.regenerate));
        }

        if (figure.tags) {
          const roundSpecialActions = figure.specialActions.filter((specialAction) => specialAction.round);
          figure.tags = figure.tags.filter(
            (tag) => !tag.startsWith('roundAction-') && !roundSpecialActions.some((specialAction) => tag === specialAction.name)
          );
        }
      }
    });
  }

  draw() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        if (this.game.round === 1) {
          this.applyDonations(figure);
          figure.initiativeVisible = true;
        }

        if (gameManager.entityManager.isAlive(figure) && !figure.absent) {
          figure.off = false;
        }
        gameManager.specialActionsManager.draw(figure);
        gameManager.trialsManager.draw(figure);
      }
    });
  }

  previousEnhancements(character: Character, temporary: boolean) {
    if (character.progress.enhancements) {
      character.progress.enhancements = character.progress.enhancements.filter((e) => !e.inherited);
    } else {
      character.progress.enhancements = [];
    }
    if (!temporary) {
      const previousCharacters = gameManager.game.party.retirements.filter(
        (model) => model.edition === character.edition && model.name === character.name
      );
      previousCharacters.forEach((previousCharacter) => {
        if (previousCharacter && previousCharacter.progress && previousCharacter.progress.enhancements) {
          character.progress.enhancements.push(
            ...previousCharacter.progress.enhancements
              .filter((e) => !e.inherited)
              .map((e) => new Enhancement(e.cardId, e.actionIndex, e.index, e.action, true))
          );
        }
      });

      character.progress.enhancements = character.progress.enhancements.filter((e, index, self) => {
        const first = self.find((o) => o.cardId === e.cardId && o.actionIndex === e.actionIndex && o.index === e.index);
        return !first || index === self.indexOf(first);
      });
    }

    // wipSpecial
    character.progress.enhancements
      .filter((e) => e.actionIndex.includes('custom'))
      .forEach((e) => {
        const card = gameManager.deckData(character).abilities.find((a) => a.cardId === e.cardId);
        if (card) {
          const mapping = this.enhancementMapping(
            !e.actionIndex.includes('bottom') ? card.actions : card.bottomActions || [],
            !e.actionIndex.includes('bottom') ? '' : 'bottom'
          );
          if (mapping.length && mapping[e.index]) {
            e.actionIndex = mapping[e.index];
            e.index = e.index - mapping.indexOf(e.actionIndex);
          }
        }
      });
  }

  enhancementMapping(actions: Action[], parentIndex: string): string[] {
    const mapping: string[] = [];
    actions.forEach((action, index) => {
      if (action.type !== ActionType.custom || action.value !== '%character.abilities.wip%') {
        const actionId = (parentIndex ? parentIndex + '-' : '') + index;
        if (action.enhancementTypes) {
          action.enhancementTypes.forEach(() => {
            mapping.push(actionId);
          });
        }
        if (action.subActions) {
          mapping.push(...this.enhancementMapping(action.subActions, actionId));
        }
      }
    });

    return mapping;
  }

  getActiveCharacters(): Character[] {
    return this.game.figures
      .filter((figure) => figure instanceof Character && gameManager.gameplayFigure(figure) && !figure.absent)
      .map((figure) => figure as Character);
  }
}
