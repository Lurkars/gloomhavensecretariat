import { Figure } from "./Figure";
import { Entity } from "./Entity";
import { CharacterStat } from "./data/CharacterStat";
import { CharacterData } from "./data/CharacterData";
import { GameSummonModel, Summon } from "./Summon";
import { gameManager } from "../businesslogic/GameManager";
import { FigureError, FigureErrorType } from "./data/FigureError";
import { EntityCondition, GameEntityConditionModel } from "./Condition";
import { CharacterProgress } from "./CharacterProgress";
import { AttackModifierDeck, GameAttackModifierDeckModel } from "./data/AttackModifier";

export class Character extends CharacterData implements Entity, Figure {
  title: string = "";
  initiative: number = 0;
  experience: number = 0;
  loot: number = 0;
  lootCards: number[] = [];
  treasures: (string | number)[] = [];
  exhausted: boolean = false;
  stat: CharacterStat;
  summons: Summon[] = [];
  identity: number = 0;
  progress: CharacterProgress;
  donations: number = 0;

  initiativeVisible: boolean = false;
  attackModifierDeckVisible: boolean = false;
  lootCardsVisible: boolean = false;
  fullview: boolean = false;
  number: number = 0;
  attackModifierDeck: AttackModifierDeck;

  token: number = 0;
  absent: boolean = false;
  longRest: boolean = false;

  // from figure
  level: number;
  off: boolean = false;
  active: boolean = false;

  // from entity
  health: number;
  maxHealth: number;
  entityConditions: EntityCondition[] = [];
  markers: string[] = [];
  tags: string[] = [];

  getInitiative(): number {
    if (this.absent) {
      return 200;
    }

    if (this.exhausted || this.longRest || this.health <= 0) {
      return 100;
    }
    return this.initiative;
  }

  constructor(character: CharacterData, level: number) {
    super(character);
    this.errors = character.errors || [];
    if (level < 1) {
      level = 1;
    } else if (level > 9) {
      level = 9;
    }

    const stat = this.stats.find((characterStat) => characterStat.level == level)
    if (!stat) {
      if (!this.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !this.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
        console.error("No character stat found for level: " + level);
        this.errors.push(new FigureError(FigureErrorType.stat, "character", character.name, character.edition, "", "" + level));
      }
      this.stat = new CharacterStat(level, 0);
      this.level = 0;
      this.maxHealth = 0;
    } else {
      this.stat = stat;
      this.level = level;
      this.maxHealth = this.stat.health;
    }

    this.health = this.maxHealth;
    this.progress = new CharacterProgress();
    this.attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this);

    this.availableSummons.forEach((summonData) => summonData.edition = this.edition);
  }

  toModel(): GameCharacterModel {
    return new GameCharacterModel(this.name, this.edition, this.marker, this.title, this.initiative, this.experience, this.loot, this.lootCards || [], this.treasures && this.treasures.map((treasure) => '' + treasure) || [], this.exhausted, this.level, this.off, this.active, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.markers, this.tags || [], this.identity, this.summons.map((summon) => summon.toModel()), this.progress, this.initiativeVisible, this.attackModifierDeckVisible, this.lootCardsVisible, this.number, this.attackModifierDeck.toModel(), this.donations, this.token, this.absent, this.longRest);
  }

  fromModel(model: GameCharacterModel) {
    this.edition = model.edition;

    if (!this.edition) {
      const characterData = gameManager.charactersData().find((characterData) => characterData.name == model.name);
      if (characterData) {
        this.edition = characterData.edition;
      } else {
        this.edition = "";
      }
    }

    this.marker = model.marker || this.marker;
    this.title = model.title;

    if (!this.initiativeVisible || model.initiative <= 0 || this.initiative != model.initiative) {
      this.initiativeVisible = model.initiativeVisible;
    }

    if (model.number) {
      this.number = model.number;
    } else {
      this.number = 1;
      while (gameManager.game.figures.some((figure) => figure instanceof Character && (figure.name != this.name || figure.edition != this.edition) && figure.number == this.number)) {
        this.number++;
      }
    }

    this.initiative = model.initiative;
    this.experience = model.experience;
    this.loot = model.loot;
    this.lootCards = model.lootCards || [];
    this.treasures = model.treasures && model.treasures.map((treasure) => isNaN(+treasure) ? treasure : +treasure) || [];
    this.exhausted = model.exhausted;
    this.level = model.level;
    this.off = model.off;
    this.active = model.active;
    this.health = model.health;
    this.maxHealth = model.maxHealth;
    this.entityConditions = [];
    if (model.entityConditions) {
      this.entityConditions = model.entityConditions.map((gecm) => {
        let condition = new EntityCondition(gecm.name, gecm.value);
        condition.fromModel(gecm);
        return condition;
      });
    }
    this.markers = model.markers || this.markers;
    this.tags = model.tags || this.tags;
    this.identity = model.identity || 0;

    this.summons = this.summons.filter((summon, index, self) => model.summons.some((value) =>
      // match uuid
      value.uuid == summon.uuid ||
      // migration
      (!value.uuid || value.uuid && !summon.uuid && !self.find((existing) => existing.uuid == value.uuid)) && value.name == summon.name && value.color == summon.color && value.number == summon.number
    ));

    model.summons.forEach((value, index) => {
      let summon = this.summons.find((summonEntity) =>
        // match uuid
        value.uuid == summonEntity.uuid ||
        // migration
        !value.uuid && value.name == summonEntity.name && value.color == summonEntity.color && value.number == summonEntity.number
      ) as Summon;
      if (!summon) {
        summon = new Summon(value.uuid, value.name, value.cardId, value.level, value.number, value.color);
        this.summons.splice(index, 0, summon);
      } else if (index != this.summons.indexOf(summon)) {
        this.summons.splice(this.summons.indexOf(summon), 1);
        this.summons.splice(index, 0, summon);
      }
      summon.fromModel(value);
    })

    this.summons.sort((a, b) => model.summons.map((model) => model.uuid).indexOf(a.uuid) - model.summons.map((model) => model.uuid).indexOf(b.uuid));

    this.progress = new CharacterProgress();

    if (model.progress) {
      this.progress = Object.assign(new CharacterProgress(), model.progress);
    }

    let attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this);
    if (model.attackModifierDeck) {
      attackModifierDeck.fromModel(model.attackModifierDeck);
    }
    this.mergeAttackModifierDeck(attackModifierDeck);
    if (model.attackModifierDeckVisible) {
      this.attackModifierDeckVisible = true;
    }
    if (model.lootCardsVisible) {
      this.lootCardsVisible = true;
    }

    this.donations = model.donations || 0;
    this.token = model.token || 0;
    this.absent = model.absent;
    this.longRest = model.longRest;
  }


  mergeAttackModifierDeck(attackModifierDeck: AttackModifierDeck): boolean {
    let changed = false;
    if (!this.attackModifierDeck) {
      this.attackModifierDeck = new AttackModifierDeck();
      changed = true;
    }

    if (attackModifierDeck.disgarded.length != this.attackModifierDeck.disgarded.length || !attackModifierDeck.disgarded.every((value, index) => this.attackModifierDeck.disgarded.indexOf(value) == index)) {
      this.attackModifierDeck.disgarded = attackModifierDeck.disgarded;
      changed = true;
    }

    if (this.attackModifierDeck.current != attackModifierDeck.current) {
      this.attackModifierDeck.current = attackModifierDeck.current;
      changed = true;
    }
    if (this.attackModifierDeck.attackModifiers.length != attackModifierDeck.attackModifiers.length || !this.attackModifierDeck.attackModifiers.map((card) => card.id).every((cardId, index) => attackModifierDeck.attackModifiers[index].id == cardId)) {
      this.attackModifierDeck.attackModifiers = attackModifierDeck.attackModifiers;
      changed = true;
    }
    if (this.attackModifierDeck.cards.length != attackModifierDeck.cards.length || !this.attackModifierDeck.cards.map((card) => card.id).every((cardId, index) => attackModifierDeck.cards[index].id == cardId)) {
      this.attackModifierDeck.cards = attackModifierDeck.cards;
      changed = true;
    }

    return changed;
  }

}

