import { isNaiveBinaryReader, NaiveBinaryReader } from "./naive-binary-reader";

export function createArrayWith<T>(
  length: number,
  mapFunction: (value: undefined, index: number) => any = (value) => value
) {
  return Array.from(new Array(length), mapFunction);
}

export function createUInt8ArrayFrom(
  ...args: Parameters<typeof createArrayWith>
) {
  return new Uint8Array(createArrayWith(...args));
}

export function createUInt16ArrayFrom(
  ...args: Parameters<typeof createArrayWith>
) {
  return new Uint16Array(createArrayWith(...args));
}

export function createUInt32ArrayFrom(
  ...args: Parameters<typeof createArrayWith>
) {
  return new Uint32Array(createArrayWith(...args));
}

export function createInt16ArrayFrom(
  ...args: Parameters<typeof createArrayWith>
) {
  return new Int16Array(createArrayWith(...args));
}

export function blockCopy(
  source: Uint8Array,
  sourceOffset: number,
  destination: Uint8Array,
  destinationOffset: number,
  count: number
) {
  for (let index = 0; index < count; index++) {
    destination[destinationOffset + index] = source[sourceOffset + index];
  }
}

export class Argb32 {
  constructor(
    public r: number = 0,
    public g: number = 0,
    public b: number = 0,
    public a: number = 0
  ) {}
}

export function fromPsxColor(c: number) {
  const r = (c & (0x1f << 10)) >> 7;
  const g = (c & (0x1f << 5)) >> 2;
  const b = (c & 0x1f) << 3;
  const a = c != 0 ? 255 : 0;

  return new Argb32(b, g, r, a);
}

function deflate(data: Uint8Array, dest: Uint8Array) {
  //compressed
  let index = 0;
  let bufferIndex = 0;
  while (index < dest.length && bufferIndex < data.length) {
    const b = data[bufferIndex++];
    if (b == 0xad) {
      const seek = data[bufferIndex++];
      if (seek == 0) {
        dest[index++] = b;
      } else {
        let len = data[bufferIndex++];
        let seekdex = index - seek;
        while (len-- > 0) dest[index++] = dest[seekdex++];
      }
    } else dest[index++] = b;
  }

  return index;
}

function bitmapDataFromPsxBuff(
  imageData: Uint8Array,
  width: number,
  height: number,
  bpp: number,
  palette: Argb32[] | null
) {
  //bmp bmp = new bmp(width, height, 32);
  const rowsize = ~~((32 * width + 31) / 32) * 4;
  const pixels = createUInt8ArrayFrom(rowsize * Math.abs(height));

  if (bpp == 16) {
    // palette
    let dex = 0;
    for (let y = 0; y < height; y++) {
      let bmpdex = 0;
      for (let x = 0; x < width; x++) {
        const b2 = imageData[dex++];
        const b1 = imageData[dex++];
        const c = fromPsxColor((b1 << 8) | b2);
        pixels[y * rowsize + bmpdex++] = c.a;
        pixels[y * rowsize + bmpdex++] = c.r;
        pixels[y * rowsize + bmpdex++] = c.g;
        pixels[y * rowsize + bmpdex++] = c.b;
      }
    }
  } else if (bpp == 4 && palette != null) {
    // spritesheet
    let dex = 0;
    for (let y = 0; y < height; y++) {
      let bmpdex = 0;
      for (let x = 0; x < width / 2; x++) {
        let c = palette[imageData[dex] & 0xf];

        pixels[y * rowsize + bmpdex++] = c.a;
        pixels[y * rowsize + bmpdex++] = c.r;
        pixels[y * rowsize + bmpdex++] = c.g;
        pixels[y * rowsize + bmpdex++] = c.b;
        c = palette[(imageData[dex] & 0xf0) >> 4];
        pixels[y * rowsize + bmpdex++] = c.a;
        pixels[y * rowsize + bmpdex++] = c.r;
        pixels[y * rowsize + bmpdex++] = c.g;
        pixels[y * rowsize + bmpdex++] = c.b;
        dex++;
      }
    }
  }

  return pixels;
}

export class DatasBin {
  public header: DBHeader | null = null;
  public alundraGameMap: GameMap | null = null;
  public gameMaps: GameMap[] | null = null;
  private file: ArrayBuffer | null = null;

  constructor(
    private readonly BinaryReader: new (
      buffer: ArrayBuffer
    ) => NaiveBinaryReader
  ) {}

