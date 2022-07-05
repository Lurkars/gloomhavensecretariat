export class ObjectiveData {

  name: string;
  maxHealth: number | string;
  escort: boolean;
  initiative: number | undefined;

  constructor(name: string, maxHealth: number | string, escort: boolean = false, initiative: number | undefined = undefined) {
    this.name = name;
    this.maxHealth = maxHealth;
    this.escort = escort;
    this.initiative = initiative;
  }

}