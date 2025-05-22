import type Point from "./interfaces/Point";

function getPointerPos(canvas: HTMLCanvasElement, evt: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function getPointerPosRelativeToCenter(canvas: HTMLCanvasElement, evt: PointerEvent) {
    const point = getPointerPos(canvas, evt);
    point.x -= canvas.width / 2,
    point.y -= canvas.height / 2
    return point;
}

function onSegment(p: Point, q: Point, r: Point): boolean {
  return (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
          q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y));
}

function orientation(p: Point, q: Point, r: Point): number {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) return 0; // Collinear
  return (val > 0) ? 1 : 2; // Clockwise or Counterclockwise
}

function segmentsIntersect(
  p1: Point, p2: Point, 
  p3: Point, p4: Point
): boolean {
  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  if (o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0) {
    if (o1 !== o2 && o3 !== o4) {
        return true;
    }
  }

  if (o1 === 0 && onSegment(p1, p3, p2)) return true;
  if (o2 === 0 && onSegment(p1, p4, p2)) return true;
  if (o3 === 0 && onSegment(p3, p1, p4)) return true;
  if (o4 === 0 && onSegment(p3, p2, p4)) return true;

  return false;
}

export {segmentsIntersect, getPointerPos, getPointerPosRelativeToCenter}