  fromFile(file: ArrayBuffer) {
    this.file = file;
    const binaryReader = new this.BinaryReader(this.file);
    this.header = new DBHeader(binaryReader);
    this.alundraGameMap = new GameMap(binaryReader, this.header);

    this.gameMaps = createArrayWith(this.header.gameMaps.length, (_, index) => {
      if (
        this.header!.gameMaps[index] > 0 &&
        this.header!.gameMaps[index] < binaryReader.getLength()
      ) {
        return new GameMap(binaryReader, this.header!.gameMaps[index]);
      }
    });
  }

  openBin() {
    if (!this.file) {
      console.error("No file provided.");
      return;
    }

    return new NaiveBinaryReader(this.file);
  }
}

function isDBHeader(value: unknown): value is DBHeader {
  if (value instanceof DBHeader) {
    return true;
  }

  return false;
}

export class GameMap {
  public info: GameMapInfo | null = null;
  private readonly binOffset: number;
  private readonly header: GameMapHeader;
  private memoryAddress: number = 0x153460; // + 0x260;
  public tilesheetImageData: Uint8Array | null = null;
  public tilesheetBitmap: any;
  public map: AMap | null = null;
  private tileCache: Map<number, Uint8Array> = new Map();

  constructor(binaryReader: NaiveBinaryReader, dbHeader: DBHeader);
  constructor(binaryReader: NaiveBinaryReader, offset: number);
  constructor(
    binaryReader: NaiveBinaryReader,
    headerOrOffset: DBHeader | number
  ) {
    if (isDBHeader(headerOrOffset)) {
      binaryReader.jumpPosition((this.binOffset = 0));

      this.header = new GameMapHeader(headerOrOffset);
    } else {
      binaryReader.jumpPosition((this.binOffset = headerOrOffset));
      this.header = new GameMapHeader(binaryReader);

      binaryReader.jumpPosition(this.binOffset + this.header.infoBlock);
      this.info = new GameMapInfo(
        binaryReader.readInt32(),
        this.memoryAddress + this.header.infoBlock
      );
    }
  }

  load(binaryReader: NaiveBinaryReader, isMap: boolean) {
    // info
    if (this.header.infoBlock !== -1) {
      binaryReader.jumpPosition(this.binOffset + this.header.infoBlock);
      this.info = new GameMapInfo(
        binaryReader,
        this.memoryAddress + this.header.infoBlock
      );
    }

    //map
    if (this.header.mapBlock != -1) {
      binaryReader.jumpPosition(this.binOffset + this.header.mapBlock);
      this.map = new AMap(
        binaryReader,
        this.memoryAddress + this.header.mapBlock
      );
      this.header.wallTileSize =
        this.header.tilesheets -
        (this.map.wallTileOffset + this.header.mapBlock);
      this.header.mapSize -= this.header.wallTileSize;
    }

    // tilesheet
    if (this.header.tilesheets !== -1) {
      binaryReader.jumpPosition(this.binOffset + this.header.tilesheets + 6);
      const buffer = createUInt8ArrayFrom(
        this.header.spriteInfo - this.header.tilesheets
      );
      binaryReader.read(buffer, 0, buffer.length);
      this.tilesheetImageData = createUInt8ArrayFrom((256 * 256 * 6) / 2);
      deflate(buffer, this.tilesheetImageData);
    }
  }

  public generateTileBitmap(tile: number, palette: Argb32[]) {
    console.assert(
      tile < 10 * 16 * 6,
      `bad tile index (${tile}). This tile's transparency will be set to 0.`
    );
    const tileBuffer = new Uint8Array((24 * 16 * 4) / 8);
    const tileX = (tile % 10) * 24;
    const tileY = ~~(tile / 10) * 16;
    if (tile < 10 * 16 * 6) {
      for (let y = 0; y < 16; y++) {
        blockCopy(
          this.tilesheetImageData!,
          ~~(((tileY + y) * 256) / 2 + tileX / 2),
          tileBuffer,
          ~~((y * 24) / 2),
          ~~(24 / 2)
        );
      }
    }

    return bitmapDataFromPsxBuff(
      tileBuffer,
      24,
      16,
      4,
      tile < 10 * 16 * 6
        ? palette
        : palette.map((color) => ({ ...color, a: 0 }))
    );
  }

  generateTilesheetBitmap(palette: Argb32[]) {
    if (!this.tilesheetImageData) {
      console.error("No imagedata");
      return;
    }
    this.tilesheetBitmap = bitmapDataFromPsxBuff(
      this.tilesheetImageData,
      256,
      256 * 6,
      4,
      palette
    );

    return this.tilesheetBitmap;
  }

