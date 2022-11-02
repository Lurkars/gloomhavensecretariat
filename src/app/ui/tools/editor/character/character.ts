import { Dialog } from "@angular/cdk/dialog";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { CharacterStat } from "src/app/game/model/CharacterStat";
import { CharacterData } from "src/app/game/model/data/CharacterData";

@Component({
  selector: 'ghs-character-editor',
  templateUrl: './character.html',
  styleUrls: ['../editor.scss', './character.scss']
})
export class CharacterEditorComponent implements OnInit {

  @ViewChild('inputCharacterData', { static: true }) inputCharacterData!: ElementRef;

  gameManager: GameManager = gameManager;
  encodeURIComponent = encodeURIComponent;
  characterData: CharacterData;
  characterError: any;

  constructor(private dialog: Dialog) {
    this.characterData = new CharacterData();
    this.characterData.iconUrl = './assets/images/warning.svg';
    for (let i = 0; i < 9; i++) {
      this.characterData.stats.push(new CharacterStat(i, i));
    }
  }

  async ngOnInit() {
    await settingsManager.init();
    this.characterDataToJson();
    this.inputCharacterData.nativeElement.addEventListener('change', (event: any) => {
      this.characterDataFromJson();
    });
  }

  getCharacter(): Character {
    return new Character(this.characterData, 1);
  }

  characterDataToJson() {
    this.characterData.stats.sort((a, b) => {
      return a.level - b.level;
    })

    let compactData: any = JSON.parse(JSON.stringify(this.characterData));

    this.inputCharacterData.nativeElement.value = JSON.stringify(compactData, null, 2);
  }

  characterDataFromJson() {
    this.characterError = "";
    if (this.inputCharacterData.nativeElement.value) {
      try {
        this.characterData = JSON.parse(this.inputCharacterData.nativeElement.value);
        return;
      } catch (e) {
        this.characterData = new CharacterData();
        this.characterData.iconUrl = './assets/images/warning.svg';
        for (let i = 0; i < 9; i++) {
          this.characterData.stats.push(new CharacterStat(i, i));
        }
        this.characterError = e;
      }
    }
  }

  loadCharacterData(event: any) {
    const index = +event.target.value;
    if (index != -1) {
      this.characterData = gameManager.charactersData(true)[index];
    } else {
      this.characterData = new CharacterData();
      this.characterData.iconUrl = './assets/images/warning.svg';
      for (let i = 0; i < 9; i++) {
        this.characterData.stats.push(new CharacterStat(i, i));
      }
    }
    this.characterDataToJson();
  }

} 