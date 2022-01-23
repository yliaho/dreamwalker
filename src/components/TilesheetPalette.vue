<script setup lang="ts">
import { computed, defineEmits, defineProps } from "vue";
import { Argb32 } from "../lib/datas-bin";

const props = defineProps<{ paletteIndex: number; palettes: Argb32[][] }>();
const emits = defineEmits<{
  (e: "changePalette", index: number): void;
}>();

function onPaletteClick(index: number) {
  emits("changePalette", index);
}
</script>

<template>
  <ul class="px-1 py-1 flex flex-col items-center">
    <li
      v-for="(palette, i) in palettes"
      @click="onPaletteClick(i)"
      :class="
        i === paletteIndex
          ? `outline outline-blue-500 relative z-10`
          : `` + `block`
      "
    >
      <ul class="flex">
        <li v-for="color in palette" class="flex">
          <div
            v-if="color.a > 0"
            class="w-7 h-7"
            :style="{
              backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
            }"
          />
          <div v-else class="w-7 empty-color" />
        </li>
      </ul>
    </li>
  </ul>
</template>
