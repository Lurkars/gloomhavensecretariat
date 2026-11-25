import { gameManager, settingsManager, soundboardManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
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
      if (!gameManager.characterManager.canSetIdentity(this.component.entity, index)) {
        return;
      }
      this.component.before(
        'identity',
        this.component.entity.edition,
        this.component.entity.name,
        index,
        this.component.entity.identities[index]
      );
      gameManager.characterManager.setIdentity(this.component.entity, index);
      gameManager.stateManager.after();
    }
  }

  toggleAbsent() {
    const entity = this.component.entity;
    if (entity instanceof Character && gameManager.characterManager.canSetAbsent(entity, !entity.absent)) {
      this.component.before(entity.absent ? 'unsetAbsent' : 'setAbsent');
      gameManager.characterManager.setAbsent(entity, !entity.absent);
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
        gameManager.characterManager.changeExperience(character, this.component.experience);
        gameManager.stateManager.after();
      }

      if (this.component.loot !== 0) {
        this.component.before('changeLoot', ghsValueSign(this.component.loot));
        gameManager.characterManager.changeLoot(character, this.component.loot);
        gameManager.stateManager.after();
      }

      if (gameManager.characterManager.canChangeToken(this.component.characterToken)) {
        this.component.before(
          'characterToken',
          character.name,
          gameManager.characterManager.tokenAfter(character, this.component.characterToken)
        );
        gameManager.characterManager.changeToken(character, this.component.characterToken);
        this.component.characterToken = 0;
        gameManager.stateManager.after();
      }

      for (let index = 0; index < character.tokens.length; index++) {
        const value = this.component.characterTokenValues[index];
        if (gameManager.characterManager.canChangeTokenValue(character, index, value)) {
          this.component.before(
            'characterTokenValue',
            character.name,
            character.tokens[index],
            gameManager.characterManager.tokenValueAfter(character, index, value)
          );
          gameManager.characterManager.changeTokenValue(character, index, value);
          this.component.characterTokenValues[index] = 0;
          gameManager.stateManager.after();
        }
      }

      if (gameManager.lootManager.easter && character.exhausted) {
        soundboardManager.play('2h');
      }
    }
  }
}
