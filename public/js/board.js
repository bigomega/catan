import * as CONST from "./const.js"

export default class Board {
  constructor(mapkey, playerCount = 2) {
    this.tiles = []
    this.numbers = [...Array(13)].map(_ => [])
    const tile_types = Object.keys(CONST.TILES)
    const resource_types = Object.keys(CONST.RESOURCES)

    class Edge {
      static #idCounter = 1

      constructor(corner1, corner2) {
        this.id = Edge.#idCounter ++
        this.road = false
        this.corner1 = corner1
        this.corner2 = corner2
      }

      jumpCorner(from) {
        if (from == this.corner1) return this.corner2
        if (from == this.corner2) return this.corner1
        return null
      }
    }

    class Corner {
      static #idCounter = 1

      constructor() {
        this.id = Corner.#idCounter ++
        this.edges = { top: null, left: null, right: null, bottom: null }
      }

      setEdge(dir, edge) {
        this.edges[dir] = edge
      }

      setTrade(type) {
        this.trade = type
      }
    }

    class Tile {
      static #idCounter = 1

      constructor({ type = 'S', left, top_left, top_right, trade_edge, trade_type } = {}) {
        this.id = Tile.#idCounter ++
        this.type = tile_types.includes(type) ? type : 'S'
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
         * New corners will be created next
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
            const c_connections = ({
              top: { left: 'top_left', right: 'top_right' },
              top_left: { right: 'top', bottom: 'bottom_left' },
              top_right: { left: 'top', bottom: 'bottom_right' },
              bottom_left: { top: 'top_left', right: 'bottom' },
              bottom_right: { top: 'top_right', left: 'bottom' },
              bottom: { left: 'bottom_left', right: 'bottom_right' },
            })[dir]
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
        if (this.type == 'D') { this.robbed = true }
      }
    }

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
     *
     * Since decoding always happens from left to right and top to bottom, reuse previous corners
     */
    const mapkey_list = mapkey.trim().split('\n')
    for (let i = 0; i < mapkey_list.length; i++) {
      let row_map = mapkey_list[i].trim()
      const prev_row = i > 0 ? this.tiles[i - 1] : null
      let row_list = []
      if (row_map[0] == '+' || row_map[0] == '-') {
        row_list.diff = +(row_map[0] + '1')
        row_map = row_map.substr(1)
      } else if (i > 0) { // edge case
        row_list.diff = 1
      }
      row_map = row_map.split('.')
      for (let j = 0; j < row_map.length; j++) {
        const tile_map = row_map[j].trim()
        const prev_tile = j > 0 ? row_list[j - 1] : null
        const row_diff = row_list.diff < 0 ? -1 : 0
        const adjacent_tiles = {
          left: prev_tile,
          top_left: prev_row?.[j + row_diff],
          top_right: prev_row?.[j + row_diff + 1],
        }
        if (tile_map[0] == 'S') {
          // Sea map regex with optional trade
          const SEA_REGEX = `S\\((?<dir>tl|tr|l|r|bl|br)-(?<res>${resource_types.join('|')}|\\*)(?<num>\\d*)\\)`
          const { dir, res, num } = tile_map.match(new RegExp(SEA_REGEX))?.groups || {}
          const trade_edge = ({
            tl: 'top_left', tr: 'top_right', l: 'left',
            r: 'right', bl: 'bottom_left', br: 'bottom_right',
          })[dir]
          const tile = new Tile({ type: 'S', trade_edge, trade_type: res, ...adjacent_tiles })
          row_list.push(tile)
        } else {
          // Resource map regex
          const { tile_type, num } = tile_map.match(new RegExp(`(?<tile_type>[${tile_types.join('|')}])(?<num>\\d*)`))?.groups || {}
          const tile = new Tile({ type: tile_type, ...adjacent_tiles })
          num > 0 && num < 13 && this.numbers[num].push(tile)
          row_list.push(tile)
        }
      }
      this.tiles.push(row_list)
    }
    return this
  }

  place(item, location) {
    //
  }

  distribute(number) {
    //
  }
}
