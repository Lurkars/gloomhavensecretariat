import { Dialog } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { Objective } from "src/app/game/model/Objective";
import { ghsDefaultDialogPositions } from "src/app/ui/helper/Static";
import { CharacterInitiativeDialogComponent } from "./initiative-dialog";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";


@Component({
  selector: 'ghs-character-initiative',
  templateUrl: 'initiative.html',
  styleUrls: ['./initiative.scss']
})
export class CharacterInitiativeComponent implements OnInit, AfterViewInit {

  @Input() figure!: Character | Objective | ObjectiveContainer;
  @ViewChild('initativeInput', { static: false }) initiativeInput!: ElementRef;

  characterManager: CharacterManager = gameManager.characterManager;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  character: Character | undefined;
  objective: Objective | undefined;
  objectiveContainer: ObjectiveContainer | undefined;

  constructor(private dialog: Dialog, private overlay: Overlay, public elementRef: ElementRef) { };

  ngOnInit(): void {
    if (this.figure instanceof Character) {
      this.character = this.figure;
    } else if (this.figure instanceof Objective) {
      this.objective = this.figure;
    } else if (this.figure instanceof ObjectiveContainer) {
      this.objectiveContainer = this.figure;
    }
  }

  ngAfterViewInit(): void {
    if (this.initiativeInput) {
      this.initiativeInput.nativeElement.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Tab' && gameManager.game.state == GameState.draw) {
          const tabindex = this.tabindex();
          let nextIndex = event.shiftKey ? tabindex - 1 : tabindex + 1;
          let next = document.getElementById('initiative-input-' + nextIndex);
          if (!next && tabindex > 0) {
            next = document.getElementById('initiative-input-0');
          } else if (!next && nextIndex < 0) {
            nextIndex = gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length - 1;
            next = document.getElementById('initiative-input-' + nextIndex);
            while (!next && nextIndex > 0) {
              nextIndex--;
              next = document.getElementById('initiative-input-' + nextIndex);
            }
          }
          if (next) {
            next.focus();
          }
          event.preventDefault();
          event.stopPropagation();
        }
      })
    }
  }

  initiativeHidden(): boolean {
    return gameManager.game.state == GameState.draw && this.figure instanceof Character && !this.figure.initiativeVisible;
  }

  updateInitiative(event: any) {
    const initiative: number = isNaN(+event.target.value) ? 0 : +event.target.value;
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initiative >= 0 || initiative > 0) && initiative < 100) {
      this.setInitiative(initiative);
    } else {
      event.target.value = (this.figure.initiative < 10 ? '0' : '') + this.figure.initiative;
    }
  }

  setInitiative(initiative: number) {
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initiative >= 0 || initiative > 0) && initiative < 100 && initiative != this.figure.initiative) {
      if (this.character) {
        gameManager.stateManager.before("setInitiative", "data.character." + this.figure.name, "" + initiative);
        this.character.initiativeVisible = true;
        this.character.longRest = false;
        if (initiative == 99) {
          this.character.longRest = true;
        }
      } else if (this.objective) {
        gameManager.stateManager.before("setInitiative", "data.objective." + this.figure.name, "" + initiative);
      }
      this.figure.initiative = initiative;
      if (gameManager.game.state == GameState.next) {
        gameManager.sortFigures(this.character);
      }
      gameManager.stateManager.after();
    }
  }

  longRestOff(event: any) {
    if (this.character && this.character.longRest) {
      gameManager.stateManager.before("characterLongRestOff", "data.character." + this.character.name);
      this.character.longRest = false;
      if (gameManager.game.state == GameState.next) {
        gameManager.sortFigures(this.character);
      }
      gameManager.stateManager.after();
      event.preventDefault();
    }
  }

  open(event: any) {
    this.dialog.open(CharacterInitiativeDialogComponent, {
      panelClass: 'dialog',
      data: this.figure,
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(ghsDefaultDialogPositions())
    });
  }

  tabindex(): number {
    return gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent).indexOf(this.figure);
  }

  focusNext(event: KeyboardEvent) {
  }

}

