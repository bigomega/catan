import Board from "./board/board.js"
import * as CONST from "./const.js"

export default class Game {
  id; board;

  constructor({ mapkey, id, map_changes }) {
    this.id = id
    this.board = new Board(mapkey, map_changes)
  }

  end() {
    //
  }

}
