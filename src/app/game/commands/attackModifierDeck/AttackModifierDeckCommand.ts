import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';

export type ResolvedAttackModifierDeck = {
  deck: AttackModifierDeck;
  character: Character | undefined;
  ally: boolean;
  townGuard: boolean;
  commit: () => void;
};

export function resolveAttackModifierDeck(id: BASE_TYPE | undefined): ResolvedAttackModifierDeck | undefined {
  if (id === 'm') {
    return {
      deck: gameManager.game.monsterAttackModifierDeck,
      character: undefined,
      ally: false,
      townGuard: false,
      commit: () => {}
    };
  } else if (id === 'a') {
    return {
      deck: gameManager.game.allyAttackModifierDeck,
      character: undefined,
      ally: true,
      townGuard: false,
      commit: () => {}
    };
  } else if (id === 't') {
    if (!gameManager.game.party.townGuardDeck) {
      return undefined;
    }
    const deck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(
      gameManager.game.party,
      gameManager.campaignManager.campaignData()
    );
    gameManager.attackModifierManager.fromModel(deck, gameManager.game.party.townGuardDeck);
    const resolved: ResolvedAttackModifierDeck = {
      deck: deck,
      character: undefined,
      ally: false,
      townGuard: true,
      commit: () => (gameManager.game.party.townGuardDeck = resolved.deck.toModel())
    };
    return resolved;
  }
  const character = findCharacter(id);
  if (character) {
    return {
      deck: character.attackModifierDeck,
      character: character,
      ally: false,
      townGuard: false,
      commit: () => {}
    };
  }
  return undefined;
}

export abstract class AttackModifierDeckCommandImpl extends CommandImpl {
  private resolvedDeck: ResolvedAttackModifierDeck | undefined;

  resolved(): ResolvedAttackModifierDeck | undefined {
    if (!this.resolvedDeck) {
      this.resolvedDeck = resolveAttackModifierDeck(this.parameters[0]);
    }
    return this.resolvedDeck;
  }

  override execute() {
    super.execute();
    const resolved = this.resolved();
    if (resolved) {
      resolved.commit();
    }
  }
}
