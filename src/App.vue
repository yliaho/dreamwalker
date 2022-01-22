<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from "vue";
import { Argb32, DatasBin, fromPsxColor, GameMap } from "./lib/datas-bin";
import { NaiveBinaryReader } from "./lib/naive-binary-reader";
import TilesheetCanvas from "./components/TilesheetCanvas.vue";
import { useDatasBin, datasBin } from "./useDatasBin";
import { createTileMapImageData, createTileSheetImageData } from "./draw";
import MapCanvas from "./components/MapCanvas.vue";

useDatasBin(datasBin);

const fileInputRef = ref<HTMLInputElement>();

const mapIndexRef = ref<number>(11);
const paletteIndexRef = ref<number>(0);
const mapCount = ref<Array<number>>();
const tilesheetImageDataRef = ref<ImageData>();
const tileMapImageDataRef = ref<ImageData>();
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
      class="col-span-2 flex flex-row justify-between border-b border-gray-800 px-4 pb-4 pt-1 fixed top-0 left-0 right-0 bg-black bg-opacity-50 z-10 backdrop-brightness-75 backdrop-blur"
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
      <section>
        <button>Index Colors</button>
      </section>
    </header>
    <main class="flex space-x-2 h-full">
      <aside
        class="border-r border-gray-800 w-96 pt-4 max-w-md h-full fixed inset-0 z-10 bg-black top-[46px] flex flex-col space-y-4"
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
        <section class="h-94">
          <ul
            class="overflow-y-auto border border-gray-800 bg-gray-900 mx-4 palette h-64"
          >
            <ul
              v-for="(pal, i) in palettesRef"
              :class="`flex ${
                paletteIndexRef === i ? 'border-red-500' : 'border-black'
              }`"
            >
              <li
                :class="`flex flex-1 h-6 items-center justify-center bg-gray-800 border-r border-x-gray-700`"
              >
                <div
                  :class="`w-4 h-4 rounded-full ${
                    paletteIndexRef === i ? 'bg-blue-500' : ''
                  }`"
                ></div>
              </li>
              <li
                v-for="c in pal"
                :class="`flex-1 h-6`"
                @click="onPaletteIndexClick(i)"
              >
                <div
                  class="w-full h-full"
                  :style="{
                    backgroundColor: `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`,
                  }"
                ></div>
              </li>
            </ul>
          </ul>
        </section>
        <section class="overflow-auto mx-4 h-full">
          <TilesheetCanvas :image-data="tilesheetImageDataRef" />
        </section>
      </aside>
      <main
        class="pl-96 w-full bg-black flex flex-row space-x-2 overflow-hidden pt-[52px]"
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
}
body {
  @apply bg-black text-white tracking-tighter;
}

canvas {
  transform-origin: left top;
  transform: scale(1);
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
