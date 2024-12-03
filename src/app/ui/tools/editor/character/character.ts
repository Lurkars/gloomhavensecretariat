import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { CharacterStat } from "src/app/game/model/data/CharacterStat";
import { CharacterClass, CharacterData } from "src/app/game/model/data/CharacterData";
import { ghsIsSpoiled } from "src/app/ui/helper/Static";
import { environment } from "src/environments/environment";

@Component({
	standalone: false,
  selector: 'ghs-character-editor',
  templateUrl: './character.html',
  styleUrls: ['../editor.scss', './character.scss']
})
export class CharacterEditorComponent implements OnInit {

  @ViewChild('inputCharacterData', { static: true }) inputCharacterData!: ElementRef;

  gameManager: GameManager = gameManager;
  encodeURIComponent = encodeURIComponent;
  isSpoiled = ghsIsSpoiled;
  characterData: CharacterData;
  characterError: any;
  edition: string | undefined;
  init: boolean = false;
  hpIndex: number = 0;
  CharacterClasses: CharacterClass[] = Object.values(CharacterClass);
  hpValues: number[][] = [
    [6, 7, 8, 9, 10, 11, 12, 13, 14],
    [8, 9, 11, 12, 14, 15, 17, 18, 20],
    [10, 12, 14, 16, 18, 20, 22, 24, 26]
  ]
  editions: string[] = [];
  charactersData: CharacterData[] = [];

  constructor(private route: ActivatedRoute, private router: Router) {
    this.characterData = new CharacterData();
    this.characterData.iconUrl = './assets/images/warning.svg';
    for (let i = 0; i < 9; i++) {
      this.characterData.stats.push(new CharacterStat(i + 1, i + 6));
    }
  }

  async ngOnInit() {
    await settingsManager.init(!environment.production);
    this.characterDataToJson();
    this.inputCharacterData.nativeElement.addEventListener('change', (event: any) => {
      this.characterDataFromJson();
    });

    this.editions = gameManager.editions(true);
    this.charactersData = gameManager.charactersData(this.edition);

    this.route.queryParams.subscribe({
      next: (queryParams) => {
        if (queryParams['edition']) {
          this.edition = queryParams['edition'];
          if (this.edition && gameManager.editions(true).indexOf(this.edition) == -1) {
            this.edition == undefined;
          }
          this.charactersData = gameManager.charactersData(this.edition);
        }

        if (queryParams['character']) {
          const characterData = gameManager.charactersData(this.edition).find((characterData) => characterData.name == queryParams['character']);
          if (characterData) {
            this.characterData = characterData;
            this.characterDataToJson();
          }
        }

        if (!this.characterData.edition && this.edition) {
          this.characterData.edition = this.edition;
        }
      }
    })

    this.init = true;
  }

  getCharacter(): Character {
    return new Character(this.characterData, 1);
  }

  changeHpIndex() {
    if (this.hpIndex < -1 || this.hpIndex > 2) {
      this.hpIndex = -1;
    }

    if (this.hpIndex != -1) {
      this.characterData.stats.forEach((stat) => {
        stat.health = this.hpValues[this.hpIndex][stat.level - 1];
      })
    }
    this.characterDataToJson();
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

  selectEdition(event: any) {
    if (this.editions.indexOf(event.target.value) != -1) {
      this.edition = event.target.value;
    } else {
      this.edition = undefined;
    }
    this.charactersData = gameManager.charactersData(this.edition);
  }

  loadCharacterData(event: any) {
    const index = +event.target.value;
    if (index != -1) {
      this.characterData = gameManager.charactersData(this.edition)[index];
    } else {
      this.characterData = new CharacterData();
      this.characterData.iconUrl = './assets/images/warning.svg';
      for (let i = 0; i < 9; i++) {
        this.characterData.stats.push(new CharacterStat(i + 1, i + 6));
      }
    }

    this.hpIndex = -1;
    this.hpValues.forEach((value, index) => {
      if (value.every((hp, level) => this.characterData.stats.find((stat) => stat.level == level + 1 && stat.health == hp))) {
        this.hpIndex = index;
      }
    })
    this.characterDataToJson();
    this.updateQueryParams();
  }

  updateQueryParams() {
    if (!this.characterData.edition && this.edition) {
      this.characterData.edition = this.edition;
    }
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: { edition: this.edition || undefined, character: this.characterData && this.characterData.name || undefined },
        queryParamsHandling: 'merge'
      });
  }

} 