import * as fs from 'fs';
import * as path from 'path';
import { sortScenario } from './sorter/scenario.mjs';

export const sortScenarioFiles = function (dataDirectory, sections = false) {
    let changedFiles = [];
    if (fs.existsSync(dataDirectory) && fs.lstatSync(dataDirectory).isDirectory()) {
        for (let editionDirectory of fs.readdirSync(dataDirectory)) {
            const scenarioDirectory = path.join(dataDirectory, editionDirectory, sections ? 'sections' : 'scenarios');
            if (fs.existsSync(scenarioDirectory) && fs.lstatSync(scenarioDirectory).isDirectory()) {
                for (let file of fs.readdirSync(scenarioDirectory)) {
                    const scenarioFile = path.join(scenarioDirectory, file);
                    const f = fs.readFileSync(scenarioFile, 'utf8');
                    let scenario = JSON.parse(f);

                    scenario = sortScenario(scenario);
                    if (f != JSON.stringify(scenario, undefined, 2)) {
                        changedFiles.push(scenarioFile);
                        fs.writeFile(scenarioFile, JSON.stringify(scenario, undefined, 2), 'utf8', (err) => {
                            if (err) {
                                console.error(err);
                                changedFiles.splice(changedFiles.indexOf(scenarioFile), 1);
                            }
                        });
                    }
                }
            }
        }
    } else {
        console.error("No valid data folder:", dataDirectory);
    }
    return changedFiles;
}
