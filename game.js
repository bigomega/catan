class Game {
  constructor() {
    // https://catanshop.com/images/thumbs/0000276_reversible-game-board.jpeg
    var mapkey = `\
      T10(l-S2).F11(tl-L2).M11(tr-*3)
      -M6.P9.P4.C8(r-G2)
      -P3(tl-B2).D0.F2.M5.P9
      -T8(l-*3).C5.C6.M3.T10.F3(tr-*3)
      +F4.T6.F12.T12.D0(r-R2)
      +P8(bl-*3).C10.M11.C6
      +F3.P5(bl-S2).T4(br-*3)\
    `
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
    // disribute resources to all players
  }

  end() {
    //
  }

}

class Board {
  constructor(mapkey, playerCount) {
    // generate the map DS
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

const RESOURCES = {
  P: 'Pasture', S: 'Sheep',
  T: 'Trees', L: 'Lumber',
  C: 'Clay', B: 'Brick',
  M: 'Mountain', R: 'Rock',
  F: 'Fields', G: 'Grain',
}

const DEVELOPMENT_CARDS = {
  K: 'Knight',
  R: 'Road building', Y: 'Year of plenty', M: 'Monopoly',
  V: 'Victory point',
}

const PIECES = {
  S: 'Settlement', C: 'City', R: 'Road',
}
