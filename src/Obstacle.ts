import type Point from "./interfaces/Point";
import { segmentsIntersect } from "./utils";

const OBSTACLE_HANDLE_RADIUS = 6;

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

  drawHandles(originX: number, originY: number, ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(0,0,255,0.5)';
    ctx.fillStyle = 'rgba(100,100,255,0.7)';
    ctx.lineWidth = 1;
    this.vertices.forEach((v) => {
      const worldX = v.x + originX;
      const worldY = v.y + originY;
      ctx.beginPath();
      ctx.arc(worldX, worldY, OBSTACLE_HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

pointerOnVertex(pointerPos: Point, origin: Point): { vertexIndex: number } | null {
    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      const vertexWorldX = v.x + origin.x;
      const vertexWorldY = v.y + origin.y;
      const dx = pointerPos.x - vertexWorldX;
      const dy = pointerPos.y - vertexWorldY;
      if (dx * dx + dy * dy <= OBSTACLE_HANDLE_RADIUS * OBSTACLE_HANDLE_RADIUS) {
        return { vertexIndex: i };
      }
    }
    return null;
  }

  pointInside(pointInWorld: Point, obstacleOrigin: Point): boolean {
    let isInside = false;
    for (let i = 0, j = this.vertices.length - 1; i < this.vertices.length; j = i++) {
      const xi = this.vertices[i].x + obstacleOrigin.x;
      const yi = this.vertices[i].y + obstacleOrigin.y;
      const xj = this.vertices[j].x + obstacleOrigin.x;
      const yj = this.vertices[j].y + obstacleOrigin.y;

      const intersect = (
        (yi > pointInWorld.y) !== (yj > pointInWorld.y)) &&
        (pointInWorld.x < (xj - xi) * (pointInWorld.y - yi) / (yj - yi) + xi);
      // TODO: optimize? we could probably return here early?
      if (intersect) isInside = !isInside;
    }
    return isInside;
  }

  collidesWithSegment(
    segP1: Point, segP2: Point, obstacleOrigin: Point 
  ): boolean {
    const worldVertices = this.vertices.map(v => (
      {
        x: v.x + obstacleOrigin.x,
        y: v.y + obstacleOrigin.y
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
    if (this.vertices.length >=3 && this.pointInside(midPoint, obstacleOrigin)) {
      return true;
    }
    return false;
  }
}