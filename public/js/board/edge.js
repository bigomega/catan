export default class Edge {
  id; road; corner1; corner2;

  constructor(id, corner1, corner2) {
    this.id = id
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
