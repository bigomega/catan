import * as CONST from "../public/js/const.js"
import * as Helper from "../shuffler/helper.js"
import Player from "./player.js"
import Board from "../public/js/board/board.js"
import IOManager from "./io_manager.js"

const ST = CONST.GAME_STATES
const NEXT_STATE = {
  [ST.INITIAL_SETUP]: ST.PLAYER_ROLL,
  [ST.PLAYER_ROLL]: ST.PLAYER_ACTIONS,
  [ST.PLAYER_ACTIONS]: ST.PLAYER_ROLL,
  [ST.ROBBER]: ST.PLAYER_ACTIONS,
}

export default class Game {
  /** @type {Board} */
  board;
  id; player_count;
  #state; #timer; #io_manager;
  #active_player = 0
  config = CONST.GAME_CONFIG
  players = []; ready_players = {}; map_changes = []; expected_actions = []
  turn = 1; dice_value = 2
  mapkey = `S(br-S2).S.S(bl-B2).S\n-S.M5.J10.J8.S(bl-*3)\n-S(r-O2).J2.C9.G11.C4.S\n-S.G6.J4.D.F3.F11.S(l-W2)\n+S(r-L2).F3.G5.C6.M12.S\n+S.F8.G10.M9.S(tl-*3)\n+S(tr-*3).S.S(tl-*3).S`
  dev_cards = Helper.shuffle(CONST.DEVELOPMENT_CARDS_DECK.slice())

