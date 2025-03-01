import { gameManager } from "../businesslogic/GameManager";
import { CharacterProgress, ScenarioStats } from "./CharacterProgress";
import { Action } from "./data/Action";
import { AttackModifierDeck, GameAttackModifierDeckModel } from "./data/AttackModifier";
import { CharacterData } from "./data/CharacterData";
import { CharacterStat } from "./data/CharacterStat";
import { ConditionName, EntityCondition, GameEntityConditionModel } from "./data/Condition";
import { FigureError, FigureErrorType } from "./data/FigureError";
import { Identifier } from "./data/Identifier";
import { Entity } from "./Entity";
import { Figure } from "./Figure";
import { GameSummonModel, Summon } from "./Summon";

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
  scenarioStats: ScenarioStats = new ScenarioStats();

  initiativeVisible: boolean = false;
  attackModifierDeckVisible: boolean = false;
  lootCardsVisible: boolean = false;
  itemsVisible: boolean = false;
  fullview: boolean = false;
  attackModifierDeck: AttackModifierDeck;

  token: number = 0;
  tokenValues: number[] = [];
  absent: boolean = false;
  longRest: boolean = false;

  battleGoals: Identifier[] = [];
  battleGoal: boolean = false;
  shield: Action | undefined;
  shieldPersistent: Action | undefined;
  retaliate: Action[] = [];
  retaliatePersistent: Action[] = [];

  // from figure
  level: number;
  off: boolean = false;
  active: boolean = false;
  type: string = 'character';

  // from entity
  health: number;
  maxHealth: number;
  entityConditions: EntityCondition[] = [];
  immunities: ConditionName[] = [];
  number: number = 0;
  markers: string[] = [];
  tags: string[] = [];

  getInitiative(): number {
    if (this.absent) {
      return 200;
    }

    if (this.exhausted || this.longRest || this.health <= 0) {
      return 100;
    }

    // apply Challenge #1505
    if (gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1505, 'fh')) {
      return this.initiative < 90 ? this.initiative + 10 : 99;
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
    this.tokens.forEach((token, index) => {
      this.tokenValues[index] = this.tokenValues[index] || 0;
    })
    this.availableSummons.forEach((summonData) => summonData.edition = this.edition);
  }

  toModel(): GameCharacterModel {
    return new GameCharacterModel(this.name, this.edition, this.marker, this.title, this.initiative, this.experience, this.loot, this.lootCards || [], this.treasures && this.treasures.map((treasure) => '' + treasure) || [], this.exhausted, this.level, this.off, this.active, this.health, this.maxHealth, this.entityConditions.map((condition) => condition.toModel()), this.immunities, this.markers, this.tags || [], this.identity, this.summons.map((summon) => summon.toModel()), this.progress, this.scenarioStats, this.initiativeVisible, this.attackModifierDeckVisible, this.lootCardsVisible, this.itemsVisible, this.number, this.attackModifierDeck.toModel(), this.donations, this.token, this.tokenValues, this.absent, this.longRest, this.battleGoals, this.battleGoal, this.shield, this.shieldPersistent, this.retaliate, this.retaliatePersistent);
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
    this.immunities = model.immunities || [];
    this.markers = model.markers || this.markers;
    this.tags = model.tags || this.tags;
    this.identity = model.identity || 0;

    this.summons = this.summons.filter((summon) => model.summons.some((value) => value.uuid && value.uuid == summon.uuid));

    model.summons.forEach((value, index) => {
      let summon = this.summons.find((summonEntity) => value.uuid == summonEntity.uuid) as Summon;
      if (!summon) {
        summon = new Summon(value.uuid, value.name, value.cardId, value.level, value.number, value.color);
        this.summons.splice(index, 0, summon);
      }
      summon.fromModel(value);
    })

    this.summons.sort((a, b) => model.summons.map((model) => model.uuid).indexOf(a.uuid) - model.summons.map((model) => model.uuid).indexOf(b.uuid));

    this.progress = new CharacterProgress();

    if (model.progress) {
      this.progress = Object.assign(new CharacterProgress(), model.progress);
    }

    this.scenarioStats = new ScenarioStats();

    if (model.scenarioStats) {
      this.scenarioStats = Object.assign(new ScenarioStats(), model.scenarioStats);
    }

    let attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this);
    if (model.attackModifierDeck) {
      gameManager.attackModifierManager.fromModel(attackModifierDeck, model.attackModifierDeck);
    }
    this.mergeAttackModifierDeck(attackModifierDeck);
    if (model.attackModifierDeckVisible) {
      this.attackModifierDeckVisible = true;
    }
    if (model.lootCardsVisible) {
      this.lootCardsVisible = true;
    }
    if (model.itemsVisible) {
      this.itemsVisible = true;
    }

    this.donations = model.donations || 0;
    this.token = model.token || 0;
    this.tokenValues = model.tokenValues || [];
    this.tokens.forEach((token, index) => {
      this.tokenValues[index] = this.tokenValues[index] || 0;
    })
    this.absent = model.absent;
    this.longRest = model.longRest;
    this.battleGoals = model.battleGoals || [];
    this.battleGoal = model.battleGoal;

    this.shield = model.shield ? JSON.parse(model.shield) : undefined;
    this.shieldPersistent = model.shieldPersistent ? JSON.parse(model.shieldPersistent) : undefined;
    this.retaliate = (model.retaliate || []).map((value) => JSON.parse(value));
    this.retaliatePersistent = (model.retaliatePersistent || []).map((value) => JSON.parse(value));
  }


  mergeAttackModifierDeck(attackModifierDeck: AttackModifierDeck): boolean {
    let changed = false;
    if (!this.attackModifierDeck) {
      this.attackModifierDeck = new AttackModifierDeck();
      changed = true;
    }

    if (attackModifierDeck.discarded.length != this.attackModifierDeck.discarded.length || !attackModifierDeck.discarded.every((value, index) => this.attackModifierDeck.discarded.indexOf(value) == index)) {
      this.attackModifierDeck.discarded = attackModifierDeck.discarded;
      changed = true;
    }

    if (this.attackModifierDeck.current != attackModifierDeck.current) {
      this.attackModifierDeck.current = attackModifierDeck.current;
      changed = true;
    }

    if (this.attackModifierDeck.lastVisible != attackModifierDeck.lastVisible) {
      this.attackModifierDeck.lastVisible = attackModifierDeck.lastVisible;
      changed = true;
    }

    if (this.attackModifierDeck.state != attackModifierDeck.state) {
      this.attackModifierDeck.state = attackModifierDeck.state;
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
  immunities: ConditionName[] = [];
  markers: string[];
  tags: string[];
  identity: number;
  summons: GameSummonModel[];
  progress: CharacterProgress | undefined;
  scenarioStats: ScenarioStats;
  initiativeVisible: boolean;
  attackModifierDeckVisible: boolean;
  lootCardsVisible: boolean;
  itemsVisible: boolean;
  number: number;
  attackModifierDeck: GameAttackModifierDeckModel;
  donations: number;
  token: number;
  tokenValues: number[];
  absent: boolean;
  longRest: boolean;
  battleGoals: Identifier[];
  battleGoal: boolean;
  shield: string;
  shieldPersistent: string;
  retaliate: string[];
  retaliatePersistent: string[];

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
    immunities: ConditionName[],
    markers: string[],
    tags: string[],
    identity: number,
    summons: GameSummonModel[],
    progress: CharacterProgress | undefined,
    scenarioStats: ScenarioStats,
    initiativeVisible: boolean,
    attackModifierDeckVisible: boolean,
    lootCardsVisible: boolean,
    itemsVisible: boolean,
    number: number,
    attackModifierDeck: GameAttackModifierDeckModel,
    donations: number,
    token: number,
    tokenValues: number[],
    absent: boolean,
    longRest: boolean,
    battleGoals: Identifier[],
    battleGoal: boolean,
    shield: Action | undefined,
    shieldPersistent: Action | undefined,
    retaliate: Action[],
    retaliatePersistent: Action[]) {
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
    this.immunities = JSON.parse(JSON.stringify(immunities));
    this.markers = JSON.parse(JSON.stringify(markers));
    this.tags = JSON.parse(JSON.stringify(tags));
    this.identity = identity;
    this.summons = summons;
    this.progress = JSON.parse(JSON.stringify(progress));
    this.scenarioStats = JSON.parse(JSON.stringify(scenarioStats));
    this.initiativeVisible = initiativeVisible;
    this.attackModifierDeckVisible = attackModifierDeckVisible;
    this.lootCardsVisible = lootCardsVisible;
    this.itemsVisible = itemsVisible;
    this.number = number;
    this.attackModifierDeck = attackModifierDeck;
    this.donations = donations;
    this.token = token;
    this.tokenValues = JSON.parse(JSON.stringify(tokenValues));
    this.absent = absent;
    this.longRest = longRest;
    this.battleGoals = JSON.parse(JSON.stringify(battleGoals));
    this.battleGoal = battleGoal;
    this.shield = shield ? JSON.stringify(shield) : "";
    this.shieldPersistent = shieldPersistent ? JSON.stringify(shieldPersistent) : "";
    this.retaliate = retaliate.map((action) => JSON.stringify(action));
    this.retaliatePersistent = retaliatePersistent.map((action) => JSON.stringify(action));
  }

}