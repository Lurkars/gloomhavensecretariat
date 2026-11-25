import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { SelectResourceResult } from 'src/app/game/model/data/BuildingData';
import { AdditionalIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import {
  appliableLootTypes,
  enhancableLootTypes,
  fullLootDeck,
  Loot,
  LootDeck,
  LootDeckConfig,
  LootType,
  resourceLootTypes
} from 'src/app/game/model/data/Loot';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Game } from 'src/app/game/model/Game';
import { GameScenarioModel } from 'src/app/game/model/Scenario';
import { deckMove, deckMoveValid } from 'src/app/game/util/deck';

export const LOOT_RANDOM_ITEM_MARKER = 'loot-random-item';

export type CharacterResources = { character: Character; gold: number; experience: number; loot: Partial<Record<LootType, number>> };

export class LootManager {
  game: Game;
  easterParty: boolean = false;
  easter: boolean = false;

  constructor(game: Game) {
    this.game = game;
  }

  drawCard(deck: LootDeck, character: Character | undefined = undefined): ItemData | undefined {
    let result: ItemData | undefined = undefined;
    if (deck.current + 1 >= deck.cards.length) {
      return result;
    }
    deck.current++;

    const loot = deck.cards[deck.current];
    if (loot) {
      if (settingsManager.settings.applyLoot && character) {
        result = this.applyLoot(loot, character, deck.current);
      }

      if (loot.type === LootType.random_item && this.game.scenario && this.game.party.campaignMode) {
        this.game.party.randomItemLooted.push(
          new GameScenarioModel(this.game.scenario.index, this.game.scenario.edition, this.game.scenario.group)
        );
      }
    }

    return result;
  }

  applyLoot(loot: Loot, character: Character, index: number): ItemData | undefined {
    let result: ItemData | undefined = undefined;
    character.lootCards = character.lootCards || [];
    if (loot.type === LootType.money) {
      character.loot += this.getValue(loot);
    } else if (
      loot.type === LootType.random_item &&
      this.game.scenario &&
      this.game.party.campaignMode &&
      settingsManager.settings.drawRandomItem
    ) {
      result = gameManager.itemManager.drawRandomItem(this.game.scenario.edition);
      if (!result) {
        character.loot += 3;
      }
    }

    character.lootCards.push(index);

    if (gameManager.trialsManager.apply && gameManager.trialsManager.trialsEnabled) {
      const trialCharacter = this.game.figures.find(
        (figure) =>
          figure instanceof Character &&
          figure !== character &&
          figure.progress.trial &&
          figure.progress.trial.edition === 'fh' &&
          figure.progress.trial.name === '351'
      ) as Character;
      if (trialCharacter) {
        gameManager.entityManager.changeHealth(trialCharacter, trialCharacter, -Math.ceil(this.game.level / 3), true);
      }
    }

    return result;
  }

  lootCardHolder(index: number): Character | undefined {
    return this.game.figures.find((figure) => figure instanceof Character && figure.lootCards.includes(index)) as Character | undefined;
  }

  applyRandomItemEnabled(): boolean {
    return settingsManager.settings.characterItems && settingsManager.settings.applyLootRandomItem;
  }

  canApplyRandomItem(character: Character, index: number): boolean {
    const loot = this.game.lootDeck.cards[index];
    return !!loot && loot.type === LootType.random_item && this.game.figures.includes(character);
  }

  applyRandomItem(character: Character, index: number, item: ItemData): boolean {
    if (!this.canApplyRandomItem(character, index)) {
      return false;
    }
    gameManager.itemManager.addItemCount(item);
    if (!character.lootCards.includes(index)) {
      character.lootCards.push(index);
      character.lootCards.sort((a, b) => a - b);
    }
    if (character.progress.items.some((existing) => existing.name === '' + item.id && existing.edition === item.edition)) {
      character.progress.gold += gameManager.itemManager.itemSellValue(item);
    } else {
      const itemIdentifier: Identifier = new Identifier(item.id, item.edition);
      character.progress.items.push(itemIdentifier);
      character.progress.equippedItems.push(
        new AdditionalIdentifier(itemIdentifier.name, itemIdentifier.edition, undefined, LOOT_RANDOM_ITEM_MARKER)
      );
    }
    return true;
  }

