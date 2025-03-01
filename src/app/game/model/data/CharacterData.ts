import { AttackModifier } from "./AttackModifier";
import { CharacterSpecialAction, CharacterStat } from "./CharacterStat";
import { Editional } from "./Editional";
import { FigureError } from "./FigureError";
import { Perk, PerkCard } from "./Perks";
import { Spoilable } from "./Spoilable";
import { SummonData } from "./SummonData";

export enum CharacterClass {

  algox = "algox",
  aesther = "aesther",
  harrower = "harrower",
  human = "human",
  inox = "inox",
  lurker = "lurker",
  orchid = "orchid",
  quatryl = "quatryl",
  savvas = "savvas",
  unfettered = "unfettered",
  valrath = "valrath",
  vermling = "vermling"

}

export enum CharacterGender {
  male = "m",
  female = "f",
  unknown = ""
}


export class CharacterData implements Editional, Spoilable {
  name: string = "";
  stats: CharacterStat[] = [];
  characterClass: CharacterClass | undefined;
  gender: CharacterGender = CharacterGender.unknown;
  identities: string[] = [];
  defaultIdentity: number | undefined = undefined;
  tokens: string[] = [];
  primaryToken: number = -1;
  handSize: number | string = 0;
  unlockEvent: string = "";
  retireEvent: string = "";
  traits: string[] = [];
  availableSummons: SummonData[] = [];
  specialActions: CharacterSpecialAction[] = [];

  icon: string = '';
  iconUrl: string = '';
  thumbnail: string | undefined;
  thumbnailUrl: string | undefined;
  color: string = "#aaaaaa";

  noThumbnail: boolean = false;

  marker: boolean = false;

  deck: string = "";

  perkWarning: boolean = false;
  perks: Perk[] = [];

  additionalModifier: PerkCard[] = [];

  masteries: string[] = [];

  bb: boolean = false;
  amTables: (AttackModifier | String)[][] = [];

  // from Editional
  edition: string = "";
  // from Spoilable
  spoiler: boolean = false;
  locked: boolean = false;

  // error
  errors: FigureError[] | undefined;

  replace: boolean = false;
  merge: boolean = false;

  constructor(characterData: CharacterData | undefined = undefined) {
    if (characterData) {
      this.errors = characterData.errors || [];
      this.name = characterData.name;
      this.stats = characterData.stats || [];
      this.characterClass = characterData.characterClass || undefined;
      this.gender = characterData.gender || CharacterGender.unknown;
      this.identities = characterData.identities || [];
      this.defaultIdentity = characterData.defaultIdentity;
      this.tokens = characterData.tokens || [];
      this.primaryToken = characterData.primaryToken >= 0 ? characterData.primaryToken : -1;
      this.handSize = characterData.handSize || 0;
      this.unlockEvent = characterData.unlockEvent || "";
      this.retireEvent = characterData.retireEvent || "";
      this.traits = characterData.traits || [];
      this.availableSummons = characterData.availableSummons || [];
      this.edition = characterData.edition || "";
      this.icon = characterData.icon || characterData.edition + '-' + characterData.name;
      this.iconUrl = characterData.iconUrl || './assets/images/character/icons/' + this.icon + '.svg';
      this.thumbnail = characterData.thumbnail || undefined;
      this.thumbnailUrl = characterData.thumbnailUrl || undefined;
      this.noThumbnail = characterData.noThumbnail;
      this.color = characterData.color || "#aaaaaa";
      this.marker = characterData.marker || false;
      this.spoiler = characterData.spoiler || false;
      this.specialActions = characterData.specialActions || [];
      this.locked = characterData.locked || false;
      this.deck = characterData.deck || "";
      this.perkWarning = characterData.perkWarning;
      this.perks = characterData.perks || [];
      this.additionalModifier = characterData.additionalModifier || [];
      this.masteries = characterData.masteries || [];
      this.replace = characterData.replace || false;
      this.merge = characterData.merge || false;
      this.bb = characterData.bb || false;
      this.amTables = characterData.amTables || [];
    }
  }
} 