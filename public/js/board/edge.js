export default class Edge {
  static #idCounter = 1
  road

  constructor(corner1, corner2) {
    this.id = Edge.#idCounter ++
    this.corner1 = corner1
    this.corner2 = corner2
  }

  buildRoad(pid) { this.road = pid }

  jumpCorner(from) {
    if (from === this.corner1) return this.corner2
    if (from === this.corner2) return this.corner1
    return null
  }
}
