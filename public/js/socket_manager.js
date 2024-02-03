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

    /** @event PRIVATE__Update-Player-Info */
    socket.on(SOC.UPDATE_PLAYER, (update_player, key, context) => { game.updatePlayerSoc(update_player, key, context) })

    /** @event Show-Dice-Value */
    socket.on(SOC.DICE_VALUE, (dice_val, pid) => game.updateDiceValueSoc(dice_val, pid))

    /** @event PRIVATE__Total-Resources-Received */
    socket.on(SOC.RES_RECEIVED, res_obj => game.updateTotalResReceivedInfoSoc(res_obj))

    /** @event PRIVATE__Development-Card-Taken */
    socket.on(SOC.DEV_CARD_TAKEN, (pid, count, card) => game.updateDevCardTakenSoc(pid, count, card))

    /** @event PRIVATE__Robber-Drop-Done */
    socket.on(SOC.ROBBER_DROP, () => game.updateRobberDroppedSoc())

    /** @event Robber-Moved */
    socket.on(SOC.ROBBER_MOVE, (active_pid, id) => game.updateRobberMovementSoc(active_pid, id))

    /** @event PRIAVTE__Notify-Stolen-Info */
    socket.on(SOC.STOLEN_INFO, (p1_id, p2_id, res) => game.updateStoleInfoSoc(p1_id, p2_id, res))

    /** @event Notify-Traded-Info */
    socket.on(SOC.TRADED_INFO, (p1_id, given, taken, p2_id) => game.updateTradedInfoSoc(p1_id, given, taken, p2_id))

    /** @event Player-Trade-Request */
    socket.on(SOC.TRADE_REQ, (pid, trade_obj) => game.requestTradeSoc(pid, trade_obj))

    /** @event Update-Ongoing-Trades */
    socket.on(SOC.ONGOING_TRADES, ongoing_trades => game.updateOngoingTradesSoc(ongoing_trades))

    /** @event Knight-Moved-Robber */
    socket.on(SOC.KNIGHT_MOVE, pid => game.updateKnightMovedSoc(pid))

    /** @event Road-Building-Used */
    socket.on(SOC.ROAD_BUILDING, pid => game.updateRoadBuildingUsedSoc(pid))

    /** @event Monopoly-Used */
    socket.on(SOC.MONOPOLY, (pid, res, total, self_count) => game.updateMonopolyUsedSoc(pid, res, total, self_count))

    /** @event Year-of-Plenty-Used */
    socket.on(SOC.YEAR_OF_PLENTY, (pid, res_obj) => game.updateYearOfPlentyUsedSoc(pid, res_obj))

    /** @event Larget-Army */
    socket.on(SOC.LARGEST_ARMY, (pid, count) => game.updateLargestArmySoc(pid, count))

    /** @event Longest-Road */
    socket.on(SOC.LONGEST_ROAD, (pid, locs) => game.updateLongestRoadSoc(pid, locs))

    /** @event Game-End */
    socket.on(SOC.GAME_END, context => game.updateGameEndSoc(context))

    /** @event Player-Quit */
    socket.on(SOC.PLAYER_QUIT, pid => game.updatePlayerQuitSoc(pid))
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

  sendKnightMove(id, stolen_pid) { this.#socket.emit(SOC.KNIGHT_MOVE, id, stolen_pid) }

  sendRoadBuildingLocs(r1, r2) { this.#socket.emit(SOC.ROAD_BUILDING, r1, r2) }

  sendMonopolyResource(res) { this.#socket.emit(SOC.MONOPOLY, res) }

  sendYearOfPlentyResource(res1, res2) { this.#socket.emit(SOC.YEAR_OF_PLENTY, res1, res2) }

  saveStatus(message) { this.#socket.emit(SOC.SAVE_STATUS, message) }
}
