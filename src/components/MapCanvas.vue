<script setup lang="ts">
import { Renderer, Tile, TileMap } from "../lib/renderer";
import { ref, onMounted, watchEffect } from "vue";

const props = defineProps<{
  tiles: Tile[];
}>();

const tilemapTargetRef = ref<HTMLElement>();
let renderer: Renderer;
watchEffect(() => {
  if (!tilemapTargetRef.value) {
    return;
  }
  renderer = new Renderer({
    targetSelector: "#target",
    width: 52 * 24,
    height: 60 * 16,
  });

  Renderer.textureCache.clear();

  renderer.instance.stage.addChild(new TileMap(props.tiles).container);
});
</script>

<template>
  <div ref="tilemapTargetRef" id="target"></div>
</template>
