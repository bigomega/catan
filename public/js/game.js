import * as CONST from "./const.js"
import Board from "./board/board.js"
// import Opponents from "./player/opponents.js"
import Player from "./player/player.js"
import UI from "./ui/ui.js"
import SocketManager from "./socket_manager.js"
import AudioManager from "./audio_manager.js"
import GAME_MESSAGES from "./const_messages.js"
const ST = CONST.GAME_STATES
const AUDIO = CONST.AUDIO_FILES
const MSGKEY = Object.keys(GAME_MESSAGES).reduce((m, k) => (m[k] = k, m), {})

export default class Game {
  id; config; mapkey; map_changes; active_player; state; dev_cards_len; timer;
  #board; #player; #ui; #socket_manager; #audio_manager
  #temp = {}
  possible_locations = { R: [], S: [], C: [] }

  constructor(game_obj, player_obj, opponents_obj, socket) {
    this.id = game_obj.id
    this.config = game_obj.config
    this.mapkey = game_obj.mapkey
    this.map_changes = game_obj.map_changes
    this.active_player = game_obj.active_player
    this.state = game_obj.state
    this.dev_cards_len = game_obj.dev_cards_len
    this.timer = game_obj.timer

    this.#board = new Board(game_obj.mapkey, game_obj.map_changes)
    this.#player = new Player(player_obj)
    this.#ui = new UI(this, this.#board, this.#player, opponents_obj)
    this.#socket_manager = new SocketManager(this, socket)
    this.#audio_manager = new AudioManager()
  }

  start() {
    this.#ui.render()
    this.#socket_manager.setUpEvents()
    this.#existingUpdates()
  }

