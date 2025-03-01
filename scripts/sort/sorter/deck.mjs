import { sortAbility } from './ability.mjs';
import { sortObjectKeys } from './sort-helper.mjs';

export const sortDeck = function (deck) {

    if (deck.abilities) {
        deck.abilities = deck.abilities.map((ability) => sortAbility(ability));
        deck.abilities.sort((a, b) => {
            if (a.cardId && b.cardId) {
                return a.cardId - b.cardId;
            }

            if (a.cardId && !b.cardId) {
                return 1;
            } else if (!a.cardId && b.cardId) {
                return -1;
            }

            if (a.level && b.level) {
                return a.level - b.level;
            }

            if (a.initiative && b.initiative) {
                return a.initiative - b.initiative;
            }

            if (a.name && b.name) {
                if (a.name < b.name) {
                    return -1;
                } else {
                    return 1;
                }
            }

            return 0;
        })
    }

    return sortObjectKeys(deck, 'name', 'edition', 'character', 'abilities');
}