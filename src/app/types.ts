
export interface Point {
  x: number,
  y: number
}

export interface Region {
  p: Point,
  w: number,
  h: number,
  id: string,
  revealed: boolean
}

export interface Camera {
  center: Point,
  scale: number
}

export interface ViewPort {
  width: number,
  height: number
}

export interface Vector {
  p0: Point,
  p1: Point
  w: number,
  c?: string,
  id: string
}

export interface ServerState {
  path: string,
  hostname: string,
  ip: string,
  viewport: ViewPort,
  camera: Camera,
  vectors: Vector[ ],
  regions: Region[ ]
}