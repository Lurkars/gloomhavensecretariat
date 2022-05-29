
import { EditionData } from "../model/data/EditionData";
import { ScenarioData } from "../model/data/ScenarioData";
import { Edition } from "../model/Edition";
import { Demolitionist, RedGuard, Hatchet, Voidwarden } from "./jotl/character/character";
import { BloodTumor } from "./jotl/monster/BloodTumor";
import { Zealot } from "./jotl/monster/Zealot";


export const jotlData: EditionData = new EditionData(Edition.jotl, [
  Demolitionist, RedGuard, Hatchet, Voidwarden
], [ Zealot, BloodTumor ], [
  new ScenarioData("Roadside Ambush", 1, [], Edition.jotl),
  new ScenarioData("A Hole in the Wall", 2, [], Edition.jotl),
  new ScenarioData("The Black Ship", 3, [], Edition.jotl),
  new ScenarioData("A Ritual in Stone", 4, [], Edition.jotl),
  new ScenarioData("A Deeper Understanding", 5, [ Zealot.name, BloodTumor.name ], Edition.jotl) ]); 