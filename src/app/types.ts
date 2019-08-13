
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
  vectors: Vector[ ],
  viewport: {
    center: Point,
    scale: number
  },
}

export interface View {
  name: string,
  state: State,
  color: string
}

export interface ServerState {
  path: string,
  hostname: string,
  ip: string,
  views: View[ ],
  global: State,
  currentView: string
}