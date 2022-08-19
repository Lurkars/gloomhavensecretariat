import { Identifier } from "./Identifier";

export class Party {

  name: string = "";
  location: string = "";
  notes: string = "";
  achievements: string = "";
  reputation: number = 0;
  prosperity: number = 0;
  scenarios: Identifier[] = [];

}