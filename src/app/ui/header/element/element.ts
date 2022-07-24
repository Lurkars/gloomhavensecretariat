import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Element } from "src/app/game/model/Element";
import { GameState } from "src/app/game/model/Game";

@Component({
  selector: 'ghs-element-icon',
  templateUrl: './element.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: [ './element.scss' ]
})
export class ElementIconComponent implements OnInit {

  @Input() element!: Element;
  gameManager: GameManager = gameManager;
  GameState = GameState;
  svg: SafeHtml = "";
  doubleClick: any = null;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    fetch('./assets/images/element/' + this.element + '.svg')
      .then(response => {
        return response.text();
      }).then(data => {
        this.svg = this.sanitizer.bypassSecurityTrustHtml(data);
      })
      .catch((error: Error) => {
        console.error("Invalid src: " + './assets/images/element/' + this.element + '.svg');
      })
  }

  toggleElement(): void {
    if (this.doubleClick) {
      this.doubleClick = null;
      gameManager.stateManager.before();
      gameManager.toggleElement(this.element, true);
      gameManager.stateManager.after();
    } else {
      this.doubleClick = setTimeout(() => {
        if (this.doubleClick) {
          gameManager.stateManager.before();
          gameManager.toggleElement(this.element, false);
          gameManager.stateManager.after();
          this.doubleClick = null;
        }
      }, 200)
    }
  }

}