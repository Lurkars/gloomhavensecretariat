export class ObjectiveData {

  name: string;
  health: number | string;
  escort: boolean;
  initiative: number | undefined;

  constructor(name: string, health: number | string, escort: boolean = false, initiative: number | undefined = undefined) {
    this.name = name;
    this.health = health;
    this.escort = escort;
    this.initiative = initiative;
  }

}