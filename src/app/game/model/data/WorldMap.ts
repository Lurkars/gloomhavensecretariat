export class WorldMapCoordinates {
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
}

export class WorldMapOverlay {

    name: string = "";
    location: string = "";
    coordinates: WorldMapCoordinates = new WorldMapCoordinates();

}