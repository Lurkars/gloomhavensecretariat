import { Data } from "../model/data/Data";
import { EditionData } from "../model/data/EditionData";
import { Edition } from "../model/Edition";
import { jotlData } from "./JotsData";

export const defaultData: Data = new Data();
defaultData.set(Edition.jotl, jotlData);
defaultData.set(Edition.gh, new EditionData(Edition.gh, [], [], []))

console.debug(Object.fromEntries(defaultData.entries()));