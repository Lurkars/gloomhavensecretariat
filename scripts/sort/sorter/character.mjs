import { sortCharacterStat } from './character-stat.mjs';
import { sortSummon } from './summon.mjs';
import { sortObjectKeys, removeEmptyValues } from './sort-helper.mjs';

export const sortCharacter = function (character) {

    if (character.stats) {
        character.stats = character.stats.map((stat) => sortCharacterStat(stat)).sort((a, b) => {
            return a.level - b.level;
        });
    }

    if (character.summon) {
        character.summon = sortCharacterSummon(character.summon);
    }

    if (character.availableSummons) {
        character.availableSummons = character.availableSummons.map((summonData) => sortSummon(summonData)).sort((a, b) => {
            if (a.level == b.level) {
                return (+a.cardId) - (+b.cardId);
            } else if (!a.level && b.level) {
                return -1;
            } else if (!b.level && a.level) {
                return 1;
            } else {
                return a.level - b.level;
            }
        });
    }

    removeEmptyValues(character);

    return sortObjectKeys(character, 'name', 'characterClass', 'gender', 'icon', 'iconUrl', 'thumbnail', 'thumbnailUrl', 'noArtwork', 'edition', 'identities', 'handSize', 'color', 'spoiler', 'locked', 'marker', 'deck', 'stats', 'summon', 'characterClass', 'availableSummons', 'perks', 'masteries', 'additionalModifier');
}