  #existingUpdates() {
    this.#board.existing_changes.forEach(({ pid, piece, loc }) => {
      this.#board.build(pid, piece, loc)
      this.#ui.build(pid, piece, loc)
    })
    this.#ui.player_ui.setDevCardCount(this.dev_cards_len)
    this.timer && this.setTimerSoc(this.timer, this.active_player.id)
    // this.#ui.game_state = this.state
    // this.#ui.active_player_id = this.active_player
    // game_obj.robber_loc && this.#ui.moveRobber(game_obj.robber_loc)
    // // State updates
    if (this.#player.id === this.active_player) {
      switch (this.state) {
        case ST.INITIAL_SETUP: this.#ui.showInitialBuild(); break
        case ST.PLAYER_ROLL: this.#ui.player_ui.toggleDice(true); break
        case ST.PLAYER_ACTIONS: this.#ui.toggleActions(true); break
        case ST.ROBBER_DROP: break
        // case ST.ROBBER_MOVE: this.#ui.showRobberMovement(); break
      }
      this.state && this.state === ST.PLAYER_ACTIONS && this.#ui.player_ui.toggleShow(1)
    }
    // if (this.state === ST.ROBBER_DROP) {
    //   this.#player.resource_count > 7
    //     && this.#ui.robberDrop(Math.floor(this.#player.resource_count / 2))
    // }
  }


  updateAllPossibleLocations() {
    this.possible_locations.R = this.#board.getRoadLocationsFromRoads(this.#player.pieces.R)
    this.possible_locations.S = this.#board.getSettlementLocationsFromRoads(this.#player.pieces.R)
    this.possible_locations.C = this.#player.pieces.S.slice(0)
  }
  getPossibleLocations(piece) {
    if (!CONST.PIECES[piece]) return []
    return this.possible_locations[piece]
  }

  // ------------------
  //   SOCKET UPDATES
  //#region -----------

  onStateChangeSoc(state, active_player) {
    this.state = state
    this.active_player = active_player
    switch (state) {
      case CONST.GAME_STATES.INITIAL_SETUP: this.#onInitialSetup(); break
      case CONST.GAME_STATES.PLAYER_ROLL: this.#onPlayerRoll(); break
      case CONST.GAME_STATES.PLAYER_ACTIONS: this.#onPlayerAction(); break
    }
    ;({
      // [CONST.GAME_STATES.ROBBER_DROP]: _ => {
      //   const drop_count = this.#player.resource_count > 7 ? Math.floor(this.#player.resource_count / 2) : 0
      //   if (drop_count) {
      //     this.#ui.alert_ui.alert(GAME_MESSAGES.ROBBER.self(drop_count))
      //     // this.#ui.robberDrop(drop_count)
      //   } else {
      //     this.#ui.alert_ui.appendStatus(GAME_MESSAGES.ROBBER.other())
      //   }
      //   this.#ui.player_ui.toggleShow()
      // },
      // [CONST.GAME_STATES.ROBBER_MOVE]: _ => {
      //   this.#ui.hideRobberDrop()
      //   if (active_player.id === this.#player.id) {
      //     this.#ui.alert_ui.alert(GAME_MESSAGES.ROBBER_MOVE.self())
      //     this.#ui.showRobberMovement()
      //   } else {
      //     this.#ui.alert_ui.setStatus(GAME_MESSAGES.ROBBER_MOVE.other(active_player.name))
      //   }
      //   this.#ui.player_ui.toggleShow()
      // },
    })[state]?.()
  }

  // STATE - Initial Setup
  #onInitialSetup() {
    const time = this.config.strategize.time
    this.#ui.alert_ui.alert(GAME_MESSAGES.STRATEGIZE.self(time))
    this.#audio_manager.play(AUDIO.START_END)
  }

  // STATE - Roll
  #onPlayerRoll() {
    this.#ui.toggleActions(0)
    this.#ui.hideAllShown(0)
    const message = this.#ui.alert_ui.getMessage(this.active_player, MSGKEY.ROLL_TURN)
    if (this.#isMyPid(this.active_player.id)) {
      this.#ui.alert_ui.alert(message)
      this.#audio_manager.play(AUDIO.PLAYER_TURN)
      this.#ui.player_ui.toggleDice(1)
      this.#ui.player_ui.toggleShow(1)
    } else {
      this.#ui.alert_ui.setStatus(message)
      this.#ui.player_ui.toggleShow()
    }
  }

  // STATE - Player Action
  #onPlayerAction() {
    if (this.#isMyPid(this.active_player.id)) {
      this.#ui.player_ui.toggleShow(1)
      this.#ui.toggleActions(1)
    }
  }

  // Initial Setup Request
  requestInitialSetupSoc(active_player, turn) {
    this.#ui.hideAllShown()
    const msg_key = turn < 2 ? MSGKEY.INITIAL_BUILD : MSGKEY.INITIAL_BUILD_2
    const message = this.#ui.alert_ui.getMessage(active_player, msg_key)
    if (this.#isMyPid(active_player.id)) {
      this.#temp = {}
      this.#ui.showCorners(this.#board.getSettlementLocations(-1).map(s => s.id))
      this.#ui.alert_ui.alert(message)
    } else {
      this.#ui.alert_ui.setStatus(message)
    }
  }

  // Build Update
  updateBuildSoc(player, piece, loc) {
    if (this.#isMyPid(player.id)) {
      const aud_file = ({
        S: AUDIO.BUILD_SETTLEMENT,
        C: AUDIO.BUILD_CITY,
        R: AUDIO.BUILD_ROAD,
      })[piece]
      aud_file && this.#audio_manager.play(aud_file)
    }
    this.#board.build(player.id, piece, loc)
    this.#ui.build(player.id, piece, loc)
    this.#amIActing(player.id) && this.#ui.toggleActions(1)
    this.#ui.alert_ui.setStatus(this.#ui.alert_ui.getMessage(player, MSGKEY.BUILDING, piece))
  }

  // Player Update
  updatePlayerSoc(update_player, key, context) {
    // this.#ui.all_players_ui.updatePlayer(update_player, key)
    if (key.includes('closed_cards') && context && this.#isMyPid(update_player.id)) {
      this.#ui.player_ui.updateHand(update_player, context)
      if (!context.taken) {
        ;[...Array(context.count)].forEach(_ => this.#audio_manager.play(AUDIO.BOP))
      }
    }
    this.#isMyPid(update_player.id) && this.#player.update(update_player)
    this.#amIActing(update_player.id) && this.#ui.toggleActions(1)
  }

  // Dice Value Update
  updateDiceValueSoc([d1, d2], active_player) {
    this.#ui.player_ui.toggleDice(false)
    this.#ui.alert_ui.setStatus(this.#ui.alert_ui.getMessage(active_player, MSGKEY.ROLL_VALUE, d1, d2))
    if (this.#isMyPid(active_player.id)) {
      this.#audio_manager.play(AUDIO.DICE)
      this.#ui.showDiceValue(d1, d2)
    } else {
      // this.#audio_manager.play(AUDIO.DICE, 0.2)
    }
    (d1 + d2) === 7 && setTimeout(_ => this.#audio_manager.play(AUDIO.ROBBER), 1000)
  }

  // Private - Total Res received
  onTotalResReceivedInfo(res_obj) {
    this.#ui.alert_ui.appendStatus(GAME_MESSAGES.RES_TO_EMOJI.self(res_obj))
  }

  // Dev Card taken
  onDevCardTaken(active_player, count) {
    this.#ui.player_ui.setDevCardCount(count)
    this.#ui.alert_ui.setStatus(this.#ui.alert_ui.getMessage(active_player, MSGKEY.DEVELOPMENT_CARD_BUY))
  }

  setTimerSoc(t, pid) { this.#ui.player_ui.resetTimer(t, this.#isMyPid(pid)) }
  //#endregion


  // ------------------
  //   USER ACTIONS
  //#region -----------

  onBoardClick(location_type, id) {
    this.#ui.hideAllShown()
    if (this.state === ST.INITIAL_SETUP) {
      if (location_type === 'C') {
        this.#ui.showCorners([id])
        this.#temp.settlement_loc = id
        this.#ui.showEdges(this.#board.findCorner(id)?.getEdges(-1).map(e => e.id))
      } else if (location_type === 'E') {
        this.#temp.road_loc = id
        this.#socket_manager.sendInitialSetup(this.#temp)
      }
      return
    }
    if (this.state === ST.ROBBER_MOVE) {
      if (location_type === 'T') {
        const opp_taken_corners = this.#board.findTile(id)?.getAllCorners()
          .filter(c => c.piece && !this.#isMyPid(c.player_id))
        const taken_oppponents_count = [...new Set(opp_taken_corners.map(_ => _.player_id))].length
        if (taken_oppponents_count > 1) {
          this.#temp = { _robber_tile: id }
          this.#ui.showCorners(opp_taken_corners.map(_ => _.id))
        } else {
          this.#socket_manager.sendRobberMove(id)
        }
      } else if (location_type === 'C') {
        const stolen_pid = this.#board.findCorner(id).player_id
        this.#socket_manager.sendRobberMove(this.#temp._robber_tile, stolen_pid)
      }
      return
    }
    // Normal Actions
    this.#socket_manager.sendLocationClick(location_type, id)
  }

  onPieceClick(piece, is_active) {
    this.#ui.hideAllShown()
    if (is_active) return
    const locs = this.getPossibleLocations(piece)
    piece === 'R' ? this.#ui.showEdges(locs) : this.#ui.showCorners(locs)
  }

  onBuyDevCardClick() { this.#socket_manager.buyDevCard() }
  onDiceClick() { this.#socket_manager.sendDiceClick() }
  onEndTurn() { this.#socket_manager.endTurn() }
  //#endregion


  #amIActing(pid) {
    return this.#isMyPid(pid)
    && pid === this.active_player.id
    && this.state === ST.PLAYER_ACTIONS
  }
  saveStatus(text) { this.#socket_manager.saveStatus(text) }
  #isMyPid(pid) { return pid === this.#player.id }
}
