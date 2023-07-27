import { sortCharacterFiles } from "./sort/sort-character-files.mjs";
import { sortDeckFiles } from "./sort/sort-deck-files.mjs";
import { sortItemFile } from "./sort/sort-item-file.mjs";
import { sortMonsterFiles } from "./sort/sort-monster-files.mjs";
import { sortScenarioFiles } from "./sort/sort-scenario-files.mjs";

const dataDirectory = process.argv[2];

let changedFiles = [];

changedFiles.push(...sortCharacterFiles(dataDirectory));
changedFiles.push(...sortDeckFiles(dataDirectory));
changedFiles.push(...sortItemFile(dataDirectory, true));
changedFiles.push(...sortMonsterFiles(dataDirectory));
changedFiles.push(...sortScenarioFiles(dataDirectory));
changedFiles.push(...sortScenarioFiles(dataDirectory, true));

changedFiles.forEach((changedFile) => {
    console.log("Automatically format file: " + changedFile);
})

if (changedFiles.length > 0) {
    console.log("");
}