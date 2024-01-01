import * as CONST from "../public/js/const.js"
import GAME_MESSAGES from "../public/js/const_messages.js"
import * as Helper from "../shuffler/helper.js"
import Player from "./player.js"
import Board from "../public/js/board.js"

const ST = CONST.GAME_STATES
const SOC = CONST.SOCKET_EVENTS
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
  ready_players = {}
  player_count = 2
  config = CONST.GAME_CONFIG
  dev_cards = Helper.shuffle(CONST.DEVELOPMENT_CARDS_DECK.slice())
  #active_player = 0
  /** @todo Map Shuffler */
  // https://alexbeals.com/projects/catan/?game=GqpQiMyykZIHp26cUs8sSnNiDIA
  mapkey = `S(br-S2).S.S(bl-B2).S
      -S.M5.J10.J8.S(bl-*3)
      -S(r-O2).J2.C9.G11.C4.S
      -S.G6.D.D.F3.F11.S(l-W2)
      +S(r-L2).F3.G5.C6.M12.S
      +S.F8.G10.M9.S(tl-*3)
      +S(tr-*3).S.S(tl-*3).S`
  id; players; #io; #state; board;

  get state() { return this.#state }
  set state(s) { this.emit(SOC.STATE_CHANGE, s); this.#state = s }
  get active_player() { return this.#active_player }
  set active_player(i) { this.#active_player = i % this.player_count }

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

  start() {
    if(this.state) return
    this.board = new Board(this.mapkey)
    this.state = ST.STRATEGIZE
    const time = this.config.strategize.time
    this.emitWithPlayer(SOC.ALERT_ALL, MSG.STRATEGIZE, time)
    this.setTimer(time)
  }

  next() {
    if (this.state === ST.STRATEGIZE) {
      this.state = ST.INITIAL_BUILD
      this.emitWithPlayer(SOC.ALERT_PLAYER, MSG.INITIAL_BUILD)
    }
  }

  setTimer(time_in_seconds) {
    this.emit(SOC.SET_TIMER, time_in_seconds)
    setTimeout(this.timeOut.bind(this), time_in_seconds * 1000)
  }

  timeOut() {
    this.next()
  }

  emitWithPlayer(type, ...data) { this.emit(type, this.players[this.active_player], ...data) }
  emit(type, ...data) { this.#io.to(this.id + '').emit(type, ...data) }

  hasPlayer(id) { return id <= this.players.length }
  getPlayer(id) { return this.players[id - 1] }
  getAllPlayers() { return this.players/*.map(p => p.toJSON(false))*/ }
  getOpponentPlayers(id) {
    return this.players.filter((_, i) => i !== (id - 1))//.map(p => p.toJSON(false))
  }

  toJSON(){
    return {
      id: this.id,
      mapkey: this.mapkey,
    }
  }
}
