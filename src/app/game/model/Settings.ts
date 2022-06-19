export class Settings {
  calculate: boolean = true;
  eliteFirst: boolean = true;
  expireConditions: boolean = true;
  moveElements: boolean = true;
  randomStandees: boolean = false;
  fullscreen: boolean = false;
  zoom: number = 100;
  locale: string = "en";
  editionDataUrls: string[] = [ "./assets/data/gh.json", "./assets/data/jotl.json" ];
  spoilers: string[] = [];
  serverUrl: string | undefined;
  serverPort: number | undefined;
  serverPassword: string | undefined;
  serverAutoconnect: boolean = true;
  serverWss: boolean = false;
}