import * as CONST from "./const.js"
import GAME_MESSAGES from "./const_messages.js"
const SOC = CONST.SOCKET_EVENTS
const MSGKEY = Object.keys(GAME_MESSAGES).reduce((m, k) => (m[k] = k, m), {})

export default class SocketActions {
  socket; player; game; ui;
  #au_bop_delay = 0
  game_config = {}

  constructor(socket, player, game, ui) {
    this.socket = socket
    this.player = player
    this.game = game
    this.ui = ui
    this.game_config = { player_id: player.id, game_id: game.id }
    // Notify you're online
    socket.emit(SOC.PLAYER_ONLINE, this.game_config)
    socket.on(SOC.STATE_CHANGE, (state, active_player) => {
      ;({
        [CONST.GAME_STATES.STRATEGIZE]: _ => this.playAudio(CONST.AUDIO_FILES.START_END),
        [CONST.GAME_STATES.INITIAL_BUILD]: _ => {},
        [CONST.GAME_STATES.PLAYER_ROLL]: _ => {
          const message = this.getMessage(active_player, MSGKEY.ROLL_TURN)
          if (active_player.id === this.player.id) {
            ui.alert(message)
            this.playAudio(CONST.AUDIO_FILES.PLAYER_TURN)
          } else {
            ui.setStatus(message)
          }
        },
      })[state]?.()
    })
    socket.on(SOC.SET_TIMER, t => ui.setTimer(t))
    socket.on(SOC.ALERT_ALL, (alert_player, msg_key, ...data) => {
      ui.alert(this.getMessage(alert_player, msg_key, ...data))
    })
    socket.on(SOC.ALERT_PLAYER, (alert_player, msg_key, ...data) => {
      const msg = this.getMessage(alert_player, msg_key, ...data)
      alert_player.id === this.player.id ? ui.alert(msg) : ui.setStatus(msg)
    })
    socket.on(SOC.STATUS_ONLY, (alert_player, msg_key, ...data) => {
      ui.setStatus(this.getMessage(alert_player, msg_key, ...data))
    })
    socket.on(SOC.SHOW_LOCS, locations => {
      locations.corners && ui.showCorners(locations.corners)
      locations.edges && ui.showEdges(locations.edges)
    })
    socket.on(SOC.HIDE_LOCS, locations => {
      ui.hideAllShown()
    })
    socket.on(SOC.BUILD, obj => {
      if (obj.pid === this.player.id) {
        if (obj.piece === 'S') {
          this.playAudio(CONST.AUDIO_FILES.BUILD_SETTLEMENT)
        } else if (obj.piece === 'C') {
          this.playAudio(CONST.AUDIO_FILES.BUILD_CITY)
        } else {
          this.playAudio(CONST.AUDIO_FILES.BUILD_ROAD)
        }
      }
      ui.build(obj)
      // game.build(obj)
    })
    socket.on(SOC.UPDATE_PLAYER, (update_player, key, context) => {
      if (key === 'closed_cards' && update_player.id === this.player.id) {
        for (let i = 0; i < context.count; i++) {
          this.playAudio(CONST.AUDIO_FILES.BOP)
        }
      }
      ui.updatePlayer(update_player, key, context)
    })
  }

  getMessage(alert_player, msg_key, ...data) {
    if (alert_player.id === this.player.id)
      return GAME_MESSAGES[msg_key]?.self(...data)
    return GAME_MESSAGES[msg_key]?.other(...data, alert_player.name)
  }

  playAudio(file) {
    if (file === CONST.AUDIO_FILES.BOP) {
      if (new Date - this.#au_bop_delay < 200) {
        return setTimeout(_ => this.playAudio(file).bind(this), 200)
      }
      this.#au_bop_delay = new Date
    }
    try {
      ; (new Audio('/sounds/' + file)).play()
    } catch (e) {
      console.warn(e)
    }
  }

  sendLocationClick(loc_type, id) {
    this.socket.emit(SOC.CLICK_LOC, this.game_config, loc_type, id)
  }
}
