import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { Summon, SummonState } from 'src/app/game/model/Summon';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { CharacterLevelDialogComponent } from 'src/app/ui/figures/entities-menu/level-dialog/level-dialog';
import { SummonDialogComponent } from 'src/app/ui/figures/entities-menu/summon-dialog/summon-dialog';
import { ghsDefaultDialogPositions, ghsValueSign } from 'src/app/ui/helper/Static';

export class CharacterHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  update() {
    if (this.component.entity instanceof Character) {
      for (let index = 0; index < this.component.entity.tokens.length; index++) {
        this.component.characterTokenValues[index] = 0;
      }

      this.component.identities = settingsManager.settings.characterIdentities ? [...this.component.entity.identities] : [];
    }
  }

  setIdentity(index: number) {
    if (this.component.entity instanceof Character && index !== this.component.entity.identity) {
      const timeTokens =
        this.component.entity.name === 'blinkblade' &&
        this.component.entity.tags.includes('time_tokens') &&
        this.component.entity.primaryToken === 0;
      if (
        (gameManager.game.state === GameState.next ||
          (gameManager.game.state === GameState.draw &&
            this.component.entity.identity === 0 &&
            this.component.entity.tokenValues[0] === 0)) &&
        timeTokens
      ) {
        return;
      }
      this.component.before(
        'identity',
        this.component.entity.edition,
        this.component.entity.name,
        index,
        this.component.entity.identities[index]
      );
      this.component.entity.identity = index;
      gameManager.stateManager.after();
    }
  }

  toggleAbsent() {
    if (this.component.entity instanceof Character && (this.component.entity.absent || gameManager.characterManager.characterCount() > 1)) {
      this.component.before(this.component.entity.absent ? 'unsetAbsent' : 'setAbsent');
      this.component.entity.absent = !this.component.entity.absent;
      if (this.component.entity.absent && this.component.entity.active) {
        gameManager.roundManager.toggleFigure(this.component.entity);
      }
      gameManager.stateManager.after();
    }
  }

  toggleSummonStatus() {
    if (this.component.entity instanceof Summon) {
      let state = SummonState.new;
      if (this.component.entity.state === SummonState.new) {
        state = SummonState.true;
      }
      this.component.before('setSummonState', state);
      this.component.entity.state = state;
      gameManager.stateManager.after();
    }
  }

  openLevelDialog() {
    if (
      this.component.figure instanceof Character &&
      (this.component.entity instanceof Character || this.component.entity instanceof Summon)
    ) {
      const dialogData = {
        panelClass: ['dialog'],
        data: {
          character: this.component.figure,
          summon: this.component.entity,
          positionElement: this.component.data.positionElement
        },
        positionStrategy:
          this.component.data.positionElement &&
          this.component.overlay
            .position()
            .flexibleConnectedTo(this.component.data.positionElement)
            .withPositions(ghsDefaultDialogPositions())
      };
      if (this.component.entity instanceof Character) {
        this.component.dialog.open(CharacterLevelDialogComponent, dialogData);
      } else {
        this.component.dialog.open(SummonDialogComponent, dialogData);
      }
      this.component.dialogRef.close(true);
    }
  }

  close() {
    if (this.component.entity instanceof Character) {
      const character = this.component.entity;
      if (this.component.experience !== 0) {
        this.component.before('changeXP', ghsValueSign(this.component.experience));
        character.experience += this.component.experience;
        if (character.experience < 0) {
          character.experience = 0;
        }
        gameManager.stateManager.after();
      }

      if (this.component.loot !== 0) {
        this.component.before('changeLoot', ghsValueSign(this.component.loot));
        character.loot += this.component.loot;
        if (character.loot < 0) {
          character.loot = 0;
        }
        gameManager.stateManager.after();
      }

      if (this.component.characterToken !== 0) {
        let token = character.token + this.component.characterToken;
        if (token < 0) {
          token = 0;
        }
        this.component.before('characterToken', character.name, token);
        character.token = token;
        this.component.characterToken = 0;
        gameManager.stateManager.after();
      }

      for (let index = 0; index < character.tokens.length; index++) {
        if (this.component.characterTokenValues[index] !== 0) {
          let tokenValue = character.tokenValues[index] + this.component.characterTokenValues[index];
          if (tokenValue < 0) {
            tokenValue = 0;
          }
          this.component.before('characterTokenValue', character.name, character.tokens[index], tokenValue);
          character.tokenValues[index] = tokenValue;
          this.component.characterTokenValues[index] = 0;
          gameManager.stateManager.after();
        }
      }
    }
  }
}