  get state() { return this.#state }
  set state(s) {
    this.#io_manager.updateState(s, this.getActivePlayer())
    this.#state = s
  }
  get active_player() { return this.#active_player + 1 }
  set active_player(pid) {
    if (pid < 1 || pid > this.player_count) { this.turn++ }
    this.#active_player = (pid - 1) % this.player_count
  }

  constructor({ id, player_count = 2, host_name, config, io }) {
    this.id = id
    this.config = config
    this.player_count = player_count
    this.#io_manager = new IOManager({ game: this, io, })
    this.players.push(new Player(host_name, 1, this.#onPlayerUpdate.bind(this)))
    this.expected_actions.add = (...elems) => elems.forEach(obj => {
      this.expected_actions.push(Object.assign(obj, {type: this.state, pid: this.active_player}))
    })
  }

  join(name) {
    if (this.players.length >= this.player_count) { return }
    const player = new Player(name, this.players.length+1, this.#onPlayerUpdate.bind(this))
    this.players.push(player)
    this.#io_manager.updateWaitingRoom(player)
    return player
  }

  start() {
    if (this.state) return
    this.board = new Board(this.mapkey)
    this.state = ST.INITIAL_SETUP
    this.setTimer(this.config.strategize.time)
  }

  /** State Management */
  #next() {
    this.clearTimer()
    if (!this.#resolvePendingActions()) return

    if (this.turn < 3) {
      this.expected_actions.add({ callback: this.#expectedInitialBuild.bind(this) })
      this.#io_manager.requestInitialSetup(this.getActivePlayer(), this.turn)
      this.setTimer(this.config.initial_build.time)
      return
    }

    // this.state just started
    if (this.state === ST.PLAYER_ROLL) {
      this.expected_actions.add({ callback: this.#expectedRoll.bind(this) })
      this.setTimer(this.config.roll.time)
    } else if (this.state === ST.PLAYER_ACTIONS) {
      this.expected_actions.add({
        callback: _ => (this.active_player++, this.#gotoNextState()),
      })
      this.setTimer(this.config.player_turn.time)
    } else if (this.state === ST.ROBBER) {
      this.expected_actions.add({ callback: _ => this.#gotoNextState() })
      this.setTimer(this.config.robber.time)
    }
  }

  // EXPECTATIONS & RESOLUTIONS
  // ==========================

  #resolvePendingActions() {
    let continue_next = true
    this.expected_actions.forEach(({ type, pid, callback }) => callback(pid))
    this.expected_actions.splice(0, this.expected_actions.length)
    return continue_next
  }

  #expectedInitialBuild(pid, settlement_loc, road_loc) {
    let s_id = settlement_loc, r_id = road_loc
    const valid_corners = this.board.getSettlementLocations(-1).map(s => s.id)
    if (!valid_corners.includes(s_id)) { s_id = this.#getRandom(valid_corners) }
    const valid_edges = this.board.findCorner(s_id)?.getEdges(-1).map(e => e.id)
    if (!valid_edges.includes(r_id)) { r_id = this.#getRandom(valid_edges) }
    this.build(pid, 'S', s_id)
    this.build(pid, 'R', r_id)
    if (this.turn === 1) {
      this.active_player < this.player_count ? this.active_player++ : this.turn++
    } else {
      this.#distributeCornerResources(s_id)
      if (this.active_player == 1) { this.turn++, this.#gotoNextState() }
      else { this.active_player-- }
    }
  }

  #expectedRoll(pid) {
    this.dice_value = [CONST.ROLL(), CONST.ROLL()]
    this.#io_manager.updateDiceValue(this.dice_value, this.getActivePlayer())
    const dice_total = this.dice_value[0] + this.dice_value[1]
    if (dice_total === 7) {
      this.state = ST.ROBBER
    } else {
      this.#distributeTileResources(dice_total)
      this.#gotoNextState()
    }
  }

  // ===================
  //      IO EVENTS
  // ===================
  initialBuildIO(pid, settlement_loc, road_loc) {
    const expected_index = this.expected_actions.findIndex(_ => _.type === ST.INITIAL_SETUP)
    const { pid: expected_pid, callback } = this.expected_actions[expected_index]
    if (pid && pid === expected_pid) {
      callback(pid, settlement_loc, road_loc)
      this.expected_actions.splice(expected_index, 1)
      this.#next()
    }
  }

  clickedLocationIO(pid, loc_type, id) {
    if (pid !== this.active_player) return
    if (this.state !== ST.PLAYER_ACTIONS) return
    const player = this.getActivePlayer()
    if (loc_type === CONST.LOCS.EDGE) {
      const valid_locs = this.board.getRoadLocationsFromRoads(player.pieces.R)
      if (valid_locs.includes(id) && player.canBuy('R')) {
        player.bought('R')
        this.build(pid, 'R', id)
      }
    } else if (loc_type === CONST.LOCS.CORNER) {
      const corner = this.board.findCorner(id)
      if (!corner.piece) {
        const valid_locs = this.board.getSettlementLocationsFromRoads(player.pieces.R)
        if (valid_locs.includes(id) && player.canBuy('S')) {
          player.bought('S')
          this.build(pid, 'S', id)
        }
      } else if (corner.piece === 'S') {
        if (player.pieces.S.includes(id) && player.canBuy('C')) {
          player.bought('C')
          this.build(pid, 'C', id)
        }
      }
    }
  }

  buyDevCardIO(pid) {
    if (pid !== this.active_player) return
    if (this.state !== ST.PLAYER_ACTIONS) return
    const player = this.getActivePlayer()
    player.canBuy('DEV_C') && player.bought('DEV_C', this.dev_cards.pop())
  }

  playerRollIO() { this.#next() }
  endTurnIO() { this.#next() }
  saveStatusIO(pid, text) { this.getPlayer(pid).setLastStatus(text) }

  // ===================
  //        MISC
  // ===================

  #distributeCornerResources(id) {
    const corner = this.board.findCorner(id)
    if (!corner || !corner.player_id) return
    const player = this.getPlayer(corner.player_id)
    corner.tiles.forEach(tile => {
      CONST.TILE_RES[tile.type] && player.giveCard(CONST.TILE_RES[tile.type], 1)
    })
  }

  #distributeTileResources(num) {
    const resource_by_pid = [...Array(this.player_count)].map(_ => ({}))
    this.board.distribute(num).forEach(({ pid, res, count }) => {
      const player = this.getPlayer(pid)
      if (res && count) {
        player.giveCard(res, count)
        if (resource_by_pid[pid - 1][res]) resource_by_pid[pid - 1][res] += count
        else resource_by_pid[pid - 1][res] = count
      }
    })
    resource_by_pid.forEach((res, index) => {
      this.#io_manager.updatePrivateResourceReceived(this.getPlayerSoc(index + 1), res)
    })
  }

  build(pid, piece, loc) {
    this.board.build(pid, piece, loc)
    this.getPlayer(pid)?.addPiece(loc, piece)
    this.map_changes.push({ pid, piece, loc })
    this.#io_manager.updateBuild(this.getPlayer(pid), piece, loc)
  }

  #onPlayerUpdate(pid, key, context) {
    const private_json = this.getPlayer(pid)?.toJSON(1)
    this.#io_manager.updatePublicPlayerData(this.getPlayer(pid)?.toJSON(), key)
    this.#io_manager.updatePrivatePlayerData(this.getPlayerSoc(pid), private_json, key, context)
  }

  //      HELPERS
  // =================

  setTimer(time_in_seconds) {
    this.clearTimer()
    this.#io_manager.updateTimer(time_in_seconds, this.active_player)
    this.#timer = setTimeout(this.#next.bind(this), time_in_seconds * 1000)
  }
  clearTimer() { clearTimeout(this.#timer) }

  #getRandom(list) { return list[Math.floor(Math.random() * list.length)] }
  #gotoNextState() { this.state = NEXT_STATE[this.state] }

  setSocketID(pid, sid) { this.getPlayer(pid)?.setSocket(sid) }
  removeSocketID(pid, sid) { this.getPlayer(pid)?.deleteSocket(sid) }
  setUpSocketEvents(socket, pid) {
    this.setSocketID(pid, socket.id)
    this.#io_manager.setUpEvents(socket, pid)
  }

  hasPlayer(id) { return id <= this.players.length }
  getPlayer(id) { return this.players[id - 1] }
  getOpponents(id) { return this.players.filter((_, i) => i !== (id - 1)) }
  getActivePlayer() { return this.players[this.#active_player] || this.players[0] }

  getPlayerSoc(id) { return this.getPlayer(id)?.socket_id }
  getOtherPlayerSocs(id) {
    return this.players.filter((_, i) => i !== (id - 1)).map(p => p.socket_id)
  }
  getActivePlayerSoc() { return this.getPlayerSoc(this.active_player) }
  getNonActivePlayerSocs() { return this.getOtherPlayerSocs(this.active_player) }

  toJSON() {
    const timer_left = this.#timer && Math.ceil((this.#timer._idleStart + this.#timer._idleTimeout) / 1000 - process.uptime())
    return {
      id: this.id,
      mapkey: this.mapkey,
      map_changes: this.map_changes,
      config: this.config,
      active_player: this.active_player,
      state: this.state,
      timer: timer_left > 1 ? timer_left : 0,
    }
  }
}
