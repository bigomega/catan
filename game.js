class Game {
  constructor() {
    // https://alexbeals.com/projects/catan/?game=GqpQiMyykZIHp26cUs8sSnNiDIA
    this.mapkey = `S(br-S2).S.S(bl-B2).S
      -S.M5.J10.J8.S(bl-*3)
      -S(r-R2).J2.C9.G11.C4.S
      -S.G6.J4.D.F3.F11.S(l-G2)
      +S(r-L2).F3.G5.C6.M12.S
      +S.F8.G10.M9.S(tl-*3)
      +S(tr-*3).S.S(tl-*3).S`
    this.board = new Board(this.mapkey)
    this.start()
  }

  start() {
    // each turn, check player for actions (after roll)
    // 1st,2nd turn, they can place house and road free
    // if their total points == victory, End
  }

  place(player, item, location) {
    //
  }

  roll(player) {
    // roll 1 - 12
    Math.floor(Math.random() * 12) + 1
    // disribute resources to all players
  }

  end() {
    //
  }

}

class Board {
  constructor(mapkey, playerCount = 2) {
    this.tiles = []
    this.numbers = [...Array(13)].map(_ => [])
    const tile_types = Object.keys(TILES)
    const resource_types = Object.keys(RESOURCES)

    class Corner {
      constructor(tile, rel) {
        // this.tiles = {}
        this.neighbours = {
          left: null,
          right: null,
          top_bottom: null,
        }
      }

      setTrade(type) {
        this.trade = type
      }

      setNeighbour(dir, corner) {
        this.neighbours[dir]
      }
    }

    class Tile {
      constructor({type = 'S', left, top_left, top_right, trade_dirs = [], trade_type} = {}) {
        this.type = tile_types.includes(type) ? type : 'S'
        this.corners = {
          top: top_left?.corners?.bottom_right || top_right?.corners?.bottom_left || new Corner,
          top_left: top_left?.corners?.bottom || left?.corners?.top_right || new Corner,
          top_right: top_right?.corners?.bottom || new Corner,
          bottom_left: left?.corners?.bottom_right || new Corner,
          bottom_right: new Corner,
          bottom: new Corner,
        }
        if (this.type == 'S') {
          trade_dirs.forEach(dir => {
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
     * Sea - S(direction - ResourceKey number)? <sea has optional trade in a direction>
     * Desert - D
     * Reserouce - ResourceKey number
     *
     * Since decoding always happens from left to right and top to bottom, reuse previous corners
     */
    const mapkey_list = mapkey.trim().split('\n')
    for (let i = 0; i < mapkey_list.length; i++) {
      let row_map = mapkey_list[i].trim()
      const prev_row = i > 0 ? this.tiles[i-1] : null
      let row_list = []
      if (row_map[0] == '+' || row_map[0] == '-') {
        row_list.diff = row_map[0]
        row_map = row_map.substr(1)
      } else if (i > 0) { // edge case
        row_list.diff = '+'
      }
      row_map = row_map.split('.')
      for (let j = 0; j < row_map.length; j++) {
        const tile_map = row_map[j].trim()
        const prev_tile = j > 0 ? row_list[j-1] : null
        const row_diff = row_list.diff == '-' ? -1 : 0
        const adjacent_tiles = {
          left: prev_tile,
          top_left: prev_row?.[j + row_diff],
          top_right: prev_row?.[j + row_diff + 1],
        }
        if (tile_map[0] == 'S') {
          // Sea map regex with optional trade
          const sea_regex = `S\\((?<dir>tl|tr|l|r|bl|br)-(?<res>${resource_types.join('|')}|\\*)(?<num>\\d*)\\)`
          const { dir, res, num } = tile_map.match(new RegExp(sea_regex))?.groups || {}
          const trade_dirs = ({
            tl: ['top', 'top_left'],
            tr: ['top', 'top_right'],
            l: ['top_left', 'bottom_left'],
            r: ['top_right', 'bottom_right'],
            bl: ['bottom', 'bottom_left'],
            br: ['bottom', 'bottom_right'],
          })[dir] || []
          const tile = new Tile({ type: 'S', trade_dirs, trade_type: res, ...adjacent_tiles })
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

class Player {
  constructor() {
    this.hand_resources = {...RESOURCES}
    Object.keys(RESOURCES).map(r => this.hand_resources[r] = 0)

    this.hand_development_cards = {...DEVELOPMENT_CARDS}
    Object.keys(DEVELOPMENT_CARDS).map(r => this.hand_development_cards[r] = 0)
  }

  addResource(resource, count = 1) {
    this[resource] += count
  }
  hasResource(resource, count = 1) {}
  removeResource(resource, count = 1) {}

  addPiece(type) {}
  hasPiece(type) {}
  removePiece(type) {}
}

const TILES = {
  G: 'Grassland',
  J: 'Jungle',
  C: 'Clay Pit',
  M: 'Mountain',
  F: 'Fields',
  S: 'Sea',
  D: 'Desert',
}

const RESOURCES = {
  S: 'Sheep',
  L: 'Lumber',
  B: 'Brick',
  R: 'Rock',
  W: 'Wheat',
}

const TILE_RES = {
  G: 'S',
  J: 'L',
  C: 'B',
  M: 'R',
  F: 'W',
}

const DEVELOPMENT_CARDS = {
  K: 'Knight',
  R: 'Road building', Y: 'Year of plenty', M: 'Monopoly',
  V: 'Victory point',
}

const PIECES = {
  S: 'Settlement', C: 'City', R: 'Road',
}
