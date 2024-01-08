import * as CONST from "../public/js/const.js"
const SOC = CONST.SOCKET_EVENTS

export default class IOManager {
  #game; #io;

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
    socket.on(SOC.INITIAL_SETUP, (s_loc, r_loc) => {
      game.initialBuildFromSoc(pid, s_loc, r_loc)
    })

    /** @event Roll-Dice */
    socket.on(SOC.ROLL_DICE, () => game.playerRollFromSock(pid))

    /** @event Save-Status */
    socket.on(SOC.SAVE_STATUS, html => game.saveStatusFromSoc(pid, html))

    /** @event Clicked-Location */
    socket.on(SOC.CLICK_LOC, (loc_type, id) => game.clickedLocationFromSoc(pid, loc_type, id))
  }

  updateWaitingRoom(player) { this.emit(SOC.JOINED_WAITING_ROOM, player) }

  updateState(state, active_player) { this.emit(SOC.STATE_CHANGE, state, active_player) }

  updateTimer(time, pid) { this.emit(SOC.SET_TIMER, time, pid) }

  requestInitialSetup(active_player, turn) { this.emit(SOC.INITIAL_SETUP, active_player, turn) }

  updateBuild(player, piece, loc) { this.emit(SOC.BUILD, player, piece, loc) }

  updatePublicPlayerData(p_json, key) { this.emit(SOC.UPDATE_PLAYER, p_json, key) }
  updatePrivatePlayerData(player_socket_id, p_json, key, data) {
    this.#io.to(player_socket_id).emit(SOC.UPDATE_PLAYER, p_json, key, data)
  }

  updateDiceValue(dice_value, active_player) { this.emit(SOC.DICE_VALUE, dice_value, active_player) }

  updatePrivateResourceReceived(player_socket_id, total_resouces) {
    this.#io.to(player_socket_id).emit(SOC.RES_RECEIVED, total_resouces)
  }

  emit(type, ...data) { this.#io.to(this.#game.id).emit(type, ...data) }
}