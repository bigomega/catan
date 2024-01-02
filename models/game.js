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
  #io; #state; board; id; players;
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
  set state(s) { this.emit(SOC.STATE_CHANGE, s, this.active_player); this.#state = s }
  get active_player() { return this.#active_player + 1 }
  set active_player(pid) { this.#active_player = (pid - 1) % this.player_count }

  constructor({ id, player_count, host_name, config, io }) {
    this.id = id
    if(player_count) this.player_count = player_count
    this.players = [ new Player(host_name, 1) ]
    this.config = config
    this.#io = io
  }

  join(playerName) {
    if (this.players.length >= this.player_count) { return }
    const player = new Player(playerName, this.players.length + 1)
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
    if(this.state) return
    this.board = new Board(this.mapkey)
    this.state = ST.STRATEGIZE
    const time = this.config.strategize.time
    this.emitWithPlayer(SOC.ALERT_ALL, MSG.STRATEGIZE, time)
    this.setTimer(time)
  }

  resolveActions() {}

  next() {
    if (this.state === ST.STRATEGIZE) {
      this.state = ST.INITIAL_BUILD
      this.emitWithPlayer(SOC.ALERT_PLAYER, MSG.INITIAL_BUILD)
      const c_ids = this.board.settlementLocations(-1).map(c => c.id)
      this.emitTo(this.getActivePlayerSoc(), SOC.SHOW_LOCS, { corners: c_ids })
      this.expected_actions.push({
        type: CONST.LOCS.CORNER,
        piece: 'S',
        from: c_ids,
        pid: this.active_player,
      })
    } else if (this.state === ST.INITIAL_BUILD) {
      //
    }
  }

  onLocationClick(pid, loc_type, loc) {
    loc = +loc
    let exp_index = -1
    const expected = this.expected_actions.find((obj, i) => {
      const check = obj.type === loc_type && obj.pid === pid
      if (check) exp_index = i
      return check
    })
    if(!expected) return
    if (!expected.from?.includes(loc)) return
    const player = this.getPlayer(pid)
    const p_soc = this.getPlayerSoc(pid)
    if (loc_type === CONST.LOCS.CORNER) {
      const corner = Corner.getRefList()[loc]
      corner?.buildSettlement(pid)
      player.build(loc, expected.piece)
      this.emit(SOC.BUILD, { type: CONST.LOCS.CORNER, pid, piece: expected.piece, loc })
      this.emit(SOC.UPDATE_VP, pid, player.public_vps)
      this.emitTo(p_soc, SOC.HIDE_LOCS)
      this.map_changes[CONST.LOCS.CORNER][loc] = { piece: expected.piece, pid }
      this.expected_actions.splice(exp_index, 1)
      /**
       * KINDA HACK?
       * During Initial Build, after settlement, help build a road
       */
      if(this.state === ST.INITIAL_BUILD || this.state === ST.INITIAL_BUILD_2) {
        const e_ids = corner.getEdges(-1).map(e => e.id)
        this.emitTo(p_soc, SOC.SHOW_LOCS, { edges: e_ids })
        this.expected_actions.push({ type: CONST.LOCS.EDGE, piece: 'R', from: e_ids, pid })
      }
    } else if (loc_type === CONST.LOCS.EDGE) {
      const edge = Edge.getRefList()[loc]
      edge?.buildRoad(pid)
      player.build(loc, expected.piece)
      this.emit(SOC.BUILD, { type: CONST.LOCS.EDGE, pid, piece: expected.piece, loc })
      this.emitTo(p_soc, SOC.HIDE_LOCS)
      this.map_changes[CONST.LOCS.EDGE][loc] = pid
      this.expected_actions.splice(exp_index, 1)
    } else if (loc_type === CONST.LOCS.TILE) {}
  }

  setTimer(time_in_seconds) {
    this.emit(SOC.SET_TIMER, time_in_seconds)
    setTimeout(this.timeOut.bind(this), time_in_seconds * 1000)
  }

  timeOut() {
    this.resolveActions()
    this.next()
  }

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

  emitWithPlayer(type, ...data) { this.emit(type, this.players[this.#active_player], ...data) }
  emit(type, ...data) { this.#io.to(this.id + '').emit(type, ...data) }
  emitTo(sid, type, ...data) { this.#io.to(sid).emit(type, ...data) }

  hasPlayer(id) { return id <= this.players.length }
  getPlayer(id) { return this.players[id - 1] }
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
