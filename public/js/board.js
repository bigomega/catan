import * as CONST from "./const.js"

class Edge {
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

class Corner {
  static #idCounter = 1
  id; trade; piece; player_id;

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

class Tile {
  static #idCounter = 1
  id; type; num; adjacent_tiles; corners;
  trade_edge; trade_type; robbed;

  constructor({ type = 'S', num, left, top_left, top_right, trade_edge, trade_type } = {}) {
    this.id = Tile.#idCounter ++
    this.type = Object.keys(CONST.TILES).includes(type) ? type : 'S'
    this.num = num
    this.adjacent_tiles = { left, top_left, top_right }
    if(left) { left.adjacent_tiles.right = this }
    if(top_left) { top_left.adjacent_tiles.bottom_right = this }
    if(top_right) { top_right.adjacent_tiles.bottom_left = this }
    this.corners = {
      top: top_left?.corners?.bottom_right || top_right?.corners?.bottom_left,
      top_left: top_left?.corners?.bottom || left?.corners?.top_right,
      top_right: top_right?.corners?.bottom,
      bottom_left: left?.corners?.bottom_right,
      bottom_right: undefined,
      bottom: undefined,
    }
    /**
     * Just picked corners from existing adjacent tiles
     * New corners for the tile will be created next
     * Creating edge for the new corners and the existing corners
     * and attaching (`setEdge`) it to both corners
     *
     * There are always 3 Edges to a corner -> left, right, top/bottom
     */
    Object.keys(this.corners).forEach(dir => {
      // dir is direction of corner from the tile
      if (!this.corners[dir]) {
        const newCorner = new Corner
        this.corners[dir] = newCorner
        const OPPOSITES = { top: 'bottom', left: 'right', right: 'left', bottom: 'top' }
        const ALL_CONNECTIONS = { // only for the current Tile
          top: { left: 'top_left', right: 'top_right' },
          top_left: { right: 'top', bottom: 'bottom_left' },
          top_right: { left: 'top', bottom: 'bottom_right' },
          bottom_left: { top: 'top_left', right: 'bottom' },
          bottom_right: { top: 'top_right', left: 'bottom' },
          bottom: { left: 'bottom_left', right: 'bottom_right' },
        }
        const c_connections = ALL_CONNECTIONS[dir]
        Object.keys(c_connections).forEach(c_dir => {
          const c_loc = c_connections[c_dir]
          // c_dir is direction of other corner from `newCorner`
          // c_loc is the location of other corner from tile view (same as dir)
          if (this.corners[c_loc]) {
            const edge = new Edge(newCorner, this.corners[c_loc])
            newCorner.setEdge(c_dir, edge)
            this.corners[c_loc].setEdge(OPPOSITES[c_dir], edge)
          }
        })
      }
    })
    if (this.type == 'S') {
      this.trade_edge = trade_edge
      this.trade_type = trade_type
      const EDGE_2_CORNERS = {
        top_left: ['top', 'top_left'],
        top_right: ['top', 'top_right'],
        left: ['top_left', 'bottom_left'],
        right: ['top_right', 'bottom_right'],
        bottom_left: ['bottom', 'bottom_left'],
        bottom_right: ['bottom', 'bottom_right'],
      }

      ; (EDGE_2_CORNERS[trade_edge] || []).forEach(dir => {
        this.corners[dir]?.setTrade(trade_type)
      })
    }
    if (this.type === 'D') { this.robbed = true }
  }
}

export default class Board {
  tiles = []
  numbers = [...Array(13)].map(_ => [])
  head_tile

  constructor(mapkey) {
    /**
     * ============
     * MAP DECODING
     * ============
     * split by \n - each line is each row in map
     * + or - represent where the hex starts in the next line. bottom right or left
     * each tile is split by dor (.) and each tile has it's own regex
     * Sea -> S(direction - ResourceKey number)? <sea has optional trade in a direction>
     * Desert -> D
     * Resource -> ResourceKey number
     * ex., +S(r-L2).F3.G5.C6.M12.S
     *
     * Since decoding always happens from left to right and top to bottom,
     * we reuse previous corners
     */
    const mapkey_list = mapkey.trim().split('\n')
    for (let i = 0; i < mapkey_list.length; i++) {
      let row_map = mapkey_list[i].trim()
      const prev_row = i > 0 ? this.tiles[i - 1] : null
      const row_list = []
      // With the current implementation - ONLY ONE +/- can be used for Row Diff
      if (row_map[0] == '+' || row_map[0] == '-') {
        row_list.diff = +(row_map[0] + '1')
        row_map = row_map.substr(1)
      } else if (i > 0) { // edge case
        row_list.diff = 1
      }
      const row_map_arr = row_map.split('.')
      for (let j = 0; j < row_map_arr.length; j++) {
        const tile_map = row_map_arr[j].trim()
        const prev_tile = j > 0 ? row_list[j - 1] : null
        const row_diff_tmp = row_list.diff < 0 ? -1 : 0
        const adjacent_tiles = {
          left: prev_tile,
          top_left: prev_row?.[j + row_diff_tmp],
          top_right: prev_row?.[j + row_diff_tmp + 1],
        }
        if (tile_map[0] == 'S') {
          const { dir, res, num } =
            tile_map.match(new RegExp(CONST.SEA_REGEX))?.groups || {}
          const trade_edge = ({
            tl: 'top_left', tr: 'top_right', l: 'left',
            r: 'right', bl: 'bottom_left', br: 'bottom_right',
          })[dir]
          const tile =
            new Tile({ type: 'S', trade_edge, trade_type: res, ...adjacent_tiles })
          row_list.push(tile)
        } else {
          const { tile_type, num } =
            tile_map.match(new RegExp(CONST.RESOURCE_REGEX))?.groups || {}
          const tile = new Tile({ type: tile_type, num, ...adjacent_tiles })
          num > 1 && num < 13 && this.numbers[num].push(tile)
          row_list.push(tile)
        }
      }
      this.tiles.push(row_list)
    }
    this.head_tile = this.tiles[0]?.[0]
    return this
  }

  /**
   * @description Returns empty corner location without neighbours
   * @param {number} [player_id]
   *          -1 : locations with an empty edge
   *      number : locations with a player road
   *       falsy : don't care about the edge data
   * @returns {Tile[]}
   */
  settlementLocations(player_id) {
    const locations = []
    const visited_corners = []
    this.tiles.forEach(row => row.forEach(tile => {
      if (tile.type === 'S') return
      for (const corner_dir in tile.corners) {
        const corner = tile.corners[corner_dir]
        if (visited_corners[corner.id]) continue
        visited_corners[corner.id] = 1
        const no_neighbours = corner.hasNoNeighbours()
        const road_count = !player_id || corner.getEdges(player_id).length
        // even without the `!pid ||` the `getEdges.len` is truthy when `pid` is fasly
        !corner.piece && no_neighbours && road_count && locations.push(corner)
      }
    }))
    return locations
  }

  place(item, location) {
    //
  }

  distribute(number) {
    //
  }
}
