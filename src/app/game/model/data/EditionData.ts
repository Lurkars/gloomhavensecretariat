import { BattleGoal } from "./BattleGoal";
import { BuildingData } from "./BuildingData";
import { ChallengeCard } from "./Challenges";
import { CharacterData } from "./CharacterData";
import { DeckData } from "./DeckData";
import { Editional } from "./Editional";
import { EventCard } from "./EventCard";
import { ItemData } from "./ItemData";
import { MonsterData } from "./MonsterData";
import { Perk } from "./Perks";
import { PersonalQuest } from "./PersonalQuest";
import { PetCard } from "./PetCard";
import { ScenarioData } from "./ScenarioData";
import { Favor, TrialCard } from "./Trials";

export const GH_PROSPERITY_STEPS = [3, 8, 14, 21, 29, 38, 49, 63];
export const FH_PROSPERITY_STEPS = [5, 14, 26, 41, 59, 80, 104, 131];

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
  worldMap: { width: number, height: number } | undefined;
  extendWorldMap: string | undefined;
  label: any = {};
  labelSpoiler: any = {};
  url: string = "";
  logoUrl: string = "";
  additional: boolean = false;
  extensions: string[] = [];
  newAmStyle: boolean = false;
  campaign: CampaignData | undefined;
  treasures: string[] = [];
  treasureOffset: number = 0;
  monsterAmTables: string[][] = [];

  constructor(edition: string, characters: CharacterData[],
    monsters: MonsterData[],
    decks: DeckData[],
    scenarios: ScenarioData[],
    sections: ScenarioData[],
    items: ItemData[],
    conditions: string[] | undefined = undefined,
    battleGoals: BattleGoal[] = [],
    events: EventCard[] = [],
    personalQuests: PersonalQuest[] = [],
    additional: boolean = false,
    extensions: string[] = []) {
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
    this.additional = additional;
    this.extensions = extensions;
  }

}

export class CampaignData {

  campaignStickers: string[] = [];
  buildings: BuildingData[] = [];
  highMorale: string[] = [];
  lowMorale: string[] = [];
  lootSpecial1Sections: string[] = [];
  lootSpecial2Sections: string[] = [];
  townGuardPerks: TownGuardPerk[] = [];
  weeks: Partial<Record<number, string[]>> = {};

}

export type TownGuardPerk = { "sections": string[], "perk": Perk };