  lootRandomItem(character: Character): ItemData | undefined {
    const identifier = character.progress.equippedItems.find((value) => value.marker === LOOT_RANDOM_ITEM_MARKER);
    return identifier ? gameManager.itemManager.getItem(identifier.name, identifier.edition, true) : undefined;
  }

  removeLootCard(character: Character, index: number): ItemData | undefined {
    const loot = this.game.lootDeck.cards[index];
    character.lootCards = character.lootCards.filter((value) => value !== index);
    if (loot && loot.type === LootType.money) {
      character.loot -= this.getValue(loot);
    } else if (loot && loot.type === LootType.random_item) {
      const identifier = character.progress.equippedItems.find((value) => value.marker === LOOT_RANDOM_ITEM_MARKER);
      if (identifier) {
        character.progress.items = character.progress.items.filter(
          (value) => value.edition !== identifier.edition || value.name !== identifier.name
        );
        character.progress.equippedItems = character.progress.equippedItems.filter((value) => value !== identifier);
        return gameManager.itemManager.getItem(identifier.name, identifier.edition, true);
      }
    }
    return undefined;
  }

  canAssignLootCard(index: number, character: Character | undefined): boolean {
    const holder = this.lootCardHolder(index);
    return (
      Number.isInteger(index) &&
      !!this.game.lootDeck.cards[index] &&
      index <= this.game.lootDeck.current &&
      holder !== character &&
      (character ? this.game.figures.includes(character) : !!holder)
    );
  }

  assignLootCard(index: number, character: Character | undefined, applyRandomItem: boolean = false): ItemData | undefined {
    const loot = this.game.lootDeck.cards[index];
    const holder = this.lootCardHolder(index);
    if (!loot || !this.canAssignLootCard(index, character)) {
      return undefined;
    }
    const randomItem = holder ? this.removeLootCard(holder, index) : undefined;
    if (!character) {
      return undefined;
    }
    let result: ItemData | undefined;
    if (loot.type === LootType.random_item && randomItem) {
      result = randomItem;
      character.lootCards.push(index);
      character.lootCards.sort((a, b) => a - b);
    } else {
      result = this.applyLoot(loot, character, index);
    }
    if (result && applyRandomItem && this.applyRandomItemEnabled()) {
      this.applyRandomItem(character, index, result);
    }
    return result;
  }

  enhancementDeck(): Loot[] {
    return this.fullLootDeck()
      .filter((loot) => enhancableLootTypes.includes(loot.type))
      .sort((a, b) => a.cardId - b.cardId);
  }

  changeEnhancement(enhancementDeck: Loot[], loot: Loot, value: number) {
    loot.enhancements = Math.max(0, loot.enhancements + value);
    this.game.lootDeckEnhancements = enhancementDeck.filter((other) => other.enhancements > 0);
  }

  setFixed(type: LootType, value: boolean) {
    this.game.lootDeckFixed = this.game.lootDeckFixed.filter((fixed) => fixed !== type);
    if (value) {
      this.game.lootDeckFixed.push(type);
    }
  }

  canRemoveCard(deck: LootDeck, index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < deck.cards.length;
  }