  generateTilesheetBitmapFromData(data: any, palette: Argb32[]) {
    this.tilesheetBitmap = bitmapDataFromPsxBuff(
      data,
      256,
      256 * 6,
      4,
      palette
    );

    return this.tilesheetBitmap;
  }
}

class AMap {
  private memoryAddress: number;
  public readonly width: number;
  public readonly height: number;
  public readonly width2: number;
  public readonly height2: number;
  public readonly wallTileOffset: number;
  public mapTiles: MapTile[];
  constructor(binaryReader: NaiveBinaryReader, memoryAddress: number) {
    this.memoryAddress = memoryAddress;
    const binOffset = binaryReader.getPosition();

    this.width = binaryReader.readUInt8();
    this.height = binaryReader.readUInt8();
    this.width2 = binaryReader.readUInt8();
    this.height2 = binaryReader.readUInt8();

    binaryReader.jumpPosition(binOffset + 1540); // why this number?

    this.mapTiles = createArrayWith(this.width * this.height, (_, index) => {
      return new MapTile(binaryReader);
    });

    this.wallTileOffset = binaryReader.getPosition() - binOffset;

    for (let i = 0; i < this.mapTiles.length; i++) {
      this.mapTiles[i].loadWallTiles(
        binaryReader,
        binOffset + this.wallTileOffset
      );
    }
  }
}

class MapTile {
  public readonly walkability: number;
  public groundProperty: number;
  public readonly slope: number;
  public readonly height: number;
  public readonly tileId: number;
  public readonly palette: number;
  public readonly tile: number;
  public readonly tilesOffset: number;
  public wallTiles: WallTiles | null = null;
  constructor(binaryReader: NaiveBinaryReader) {
    let index = binaryReader.readUInt32();
    this.walkability = ~~(index & 0xff);
    index >>= 8;
    this.groundProperty = ~~(index & 0xff);
    index >>= 8;
    this.slope = ~~(index & 0xff);
    index >>= 8;
    this.height = ~~(index & 0xff);

    index = binaryReader.readUInt16();
    this.tileId = ~~index;
    if (index == 0xffff) {
      this.palette = -1;
      this.tile = -1;
    } else {
      this.palette = ~~((index & 0xf000) >> 12);
      this.tile = ~~(index & 0x3ff);
    }
    this.tilesOffset = binaryReader.readInt16();
    if (this.tilesOffset !== -1) {
      this.tilesOffset *= 2;
    }
  }

  loadWallTiles(binaryReader: NaiveBinaryReader, offset: number) {
    if (this.tilesOffset !== -1) {
      binaryReader.jumpPosition(offset + this.tilesOffset);
      this.wallTiles = new WallTiles(binaryReader);
    }
  }
}

class WallTiles {
  public readonly offset: number;
  public readonly count: number;
  public readonly tiles: Int16Array;
  constructor(binaryReader: NaiveBinaryReader) {
    this.offset = binaryReader.readInt8();
    this.count = binaryReader.readUInt8();
    this.tiles = createInt16ArrayFrom(this.count, (_, i) => {
      return binaryReader.readInt16();
    });
  }
}

class GameMapInfo {
  public mapId: number;
  public gravity: number | null = null;
  public terminalVelocity: number | null = null;
  public slideEffectId: number | null = null;
  public balanceLevel: number | null = null;
  public _c: number | null = null;
  public _d: number | null = null;
  public _e: number | null = null;
  public _f: number | null = null;
  public _10: number | null = null;

  public palettes: Argb32[][] | null = null;
  public palettesBitmap: Uint8Array | null = null;

  constructor(mapId: number, memoryAddress: number);
  constructor(binaryReader: NaiveBinaryReader, memoryAddress: number);
  constructor(
    mapIdOrBinaryReader: number | NaiveBinaryReader,
    private readonly memoryAddress: number
  ) {
    if (isNaiveBinaryReader(mapIdOrBinaryReader)) {
      const binOffset = mapIdOrBinaryReader.getPosition();

      this.mapId = mapIdOrBinaryReader.readInt32(); // 0
      this.gravity = mapIdOrBinaryReader.readInt16(); // 4
      this.terminalVelocity = mapIdOrBinaryReader.readInt16(); // 8
      this.slideEffectId = mapIdOrBinaryReader.readUInt8(); // c
      this.balanceLevel = mapIdOrBinaryReader.readUInt8(); // d
      this._c = mapIdOrBinaryReader.readUInt8(); // c
      this._d = mapIdOrBinaryReader.readUInt8(); // d
      this._e = mapIdOrBinaryReader.readUInt8(); // e
      this._f = mapIdOrBinaryReader.readUInt8(); // f
      this._10 = mapIdOrBinaryReader.readInt16(); // 10

      const maxPalettes = 32;
      this.palettes = createArrayWith(maxPalettes, () => []);
      const buffer = createUInt8ArrayFrom(maxPalettes * 16 * 2);
      mapIdOrBinaryReader.read(buffer, 0, buffer.length);

      let buffDex = 0;
      for (let dex = 0; dex < maxPalettes; dex++) {
        this.palettes[dex] = createArrayWith(16, () => new Argb32());
        for (let cdex = 0; cdex < 16; cdex++) {
          const b2 = buffer[buffDex++];
          const b1 = buffer[buffDex++];
          this.palettes[dex][cdex] = fromPsxColor((b1 << 8) | b2);
        }
      }

      this.palettesBitmap = bitmapDataFromPsxBuff(
        buffer,
        16,
        maxPalettes,
        16,
        null
      );
    } else {
      this.mapId = mapIdOrBinaryReader;
    }
  }
}

