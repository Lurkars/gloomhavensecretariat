import { Identifier } from "./data/Identifier";

export class Permissions {

  characters: boolean = false;
  character: Identifier[] = [];
  monsters: boolean = false;
  monster: Identifier[] = [];
  scenario: boolean = false;
  elements: boolean = false;
  round: boolean = false;
  level: boolean = false;
  attackModifiers: boolean = false;
  lootDeck: boolean = false;
  party: boolean = false;

}