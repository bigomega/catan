import * as CONST from "./const.js"
import Game from "./game.js"
const SOC = CONST.SOCKET_EVENTS

export default class SocketManager {
  #game; #socket;

  /** @param {Game} game  */
  constructor(game, socket) {
    this.#socket = socket
    socket.emit(SOC.PLAYER_ONLINE)

    /** @event State-Change */
    socket.on(SOC.STATE_CHANGE, (state, active_pid) => game.updateStateChangeSoc(state, active_pid))

    /** @event Set-Timer */
    socket.on(SOC.SET_TIMER, (t, pid) => game.setTimerSoc(t, pid))

    /** @event Initial-Setup-Request */
    socket.on(SOC.INITIAL_SETUP, (active_pid, turn) => game.requestInitialSetupSoc(active_pid, turn))

    /** @event Build */
    socket.on(SOC.BUILD, (pid, piece, loc) => game.updateBuildSoc(pid, piece, loc))

    /** @event PRIVATE?--Update-Player-Info */
    socket.on(SOC.UPDATE_PLAYER, (update_player, key, context) => { game.updatePlayerSoc(update_player, key, context) })

    /** @event Show-Dice-Value */
    socket.on(SOC.DICE_VALUE, (dice_val, pid) => game.updateDiceValueSoc(dice_val, pid))

    /** @event PRIVATE--Total-Resources-Received */
    socket.on(SOC.RES_RECEIVED, res_obj => game.updateTotalResReceivedInfoSoc(res_obj))

    /** @event Development-Card-Taken */
    socket.on(SOC.DEV_CARD_TAKEN, (pid, count, card) => game.updateDevCardTakenSoc(pid, count, card))

    /** @event PRIVATE--Robber-Drop-Done */
    socket.on(SOC.ROBBER_DROP, () => game.updateRobberDroppedSoc())

    /** @event Robber-Moved */
    socket.on(SOC.ROBBER_MOVE, (active_pid, id) => game.updateRobberMovementSoc(active_pid, id))

    /** @event Notify-Stolen-Info */
    socket.on(SOC.STOLEN_INFO, (p1_id, p2_id, res) => game.updateStoleInfoSoc(p1_id, p2_id, res))

    /** @event Notify-Traded-Info */
    socket.on(SOC.TRADED_INFO, (p1_id, given, taken, p2_id) => game.updateTradedInfoSoc(p1_id, given, taken, p2_id))

    /** @event Player-Trade-Request */
    socket.on(SOC.TRADE_REQ, (pid, trade_obj) => game.requestTradeSoc(pid, trade_obj))

    /** @event Update-Ongoing-Trades */
    socket.on(SOC.ONGOING_TRADES, (ongoing_trades) => game.updateOngoingTradesSoc(ongoing_trades))
  }

  sendInitialSetup({ settlement_loc, road_loc }) { this.#socket.emit(SOC.INITIAL_SETUP, settlement_loc, road_loc) }

  sendDiceClick() { this.#socket.emit(SOC.ROLL_DICE) }

  sendLocationClick(loc_type, id) { this.#socket.emit(SOC.CLICK_LOC, loc_type, id) }

  buyDevCard() { this.#socket.emit(SOC.BUY_DEV) }

  endTurn() { this.#socket.emit(SOC.END_TURN) }

  sendRobberDrop(cards) { this.#socket.emit(SOC.ROBBER_DROP, cards) }

  sendRobberMove(tile_id, stolen_pid) { this.#socket.emit(SOC.ROBBER_MOVE, tile_id, stolen_pid) }

  sendTradeRequest(type, giving, taking, counter_id) { this.#socket.emit(SOC.TRADE_REQ, type, giving, taking, counter_id) }

  sendTradeResponse(id, accepted) { this.#socket.emit(SOC.TRADE_RESP, id, accepted) }

  saveStatus(message) { this.#socket.emit(SOC.SAVE_STATUS, message) }
}
