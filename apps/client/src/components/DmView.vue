<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useSocket } from '../logic/useSocket';
import { useEventListener } from '@vueuse/core';
import { FogOfWar } from '../logic/FogOfWar';
import { useMouse } from '@vueuse/core';
import { scg } from 'ioc-service-container';
import paper from 'paper';
import { project } from 'paper/dist/paper-core';

const { emit } = useSocket({
  event: 'new-image',
  callback: (data) => {
    hash.value = data;
  },
});

const apiUrl = scg('apiUrl');
const hash = ref('');
const imagePath = computed(() => `${apiUrl}/api/image/${hash.value}`);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const width = ref(0);
const height = ref(0);
const addFow = ref(false);
const { x: mouseX, y: mouseY } = useMouse();

function initPaper() {
  if (canvasRef.value) {
    paper.setup(canvasRef.value);
    initDrawingTools();
  }
}

function initDrawingTools() {
  // TODO: also set up drawing tools for freehand drawing
  const tool = new paper.Tool();

  console.log('init tool');

  let path: paper.Path;
  tool.onMouseDown = function (event: {
    point: paper.Segment | paper.PointLike | number[];
  }) {
    console.log('mouse down detected');
    path = new paper.Path();
    if (addFow.value) {
      path.strokeColor = new paper.Color('black');
    } else {
      path.strokeColor = new paper.Color('red');
    }
    path.add(event.point);
  };

  tool.onMouseDrag = function (event: {
    point: number[] | paper.Segment | paper.PointLike;
  }) {
    if (path) {
      console.log('drag');
      path.add(event.point);
    }
  };

  tool.onMouseUp = function () {
    console.log('mouse up');
    if (path) {
      path.closed = true;
      path.simplify();

      if (addFow.value) {
        let combinedPath: paper.Path | paper.PathItem = path;
        paper.project.activeLayer.children.forEach((child) => {
          console.log('child: ' + child + ' with type ' + child.className);
          if (
            child != path &&
            (child instanceof paper.Path ||
              child instanceof paper.CompoundPath ||
              child instanceof paper.PathItem)
          ) {
            combinedPath = combinedPath.unite(child);
          }
        });
        combinedPath.fillColor = new paper.Color('black');
        paper.project.activeLayer.removeChildren();
        paper.project.activeLayer.addChild(combinedPath);
      } else {
        let substractedPath:
          | paper.CompoundPath
          | paper.PathItem
          | paper.Path
          | paper.Item = path;
        paper.project.activeLayer.children.forEach((child) => {
          if (
            (child instanceof paper.CompoundPath ||
              child instanceof paper.Path ||
              child instanceof paper.PathItem) &&
            child != path
          ) {
            substractedPath = child.subtract(path);
          }
        });
        paper.project.activeLayer.removeChildren();
        substractedPath.fillColor = new paper.Color('black');
        paper.project.activeLayer.addChild(substractedPath);
      }
    }
  };
  tool.activate();
}

useEventListener(imageRef, 'load', async () => {
  if (!imageRef.value || !canvasRef.value) {
    throw new Error('no image or canvas');
  }

  width.value = imageRef.value.naturalWidth;
  height.value = imageRef.value.naturalHeight;

  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) {
    throw new Error('no ctx');
  }

  await nextTick();
  initPaper();
});

useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'x') {
    addFow.value = !addFow.value;
  }
});
</script>

<template>
  <div :key="imagePath" ref="containerRef" class="center">
    <template v-if="hash">
      <img ref="imageRef" :src="imagePath" />
      <canvas :width="width" :height="height" ref="canvasRef" />
      <div ref="rectangleRef" class="rectangle" />
      <div
        class="indicator"
        :style="{ 'background-color': addFow ? 'black' : 'white' }"
      />
      <div class="vertical-line" :style="{ left: mouseX + 'px' }"></div>
      <div class="horizontal-line" :style="{ top: mouseY + 'px' }"></div>
    </template>
    <div v-else>no image loaded</div>
  </div>
</template>

<style scoped>
img {
  max-width: 100vw;
  max-height: 100vh;
}

canvas {
  position: absolute;
  max-width: 100vw;
  max-height: 100vh;
}

.center {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.rectangle {
  position: absolute;
  border: 1px dashed red;
  display: none;
  pointer-events: none;
}

.indicator {
  position: fixed;
  top: 0;
  right: 0;
  width: 50px;
  height: 50px;
  border: 2px solid black;
}

.vertical-line,
.horizontal-line {
  position: absolute;
  background-color: black;
  pointer-events: none;
}

.vertical-line {
  width: 1px;
  height: 100%;
  left: v-bind(mouseX) px;
}

.horizontal-line {
  width: 100%;
  height: 1px;
  top: v-bind(mouseY) px;
}
</style>
