import { Action } from 'src/app/game/model/data/Action';
import { Editional } from 'src/app/game/model/data/Editional';
import { Identifier } from 'src/app/game/model/data/Identifier';

export class PetCard implements Editional {
  id: string = '';
  cardId: number = 0;
  edition: string = '';
  lost: boolean = false;
  round: boolean = false;
  action: Action | undefined;
}

export class PetIdentifier extends Identifier {
  petname: string;
  active: boolean;
  lost: boolean;

  constructor(name: string, edition: string, petname: string = '', active: boolean = false, lost: boolean = false) {
    super(name, edition);
    this.petname = petname;
    this.active = active;
    this.lost = lost;
  }
}
