import { DatasBin, GameMap } from "./datas-bin";
import { NaiveBinaryReader } from "./naive-binary-reader";

export class App {
  private readonly gameMaps: GameMap[];

  constructor(private readonly arrayBuffer: ArrayBuffer) {
    const datasBin = new DatasBin(NaiveBinaryReader);
    datasBin.fromFile(arrayBuffer);

    this.gameMaps = datasBin.gameMaps!.map((gameMap, index) =>
      Object.assign(gameMap, { id: `map_${index}`, title: "" })
    );
  }

  private loadGameMap(gameMap: GameMap) {
    gameMap.load(new NaiveBinaryReader(this.arrayBuffer), true);
  }

  getGameMap(index: number) {
    const gameMap = this.gameMaps[index];

    if (!gameMap.loaded) {
      this.loadGameMap(gameMap);
    }

    return gameMap;
  }
}
