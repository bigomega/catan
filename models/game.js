import * as CONST from "../public/js/const.js"
import * as Helper from "../shuffler/helper.js"
import Player from "./player.js"

const STATES = CONST.GAME_STATES
const SOC = CONST.SOCKET_EVENTS
const DEV_CARDS = []
DEV_CARDS.push(...[...Array(14)].map(_ => 'dK')) // 14 Knights
DEV_CARDS.push('dR', 'dR', 'dY', 'dY', 'dM', 'dM') // 2 of each power cards
DEV_CARDS.push('dL', 'dMr', 'dG', 'dC', 'dU') // 5 victory points

export default class Game {
  readyPlayers = {}
  state = null
  player_turn = 0

  constructor({ id, playerName, player_count = 2, config = CONST.GAME_CONFIG, io } = {}) {
    this.id = id
    this.players = [ new Player(playerName, 1) ]
    this.player_count = player_count
    this.config = config
    this.io = io
    // https://alexbeals.com/projects/catan/?game=GqpQiMyykZIHp26cUs8sSnNiDIA
    // TODO: Map Shuffler
    this.mapkey = `S(br-S2).S.S(bl-B2).S
      -S.M5.J10.J8.S(bl-*3)
      -S(r-O2).J2.C9.G11.C4.S
      -S.G6.J4.D.F3.F11.S(l-W2)
      +S(r-L2).F3.G5.C6.M12.S
      +S.F8.G10.M9.S(tl-*3)
      +S(tr-*3).S.S(tl-*3).S`

    this.dev_cards = Helper.shuffle(DEV_CARDS.slice())
  }

  join(playerName) {
    if (this.players.length >= this.player_count) { return }
    const player = new Player(playerName, this.players.length + 1)
    this.players.push(player)
    this.notify(SOC.JOINED_WAITING_ROOM, player.toJSON(0))
    return player
  }

  start() {
    if(this.state) return
    this.state = STATES.STRATEGIZE
    this.notify(SOC.STATE_CHANGE, this.state)
    const time = this.config.strategize.time
    this.notify(SOC.ALERT, CONST.GAME_MESSAGES.strategize(time))
    this.setTimer(time)
  }

  setTimer(time_in_seconds) {
    this.notify(SOC.SET_TIMER, time_in_seconds)
    setTimeout(this.timeOut.bind(this), time_in_seconds * 1000)
  }

  timeOut() {
    if (this.state === STATES.STRATEGIZE) {
      this.state = STATES.INITIAL_BUILD
    }
  }

  notify(type, ...data) { this.io.to(this.id + '').emit(type, ...data) }

  hasPlayer(id) { return id <= this.players.length }
  getPlayer(id) { return this.players[id - 1] }
  getAllPlayers() { return this.players/*.map(p => p.toJSON(false))*/ }
  getOpponentPlayers(id) {
    return this.players.filter((_, i) => i !== (id - 1))//.map(p => p.toJSON(false))
  }

  toJSON(){
    return {
      state: this.state,
      id: this.id,
      mapkey: this.mapkey,
    }
  }
}
