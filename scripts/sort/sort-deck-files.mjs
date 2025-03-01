import * as fs from 'fs';
import * as path from 'path';
import { sortDeck } from './sorter/deck.mjs';

export const sortDeckFiles = function (dataDirectory) {
    let changedFiles = [];
    if (fs.existsSync(dataDirectory) && fs.lstatSync(dataDirectory).isDirectory()) {
        for (let editionDirectory of fs.readdirSync(dataDirectory)) {
            for (let type of ['character', 'monster']) {
                const deckDirectory = path.join(dataDirectory, editionDirectory, type, 'deck');
                if (fs.existsSync(deckDirectory) && fs.lstatSync(deckDirectory).isDirectory()) {
                    for (let file of fs.readdirSync(deckDirectory)) {
                        const deckFile = path.join(deckDirectory, file);
                        if (fs.lstatSync(deckFile).isFile()) {
                            const f = fs.readFileSync(deckFile, 'utf8');
                            let deck = JSON.parse(f);

                            deck = sortDeck(deck);

                            if (f != JSON.stringify(deck, undefined, 2)) {
                                changedFiles.push(deckFile);
                                fs.writeFile(deckFile, JSON.stringify(deck, undefined, 2), 'utf8', (err) => {
                                    if (err) {
                                        console.error(err);
                                        changedFiles.splice(changedFiles.indexOf(deckFile), 1);
                                    }
                                });
                            }
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
