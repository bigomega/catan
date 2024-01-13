import * as CONST from "./const.js"
import Board from "./board/board.js"
import Player from "./player.js"
import UI from "./ui.js"
import SocketActions from "./socket_actions.js"
const ST = CONST.GAME_STATES

export default class Game {
  id; config; mapkey; map_changes; active_player; state; timer;
  board; player; ui; socket_actions;

  constructor(game_obj, player_obj, opponents_obj, socket) {
    this.id = game_obj.id
    this.mapkey = game_obj.mapkey
    this.map_changes = game_obj.map_changes
    this.config = game_obj.config
    this.active_player = game_obj.active_player
    this.state = game_obj.state
    this.dev_cards_len = game_obj.dev_cards_len
    this.timer = game_obj.timer

    this.board = new Board(game_obj.mapkey, game_obj.map_changes)
    this.player = new Player(player_obj)
    this.ui = new UI(this.board, this.player, opponents_obj)
    this.socket_actions = new SocketActions({
      game: this, player: this.player, ui: this.ui, socket,
    })
    this.ui.setSocketActions(this.socket_actions)
    this.ui.render()

    // Existing Game updates
    this.ui.game_state = this.state
    this.ui.active_player_id = this.active_player
    this.ui.updateExistingBoard()
    this.ui.setDevCardCount(this.dev_cards_len)
    game_obj.robber_loc && this.ui.moveRobber(game_obj.robber_loc)
    this.timer && this.ui.setTimer(this.timer, this.active_player)
    // State updates
    if (this.player.id === this.active_player) {
      switch (this.state) {
        case ST.INITIAL_SETUP: this.ui.showInitialBuild(); break;
        case ST.PLAYER_ROLL: this.ui.toggleDice(true); break;
        case ST.PLAYER_ACTIONS: this.ui.toggleActions(true); break;
        case ST.ROBBER_DROP: break;
        case ST.ROBBER_MOVE: this.ui.showRobberMovement(); break;
      }
    }
    if (this.state === ST.ROBBER_DROP) {
      this.player.resource_count > 7
        && this.ui.robberDrop(Math.floor(this.player.resource_count / 2))
    }
  }
}
