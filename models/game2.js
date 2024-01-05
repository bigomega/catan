import * as CONST from "../public/js/const.js"
import GAME_MESSAGES from "../public/js/const_messages.js"
import * as Helper from "../shuffler/helper.js"
import Player from "./player.js"
import Board from "../public/js/board/board.js"
import Corner from "../public/js/board/corner.js"
import Edge from "../public/js/board/edge.js"
import SocketManager from "./socket_manager.js"

const ST = CONST.GAME_STATES
const STATE_ORDER = [ST.INITIAL_SETUP, ST.PLAYER_ROLL, ST.PLAYER_ACTIONS, ST.PLAYER_ROLL]
const SOC = CONST.SOCKET_EVENTS
const MSG = Object.keys(GAME_MESSAGES).reduce((m, k) => (m[k] = k, m), {})

export default class Game {
  board; id; player_count;
  #state; #timer; #io_manager;
  #active_player = 0
  config = CONST.GAME_CONFIG
  players = []; ready_players = {}; map_changes = []; expected_actions = []
  turn = 1; dice_value = 2
  mapkey = `S(br-S2).S.S(bl-B2).S\n-S.M5.J10.J8.S(bl-*3)\n-S(r-O2).J2.C9.G11.C4.S\n-S.G6.J4.D.F3.F11.S(l-W2)\n+S(r-L2).F3.G5.C6.M12.S\n+S.F8.G10.M9.S(tl-*3)\n+S(tr-*3).S.S(tl-*3).S`
  // dev_cards = Helper.shuffle(CONST.DEVELOPMENT_CARDS_DECK.slice())

  get state() { return this.#state }
  set state(s) {
    this.#io_manager.updateState(s, this.getActivePlayer())
    this.#state = s
  }
  get active_player() { return this.#active_player + 1 }
  set active_player(pid) {
    if (pid < 0 || pid >= this.player_count) { this.turn++ }
    this.#active_player = (pid - 1) % this.player_count
  }

  constructor({ id, player_count = 2, host_name, config, io }) {
    this.id = id
    this.config = config
    this.player_count = player_count
    this.#io_manager = new SocketManager({ game: this, io, })
    this.players.push(new Player(host_name, 1, this.#onPlayerUpdate.bind(this)))
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
    this.state = STATE_ORDER[0]
    this.setTimer(this.config.strategize.time)
  }

  #next() {
    this.clearTimer()
    if (!this.#resolvePendingActions()) return

    /**
     * > state just ended
     *
     * If turn == 1 or 2
     *    expected initial house & road
     *    notify player
     *    t1? increment player
     *    t2? decrement player
     *    set timer
     *    stop here
     *
     * goto next state
     *
     * If state is roll
     *    expect roll (send dice value, keep sum)
     *    set timer
     * Else If state is action
     *    if 7 - robber
     *    else
     *        distribute res
     *        set timer
     */

    if (this.turn < 3) {
      this.expected_actions.push({
        type: ST.INITIAL_SETUP,
        pid: this.active_player,
        callback: (pid, settlement_loc, road_loc) => {
          let s_id = settlement_loc, r_id = road_loc
          const valid_corners = this.board.getSettlementLocations(-1).map(s => s.id)
          if (!valid_corners.includes(s_id)) {
            s_id = this.getRandom(valid_corners)
          }
          const valid_edges = this.board.findCorner(s_id)?.getEdges(-1).map(e => e.id)
          if (!valid_edges.includes(r_id)) {
            r_id = this.getRandom(valid_edges)
          }
          this.build(pid, 'S', s_id)
          this.build(pid, 'R', r_id)
          // this.turn == 2 && this.#distributeCornerResources(s_id)
        },
      })
      this.#io_manager.requestInitialSetup(this.getActivePlayer(), this.turn)
      this.setTimer(this.config.initial_build.time)
      return
    }
  }

  #resolvePendingActions() {
    let continue_next = true
    this.expected_actions.forEach(({ type, pid, cb }) => {
      /**
       * call the expected function
       * if turn is 2, distribute res (can be part of the fn?)
       */
    })
    this.expected_actions = []
    return continue_next
  }

  initialBuild(pid, settlement_loc, road_loc) {
    const expected_index = this.expected_actions.findIndex(_ => _.type === ST.INITIAL_SETUP)
    const { pid: expected_pid, callback } = this.expected_actions[expected_index]
    if (pid && pid === expected_pid) {
      callback(pid, settlement_loc, road_loc)
      this.expected_actions.splice(expected_index, 1)
      this.#next()
    }
  }

  build(pid, piece, loc) {
    this.board.build(pid, piece, loc)
    this.getPlayer(pid)?.addPiece(loc, piece)
    this.map_changes.push({ pid, piece, loc })
    this.#io_manager.updateBuild(this.getPlayer(pid), piece, loc)
  }



  #onPlayerUpdate() {}

  setTimer(time_in_seconds) {
    this.clearTimer()
    this.#io_manager.updateTimer(time_in_seconds, this.active_player)
    this.#timer = setTimeout(this.#next.bind(this), time_in_seconds * 1000)
  }
  clearTimer() { clearTimeout(this.#timer) }

  setSocketID(pid, sid) { this.getPlayer(pid)?.setSocket(sid) }
  removeSocketID(pid, sid) { this.getPlayer(pid)?.deleteSocket(sid) }
  setUpSocketEvents(socket, pid) { this.#io_manager.setUpEvents(socket, pid) }

  hasPlayer(id) { return id <= this.players.length }
  getPlayer(id) { return this.players[id - 1] }
  getOpponents(id) { return this.players.filter((_, i) => i !== (id - 1)) }
  getActivePlayer() { return this.players[this.#active_player] }

  getPlayerSoc(id) { return getPlayer(id)?.socket_id }
  getOtherPlayerSocs(id) {
    return this.players.filter((_, i) => i !== (id - 1)).map(p => p.socket_id)
  }
  getActivePlayerSoc() { return this.getPlayerSoc(this.active_player) }
  getNonActivePlayerSocs() { return this.getOtherPlayerSocs(this.active_player) }

  toJSON() {
    return {
      id: this.id,
      mapkey: this.mapkey,
      map_changes: this.map_changes,
      config: this.config,
    }
  }
}
