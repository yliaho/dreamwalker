<script setup lang="ts">
import { ref, watchEffect } from "vue";

type ScrollMap = {
  v: number;
  h: number;
};

const props = defineProps({
  imageDatas: Array,
});

const canvasRef = ref<HTMLCanvasElement>();
const scrollMapRef = ref<ScrollMap>({
  v: 0,
  h: 0,
});
const scaleRef = ref<number>(1);

watchEffect(() => {
  if (!props.imageDatas || !canvasRef.value) {
    console.error("no map or other stuff");
    return;
  }

  draw(canvasRef.value.getContext("2d")!, props.imageDatas as any);
});

function draw(
  ctx: CanvasRenderingContext2D,
  imageDatas: Array<{ dx: number; dy: number; data: ImageData }>
) {
  imageDatas.forEach((imageData, index) => {
    ctx.putImageData(imageData.data, imageData.dx, imageData.dy);
  });
}
</script>

<template>
  <canvas
    ref="canvasRef"
    :width="1200"
    :height="1200"
    tabindex="0"
    class="canvas"
  ></canvas>
</template>
