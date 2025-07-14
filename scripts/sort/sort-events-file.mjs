import * as fs from 'fs';
import * as path from 'path';
import { sortEvent } from './sorter/event.mjs';

export const sortEventsFile = function (dataDirectory) {
    let changedFiles = [];
    if (fs.existsSync(dataDirectory) && fs.lstatSync(dataDirectory).isDirectory()) {
        for (let editionDirectory of fs.readdirSync(dataDirectory)) {
            const eventsFile = path.join(dataDirectory, editionDirectory, 'events.json');
            if (fs.existsSync(eventsFile) && fs.lstatSync(eventsFile).isFile()) {
                const f = fs.readFileSync(eventsFile, 'utf8');
                let events = JSON.parse(f);
                events = events.map((event) => sortEvent(event));

                events.sort((a, b) => {
                    if (a.type != b.type) {
                        return a.type < b.type ? -1 : 1;
                    }
                    return a.cardId < b.cardId ? -1 : 1;
                })

                if (f != JSON.stringify(events, undefined, 2)) {
                    changedFiles.push(eventsFile);
                    fs.writeFile(eventsFile, JSON.stringify(events, undefined, 2), 'utf8', (err) => {
                        if (err) {
                            console.error(err);
                            changedFiles.splice(changedFiles.indexOf(eventsFile), 1);
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
