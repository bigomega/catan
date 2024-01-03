import * as CONST from "../public/js/const.js"
import GAME_MESSAGES from "../public/js/const_messages.js"
import * as Helper from "../shuffler/helper.js"
import Player from "./player.js"
import Board from "../public/js/board/board.js"
import Corner from "../public/js/board/corner.js"
import Edge from "../public/js/board/edge.js"

const ST = CONST.GAME_STATES
const SOC = CONST.SOCKET_EVENTS
// Keys of GAME_MESSAGES
const MSG = Object.keys(GAME_MESSAGES).reduce((m,k) => (m[k]=k,m), {})
/**
 * -------
 * RULES
 * -------
 *
 * Max - 5 settlements, 4 cities, and 15 roads.
 *
 * You may only play 1 development card during your turn— either 1 knight card or 1 progress card. You can play the card at any time, even before you roll the dice. You may not, however, play a card that you bought during the same turn.
 *
 * Yes. You can build the settlement in the middle of an opponent's road (as long as your   own road connects to it and there is at least one gap before any other existing settlements).
 *
 * Yes. It does affect the longest road: the road stops at the settlement for counting purposes, and starts again at the other side.
 *
 * Yes. Both players who possess roads into an intersection have the option of building the third road out, regardless of whether a settlement is there or whose it is.
 */

export default class Game {
  #io; #state; #timer; board; id; players;
  #active_player = 0
  ready_players = {}
  player_count = 2
  config = CONST.GAME_CONFIG
  dev_cards = Helper.shuffle(CONST.DEVELOPMENT_CARDS_DECK.slice())
  expected_actions = []
  map_changes = Object.values(CONST.LOCS).reduce((mem, k) => (mem[k] = {}, mem), {})
  /** @todo Map Shuffler */
  // https://alexbeals.com/projects/catan/?game=GqpQiMyykZIHp26cUs8sSnNiDIA
  mapkey = `S(br-S2).S.S(bl-B2).S
      -S.M5.J10.J8.S(bl-*3)
      -S(r-O2).J2.C9.G11.C4.S
      -S.G6.J4.D.F3.F11.S(l-W2)
      +S(r-L2).F3.G5.C6.M12.S
      +S.F8.G10.M9.S(tl-*3)
      +S(tr-*3).S.S(tl-*3).S`