  removeCard(deck: LootDeck, index: number): boolean {
    if (!this.canRemoveCard(deck, index)) {
      return false;
    }
    if (index <= deck.current) {
      deck.current--;
    }
    deck.cards.splice(index, 1);
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.lootCards = figure.lootCards.filter((other) => other !== index).map((other) => (other < index ? other : other - 1));
      }
    });
    return true;
  }

  dropUpcomingLootCards(deck: LootDeck) {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.lootCards = figure.lootCards.filter((index) => index <= deck.current);
      }
    });
  }

  lootDeckSectionApplied(section: string): boolean {
    return this.game.party.conclusions.some(
      (model) => model.edition === gameManager.editionManager.currentEdition() && model.index === section
    );
  }

  removeLootDeckSection(section: string) {
    gameManager.campaignManager.removeConclusion(gameManager.editionManager.currentEdition(), section);
  }

  addLootDeckSection(section: string, character: Character | undefined = undefined) {
    const edition = gameManager.editionManager.currentEdition();
    this.game.lootDeckSections.push(section);
    if (!this.lootDeckSectionApplied(section)) {
      this.game.party.conclusions.push(new GameScenarioModel(section, edition));
    }
    const rewards = gameManager.editionManager
      .sectionData(edition)
      .find((sectionData) => sectionData.index === section && sectionData.conclusion)?.rewards;
    if (!rewards) {
      return;
    }
    if (character) {
      if (rewards.lootingGold) {
        character.progress.gold += EntityValueFunction(rewards.lootingGold);
      }
      (rewards.items || []).forEach((item) => {
        if (!character.progress.items.some((value) => value.edition === edition && value.name === item)) {
          character.progress.items.push(new Identifier(item, edition));
        }
      });
    }
    (rewards.removeLootDeckCards || []).forEach((cardId) => {
      const loot = fullLootDeck.find((loot) => loot.cardId === cardId);
      if (loot && this.game.lootDeckFixed.includes(loot.type)) {
        this.game.lootDeckFixed.splice(this.game.lootDeckFixed.indexOf(loot.type), 1);
      }
    });
  }

  canMoveCard(deck: LootDeck, fromList: string, fromIndex: number, toList: string, toIndex: number): boolean {
    return deckMoveValid(deck.current, deck.cards.length, fromList, fromIndex, toList, toIndex);
  }

  moveCard(deck: LootDeck, fromList: string, fromIndex: number, toList: string, toIndex: number): boolean {
    if (!this.canMoveCard(deck, fromList, fromIndex, toList, toIndex)) {
      return false;
    }
    const result = deckMove(deck.current, fromList, fromIndex, toList, toIndex, deck.cards);
    deck.current = result.current;
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character && figure.lootCards) {
        figure.lootCards = figure.lootCards
          .map((index) => {
            if (result.from < result.to && index > result.from && index <= result.to) {
              index--;
            } else if (result.from > result.to && index >= result.to && index < result.from) {
              index++;
            } else if (index === result.from) {
              index = result.to;
            }
            return index;
          })
          .filter((index) => index <= deck.current)
          .sort((a, b) => a - b);
      }
    });
    return true;
  }

  shuffleDeck(deck: LootDeck, onlyUpcoming: boolean = false) {
    const current = deck.current;
    const restoreCards: Loot[] = onlyUpcoming && current > -1 ? deck.cards.splice(0, current + 1) : [];
    deck.current = -1;
    gameManager.randomManager.shuffle(deck.cards);
    if (onlyUpcoming) {
      deck.current = current;
      deck.cards.unshift(...restoreCards);
    }
  }

  // value of the drawn loot cards of a character per loot type
  characterLoot(character: Character): Partial<Record<LootType, number>> {
    const loot: Partial<Record<LootType, number>> = {};
    (character.lootCards || []).forEach((index) => {
      const card = this.game.lootDeck.cards[index];
      if (card) {
        loot[card.type] = (loot[card.type] || 0) + this.getValue(card);
      }
    });
    return loot;
  }

  characterLootValue(character: Character, lootType: LootType): number {
    return this.characterLoot(character)[lootType] || 0;
  }

  getTotal(deck: LootDeck, type: LootType): number {
    const cards = deck.cards.filter((loot) => loot.type === type);
    if (cards.length === 0) {
      return 0;
    }
    return cards.map((loot) => this.getValue(loot)).reduce((a, b) => a + b);
  }

  addCharacterLoot(character: Character, loot: Loot) {
    const value = this.getValue(loot);
    if (loot.type === LootType.money) {
      character.loot += value;
    } else if (appliableLootTypes.includes(loot.type)) {
      const current = character.progress.loot[loot.type] || 0;
      if (current + value >= 0) {
        character.progress.loot[loot.type] = current + value;
      }

      if (value > 0) {
        gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.loot);
        gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.looted, loot.type);
        gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.differentHerbs, loot.type);
      }
    }
  }

  getValue(loot: Loot, enhancements: boolean = true): number {
    const charCount = gameManager.characterManager.characterCount();
    let value = loot.value4P;
    if (charCount <= 2) {
      value = loot.value2P;
    } else if (charCount === 3) {
      value = loot.value3P;
    }

    if (enhancements) {
      value += loot.enhancements;
    }

    return value;
  }

  firstRound(): void {
    this.shuffleDeck(this.game.lootDeck);
  }

  update() {
    if (settingsManager.settings.fhShareResources) {
      this.game.figures.forEach((figure) => {
        if (figure instanceof Character) {
          for (const key of Object.keys(figure.progress.loot)) {
            const loot = key as LootType;
            this.game.party.loot[loot] = (this.game.party.loot[loot] || 0) + (figure.progress.loot[loot] || 0);
            figure.progress.loot[loot] = 0;
          }
        }
      });
    }

    if (this.game.party.name !== 'Paws of the Lion') {
      this.easterParty = false;
      this.easter = false;
    } else if (!this.easterParty) {
      this.easterParty = true;
      this.easter = true;
    }
  }

  fullLootDeck(): Loot[] {
    const availableCards: Loot[] = JSON.parse(JSON.stringify(fullLootDeck));

    this.game.lootDeckEnhancements.forEach((loot) => {
      if (loot.enhancements > 0) {
        const replacement = availableCards.find(
          (other) =>
            other.type === loot.type &&
            other.value2P === loot.value2P &&
            other.value3P === loot.value3P &&
            other.value4P === loot.value4P &&
            other.enhancements === 0
        );
        if (!replacement) {
          console.warn(
            'Enhancement of non-available loot card: ' + loot.type + ':' + loot.value4P + ':' + loot.value3P + ':' + loot.value2P
          );
          return;
        }

        availableCards.splice(availableCards.indexOf(replacement), 1, JSON.parse(JSON.stringify(loot)));
      }
    });

    return availableCards;
  }

  apply(deck: LootDeck, config: LootDeckConfig = {}) {
    deck.cards = [];
    Object.values(LootType).forEach((type) => {
      const availableTypes: Loot[] = gameManager.randomManager.shuffle(this.fullLootDeck().filter((loot) => loot.type === type)) as Loot[];
      const count = Math.min(Math.max(config[type] || 0), availableTypes.length);
      if (type !== LootType.special1 && type !== LootType.special2) {
        for (let i = 0; i < count; i++) {
          const loot: Loot = availableTypes[i];
          if (type !== LootType.random_item || !this.randomItemLooted()) {
            deck.cards.push(loot);
          }
        }
      } else if (count > 0) {
        const loot: Loot = availableTypes[0];
        deck.cards.push(loot);
        if (
          !this.game.lootDeckFixed.includes(loot.type) &&
          (type !== LootType.special2 || !this.game.party.conclusions.find((value) => value.edition === 'fh' && value.index === '128.5')) &&
          (type !== LootType.special1 || !this.game.party.conclusions.find((value) => value.edition === 'fh' && value.index === '133.4'))
        ) {
          this.game.lootDeckFixed.push(loot.type);
        }
      } else {
        this.game.lootDeckFixed = this.game.lootDeckFixed.filter((lootType) => lootType !== type);
        deck.cards = deck.cards.filter((loot) => loot.type !== type);
      }
    });
    this.shuffleDeck(deck);
  }

  randomItemLooted(): boolean {
    return (
      this.game.party.randomItemLooted.find(
        (model) =>
          this.game.scenario &&
          model.index === this.game.scenario.index &&
          model.edition === this.game.scenario.edition &&
          model.group === this.game.scenario.group
      ) !== undefined
    );
  }

  valueLabel(loot: Loot): string {
    if (loot.value4P === loot.value3P && loot.value3P === loot.value2P) {
      return '' + (loot.value4P > 0 ? loot.value4P : '');
    } else if (loot.value4P === loot.value3P && loot.value3P !== loot.value2P) {
      return '%game.loot.player.3-4% +' + loot.value4P + '/%game.loot.player.2% +' + loot.value2P;
    } else if (loot.value4P !== loot.value3P && loot.value3P === loot.value2P) {
      return '%game.loot.player.4% +' + loot.value4P + '/%game.loot.player.2-3% +' + loot.value2P;
    } else {
      return '%game.loot.player.4% +' + loot.value4P + '/%game.loot.player.3% +' + loot.value3P + '/%game.loot.player.2% +' + loot.value2P;
    }
  }

  private resourcesValid(loot: Partial<Record<LootType, number>>): boolean {
    return resourceLootTypes.every((type) => {
      const value = loot[type];
      return value === undefined || value === null || (Number.isInteger(value) && value >= 0);
    });
  }

  canSetResources(partyLoot: Partial<Record<LootType, number>>, characters: CharacterResources[]): boolean {
    return (
      this.resourcesValid(partyLoot) &&
      characters.every(
        (value) =>
          this.game.figures.includes(value.character) &&
          Number.isInteger(value.gold) &&
          value.gold >= 0 &&
          Number.isInteger(value.experience) &&
          value.experience >= 0 &&
          this.resourcesValid(value.loot)
      )
    );
  }

  setResources(partyLoot: Partial<Record<LootType, number>>, characters: CharacterResources[]): boolean {
    if (!this.canSetResources(partyLoot, characters)) {
      return false;
    }
    resourceLootTypes.forEach((type) => (this.game.party.loot[type] = partyLoot[type] || undefined));
    characters.forEach((value) => {
      value.character.progress.gold = value.gold;
      value.character.progress.experience = value.experience;
      resourceLootTypes.forEach((type) => (value.character.progress.loot[type] = value.loot[type] || undefined));
    });
    return true;
  }

  applySelectResources(result: SelectResourceResult) {
    result.characters.forEach((character, index) => {
      if (result.characterSpent[index].gold) {
        character.progress.gold -= result.characterSpent[index].gold;
      }
      if (result.characterSpent[index].hide) {
        character.progress.loot[LootType.hide] = (character.progress.loot[LootType.hide] || 0) - result.characterSpent[index].hide;
      }
      if (result.characterSpent[index].lumber) {
        character.progress.loot[LootType.lumber] = (character.progress.loot[LootType.lumber] || 0) - result.characterSpent[index].lumber;
      }
      if (result.characterSpent[index].metal) {
        character.progress.loot[LootType.metal] = (character.progress.loot[LootType.metal] || 0) - result.characterSpent[index].metal;
      }
      const received = result.characterReceived[index];
      if (received) {
        if (received.gold) {
          character.progress.gold += received.gold;
        }
        if (received.hide) {
          character.progress.loot[LootType.hide] = (character.progress.loot[LootType.hide] || 0) + received.hide;
        }
        if (received.lumber) {
          character.progress.loot[LootType.lumber] = (character.progress.loot[LootType.lumber] || 0) + received.lumber;
        }
        if (received.metal) {
          character.progress.loot[LootType.metal] = (character.progress.loot[LootType.metal] || 0) + received.metal;
        }
      }
    });
    if (result.fhSupportSpent.hide) {
      this.game.party.loot[LootType.hide] = (this.game.party.loot[LootType.hide] || 0) - result.fhSupportSpent.hide;
    }
    if (result.fhSupportSpent.lumber) {
      this.game.party.loot[LootType.lumber] = (this.game.party.loot[LootType.lumber] || 0) - result.fhSupportSpent.lumber;
    }
    if (result.fhSupportSpent.metal) {
      this.game.party.loot[LootType.metal] = (this.game.party.loot[LootType.metal] || 0) - result.fhSupportSpent.metal;
    }
    if (result.fhSupportSpent.manual) {
      this.game.party.inspiration -= result.fhSupportSpent.manual;
    }
    const fhSupportReceived = result.fhSupportReceived;
    if (fhSupportReceived) {
      ([LootType.hide, LootType.lumber, LootType.metal] as const).forEach((type) => {
        if (fhSupportReceived[type]) {
          this.game.party.loot[type] = (this.game.party.loot[type] || 0) + fhSupportReceived[type];
        }
      });
    }
  }
}
