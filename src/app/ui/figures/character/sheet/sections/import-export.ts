import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character, GameCharacterModel } from 'src/app/game/model/Character';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { downloadJson, ghsInputFullScreenCheck } from 'src/app/ui/helper/Static';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-character-sheet-import-export',
  templateUrl: 'import-export.html',
  styleUrls: ['../../../sheet.scss', './import-export.scss']
})
export class CharacterSheetImportExportComponent extends CharacterSheetSection {
  ghsInputFullScreenCheck = ghsInputFullScreenCheck;

  exportCharacter() {
    downloadJson(this.character.toModel(), (this.character.title ? this.character.title + '_' : '') + this.character.name + '.json');
  }

  importCharacter(event: any) {
    const parent = event.target.parentElement;
    parent.classList.remove('error');
    try {
      const reader = new FileReader();
      reader.addEventListener('load', (event: any) => {
        const characterModel: GameCharacterModel = Object.assign(
          new Character(this.character, this.character.level).toModel(),
          JSON.parse(event.target.result)
        );
        if (characterModel.name !== this.character.name || characterModel.edition !== this.character.edition) {
          parent.classList.add('error');
        } else {
          gameManager.stateManager.before('importCharacter', this.characterName);
          this.character.fromModel(characterModel);
          gameManager.stateManager.after();
        }
      });

      reader.readAsText(event.target.files[0]);
    } catch (e: any) {
      console.warn(e);
      parent.classList.add('error');
    }
  }
}
