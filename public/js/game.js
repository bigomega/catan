import Board from "./board.js"

export default class Game {
  constructor(mapkey) {
    this.board = new Board(mapkey)
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
