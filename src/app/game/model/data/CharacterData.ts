import { CharacterStat } from "../CharacterStat";
import { Editional } from "../Editional";

export class CharacterData implements Editional {
  name: string;
  stats: CharacterStat[];
  
  // from Editional
  edition: string;

  constructor(name: string, stats: CharacterStat[], edition: string) {
    this.name = name;
    this.stats = stats;
    this.edition = edition;
  }

} 