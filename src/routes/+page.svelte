<script lang="ts">
  import { Arm } from "../Arm.svelte.ts";
  import type Point from "../interfaces/Point";
  import Obstacle from "../Obstacle";
  import { getPointerPos, segmentsIntersect } from "../utils";



  let armCanvas: HTMLCanvasElement;
  let armCtx: CanvasRenderingContext2D | null;
  let cSpaceCanvas: HTMLCanvasElement;
  let cSpaceCtx: CanvasRenderingContext2D | null;
  
  let draggingArm: Arm | undefined;
  let cSpaceImage: ImageData | null = null;

  let cSpaceCalculating = $state(true);
  let cSpaceNeedRedraw = true;
  let pointerListener = false;

  let upperarm = new Arm({length: 80})
  let forearm: Arm = new Arm({child: upperarm, color: 'blue'})
  let obstacles: Obstacle[] = [
    new Obstacle([
      {x: 20, y: 20},
      {x: 80, y: 50},
      {x: 50, y: 80}
    ])
  ]

  function drawCSpace() {
    if (!upperarm || !forearm || !cSpaceCtx) {
      return;
    }
    cSpaceCtx.clearRect(0, 0, cSpaceCanvas.width, cSpaceCanvas.height);
    if (cSpaceImage) {
      cSpaceCtx.putImageData(cSpaceImage, 0, 0);
    }

    cSpaceCtx.beginPath();
    cSpaceCtx.arc(
      ((forearm.angle + Math.PI) * cSpaceCanvas.width) / (Math.PI * 2),
      ((upperarm.angle + Math.PI) * cSpaceCanvas.height) / (Math.PI * 2),
        4, 0, Math.PI * 2);
    cSpaceCtx.fillStyle = 'rgba(0,0,0,0)';
    cSpaceCtx.strokeStyle = 'black';
    cSpaceCtx.lineWidth = 2;
    cSpaceCtx.fill();
    cSpaceCtx.stroke();
  }

  function draw() {
    if (!armCtx) {
      return
    }
    armCtx.clearRect(0, 0, armCanvas.width, armCanvas.height);
    obstacles.forEach((ob: Obstacle) => {
      if (!armCtx) return;
      ob.draw(armCanvas.width / 2, armCanvas.height / 2, armCtx)
    })
    forearm.draw(armCanvas.width / 2, armCanvas.height / 2, armCtx)

    drawCSpace();

  }

  function requestCSpaceUpdate() {
    if (!cSpaceCtx || !cSpaceNeedRedraw) {
      return;
    }
    console.log("Computing c-space obstacles...");
    cSpaceCalculating = true;
    const cSpaceWidth = cSpaceCanvas.width;
    const cSpaceHeight = cSpaceCanvas.height;
    cSpaceImage = cSpaceCtx.createImageData(cSpaceWidth, cSpaceHeight);
    const data = cSpaceImage.data;

    const armBaseX = armCanvas.width / 2;
    const armBaseY = armCanvas.height / 2;
    
    const len_forearm = forearm.length;
    const len_upperarm = upperarm.length;

    const obstacleRefX = armCanvas.width / 2; // Obstacles vertices are relative to this
    const obstacleRefY = armCanvas.height / 2;

    for (let cy = 0; cy < cSpaceHeight; cy++) {
      const angle_upperarm = (cy / cSpaceHeight) * (2 * Math.PI) - Math.PI;

      for (let cx = 0; cx < cSpaceWidth; cx++) {
        const angle_forearm = (cx / cSpaceWidth) * (2 * Math.PI) - Math.PI;
        
        const forearm_p1 = { x: armBaseX, y: armBaseY };
        const forearm_p2 = {
          x: armBaseX + len_forearm * Math.cos(angle_forearm),
          y: armBaseY - len_forearm * Math.sin(angle_forearm)
        };
        const upperarm_p1 = forearm_p2;
        const upperarm_p2 = {
          x: upperarm_p1.x + len_upperarm * Math.cos(angle_upperarm),
          y: upperarm_p1.y - len_upperarm * Math.sin(angle_upperarm)
        };
        
        let collision = false;
        for (const obs of obstacles) { // Read reactive `obstacles` state
          if (
            obs.collidesWithSegment(
              forearm_p1, forearm_p2, obstacleRefX, obstacleRefY) ||
            obs.collidesWithSegment(
              upperarm_p1, upperarm_p2, obstacleRefX, obstacleRefY)) {
            collision = true;
            break;
          }
        }

        const pixelIndex = (cy * cSpaceWidth + cx) * 4;
        if (collision) {
          data[pixelIndex] = 255;
          data[pixelIndex + 1] = 100;
          data[pixelIndex + 2] = 100;
          data[pixelIndex + 3] = 200;
        } else {
          data[pixelIndex] = 0;
          data[pixelIndex+1] = 0;
          data[pixelIndex+2] = 0;
          data[pixelIndex+3] = 0;
        }
      }
    }

    console.log('c-space obstacles done.')
    cSpaceNeedRedraw = cSpaceCalculating = false;
  }

  function init() {
    if (!cSpaceCanvas || ! armCanvas) {
      return
    }
    armCtx = armCanvas.getContext('2d');
    cSpaceCtx = cSpaceCanvas.getContext('2d');
    if (!cSpaceCtx || !armCtx) {
      console.error("Failed to get canvas contexts.");
      return
    }

    requestCSpaceUpdate();

    if (!pointerListener) {
      armCanvas.addEventListener('pointerdown', (e: PointerEvent) => {
        const pointerPos = getPointerPos(armCanvas, e);
        if (upperarm.isInsideJoint(pointerPos)) {
          draggingArm = upperarm;
        } else if (forearm.isInsideJoint(pointerPos)) {
          draggingArm = forearm;
        }
      });

      armCanvas.addEventListener('pointerup', () => {
        draggingArm = undefined;
      });

      armCanvas.addEventListener('pointermove', (e) => {
        if (draggingArm) {
          const pointerPos = getPointerPos(armCanvas, e);
          const dx = pointerPos.x - draggingArm.x;
          const dy = pointerPos.y - draggingArm.y;
          draggingArm.angle = Math.atan2(-dy, dx);
          draw();
        }
      });
      pointerListener = true;
    }

    draw();
  }

  $effect(init);
</script>
<div class="some_space" style="margin-right: 20px;">
  Robot space<br />
  <canvas width="500" height="500" bind:this={armCanvas}></canvas>
</div>
<div class="some_space">
  configuration space<br />
  <canvas width="500" height="500" bind:this={cSpaceCanvas}></canvas>
  {#if cSpaceCalculating}
    <div class="cspace_calc">
      calculating C-Space...
    </div>
  {/if}
</div>
<br />
upper arm angle: <input type="range" min={-Math.PI} max={Math.PI} step={0.01} bind:value={upperarm.angle} />
<button onclick={() => {upperarm.angle = 0}}>0</button> {Math.round(upperarm.angle * 1800 / Math.PI) / 10}<br />
forearm angle: <input type="range" min={-Math.PI} max={Math.PI} step={0.01} bind:value={forearm.angle} />
<button onclick={() => {forearm.angle = 0}}>0</button> {Math.round(forearm.angle * 1800 / Math.PI) / 10}<br />

<style>
  canvas {
    border: 1px solid black;
  }

  .some_space {
    position: relative;
    display:inline-block;
    vertical-align: top;
  }

  .cspace_calc {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(200,200,200,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.2em;
  }
</style>