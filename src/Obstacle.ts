import type Point from "./interfaces/Point";
import { segmentsIntersect } from "./utils";

const OBSTACLE_HANDLE_RADIUS = 6;

class Obstacle {
  vertices: Point[];

  constructor(vertices: Point[]) {
    this.vertices = vertices;
  }

  draw(center: Point, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'gray';
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x + center.x, this.vertices[0].y + center.x);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x + center.x, this.vertices[i].y + center.y);
    }
    ctx.closePath();
    ctx.fill();
  }

  drawHandles(origin: Point, ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(0,0,255,0.5)';
    ctx.fillStyle = 'rgba(100,100,255,0.7)';
    ctx.lineWidth = 1;
    this.vertices.forEach((v) => {
      const worldX = v.x + origin.x;
      const worldY = v.y + origin.y;
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

function previewObstacle(points: Point[], center: Point, ctx: CanvasRenderingContext2D) {
  if (points.length <= 0) {
    return
  }
  ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const firstPointWorld = {
    x: points[0].x + center.x,
    y: points[0].y + center.y,
  };
  ctx.moveTo(firstPointWorld.x, firstPointWorld.y);
  ctx.arc(
    firstPointWorld.x, firstPointWorld.y,
    OBSTACLE_HANDLE_RADIUS, 0, Math.PI * 2);
    
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const worldX = p.x + center.x;
    const worldY = p.y + center.y;
    ctx.lineTo(worldX, worldY);
    ctx.moveTo(worldX + OBSTACLE_HANDLE_RADIUS, worldY);
    ctx.arc(worldX, worldY, OBSTACLE_HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.moveTo(worldX, worldY);
  }
  if (points.length > 2) { // close polygon preview
    ctx.lineTo(firstPointWorld.x, firstPointWorld.y);
  }
  ctx.stroke();
  ctx.beginPath();
    points.forEach(p => {
      const worldX = p.x + center.x;
      const worldY = p.y + center.y;
      ctx.moveTo(worldX + OBSTACLE_HANDLE_RADIUS, worldY);
      ctx.arc(worldX, worldY, OBSTACLE_HANDLE_RADIUS, 0, Math.PI * 2);
  });
  ctx.fill();
}


export { Obstacle, previewObstacle }