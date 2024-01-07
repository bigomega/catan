import * as CONST from "../const.js"
import Corner from "./corner.js"
import Edge from "./edge.js"
import Tile from './tile.js'

export default class Board {
  head_tile; existing_changes;
  tile_rows = []
  numbers = [...Array(13)].map(_ => [])
  #tile_refs = []
  #corner_refs = []
  #edge_refs = []

  constructor(mapkey, existing_changes = []) {
    this.mapkey = mapkey
    this.existing_changes = existing_changes
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
      const prev_row = i > 0 ? this.tile_rows[i - 1] : null
      const row_data = []
      // With the current implementation - ONLY ONE +/- can be used for Row Diff
      if (row_map[0] == '+' || row_map[0] == '-') {
        row_data.diff = +(row_map[0] + '1')
        row_map = row_map.substr(1)
      } else if (i > 0) { // edge case
        row_data.diff = 1
      }
      const row_map_arr = row_map.split('.')
      for (let j = 0; j < row_map_arr.length; j++) {
        const tile_map = row_map_arr[j].trim()
        const prev_tile = j > 0 ? row_data[j - 1] : null
        const row_diff_tmp = row_data.diff < 0 ? -1 : 0
        const adjacent_tiles = {
          left: prev_tile,
          top_left: prev_row?.[j + row_diff_tmp],
          top_right: prev_row?.[j + row_diff_tmp + 1],
        }
        const tile_params = {
          id: this.#tile_refs.length, createCorner: this.createCorner.bind(this),
          createEdge: this.createEdge.bind(this), ...adjacent_tiles
        }
        if (tile_map[0] == 'S') {
          const { dir, res, num } =
            tile_map.match(new RegExp(CONST.SEA_REGEX))?.groups || {}
          tile_params.trade_edge = ({
            tl: 'top_left', tr: 'top_right', l: 'left',
            r: 'right', bl: 'bottom_left', br: 'bottom_right',
          })[dir]
          tile_params.trade_type = res
          tile_params.type = 'S'
        } else {
          const { tile_type, num } =
          tile_map.match(new RegExp(CONST.RESOURCE_REGEX))?.groups || {}
          tile_params.type = tile_type
          tile_params.num = num
        }
        const tile = new Tile(tile_params)
        tile.num && tile.num > 1 && tile.num < 13 && this.numbers[tile.num].push(tile)
        this.#tile_refs.push(tile)
        row_data.push(tile)
      }
      this.tile_rows.push(row_data)
    }
    this.head_tile = this.tile_rows[0]?.[0]
    return this
  }

  createCorner(tile) {
    const corner = new Corner(this.#corner_refs.length, tile)
    this.#corner_refs.push(corner)
    return corner
  }

  createEdge(c1, c2) {
    const edge = new Edge(this.#edge_refs.length, c1, c2)
    this.#edge_refs.push(edge)
    return edge
  }

  /**
   * @description Returns empty corner location without any corner neighbours
   * @param {number} [player_id]
   *          -1 : locations with at least one empty edge
   *          id : locations with at least one player(id) road
   * @returns {Corner[]}
   */
  getSettlementLocations(player_id) {
    const locations = []
    this.#corner_refs.forEach(corner => {
      if (!corner.tiles.filter(t => t.type !== 'S').length) return
      const no_neighbours = corner.hasNoNeighbours()
      const road_count = corner.getEdges(player_id).length
      // C.getEdges(pid) handles the "-1" case
      !corner.piece && no_neighbours && road_count && locations.push(corner)
    })
    return locations
  }

  build(pid, piece, loc) {
    switch (piece) {
      case 'S': this.findCorner(loc)?.buildSettlement(pid); break;
      case 'C': this.findCorner(loc)?.buildCity(); break;
      case 'R': this.findEdge(loc)?.buildRoad(pid); break;
    }
  }

  /** @returns {Array[Object]} {pid, res, count}[] */
  distribute(number) {
    return this.numbers[number]?.reduce((mem, tile) => {
      const res = CONST.TILE_RES[tile.type]
      return mem.concat(tile.getOccupiedCorners().map(corner =>
        ({ pid: corner.player_id, res, count: +(corner.piece === 'C') + 1 })
      ))
    }, [])
  }

  findCorner(id) { return this.#corner_refs[id] }
  findEdge(id) { return this.#edge_refs[id] }
}
