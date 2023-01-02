export class ObjectiveData {

  name: string;
  health: number | string;
  escort: boolean;
  initiative: number | undefined;
  count: number | string;

  constructor(name: string, health: number | string, escort: boolean = false, initiative: number | undefined = undefined, count: number | string = 1) {
    this.name = name;
    this.health = health;
    this.escort = escort;
    this.initiative = initiative;
    this.count = count;
  }

}