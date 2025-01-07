import { shuffle as arrayShuffle } from "../utils.js"
import Board from "./board.js"

const edge_shortcut = {
  top_left: 'tl', top_right: 'tr', left: 'l',
  right: 'r', bottom_left: 'bl', bottom_right: 'br',
}

export default class BoardShuffler {
  #board;
  #tiles = []
  #numbers = []
  #port_tiles = []

  constructor(mapkey) {
    this.#board = new Board(mapkey, null, true)
    this.#board.tile_rows.forEach(row => {
      row.forEach(tile => {
        if (tile.type === 'S') {
          tile.trade_edge && this.#port_tiles.push(tile)
          return
        }
        this.#tiles.push(tile.type)
        tile.type !== 'D' && this.#numbers.push(tile.num)
      })
    })
  }

  /** @param {false|'none'|'all'|'number'|'port'|'tile'|'(combo of number-port-tile)'} type  */
  shuffle(type) {
    if (!type || type === 'none') { return this.toMapKey() }
    type = type + ''
    const shuff_nums = type === 'all' || type.includes('number')
    const shuff_ports = type === 'all' || type.includes('port')
    const shuff_tiles = type === 'all' || type.includes('tile')
    let tile_index = 0, number_index = 0
    const new_tiles = shuff_tiles ? arrayShuffle(this.#tiles) : this.#tiles
    const new_numbers = shuff_nums ? arrayShuffle(this.#numbers) : this.#numbers
    const red_area_tiles = {}

    this.#board.tile_rows.forEach(row => {
      row.forEach(tile => {
        if (tile.type === 'S') return
        tile.type = new_tiles[tile_index++]
        if (tile.type === 'D') {
          red_area_tiles[tile.id] = true; return
        }
        tile.num = new_numbers[number_index++]
        if (!shuff_nums) return
        /**
         * @description Breaking the Red Numbers from being next to each other
         * - If I am 6 or 8
         *   - If this is red zone
         *      :: check for clear tiles
         *        - If found :: replace and update the clear tile as red zone
         *        - Else :: replace me with the first non (6|8) number from the end
         *            - If not found :: let's pray
         *   - Else :: mark red zone around me
         * - Else :: mark clear unless I'm red zoned already
         */
        if (+tile.num === 6 || +tile.num === 8) {
          if (red_area_tiles[tile.id]) {
            const clear_tile_i = Object.entries(red_area_tiles).find(([i, v]) => v === false)?.[0]
            if (clear_tile_i > -1) {
              const clear_tile = this.#board.findTile(clear_tile_i)
              const tmp = clear_tile.num
              clear_tile.num = tile.num
              tile.num = tmp
              red_area_tiles[clear_tile_i] = true
              Object.values(clear_tile.adjacent_tiles).forEach(t => red_area_tiles[t.id] = true)
            } else {
              const switch_index = new_numbers.findLastIndex(_ => +_ !== 8 && +_ !== 6)
              if (switch_index >= number_index) {
                const tmp = new_numbers[switch_index]
                new_numbers[switch_index] = tile.num
                tile.num = tmp
              } else {
                // RNGesus 🙏
              }
            }
          } else {
            red_area_tiles[tile.id] = true
            Object.values(tile.adjacent_tiles).forEach(t => red_area_tiles[t.id] = true)
          }
        } else {
          if (!red_area_tiles[tile.id]) red_area_tiles[tile.id] = false
        }
      })
    })

    if (shuff_ports) {
      // Switch ports
      arrayShuffle(this.#port_tiles.map(_ => _.id)).forEach((id, i) => {
        const old_tile = this.#port_tiles[i]
        const new_tile = this.#board.findTile(id)
        const { trade_type, trade_ratio } = old_tile
        old_tile.trade_type = new_tile.trade_type
        old_tile.trade_ratio = new_tile.trade_ratio
        new_tile.trade_type = trade_type
        new_tile.trade_ratio = trade_ratio
      })
    }

    return this.toMapKey()
  }

  toMapKey() {
    return this.#board.tile_rows.map((row, i) => {
      const diff = i > 0
        ? row.diff > 0 ? '+' : '-'
        : ''
      return diff + row.map(tile => {
        if (tile.type === 'D') return 'D'
        if (tile.type === 'S') {
          return 'S' + (tile.trade_edge ? `(${edge_shortcut[tile.trade_edge]}_${tile.trade_type}${tile.trade_ratio})` : '')
        }
        return tile.type + tile.num
      }).join('.')
    }).join('')
  }
}
