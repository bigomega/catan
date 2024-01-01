import * as CONST from "./const.js"
import GAME_MESSAGES from "./const_messages.js"
const { PLAYER_ONLINE, STATE_CHANGE, SET_TIMER,
  ALERT_ALL, ALERT_PLAYER, STATUS_ONLY } = CONST.SOCKET_EVENTS

export default class SocketActions {
  constructor(socket, player, game, ui) {
    // Notify you're online
    socket.emit(PLAYER_ONLINE, player.id, game.id)
    socket.on(STATE_CHANGE, state => {
      if (state === CONST.GAME_STATES.STRATEGIZE) {
        this.playAudio(CONST.AUDIO_FILES.START_END)
      }
    })
    socket.on(SET_TIMER, t => ui.setTimer(t))
    socket.on(ALERT_ALL, (active_player, msg_key, ...data) => {
      ui.alert(this.getMessage(active_player.id, msg_key, player, ...data))
    })
    socket.on(ALERT_PLAYER, (active_player, msg_key, ...data) => {
      const msg = this.getMessage(active_player.id, msg_key, player, ...data)
      active_player.id === player.id ? ui.alert(msg) : ui.setStatus(msg)
    })
    socket.on(STATUS_ONLY, (active_player, msg_key, ...data) => {
      ui.setStatus(this.getMessage(active_player.id, msg_key, player, ...data))
    })
  }

  getMessage(active_player_id, msg_key, player, ...data) {
    if (active_player_id === player.id)
      return GAME_MESSAGES[msg_key]?.self(...data)
    return GAME_MESSAGES[msg_key]?.other(...data, player.name)
  }

  playAudio(file) {
    try {
      ; (new Audio('/sounds/' + file)).play()
    } catch (e) {
      console.warn(e)
    }
  }
}
