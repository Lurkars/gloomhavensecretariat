import { sortRoom } from "./room.mjs";
import { sortObjectKeys } from './sort-helper.mjs';

export const sortScenario = function (scenario) {

    Object.keys(scenario).forEach((key) => {
        if (!scenario[key]) {
            scenario[key] = undefined;
        }
    });

    if (scenario.rooms) {
        scenario.rooms = scenario.rooms.map((room) => sortRoom(room));
    }

    if (scenario.monsters) {
        scenario.monsters = scenario.monsters.sort((a, b) => {
            if (a.toLowerCase() < b.toLowerCase()) {
                return -1;
            } else {
                return 1;
            }
        })
    }

    if (scenario.rewards) {
        if (scenario.rewards.hints) {
            scenario.rewards.hints = sortObjectKeys(scenario.rewards.hints, "globalAchievements", "partyAchievements", "lostPartyAchievements", "envelopes", "gold", "experience", "collectiveGold", "reputation", "prosperity", "perks", "battleGoals", "items", "chooseItem", "itemDesigns", "events", "custom");
        }

        scenario.rewards = sortObjectKeys(scenario.rewards, "globalAchievements", "partyAchievements", "lostPartyAchievements", "envelopes", "gold", "experience", "collectiveGold", "reputation", "prosperity", "perks", "battleGoals", "items", "chooseItem", "itemDesigns", "events", "custom", "ignoredBonus", "hints");
    }

    return sortObjectKeys(scenario, 'index', 'group', 'name', 'edition', 'parent', 'parentSections', 'blockedSections', 'marker', 'spoiler', 'initial', 'random', 'solo', 'allyDeck', 'resetRound', 'unlocks', 'requires', 'blocks', 'links', "forcedLinks", "rewards", 'monsters', 'allies', 'drawExtra', 'objectives', 'lootDeckConfig', 'rules', 'rooms');
}