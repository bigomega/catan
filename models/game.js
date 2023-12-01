import * as CONST from "../public/js/const.js"
import * as Helper from "../shuffler/helper.js"
import Player from "./player.js"

const DEV_CARDS = []
DEV_CARDS.push(...[...Array(14)].map(_ => 'dK')) // 14 Knights
DEV_CARDS.push('dR', 'dR', 'dY', 'dY', 'dM', 'dM') // 2 of each power cards
DEV_CARDS.push('dL', 'dMr', 'dG', 'dC', 'dU') // 5 victory points

export default class Game {
  constructor({ id, playerName, player_count = 2 } = {}) {
    this.id = id
    this.player_count = player_count
    this.players = [ new Player(playerName, 1) ]
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
    return player
  }

  getPlayer(id) {
    return this.players[id - 1]
  }
  getAllPlayers() {
    return this.players//.map(p => p.toJSON(false))
  }
  getOpponentPlayers(id) {
    return this.players.filter((_, i) => i !== (id - 1))//.map(p => p.toJSON(false))
  }
  hasPlayer(id) {
    return id <= this.players.length
  }

  toJSON(){
    return {
      id: this.id,
      mapkey: this.mapkey,
    }
  }
}
