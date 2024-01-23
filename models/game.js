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
  [ST.ROBBER_DROP]: ST.ROBBER_MOVE,
  [ST.ROBBER_MOVE]: ST.PLAYER_ACTIONS,
}

export default class Game {
  /** @type {Board} */ board;
  id; player_count;
  #state; #timer; #io_manager;
  #active_player = 0
  config = CONST.GAME_CONFIG
  /** @type {Player[]} */ players = []
  ready_players = {}; map_changes = []; expected_actions = []; robbing_players = []
  /** @type {{ pid, giving, asking, id, status:('open'|'closed'|'success'|'failed'|'deleted'), rejected:number[] }[]} */
  ongoing_trades = []
  turn = 1; dice_value = 2
  mapkey = `S(br-S2).S.S(bl-B2).S\n-S.M5.J10.J8.S(bl-*3)\n-S(r-O2).J2.C9.G11.C4.S\n-S.G6.J4.D.F3.F11.S(l-W2)\n+S(r-L2).F3.G5.C6.M12.S\n+S.F8.G10.M9.S(tl-*3)\n+S(tr-*3).S.S(tl-*3).S`
  dev_cards = Helper.shuffle(CONST.DEVELOPMENT_CARDS_DECK.slice())

  get state() { return this.#state }
  set state(s) {
    this.#io_manager.updateState(s, this.getActivePlayer().toJSON())
    this.#state = s
  }
  get active_player() { return this.#active_player + 1 }
  set active_player(pid) {
    if (pid < 1 || pid > this.player_count) { this.turn++ }
    this.#active_player = (pid - 1) % this.player_count
  }

  constructor({ id, host_name, config, io }) {
    this.id = id
    this.config = config
    this.player_count = config.player_count
    this.#io_manager = new IOManager({ game: this, io })
    this.players.push(new Player(host_name, 1, this.#onPlayerUpdate.bind(this)))
    this.expected_actions.add = (...elems) => elems.forEach(obj => {
      this.expected_actions.push(Object.assign({ type: this.state, pid: this.active_player }, obj))
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

  // ===================
  /** State Management */
  // ===================
  #next() {
    this.clearTimer()
    this.#resolvePendingActions()

    if (this.turn < 3) {
      this.expected_actions.add({ callback: this.#expectedInitialBuild.bind(this) })
      this.#io_manager.requestInitialSetup(this.getActivePlayer().toJSON(), this.turn)
      this.setTimer(this.config.initial_build.time)
      return
    }

    // this.state just started
    switch (this.state) {
      case ST.PLAYER_ROLL:
        this.expected_actions.add({ callback: this.#expectedRoll.bind(this) })
        this.setTimer(this.config.roll.time)
        break

      case ST.PLAYER_ACTIONS:
        this.expected_actions.add({ callback: _ => {
          this.active_player++; this.#gotoNextState(); this.ongoing_trades = []
        }})
        this.setTimer(this.config.player_turn.time)
        break

      case ST.ROBBER_DROP:
        this.robbing_players = []
        this.players.forEach(pl => {
          if (pl.resource_count > 7) {
            this.expected_actions.add({
              pid: pl.id, drop_count: Math.floor(pl.resource_count / 2),
              callback: this.#expectedRobberDrop.bind(this)
            })
            this.robbing_players.push(pl.id)
          }
        })
        this.setTimer(this.config.robber.drop_time)
        break

      case ST.ROBBER_MOVE:
        this.expected_actions.add({ callback: this.#expectedRobberMove.bind(this) })
        this.setTimer(this.config.robber.move_time)
        break
    }
  }

  // EXPECTATIONS & RESOLUTIONS
  // #region ==========================

  #resolvePendingActions() {
    this.expected_actions.forEach(({ type, pid, callback, ...params }) => callback(pid, params))
    this.expected_actions.splice(0, this.expected_actions.length)
  }

  /** Initial Build */
  #expectedInitialBuild(pid, { settlement_loc, road_loc } = {}) {
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

  /** Roll Dice */
  #expectedRoll(pid) {
    this.dice_value = [CONST.ROLL(), CONST.ROLL()]
    this.#io_manager.updateDiceValue(this.dice_value, this.getActivePlayer())
    this.#io_manager.updateDiceValue(this.dice_value, this.getActivePlayer().toJSON())
    const dice_total = this.dice_value[0] + this.dice_value[1]
    if (dice_total === 7) {
      const drop = this.players.filter(p => p.resource_count > 7).length
      this.state = drop ? ST.ROBBER_DROP : ST.ROBBER_MOVE
    } else {
      this.#distributeTileResources(dice_total)
      this.#gotoNextState()
    }
  }

  /** Robber Drop Resource */
  #expectedRobberDrop(pid, { drop_count = 0, resources } = {}) {
    const player = this.getPlayer(pid)
    if (player.resource_count > 7) {
      resources && Object.entries(resources).forEach(([key, value]) => {
        try { player.takeCard(key, value); drop_count -= value
        } catch (error) { /* Couldn't take the resource */ }
      })
      drop_count > 0 && player.takeRandomResource(drop_count)
    }
    const rob_pl_index = this.robbing_players.indexOf(pid)
    rob_pl_index >= 0 && this.robbing_players.splice(rob_pl_index, 1)
    !this.robbing_players.length && this.#gotoNextState()
  }

  /** Robber Movement */
  #expectedRobberMove(pid, { tile_id, stolen_pid } = {}) {
    const valid_locs = this.board.getRobbableTiles()
    if (!valid_locs.includes(tile_id)) { tile_id = this.#getRandom(valid_locs) }
    const player = this.getPlayer(pid)
    this.board.moveRobber(tile_id)
    this.#io_manager.moveRobber(player.toJSON(), tile_id)

    const opp_c_pids = this.board.findTile(tile_id)?.getAllCorners()
      .filter(c => c.piece && (c.player_id !== pid)).map(_ => _.player_id)
    ;
    if (opp_c_pids.length) {
      // Steal
      if (!opp_c_pids.includes(stolen_pid)) { stolen_pid = this.#getRandom(opp_c_pids) }
      const stolen_p = this.getPlayer(stolen_pid)
      const [stolen_res] = stolen_p.takeRandomResource()
      if (stolen_res) {
        player.giveCard(stolen_res)
        const playerJson = player.toJSON()
        this.#io_manager.updateStolen(playerJson, stolen_p)
        this.#io_manager.updateStolen_Private(this.getPlayerSoc(pid), playerJson, stolen_p, stolen_res)
        this.#io_manager.updateStolen_Private(this.getPlayerSoc(stolen_pid), playerJson, stolen_p, stolen_res)
      }
    }
    this.#gotoNextState()
  }
  //#endregion

  // ===================
  //      IO EVENTS
  //#region ===================
  /** Initial Build Locations */
  initialBuildIO(pid, settlement_loc, road_loc) {
    const expected_index = this.expected_actions.findIndex(_ => _.type === ST.INITIAL_SETUP)
    const { pid: expected_pid, callback } = this.expected_actions[expected_index]
    if (pid && pid === expected_pid) {
      callback(pid, { settlement_loc, road_loc })
      this.expected_actions.splice(expected_index, 1)
      this.#next()
    }
  }

  /** Building - Edge & Corner click (other than initial-build) */
  clickedLocationIO(pid, loc_type, id) {
    if (pid !== this.active_player) return
    if (this.state !== ST.PLAYER_ACTIONS) return
    const player = this.getActivePlayer()
    // Validate & Build
    if (loc_type === CONST.LOCS.EDGE) {
      const valid_locs = this.board.getRoadLocationsFromRoads(player.pieces.R)
      if (valid_locs.includes(id) && player.canBuy('R')) {
        player.bought('R')
        this.build(pid, 'R', id)
        this.#updateOngoingTrades(player)
      }
    } else if (loc_type === CONST.LOCS.CORNER) {
      const corner = this.board.findCorner(id)
      if (!corner.piece) {
        const valid_locs = this.board.getSettlementLocationsFromRoads(player.pieces.R)
        if (valid_locs.includes(id) && player.canBuy('S')) {
          player.bought('S')
          this.build(pid, 'S', id)
          this.#updateOngoingTrades(player)
        }
      } else if (corner.piece === 'S') {
        if (player.pieces.S.includes(id) && player.canBuy('C')) {
          player.bought('C')
          this.build(pid, 'C', id)
          this.#updateOngoingTrades(player)
        }
      }
    }
  }

  /** Development Card buying click */
  buyDevCardIO(pid) {
    if (pid !== this.active_player) return
    if (this.state !== ST.PLAYER_ACTIONS) return
    if (!this.dev_cards.length) return
    const player = this.getActivePlayer()
    if (!player.canBuy('DEV_C')) return
    player.bought('DEV_C', this.dev_cards.pop())
    this.#io_manager.updateDevCardTaken(player.toJSON(), this.dev_cards.length)
    this.#updateOngoingTrades(player)
  }

  /** Cards dropped to robber */
  robberDropIO(pid, resources) {
    if (this.state !== ST.ROBBER_DROP) return
    if (!this.robbing_players.includes(pid)) return
    const expected_index = this.expected_actions.findIndex(_ =>_.type === ST.ROBBER_DROP && _.pid === pid)
    if (expected_index < 0) return
    const { drop_count, callback } = this.expected_actions[expected_index]
    const total_given = Object.entries(resources).reduce((mem, [_, v]) => mem + v, 0)
    if (total_given < drop_count) return

    callback(pid, { drop_count, resources })
    this.expected_actions.splice(expected_index, 1)
    if (this.robbing_players.length) {
      this.#io_manager.updateRobbed_Private(this.getPlayerSoc(pid))
    } else {
      this.#next()
    }
  }

  /** Robber movement location and stolen player */
  robberMoveIO(pid, tile_id, stolen_pid) {
    if (pid !== this.active_player) return
    if (this.state !== ST.ROBBER_MOVE) return
    const expected_index = this.expected_actions.findIndex(_ => _.type === ST.ROBBER_MOVE)
    const { callback } = this.expected_actions[expected_index]
    callback(pid, { tile_id, stolen_pid })
    this.expected_actions.splice(expected_index, 1)
    this.#next()
  }

  /** Request a Trade */
  tradeRequestIO(pid, type, giving, taking, counter_id) {
    if (pid !== this.active_player) return
    if (this.state !== ST.PLAYER_ACTIONS) return
    // Reject trading the same resources
    if (Object.entries(giving).filter(([k, v]) => v && taking[k]).length) return
    const player = this.getPlayer(pid)
    if (!player.hasAllResources(giving)) return
    const giving_total = Object.values(giving).reduce((m, v) => m + v, 0)
    const taking_total = Object.values(taking).reduce((m, v) => m + v, 0)
    if (!(giving && taking_total)) return
    // Notify others of the Trade Request
    if (type === 'Px') {
      const total_requests = this.ongoing_trades.filter(_ => _.pid == pid).length
      if (total_requests >= this.config.trade.max_requests) return
      const trade_obj = { pid, giving, asking: taking, id: this.ongoing_trades.length, rejected: [], status: 'open' }
      this.ongoing_trades.push(trade_obj)
      this.#io_manager.requestPlayerTrade(player.toJSON(), trade_obj)
      return
    }
    // Trade with the Board
    if (['S2','L2','B2','O2','W2'].includes(type)) {
      const res = type[0]
      if (giving[res] === (taking_total * 2) && giving_total === giving[res]) {
        this.#tradeResources(player, giving, taking)
      }
    } else if (type === '*3' || type === '*4') {
      const count = type[1]
      const non_multiples = Object.values(giving).filter(v => v%count).length
      if (!non_multiples && giving_total === (taking_total * count)) {
        this.#tradeResources(player, giving, taking)
      }
    }
  }

  /** Responding to a Trade */
  tradeResponseIO(pid, id, accepted) {
    if (this.state !== ST.PLAYER_ACTIONS) return
    if (this.ongoing_trades.length <= id) return
    const { pid: trading_pid, giving, asking } = this.ongoing_trades[id]
    if (pid !== this.active_player && trading_pid !== this.active_player ) return
    if (accepted) {
      const p1 = this.getPlayer(trading_pid)
      const p2 = this.getPlayer(pid)
      if (!p1.hasAllResources(giving)) return
      if (!p2.hasAllResources(asking)) return
      this.ongoing_trades[id].status = 'success'
      this.#tradeResources(p1, giving, asking, p2)
    } else {
      this.ongoing_trades[id].rejected.push(pid);
      if (this.ongoing_trades[id].rejected.length >= (this.player_count - 1)) {
        this.ongoing_trades[id].status = 'failed'
      }
      this.#io_manager.updateOngoingTrades(this.ongoing_trades)
    }
  }

  playerRollIO() { this.#next() }
  endTurnIO() { this.#next() }
  saveStatusIO(pid, text) { this.getPlayer(pid).setLastStatus(text) }
  //#endregion

  // ===================
  //        MISC
  //#region ===================

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
      this.#io_manager.updateResourceReceived_Private(this.getPlayerSoc(index + 1), res)
    })
  }

  build(pid, piece, loc) {
    const player = this.getPlayer(pid)
    this.board.build(pid, piece, loc)
    player?.addPiece(loc, piece)
    piece === 'S' && player?.addPort(this.board.findCorner(loc)?.trade)
    this.map_changes.push({ pid, piece, loc })
    this.#io_manager.updateBuild(player?.toJSON(), piece, loc)
  }

  #onPlayerUpdate(pid, key, context) {
    const private_json = this.getPlayer(pid)?.toJSON(1)
    this.#io_manager.updatePlayerData(this.getPlayer(pid)?.toJSON(), key)
    this.#io_manager.updatePlayerData_Private(this.getPlayerSoc(pid), private_json, key, context)
  }

  #tradeResources(p1, giving, taking, p2) {
    Object.entries(giving).forEach(([res, val]) => {
      if (val) { p1.takeCard(res, val); p2?.giveCard(res, val) }
    })
    Object.entries(taking).forEach(([res, val]) => {
      if (val) { p1.giveCard(res, val); p2?.takeCard(res, val) }
    })
    this.#io_manager.updateTradeInfo(p1.toJSON(), giving, taking, p2?.toJSON())
    this.#updateOngoingTrades(p1)
  }

  #updateOngoingTrades() {
    this.ongoing_trades.forEach(obj => {
      if (!['open', 'closed'].includes(_.status)) { return }
      obj.status = this.getPlayer(obj.pid)?.hasAllResources(obj.giving) ? 'open' : 'closed'
    })
    this.#io_manager.updateOngoingTrades(this.ongoing_trades)
  }
  //#endregion

  //      HELPERS
  //#region =================

  setTimer(time_in_seconds, fn) {
    this.clearTimer()
    this.#io_manager.updateTimer(time_in_seconds, this.active_player)
    this.#timer = setTimeout(_ => {
      fn && (typeof fn === 'function') && fn()
      this.#next()
    }, time_in_seconds * 1000)
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
      dev_cards_len: this.dev_cards.length,
      robber_loc: this.board?.robber_loc,
      ongoing_trades: this.ongoing_trades,
      timer: timer_left > 1 ? timer_left : 0,
    }
  }
  //#endregion
}
