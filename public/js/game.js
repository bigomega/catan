import Board from "./board/board.js"
import * as CONST from "./const.js"

export default class Game {
  id; board; config;

  constructor({ mapkey, id, map_changes, config }) {
    this.id = id
    this.board = new Board(mapkey, map_changes)
    this.config = config
  }

  end() {
    //
  }

}
