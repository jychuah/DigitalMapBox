
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
  scale: number,
  width?: number,
  height?: number
}

export interface Vector {
  p0: Point,
  p1: Point
  w: number,
  c?: string
}

export interface State {
  vectors: Vector[ ],
  viewport: {
    center: Point,
    scale: number
  },
  regions: Region [ ],
  gmnotes?: Vector[ ]
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
  currentView: number,
  localViewport: ViewPort
}