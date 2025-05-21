<script lang="ts">
  const arm_length = 100;

  let armCanvas: HTMLCanvasElement;
  let armCtx: any;
  let cSpaceCanvas: HTMLCanvasElement;
  let cSpaceCtx: any;
  
  let draggingArm: Arm | undefined;

  interface ArmParameter {
    color?: string
    x?: number
    y?: number
    child?: Arm
    angle?: number
    length?: number
  }

  class Arm {
    color: string;
    x: number;
    y: number;
    length: number;
    angle: number;
    child?: Arm;

    constructor(param: ArmParameter) {
      this.color = param.color || 'green';
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

      // Draw handle to move
      armCtx.beginPath();
      armCtx.arc(
        (this.x + endPos.x) / 2,
        (this.y + endPos.y) / 2,
        10, 0, Math.PI * 2);
      armCtx.fillStyle = this.color;
      armCtx.fill();

      // draw endeffector
      armCtx.beginPath();
      armCtx.arc(endPos.x, endPos.y, 5, 0, Math.PI * 2);
      armCtx.fillStyle = 'black';
      armCtx.strokStyle = 'black'
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

  class Obstacle {
    vertices: { x: number, y: number }[];

    constructor(vertices: { x: number, y: number }[]) {
      this.vertices = vertices;
    }

    draw(centerX: number, centerY: number) {
      armCtx.fillStyle = 'gray';
      armCtx.beginPath();
      armCtx.moveTo(this.vertices[0].x + centerX, this.vertices[0].y + centerY);
      for (let i = 1; i < this.vertices.length; i++) {
        armCtx.lineTo(this.vertices[i].x + centerX, this.vertices[i].y + centerY);
      }
      armCtx.closePath();
      armCtx.fill();
    }

    isColliding(endPos: { x: number, y: number }) {
      // Simple point-in-polygon test
      let collision = false;
      for (let i = 0, j = this.vertices.length - 1; i < this.vertices.length; j = i++) {
        const xi = this.vertices[i].x, yi = this.vertices[i].y;
        const xj = this.vertices[j].x, yj = this.vertices[j].y;

        const intersect = ((yi > endPos.y) !== (yj > endPos.y)) &&
          (endPos.x < (xj - xi) * (endPos.y - yi) / (yj - yi) + xi);
        if (intersect) collision = !collision;
      }
      return collision;
    }
  }


  let upperarm = new Arm({length: arm_length * 0.8});
  let forearm = new Arm({child: upperarm, color: 'blue'});
  let obstacles = [
    new Obstacle([
      {x: 20, y: 20},
      {x: 80, y: 50},
      {x: 50, y: 80}
    ])
  ]

  function draw() {
    armCtx.clearRect(0, 0, armCanvas.width, armCanvas.height);
    obstacles.forEach((ob: Obstacle) => {
      ob.draw(armCanvas.width / 2, armCanvas.height / 2)
    })
    forearm.draw(armCanvas.width / 2, armCanvas.height / 2)

    cSpaceCtx.clearRect(0, 0, cSpaceCanvas.width, cSpaceCanvas.height);
    cSpaceCtx.beginPath();
    cSpaceCtx.arc(
      ((forearm.angle + Math.PI) * cSpaceCanvas.width) / (Math.PI * 2),
      ((upperarm.angle + Math.PI) * cSpaceCanvas.height) / (Math.PI * 2),
        10, 0, Math.PI * 2);
    cSpaceCtx.fillStyle = 'black';
    cSpaceCtx.fill();

  }

  function init() {
    if (!cSpaceCanvas) {
      return
    }
    if (!armCanvas) {
      return
    }
    if (!cSpaceCtx) {
      cSpaceCtx = cSpaceCanvas.getContext('2d');
      if (!cSpaceCtx) {
        return
      }
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
<div style="display: inline-block; vertical-align: top; margin-right: 20px;">
  Robot space<br />
  <canvas width="500" height="500" bind:this={armCanvas}></canvas>
</div>
<div style="display: inline-block; vertical-align: top;">
  configuration space<br />
  <canvas width="500" height="500" bind:this={cSpaceCanvas}></canvas>
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
</style>