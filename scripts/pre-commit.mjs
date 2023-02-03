import { sortCharacterFiles } from "./sort/sort-character-files.mjs";
import { sortDeckFiles } from "./sort/sort-deck-files.mjs";
import { sortMonsterFiles } from "./sort/sort-monster-files.mjs";
import { sortScenarioFiles } from "./sort/sort-scenario-files.mjs";

const dataDirectory = process.argv[2];

sortCharacterFiles(dataDirectory);
sortDeckFiles(dataDirectory);
sortMonsterFiles(dataDirectory);
sortScenarioFiles(dataDirectory);