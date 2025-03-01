import * as fs from 'fs';
import * as path from 'path';
import { sortObjectKeys } from './sorter/sort-helper.mjs';

export const sortItemFile = function (dataDirectory) {
    let changedFiles = [];
    if (fs.existsSync(dataDirectory) && fs.lstatSync(dataDirectory).isDirectory()) {
        for (let editionDirectory of fs.readdirSync(dataDirectory)) {
            const itemFile = path.join(dataDirectory, editionDirectory, 'items.json');
            if (fs.existsSync(itemFile) && fs.lstatSync(itemFile).isFile()) {
                const f = fs.readFileSync(itemFile, 'utf8');
                let items = JSON.parse(f);
                items = items.map((itemData) => sortObjectKeys(itemData, 'id', 'name', 'cost', 'count', 'edition', 'solo', 'slot', 'spent', 'consumed', 'persistent', 'lost', 'round', 'random', 'blueprint', 'minusOne', 'slots', 'slotsBack', 'unlockProsperity', 'unlockScenario', 'resources', 'resourcesAny', 'requiredItems', 'requiredBuilding', 'requiredBuildingLevel', 'actions', 'actionsBack', 'summon'));

                if (f != JSON.stringify(items, undefined, 2)) {
                    changedFiles.push(itemFile);
                    fs.writeFile(itemFile, JSON.stringify(items, undefined, 2), 'utf8', (err) => {
                        if (err) {
                            console.error(err);
                            changedFiles.splice(changedFiles.indexOf(itemFile), 1);
                        }
                    });
                }
            }
        }
    } else {
        console.error("No valid data folder:", dataDirectory);
    }
    return changedFiles;
}
