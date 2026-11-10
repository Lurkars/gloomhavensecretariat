import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const quests = JSON.parse(readFileSync(new URL('../data/fh/personal-quests.json', import.meta.url)));
const labels = JSON.parse(readFileSync(new URL('../data/fh/label/en.json', import.meta.url)));
const german = JSON.parse(readFileSync(new URL('../data/fh/label/de.json', import.meta.url))).personalQuest.fh['509'];

test('Frosthaven quest 12 tracks scenarios 71–76 and reveals each after all previous steps', () => {
    const quest = quests.find((quest) => quest.cardId === '509');
    assert.equal(quest.requirements.length, 6);
    assert.equal(quest.description, '%data.personalQuest.fh.509.description%');
    assert.equal(german.description, 'Schalte sofort "Invasion der Kais (71)" frei und schließe es ab');
    assert.ok(JSON.stringify(labels).includes('Follow \\"Invasion of the Docks (71)\\" to a conclusion'));
    quest.requirements.forEach((requirement, index) => {
        assert.equal(requirement.autotrack, `scenario:${71 + index}`);
        assert.equal(requirement.counter, 1);
        assert.equal(german[index + 1], `%game.scenarioNumber:${71 + index}% abschließen`);
        assert.ok(JSON.stringify(labels).includes(`Complete %game.scenarioNumber:${71 + index}%`));
        if (index > 0) {
            assert.equal(requirement.hidden, true);
            assert.deepEqual(requirement.requires, Array.from({ length: index }, (_, i) => i + 1));
        } else {
            assert.ok(!requirement.hidden);
            assert.ok(!requirement.requires?.length);
        }
    });
});
