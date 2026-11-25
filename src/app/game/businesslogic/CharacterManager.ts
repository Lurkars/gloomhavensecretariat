import { gameManager, labelManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { AttackModifier, AttackModifierType, CsOakDeckAttackModifier } from 'src/app/game/model/data/AttackModifier';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Condition, ConditionName } from 'src/app/game/model/data/Condition';
import { FigureError, FigureErrorType } from 'src/app/game/model/data/FigureError';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { SummonState } from 'src/app/game/model/Summon';

export type CharacterProgressField = 'gold' | 'extraPerks' | 'retirements' | 'battleGoals' | 'notes' | 'itemNotes';

const CHARACTER_PROGRESS_NUMBERS: string[] = ['gold', 'extraPerks', 'retirements', 'battleGoals'];
export const CHARACTER_MAX_BATTLE_GOALS = 18;

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
      characterData = gameManager.editionManager.getCharacterData(character, edition);
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
    const characterData = gameManager.editionManager.getCharacterData(character);
    if (!characterData.identities || characterData.identities.length === 0) {
      return this.characterIcon(character);
    }

    return (
      './assets/images/character/icons/' + characterData.edition + '-' + characterData.name + '-' + characterData.identities[index] + '.svg'
    );
  }

  characterIdentityColor(character: string, index: number): string {
    const characterData = gameManager.editionManager.getCharacterData(character);
    return characterData.identityColors[index] || characterData.color;
  }

  characterName(character: Character, full: boolean = false, icon: boolean = false, identity: boolean = true): string {
    let name = labelManager.getLabel('data.character.' + character.edition + '.' + character.name);
    let hasTitle = false;
    if (identity && character.identities.length > 0 && settingsManager.settings.characterIdentities) {
      if (character.title && character.title.split('|')[character.identity] && character.title.split('|')[character.identity]) {
        name = character.title.split('|')[character.identity];
        hasTitle = true;
      } else if (settingsManager.settings.characterIdentityHint && !full) {
        name +=
          ' (' +
          labelManager.getLabel(
            'data.character.' + character.edition + '.' + character.name + '.' + character.identities[character.identity]
          ) +
          ')';
      }
    } else if (character.title) {
      name = character.title;
      hasTitle = true;
    }
    if (full && hasTitle) {
      name += ' (' + labelManager.getLabel('data.character.' + character.edition + '.' + character.name) + ')';
    }

    if (icon) {
      name = '%game.characterIconColored.' + character.name + '%' + name;
    }

    if (
      this.game.figures.find(
        (figure) => figure instanceof Character && figure.name === character.name && figure.edition !== character.edition
      )
    ) {
      name += ' [' + labelManager.getLabel('data.edition.' + character.edition) + ']';
    }

    return name;
  }

  characterColor(character: CharacterData | string): string {
    let characterData: CharacterData;
    if (character instanceof CharacterData) {
      characterData = character;
    } else {
      characterData = gameManager.editionManager.getCharacterData(character);
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
        .forEach((summonData) => gameManager.summonManager.createSpecialSummon(character, summonData));

      character.number = 1;
      while (this.game.figures.some((figure) => figure instanceof Character && figure.number === character.number)) {
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
      gameManager.entityCounterManager.addEntityCount(character);

      gameManager.enhancementsManager.previousEnhancements(character, gameManager.enhancementsManager.temporary);

      if (this.game.state === GameState.next) {
        gameManager.attackModifierManager.shuffleModifiers(character.attackModifierDeck);
      }
      gameManager.roundManager.sortFigures(character);
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
    if (character && gameManager.characterRpgManager.isRpgCharacter(character)) {
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

  donate(character: Character): boolean {
    if (!this.canDonate(character)) {
      return false;
    }
    const costs = this.donationCosts();
    character.progress.donations += 1;
    character.donations += 1;
    this.game.party.donations += 1;
    character.progress.gold -= costs;
    gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.donations);
    gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.donatedGold);
    return true;
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
      const characterData = gameManager.editionManager
        .charactersData(edition)
        .find((data) => data.name === name && data.edition === edition);
      gameManager.eventCardManager.addEvents(characterData && characterData.unlockEvent);
    }
    return true;
  }

  lockCharacter(edition: string, name: string) {
    this.game.unlockedCharacters = this.game.unlockedCharacters.filter((unlock) => unlock !== edition + ':' + name);
  }

  lockAllCharacters() {
    this.game.unlockedCharacters = [];
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

  removeAllCharacters() {
    (this.game.figures.filter((figure) => figure instanceof Character) as Character[]).forEach((character) =>
      this.removeCharacter(character)
    );
  }

  setCharacterMarker(character: Character, marker: boolean): boolean {
    if (typeof marker !== 'boolean') {
      return false;
    }
    character.marker = marker;
    return true;
  }

  // the last present character can not be set absent
  canSetAbsent(character: Character, absent: boolean): boolean {
    return typeof absent === 'boolean' && (!absent || character.absent || this.characterCount() > 1);
  }

  setAbsent(character: Character, absent: boolean): boolean {
    if (!this.canSetAbsent(character, absent)) {
      return false;
    }
    character.absent = absent;
    if (character.absent && character.active) {
      gameManager.turnManager.toggleFigure(character);
    }
    return true;
  }

  // starting the turn needs a present, not exhausted character (with initiative if required)
  canActivate(character: Character): boolean {
    return (
      this.game.state === GameState.next &&
      !character.active &&
      !character.absent &&
      !character.exhausted &&
      (!settingsManager.settings.initiativeRequired || character.initiative > 0)
    );
  }

  // the turn of the active character can always be ended, even if exhausted or set absent meanwhile
  canDeactivate(character: Character): boolean {
    return this.game.state === GameState.next && character.active;
  }

  canToggleActive(character: Character): boolean {
    return character.active ? this.canDeactivate(character) : this.canActivate(character);
  }

  canAddXP(character: Character, value: number): boolean {
    return Number.isInteger(value);
  }

  addXP(character: Character, value: number, levelUp: boolean = true): boolean {
    if (!this.canAddXP(character, value)) {
      return false;
    }
    character.progress.experience = Math.max(0, character.progress.experience + value);
    if (levelUp) {
      this.setLevel(character, this.levelForXp(character.progress.experience));
    }
    return true;
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
    if (gameManager.characterRpgManager.isRpgCharacter(character)) {
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

  canChangeExperience(character: Character, value: number): boolean {
    return Number.isInteger(value) && value !== 0;
  }

  changeExperience(character: Character, value: number): boolean {
    if (!this.canChangeExperience(character, value)) {
      return false;
    }
    character.experience = Math.max(0, character.experience + value);
    return true;
  }

  progressEditable(): boolean {
    return !gameManager.scenarioManager.scenarioRunning();
  }

  canSetPerk(character: Character, index: number, value: number, force: boolean = false, anyPhase: boolean = false): boolean {
    const perk = Number.isInteger(index) ? character.perks[index] : undefined;
    if (!perk || !Number.isInteger(value) || value < 0 || value > perk.count) {
      return false;
    }
    if (force) {
      return true;
    }
    const current = character.progress.perks[index] || 0;
    return (anyPhase || this.progressEditable()) && (value <= current || value - current <= this.availablePerks(character));
  }

  canSetMastery(character: Character, index: number, value: boolean): boolean {
    return (
      Number.isInteger(index) &&
      index >= 0 &&
      index < character.masteries.length &&
      typeof value === 'boolean' &&
      (character.progress.masteries || []).includes(index) !== value
    );
  }

  setMastery(character: Character, index: number, value: boolean): boolean {
    if (!this.canSetMastery(character, index, value)) {
      return false;
    }
    character.progress.masteries = (character.progress.masteries || []).filter((mastery) => mastery !== index);
    if (value) {
      character.progress.masteries.push(index);
    }
    return true;
  }

  canSetProgressValue(character: Character, field: CharacterProgressField, value: string | number): boolean {
    if (field === 'notes' || field === 'itemNotes') {
      return typeof value === 'string';
    }
    return (
      CHARACTER_PROGRESS_NUMBERS.includes(field) &&
      Number.isInteger(value) &&
      (value as number) >= 0 &&
      (field !== 'battleGoals' || (value as number) <= CHARACTER_MAX_BATTLE_GOALS)
    );
  }

  setProgressValue(character: Character, field: CharacterProgressField, value: string | number): boolean {
    if (!this.canSetProgressValue(character, field, value)) {
      return false;
    }
    (character.progress as unknown as Record<string, string | number>)[field] = value;
    return true;
  }

  nextIdentity(character: Character): number {
    return character.identity + 1 < character.identities.length ? character.identity + 1 : 0;
  }

  canSetIdentity(character: Character, identity: number): boolean {
    return (
      Number.isInteger(identity) &&
      identity >= 0 &&
      identity < character.identities.length &&
      !gameManager.specialActionsManager.isIdentityLocked(character)
    );
  }

  setIdentity(character: Character, identity: number): boolean {
    if (!this.canSetIdentity(character, identity)) {
      return false;
    }
    character.identity = identity;
    return true;
  }

  canSetPlayerNumber(character: Character, number: number): boolean {
    return Number.isInteger(number) && number > 0 && number !== character.number;
  }

  // a character already using the number gets the old number of this character
  setPlayerNumber(character: Character, number: number): boolean {
    if (!this.canSetPlayerNumber(character, number)) {
      return false;
    }
    const existing = this.game.figures.find((figure) => figure instanceof Character && figure.number === number) as Character | undefined;
    if (existing) {
      existing.number = character.number;
    }
    character.number = number;
    return true;
  }

  tokenAfter(character: Character, value: number): number {
    return Math.max(0, character.token + value);
  }

  canChangeToken(value: number): boolean {
    return Number.isInteger(value) && value !== 0;
  }

  changeToken(character: Character, value: number): boolean {
    if (!this.canChangeToken(value)) {
      return false;
    }
    character.token = this.tokenAfter(character, value);
    return true;
  }

  // token values can not drop below 0 and are limited for some characters
  tokenValueAfter(character: Character, index: number, value: number): number {
    const tokenValue = Math.max(0, (character.tokenValues[index] || 0) + value);
    const maxTokenValue = gameManager.specialActionsManager.maxTokenValue(character, index);
    return maxTokenValue !== undefined ? Math.min(tokenValue, maxTokenValue) : tokenValue;
  }

  canChangeTokenValue(character: Character, index: number, value: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < character.tokens.length && Number.isInteger(value) && value !== 0;
  }

  changeTokenValue(character: Character, index: number, value: number): boolean {
    if (!this.canChangeTokenValue(character, index, value)) {
      return false;
    }
    character.tokenValues[index] = this.tokenValueAfter(character, index, value);
    return true;
  }

  canSetResource(type: LootType, value: number): boolean {
    return Object.values(LootType).includes(type) && Number.isInteger(value) && value >= 0;
  }

  setResource(character: Character, type: LootType, value: number): boolean {
    if (!this.canSetResource(type, value)) {
      return false;
    }
    character.progress.loot[type] = value;
    return true;
  }

  normalizeProgress(character: Character) {
    for (let i = 0; i < 15; i++) {
      character.progress.perks[i] = character.progress.perks[i] || 0;
    }
    const minExperience = this.xpMap[character.level - 1];
    if (minExperience !== undefined && character.progress.experience < minExperience) {
      character.progress.experience = minExperience;
    }
  }

  changeLoot(character: Character, value: number) {
    const lootBefore = character.loot;
    character.loot = Math.max(0, character.loot + value);
    gameManager.personalQuestManager.trackMoneyTokens(character, character.loot - lootBefore);
  }

  attackModifierDeckToggleHides(character: Character): boolean {
    const settings = settingsManager.settings;
    return (
      character.attackModifierDeckVisible &&
      (settings.characterAttackModifierDeckActiveBottom ||
        !settings.characterAttackModifierDeckPermanent ||
        !settings.characterAttackModifierDeckPermanentActive ||
        !character.active)
    );
  }

  toggleAttackModifierDeckVisible(character: Character) {
    const settings = settingsManager.settings;
    const characters = this.game.figures.filter((figure) => figure instanceof Character);
    if (settings.characterAttackModifierDeckActiveBottom) {
      if (!character.attackModifierDeckVisible) {
        characters.forEach((other) => (other.attackModifierDeckVisible = false));
        character.attackModifierDeckVisible = true;
      } else {
        character.attackModifierDeckVisible = false;
        if (settings.characterAttackModifierDeckPermanentActive && !character.active) {
          characters.filter((other) => other.active).forEach((other) => (other.attackModifierDeckVisible = true));
        }
      }
    } else if (this.attackModifierDeckToggleHides(character)) {
      character.attackModifierDeck.active = false;
      character.attackModifierDeckVisible = false;
    } else {
      character.attackModifierDeck.active = true;
      character.attackModifierDeckVisible = true;
      character.lootCardsVisible = false;
    }
  }

  toggleLootCardsVisible(character: Character) {
    if (character.lootCardsVisible) {
      character.lootCardsVisible = false;
    } else {
      character.lootCardsVisible = true;
      character.attackModifierDeck.active = false;
      character.attackModifierDeckVisible = false;
    }
  }

  toggleItemsVisible(character: Character) {
    character.itemsVisible = !character.itemsVisible;
  }

  activate(character: Character): boolean {
    if (!this.canActivate(character)) {
      return false;
    }
    gameManager.turnManager.toggleFigure(character);
    return true;
  }

  deactivate(character: Character): boolean {
    if (!this.canDeactivate(character)) {
      return false;
    }
    if (this.activateSummonsAfterTurn(character)) {
      character.summons.filter((summon) => summon.afterTurn).forEach((summon) => (summon.afterTurnActive = true));
    }
    gameManager.turnManager.toggleFigure(character);
    return true;
  }

  toggleActive(character: Character): boolean {
    return character.active ? this.deactivate(character) : this.activate(character);
  }

  setPerk(character: Character, index: number, value: number, force: boolean = false, anyPhase: boolean = false): boolean {
    if (!this.canSetPerk(character, index, value, force, anyPhase)) {
      return false;
    }
    const shackles = character.name === 'shackles' && character.edition === 'fh' && index === 11;
    const lowerShacklesHP = shackles && character.progress.perks[index] === 2;
    character.progress.perks[index] = value;

    const perk = character.perks[index];
    if (value !== perk.count) {
      (character.specialActions || [])
        .filter((specialAction) => specialAction.perk === index + 1)
        .forEach((specialAction) =>
          [character, ...character.summons]
            .filter((entity) => entity.tags.includes(specialAction.name))
            .forEach((entity) => gameManager.specialActionsManager.removeSpecialAction(entity, character, specialAction.name))
        );
    }
    if (perk.monsterDeck) {
      this.game.monsterAttackModifierDeck = gameManager.attackModifierBuildManager.buildMonsterAttackModifierDeck();
      gameManager.attackModifierManager.shuffleModifiers(this.game.monsterAttackModifierDeck);
    } else {
      gameManager.attackModifierBuildManager.mergeAttackModifierDeck(
        character.attackModifierDeck,
        gameManager.attackModifierBuildManager.buildCharacterAttackModifierDeck(character)
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
    return true;
  }

  canSetLevel(character: Character, level: number): boolean {
    return Number.isInteger(level) && level >= 1 && level <= 9;
  }

  setLevel(character: Character, level: number): boolean {
    if (!this.canSetLevel(character, level)) {
      return false;
    }
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
      .forEach((summonData) => gameManager.summonManager.createSpecialSummon(character, summonData));

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
      character.attackModifierDeck = gameManager.attackModifierBuildManager.buildCharacterAttackModifierDeck(character);
    }
    return true;
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
        summonsToRemove.forEach((summon) => gameManager.summonManager.removeSummon(figure, summon));

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
        gameManager.characterAbilityManager.endRound(figure);

        if (
          figure.progress.equippedItems.find((identifier) => identifier.edition === 'cs' && identifier.name === '57') &&
          gameManager.conditionManager.hasCondition(figure, new Condition(ConditionName.wound)) &&
          !gameManager.conditionManager.hasCondition(figure, new Condition(ConditionName.regenerate))
        ) {
          gameManager.conditionManager.addCondition(figure, figure, new Condition(ConditionName.regenerate));
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

  getActiveCharacters(): Character[] {
    return this.game.figures
      .filter((figure) => figure instanceof Character && gameManager.entityManager.gameplayFigure(figure) && !figure.absent)
      .map((figure) => figure as Character);
  }
}
