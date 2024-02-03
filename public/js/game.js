import * as CONST from "./const.js"
import Board from "./board/board.js"
// import Opponents from "./player/opponents.js"
import Player from "./player/player.js"
import UI from "./ui/ui.js"
import SocketManager from "./socket_manager.js"
import AudioManager from "./audio_manager.js"
const ST = CONST.GAME_STATES

export default class Game {
  id; config; active_pid; state; opponents
  /** @type {UI} */ #ui;
  #board; #player; #socket_manager; #audio_manager
  #temp = {}
  possible_locations = { R: [], S: [], C: [] }

  constructor(game_obj, player_obj, opponents_obj, socket) {
    this.id = game_obj.id
    this.config = game_obj.config
    this.active_pid = game_obj.active_pid
    this.state = game_obj.state
    this.opponents = opponents_obj

    this.#board = new Board(game_obj.config.mapkey, game_obj.map_changes)
    this.#player = new Player(player_obj)
    this.#ui = new UI(this, this.#board, this.#player, opponents_obj)
    this.#socket_manager = new SocketManager(this, socket)
    this.#audio_manager = new AudioManager()

    this.#ui.render()

    // Existing Updates on Refresh
    this.#board.existing_changes.forEach(({ pid, piece, loc }) => {
      this.#board.build(pid, piece, loc)
      this.#ui.build(pid, piece, loc)
    })
    this.#ui.all_players_ui.updateActive(this.active_pid)
    this.#ui.player_ui.setDevCardCount(game_obj.dev_cards_len)
    this.#ui.player_ui.updatePiecesCount()
    game_obj.timer && this.config.timer && this.setTimerSoc(game_obj.timer, this.active_pid)
    if (game_obj.robber_loc) {
      this.#board.moveRobber(game_obj.robber_loc)
      this.#ui.moveRobber(game_obj.robber_loc)
    }
    if (game_obj.ongoing_trades.length) {
      game_obj.ongoing_trades.forEach(({ pid, ...params }) => {
        this.#ui.trade_ui.renderNewRequest(this.getPlayer(pid), { pid, ...params })
      })
    }
    // State updates
    this.updateStateChangeSoc(this.state, this.active_pid)
    if (this.state === ST.INITIAL_SETUP) {
      this.requestInitialSetupSoc(this.active_pid, game_obj.turn)
    }
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

  updateStateChangeSoc(state, active_pid) {
    this.state = state
    this.active_pid = active_pid
    this.#ui.all_players_ui.updateActive(active_pid)
    switch (state) {
      case ST.INITIAL_SETUP: this.#onInitialSetup(); break
      case ST.PLAYER_ROLL: this.#onPlayerRoll(); break
      case ST.PLAYER_ACTIONS: this.#onPlayerAction(); break
      case ST.ROBBER_DROP: this.#onRobberDropCards(); break
      case ST.ROBBER_MOVE: this.#onRobberMove(); break
    }
  }
  //#region
  // STATE - Initial Setup
  #onInitialSetup() {
    if (this.config.timer) {
      const time = this.config.strategize_time
      this.#ui.alert_ui.alertStrategy(time)
    }
    this.#audio_manager.playStart()
  }
  // STATE - Roll
  #onPlayerRoll() {
    this.#ui.toggleActions(0)
    this.#ui.hideAllShown()
    this.#ui.trade_ui.clearRequests()
    if (this.#isMyPid(this.active_pid)) {
      this.#audio_manager.playTurnNotification()
      this.config.auto_roll || this.#ui.player_ui.toggleDice(1)
      this.#ui.player_ui.toggleShow(1)
    } else {
      this.#ui.player_ui.toggleShow()
    }
    this.config.auto_roll || this.#ui.alert_ui.alertRollTurn(this.getActivePlayer())
  }
  // STATE - Player Action
  #onPlayerAction() {
    if (this.#isMyPid(this.active_pid)) {
      this.clearDevCardUsage()
      this.#ui.player_ui.toggleShow(1)
      this.#ui.toggleActions(1)
    }
  }
  // STATE - Drop for Robber
  #onRobberDropCards() {
    this.#isMyPid(this.active_pid) && this.clearDevCardUsage()
    const drop_count = this.#player.resource_count > 7 ? Math.floor(this.#player.resource_count / 2) : 0
    if (drop_count) {
      this.#ui.robberDrop(drop_count)
      this.#ui.player_ui.toggleShow()
    }
    this.#ui.alert_ui.alertRobberDrop(drop_count)
  }
  // STATE - Robber Move
  #onRobberMove(no_alert) {
    this.#ui.robber_drop_ui.hide()
    this.#ui.board_ui.toggleBlur()
    if (this.#isMyPid(this.active_pid)) {
      if (this.state === ST.ROBBER_MOVE) {
        this.clearDevCardUsage()
        this.#ui.player_ui.toggleShow()
      }
      this.#ui.showTiles(this.#board.getRobbableTiles())
    }
    no_alert || this.#ui.alert_ui.alertRobberMove(this.getActivePlayer())
  }
  //#endregion

  // SOC - Initial Setup Request
  requestInitialSetupSoc(active_pid, turn) {
    this.#ui.hideAllShown()
    this.active_pid = active_pid
    this.#ui.all_players_ui.updateActive(active_pid)
    if (this.#isMyPid(active_pid)) {
      this.#temp = {}
      this.#ui.showCorners(this.#board.getSettlementLocations(-1).map(s => s.id))
    }
    this.#ui.alert_ui.alertInitialSetup(this.getActivePlayer(), turn)
  }

  // SOC - Build Update
  updateBuildSoc(pid, piece, loc) {
    this.#audio_manager.playBuild(piece, this.#isMyPid(pid))
    this.#board.build(pid, piece, loc)
    this.#ui.build(pid, piece, loc)
    this.#isMyPid(pid) && this.#ui.player_ui.updatePiecesCount()
    this.#amIActing(pid) && this.#ui.toggleActions(1)
    this.#ui.alert_ui.alertBuild(this.getPlayer(pid), piece)
  }

  // SOC - Player Update
  updatePlayerSoc(update_player, key, context) {
    if (this.#isMyPid(update_player.id)) {
      this.#player.update(update_player)
      if (key.includes('closed_cards') && context) {
        this.#ui.player_ui.updateHand(update_player, context)
        if (key === 'closed_cards') {
          const count = Object.values(context).reduce((mem, v) => mem + v, 0)
          this.#audio_manager.playCardTake(count)
          this.#ui.animation_ui.animateResourcesTaken(context)
        }
      }
    } else {
      Object.assign(this.getPlayer(update_player.id), update_player)
    }
    this.#ui.all_players_ui.updatePlayer(update_player, key)
    this.#amIActing(update_player.id) && this.#ui.toggleActions(1)
  }

  // SOC - Dice Value Update
  updateDiceValueSoc([d1, d2], pid) {
    this.#ui.player_ui.toggleDice(false)
    this.#isMyPid(pid) && this.#ui.animation_ui.animateDiceRoll(d1, d2)
    this.#audio_manager.playDice(this.#isMyPid(pid))
    const total = d1 + d2
    total === 7 && setTimeout(_ => {
      this.#audio_manager.playRobber()
      this.#ui.board_ui.animateRobber()
    }, 1500)
    const robbed_tile = this.#board.getRobbedTile()
    const rob_tile_type = robbed_tile?.num === total && robbed_tile.type
    this.#ui.alert_ui.alertDiceValue(this.getPlayer(pid), d1, d2, CONST.TILE_RES[rob_tile_type])
  }

  // SOC_P - Total Res received
  updateTotalResReceivedInfoSoc(res_obj) { this.#ui.alert_ui.alertResTaken(res_obj) }

  // SOC - Dev Card taken
  updateDevCardTakenSoc(pid, count, card) {
    this.#ui.player_ui.setDevCardCount(count)
    this.#ui.alert_ui.alertDevCardTaken(this.getPlayer(pid), card)
  }

  // SOC_P - Update done: robber dropping cards
  updateRobberDroppedSoc() {
    this.#ui.robber_drop_ui.hide()
    this.#ui.board_ui.toggleBlur()
    this.#ui.alert_ui.alertRobberDropDone()
  }

  // SOC - Robber Movement update
  updateRobberMovementSoc(pid, id) {
    this.#board.moveRobber(id)
    this.#ui.moveRobber(id)
    const tile = this.#board.findTile(id).type
    const num = this.#board.findTile(id).num || ''
    this.#ui.alert_ui.alertRobberMoveDone(this.getPlayer(pid), tile, num)
  }

  // SOC_P - Stolen info Notification
  updateStoleInfoSoc(p1_id, p2_id, res) { this.#ui.alert_ui.alertStolenInfo(this.getPlayer(p2_id), res) }

  // SOC - Trade Success data
  updateTradedInfoSoc(p1_id, given, taken, p2_id) {
    this.#ui.alert_ui.alertTradedInfo(this.getPlayer(p1_id), p2_id && this.getPlayer(p2_id), given, taken)
  }

  // SOC - Update Ongoing Trades
  updateOngoingTradesSoc(ongoing_trades = []) {
    ongoing_trades.filter(_ => _.status !== 'deleted').forEach(obj => {
      this.#ui.trade_ui.updateOngoing(obj)
    })
  }

  // SOC - Trade Request
  requestTradeSoc(pid, trade_obj) {
    this.#ui.trade_ui.renderNewRequest(this.getPlayer(pid), trade_obj)
    this.#audio_manager.playTradeRequest()
  }

  // SOC - DEV_C - Knight moved using Dev Card
  updateKnightMovedSoc(pid) {
    this.#audio_manager.playKnight()
    this.#ui.alert_ui.alertKnightUsed()
    this.#isMyPid(pid) || this.#ui.animation_ui.animateDevelopmentCard('dK')
  }

  // SOC - DEV_C - Road Building Used
  updateRoadBuildingUsedSoc(pid) {
    this.#audio_manager.playRoadBuilding()
    this.#ui.alert_ui.alertRoadBuildingUsed(this.getPlayer(pid))
    this.#isMyPid(pid) || this.#ui.animation_ui.animateDevelopmentCard('dR')
  }

  // SOC_P - DEV_C - Monopoly Used
  updateMonopolyUsedSoc(pid, res, total, self_count) {
    total ? this.#audio_manager.playMonopoly() : this.#audio_manager.playFail()
    this.#ui.alert_ui.alertMonopolyUsed(this.getPlayer(pid), res, total, self_count)
    this.#isMyPid(pid) || this.#ui.animation_ui.animateDevelopmentCard('dM')
  }

  // SOC_P - DEV_C - Year of Plenty Used
  updateYearOfPlentyUsedSoc(pid, res_obj) {
    this.#audio_manager.playYearOfPlenty()
    this.#ui.alert_ui.alertYearOfPlentyUsed(this.getPlayer(pid), res_obj)
    this.#isMyPid(pid) || this.#ui.animation_ui.animateDevelopmentCard('dY')
  }

  // SOC - Largest Army
  updateLargestArmySoc(pid, count) {
    setTimeout(_ => {
      this.#audio_manager.playLargestArmy()
      const player = this.getPlayer(pid)
      this.#ui.alert_ui.alertLargestArmy(player, count)
      this.#ui.animation_ui.animateLargestArmy(pid, !this.#isMyPid(pid) && this.getPlayer(pid), count)
    }, 2000) // Wait for the Knight DC animation & sound
  }

  // SOC - Longest Road
  updateLongestRoadSoc(pid, locs = []) {
    setTimeout(_ => {
      this.#audio_manager.playLongestRoad()
      const player = this.getPlayer(pid)
      this.#ui.alert_ui.alertLongestRoad(player, locs.length)
      const new_locs = this.#board.addTakenCornersAlongEdgePath(locs)
      this.#ui.animation_ui.animateLongestRoad(pid, !this.#isMyPid(pid) && this.getPlayer(pid), new_locs)
    }, 500) // Wait for the road animation
  }

  // SOC - Game Ended
  updateGameEndSoc(context) {
    setTimeout(_ => {
      this.#ui.alert_ui.alertGameEnd(this.getPlayer(context.pid), context)
      this.#audio_manager.playGameEnd()
      context.longest_road && this.#ui.board_ui.showLongestEdges(this.#player.longest_road_list)
    }, 3000) // Waiting for other animations to end
  }

  // SOC - Update Player Quit
  updatePlayerQuitSoc(pid) {
    this.#audio_manager.playPlayerQuit()
    this.#ui.alert_ui.alertPlayerQuit(this.getPlayer(pid), this.state === ST.INITIAL_SETUP)
    if (this.state === ST.INITIAL_SETUP) {
      [...Array(this.config.player_count).keys()].forEach(_ => {
        this.#ui.all_players_ui.deactivatePlayer(_ + 1)
      })
    } else {
      this.#ui.all_players_ui.deactivatePlayer(pid)
    }
  }

  setTimerSoc(t, pid) { this.#ui.player_ui.resetTimer(t, this.#isMyPid(pid)) }
  //#endregion


  // ------------------
  //   USER ACTIONS
  //#region -----------

  onBoardClick(location_type, id) {
    this.#ui.hideAllShown()
    // Initial Setup
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
    // Robber & Knight
    const is_robber_move = this.state === ST.ROBBER_MOVE
    const is_knight = this.#player._is_playing_dc === 'dK'
    if (is_robber_move || is_knight) {
      if (location_type === 'T') {
        const opp_taken_corners = this.#board.findTile(id)?.getAllCorners()
          .filter(c => c.piece && !this.#isMyPid(c.player_id))
        const taken_oppponents_count = [...new Set(opp_taken_corners.map(_ => _.player_id))].length
        if (taken_oppponents_count > 1) {
          this.#temp = { _robber_tile: id }
          this.#ui.showCorners(opp_taken_corners.map(_ => _.id))
        } else {
          if (is_robber_move) { this.#socket_manager.sendRobberMove(id) }
          else if (is_knight) {
            this.#socket_manager.sendKnightMove(id)
            this.#player._is_playing_dc = false
          }
        }
      } else if (location_type === 'C') {
        const stolen_pid = this.#board.findCorner(id).player_id
        if (is_robber_move) { this.#socket_manager.sendRobberMove(this.#temp._robber_tile, stolen_pid) }
        else if (is_knight) {
          this.#socket_manager.sendKnightMove(this.#temp._robber_tile, stolen_pid)
          this.#player._is_playing_dc = false
        }
      }
      return
    }
    // Road Building DC
    if (location_type === 'E' && this.#player._is_playing_dc === 'dR') {
      if (this.#temp.r1) {
        this.clearDevCardUsage()
        this.#temp.r1 !== id && this.#socket_manager.sendRoadBuildingLocs(this.#temp.r1, id)
      } else {
        this.#temp.r1 = id
        this.#board.findEdge(id)?.buildRoad(20) // Temp pid-20 build
        this.#ui.showEdges([id, ...this.#board.getRoadLocationsFromRoads([id , ...this.#player.pieces.R])])
      }
      return
    }
    // Normal Actions
    this.#socket_manager.sendLocationClick(location_type, id)
  }

  // Road, Settlement and City building
  onPieceClick(piece, is_active) {
    this.#ui.hideAllShown()
    if (is_active) return
    const locs = this.getPossibleLocations(piece)
    piece === 'R' ? this.#ui.showEdges(locs) : this.#ui.showCorners(locs)
  }

  // During Robber & ??? Trade
  onCardClick(type) {
    if (this.state === ST.ROBBER_DROP) {
      if (this.#ui.robber_drop_ui.hasReachedGoal()) return
      if (!this.#ui.robber_drop_ui.isResourceSlotAvailable(type)) return
      if (!this.#ui.player_ui.toggleHandResource(type)) return
      this.#ui.robber_drop_ui.give(type)
    }
  }

  // Trade Proposal
  onTradeProposal(type, giving, taking, counter_id) {
    this.#socket_manager.sendTradeRequest(type, giving, taking, counter_id)
  }

  // Development Card Use
  onDevCardActivate(type) {
    if (!this.canPlayDevCard(type)) return
    this.#player._is_playing_dc = type
    switch (type) {
      case 'dK': this.#onRobberMove(true); break
      case 'dR':
        this.#temp = {}
        this.#ui.showEdges(this.#board.getRoadLocationsFromRoads(this.#player.pieces.R))
        break
      case 'dM':
      case 'dY':
        this.#ui.res_selection_ui.show(type)
    }
  }

  // Monopoly & Year of Plenty Resource Selection
  onMonopolyYearOfPlentyResSelection(type, res1, res2) {
    this.#player._is_playing_dc = false
    if (type === 'dY' && res2) {
      this.#socket_manager.sendYearOfPlentyResource(res1, res2)
    } else if (type === 'dM') {
      this.#socket_manager.sendMonopolyResource(res1)
    }
  }

  onTradeResponse(id, accepted) { this.#socket_manager.sendTradeResponse(id, accepted) }
  onGiveToRobber(cards) { this.#socket_manager.sendRobberDrop(cards) }
  onBuyDevCardClick() { this.#socket_manager.buyDevCard() }
  onDiceClick() { this.#socket_manager.sendDiceClick() }
  onEndTurn() { this.#socket_manager.endTurn() }
  //#endregion

  toggleBgm(allow) { this.#audio_manager.toggleBgm(allow) }
  toggleNotificationsAudio(allow) { this.#audio_manager.toggleNotifications(allow) }

  clearDevCardUsage() {
    if (!this.#player._is_playing_dc) return
    this.#ui.hideAllShown()
    if (this.#player._is_playing_dc === 'dR' && this.#temp.r1) {
      this.#board.findEdge(this.#temp.r1)?.buildRoad(null)
    }
    this.#player._is_playing_dc = false
  }
  canPlayDevCard(type) {
    return this.#player.can_play_dc
      && this.#player.closed_cards[type]
      && this.#player.closed_cards[type] > (this.#player.turn_bought_dc[type] || 0)
      && this.active_pid === this.#player.id
      && (this.state === ST.PLAYER_ACTIONS || this.state === ST.PLAYER_ROLL)
      && !this.#player._is_playing_dc
      && (type !== 'dR' || ((CONST.PIECES_COUNT.R - this.#player.pieces.R.length) >= 2))
  }
  playRobberAudio() { this.#audio_manager.playRobber() }
  #amIActing(pid = this.#player.id) {
    return this.#isMyPid(pid)
      && pid === this.active_pid
      && this.state === ST.PLAYER_ACTIONS
  }
  saveStatus(text) { this.#socket_manager.saveStatus(text) }
  #isMyPid(pid) { return pid === this.#player.id }

  getPlayer(pid) {
    if (this.#player.id === pid) { return this.#player }
    else { return this.opponents.find(_ => _.id === pid) }
  }
  getActivePlayer() { return this.getPlayer(this.active_pid) }
}
