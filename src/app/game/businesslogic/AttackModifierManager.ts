import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import {
  additionalTownGuardAttackModifier,
  AdvancedImbueAttackModifier,
  AttackModifier,
  AttackModifierDeck,
  AttackModifierEffect,
  AttackModifierType,
  AttackModifierValueType,
  AttackResult,
  CsOakDeckAttackModifier,
  defaultAttackModifier,
  defaultTownGuardAttackModifier,
  Gh2ESealedDeckAttackModifier,
  ImbuementAttackModifier,
  RPG_BLESS_CURSE_LIMIT,
  RpgAttackModifier,
  RpgAttackModifierCards
} from 'src/app/game/model/data/AttackModifier';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Game } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { deckMove, deckMoveValid } from 'src/app/game/util/deck';
import { evaluateExpression } from 'src/app/game/util/ExpressionEvaluator';

export class AttackModifierManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  allyDeckEnabled(): boolean {
    return (
      settingsManager.settings.allyAttackModifierDeck &&
      (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules(true) || !!this.game.scenario?.allyDeck)
    );
  }

  // the ally deck is shown when enabled and actually used by a figure (always shown with alwaysAllyAttackModifierDeck)
  allyDeckVisible(): boolean {
    if (!this.allyDeckEnabled()) {
      return false;
    }
    return (
      settingsManager.settings.alwaysAllyAttackModifierDeck ||
      !!this.game.scenario?.allyDeck ||
      this.game.figures.some(
        (figure) =>
          (figure instanceof Monster && (figure.isAlly || figure.isAllied)) ||
          (figure instanceof ObjectiveContainer &&
            (figure.amDeck === 'A' ||
              (!!figure.objectiveId && !!gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId)?.allyDeck)))
      )
    );
  }

  private objectiveCharacter(figure: ObjectiveContainer): Character | undefined {
    if (!figure.amDeck || figure.amDeck === 'M' || figure.amDeck === 'A' || !settingsManager.settings.characterAttackModifierDeck) {
      return undefined;
    }
    return this.game.figures.find((char) => char instanceof Character && char.name === figure.amDeck) as Character | undefined;
  }

  byFigure(figure: Figure): AttackModifierDeck {
    if (figure instanceof Character) {
      return figure.attackModifierDeck;
    } else if (figure instanceof Monster) {
      return this.allyDeckEnabled() && (figure.isAlly || figure.isAllied)
        ? this.game.allyAttackModifierDeck
        : this.game.monsterAttackModifierDeck;
    } else if (figure instanceof ObjectiveContainer && figure.amDeck) {
      if (figure.amDeck === 'A') {
        return this.allyDeckEnabled() ? this.game.allyAttackModifierDeck : this.game.monsterAttackModifierDeck;
      }
      const character = this.objectiveCharacter(figure);
      return character ? character.attackModifierDeck : this.game.monsterAttackModifierDeck;
    }

    return new AttackModifierDeck();
  }

  isMonsterDeck(figure: Figure): boolean {
    return (
      (figure instanceof Monster || figure instanceof ObjectiveContainer) && this.byFigure(figure) === this.game.monsterAttackModifierDeck
    );
  }

  /**
   * deck a draw for the given (active) figure uses, `character` is the owner of a character deck.
   * A hidden character deck has to be revealed first (see `drawForFigure`).
   */
  drawDeckFor(figure: Figure | undefined): { deck: AttackModifierDeck; character: Character | undefined } | undefined {
    if (figure instanceof Character) {
      if (!settingsManager.settings.characterAttackModifierDeck) {
        return { deck: this.game.monsterAttackModifierDeck, character: undefined };
      }
      const bottom = settingsManager.settings.characterAttackModifierDeckActiveBottom
        ? (this.game.figures.find((other) => other instanceof Character && other.attackModifierDeckVisible) as Character | undefined)
        : undefined;
      const character = bottom || figure;
      return { deck: character.attackModifierDeck, character: character };
    } else if (figure instanceof ObjectiveContainer) {
      if (!figure.amDeck) {
        return undefined;
      }
      const character = this.objectiveCharacter(figure);
      return { deck: this.byFigure(figure), character: character };
    } else if (figure instanceof Monster) {
      return { deck: this.byFigure(figure), character: undefined };
    }
    return { deck: this.game.monsterAttackModifierDeck, character: undefined };
  }

  // reveals a hidden character deck or draws from the deck of the figure, returns whether a card was drawn
  drawForFigure(figure: Figure | undefined, state: 'advantage' | 'disadvantage' | undefined = undefined): boolean {
    const target = this.drawDeckFor(figure);
    if (!target) {
      return false;
    }
    if (target.character && !target.character.attackModifierDeckVisible) {
      target.character.attackModifierDeckVisible = true;
      return false;
    }
    target.deck.active = true;
    this.drawModifier(target.deck, state, target.character);
    return true;
  }

  objectiveAmDecks(): string[] {
    const amDecks = ['M'];
    if (this.allyDeckEnabled()) {
      amDecks.push('A');
    }
    amDecks.push(...this.game.figures.filter((figure) => figure instanceof Character && !figure.absent).map((figure) => figure.name));
    return amDecks;
  }

  getModifier(type: AttackModifierType, count: number = 1): AttackModifier[] {
    return Array(count).fill(new AttackModifier(type));
  }

  modifierSupply(attackModifierDeck: AttackModifierDeck | undefined, type: AttackModifierType, isMonster: boolean = false): number {
    if (type === AttackModifierType.minus1extra) {
      return 15 - this.countExtraMinus1();
    }
    if (gameManager.rpgRules() && attackModifierDeck) {
      return RPG_BLESS_CURSE_LIMIT - this.countUpcoming(attackModifierDeck, type);
    }
    return 10 - (type === AttackModifierType.bless ? this.countUpcomingBlesses() : this.countUpcomingCurses(isMonster));
  }

  getBless(count: number = 1, attackModifierDeck: AttackModifierDeck | undefined = undefined): AttackModifier[] {
    return this.getModifier(
      AttackModifierType.bless,
      Math.max(0, Math.min(count, this.modifierSupply(attackModifierDeck, AttackModifierType.bless)))
    );
  }

  getCurse(isMonster: boolean, count: number = 1, attackModifierDeck: AttackModifierDeck | undefined = undefined): AttackModifier[] {
    return this.getModifier(
      AttackModifierType.curse,
      Math.max(0, Math.min(count, this.modifierSupply(attackModifierDeck, AttackModifierType.curse, isMonster)))
    );
  }

  countUpcoming(attackModifierDeck: AttackModifierDeck, type: AttackModifierType): number {
    return attackModifierDeck.cards.filter((attackModifier, index) => attackModifier.type === type && index > attackModifierDeck.current)
      .length;
  }

  defaultDeck(): AttackModifierDeck {
    return gameManager.rpgRules() ? new AttackModifierDeck(RpgAttackModifierCards) : new AttackModifierDeck();
  }

  updateDefaultDecks() {
    const rpg = gameManager.rpgRules();
    const isRpgDeck = (deck: AttackModifierDeck) => deck.cards.some((attackModifier) => attackModifier.attribute);
    if (this.game.monsterAttackModifierDeck.current < 0 && isRpgDeck(this.game.monsterAttackModifierDeck) !== rpg) {
      this.game.monsterAttackModifierDeck = gameManager.attackModifierBuildManager.buildMonsterAttackModifierDeck();
    }
    if (this.game.allyAttackModifierDeck.current < 0 && isRpgDeck(this.game.allyAttackModifierDeck) !== rpg) {
      this.game.allyAttackModifierDeck = gameManager.attackModifierBuildManager.buildMonsterAttackModifierDeck(true);
    }
  }

  countUpcomingBlesses(): number {
    let count = 0;
    if (
      settingsManager.settings.alwaysAllyAttackModifierDeck ||
      (gameManager.fhRules(true) && this.game.figures.some((figure) => figure instanceof Monster && (figure.isAlly || figure.isAllied)))
    ) {
      count += this.game.allyAttackModifierDeck.cards.filter((attackModifier, index) => {
        return attackModifier.type === AttackModifierType.bless && index > this.game.allyAttackModifierDeck.current;
      }).length;
    }

    count += this.game.monsterAttackModifierDeck.cards.filter((attackModifier, index) => {
      return attackModifier.type === AttackModifierType.bless && index > this.game.monsterAttackModifierDeck.current;
    }).length;

    this.game.figures
      .filter((figure) => figure instanceof Character)
      .map((figure) => figure as Character)
      .forEach((character) => {
        count += character.attackModifierDeck.cards.filter((attackModifier, index) => {
          return attackModifier.type === AttackModifierType.bless && index > character.attackModifierDeck.current;
        }).length;
      });
    return count;
  }

  countUpcomingCurses(isMonster: boolean): number {
    if (isMonster) {
      return this.game.monsterAttackModifierDeck.cards.filter((attackModifier, index) => {
        return attackModifier.type === AttackModifierType.curse && index > this.game.monsterAttackModifierDeck.current;
      }).length;
    }

    let count = 0;
    if (
      settingsManager.settings.alwaysAllyAttackModifierDeck ||
      (gameManager.fhRules(true) && this.game.figures.some((figure) => figure instanceof Monster && (figure.isAlly || figure.isAllied)))
    ) {
      count += this.game.allyAttackModifierDeck.cards.filter((attackModifier, index) => {
        return attackModifier.type === AttackModifierType.curse && index > this.game.allyAttackModifierDeck.current;
      }).length;
    }

    this.game.figures
      .filter((figure) => figure instanceof Character)
      .map((figure) => figure as Character)
      .forEach((character) => {
        count += character.attackModifierDeck.cards.filter((attackModifier, index) => {
          return attackModifier.type === AttackModifierType.curse && index > character.attackModifierDeck.current;
        }).length;
      });
    return count;
  }

  getAdditional(character: Character, type: AttackModifierType, count: number = 1): AttackModifier[] {
    const additional: AttackModifier[] = [];
    if (character.additionalModifier.find((perk) => perk.attackModifier && perk.attackModifier.type === type)) {
      character.additionalModifier.forEach((card, index) => {
        if (card.attackModifier && card.attackModifier.type === type) {
          const am = Object.assign(new AttackModifier(card.attackModifier.type), card.attackModifier);
          am.id = 'additional-' + character.name + index;
          am.character = true;
          const existing: number = this.countUpcomingAdditional(character, type, am.id);
          for (let i = 0; i < card.count - existing && additional.length < count; i++) {
            additional.push(am);
          }
        }
      });
    }
    return additional;
  }

  getAllAdditional(): AttackModifier[] {
    const additional: AttackModifier[] = [];

    gameManager.editionManager.charactersData().forEach((character) => {
      if (character.additionalModifier.find((perk) => perk.attackModifier)) {
        character.additionalModifier.forEach((card, index) => {
          if (card.attackModifier) {
            const am = Object.assign(new AttackModifier(card.attackModifier.type), card.attackModifier);
            am.id = 'additional-' + character.name + index;
            am.character = true;
            for (let i = 0; i < card.count; i++) {
              additional.push(am);
            }
          }
        });
      }
    });
    return additional;
  }

  /** additional modifier ids are 'additional-' + character name + index, `id` matches exactly, otherwise any index of the character */
  isAdditionalId(attackModifierId: string | undefined, character: Character, id?: string): boolean {
    if (!attackModifierId) {
      return false;
    }
    if (id) {
      return attackModifierId === id;
    }
    const prefix = 'additional-' + character.name;
    return attackModifierId.startsWith(prefix) && /^\d+$/.test(attackModifierId.slice(prefix.length));
  }

  countUpcomingAdditional(character: Character, type: AttackModifierType, id?: string) {
    let count = 0;
    if (
      settingsManager.settings.alwaysAllyAttackModifierDeck ||
      (gameManager.fhRules(true) && this.game.figures.some((figure) => figure instanceof Monster && (figure.isAlly || figure.isAllied)))
    ) {
      count += this.game.allyAttackModifierDeck.cards.filter((attackModifier, index) => {
        return (
          index > this.game.allyAttackModifierDeck.current &&
          attackModifier.type === type &&
          this.isAdditionalId(attackModifier.id, character, id)
        );
      }).length;
    }

    count += this.game.monsterAttackModifierDeck.cards.filter((attackModifier, index) => {
      return (
        index > this.game.monsterAttackModifierDeck.current &&
        attackModifier.type === type &&
        this.isAdditionalId(attackModifier.id, character, id)
      );
    }).length;

    this.game.figures
      .filter((figure) => figure instanceof Character)
      .map((figure) => figure as Character)
      .forEach((figure) => {
        count += figure.attackModifierDeck.cards.filter((attackModifier, index) => {
          return (
            index > figure.attackModifierDeck.current &&
            attackModifier.type === type &&
            this.isAdditionalId(attackModifier.id, character, id)
          );
        }).length;
      });

    return count;
  }

  getExtraMinus1(count: number = 1): AttackModifier[] {
    return this.getModifier(
      AttackModifierType.minus1extra,
      Math.max(0, Math.min(count, this.modifierSupply(undefined, AttackModifierType.minus1extra)))
    );
  }

  countExtraMinus1(): number {
    let count = 0;
    if (
      settingsManager.settings.alwaysAllyAttackModifierDeck ||
      (gameManager.fhRules(true) && this.game.figures.some((figure) => figure instanceof Monster && (figure.isAlly || figure.isAllied)))
    ) {
      count += this.game.allyAttackModifierDeck.cards.filter((attackModifier) => {
        return attackModifier.type === AttackModifierType.minus1extra;
      }).length;
    }

    count += this.game.monsterAttackModifierDeck.cards.filter((attackModifier) => {
      return attackModifier.type === AttackModifierType.minus1extra;
    }).length;

    this.game.figures
      .filter((figure) => figure instanceof Character)
      .map((figure) => figure as Character)
      .forEach((character) => {
        count += character.attackModifierDeck.cards.filter((attackModifier) => {
          return attackModifier.type === AttackModifierType.minus1extra;
        }).length;
      });

    return count;
  }

  addModifierBatch(attackModifierDeck: AttackModifierDeck, batch: AttackModifier[]) {
    batch.forEach((card) => this.addModifier(attackModifierDeck, card));
  }

  addModifier(attackModifierDeck: AttackModifierDeck, am: AttackModifier, index: number = -1, shuffle: boolean = true) {
    const attackModifier = Object.assign(new AttackModifier(am.type), am);
    if ((shuffle && index < 0) || index > attackModifierDeck.cards.length) {
      index = gameManager.randomManager.int(attackModifierDeck.cards.length - attackModifierDeck.current) + attackModifierDeck.current + 1;
      this.shuffleModifiers(attackModifierDeck, true);
    }
    if (index === -1) {
      index = attackModifierDeck.cards.length;
    }

    attackModifierDeck.cards = [...attackModifierDeck.cards.slice(0, index), attackModifier, ...attackModifierDeck.cards.slice(index)];
  }

  insertModifier(attackModifierDeck: AttackModifierDeck, attackModifier: AttackModifier, shuffled: boolean, register: boolean = false) {
    if (shuffled) {
      const index =
        attackModifierDeck.current + 1 + gameManager.randomManager.int(attackModifierDeck.cards.length - attackModifierDeck.current);
      attackModifierDeck.cards.splice(index, 0, attackModifier);
    } else {
      attackModifier.revealed = true;
      attackModifierDeck.cards.splice(attackModifierDeck.current + 1, 0, attackModifier);
    }
    if (register && !attackModifierDeck.attackModifiers.some((am) => am.id === attackModifier.id)) {
      attackModifierDeck.attackModifiers.push(attackModifier);
    }
  }

  addModifierByType(attackModifierDeck: AttackModifierDeck, type: AttackModifierType, respectSupplyLimit: boolean = true) {
    let modifiers: AttackModifier[] = [];
    if (respectSupplyLimit) {
      switch (type) {
        case AttackModifierType.bless:
          modifiers = this.getBless(1, attackModifierDeck);
          break;
        case AttackModifierType.curse:
          modifiers = this.getCurse(this.game.monsterAttackModifierDeck === attackModifierDeck, 1, attackModifierDeck);
          break;
        case AttackModifierType.minus1extra:
          modifiers = this.getExtraMinus1();
          break;
        default:
          modifiers.push(new AttackModifier(type));
      }
    } else {
      modifiers.push(new AttackModifier(type));
    }
    this.addModifierBatch(attackModifierDeck, modifiers);
  }

  removeModifierByType(attackModifierDeck: AttackModifierDeck, type: AttackModifierType) {
    const attackModifier = attackModifierDeck.cards.find((am) => am.type === type);
    if (attackModifier) {
      attackModifierDeck.cards.splice(attackModifierDeck.cards.indexOf(attackModifier), 1);
    }
  }

  canRemoveCard(attackModifierDeck: AttackModifierDeck, index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < attackModifierDeck.cards.length;
  }

  removeCard(attackModifierDeck: AttackModifierDeck, index: number): boolean {
    if (!this.canRemoveCard(attackModifierDeck, index)) {
      return false;
    }
    if (index <= attackModifierDeck.current) {
      attackModifierDeck.current--;
    }
    attackModifierDeck.cards.splice(index, 1);
    this.updateLastVisible(attackModifierDeck);
    return true;
  }

  toggleDeckActive(attackModifierDeck: AttackModifierDeck, exclusive: boolean = false) {
    if (exclusive && (this.game.lootDeck.active || this.game.challengeDeck.active)) {
      this.game.lootDeck.active = false;
      this.game.challengeDeck.active = false;
      attackModifierDeck.active = true;
    } else {
      attackModifierDeck.active = !attackModifierDeck.active;
    }
  }

  canSetDiscarded(attackModifierDeck: AttackModifierDeck, index: number, discarded: boolean, force: boolean = false): boolean {
    const attackModifier = attackModifierDeck.cards[index];
    return !!attackModifier && attackModifier.active && attackModifierDeck.discarded.includes(index) !== discarded && (discarded || force);
  }

  setDiscarded(attackModifierDeck: AttackModifierDeck, index: number, discarded: boolean, force: boolean = false): boolean {
    if (!this.canSetDiscarded(attackModifierDeck, index, discarded, force)) {
      return false;
    }
    attackModifierDeck.discarded = attackModifierDeck.discarded.filter((value) => value !== index);
    if (discarded) {
      attackModifierDeck.discarded.push(index);
    }
    return true;
  }

  deletedModifiers(attackModifierDeck: AttackModifierDeck, character: Character | undefined, townGuard: boolean = false): AttackModifier[] {
    const originalDeck = character
      ? gameManager.attackModifierBuildManager.buildCharacterAttackModifierDeck(character)
      : townGuard
        ? gameManager.attackModifierBuildManager.buildTownGuardAttackModifierDeck(
            this.game.party,
            gameManager.campaignManager.campaignData()
          )
        : this.defaultDeck();
    attackModifierDeck.cards.forEach((modifier) => {
      const card = originalDeck.cards.find((orginalCard) => orginalCard.id === modifier.id);
      if (card) {
        originalDeck.cards.splice(originalDeck.cards.indexOf(card), 1);
      }
    });
    return originalDeck.cards;
  }

  canRestoreCard(
    attackModifierDeck: AttackModifierDeck,
    attackModifier: AttackModifier,
    character: Character | undefined,
    townGuard: boolean = false
  ): boolean {
    return this.deletedModifiers(attackModifierDeck, character, townGuard).some((card) => card.id === attackModifier.id);
  }

  restoreCard(
    attackModifierDeck: AttackModifierDeck,
    attackModifier: AttackModifier,
    character: Character | undefined,
    townGuard: boolean = false
  ): boolean {
    if (!this.canRestoreCard(attackModifierDeck, attackModifier, character, townGuard)) {
      return false;
    }
    attackModifierDeck.cards.splice(attackModifierDeck.current + 1, 0, attackModifier);
    return true;
  }

  canChangeModifierCount(attackModifierDeck: AttackModifierDeck, type: AttackModifierType, value: number, isMonster: boolean): boolean {
    if (
      ![AttackModifierType.bless, AttackModifierType.curse, AttackModifierType.minus1extra].includes(type) ||
      !Number.isInteger(value) ||
      value === 0
    ) {
      return false;
    }
    return value > 0
      ? value <= this.modifierSupply(attackModifierDeck, type, isMonster)
      : -value <= this.countUpcoming(attackModifierDeck, type);
  }

  changeModifierCount(attackModifierDeck: AttackModifierDeck, type: AttackModifierType, value: number, isMonster: boolean): boolean {
    if (!this.canChangeModifierCount(attackModifierDeck, type, value, isMonster)) {
      return false;
    }
    if (value > 0) {
      let batch: AttackModifier[] = [];
      if (type === AttackModifierType.bless) {
        batch = this.getBless(value, attackModifierDeck);
      } else if (type === AttackModifierType.curse) {
        batch = this.getCurse(isMonster, value, attackModifierDeck);
      } else if (type === AttackModifierType.minus1extra) {
        batch = this.getExtraMinus1(value);
      }
      this.addModifierBatch(attackModifierDeck, batch);
    } else {
      this.removeUpcoming(attackModifierDeck, -value, (attackModifier) => attackModifier.type === type);
    }
    return true;
  }

  additionalAvailable(character: Character, type: AttackModifierType): number {
    return (
      (character.additionalModifier || [])
        .filter((perk) => perk.attackModifier && perk.attackModifier.type === type)
        .reduce((sum, perk) => sum + perk.count, 0) - this.countUpcomingAdditional(character, type)
    );
  }

  canChangeAdditionalCount(
    attackModifierDeck: AttackModifierDeck,
    character: Character | undefined,
    type: AttackModifierType,
    value: number,
    owner: Character | undefined = undefined
  ): boolean {
    if (![AttackModifierType.empower, AttackModifierType.enfeeble].includes(type) || !Number.isInteger(value) || value === 0) {
      return false;
    }
    if (value < 0) {
      return -value <= this.countUpcomingAdditionalModifiers(attackModifierDeck, type, character);
    }
    return (
      !!character &&
      value <= this.additionalAvailable(character, type) &&
      (!owner || !gameManager.conditionManager.isImmune(owner, owner, type as string as ConditionName))
    );
  }

  changeAdditionalCount(
    attackModifierDeck: AttackModifierDeck,
    character: Character | undefined,
    type: AttackModifierType,
    value: number,
    owner: Character | undefined = undefined
  ): boolean {
    if (!this.canChangeAdditionalCount(attackModifierDeck, character, type, value, owner)) {
      return false;
    }
    if (value > 0 && character) {
      this.addModifierBatch(attackModifierDeck, this.getAdditional(character, type, value));
    } else {
      this.removeUpcoming(attackModifierDeck, -value, (attackModifier) => this.additionalMatch(attackModifier, type, character));
    }
    return true;
  }

  countUpcomingAdditionalModifiers(attackModifierDeck: AttackModifierDeck, type: AttackModifierType, character?: Character): number {
    return attackModifierDeck.cards.filter(
      (attackModifier, index) => index > attackModifierDeck.current && this.additionalMatch(attackModifier, type, character)
    ).length;
  }

  private additionalMatch(attackModifier: AttackModifier, type: AttackModifierType, character?: Character): boolean {
    return (
      attackModifier.type === type &&
      !!attackModifier.id &&
      (character ? this.isAdditionalId(attackModifier.id, character) : attackModifier.id.startsWith('additional-'))
    );
  }

  private removeUpcoming(attackModifierDeck: AttackModifierDeck, count: number, filter: (attackModifier: AttackModifier) => boolean) {
    for (let i = 0; i < count; i++) {
      const index = attackModifierDeck.cards.findIndex(
        (attackModifier, index) => index > attackModifierDeck.current && filter(attackModifier)
      );
      if (index !== -1) {
        attackModifierDeck.cards.splice(index, 1);
      }
    }
  }

  factionModifierInUse(character: Character, id: string): boolean {
    return this.game.figures.some(
      (figure) =>
        figure instanceof Character &&
        (figure.edition !== character.edition || figure.name !== character.name) &&
        figure.attackModifierDeck.cards.some((attackModifier) => attackModifier.id === id)
    );
  }

  canSetFactionModifier(
    attackModifierDeck: AttackModifierDeck,
    character: Character,
    attackModifier: AttackModifier,
    value: boolean,
    force: boolean = false
  ): boolean {
    return (
      Gh2ESealedDeckAttackModifier.some((am) => am.id === attackModifier.id) &&
      attackModifierDeck.cards.some((am) => am.id === attackModifier.id) !== value &&
      (!value || force || !this.factionModifierInUse(character, attackModifier.id))
    );
  }

  setFactionModifier(
    attackModifierDeck: AttackModifierDeck,
    character: Character,
    attackModifier: AttackModifier,
    value: boolean,
    force: boolean = false
  ): boolean {
    if (!this.canSetFactionModifier(attackModifierDeck, character, attackModifier, value, force)) {
      return false;
    }
    if (!value) {
      attackModifierDeck.cards = attackModifierDeck.cards.filter((am) => am.id !== attackModifier.id);
      return true;
    }
    if (!force) {
      attackModifierDeck.cards = attackModifierDeck.cards.filter(
        (am) => !am.id || gameManager.campaignManager.gh2eFactionUnlocks().every((faction) => !am.id.includes(faction))
      );
    }
    attackModifierDeck.cards = [...attackModifierDeck.cards, Object.assign(new AttackModifier(attackModifier.type), attackModifier)];
    return true;
  }

  drawModifier(attackModifierDeck: AttackModifierDeck, state: 'advantage' | 'disadvantage' | undefined, character?: Character) {
    if (attackModifierDeck.bb) {
      this.drawBB(attackModifierDeck, state);
    } else if (attackModifierDeck.current >= attackModifierDeck.cards.length - 1) {
      this.shuffleModifiers(attackModifierDeck);
      return;
    } else if (state) {
      this.drawAdvantage(attackModifierDeck, state);
    } else {
      this.drawNormal(attackModifierDeck);
    }

    if (character) {
      const drawnCard = attackModifierDeck.cards[attackModifierDeck.current];
      if (drawnCard && drawnCard.type === AttackModifierType.bless) {
        gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.blessDrawn);
      }
    }
  }

  drawNormal(attackModifierDeck: AttackModifierDeck) {
    attackModifierDeck.current = attackModifierDeck.current + 1;
    if (attackModifierDeck.state) {
      attackModifierDeck.lastVisible = attackModifierDeck.current;
    }
    attackModifierDeck.state = undefined;
    if (settingsManager.settings.amAdvantage) {
      let currentCard = attackModifierDeck.cards[attackModifierDeck.current];
      if (currentCard && currentCard.rolling) {
        while (currentCard.rolling) {
          if (attackModifierDeck.current === attackModifierDeck.cards.length - 1) {
            return;
          }
          attackModifierDeck.current = attackModifierDeck.current + 1;
          currentCard = attackModifierDeck.cards[attackModifierDeck.current];
          this.updateLastVisible(attackModifierDeck);
        }
      }
    }
    this.updateLastVisible(attackModifierDeck);
  }

  canMoveCard(deck: AttackModifierDeck, fromList: string, fromIndex: number, toList: string, toIndex: number): boolean {
    return deckMoveValid(deck.current, deck.cards.length, fromList, fromIndex, toList, toIndex);
  }

  moveCard(
    deck: AttackModifierDeck,
    fromList: string,
    fromIndex: number,
    toList: string,
    toIndex: number,
    ...arrays: unknown[][]
  ): boolean {
    if (!this.canMoveCard(deck, fromList, fromIndex, toList, toIndex)) {
      return false;
    }
    const result = deckMove(deck.current, fromList, fromIndex, toList, toIndex, deck.cards, ...arrays);
    deck.current = result.current;
    if (toList === 'discarded' && fromList === 'upcoming') {
      deck.cards[result.to].revealed = true;
    }
    this.updateLastVisible(deck);
    return true;
  }

  updateLastVisible(attackModifierDeck: AttackModifierDeck) {
    let count = 0;
    attackModifierDeck.cards
      .slice(attackModifierDeck.lastVisible, attackModifierDeck.current + 1)
      .reverse()
      .forEach((card, index) => {
        if (!card.rolling) {
          count++;
        }
        if (count === 3) {
          attackModifierDeck.lastVisible = attackModifierDeck.current - index + 1;
          count++;
        }
      });

    if (attackModifierDeck.lastVisible > attackModifierDeck.current) {
      attackModifierDeck.lastVisible = attackModifierDeck.current;
    } else if (attackModifierDeck.current === 0) {
      attackModifierDeck.lastVisible = 0;
    }
    gameManager.triggerUiChange(false);
  }

  drawAdvantage(attackModifierDeck: AttackModifierDeck, state: 'advantage' | 'disadvantage') {
    let additionalDraw = false;
    const fhRules = gameManager.fhRules(true) || settingsManager.settings.alwaysFhAdvantage;
    attackModifierDeck.current = attackModifierDeck.current + 1;
    attackModifierDeck.lastVisible = attackModifierDeck.current;
    attackModifierDeck.state = state;
    if (attackModifierDeck.current === attackModifierDeck.cards.length) {
      return;
    }
    gameManager.triggerUiChange(false);
    let card = attackModifierDeck.cards[attackModifierDeck.current];

    if (card && card.rolling) {
      additionalDraw = fhRules;
      while (card.rolling) {
        if (attackModifierDeck.current === attackModifierDeck.cards.length - 1) {
          attackModifierDeck.state = undefined;
          return;
        }
        attackModifierDeck.current = attackModifierDeck.current + 1;
        card = attackModifierDeck.cards[attackModifierDeck.current];
        gameManager.triggerUiChange(false);
      }
    } else {
      if (attackModifierDeck.current === attackModifierDeck.cards.length - 1) {
        attackModifierDeck.state = undefined;
        return;
      }
      attackModifierDeck.current = attackModifierDeck.current + 1;
      card = attackModifierDeck.cards[attackModifierDeck.current];
      gameManager.triggerUiChange(false);

      if (fhRules && settingsManager.settings.amAdvantageHouseRule && card && card.rolling) {
        while (card.rolling) {
          if (attackModifierDeck.current === attackModifierDeck.cards.length - 1) {
            return;
          }
          attackModifierDeck.current = attackModifierDeck.current + 1;
          card = attackModifierDeck.cards[attackModifierDeck.current];
          gameManager.triggerUiChange(false);
        }
      }
    }

    if (additionalDraw) {
      if (attackModifierDeck.current === attackModifierDeck.cards.length - 1) {
        attackModifierDeck.state = undefined;
        return;
      }
      attackModifierDeck.current = attackModifierDeck.current + 1;
      gameManager.triggerUiChange(false);
    }
  }

  drawBB(attackModifierDeck: AttackModifierDeck, state: 'advantage' | 'disadvantage' | undefined) {
    const row = Math.floor(attackModifierDeck.current / 3) + 1;
    attackModifierDeck.state = state;
    if (row >= Math.floor(attackModifierDeck.cards.length / 3)) {
      attackModifierDeck.current = -1;
      attackModifierDeck.lastVisible = -1;
    } else {
      attackModifierDeck.current = row * 3 + gameManager.randomManager.int(3);
      if (state) {
        const secondRoll = row * 3 + gameManager.randomManager.int(3);
        attackModifierDeck.lastVisible = attackModifierDeck.current;
        attackModifierDeck.current = secondRoll;
      } else {
        attackModifierDeck.lastVisible = attackModifierDeck.current;
      }
    }
  }

  shuffleModifiers(attackModifierDeck: AttackModifierDeck, onlyUpcoming: boolean = false) {
    if (attackModifierDeck.bb) {
      attackModifierDeck.current = -1;
      attackModifierDeck.lastVisible = -1;
      return;
    }

    const current = attackModifierDeck.current;
    const lastVisible = attackModifierDeck.lastVisible;
    const restoreCards: AttackModifier[] = onlyUpcoming && current > -1 ? attackModifierDeck.cards.splice(0, current + 1) : [];
    if (!onlyUpcoming) {
      // apply Challenge #1500: drawn -1/-2 cards of the monster deck are removed for the rest of the scenario
      const removeMinus =
        attackModifierDeck === this.game.monsterAttackModifierDeck &&
        gameManager.challengesManager.apply &&
        gameManager.challengesManager.isActive(1500, 'fh');
      attackModifierDeck.cards = attackModifierDeck.cards.filter(
        (attackModifier, index) =>
          index > current ||
          (attackModifier.type !== AttackModifierType.bless &&
            attackModifier.type !== AttackModifierType.curse &&
            attackModifier.type !== AttackModifierType.empower &&
            attackModifier.type !== AttackModifierType.enfeeble &&
            (!removeMinus || (attackModifier.type !== AttackModifierType.minus1 && attackModifier.type !== AttackModifierType.minus2)))
      );
    }

    attackModifierDeck.current = -1;
    attackModifierDeck.lastVisible = 0;
    attackModifierDeck.discarded = [];
    gameManager.randomManager.shuffle(attackModifierDeck.cards);
    if (onlyUpcoming) {
      attackModifierDeck.current = current;
      attackModifierDeck.lastVisible = lastVisible;
      attackModifierDeck.cards.unshift(...restoreCards);
    }

    attackModifierDeck.cards.forEach((am) => (am.revealed = false));
  }

  removeDrawnDiscards(attackModifierDeck: AttackModifierDeck) {
    const before = attackModifierDeck.cards.length;
    attackModifierDeck.cards = attackModifierDeck.cards.filter(
      (attackModifier, index) =>
        index > attackModifierDeck.current ||
        (attackModifier.type !== AttackModifierType.bless &&
          attackModifier.type !== AttackModifierType.curse &&
          attackModifier.type !== AttackModifierType.empower &&
          attackModifier.type !== AttackModifierType.enfeeble)
    );
    attackModifierDeck.current = attackModifierDeck.current - (before - attackModifierDeck.cards.length);
  }

  next() {
    this.checkShuffle(this.game.monsterAttackModifierDeck);
    this.checkShuffle(this.game.allyAttackModifierDeck);
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.checkShuffle(figure.attackModifierDeck);
      }
    });
  }

  firstRound() {
    this.shuffleModifiers(this.game.monsterAttackModifierDeck);
    this.shuffleModifiers(this.game.allyAttackModifierDeck);
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.shuffleModifiers(figure.attackModifierDeck);
      }
    });
  }

  checkShuffle(attackModifierDeck: AttackModifierDeck) {
    if (
      !attackModifierDeck.bb &&
      attackModifierDeck.cards.some((attackModifier, index) => index <= attackModifierDeck.current && attackModifier.shuffle)
    ) {
      this.shuffleModifiers(attackModifierDeck);
    }
  }

  findByAttackModifier(
    attackModifiers: AttackModifier[],
    attackModifier: AttackModifier,
    ignoreCharacter: boolean = false
  ): AttackModifier | undefined {
    return attackModifiers.find((other) => {
      const am = Object.assign(new AttackModifier(attackModifier.type), attackModifier);
      am.id = '';
      am.revealed = attackModifier.revealed || false;
      am.shuffle = attackModifier.shuffle || false;
      const clone = Object.assign(new AttackModifier(other.type), other);
      clone.id = '';
      clone.revealed = other.revealed || false;
      clone.shuffle = other.shuffle || false;
      if (ignoreCharacter && clone.character) {
        clone.character = false;
      }
      return JSON.stringify(am) === JSON.stringify(clone);
    });
  }

  cardById(attackModifierDeck: AttackModifierDeck, id: string): AttackModifier | undefined {
    let attackModifier = attackModifierDeck.attackModifiers.find((attackModifier) => attackModifier.id === id);
    if (!attackModifier) {
      attackModifier = defaultAttackModifier.find((attackModifier) => attackModifier.id === id);
      if (!attackModifier) {
        attackModifier = CsOakDeckAttackModifier.find((attackModifier) => attackModifier.id === id);
      }
      if (!attackModifier) {
        attackModifier = ImbuementAttackModifier.find((attackModifier) => attackModifier.id === id);
      }
      if (!attackModifier) {
        attackModifier = AdvancedImbueAttackModifier.find((attackModifier) => attackModifier.id === id);
      }
      if (!attackModifier) {
        attackModifier = this.getAllAdditional().find((attackModifier) => attackModifier.id === id);
      }
      if (!attackModifier) {
        attackModifier = this.findForChallenge(id);
      }
      if (!attackModifier) {
        attackModifier = defaultTownGuardAttackModifier.find((attackModifier) => attackModifier.id === id);
      }
      if (!attackModifier) {
        attackModifier = additionalTownGuardAttackModifier.find((attackModifier) => attackModifier.id === id);
      }
      if (!attackModifier) {
        attackModifier = Gh2ESealedDeckAttackModifier.find((attackModifier) => attackModifier.id === id);
      }
      if (!attackModifier) {
        attackModifier = RpgAttackModifier.find((attackModifier) => attackModifier.id === id);
      }
      if (!attackModifier) {
        return undefined;
      }
    }
    return Object.assign(new AttackModifier(attackModifier.type), attackModifier);
  }

  findForChallenge(id: string): AttackModifier | undefined {
    if (id.startsWith('challenge-fh-1503-')) {
      const characterName = id.replace('challenge-fh-1503-', '').split('-')[0];
      const index = +id.replace('challenge-fh-1503-', '').split('-')[1];
      const characterData = gameManager.editionManager
        .charactersData('fh')
        .find((other) => other.edition === 'fh' && other.name === characterName);
      if (characterData) {
        const am = gameManager.attackModifierBuildManager.perkCards(characterData)[index];
        if (am) {
          am.id = 'challenge-fh-1503-' + characterData.name + '-' + index;
          am.character = true;
          return am;
        }
      }
    }
    return undefined;
  }

  calculateAttackResult(attackModifierDeck: AttackModifierDeck, base: string | number, forceIndex: number = -1): AttackResult | undefined {
    if (attackModifierDeck.current < 0) {
      console.warn('No Attack Modifier drawn', attackModifierDeck);
      return undefined;
    }

    let result: number = EntityValueFunction(base);
    let stringified: string = '';
    let rollingOffset: number = 1;
    const firstCard: AttackModifier = attackModifierDeck.cards[attackModifierDeck.current];
    const secondCard: AttackModifier = attackModifierDeck.cards[attackModifierDeck.current - 1];
    if (!firstCard || (attackModifierDeck.state && !secondCard)) {
      console.warn('Invalid Attack Modifier draw', attackModifierDeck);
      return undefined;
    }
    let baseCard: AttackModifier = firstCard;
    let chooseOffset: number = 0;
    const effects: AttackModifierEffect[] = [];
    const fh = gameManager.fhRules(true) || settingsManager.settings.alwaysFhAdvantage;

    if (attackModifierDeck.state) {
      switch (attackModifierDeck.state) {
        case 'advantage':
          if (fh) {
            rollingOffset = 2;
            chooseOffset = -1;
            if (this.applyAttackModifier(result, secondCard) > this.applyAttackModifier(result, baseCard)) {
              baseCard = secondCard;
              chooseOffset = 1;
            }

            // townguard
            if (firstCard.type === AttackModifierType.success || secondCard.type === AttackModifierType.wreck) {
              baseCard = firstCard;
              chooseOffset = -1;
            } else if (secondCard.type === AttackModifierType.success || firstCard.type === AttackModifierType.wreck) {
              baseCard = secondCard;
              chooseOffset = 1;
            }
          } else if (baseCard.rolling) {
            baseCard = secondCard;
            rollingOffset = 0;
          } else if (!secondCard.rolling && this.applyAttackModifier(result, secondCard) > this.applyAttackModifier(result, baseCard)) {
            baseCard = secondCard;
            chooseOffset = 1;
          }
          break;
        case 'disadvantage':
          if (fh) {
            chooseOffset = -1;

            // townguard
            if (firstCard.type === AttackModifierType.wreck || secondCard.type === AttackModifierType.success) {
              baseCard = firstCard;
              chooseOffset = -1;
            } else if (secondCard.type === AttackModifierType.wreck || firstCard.type === AttackModifierType.success) {
              baseCard = secondCard;
              chooseOffset = 1;
            }
          }
          if (this.applyAttackModifier(result, secondCard) < this.applyAttackModifier(result, baseCard) || (!fh && baseCard.rolling)) {
            baseCard = secondCard;
            if (fh || !baseCard.rolling) {
              chooseOffset = 1;
            }
          }
          break;
      }

      if (forceIndex !== -1) {
        baseCard = attackModifierDeck.cards[forceIndex];
        chooseOffset = attackModifierDeck.current - forceIndex - (forceIndex === attackModifierDeck.current ? 1 : 0);
      }
    }

    if (attackModifierDeck.state !== 'disadvantage' && attackModifierDeck.current - rollingOffset > -1) {
      let rollingCard: AttackModifier | undefined = attackModifierDeck.cards[attackModifierDeck.current - rollingOffset];
      while (rollingCard && rollingCard.rolling && attackModifierDeck.current - rollingOffset >= attackModifierDeck.lastVisible) {
        result = this.applyAttackModifier(result, rollingCard);
        stringified += this.stringifyAttackModifierValue(rollingCard);
        effects.push(...rollingCard.effects);
        rollingOffset++;
        if (attackModifierDeck.current - rollingOffset > -1) {
          rollingCard = attackModifierDeck.cards[attackModifierDeck.current - rollingOffset];
        } else {
          rollingCard = undefined;
        }
      }
    }

    result = this.applyAttackModifier(result, baseCard);
    stringified += this.stringifyAttackModifierValue(baseCard);

    // put x2/x0 to end
    const matches = stringified.match(/x\d+/g) || [];
    stringified = EntityValueFunction(base) + stringified.replace(/x\d+/g, '');
    if (matches.length) {
      stringified = '(' + stringified + ')' + matches.join('');
    }
    effects.push(...baseCard.effects);

    return new AttackResult(
      attackModifierDeck.cards.indexOf(baseCard),
      chooseOffset,
      attackModifierDeck.state,
      base,
      stringified,
      evaluateExpression(stringified),
      effects
    );
  }

  applyAttackModifier(value: number, attackModifier: AttackModifier): number {
    switch (attackModifier.valueType) {
      case AttackModifierValueType.default:
        if (attackModifier.value) {
          console.warn('Possible invalid AM', attackModifier);
        }
        return value;
      case AttackModifierValueType.plus:
        return value + attackModifier.value;
      case AttackModifierValueType.minus:
        return value - attackModifier.value;
      case AttackModifierValueType.multiply:
        return value * attackModifier.value;
    }
  }

  stringifyAttackModifierValue(attackModifier: AttackModifier): string {
    switch (attackModifier.valueType) {
      case AttackModifierValueType.default:
        if (attackModifier.value) {
          console.warn('Possible invalid AM', attackModifier);
        }
        return '+' + attackModifier.value;
      case AttackModifierValueType.plus:
        return '+' + attackModifier.value;
      case AttackModifierValueType.minus:
        return '-' + attackModifier.value;
      case AttackModifierValueType.multiply:
        return 'x' + attackModifier.value;
    }
  }
}
