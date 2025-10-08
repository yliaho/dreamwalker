import { useState, useRef, useMemo, ChangeEvent } from "react";
import { DatasBin, GameMap } from "./lib/datas-bin";
import { NaiveBinaryReader } from "./lib/naive-binary-reader";
import TilesheetCanvas from "./components/TilesheetCanvas";
import { createTileMapImageData, createTileSheetImageData } from "./draw";
import MapCanvas from "./components/MapCanvas";
import TilesheetPalette from "./components/TilesheetPalette";

const datasBin = new DatasBin(NaiveBinaryReader);

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mapIndex, setMapIndex] = useState<number>(11);
  const [paletteIndex, setPaletteIndex] = useState<number>(0);
  const [mapCount, setMapCount] = useState<Array<number>>();
  const [tilesheetImageData, setTilesheetImageData] = useState<ImageData>();
  const [tileSheetCanvasScale, setTileSheetCanvasScale] = useState<number>(0);
  const [tileMapImageDatas, setTileMapImageDatas] =
    useState<Array<{ dx: number; dy: number; data: Promise<ImageBitmap> }>>();
  const palettes = useMemo(() => {
    if (!datasBin.gameMaps) {
      return [];
    }

    return datasBin.gameMaps![mapIndex].info!.palettes!;
  }, [mapIndex, datasBin]);

  function onFileInputChange() {
    getFileFromFileInput();
  }

  function onPaletteIndexClick(index: number) {
    setPaletteIndex(index);

    if (!datasBin) {
      return;
    }

    const map = loadMap(datasBin, mapIndex);
    drawTileSheet(map);
  }

  function onMapListChange(event: ChangeEvent<HTMLSelectElement>) {
    const [_, index] = event.target.value.split(" ");
    setMapIndex(Number(index));

    if (!datasBin) {
      return;
    }

    const map = loadMap(datasBin, Number(index));
    drawTileSheet(map);
    drawTileMap(map);
  }

  async function getFileFromFileInput() {
    const fileInput = fileInputRef.current;

    if (!fileInput) {
      return;
    }

    const file = fileInput.files?.item(0);

    const arrayBuffer = await file?.arrayBuffer();
    if (!arrayBuffer) {
      console.error("Could not load array buffer from file.");
      return;
    }

    datasBin.fromFile(arrayBuffer);

    setMapCount(Array.from(Array(datasBin.gameMaps!.length), (_, i) => i));

    const map = loadMap(datasBin, mapIndex);
    drawTileSheet(map);
    drawTileMap(map);
  }

  function loadMap(datasBin: DatasBin, mapIndex: number) {
    const gameMap = datasBin.gameMaps![mapIndex];
    gameMap.load(datasBin.openBin() as NaiveBinaryReader, false);

    return gameMap;
  }

  function drawTileSheet(gameMap: GameMap) {
    setTilesheetImageData(createTileSheetImageData(
      gameMap.tilesheetImageData!,
      gameMap.info!.palettes![paletteIndex],
      256,
      256 * 6
    ));
  }

  function drawTileMap(gameMap: GameMap) {
    setTileMapImageDatas(createTileMapImageData(
      gameMap,
      { v: 0, h: 0 },
      853,
      1
    ));
  }

  return (
    <div className="flex flex-col h-screen">
      <header
        className="col-span-2 flex flex-row justify-between px-4 py-4 fixed top-0 left-0 right-0 bg-black bg-opacity-50 z-10 backdrop-brightness-75 backdrop-blur"
      >
        <section>
          <label htmlFor="file" className="form-label"></label>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              id="file"
              className="bg-gray-900 text-gray-100 font-medium"
              onChange={onFileInputChange}
            />
          </div>
        </section>
      </header>
      <main className="flex h-full">
        {tilesheetImageData && (
          <aside
            className="w-[379px] pt-4 fixed inset-0 z-10 bg-black top-[46px] flex flex-col space-y-0"
          >
            <section className="px-4">
              {mapCount && (
                <div>
                  <label
                    className="block tracking-tighter font-semibold mb-1 py-1 text-gray-300"
                    htmlFor="palette-index-ref"
                    >Map</label
                  >
                  <select
                    className="appearance-none w-full bg-white border rounded-none text-black py-1 pr-1 leading-tight focus:outline-none focus:bg-blue-200 focus:border-blue-400 focus:text-blue-800 px-3 tracking-tighter"
                    onChange={onMapListChange}
                  >
                    {mapCount.map((map) => (
                      <option key={map}>Map {map}</option>
                    ))}
                  </select>
                </div>
              )}
            </section>
            <section className="h-96 overflow-y-auto">
              <TilesheetPalette
                paletteIndex={paletteIndex}
                palettes={palettes}
                onChangePalette={onPaletteIndexClick}
              />
            </section>
            <section className="overflow-auto h-full">
              <section
                className="sticky top-2 left-2 right-2 flex flex-row-reverse z-10 py-1 px-1 bg-black bg-opacity-50 mx-2 rounded"
              >
                <button
                  className={`m-1 rounded w-32 py-1 shadow shadow-black ${
                    tileSheetCanvasScale === 0 ? `bg-gray-500` : `bg-blue-600`
                  }`}
                  onClick={() =>
                    setTileSheetCanvasScale((tileSheetCanvasScale + 1) & 1)
                  }
                >
                  {tileSheetCanvasScale === 0 ? "1x" : "2x"}
                </button>
              </section>
              <div className="">
                <TilesheetCanvas
                  imageData={tilesheetImageData!}
                  scale={tileSheetCanvasScale}
                />
              </div>
            </section>
          </aside>
        )}
        {tilesheetImageData && datasBin.gameMaps && (
          <main
            className="pl-[379px] w-full bg-black flex flex-row space-x-2 overflow-hidden pt-[54px]"
          >
            <section className="overflow-auto flex-1">
              <MapCanvas
                imageDatas={tileMapImageDatas}
                canvasWidth={datasBin.gameMaps![mapIndex].map?.width! * 24}
                canvasHeight={datasBin.gameMaps![mapIndex].map?.height! * 16}
              />
            </section>
          </main>
        )}
      </main>
    </div>
  );
}

export default App;