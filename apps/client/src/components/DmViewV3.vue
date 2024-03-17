<template>
  <div>
    <h1>DM View V3</h1>
    <h2>click the button as fast as possible against the computer!</h2>
    <h1>LEVEL: {{ curScore }} / {{ maxScore }}</h1>

    <button @click="clickDown">{{ buttonText }}</button>

    <!--img style="position: absolute; z-index: 1;" ref="imageRef" src="/lorehold.png" /-->
    <!--img ref="imgRefTest" style="position: absolute; z-index: 4;"
    src="/current_image.png" class=""/-->

    <svg ref="refTEST" style="position: absolute; z-index: 3" class="svgClass">
      <rect
        ref="recRef"
        x="0"
        y="0"
        :width="rectWidth"
        :height="recHeight"
        :style="fillCol"
      />

      <text y="300" style="font: bold 300px sans-serif; fill: red">
        {{ winText }}
      </text>
    </svg>

    <svg></svg>

    <!--div style="position: absolute;
    recRef.value = '1000px'; z-index: 3;" ref="testRef" class="rectangle" bg="blue" /-->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { TypeScriptPractice } from "../logic/TypeScriptPractice";

//const recRef = ref<HTMLDivElement | null>(null);
const recRef = ref(0);
var fillCol = ref("fill: rgb(0,256,0);");
var dynamicText = ref('text: "DM View V3"');
var buttonText = ref("CLICK ME");
var winText = ref("");

function testFunction() {}

const maxClickCount = 10;
let clickCount = maxClickCount;
let frameCur = 0;
let sizeUp = true;
let loopsPerSecond = 1;
let cps = 5;
let curScore = 0;
const maxScore = 3;
const randFillCols = [
  "fill: red;",
  "fill: blue;",
  "fill: green;",
  "fill: yellow;",
  "fill: purple;",
  "fill: orange;",
  "fill: pink;",
  "fill: brown;",
  "fill: black;",
  "fill: white;",
];

function clickDown() {
  //buttonText.value = 'alder >:0';
  clickCount--;
  console.log("clickDown");
}

function everyFrame() {
  clickCount++;
  clickCount = Math.min(maxClickCount, clickCount);
}

function onWin() {
  winText.value = ":0";
}

function update() {
  rectWidth.value = clickCount * 10;
  if (clickCount < 0) {
    clickCount = 20;
    if (curScore >= maxScore) {
      onWin();
    }
    curScore = Math.min(curScore + 1, maxScore);

    console.log("curScore: " + curScore);

    //fillCol.value = 'fill: rgb(' + 40 * 2 + ',0,0)';
  }

  fillCol.value = "fill: rgb(0," + (256 - (curScore * 256) / maxScore) + ",0)";
}

function changeSize() {
  if (sizeUp) {
    frameCur++;
  } else {
    frameCur--;
  }

  if (frameCur > cps / loopsPerSecond / 2) {
    sizeUp = false;

    fillCol.value =
      "fill: rgb(" +
      Math.floor(Math.random() * 256) +
      "," +
      Math.floor(Math.random() * 256) +
      "," +
      Math.floor(Math.random() * 256) +
      ")"; // Collect all to a string

    //let fillCol =    ref('fill: rgb(100,100,100)'); // Collect all to a string
  } else if (frameCur < 0) {
    sizeUp = true;
  }

  rectWidth.value = frameCur * 10;

  //rectWidth.value = Math.random()*1000;
  //setTimeout(function() { rectWidth.value = Math.random()*1000; }, 0);
  //rectWidth.value = Math.random()*1000;
}

testFunction();

setInterval(everyFrame, 1000 / cps);
setInterval(update, 1000 / 60);

var varTypeScriptPractice = new TypeScriptPractice();

const width = ref(10);
var recWidth = "100%";
var recHeight = "50%";

let rectWidth = ref(1000);
ref(randFillCols[Math.floor(Math.random() * 10)]);

//templateRef('testRef').style.height = '1000px';
//testRef.style.width = '1000px';
</script>

<style scoped>
.rectangle {
  fill: blue;
  width: 500px;
  height: 500px;
  border: 1px solid red;
  z-index: 1;
}

.svgClass {
  width: 1000px;
  height: 1000px;
  z-index: 2;
}
</style>
