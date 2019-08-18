
export interface Point {
  x: number,
  y: number
}

export interface Region {
  p: Point,
  w: number,
  h: number
}

export interface ViewPort {
  center: Point,
  scale: number
}

export interface Vector {
  p0: Point,
  p1: Point
  w: number
}

export interface State {
  vectors: Vector[ ],
  viewport: {
    center: Point,
    scale: number
  },
  regions: Region [ ]
}

export interface View {
  name: string,
  state: State,
  color: string,
  notes?: string
}

export interface ServerState {
  path: string,
  hostname: string,
  ip: string,
  views: View[ ],
  global: View,
  currentView: number
}