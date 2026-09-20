import { Editional } from 'src/app/game/model/data/Editional';

export class PersonalQuest implements Editional {
  cardId: string = '';
  altId: string = '';
  spoiler: boolean = false;
  requirements: PersonalQuestRequirement[] = [];
  unlockCharacter: string = '';
  openEnvelope: string = '';
  unlockPQ: string = '';
  unlockBuilding: string = '';
  errata: string = '';

  // from Editional
  edition: string = '';
}

export class PersonalQuestRequirement {
  name: string = '';
  counter: number | string = 1;
  checkbox: string[] = [];
  autotrack: PersonalQuestAutotrackType | undefined;
  requires: number[] = [];
  hidden: boolean = false;
}

export enum PersonalQuestAutotrackType {
  scenario = 'scenario',
  item = 'item',
  itemType = 'itemType',
  itemBlueprint = 'itemBlueprint',
  loot = 'loot',
  looted = 'looted',
  differentHerbs = 'differentHerbs',
  treasures = 'treasures',
  donations = 'donations',
  donatedGold = 'donatedGold',
  retiredChars = 'retiredChars',
  scenariosCompleted = 'scenariosCompleted',
  completedHighHP = 'completedHighHP',
  completedLowHP = 'completedLowHP',
  kill = 'kill',
  enhancements = 'enhancements',
  exhaustedSelf = 'exhaustedSelf',
  exhaustedChars = 'exhaustedChars',
  exhaustedCharsTurn = 'exhaustedCharsTurn',
  exhaustedCharsFinish = 'exhaustedCharsFinish',
  condition = 'condition',
  gold = 'gold',
  battleGoals = 'battleGoals',
  scenarioXP = 'scenarioXP',
  abilityXP = 'abilityXP',
  buildings = 'buildings',
  craftableItems = 'craftableItems',
  scenarioRequirements = 'scenarioRequirements',
  itemConsumed = 'itemConsumed',
  element = 'element',
  blessDrawn = 'blessDrawn',
  sideScenarios = 'sideScenarios',
  bossScenarios = 'bossScenarios'
}
