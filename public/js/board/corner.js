import * as CONST from "../const.js"

export default class Corner {
  id; trade; piece; player_id;
  static #id_counter = 1
  static #ref_list = []
  tiles = []
  edges = { top: null, left: null, right: null, bottom: null }

  constructor(tile) {
    this.id = Corner.#id_counter ++
    Corner.#ref_list[this.id] = this
    this.tiles.push(tile)
  }

  static getRefList() { return this.#ref_list.slice() }

  addTile(tile) { this.tiles.push(tile) }
  addEdge(dir, edge) { this.edges[dir] = edge }
  setTrade(type) { this.trade = type }

  buildSettlement(player_id) { this.piece = 'S'; this.player_id = player_id }
  buildCity() {
    if (this.piece !== 'S') throw 'Cannot Build City without Settlement'
    this.piece = 'C'
  }

  /**
   * @description -1 for empty edges, pid for pid-roads, all if no pid
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
}
