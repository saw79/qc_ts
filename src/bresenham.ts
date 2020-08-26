export function line(x0: number, y0: number, x1: number, y1: number): Array<[number, number]> {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = (x0 < x1) ? 1 : -1;
  let sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;

  let points = [];
  while(true) {
    points.push([x0, y0]);

    //if ((x0 === x1) && (y0 === y1)) break;
    if (points_eq(x0, y0, x1, y1)) break;
    let e2 = 2*err;
    if (e2 > -dy) { err -= dy; x0  += sx; }
    if (e2 < dx) { err += dx; y0  += sy; }
  }

  return points;
}

function points_eq(x0: number, y0: number, x1: number, y1: number): boolean {
  return Math.abs(x1 - x0) < 0.0001 && Math.abs(y1 - y0) < 0.0001;
}
