export default class Edge {
  road
  static #id_counter = 1
  static #ref_list = []

  constructor(corner1, corner2) {
    this.id = Edge.#id_counter ++
    Edge.#ref_list[this.id] = this
    this.corner1 = corner1
    this.corner2 = corner2
  }

  static getRefList() { return this.#ref_list.slice() }

  buildRoad(pid) { this.road = pid }

  jumpCorner(from) {
    if (from === this.corner1) return this.corner2
    if (from === this.corner2) return this.corner1
    return null
  }
}
