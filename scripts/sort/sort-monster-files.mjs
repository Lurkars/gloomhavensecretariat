import * as fs from 'fs';
import * as path from 'path';
import { sortMonster } from './sorter/monster.mjs';

export const sortMonsterFiles = function (dataDirectory) {
    let changedFiles = [];
    if (fs.existsSync(dataDirectory) && fs.lstatSync(dataDirectory).isDirectory()) {
        for (let editionDirectory of fs.readdirSync(dataDirectory)) {
            const monsterDirectory = path.join(dataDirectory, editionDirectory, 'monster');
            if (fs.existsSync(monsterDirectory) && fs.lstatSync(monsterDirectory).isDirectory()) {
                for (let file of fs.readdirSync(monsterDirectory)) {
                    const monsterFile = path.join(monsterDirectory, file);
                    if (fs.lstatSync(monsterFile).isFile()) {
                        const f = fs.readFileSync(monsterFile, 'utf8');
                        let monster = JSON.parse(f);

                        monster = sortMonster(monster);
                        if (f != JSON.stringify(monster, undefined, 2)) {
                            changedFiles.push(monsterFile);
                            fs.writeFile(monsterFile, JSON.stringify(monster, undefined, 2), 'utf8', (err) => {
                                if (err) {
                                    console.error(err);
                                    changedFiles.splice(changedFiles.indexOf(monsterFile), 1);
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
