import * as CONST from "./const.js"
import Game from "./game.js"
const SOC = CONST.SOCKET_EVENTS

export default class SocketManager {
  #game; #socket;

  /** @param {Game} game  */
  constructor(game, socket) {
    this.#game = game
    this.#socket = socket
  }

  setUpEvents() {
    const game = this.#game
    this.#socket.emit(SOC.PLAYER_ONLINE)

    /** @event State-Change */
    this.#socket.on(SOC.STATE_CHANGE, (state, active_player) => game.onStateChangeSoc(state, active_player))

    /** @event Set-Timer */
    this.#socket.on(SOC.SET_TIMER, (t, pid) => game.setTimerSoc(t, pid))

    /** @event Initial-Setup-Request */
    this.#socket.on(SOC.INITIAL_SETUP, (active_player, turn) => game.requestInitialSetupSoc(active_player, turn))

    /** @event Build */
    this.#socket.on(SOC.BUILD, (player, piece, loc) => game.updateBuildSoc(player, piece, loc))

    /** @event PRIVATE?--Update-Player-Info */
    this.#socket.on(SOC.UPDATE_PLAYER, (update_player, key, context) => {
      game.updatePlayerSoc(update_player, key, context)
    })

    /** @event Show-Dice-Value */
    this.#socket.on(SOC.DICE_VALUE, (dice_val, active_player) => game.updateDiceValueSoc(dice_val, active_player))

    /** @event PRIVATE--Total-Resources-Received */
    this.#socket.on(SOC.RES_RECEIVED, res_obj => game.onTotalResReceivedInfo(res_obj))

    /** @event Development-Card-Taken */
    this.#socket.on(SOC.DEV_CARD_TAKEN, (active_player, count) => game.onDevCardTaken(active_player, count))
  }

  sendInitialSetup({ settlement_loc, road_loc }) {
    this.#socket.emit(SOC.INITIAL_SETUP, settlement_loc, road_loc)
  }

  sendDiceClick() { this.#socket.emit(SOC.ROLL_DICE) }

  sendLocationClick(loc_type, id) { this.#socket.emit(SOC.CLICK_LOC, loc_type, id) }

  buyDevCard() { this.#socket.emit(SOC.BUY_DEV) }

  endTurn() { this.#socket.emit(SOC.END_TURN) }

  sendRobberDrop(cards) { this.#socket.emit(SOC.ROBBER_DROP, cards) }

  sendRobberMove(tile_id, stolen_pid) { this.#socket.emit(SOC.ROBBER_MOVE, tile_id, stolen_pid) }

  saveStatus(message) { this.#socket.emit(SOC.SAVE_STATUS, message) }
}
