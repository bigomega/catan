export default class Corner {
  id; trade; piece; player_id;
  tiles = []
  edges = { top: null, left: null, right: null, bottom: null }

  constructor(id, tile) {
    this.id = id
    this.tiles.push(tile)
  }

  addTile(tile) { this.tiles.push(tile) }
  addEdge(dir, edge) { this.edges[dir] = edge }
  setTrade(type, ratio) { this.trade = type + ratio }

  buildSettlement(player_id) { this.piece = 'S'; this.player_id = player_id }
  buildCity() {
    if (this.piece !== 'S') throw 'Cannot Build City without Settlement'
    this.piece = 'C'
  }

  /**
   * @description -1 for empty edges, pid for pid-roads, null for all
   * @param {number?} [player_id ]
   * @returns {Edge[]}
   */
  getEdges(player_id) {
    return Object.keys(this.edges).reduce((mem, dir) => {
      const edge = this.edges[dir]
      if (!edge) return mem
      if (player_id === -1) { // only empty ones when pid is -1
        !edge.road && mem.push(edge)
      } else if (player_id) {
        edge.road === player_id && mem.push(edge)
      } else {
        mem.push(edge)
      }
      return mem
    }, [])
  }

  hasNoNeighbours() {
    return Object.keys(this.edges).reduce((mem, dir) =>
      mem && !this.edges[dir]?.jumpCorner(this)?.piece
      , true)
  }

  surroundedBySea() {
    return this.tiles.reduce((mem, t) => mem && t.type === 'S', true)
  }
}
