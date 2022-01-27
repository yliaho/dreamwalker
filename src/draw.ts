import { Argb32, GameMap } from "./lib/datas-bin";
import { Tile, Renderer } from "./lib/renderer";

export function createTileSheetImageData(
  buffer: Uint8Array,
  palette: Argb32[],
  width: number,
  height: number
): ImageData {
  const rowSize = ~~((32 * width + 31) / 32) * 4;
  const imageData = new ImageData(width, height);

  let dex = 0;
  for (let y = 0; y < height; y++) {
    let bmpdex = 0;
    for (let x = 0; x < width / 2; x++) {
      let c = palette[buffer[dex] & 0xf];
      imageData.data[y * rowSize + bmpdex++] = c.r;
      imageData.data[y * rowSize + bmpdex++] = c.g;
      imageData.data[y * rowSize + bmpdex++] = c.b;
      imageData.data[y * rowSize + bmpdex++] = c.a;
      c = palette![(buffer[dex] & 0xf0) >> 4];
      imageData.data[y * rowSize + bmpdex++] = c.r;
      imageData.data[y * rowSize + bmpdex++] = c.g;
      imageData.data[y * rowSize + bmpdex++] = c.b;
      imageData.data[y * rowSize + bmpdex++] = c.a;
      dex++;
    }
  }

  return imageData;
}

function drawTo(
  imageData: ImageData,
  buffer: Uint8Array,
  x: number,
  y: number,
  wall: boolean = false
) {
  // const rowSize = ~~((32 * imageData.width + 31) / 32) * 4;
  const off = x + imageData.width * y;
  for (let x = 0; x < imageData.data.length; x += 4) {
    imageData.data[x + 0] = buffer[x + 1];
    imageData.data[x + 1] = buffer[x + 2];
    imageData.data[x + 2] = buffer[x + 3];
    imageData.data[x + 3] = buffer[x + 0];
  }
  // for (let y = 0; y < buffer.length / (24 * 4); y++) {
  //   for (let x = 0; x < buffer.length / (16 * 4); x += 4) {
  //     imageData.data[off * 4 + x + 0] = 255;
  //     imageData.data[off * 4 + x + 1] = 255;
  //     imageData.data[off * 4 + x + 2] = 255;
  //     imageData.data[off * 4 + x + 3] = 255;
  //   }
  // }
}

export function createTileMapImageData(
  gameMap: GameMap,
  scrollMap: { v: number; h: number },
  mapWidth: number,
  scale: number
): Tile[] {
  tileCache.clear();
  const map = gameMap.map;

  if (!map) {
    console.error("no map");
    return [];
  }

  const tiles: Array<Tile> = [];

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width / scale; x++) {
      const tile = map.mapTiles[y * map.width + x];

      const dx = x * scale * 24;
      const dy = (y - tile.height) * scale * 16;

      if (tile.tileId !== -1) {
        // const tileImageData = new ImageData(24 * scale, 16 * scale);
        // drawTo(tileImageData, getTile(tile.tileId, gameMap), 0, 0);
        // tiles.push({ dx, dy, data: createImageBitmap(tileImageData) });
        Renderer.createTexture(`${tile.tileId & 0x3ff}`, {
          buffer: getTile(tile.tileId, gameMap),
          width: 24,
          height: 16,
        });
        tiles.push(
          new Tile({
            textureId: `${tile.tileId & 0x3ff}`,
            x: dx,
            y: dy,
            z: 1,
          })
        );
      }

      // if (tile.wallTiles) {
      //   for (let index = 0; index < tile.wallTiles.count; index++) {
      //     if (tile.wallTiles.tiles[index] !== -1) {
      //       // const wallTileImageData = new ImageData(24 * scale, 16 * scale);
      //       // drawTo(
      //       //   wallTileImageData,
      //       //   getTile(tile.wallTiles.tiles[index], gameMap),
      //       //   0,
      //       //   0,
      //       //   true
      //       // );
      //       // tiles.push({
      //       //   dx,
      //       //   dy: dy + (index - tile.wallTiles.offset + 1) * 16 * scale,
      //       //   data: createImageBitmap(wallTileImageData),
      //       // });

      //       Renderer.createTexture(`${tile.tileId & 0x3ff}_wall`, {
      //         buffer: getTile(tile.wallTiles.tiles[index], gameMap),
      //         width: 24,
      //         height: 16,
      //       });
      //       tiles.push(
      //         new Tile({
      //           textureId: `${tile.tileId & 0x3ff}`,
      //           x: dx,
      //           y: dy + (index - tile.wallTiles.offset + 1) * 16,
      //           z: 1,
      //         })
      //       );
      //     }
      //   }
      // }
    }
  }

  return tiles;
}

const tileCache = new Map<number, Uint8Array>();
function getTile(tileId: number, gameMap: GameMap) {
  const tile = tileId & 0x3ff;
  const palIndex = (tileId & 0xf000) >> 12;
  if (!tileCache.get(tileId)) {
    tileCache.set(
      tileId,
      gameMap.generateTileBitmap(tile, gameMap.info!.palettes![palIndex])
    );
  }

  return tileCache.get(tileId)!;
}

function drawMap(levelWidth: number, levelHeight: number) {
  const levelImageData = new ImageData(levelWidth, levelHeight);

  // Let's pretend these are tiles
  const tiles = new Array(32);
  const tileWidth = 24;
  const tileHeight = 16;
}
