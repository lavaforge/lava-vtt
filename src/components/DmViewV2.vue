<template>
  <div :key="imagePath" ref="containerRef" class="center">
    <img ref="imageRef" :src="imagePath" />
    <canvas :width="width" :height="height" ref="canvasRef" id="fogCanvas" />
    <div ref="rectangleRef" class="rectangle" />
    <div
      class="indicator"
      :style="{ 'background-color': shouldCover ? 'black' : 'white' }"
    />
    <div class="vertical-line" :style="{ left: mouseX + 'px' }"></div>
    <div class="horizontal-line" :style="{ top: mouseY + 'px' }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import paper from "paper";
import { useEventListener } from "@vueuse/core";
import { useMouse } from "@vueuse/core";
//import { useSocket } from "../logic/useSocket.ts";

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const width = ref(0);
const height = ref(0);
const shouldCover = ref(false);
const { x: mouseX, y: mouseY } = useMouse();

const hash = ref(new Date().toISOString());
const imagePath = computed(
  () => `${window.location.origin}/image?hash=${hash.value}`,
);

function initPaper() {
  if (canvasRef.value) {
    paper.setup(canvasRef.value);
    initDrawingTools();
  }
}

function initDrawingTools() {
  // TODO: also set up drawing tools for freehand drawing
  const tool = new paper.Tool();

  console.log("init tool");

  let path: paper.Path;
  tool.onMouseDown = function (event: {
    point: paper.Segment | paper.PointLike | number[];
  }) {
    console.log("mouse down detected");
    path = new paper.Path();
    if (shouldCover.value) {
      path.strokeColor = new paper.Color("black");
    } else {
      path.strokeColor = new paper.Color("red");
    }
    path.add(event.point);
  };

  tool.onMouseDrag = function (event: {
    point: number[] | paper.Segment | paper.PointLike;
  }) {
    if (path) {
      console.log("drag");
      path.add(event.point);
    }
  };

  tool.onMouseUp = function () {
    console.log("mouse up");
    if (path) {
      path.closed = true;
      path.simplify();

      if (shouldCover.value) {
        let combinedPath: paper.Path | paper.PathItem = path;
        paper.project.activeLayer.children.forEach((child) => {
          if (child != path && child instanceof paper.Path) {
            combinedPath = combinedPath.unite(child);
            child.remove();
          }
        });
        combinedPath.fillColor = new paper.Color("black");
      } else {
        paper.project.activeLayer.children.forEach((child) => {
          if (child instanceof paper.Path && child !== path) {
            const subtracted = child.subtract(path);
            child.remove();
            subtracted.fillColor = new paper.Color("white");
          }
        });

        path.remove();
      }
    }

    paper.project.activeLayer.children.forEach((child) => {
      console.log(child);
    });
  };
  tool.activate();
}

useEventListener(imageRef, "load", async () => {
  if (!imageRef.value || !canvasRef.value) {
    throw new Error("no image or canvas");
  }

  width.value = imageRef.value.naturalWidth;
  height.value = imageRef.value.naturalHeight;

  const ctx = canvasRef.value.getContext("2d");
  if (!ctx) {
    throw new Error("no ctx");
  }

  await nextTick();
  initPaper();
});

useEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "x") {
    shouldCover.value = !shouldCover.value;
  }
});

// Additional functions and Vue component setup as needed
</script>

<style scoped>
img {
  max-width: 100vw;
  max-height: 100vh;
  pointer-events: none;
}

canvas {
  position: absolute;
  max-width: 100vw;
  max-height: 100vh;
  pointer-events: all;
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
  pointer-events: none;
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
