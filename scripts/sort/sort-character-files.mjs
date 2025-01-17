import * as fs from 'fs';
import * as path from 'path';
import { sortCharacter } from './sorter/character.mjs';

export const sortCharacterFiles = function (dataDirectory) {
    let changedFiles = [];
    if (fs.existsSync(dataDirectory) && fs.lstatSync(dataDirectory).isDirectory()) {
        for (let editionDirectory of fs.readdirSync(dataDirectory)) {
            const characterDirectory = path.join(dataDirectory, editionDirectory, 'character');
            if (fs.existsSync(characterDirectory) && fs.lstatSync(characterDirectory).isDirectory()) {
                for (let file of fs.readdirSync(characterDirectory)) {
                    const characterFile = path.join(characterDirectory, file);
                    if (fs.lstatSync(characterFile).isFile()) {
                        const f = fs.readFileSync(characterFile, 'utf8');
                        let character = JSON.parse(f);

                        character = sortCharacter(character);

                        if (f != JSON.stringify(character, undefined, 2)) {
                            changedFiles.push(characterFile);
                            fs.writeFile(characterFile, JSON.stringify(character, undefined, 2), 'utf8', (err) => {
                                if (err) {
                                    console.error(err);
                                    changedFiles.splice(changedFiles.indexOf(characterFile), 1);
                                }
                            });
                        }
                    }
                }
            }
        }
    } else {
        console.error("No valid data folder:", dataDirectory);
    }

    return changedFiles;
}
