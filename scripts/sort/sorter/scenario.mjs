import { sortRoom } from "./room.mjs";
import { sortScenarioRule } from "./scenario-rule.mjs";
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

    if (scenario.rules) {
        scenario.rules = scenario.rules.map((rule) => sortScenarioRule(rule));
    }
    
    if (scenario.requiredAchievements) {
        scenario.requiredAchievements = scenario.requiredAchievements.map((requiredAchievements) => sortObjectKeys(requiredAchievements, 'global', 'party'));
    }

    return sortObjectKeys(scenario, 'index', 'group', 'name', 'gridLocation', 'edition', 'parent', 'parentSections', 'conclusion', 'blockedSections', 'marker', 'spoiler', 'initial', 'random', 'solo', 'allyDeck', 'resetRound', 'unlocks', 'requires', 'requiredAchievements', 'blocks', 'links', "forcedLinks", "rewards", 'monsters', 'allies', 'drawExtra', 'objectives', 'lootDeckConfig', 'rules', 'rooms');
}