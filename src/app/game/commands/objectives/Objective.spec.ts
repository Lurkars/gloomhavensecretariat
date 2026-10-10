import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { createTestCharacter, createTestObjective, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { ObjectiveActionsCommand, ObjectiveActionsRestoreCommand } from 'src/app/game/commands/objectives/ObjectiveActions';
import { ObjectiveAddCommand } from 'src/app/game/commands/objectives/ObjectiveAdd';
import { ObjectiveAmDeckCommand } from 'src/app/game/commands/objectives/ObjectiveAmDeck';
import { ObjectiveEntityAddCommand } from 'src/app/game/commands/objectives/ObjectiveEntityAdd';
import { ObjectiveRemoveAllCommand, ObjectiveRemoveCommand } from 'src/app/game/commands/objectives/ObjectiveRemove';
import { ActionType } from 'src/app/game/model/data/Action';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';

describe('Objective commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  it('adds objectives and escorts with one standee', () => {
    new ObjectiveAddCommand(1).execute();
    new ObjectiveAddCommand(1, true).execute();
    const objectives = gameManager.game.figures.filter((figure) => figure instanceof ObjectiveContainer) as ObjectiveContainer[];
    expect(objectives.length).toBe(2);
    expect(objectives.some((objective) => objective.escort)).toBe(true);
    expect(objectives.every((objective) => objective.entities.length === 1)).toBe(true);
  });

  it('adds a standee with the next free number', () => {
    const objective = createTestObjective(false, 1);
    new ObjectiveEntityAddCommand('objective-' + objective.uuid, 1).execute();
    expect(objective.entities.map((entity) => entity.number)).toEqual([1, 2]);
  });

  it('removes one or all objectives', () => {
    const objective = createTestObjective();
    createTestObjective(true);
    const character = createTestCharacter(1);
    new ObjectiveRemoveCommand('objective-' + objective.uuid).execute();
    expect(gameManager.game.figures.length).toBe(2);
    new ObjectiveRemoveAllCommand().execute();
    expect(gameManager.game.figures).toEqual([character]);
  });

  it('toggles the attack modifier deck of an objective', () => {
    const objective = createTestObjective(true);
    const id = 'escort-' + objective.uuid;
    objective.amDeck = undefined;
    new ObjectiveAmDeckCommand(id, 'M').execute();
    new ObjectiveAmDeckCommand(id, 'M').execute();
    expect(objective.amDeck).toBe('M');
    new ObjectiveAmDeckCommand(id, '').execute();
    expect(objective.amDeck).toBeUndefined();
    expect(new ObjectiveAmDeckCommand(id, 'unknown').validParameters(id, 'unknown')).toBe(false);
  });

  it('sets the actions of an objective from json', () => {
    const objective = createTestObjective();
    const id = 'objective-' + objective.uuid;
    new ObjectiveActionsCommand(id, JSON.stringify([{ type: ActionType.attack, value: 2 }])).execute();
    expect(objective.actions?.length).toBe(1);
    expect(new ObjectiveActionsCommand(id, '{').validParameters(id, '{')).toBe(false);
  });

  it('can only restore default actions of scenario objectives', () => {
    const objective = createTestObjective();
    const id = 'objective-' + objective.uuid;
    expect(new ObjectiveActionsRestoreCommand(id).validParameters(id)).toBe(false);
  });
});
