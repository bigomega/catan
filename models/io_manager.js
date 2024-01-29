import * as CONST from "../public/js/const.js"
import Game from "./game.js"
const SOC = CONST.SOCKET_EVENTS

export default class IOManager {
  /** @type {Game} */
  #game;
  #io;

  constructor({ game, io }) {
    this.#game = game
    this.#io = io
  }

  setUpEvents(socket, pid) {
    // pid works as a closure for all events
    const game = this.#game

    /** @event Player-Online */
    socket.on(SOC.PLAYER_ONLINE, _ => {
      game.ready_players[pid] = 1
      if (Object.keys(game.ready_players).length === game.player_count) {
        game.start()
      }
    })

    /** @event Initial-Setup */
    socket.on(SOC.INITIAL_SETUP, (s_loc, r_loc) => game.initialBuildIO(pid, s_loc, r_loc))

    /** @event Roll-Dice */
    socket.on(SOC.ROLL_DICE, () => game.playerRollIO(pid))

    /** @event Save-Status */
    socket.on(SOC.SAVE_STATUS, html => game.saveStatusIO(pid, html))

    /** @event Clicked-Location */
    socket.on(SOC.CLICK_LOC, (loc_type, id) => game.clickedLocationIO(pid, loc_type, id))

    /** @event Buy-Dev-Card */
    socket.on(SOC.BUY_DEV, () => game.buyDevCardIO(pid))

    /** @event End-Turn */
    socket.on(SOC.END_TURN, () => game.endTurnIO(pid))

    /** @event Robber-Drop */
    socket.on(SOC.ROBBER_DROP, cards => game.robberDropIO(pid, cards))

    /** @event Robber-Move-Steal */
    socket.on(SOC.ROBBER_MOVE, (t_id, s_pid) => game.robberMoveIO(pid, t_id, s_pid))

    /** @event Trade-Request */
    socket.on(SOC.TRADE_REQ, (type, giving, taking, counter_id) => game.tradeRequestIO(pid, type, giving, taking, counter_id))

    /** @event Trade-Response */
    socket.on(SOC.TRADE_RESP, (id, accepted) => game.tradeResponseIO(pid, id, accepted))

    /** @event Knight-Robber-Move */
    socket.on(SOC.KNIGHT_MOVE, (t_id, s_pid) => game.knightMoveIO(pid, t_id, s_pid))

    /** @event Knight-Robber-Move */
    socket.on(SOC.ROAD_BUILDING, (r1, r2) => game.roadBuildingIO(pid, r1, r2))

    /** @event Monopoly-Resource */
    socket.on(SOC.MONOPOLY, res => game.monopolyIO(pid, res))

    /** @event Year-of-Plenty-Resource */
    socket.on(SOC.YEAR_OF_PLENTY, (res1, res2) => game.yearOfPlentyIO(pid, res1, res2))
  }

  updateWaitingRoom(player) { this.emit(SOC.JOINED_WAITING_ROOM, player) }

  updateState(state, active_pid) { this.emit(SOC.STATE_CHANGE, state, active_pid) }

  updateTimer(time, pid) { this.emit(SOC.SET_TIMER, time, pid) }

  requestInitialSetup(active_pid, turn) { this.emit(SOC.INITIAL_SETUP, active_pid, turn) }

  updateBuild(pid, piece, loc) { this.emit(SOC.BUILD, pid, piece, loc) }

  updatePlayerData_Private(player_socket_id, p_json, key, data) {
    this.#io.to(player_socket_id).emit(SOC.UPDATE_PLAYER, p_json, key, data)
  }

  updateDevCardTaken_Private(player_socket_id, pid, count, card) {
    this.#io.to(player_socket_id).emit(SOC.DEV_CARD_TAKEN, pid, count, card)
  }

  updateDiceValue(dice_value, pid) { this.emit(SOC.DICE_VALUE, dice_value, pid) }

  updateResourceReceived_Private(player_socket_id, total_resouces) {
    this.#io.to(player_socket_id).emit(SOC.RES_RECEIVED, total_resouces)
  }

  updateRobbed_Private(player_socket_id) { this.#io.to(player_socket_id).emit(SOC.ROBBER_DROP) }

  moveRobber(active_pid, id) { this.emit(SOC.ROBBER_MOVE, active_pid, id) }

  updateStolen_Private(player_socket_id, p1_id, p2_id, res) {
    this.#io.to(player_socket_id).emit(SOC.STOLEN_INFO, p1_id, p2_id, res)
  }

  updateTradeInfo(p1_id, given, taken, p2_id) { this.emit(SOC.TRADED_INFO, p1_id, given, taken, p2_id) }

  requestPlayerTrade(pid, trade_obj) { this.emit(SOC.TRADE_REQ, pid, trade_obj) }

  updateOngoingTrades(ongoing_trades) { this.emit(SOC.ONGOING_TRADES, ongoing_trades) }

  updateKnightMoved(pid) { this.emit(SOC.KNIGHT_MOVE, pid) }

  updateRoadBuildingUsed(pid) { this.emit(SOC.ROAD_BUILDING, pid) }

  updateMonopolyUsed_Private(player_socket_id, pid, res, total_count, self_count) {
    this.#io.to(player_socket_id).emit(SOC.MONOPOLY, pid, res, total_count, self_count)
  }

  updateYearOfPlentyUsed_Private(player_socket_id, pid, res_obj) {
    this.#io.to(player_socket_id).emit(SOC.YEAR_OF_PLENTY, pid, res_obj)
  }

  updateLargestArmy(pid, count) { this.emit(SOC.LARGEST_ARMY, pid, count) }

  updateLongestRoad(pid, locs) { this.emit(SOC.LONGEST_ROAD, pid, locs) }

  emit(type, ...data) { this.#io.to(this.#game.id).emit(type, ...data) }
}
