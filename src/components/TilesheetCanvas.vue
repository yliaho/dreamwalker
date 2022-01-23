<script setup lang="ts">
import { inject, onMounted, onUpdated, ref, watchEffect } from "vue";
import { DatasBin } from "../lib/datas-bin";
import { DatasBinKey } from "../useDatasBin";

const props = defineProps<{ imageData: ImageData; scale: number }>();

inject(DatasBinKey);
const canvasWidth = 256;
const canvasHeight = 256 * 6;
const canvasRef = ref<HTMLCanvasElement | null>(null);

watchEffect(() => {
  if (!props.imageData || !canvasRef.value) {
    return;
  }

  draw(canvasRef.value.getContext("2d")!, props.imageData);
});

function draw(ctx: CanvasRenderingContext2D, imageData: ImageData) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.putImageData(imageData, 0, 0);
}
</script>

<template>
  <div class="flex flex-col justify-center">
    <div class="">
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        tabindex="0"
        class="canvas"
        :style="{ transform: `scale(${scale + 1})` }"
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
canvas {
  transform-origin: left top;
}
</style>