class GameMapHeader {
  public infoBlock: number;
  public mapBlock: number;
  public tilesheets: number;
  public spriteInfo: number;
  public spritesheets: number;
  public scrollScreen: number;
  public stringTable: number;

  public infoSize: number;
  public mapSize: number;
  public tileSize: number;
  public spriteInfoSize: number;
  public spriteSize: number;
  public scrollSize: number;
  public wallTileSize: number = 0;

  public stringSize: number = 0;

  constructor(dbHeader: DBHeader);
  constructor(binaryReader: NaiveBinaryReader);
  constructor(headerOrBinaryReader: DBHeader | NaiveBinaryReader) {
    if (isDBHeader(headerOrBinaryReader)) {
      this.infoBlock = -1;
      this.mapBlock = -1;
      this.tilesheets = -1;
      this.spriteInfo = headerOrBinaryReader.alundraSpriteInfo;
      this.spritesheets = headerOrBinaryReader.alundraSprites;
      this.scrollScreen = -1;
      this.stringTable = headerOrBinaryReader.alundraStringTable;

      this.infoSize = 0;
      this.mapSize = 0;
      this.tileSize = 0;
      this.spriteInfoSize = this.spritesheets - this.spriteInfo;
      this.spriteSize = headerOrBinaryReader.unknownMapA - this.spritesheets;
      this.scrollSize = 0;
    } else {
      this.infoBlock = headerOrBinaryReader.readInt32(); // 0
      this.mapBlock = headerOrBinaryReader.readInt32(); // 4
      this.tilesheets = headerOrBinaryReader.readInt32(); // 8
      this.spriteInfo = headerOrBinaryReader.readInt32(); // c
      this.spritesheets = headerOrBinaryReader.readInt32(); // 10
      this.scrollScreen = headerOrBinaryReader.readInt32(); // 14
      this.stringTable = headerOrBinaryReader.readInt32(); // 18

      this.infoSize = this.mapBlock - this.infoBlock;
      this.mapSize = this.tilesheets - this.mapBlock;
      this.tileSize = this.spriteInfo - this.tilesheets;
      this.spriteInfoSize = this.spritesheets - this.spriteInfo;
      this.spriteSize = this.scrollScreen - this.spritesheets;
      this.scrollSize = this.stringTable - this.scrollScreen;
    }
  }
}

class DBHeader {
  public alundraSpriteInfo: number;
  public alundraSprites: number;
  public alundraSpritesRepeat: number;
  public alundraStringTable: number;
  public alundraStringTableRepeat: number;
  public unknownMapA: number;
  public unknownMapB: number;
  public unknownMapB2: number;
  public unknownMapB3: number;
  public unknownMapB4: number;
  public maxMaps: number = 502;
  public gameMaps: Uint32Array;

  constructor(binaryReader: NaiveBinaryReader) {
    this.alundraSpriteInfo = binaryReader.readUInt32(); // 0
    this.alundraSprites = binaryReader.readUInt32(); // 4
    this.alundraSpritesRepeat = binaryReader.readUInt32(); // 8
    this.alundraStringTable = binaryReader.readUInt32(); // c
    this.alundraStringTableRepeat = binaryReader.readUInt32(); // 10
    this.unknownMapA = binaryReader.readUInt32(); // 14
    this.unknownMapB = binaryReader.readUInt32(); // 18
    this.unknownMapB2 = binaryReader.readUInt32(); // 1c
    this.unknownMapB3 = binaryReader.readUInt32(); // 20
    this.unknownMapB4 = binaryReader.readUInt32(); // 24
    this.gameMaps = createUInt32ArrayFrom(this.maxMaps, () =>
      binaryReader.readUInt32()
    );
  }
}
