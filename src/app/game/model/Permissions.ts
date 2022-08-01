export class Permissions {

  characters: boolean = false;
  character: FigureIdentifier[] = [];
  monsters: boolean = false;
  monster: FigureIdentifier[] = [];
  scenario: boolean = false;
  elements: boolean = false;
  round: boolean = false;
  level: boolean = false;
  attackModifiers: boolean = false;

}


export class FigureIdentifier {
  name: string = "";
  edition: string = "";

  constructor(name: string, edition: string) {
    this.name = name;
    this.edition = edition;
  }
}