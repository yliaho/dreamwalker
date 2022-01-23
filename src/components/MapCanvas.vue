<script setup lang="ts">
import { ref, watchEffect } from "vue";

type ScrollMap = {
  v: number;
  h: number;
};

const props = defineProps({
  imageDatas: Array,
  canvasWidth: Number,
  canvasHeight: Number,
});

const canvasRef = ref<HTMLCanvasElement>();
const scrollMapRef = ref<ScrollMap>({
  v: 0,
  h: 0,
});
const scaleRef = ref<number>(1);

watchEffect(() => {
  if (
    !props.imageDatas ||
    !canvasRef.value ||
    !props.canvasWidth ||
    !props.canvasHeight
  ) {
    console.error("no map or other stuff");
    return;
  }

  draw(
    canvasRef.value.getContext("2d")!,
    props.imageDatas as any,
    props.canvasWidth,
    props.canvasHeight
  );
});

function draw(
  ctx: CanvasRenderingContext2D,
  imageDatas: Array<{ dx: number; dy: number; data: Promise<ImageBitmap> }>,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  imageDatas.forEach(async (imageData, index) => {
    const resolvedImageBitmap = await imageData.data;
    ctx.drawImage(resolvedImageBitmap, imageData.dx, imageData.dy);
    resolvedImageBitmap.close();
  });
}
</script>

<template>
  <canvas
    ref="canvasRef"
    :width="canvasWidth"
    :height="canvasHeight"
    tabindex="0"
    class="canvas"
  ></canvas>
</template>
