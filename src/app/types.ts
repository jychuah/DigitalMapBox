
export interface Point {
  x: number,
  y: number
}

export interface ViewPort {
  center: Point,
  scale: number
}

export interface Vector {
  p0: Point,
  p1: Point
  color: string,
  width: number
}

export interface State {
  path: string,
  vectors: Vector[ ],
  viewport: {
    center: Point,
    scale: number
  },
  hostname: string,
  ip: string,
}