  get state() { return this.#state }
  set state(s) {
    this.emit(SOC.STATE_CHANGE, s, this.getActivePlayer())
    this.#state = s
  }
  get active_player() { return this.#active_player + 1 }
  set active_player(pid) { this.#active_player = (pid - 1) % this.player_count }

  constructor({ id, player_count, host_name, config, io }) {
    this.id = id
    if (player_count) this.player_count = player_count
    this.players = [ new Player(host_name, 1, this.onPlayerUpdate.bind(this)) ]
    this.config = config
    this.#io = io
  }

  join(playerName) {
    if (this.players.length >= this.player_count) { return }
    const player = new Player(playerName, this.players.length + 1, this.onPlayerUpdate.bind(this))
    this.players.push(player)
    this.emit(SOC.JOINED_WAITING_ROOM, player.toJSON(0))
    return player
  }

  setSocketID(pid, sid) {
    this.getPlayer(pid) && this.getPlayer(pid).setSocket(sid)
  }
  removeSocketID(pid, sid) {
    if (sid === this.getPlayer(pid)?.socket_id)
      this.getPlayer(pid).deleteSocket()
  }

  start() {
    if (this.state) return
    this.board = new Board(this.mapkey)
    this.state = ST.STRATEGIZE
    const time = this.config.strategize.time
    this.emitWithPlayer(SOC.ALERT_ALL, MSG.STRATEGIZE, time)
    this.setTimer(time)
  }

  next() {
    this.clearTimer()
    const abort_from_resolve = this.resolveActions()
    if (abort_from_resolve) return
    if (this.state === ST.STRATEGIZE) {
      this.state = ST.INITIAL_BUILD
      this._showInitialSettlement()
    } else if (this.state === ST.INITIAL_BUILD) {
      if (this.active_player === this.player_count) {
        this.state = ST.INITIAL_BUILD_2
      } else {
        this.active_player++
      }
      this._showInitialSettlement()
    } else if (this.state === ST.INITIAL_BUILD_2) {
      if (this.active_player === 1) {
        this.state = ST.PLAYER_ROLL
        this.setTimer(this.config.roll.time)
      } else {
        this.active_player--
        this._showInitialSettlement()
      }
    }
  }

  resolveActions() {
    let abort_next_execution = false
    const future_fns = []
    this.expected_actions.forEach(expected => {
      const from = expected.from || []
      const location = from[Math.floor(Math.random() * from.length)]
      if (expected.type === CONST.LOCS.CORNER) {
        this.build(expected.pid, expected.type, location, expected.piece)
        this.state === ST.INITIAL_BUILD_2 && this.distributeResources({ c_id: location })
        if (this.state === ST.INITIAL_BUILD || this.state === ST.INITIAL_BUILD_2) {
          future_fns.push(_ => this._showInitialRoad(expected.pid, location))
          abort_next_execution = true
        }
      } else if (expected.type === CONST.LOCS.EDGE) {
        this.build(expected.pid, expected.type, location, expected.piece)
      }
    })
    this.expected_actions = []
    // This is to avoid expected_actions being modified before reset
    future_fns.forEach(fn => fn())
    return abort_next_execution
  }

  onLocationClick(pid, type, loc) {
    loc = +loc
    let exp_index = -1
    const expected = this.expected_actions.find((obj, i) => {
      const check = obj.type === type && obj.pid === pid
      if (check) exp_index = i
      return check
    })
    if (!expected) return
    if (!expected.from?.includes(loc)) return
    const INITIAL_BUILD = this.state === ST.INITIAL_BUILD || this.state === ST.INITIAL_BUILD_2
    if (type === CONST.LOCS.CORNER) {
      this.build(pid, type, loc, expected.piece)
      this.expected_actions.splice(exp_index, 1)
      this.state === ST.INITIAL_BUILD_2 && this.distributeResources({ c_id: loc })
      INITIAL_BUILD && this._showInitialRoad(pid, loc)
    } else if (type === CONST.LOCS.EDGE) {
      this.build(pid, type, loc)
      this.expected_actions.splice(exp_index, 1)
      INITIAL_BUILD && this.next()
    } else if (type === CONST.LOCS.TILE) {}
  }

  _showInitialSettlement() {
    const msg_key = this.state === ST.INITIAL_BUILD ? MSG.INITIAL_BUILD : MSG.INITIAL_BUILD_2
    this.emitWithPlayer(SOC.ALERT_PLAYER, msg_key)
    const c_ids = this.board.settlementLocations(-1).map(c => c.id)
    this.emitTo(this.getActivePlayerSoc(), SOC.SHOW_LOCS, { corners: c_ids })
    this.expected_actions.push({
      type: CONST.LOCS.CORNER,
      piece: 'S',
      from: c_ids,
      pid: this.active_player,
    })
    this.setTimer(this.config.initial_build.time)
  }

  _showInitialRoad(pid, c_loc) {
    const e_ids = Corner.getRefList()[c_loc]?.getEdges(-1).map(e => e.id)
    this.emitTo(this.getPlayerSoc(pid), SOC.SHOW_LOCS, { edges: e_ids })
    this.expected_actions.push({ type: CONST.LOCS.EDGE, piece: 'R', from: e_ids, pid })
    this.setTimer(this.config.initial_build.time)
  }

  build(pid, type, loc, piece) {
    const player = this.getPlayer(pid)
    const p_soc = this.getPlayerSoc(pid)
    if (type === CONST.LOCS.CORNER) {
      const corner = Corner.getRefList()[loc]
      piece === 'S' ? corner?.buildSettlement(pid) : corner?.buildCity()
      player.build(loc, piece)
      this.map_changes[CONST.LOCS.CORNER][loc] = { piece, pid }
    } else if (type === CONST.LOCS.EDGE) {
      const edge = Edge.getRefList()[loc]
      edge?.buildRoad(pid)
      player.build(loc, piece)
      this.map_changes[CONST.LOCS.EDGE][loc] = pid
    }
    this.emit(SOC.BUILD, { type, pid, piece, loc })
    this.emitTo(p_soc, SOC.HIDE_LOCS)
  }

  distributeResources({number, c_id}) {
    if (number) {
      //
    } else if (c_id) {
      const corner = Corner.getRefList()[c_id]
      if (!corner || !corner.player_id) return
      const player = this.getPlayer(corner.player_id)
      corner.tiles.forEach(tile => {
        tile.type !== 'S' && player.giveCard(CONST.TILE_RES[tile.type], 1)
      })
    }
  }

  setTimer(time_in_seconds) {
    this.clearTimer()
    this.emit(SOC.SET_TIMER, time_in_seconds, this.active_player)
    this.#timer = setTimeout(this.next.bind(this), time_in_seconds * 1000)
  }
  clearTimer() { clearTimeout(this.#timer) }

  onSocEvents(soc, pid, ...data) {
    ;({
      [SOC.PLAYER_ONLINE]: _ => {
        this.ready_players[pid] = 1
        if (Object.keys(this.ready_players).length === this.player_count) {
          this.start()
        }
      },
      [SOC.CLICK_LOC]: this.onLocationClick.bind(this),
    })[soc]?.(pid, ...data)
  }

  onPlayerUpdate(pid, key, ...context) {
    const public_json = this.getPlayer(pid)?.toJSON()
    if (['closed_cards'].includes(key)) {
      const private_json = this.getPlayer(pid)?.toJSON(1)
      this.emitTo(this.getPlayerSoc(pid), SOC.UPDATE_PLAYER, private_json, key, ...context)
      this.getOtherPlayerSocs(pid).forEach(sid => {
        this.emitTo(sid, SOC.UPDATE_PLAYER, public_json, key, ...context)
      })
    } else {
      this.emit(SOC.UPDATE_PLAYER, public_json, key, ...context)
    }
  }

  emitWithPlayer(type, ...data) { this.emit(type, this.players[this.#active_player], ...data) }
  emit(type, ...data) { this.#io.to(this.id + '').emit(type, ...data) }
  emitTo(sid, type, ...data) { this.#io.to(sid).emit(type, ...data) }

  hasPlayer(id) { return id <= this.players.length }
  getPlayer(id) { return this.players[id - 1] }
  getActivePlayer() { return this.players[this.#active_player] }
  getAllPlayers() { return this.players/*.map(p => p.toJSON(false))*/ }
  getOpponentPlayers(id) {
    return this.players.filter((_, i) => i !== (id - 1))//.map(p => p.toJSON(false))
  }

  getPlayerSoc(pid) { return this.players[pid - 1]?.socket_id }
  getOtherPlayerSocs(pid) {
    return this.players.filter((_, i) => i !== (pid - 1)).map(p => p.socket_id)
  }
  getActivePlayerSoc() { return this.getPlayerSoc(this.active_player) }
  getNonActivePlayerSocs() { return this.getOtherPlayerSocs(this.active_player) }

  toJSON() {
    return {
      id: this.id,
      mapkey: this.mapkey,
      map_changes: this.map_changes,
    }
  }
}
