<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useSocket } from '../logic/useSocket';
import { useEventListener } from '@vueuse/core';
import { useMouse } from '@vueuse/core';
import { scg } from 'ioc-service-container';
import paper from 'paper';
import { Point, Raster, view } from 'paper/dist/paper-core';

const NEW_IMAGE = 'new-image';
const NEW_FOW = 'new-fow';

const { emit } = useSocket({
  event: NEW_IMAGE,
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
        addPathToFow(path);
      } else {
        removePathFromFow(path);
      }
      sendPathUpdate();
    }
  };
  tool.activate();
}

function addPathToFow(path: paper.Path) {
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
}

function removePathFromFow(path: paper.Path) {
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

function sendPathUpdate() {
  // TODO: add listener for fow update -> send fow to api + client
  let firstChild: paper.Item | undefined = getFirstActiveLayerChild();
  if (
    firstChild instanceof paper.CompoundPath ||
    firstChild instanceof paper.Path
  ) {
    console.log(firstChild);
    emit(NEW_FOW, firstChild.pathData);
  }
}

function getFirstActiveLayerChild() {
  if (getActiveLayer().children.length == 1)
    return getActiveLayer().children.at(0);
}

function getActiveLayer() {
  return paper.project.activeLayer;
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
  initPaper(); // TODO: init canvas with fixed size equal to image size (as it was before) -> then re-init everything/reload page when window gets resized
  scalePaper();

  // TODO: load fow form api
});

function scalePaper() {
  // TODO: instead of this (or in addition) scale svg before putting it into client canvas
  const actualWidth = paper.view.viewSize.width;
  const actualHeight = paper.view.viewSize.height;
  const scaleX = actualWidth / width.value;
  const scaleY = actualHeight / height.value;
  paper.view.matrix.reset();
  const translateX = (actualWidth - width.value * Math.min(scaleX, scaleY)) / 2;
  const translateY =
    (actualHeight - height.value * Math.min(scaleX, scaleY)) / 2;
  paper.view.translate(new paper.Point(translateX, translateY));
  paper.view.scale(Math.min(scaleX, scaleY));
}

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
      <canvas ref="canvasRef" :width="width" :height="height" resize="true" />
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

canvas[resize] {
  position: absolute;
  background-color: red;
  opacity: 0.5;
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
