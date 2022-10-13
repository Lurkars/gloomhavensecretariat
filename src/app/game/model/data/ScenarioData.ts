import { Editional } from "../Editional";
import { Spoilable } from "../Spoilable";
import { ObjectiveData } from "./ObjectiveData";

export class ScenarioData implements Editional, Spoilable {

  name: string;
  index: string;
  unlocks: string[];
  blocks: string[];
  requires: string[][];
  links: string[];
  group: string | undefined;
  monsters: string[];
  allies: string[];
  objectives: ObjectiveData[];
  initial: boolean = false;
  solo: string | undefined;


  // from Editional
  edition: string;

  // from Spoilable
  spoiler: boolean;

  constructor(name: string, index: string, unlocks: string[], blocks: string[], requires: string[][], links: string[], monsters: string[], allies: string[], objectives: ObjectiveData[], edition: string, group: string | undefined = undefined,
    spoiler: boolean = false) {
    this.name = name;
    this.index = index;
    this.unlocks = unlocks;
    this.blocks = blocks;
    this.requires = requires;
    this.links = links;
    this.monsters = monsters;
    this.allies = allies;
    this.edition = edition;
    this.objectives = objectives;
    this.group = group;
    this.spoiler = spoiler;
  }
}

export class GameScenarioModel {

  index: string;
  edition: string;
  group: string | undefined;
  isCustom: boolean;
  custom: string;

  constructor(index: string,
    edition: string,
    group: string | undefined,
    isCustom: boolean = false,
    custom: string = "") {
    this.index = index;
    this.edition = edition;
    this.group = group;
    this.isCustom = isCustom;
    this.custom = custom;
  }

}