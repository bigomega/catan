import * as CONST from "../const.js"
import Corner from "./corner.js"
import Tile from './tile.js'

export default class Board {
  head_tile; existing_changes;
  tiles = []
  numbers = [...Array(13)].map(_ => [])

  constructor(mapkey, existing_changes) {
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
   * @description Returns empty corner location without any corner neighbours
   * @param {number} [player_id]
   *          -1 : locations with at least one empty edge
   *          id : locations with at least one player(id) road
   * @returns {Corner[]}
   */
  /**
   * @todo Redo this with Corner to Tile link + Corner.getRefList()
   */
  settlementLocations(player_id) {
    const locations = []
    const visited_corners = []
    Corner.getRefList().forEach(corner => {
      if (!corner.tiles.filter(t => t.type !== 'S').length) return
      if (visited_corners[corner.id]) return
      visited_corners[corner.id] = 1
      const no_neighbours = corner.hasNoNeighbours()
      const road_count = corner.getEdges(player_id).length
      // C.getEdges(pid) handles the "-1" case
      !corner.piece && no_neighbours && road_count && locations.push(corner)
    })
    return locations
  }

  place(item, location) {
    //
  }

  distribute(number) {
    //
  }
}
