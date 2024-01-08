import * as CONST from "./const.js"
import Board from "./board/board.js"
import Player from "./player.js"
import UI from "./ui.js"
import SocketActions from "./socket_actions.js"

export default class Game {
  id; board; config; player; ui; socket_actions;

  constructor(game_obj, player_obj, opponents_obj, socket) {
    this.id = game_obj.id
    this.board = new Board(game_obj.mapkey, game_obj.map_changes)
    this.config = game_obj.config
    this.player = new Player(player_obj)
    this.ui = new UI(this.board, this.player, opponents_obj)
    this.socket_actions = new SocketActions({
      game: this, player: this.player, ui: this.ui, socket,
    })
    this.ui.render()
    this.ui.setSocketActions(this.socket_actions)
  }
}
