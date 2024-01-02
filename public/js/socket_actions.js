import * as CONST from "./const.js"
import GAME_MESSAGES from "./const_messages.js"
const SOC = CONST.SOCKET_EVENTS

export default class SocketActions {
  socket; player; game; ui;
  game_config = {}

  state_actions_obj = {
    [CONST.GAME_STATES.STRATEGIZE]: _ =>
      this.playAudio(CONST.AUDIO_FILES.START_END),
    [CONST.GAME_STATES.INITIAL_BUILD]: _ => {},
  }

  constructor(socket, player, game, ui) {
    this.socket = socket
    this.player = player
    this.game = game
    this.ui = ui
    this.game_config = { player_id: player.id, game_id: game.id }
    // Notify you're online
    socket.emit(SOC.PLAYER_ONLINE, this.game_config)
    socket.on(SOC.STATE_CHANGE, state => {
      // https://www.oreilly.com/library/view/high-performance-javascript/9781449382308/ch04.html#if-else_versus_switch
      // switch (state) {
      //   case CONST.GAME_STATES.STRATEGIZE:
      //     this.playAudio(CONST.AUDIO_FILES.START_END)
      //   break
      //   case CONST.GAME_STATES.INITIAL_BUILD:
      //   break
      // }
      this.state_actions_obj[state]?.()
    })
    socket.on(SOC.SET_TIMER, t => ui.setTimer(t))
    socket.on(SOC.ALERT_ALL, (alert_player, msg_key, ...data) => {
      ui.alert(this.getMessage(alert_player.id, player, msg_key, ...data))
    })
    socket.on(SOC.ALERT_PLAYER, (alert_player, msg_key, ...data) => {
      const msg = this.getMessage(alert_player.id, player, msg_key, ...data)
      alert_player.id === player.id ? ui.alert(msg) : ui.setStatus(msg)
    })
    socket.on(SOC.STATUS_ONLY, (alert_player, msg_key, ...data) => {
      ui.setStatus(this.getMessage(alert_player.id, player, msg_key, ...data))
    })
    socket.on(SOC.SHOW_LOCS, locations => {
      locations.corners && ui.showCorners(locations.corners)
      locations.edges && ui.showEdges(locations.edges)
    })
    socket.on(SOC.HIDE_LOCS, locations => {
      ui.hideAllShown()
    })
    socket.on(SOC.BUILD, obj => {
      ui.build(obj)
      // game.build(obj)
    })
    socket.on(SOC.UPDATE_VP)
  }

  getMessage(alert_player_id, player, msg_key, ...data) {
    if (alert_player_id === player.id)
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

  sendLocationClick(loc_type, id) {
    this.socket.emit(SOC.CLICK_LOC, this.game_config, loc_type, id)
  }
}
