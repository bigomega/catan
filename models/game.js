class Game {
  constructor({ id, playerName } = {}) {
    this.id = id
    this.playerCount = 4
    this.players = [ new Player(playerName, 0) ]
    // https://alexbeals.com/projects/catan/?game=GqpQiMyykZIHp26cUs8sSnNiDIA
    this.mapkey = `S(br-S2).S.S(bl-B2).S
      -S.M5.J10.J8.S(bl-*3)
      -S(r-O2).J2.C9.G11.C4.S
      -S.G6.J4.D.F3.F11.S(l-W2)
      +S(r-L2).F3.G5.C6.M12.S
      +S.F8.G10.M9.S(tl-*3)
      +S(tr-*3).S.S(tl-*3).S`
  }

  join(playerName) {
    if (this.players.length >= this.playerCount) { return }
    const player = new Player(playerName, this.players.length)
    this.players.push(player)
    return player
  }

  getPlayer(id) {
    return this.players[id]
  }
  hasPlayer(id) {
    return id < this.players.length
  }

  toJSON(){
    return {
      id: this.id,
      mapkey: this.mapkey,
    }
  }
}

class Player {
  static #names = ['Farmer', 'Builder', 'Trader', 'Robber', 'Knight']
  constructor(name, id) {
    this.id = id
    this.name = name || Player.#names[this.id % Player.#names.length]
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
    }
  }
}

export default Game
