import * as fs from 'fs';
import * as path from 'path';
import { sortCharacterFiles } from "./sort/sort-character-files.mjs";
import { sortDeckFiles } from "./sort/sort-deck-files.mjs";
import { sortEventsFile } from "./sort/sort-events-file.mjs";
import { sortItemFile } from "./sort/sort-item-file.mjs";
import { sortMonsterFiles } from "./sort/sort-monster-files.mjs";
import { sortScenarioFiles } from "./sort/sort-scenario-files.mjs";


const dataDirectory = process.argv[2];

export const checkJson = function (folder) {
    fs.readdirSync(folder).forEach((file) => {
        const filePath = path.join(folder, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            checkJson(filePath)
        } else if (fs.lstatSync(filePath).isFile() && filePath.endsWith('.json')) {
            const f = fs.readFileSync(filePath, 'utf8');
            try {
                JSON.parse(f);
            } catch (e) {
                console.error("Error parsing: " + filePath);
                throw e;
            }
        }
    })
}

checkJson(path.join(dataDirectory));

let changedFiles = [];

changedFiles.push(...sortCharacterFiles(dataDirectory));
changedFiles.push(...sortDeckFiles(dataDirectory));
changedFiles.push(...sortItemFile(dataDirectory, true));
changedFiles.push(...sortMonsterFiles(dataDirectory));
changedFiles.push(...sortScenarioFiles(dataDirectory));
changedFiles.push(...sortScenarioFiles(dataDirectory, true));
changedFiles.push(...sortEventsFile(dataDirectory));

changedFiles.forEach((changedFile) => {
    console.log("Automatically format file: " + changedFile);
})

if (changedFiles.length > 0) {
    console.log("");
}