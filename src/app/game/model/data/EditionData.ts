import { BattleGoal } from 'src/app/game/model/data/BattleGoal';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { ChallengeCard } from 'src/app/game/model/data/Challenges';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { DeckData } from 'src/app/game/model/data/DeckData';
import { Editional } from 'src/app/game/model/data/Editional';
import { EventCard } from 'src/app/game/model/data/EventCard';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { Perk } from 'src/app/game/model/data/Perks';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';
import { PetCard } from 'src/app/game/model/data/PetCard';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Favor, TrialCard } from 'src/app/game/model/data/Trials';

export const GH_PROSPERITY_STEPS = [0, 4, 9, 15, 22, 30, 39, 50, 64];
export const FH_PROSPERITY_STEPS = [0, 6, 15, 27, 42, 60, 81, 105, 132];
export const GH2E_PROSPERITY_STEPS = [1, 6, 13, 23, 34, 46, 60, 75, 90];

export type EditionType = 'standalone' | 'addon' | 'extension' | 'content';

export class EditionData implements Editional {
  // from Editional
  edition: string;

  characters: CharacterData[];
  monsters: MonsterData[];
  decks: DeckData[];
  scenarios: ScenarioData[];
  sections: ScenarioData[];
  items: ItemData[];
  conditions: string[] = [];
  battleGoals: BattleGoal[] = [];
  events: EventCard[] = [];
  personalQuests: PersonalQuest[] = [];
  challenges: ChallengeCard[] = [];
  trials: TrialCard[] = [];
  favors: Favor[] = [];
  pets: PetCard[] = [];
  worldMap: { width: number; height: number } | undefined;
  extendWorldMap: string | undefined;
  label: any = {};
  labelSpoiler: any = {};
  labelEvents: any = {};
  url: string = '';
  logoUrl: string = '';
  type: EditionType = 'standalone';
  extends: string[] = [];
  newAmStyle: boolean = false;
  newItemStyle: boolean = false;
  campaign: CampaignData | undefined;
  treasures: string[] = [];
  treasureOffset: number = 0;
  monsterAmTables: string[][] = [];

  constructor(
    edition: string,
    characters: CharacterData[],
    monsters: MonsterData[],
    decks: DeckData[],
    scenarios: ScenarioData[],
    sections: ScenarioData[],
    items: ItemData[],
    conditions: string[] | undefined = undefined,
    battleGoals: BattleGoal[] = [],
    events: EventCard[] = [],
    personalQuests: PersonalQuest[] = []
  ) {
    this.edition = edition;
    this.characters = characters;
    this.monsters = monsters;
    this.decks = decks;
    this.scenarios = scenarios;
    this.sections = sections;
    this.items = items;
    if (conditions) {
      this.conditions = conditions;
    }
    this.battleGoals = battleGoals;
    this.events = events;
    this.personalQuests = personalQuests;
  }
}

export class CampaignData {
  events: Partial<Record<string, string[]>> = {};

  // FH
  campaignStickers: string[] = [];
  buildings: BuildingData[] = [];
  highMorale: string[] = [];
  lowMorale: string[] = [];
  lootSpecial1Sections: string[] = [];
  lootSpecial2Sections: string[] = [];
  townGuardPerks: TownGuardPerk[] = [];
  weeks: Partial<Record<number, string[]>> = {};

  // GH2E
  factions: string[] = [];
  imbuementSections: Record<number, string> = {};
  reputationSections: ReputationSection[] = [];
  prosperitySections: Record<number, string> = {};
}

export type TownGuardPerk = { sections: string[]; perk: Perk };

export type ReputationSection = { faction: string; value: number; section: string; requires?: string[] };
