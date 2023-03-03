import { Component } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";


@Component({
  selector: 'ghs-party-buildings',
  templateUrl: 'buildings.html',
  styleUrls: ['./buildings.scss']
})
export class PartyBuildingsComponent {

  gameManager: GameManager = gameManager;

  constructor() { }


}