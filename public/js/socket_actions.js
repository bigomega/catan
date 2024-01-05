import * as CONST from "./const.js"
import GAME_MESSAGES from "./const_messages.js"
const SOC = CONST.SOCKET_EVENTS
const AUDIO = CONST.AUDIO_FILES
const MSGKEY = Object.keys(GAME_MESSAGES).reduce((m, k) => (m[k] = k, m), {})

export default class SocketActions {
  socket; player; game; ui;
  #au_bop_delay = 0
  game_info = {}

  constructor({ socket, player, game, ui }) {
    this.socket = socket
    this.player = player
    this.game = game
    this.ui = ui
    this.game_info = { player_id: player.id, game_id: game.id }
    // Notify you're online
    socket.emit(SOC.PLAYER_ONLINE)

    // socket.onAny((event, ...args) => {})
    socket.on(SOC.STATE_CHANGE, (state, active_player) => {
      ;({
        [CONST.GAME_STATES.INITIAL_SETUP]: _ => {
          const time = this.game.config.strategize.time
          ui.alert(GAME_MESSAGES.STRATEGIZE.self(time))
          this.playAudio(AUDIO.START_END)
        },
        // [CONST.GAME_STATES.PLAYER_ROLL]: _ => {
        //   ui.toggleActions(false)
        //   const message = this.getMessage(active_player, MSGKEY.ROLL_TURN)
        //   if (active_player.id === this.player.id) {
        //     ui.alert(message)
        //     this.playAudio(AUDIO.PLAYER_TURN)
        //     ui.toggleDice(true)
        //   } else {
        //     ui.setStatus(message)
        //   }
        // },
        // [CONST.GAME_STATES.PLAYER_ACTIONS]: _ => {
        //   if (active_player.id === this.player.id) {
        //     ui.toggleActions(true)
        //   }
        //   // ui.setStatus(this.getMessage(active_player, MSGKEY.PLAYER_TURN))
        // },
      })[state]?.()
    })

    socket.on(SOC.SET_TIMER, (t, pid) => ui.setTimer(t, pid))

    socket.on(SOC.INITIAL_SETUP, (active_player, turn) => {
      ui.hideAllShown()
      const msg_key = turn < 2 ? MSGKEY.INITIAL_BUILD : MSGKEY.INITIAL_BUILD_2
      const message = this.getMessage(active_player, msg_key)
      if (active_player.id === this.player.id) {
        ui.showInitialBuild()
        ui.alert(message)
      } else {
        ui.setStatus(message)
      }
    })

    // socket.on(SOC.ALERT_ALL, (alert_player, msg_key, ...data) => {
    //   ui.alert(this.getMessage(alert_player, msg_key, ...data))
    // })
    // socket.on(SOC.ALERT_PLAYER, (alert_player, msg_key, ...data) => {
    //   const msg = this.getMessage(alert_player, msg_key, ...data)
    //   alert_player.id === this.player.id ? ui.alert(msg) : ui.setStatus(msg)
    // })
    // socket.on(SOC.STATUS_ONLY, (alert_player, msg_key, ...data) => {
    //   ui.setStatus(this.getMessage(alert_player, msg_key, ...data))
    // })
    // socket.on(SOC.APPEND_STATUS, (alert_player, msg_key, ...data) => {
    //   console.log(this.getMessage(alert_player, msg_key, ...data));
    //   ui.appendStatus(this.getMessage(alert_player, msg_key, ...data))
    // })

    // socket.on(SOC.SHOW_LOCS, locations => {
    //   ui.hideAllShown()
    //   locations.corners && ui.showCorners(locations.corners)
    //   locations.edges && ui.showEdges(locations.edges)
    // })
    // socket.on(SOC.HIDE_LOCS, locations => {
    //   ui.hideAllShown()
    // })

    socket.on(SOC.BUILD, (player, piece, loc) => {
      if (player.pid === this.player.id) {
        const aud_file = ({
          S: AUDIO.BUILD_SETTLEMENT,
          C: AUDIO.BUILD_CITY,
          R: AUDIO.BUILD_ROAD,
        })[obj.piece]
        aud_file && this.playAudio(aud_file)
      }
      ui.build(player.id, piece, loc)
    })

    // socket.on(SOC.UPDATE_PLAYER, (update_player, key, context) => {
    //   if (key === 'closed_cards' && update_player.id === this.player.id) {
    //     for (let i = 0; i < context.count; i++) {
    //       this.playAudio(AUDIO.BOP)
    //     }
    //   }
    //   ui.updatePlayer(update_player, key, context)
    // })

    // socket.on(SOC.DICE_VALUE, (active_player, [d1, d2]) => {
    //   ui.toggleDice(false)
    //   ui.setStatus(this.getMessage(active_player, MSGKEY.ROLL_VALUE, d1, d2))
    //   if (active_player.id === this.player.id) {
    //     this.playAudio(AUDIO.DICE)
    //     ui.showDiceValue(d1, d2)
    //   } else {
    //     this.playAudio(AUDIO.DICE, 0.2)
    //   }
    // })
  }

  getMessage(alert_player, msg_key, ...data) {
    if (alert_player.id === this.player.id)
      return GAME_MESSAGES[msg_key]?.self(...data)
    return GAME_MESSAGES[msg_key]?.other(...data, alert_player.name)
  }

  playAudio(file, volume = 1) {
    if (file === AUDIO.BOP) {
      if (new Date - this.#au_bop_delay < 200) {
        return setTimeout(_ => this.playAudio(AUDIO.BOP), 200)
      }
      this.#au_bop_delay = new Date
    }
    try {
      const audio = new Audio('/sounds/' + file)
      audio.volume = volume
      audio.play()
    } catch (e) {
      // console.warn(e)
    }
  }

  sendInitialSetup({ settlement_loc, road_loc }) {
    this.socket.emit(SOC.INITIAL_SETUP, settlement_loc, road_loc)
  }

  // sendLocationClick(loc_type, id) {
  //   this.socket.emit(SOC.CLICK_LOC, this.game_info, loc_type, id)
  // }

  // sendDiceClick() {
  //   this.socket.emit(SOC.ROLL_DICE, this.game_info)
  // }

  // saveStatus(message) {
  //   this.socket.emit(SOC.SAVE_STATUS, this.game_info, message)
  // }
}
