import { sortCharacterStat } from './character-stat.mjs';
import { sortSummon } from './summon.mjs';
import { sortObjectKeys } from './sort-object-keys.mjs';

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
        character.availableSummons.forEach((summonData) => summonData = sortSummon(summonData));
    }

    return sortObjectKeys(character, 'name', 'characterClass', 'gender', 'icon', 'thumbnail', 'edition', 'color', 'spoiler', 'locked', 'marker', 'deck', 'stats', 'summon', 'characterClass', 'availableSummons', 'perks', 'masteries', 'additionalModifier');
}