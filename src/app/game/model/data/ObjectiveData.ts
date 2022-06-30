export class ObjectiveData {

  name: string;
  maxHealth: number | string;
  escort: boolean;

  constructor(name: string, maxHealth: number | string, escort: boolean = false) {
    this.name = name;
    this.maxHealth = maxHealth;
    this.escort = escort;
  }

}