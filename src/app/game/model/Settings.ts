export class Settings {
  calculate: boolean = false;
  eliteFirst: boolean = true;
  expireConditions: boolean = true;
  moveElements: boolean = true;
  randomStandees: boolean = false;
  fullscreen: boolean = false;
  zoom: number = 100;
  locale: string = "en";
  editionDataUrls: string[] = [ "./assets/data/gh.json", "./assets/data/jotl.json" ];
  spoilers: string[] = [];
}