export class GameCharacterModel {

  name: string;
  edition: string;
  marker: boolean;
  title: string;
  initiative: number;
  experience: number;
  loot: number;
  lootCards: number[];
  treasures: string[];
  exhausted: boolean;
  level: number;
  off: boolean;
  active: boolean;
  health: number;
  maxHealth: number;
  entityConditions: GameEntityConditionModel[];
  markers: string[];
  tags: string[];
  identity: number;
  summons: GameSummonModel[];
  progress: CharacterProgress | undefined;
  initiativeVisible: boolean;
  attackModifierDeckVisible: boolean;
  lootCardsVisible: boolean;
  number: number;
  attackModifierDeck: GameAttackModifierDeckModel;
  donations: number;
  token: number;
  absent: boolean;
  longRest: boolean;

  constructor(name: string,
    edition: string,
    marker: boolean,
    title: string,
    initiative: number,
    experience: number,
    loot: number,
    lootCards: number[],
    treasures: string[],
    exhausted: boolean,
    level: number,
    off: boolean,
    active: boolean,
    health: number,
    maxHealth: number,
    entityConditions: GameEntityConditionModel[],
    markers: string[],
    tags: string[],
    identity: number,
    summons: GameSummonModel[],
    progress: CharacterProgress | undefined,
    initiativeVisible: boolean,
    attackModifierDeckVisible: boolean,
    lootCardsVisible: boolean,
    number: number,
    attackModifierDeck: GameAttackModifierDeckModel,
    donations: number,
    token: number,
    absent: boolean,
    longRest: boolean) {
    this.name = name;
    this.edition = edition;
    this.marker = marker;
    this.title = title;
    this.initiative = initiative;
    this.experience = experience;
    this.loot = loot;
    this.lootCards = JSON.parse(JSON.stringify(lootCards));
    this.treasures = JSON.parse(JSON.stringify(treasures));
    this.exhausted = exhausted;
    this.level = level;
    this.off = off;
    this.active = active;
    this.health = health;
    this.maxHealth = maxHealth;
    this.entityConditions = JSON.parse(JSON.stringify(entityConditions));
    this.markers = JSON.parse(JSON.stringify(markers));
    this.tags = JSON.parse(JSON.stringify(tags));
    this.identity = identity;
    this.summons = summons;
    this.progress = JSON.parse(JSON.stringify(progress));
    this.initiativeVisible = initiativeVisible;
    this.attackModifierDeckVisible = attackModifierDeckVisible;
    this.lootCardsVisible = lootCardsVisible;
    this.number = number;
    this.attackModifierDeck = attackModifierDeck;
    this.donations = donations;
    this.token = token;
    this.absent = absent;
    this.longRest = longRest;
  }

}