import { gameManager } from 'src/app/game/businesslogic/Managers';
import { RETIREMENT_DIALOG_DISMISSED_TAG } from 'src/app/game/businesslogic/PersonalQuestManager';
import { CharacterRetirementDismissCommand } from 'src/app/game/commands/character/CharacterRetirementDismiss';
import { CharacterRpgCommand } from 'src/app/game/commands/character/CharacterRpg';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { RpgProgress } from 'src/app/game/model/CharacterProgress';

describe('Character rpg and retirement commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  it('sets rpg sheet values by path', () => {
    const character = createTestCharacter(1);
    new CharacterRpgCommand(1, 'attributes.logic', 3).execute();
    new CharacterRpgCommand(1, 'classSkills.11.gained', true).execute();
    const rpg = character.progress.rpg as RpgProgress;
    expect(rpg.attributes.logic).toBe(3);
    expect(rpg.classSkills[11].gained).toBe(true);
    expect(new CharacterRpgCommand(1, 'classSkills.12.gained', true).validParameters(1, 'classSkills.12.gained', true)).toBe(false);
    expect(new CharacterRpgCommand(2, 'pronouns', 'x').validParameters(2, 'pronouns', 'x')).toBe(false);
    expect(gameManager.characterRpgManager.rpgProgress(rpg).classSkills.length).toBe(12);
  });

  it('dismisses the retirement dialog once', () => {
    const character = createTestCharacter(1);
    new CharacterRetirementDismissCommand(1).execute();
    expect(character.tags).toEqual([RETIREMENT_DIALOG_DISMISSED_TAG]);
    expect(new CharacterRetirementDismissCommand(1).validParameters(1)).toBe(false);
    expect(new CharacterRetirementDismissCommand(2).validParameters(2)).toBe(false);
  });
});
