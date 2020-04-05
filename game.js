class Game {
  constructor() {
    // https://catanshop.com/images/thumbs/0000276_reversible-game-board.jpeg
    this.mapkey = `\
      .T10(l-S2).F11(tl-L2).M11(tr-*3)
      -.M6.P9.P4.C8(r-G2)
      -.P3(tl-B2).D0.F2.M5.P9
      -.T8(l-*3).C5.C6.M3.T10.F3(tr-*3)
      +.F4.T6.F12.T12.D0(r-R2)
      +.P8(bl-*3).C10.M11.C6
      +.F3.P5(bl-S2).T4(br-*3)\
    `
    this.start()

    this.board = new Board(this.mapkey)
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
    // disribute resources to all players
  }

  end() {
    //
  }

  onAction(cb) {
    this.onActionCallback = cb
  }
}

class ElementWithId {
  #id
  constructor(id) {
    this.#id = id
  }
  get id() { return this.#id }
}

class Corner extends ElementWithId {
  static #count = 0
  #port = null

  constructor(port) {
    super(++ Corner.#count)
    if(port)
      this.#port = { resource: port.port_resource, value: port.port_value }
  }

  get port() { return this.#port }

  place(){}
}

class Edge extends ElementWithId {
  static #count = 0
  constructor() {
    super(++ Edge.#count)
  }
  place(){}
}

class Tile extends ElementWithId {
  static #count = 0
  static edges_ref = 'tr,r,br,bl,l,tl'.split(',')
  static corners_ref = 't,tr,br,b,bl,tl'.split(',')
  static edge_corner_map = { tr: 't,tr', r: 'tr,br', br: 'br,b', bl: 'bl,b', l: 'tl,bl', tl: 't,tl' }
  static corner_edge_map = { t: 'tl,tr', tr: 'tr,r', br: 'br,r', b: 'bl,br', bl: 'l,bl', tl: 'l,tl' }
  static dir_opposite = { tr: 'bl', r: 'l', br: 'tl', bl: 'tr', l: 'r', tl: 'br' }
  edges = {}
  corners = {}
  tiles = {}

  constructor(type, value, port_dir, port_resource, port_value) {
    super(++ Tile.#count)
    Tile.edges_ref.forEach(d => this.edges[d] = new Edge)
    Tile.corners_ref.forEach(d => this.corners[d] = new Corner)
    this.type = type
    this.value = value
    if (port_dir) {
      Tile.edge_corner_map[port_dir].split(',').forEach(cd =>
        this.corners[cd] = new Corner({ port_resource, port_value })
      )
      this.port = { port_dir, port_resource, port_value }
    }
  }

  join(dir, tile) {
    const opposite_dir = Tile.dir_opposite[dir]
    // two way binding between tiles
    this.tiles[dir] = tile
    tile.tiles[opposite_dir] = this
    // merge the edge
    this.edges[dir] = tile.edges[opposite_dir]
    // merge the appropriate corners (the corner order is always top-bottom)
    // Todo: can write this cleaner
    const this_tile_corners = Tile.edge_corner_map[dir].split(',')
    const merge_tile_corners = Tile.edge_corner_map[opposite_dir].split(',')
    this.#mergeCorners(this_tile_corners[0], merge_tile_corners[0], tile)
    this.#mergeCorners(this_tile_corners[1], merge_tile_corners[1], tile)
  }

  #mergeCorners = (this_corner_dir, tile_corner_dir, tile)  => {
    if (this.corners[this_corner_dir].port) {
      tile.corners[tile_corner_dir] = this.corners[this_corner_dir]
    } else {
      this.corners[this_corner_dir] = tile.corners[tile_corner_dir]
    }
  }
}

class Board {
  #board
  tile_number_map = {}

  constructor(mapkey) {
    ;[...Array(11).keys()].forEach(i => this.tile_number_map[i+2] = [])

    let prev_row
    this.#board = mapkey.split('\n').map((r, row_index) => {
      const row_key = r.trim()
      let displacement = 0
      let row_key_array = row_key.match(/([^\.]+)/g)
      if (row_index === 0) {
        if(! (/^(\.[PTCMFD]\d+(\((tr|r|br|bl|l|tl)-[SLBRG\*]\d\))?)+$/).test(row_key)) {
          throw "mapkey doesn't match pattern: " + row_key
        }
      } else {
        if(! (/^([\+-])\1*(\.[PTCMFD]\d+(\((tr|r|br|bl|l|tl)-[SLBRG\*]\d\))?)+$/).test(row_key)) {
          throw "mapkey doesn't match pattern: " + row_key
        }
        const disp_regex = row_key.match(/^([\+-])\1*/)
        displacement = disp_regex[0].length * (disp_regex[1] + 1) /* for the sign `* +/-1` */
        row_key_array.shift()
      }

      let prev_tile
      const tile_row = row_key_array.map((tile_key, i) => {
        const regex_capture = tile_key
          .match(/^([PTCMFD])(\d+)(?:\((tr|r|br|bl|l|tl)-([SLBRG\*])(\d)\))?$/)
        ;
        // capture groups - type, value, port_dir, port_resource, port_resource_value
        const tile_number = +regex_capture[2]
        if (tile_number !== 0 && (tile_number < 2 || tile_number > 12))
          throw 'The value on tile must be between 2-12, not ' + tile_number
        const tile = new Tile(...regex_capture.slice(1))
        tile_number && tile_number <= 12 && this.tile_number_map[tile_number].push(tile)
        if (prev_tile) {
          tile.join('l', prev_tile) // OR prev_tile.join('r', tile)
        }
        prev_tile = tile
        return tile
      })

      if(prev_row) {
        this.#merge_rows(prev_row, tile_row, displacement)
      }
      prev_row = tile_row
      tile_row.displacement = displacement
      return tile_row
      return 1
    })
  }

  #merge_rows = (top_row, bottom_row, displacement) => {
    top_row.forEach((top_tile, index) => {
      // -3 = 2
      // -2 = 1
      // -1 = 0
      // 1 = -1
      // 2 = -2
      const index_change = (displacement * -1) + (displacement < 0 ? -1: 0)
      const bottom_index = index + index_change
      bottom_row[bottom_index] && top_tile.join('bl', bottom_row[bottom_index])
      bottom_row[bottom_index + 1] && top_tile.join('br', bottom_row[bottom_index + 1])
    })
  }

  place(item, location) {
    //
  }
}

class Player {
  constructor() {
    this.hand_resources = {
      // todo - get from the const
      S: 0, L: 0, B: 0, R:0, G:0,
    }
    this.hand_development_cards = {}
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

// Not necessary, can get away with string literals
class Resource {
  constructor(type) {
    this.type = type
  }
}

const DIRECTIONS = {
  t: 't', tr: 'tr', tl: 'tl',
  l: 'l', r: 'r',
  b: 'b', br: 'br', bl: 'bl',
}

const TILES = {
  P: 'Pasture',
  T: 'Trees',
  C: 'Clay',
  M: 'Mountain',
  F: 'Fields',
  // W: 'Water',
  // O: 'Oasis',
}

const RESOURCES = {
  _ref: {
    S: 'Sheep',
    L: 'Lumber',
    B: 'Brick',
    R: 'Rock',
    G: 'Grain',
  },
  P: 'S', T: 'L', C: 'B', M: 'R', F: 'G',
}

const DEVELOPMENT_CARDS = {
  K: 'Knight',
  R: 'Road building', Y: 'Year of plenty', M: 'Monopoly',
  V: 'Victory point',
}

const PIECES = {
  S: 'Settlement', C: 'City', R: 'Road',
}
