<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from "vue";
import { Argb32, DatasBin, fromPsxColor, GameMap } from "./lib/datas-bin";
import { NaiveBinaryReader } from "./lib/naive-binary-reader";
import TilesheetCanvas from "./components/TilesheetCanvas.vue";
import { useDatasBin, datasBin } from "./useDatasBin";
import { createTileMapImageData, createTileSheetImageData } from "./draw";
import MapCanvas from "./components/MapCanvas.vue";
import TilesheetPalette from "./components/TilesheetPalette.vue";

useDatasBin(datasBin);

const fileInputRef = ref<HTMLInputElement>();

const mapIndexRef = ref<number>(11);
const paletteIndexRef = ref<number>(0);
const mapCount = ref<Array<number>>();
const tilesheetImageDataRef = ref<ImageData>();
const tileMapImageDataRef = ref<ImageData>();
const tileSheetCanvasScaleRef = ref<number>(0);
const tileMapImageDatasRef =
  ref<Array<{ dx: number; dy: number; data: Promise<ImageBitmap> }>>();
const palettesRef = computed(() => {
  if (!datasBin) {
    return [];
  }

  return datasBin.gameMaps![mapIndexRef.value].info!.palettes!;
});

function onFileInputChange() {
  getFileFromFileInput();
}

function onPaletteIndexClick(index: number) {
  paletteIndexRef.value = index;

  if (!datasBin) {
    return;
  }

  const map = loadMap(datasBin, mapIndexRef.value);
  drawTileSheet(map);
}

function onMapListChange(event: any) {
  const [_, index] = event.target.value.split(" ");
  mapIndexRef.value = index;

  if (!datasBin) {
    return;
  }

  const map = loadMap(datasBin, mapIndexRef.value);
  drawTileSheet(map);
  drawTileMap(map);
}

async function getFileFromFileInput() {
  // Get the file from input
  const fileInput = fileInputRef.value;

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

  // Get the map count for UI
  mapCount.value = Array.from(Array(datasBin.gameMaps!.length), (_, i) => i);

  const map = loadMap(datasBin, mapIndexRef.value);
  drawTileSheet(map);
  drawTileMap(map);
}

function loadMap(datasBin: DatasBin, mapIndex: number) {
  const gameMap = datasBin.gameMaps![mapIndex];
  gameMap.load(datasBin.openBin() as NaiveBinaryReader, false);

  return gameMap;
}

function drawTileSheet(gameMap: GameMap) {
  // // Load map, and create imageData from mapIndex
  // const gameMap = datasBin.gameMaps![mapIndexRef.value];
  // gameMap.load(datasBin.openBin() as NaiveBinaryReader, false);

  tilesheetImageDataRef.value = createTileSheetImageData(
    gameMap.tilesheetImageData!,
    gameMap.info!.palettes![paletteIndexRef.value],
    256,
    256 * 6
  );
}

function drawTileMap(gameMap: GameMap) {
  tileMapImageDatasRef.value = createTileMapImageData(
    gameMap,
    { v: 0, h: 0 },
    853,
    1
  );
}
</script>

<template>
  <div :class="`flex flex-col h-screen`">
    <header
      class="col-span-2 flex flex-row justify-between px-4 py-4 fixed top-0 left-0 right-0 bg-black bg-opacity-50 z-10 backdrop-brightness-75 backdrop-blur"
    >
      <section>
        <label for="file" class="form-label"></label>
        <div>
          <input
            type="file"
            ref="fileInputRef"
            id="file"
            class="bg-gray-900 text-gray-100 font-medium"
            @change="onFileInputChange"
          />
        </div>
      </section>
    </header>
    <main class="flex h-full">
      <aside
        class="w-[379px] pt-4 fixed inset-0 z-10 bg-black top-[46px] flex flex-col space-y-0"
        v-if="tilesheetImageDataRef"
      >
        <section class="px-4">
          <div v-if="mapCount">
            <label
              class="block tracking-tighter font-semibold mb-1 py-1 text-gray-300"
              for="palette-index-ref"
              >Map</label
            >
            <select
              class="appearance-none w-full bg-white border rounded-none text-black py-1 pr-1 leading-tight focus:outline-none focus:bg-blue-200 focus:border-blue-400 focus:text-blue-800 px-3 tracking-tighter"
              @change="onMapListChange"
            >
              <option v-for="map in mapCount">Map {{ map }}</option>
            </select>
          </div>
        </section>
        <section class="h-96 overflow-y-auto">
          <TilesheetPalette
            :palette-index="paletteIndexRef"
            :palettes="palettesRef"
            @change-palette="(index) => onPaletteIndexClick(index)"
          />
        </section>
        <section class="overflow-auto h-full">
          <section
            class="sticky top-2 left-2 right-2 flex flex-row-reverse z-10 py-1 px-1 bg-black bg-opacity-50 mx-2 rounded"
          >
            <button
              :class="`m-1 rounded w-32 py-1 shadow shadow-black ${
                tileSheetCanvasScaleRef === 0 ? `bg-gray-500` : `bg-blue-600`
              }`"
              @click="
                () =>
                  (tileSheetCanvasScaleRef = (tileSheetCanvasScaleRef + 1) & 1)
              "
            >
              {{ tileSheetCanvasScaleRef === 0 ? "1x" : "2x" }}
            </button>
          </section>
          <div class="">
            <TilesheetCanvas
              :image-data="tilesheetImageDataRef"
              :palette-index="paletteIndexRef"
              :scale="tileSheetCanvasScaleRef"
            />
          </div>
        </section>
      </aside>
      <main
        class="pl-[379px] w-full bg-black flex flex-row space-x-2 overflow-hidden pt-[54px]"
        v-if="tilesheetImageDataRef"
      >
        <section class="overflow-auto flex-1">
          <MapCanvas
            :image-datas="tileMapImageDatasRef"
            :canvas-width="datasBin.gameMaps![mapIndexRef].map?.width! * 24"
            :canvas-height="datasBin.gameMaps![mapIndexRef].map?.height! * 16"
          />
        </section>
      </main>
    </main>
  </div>
</template>

<style>
* {
  image-rendering: -webkit-optimize-contrast; /* webkit */
  image-rendering: -moz-crisp-edges; /* Firefox */
}
body {
  @apply bg-black text-white tracking-tighter;
}

canvas {
  image-rendering: pixelate;
}

input[type="file"]::-webkit-file-upload-button,
input[type="file"]::file-selector-button {
  @apply bg-black;
}

.visible-scrollbar,
.invisible-scrollbar,
.mostly-customized-scrollbar {
  display: block;
  width: 10em;
  overflow: auto;
  height: 2em;
}

.invisible-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
