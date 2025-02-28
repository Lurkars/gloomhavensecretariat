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

    if (scenario.unlocks) {
        scenario.unlocks = scenario.unlocks.sort((a, b) => {
            if (!isNaN(+a) && !isNaN(+b)) {
                return +a - +b;
            } else if (!isNaN(a)) {
                return -1;
            } else if (!isNaN(b)) {
                return 1;
            } else {
                return a < b ? -1 : 1;
            }
        })
    }

    if (scenario.rewards) {
        if (scenario.rewards.hints) {
            scenario.rewards.hints = sortObjectKeys(scenario.rewards.hints, "globalAchievements", "partyAchievements", "lostPartyAchievements", "envelopes", "gold", "experience", "collectiveGold", "reputation", "prosperity", "perks", "battleGoals", "items", "chooseItem", "itemDesigns", "events", "custom");
        }

        scenario.rewards = sortObjectKeys(scenario.rewards, "globalAchievements", "partyAchievements", "lostPartyAchievements", "envelopes", "gold", "experience", "collectiveGold", "reputation", "prosperity", "perks", "battleGoals", "items", "chooseItem", "itemDesigns", "events", "overlayCampaignSticker", "overlaySticker", "custom", "ignoredBonus", "hints");
    }

    if (scenario.rules) {
        scenario.rules = scenario.rules.map((rule) => sortScenarioRule(rule));
    }

    if (scenario.requirements) {
        scenario.requirements = scenario.requirements.map((requirements) => sortObjectKeys(requirements, 'global', 'party', 'buildings', 'campaignSticker', 'puzzle', 'solo'));
    }

    return sortObjectKeys(scenario, 'index', 'group', 'name', 'flowChartGroup', 'errata', 'coordinates', 'edition', 'complexity', 'parent', 'parentSections', 'level', 'conclusion', 'repeatable', 'named', 'hideIndex', 'blockedSections', 'marker', 'spoiler', 'initial', 'random', 'solo', 'allyDeck', 'resetRound', 'unlocks', 'requires', 'requirements', 'blocks', 'links', "forcedLinks", "rewards", 'monsters', 'allies', 'allied', 'drawExtra', 'objectives', 'lootDeckConfig', 'rules', 'rooms');
}