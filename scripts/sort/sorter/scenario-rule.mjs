import { sortObjectKeys } from './sort-helper.mjs';

export const sortScenarioRule = function (scenarioRule) {

    Object.keys(scenarioRule).forEach((key) => {
        if (!scenarioRule[key]) {
            scenarioRule[key] = undefined;
        }
    });

    if (scenarioRule.spawns) {
        scenarioRule.spawns = scenarioRule.spawns.map((spawnData) => {

            if (spawnData.monster) {
                spawnData.monster = sortObjectKeys(spawnData.monster, 'name', 'type', 'player2', 'player3', 'player4', 'marker', 'tags');
            }

            sortObjectKeys(spawnData, 'monster', 'count', 'marker', 'summon', 'manual')

            return spawnData;
        })
    };

    return sortObjectKeys(scenarioRule, 'round', 'start', 'always', 'once', 'requiredRooms', 'requiredRules', 'note', 'rooms', 'sections', 'figures', 'spawns', 'elements', 'disableRules', 'finish');
}