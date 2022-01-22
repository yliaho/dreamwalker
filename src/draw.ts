import { Argb32, GameMap } from "./lib/datas-bin";

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
  y: number
) {
  // const rowSize = ~~((32 * imageData.width + 31) / 32) * 4;
  const off = x + imageData.width * y;
  for (let x = 0; x < imageData.data.length; x += 4) {
    imageData.data[off * y * 4 + x + 0] = buffer[x + 1];
    imageData.data[off * y * 4 + x + 1] = buffer[x + 2];
    imageData.data[off * y * 4 + x + 2] = buffer[x + 3];
    imageData.data[off * y * 4 + x + 3] = 255;
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
): Array<{ dx: number; dy: number; data: ImageData }> {
  tileCache.clear();
  const map = gameMap.map;

  if (!map) {
    console.error("no map");
    return [];
  }

  const tiles: Array<{ dx: number; dy: number; data: ImageData }> = [];

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.mapTiles[y * map.width + x];

      const dx = x * scale * 24;
      const dy = (y - tile.height) * scale * 16;

      if (tile.tileId !== -1) {
        const tileImageData = new ImageData(24, 16);
        drawTo(tileImageData, getTile(tile.tileId, gameMap), 0, 0);
        tiles.push({ dx, dy, data: tileImageData });
      }

      // if (tile.wallTiles) {
      //   for (let index = 0; index < tile.wallTiles.count; index++) {
      //     if (tile.wallTiles.tiles[index] !== -1) {
      //       const wallTileImageData = new ImageData(
      //         24 * scale + 1,
      //         16 * scale + 1
      //       );
      //       drawTo(
      //         wallTileImageData,
      //         getTile(tile.wallTiles.tiles[index], gameMap),
      //         0,
      //         0 + (index - tile.wallTiles.offset + 1) * 16 * scale
      //       );
      //       tiles.push({ dx, dy, data: wallTileImageData });
      //     }
      //   }
      // }
    }
  }

  return tiles;
}

const tileCache = new Map<number, Uint8Array>();
function getTile(tileId: number, gameMap: GameMap) {
  const tile = tileId & 0x3fff;
  const palIndex = (tileId & 0xf000) >> 12;
  if (!tileCache.get(tileId)) {
    tileCache.set(
      tileId,
      gameMap.generateTileBitmap(tile, gameMap.info!.palettes![palIndex])
    );
  }

  return tileCache.get(tileId)!;
}
