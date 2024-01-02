import * as CONST from "../const.js"

export default class Corner {
  static #idCounter = 1
  id; trade; piece; player_id

  constructor() {
    this.id = Corner.#idCounter ++
    this.edges = { top: null, left: null, right: null, bottom: null }
  }

  setEdge(dir, edge) { this.edges[dir] = edge }
  setTrade(type) { this.trade = type }

  buildSettlement(player_id) { this.piece = 'S'; this.player_id = player_id }
  buildCity() { this.piece = 'C' }

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
}
