import type Point from "./interfaces/Point"

interface ArmParameter {
  color?: string
  x?: number
  y?: number
  child?: Arm
  angle?: number
  length?: number
}

const DEFAULT_ARM_LENGTH = 100;

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
    this.length = param.length || DEFAULT_ARM_LENGTH;
    this.angle = $state(param.angle || Math.PI / 4);
  }

  getEndPosition() {
    const endX = this.x + this.length * Math.cos(this.angle);
    const endY = this.y - this.length * Math.sin(this.angle);
    return { x: endX, y: endY };
  }

  draw(parentX: number, parentY: number, ctx: CanvasRenderingContext2D) {
    this.x = parentX;
    this.y = parentY;
    const endPos = this.getEndPosition();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(endPos.x, endPos.y);
    ctx.stroke();

    // Draw handle to move
    ctx.beginPath();
    ctx.arc(
      (this.x + endPos.x) / 2,
      (this.y + endPos.y) / 2,
      10, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // draw endeffector
    ctx.beginPath();
    ctx.arc(endPos.x, endPos.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();

    // Draw child arms
    if (this.child) {
      this.child.draw(endPos.x, endPos.y, ctx);
    }
  }

  arcPos() {
    const endPos = this.getEndPosition();
    return {
      x: (this.x + endPos.x) / 2,
      y: (this.y + endPos.y) / 2}
  }

  isInsideJoint(pointerPos: Point) {
    const arcPos = this.arcPos();
    const dx = pointerPos.x - arcPos.x;
    const dy = pointerPos.y - arcPos.y;
    return (dx * dx + dy * dy) <= (10 * 10);
  }
}

export { type ArmParameter, Arm }