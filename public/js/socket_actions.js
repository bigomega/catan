import * as CONST from "./const.js"
import GAME_MESSAGES from "./const_messages.js"
import UI from "./ui.js"
const SOC = CONST.SOCKET_EVENTS
const AUDIO = CONST.AUDIO_FILES
const MSGKEY = Object.keys(GAME_MESSAGES).reduce((m, k) => (m[k] = k, m), {})

export default class SocketActions {
  socket; player; game; ui;
  #au_bop_delay = 0

  /** @param {Object} p0 @param {UI} p0.ui */
  constructor({ socket, player, game, ui }) {
    this.socket = socket
    this.player = player
    this.game = game
    this.ui = ui
    // Notify you're online
    socket.emit(SOC.PLAYER_ONLINE)

    // socket.onAny((event, ...args) => {})
    /** @event State-Change */
    socket.on(SOC.STATE_CHANGE, (state, active_player) => {
      this.ui.game_state = state
      ;({
        [CONST.GAME_STATES.INITIAL_SETUP]: _ => {
          const time = this.game.config.strategize.time
          ui.alert(GAME_MESSAGES.STRATEGIZE.self(time))
          this.playAudio(AUDIO.START_END)
        },
        [CONST.GAME_STATES.PLAYER_ROLL]: _ => {
          ui.toggleActions(0)
          ui.hideAllShown(0)
          ui.active_player_id = active_player.id
          const message = this.getMessage(active_player, MSGKEY.ROLL_TURN)
          if (active_player.id === this.player.id) {
            ui.alert(message)
            this.playAudio(AUDIO.PLAYER_TURN)
            ui.toggleDice(1)
            ui.player_ui.toggleShow(1)
          } else {
            ui.setStatus(message)
            ui.player_ui.toggleShow()
          }
        },
        [CONST.GAME_STATES.PLAYER_ACTIONS]: _ => {
          if (active_player.id === this.player.id) {
            ui.toggleActions(1)
          }
        },
        [CONST.GAME_STATES.ROBBER_DROP]: _ => {
          const drop_count = this.player.resource_count > 7 ? Math.floor(this.player.resource_count/2) : 0
          if (drop_count) {
            ui.alert(GAME_MESSAGES.ROBBER.self(drop_count))
            ui.robberDrop(drop_count)
          } else {
            ui.appendStatus(GAME_MESSAGES.ROBBER.other())
          }
        },
        [CONST.GAME_STATES.ROBBER_MOVE]: _ => {
          ui.hideRobberDrop()
          if (active_player.id === this.player.id) {
            ui.alert(GAME_MESSAGES.ROBBER_MOVE.self())
            ui.showRobberMovement()
          } else {
            ui.setStatus(GAME_MESSAGES.ROBBER_MOVE.other(active_player.name))
          }
        },
      })[state]?.()
    })

    /** @event Set-Timer */
    socket.on(SOC.SET_TIMER, (t, pid) => ui.setTimer(t, pid))

    /** @event Initial-Setup-Request */
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

    /** @event Build */
    socket.on(SOC.BUILD, (player, piece, loc) => {
      if (player.id === this.player.id) {
        const aud_file = ({
          S: AUDIO.BUILD_SETTLEMENT,
          C: AUDIO.BUILD_CITY,
          R: AUDIO.BUILD_ROAD,
        })[piece]
        aud_file && this.playAudio(aud_file)
      }
      ui.build(player.id, piece, loc)
      ui.setStatus(this.getMessage(player, MSGKEY.BUILDING, piece))
    })

    /** @event PRIVATE?--Update-Player-Info */
    socket.on(SOC.UPDATE_PLAYER, (update_player, key, context) => {
      if (context && !context.taken && key.includes('closed_cards')  && update_player.id === this.player.id) {
        ;[...Array(context.count)].forEach(_ => this.playAudio(AUDIO.BOP))
      }
      ui.updatePlayer(update_player, key, context)
    })

    /** @event Show-Dice-Value */
    socket.on(SOC.DICE_VALUE, ([d1, d2], active_player) => {
      ui.toggleDice(false)
      ui.setStatus(this.getMessage(active_player, MSGKEY.ROLL_VALUE, d1, d2))
      if (active_player.id === this.player.id) {
        this.playAudio(AUDIO.DICE)
        ui.showDiceValue(d1, d2)
      } else {
        // this.playAudio(AUDIO.DICE, 0.2)
      }
      (d1 + d2) === 7 && setTimeout(_ => this.playAudio(AUDIO.ROBBER), 1000)
    })

    /** @event PRIVATE--Total-Resources-Received */
    socket.on(SOC.RES_RECEIVED, res_obj => {
      ui.appendStatus(GAME_MESSAGES.RES_TO_EMOJI.self(res_obj))
    })

    /** @event Development-Card-Taken */
    socket.on(SOC.DEV_CARD_TAKEN, (active_player, count) => {
      ui.setDevCardCount(count)
      ui.setStatus(this.getMessage(active_player, MSGKEY.DEVELOPMENT_CARD_BUY))
    })

    /** @event PRIVATE--Robber-Drop-Done */
    socket.on(SOC.ROBBER_DROP, () => {
      ui.hideRobberDrop()
      ui.setStatus(GAME_MESSAGES.ROBBER.other())
    })

    /** @event Robber-Moved */
    socket.on(SOC.ROBBER_MOVE, (active_player, id) => {
      ui.moveRobber(id)
      const tile = ui.board.findTile(id).type
      const num = ui.board.findTile(id).num || ''
      ui.setStatus(this.getMessage(active_player, MSGKEY.ROBBER_MOVED_TILE, tile, num ))
    })

    /** @event Notify-Stolen-Info */
    socket.on(SOC.STOLEN_INFO, (p1, p2, res) => {
      if (p1.id === this.player.id) {
        res && ui.appendStatus(GAME_MESSAGES.PLAYER_STOLE_RES.self({ p2: p2.name }, res))
      } else if (p2.id === this.player.id) {
        res && ui.appendStatus(GAME_MESSAGES.PLAYER_STOLE_RES.self({ p1: p1.name }, res))
      } else {
        ui.appendStatus(GAME_MESSAGES.PLAYER_STOLE_RES.other({ p1: p1.name, p2: p2.name }))
      }
    })
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

  sendDiceClick() { this.socket.emit(SOC.ROLL_DICE) }

  sendLocationClick(loc_type, id) { this.socket.emit(SOC.CLICK_LOC, loc_type, id) }

  buyDevCard() { this.socket.emit(SOC.BUY_DEV) }

  endTurn() { this.socket.emit(SOC.END_TURN) }

  sendRobberDrop(cards) { this.socket.emit(SOC.ROBBER_DROP, cards) }

  sendRobberMove(tile_id, stolen_pid) { this.socket.emit(SOC.ROBBER_MOVE, tile_id, stolen_pid) }

  saveStatus(message) { this.socket.emit(SOC.SAVE_STATUS, message) }
}
