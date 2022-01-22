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

const mapIndexRef = ref<number>(56);
const paletteIndexRef = ref<number>(0);
const mapCount = ref<Array<number>>();
const tilesheetImageDataRef = ref<ImageData>();
const tileMapImageDataRef = ref<ImageData>();
const tileMapImageDatasRef =
  ref<Array<{ dx: number; dy: number; data: ImageData }>>();
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

  loadAndDrawTileSheet(datasBin);
}

function onMapListChange(event: any) {
  const [_, index] = event.target.value.split(" ");
  mapIndexRef.value = index;

  if (!datasBin) {
    return;
  }

  loadAndDrawTileSheet(datasBin);
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

  // Initialize datasbin with the file array buffer.
  // datasBinRef.value = new DatasBin(arrayBuffer, NaiveBinaryReader);
  datasBin.fromFile(arrayBuffer);

  // Get the map count for UI
  mapCount.value = Array.from(Array(datasBin.gameMaps!.length), (_, i) => i);

  loadAndDrawTileSheet(datasBin);
}

function loadAndDrawTileSheet(datasBin: DatasBin) {
  // Load map, and create imageData from mapIndex
  const gameMap = datasBin.gameMaps![mapIndexRef.value];
  gameMap.load(datasBin.openBin() as NaiveBinaryReader, false);

  tilesheetImageDataRef.value = createTileSheetImageData(
    gameMap.tilesheetImageData!,
    gameMap.info!.palettes![paletteIndexRef.value],
    256,
    256 * 6
  );
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
      class="col-span-2 flex flex-row justify-between border-b border-gray-800 px-4 pb-4 pt-1 sticky top-0 bg-black bg-opacity-50 z-10 backdrop-brightness-75 backdrop-blur"
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
    <main class="flex space-x-4 h-full">
      <aside
        class="border-r border-gray-800 w-96 pt-4 max-w-md h-full fixed inset-0 z-10 bg-black top-[53px] flex flex-col"
      >
        <section class="px-4">
          <div v-if="mapCount">
            <label
              class="block tracking-tighter font-semibold mb-1 py-1 text-gray-300"
              for="palette-index-ref"
              >Map</label
            >
            <select
              class="appearance-none w-full bg-white border rounded-none text-black py-1 px-1 pr-1 leading-tight focus:outline-none focus:bg-blue-200 focus:border-blue-400 focus:text-blue-800 px-3 tracking-tighter"
              @change="onMapListChange"
            >
              <option v-for="map in mapCount">Map {{ map }}</option>
            </select>
          </div>
        </section>
        <section class="" v-if="tilesheetImageDataRef">
          <ul
            class="overflow-y-auto overflow-x-hidden border border-gray-800 bg-gray-900 m-4 palette"
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
        <section></section>
      </aside>
      <main
        class="mt-4 pl-96 w-full bg-black flex flex-row space-x-2"
        v-if="tilesheetImageDataRef"
      >
        <section class="">
          <TilesheetCanvas :image-data="tilesheetImageDataRef" />
        </section>
        <section class="overflow-scroll">
          <MapCanvas :image-datas="tileMapImageDatasRef" />
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
}

input[type="file"]::-webkit-file-upload-button,
input[type="file"]::file-selector-button {
  @apply bg-black;
}
</style>
