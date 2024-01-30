import * as CONST from "../const.js"

const OPPOSITES = { top: 'bottom', left: 'right', right: 'left', bottom: 'top' }

export default class Tile {
  id; type; num; adjacent_tiles;
  trade_edge; trade_type;
  corners = {}
  robbed = false

  constructor({ id, type = 'S', num, left, top_left, top_right,
    trade_edge, trade_type, trade_ratio, robbed, createCorner, createEdge, no_edge_corner } = {}) {
    this.id = id
    this.type = Object.keys(CONST.TILES).includes(type) ? type : 'S'
    this.num = num
    if (robbed) this.robbed = true
    this.adjacent_tiles = { left, top_left, top_right }
    if (left) { left.adjacent_tiles.right = this }
    if (top_left) { top_left.adjacent_tiles.bottom_right = this }
    if (top_right) { top_right.adjacent_tiles.bottom_left = this }
    if (!no_edge_corner) {
      this.corners = {
        top: top_left?.corners?.bottom_right || top_right?.corners?.bottom_left,
        top_left: top_left?.corners?.bottom || left?.corners?.top_right,
        top_right: top_right?.corners?.bottom,
        bottom_left: left?.corners?.bottom_right,
        bottom_right: undefined,
        bottom: undefined,
      }
    }
    /**
     * Just picked corners from existing adjacent tiles
     * New corners for the tile will be created next
     * Creating edge for the new corners and the existing corners
     * and attaching (`addEdge`) it to both corners
     *
     * There are always 3 Edges to a corner -> left, right, top/bottom
     */
    !no_edge_corner && Object.keys(this.corners).forEach(dir => {
      // dir is direction of corner from the tile
      if (this.corners[dir]) {
        this.corners[dir].addTile(this)
      } else {
        const newCorner = createCorner(this)
        this.corners[dir] = newCorner
        const ALL_CONNECTIONS = { // only within the current Tile
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
          // c_loc is the location of other corner from tile view (simillar to dir)
          if (this.corners[c_loc]) {
            const edge = createEdge(newCorner, this.corners[c_loc])
            newCorner.addEdge(c_dir, edge)
            this.corners[c_loc].addEdge(OPPOSITES[c_dir], edge)
          }
        })
      }
    })
    if (this.type == 'S') {
      this.trade_edge = trade_edge
      this.trade_type = trade_type
      this.trade_ratio = trade_ratio
      if (!no_edge_corner) {
        const EDGE_2_CORNERS = {
          top_left: ['top', 'top_left'],
          top_right: ['top', 'top_right'],
          left: ['top_left', 'bottom_left'],
          right: ['top_right', 'bottom_right'],
          bottom_left: ['bottom', 'bottom_left'],
          bottom_right: ['bottom', 'bottom_right'],
        }
        EDGE_2_CORNERS[trade_edge]?.forEach(dir => {
          this.corners[dir]?.setTrade(trade_type, trade_ratio)
        })
      }
    }
  }

  getAllCorners() {
    return Object.keys(this.corners).map(dir => this.corners[dir])
  }

  getOccupiedCorners() {
    return this.getAllCorners().filter(c => c.player_id)
  }

  toggleRobbed(bool) { this.robbed = bool }
}
