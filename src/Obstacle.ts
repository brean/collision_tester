import type Point from "./interfaces/Point";
import { segmentsIntersect } from "./utils";

export default class Obstacle {
  vertices: Point[];

  constructor(vertices: Point[]) {
    this.vertices = vertices;
  }

  draw(centerX: number, centerY: number, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'gray';
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x + centerX, this.vertices[0].y + centerY);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x + centerX, this.vertices[i].y + centerY);
    }
    ctx.closePath();
    ctx.fill();
  }

  pointInside(pointInWorld: Point, obstacleOriginX: number, obstacleOriginY: number): boolean {
    let isInside = false;
    for (let i = 0, j = this.vertices.length - 1; i < this.vertices.length; j = i++) {
      const xi = this.vertices[i].x + obstacleOriginX;
      const yi = this.vertices[i].y + obstacleOriginY;
      const xj = this.vertices[j].x + obstacleOriginX;
      const yj = this.vertices[j].y + obstacleOriginY;

      const intersect = (
        (yi > pointInWorld.y) !== (yj > pointInWorld.y)) &&
        (pointInWorld.x < (xj - xi) * (pointInWorld.y - yi) / (yj - yi) + xi);
      // TODO: optimize? we could probably return here early?
      if (intersect) isInside = !isInside;
    }
    return isInside;
  }

  collidesWithSegment(
    segP1: Point, segP2: Point,
    obstacleOriginX: number, obstacleOriginY: number 
  ): boolean {
    const worldVertices = this.vertices.map(v => (
      {
        x: v.x + obstacleOriginX,
        y: v.y + obstacleOriginY
      }));
    if (worldVertices.length < 2) return false;

    for (let i = 0; i < worldVertices.length; i++) {
      const v_current = worldVertices[i];
      const v_next = worldVertices[(i + 1) % worldVertices.length];
      if (segmentsIntersect(segP1, segP2, v_current, v_next)) {
        return true;
      }
    }
    
    const midPoint = { x: (segP1.x + segP2.x) / 2, y: (segP1.y + segP2.y) / 2 };
    if (this.vertices.length >=3 && this.pointInside(midPoint, obstacleOriginX, obstacleOriginY)) {
      return true;
    }
    return false;
  }
}