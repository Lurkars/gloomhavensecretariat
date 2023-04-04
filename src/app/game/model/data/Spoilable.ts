export interface Spoilable {
  name: string;
  spoiler: boolean;
}

export class SpoilableMock implements Spoilable {
  name: string;
  spoiler: boolean = true;

  constructor(name: string) {
    this.name = name;
  }
}