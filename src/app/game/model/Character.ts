import { Figure } from "./Figure";
import { Entity } from "./Entity";
import { CharacterStat } from "./CharacterStat";
import { CharacterData } from "./data/CharacterData";
import { GameSummonModel, Summon } from "./Summon";
import { gameManager } from "../businesslogic/GameManager";
import { FigureError } from "./FigureError";
import { EntityCondition, GameEntityConditionModel } from "./Condition";
import { CharacterProgress } from "./CharacterProgress";
import { AttackModifier, AttackModifierDeck, GameAttackModifierDeckModel } from "./AttackModifier";
import { PerkType, PerkCard } from "./Perks";

export class Character extends CharacterData implements Entity, Figure {
  title: string = "";
  initiative: number = 0;
  experience: number = 0;
  loot: number = 0;
  exhausted: boolean = false;
  stat: CharacterStat;
  summons: Summon[] = [];
  progress: CharacterProgress;

  initiativeVisible: boolean = false;
  attackModifierDeckVisible: boolean = false;
  number: number = 0;
  attackModifierDeck: AttackModifierDeck;

  // from figure
  level: number;
  off: boolean = false;
  active: boolean = false;

  // from entity
  health: number;
  maxHealth: number;
  entityConditions: EntityCondition[] = [];
  markers: string[] = [];

  getInitiative(): number {
    return this.exhausted ? 99 : this.initiative;
  }

  constructor(character: CharacterData, level: number) {
    super(character);
    this.errors = character.errors;
    if (level < 1) {
      level = 1;
    } else if (level > 9) {
      level = 9;
    }

    const stat = this.stats.find((characterStat) => characterStat.level == level)
    if (!stat) {
      console.error("No character stat found for level: " + level);
      if (this.errors.indexOf(FigureError.stat) == -1) {
        this.errors.push(FigureError.stat);
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

    // Todo: later on level select for create
    if (this.edition != "jotl" && this.progress.gold == 0) {
      this.progress.gold = 15 * (this.level + 1);
    }

    this.attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this);
  }

  toModel(): GameCharacterModel {
    return new GameCharacterModel(this.name, this.edition, this.title, this.initiative, this.experience, this.loot, this.exhausted, this.level, this.off, this.active, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.markers, this.summons.map((summon) => summon.toModel()), this.progress, this.initiativeVisible, this.attackModifierDeckVisible, this.number, this.attackModifierDeck.toModel());
  }

  fromModel(model: GameCharacterModel) {
    this.edition = model.edition;

    if (!this.edition) {
      const characterData = gameManager.charactersData(true).find((characterData) => characterData.name == model.name);
      if (characterData) {
        this.edition = characterData.edition;
      } else {
        this.edition = "";
      }
    }
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
    this.markers = model.markers;

    this.summons = this.summons.filter((summon) => {
      let found: boolean = false;
      model.summons.forEach((gsm) => {
        if (gsm.number == summon.number && gsm.color == summon.color) {
          found = true;
          return;
        }
      })
      return found;
    });

    model.summons.forEach((value) => {
      let summon = this.summons.find((summonEntity) => summonEntity.name == summonEntity.name && summonEntity.number == value.number && summonEntity.color == value.color) as Summon;
      if (!summon) {
        summon = new Summon(value.name, value.level, value.number, value.color);
        this.summons.push(summon);
      }
      summon.fromModel(value);
    })

    this.progress = model.progress || new CharacterProgress();

    // migration
    if (this.progress.loot && !this.progress.gold) {
      this.progress.gold = this.progress.loot;
      this.progress.loot = 0;
    }

    let attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this);
    if (model.attackModifierDeck) {
      attackModifierDeck.fromModel(model.attackModifierDeck);
    }
    this.mergeAttackModifierDeck(attackModifierDeck);
    if (model.attackModifierDeckVisible) {
      this.attackModifierDeckVisible = true;
    }
  }


  mergeAttackModifierDeck(attackModifierDeck: AttackModifierDeck): boolean {
    let changed = false;
    if (!this.attackModifierDeck) {
      this.attackModifierDeck = new AttackModifierDeck();
      changed = true;
    }

    if (this.attackModifierDeck.current != attackModifierDeck.current) {
      this.attackModifierDeck.current = attackModifierDeck.current;
      changed = true;
    }
    if (this.attackModifierDeck.attackModifiers.length != attackModifierDeck.attackModifiers.length || !this.attackModifierDeck.attackModifiers.map((card) => card.id).every((cardId, index) => attackModifierDeck.attackModifiers[ index ].id == cardId)) {
      this.attackModifierDeck.attackModifiers = attackModifierDeck.attackModifiers;
      changed = true;
    }
    if (this.attackModifierDeck.cards.length != attackModifierDeck.cards.length || !this.attackModifierDeck.cards.map((card) => card.id).every((cardId, index) => attackModifierDeck.cards[ index ].id == cardId)) {
      this.attackModifierDeck.cards = attackModifierDeck.cards;
      changed = true;
    }

    return changed;
  }

}

export class GameCharacterModel {

  name: string;
  edition: string;
  title: string;
  initiative: number;
  experience: number;
  loot: number;
  exhausted: boolean;
  level: number;
  off: boolean;
  active: boolean;
  health: number;
  maxHealth: number;
  entityConditions: GameEntityConditionModel[];
  markers: string[];
  summons: GameSummonModel[];
  progress: CharacterProgress | undefined;
  initiativeVisible: boolean;
  attackModifierDeckVisible: boolean;
  number: number;
  attackModifierDeck: GameAttackModifierDeckModel;

  constructor(name: string,
    edition: string,
    title: string,
    initiative: number,
    experience: number,
    loot: number,
    exhausted: boolean,
    level: number,
    off: boolean,
    active: boolean,
    health: number,
    maxHealth: number,
    entityConditions: GameEntityConditionModel[],
    markers: string[],
    summons: GameSummonModel[],
    progress: CharacterProgress | undefined,
    initiativeVisible: boolean,
    attackModifierDeckVisible: boolean,
    number: number,
    attackModifierDeck: GameAttackModifierDeckModel) {
    this.name = name;
    this.edition = edition;
    this.title = title;
    this.initiative = initiative;
    this.experience = experience;
    this.loot = loot;
    this.exhausted = exhausted;
    this.level = level;
    this.off = off;
    this.active = active;
    this.health = health;
    this.maxHealth = maxHealth;
    this.entityConditions = entityConditions;
    this.markers = markers;
    this.summons = summons;
    this.progress = progress;
    this.initiativeVisible = initiativeVisible;
    this.attackModifierDeckVisible = attackModifierDeckVisible;
    this.number = number;
    this.attackModifierDeck = attackModifierDeck;
  }

}