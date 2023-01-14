export class ObjectiveData {

  id: number;
  marker: string;
  name: string;
  health: number | string;
  escort: boolean;
  initiative: number | undefined;
  count: number | string;

  constructor(name: string, health: number | string, escort: boolean = false, id: number = -1, marker: string = "", initiative: number | undefined = undefined, count: number | string = 1) {
    this.name = name;
    this.health = health;
    this.escort = escort;
    this.id = id;
    this.marker = marker;
    this.initiative = initiative;
    this.count = count;
  }

}