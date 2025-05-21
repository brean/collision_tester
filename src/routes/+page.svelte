<script lang="ts">
  const padding = 250;
  const arm_length = 100;

  let armCanvas: HTMLCanvasElement;
  let armCtx: any;
  let cSpaceCanvas: HTMLCanvasElement;
  let cSpaceCtx: any;
  
  let draggingArm: Arm | undefined;

  interface ArmParameter {
    x?: number
    y?: number
    child?: Arm
    angle?: number
    length?: number
  }

  class Arm {
    x: number = 0.0;
    y: number = 0.0;
    length: number;
    angle: number;
    child?: Arm;

    constructor(param: ArmParameter) {
      this.x = param.x || 0.0;
      this.y = param.y || 0.0;
      this.child = param.child;
      this.length = param.length || arm_length;
      this.angle = $state(param.angle || Math.PI / 4);
    }

    getEndPosition() {
      const endX = this.x + this.length * Math.cos(this.angle);
      const endY = this.y - this.length * Math.sin(this.angle);
      return { x: endX, y: endY };
    }

    draw(parentX: number, parentY: number) {
      this.x = parentX;
      this.y = parentY;
      const endPos = this.getEndPosition();
      armCtx.lineWidth = 3;
      armCtx.beginPath();
      armCtx.moveTo(this.x, this.y);
      armCtx.lineTo(endPos.x, endPos.y);
      armCtx.stroke();

      // Draw joint
      armCtx.beginPath();
      armCtx.arc(
        (this.x + endPos.x) / 2,
        (this.y + endPos.y) / 2,
        10, 0, Math.PI * 2);
      armCtx.fillStyle = 'red';
      armCtx.fill();

      // Draw child arms
      if (this.child) {
        this.child.draw(endPos.x, endPos.y);
      }
    }

    arcPos() {
      const endPos = this.getEndPosition();
      return {
        x: (this.x + endPos.x) / 2,
        y: (this.y + endPos.y) / 2}
    }

    isInsideJoint(pointerPos: {x: number, y: number}) {
      const arcPos = this.arcPos();
      const dx = pointerPos.x - arcPos.x;
      const dy = pointerPos.y - arcPos.y;
      return (dx * dx + dy * dy) <= (10 * 10);
    }
  }
  // let upperarm = { x: padding + angleLower * Math.cos(angle1), y: joint1.y - armLength1 * Math.sin(angle1) };
  // let forearm = { x: jointLower.x + armLength2 * Math.cos(angle1 + angle2), y: joint2.y - armLength2 * Math.sin(angle1 + angle2) };
  
  let upperarm = new Arm({});
  let forearm = new Arm({child: upperarm});

  function draw() {
    armCtx.clearRect(0, 0, armCanvas.width, armCanvas.height);
    forearm.draw(padding, armCanvas.height - padding)
  }

  function init() {
    if (!armCanvas) {
      return
    }
    if (!armCtx) {
      armCtx = armCanvas.getContext('2d');
      if (!armCtx) {
        return
      }
    }

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

    function getPointerPos(canvas: HTMLCanvasElement, evt: PointerEvent) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    draw();
  }

  $effect(init);
</script>
upper arm angle: <input type="text" bind:value={upperarm.angle} /><br />
forearm angle: <input type="text" bind:value={forearm.angle} /><br />
<canvas width="500" height="500" bind:this={armCanvas}></canvas>
<canvas width="500" height="500" bind:this={cSpaceCanvas}></canvas>

<style>
  canvas {
    border: 1px solid black;
  }
</style>