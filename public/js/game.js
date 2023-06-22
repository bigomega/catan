import Board from "/js/board.js"

export default class Game {
  constructor() {
    // https://alexbeals.com/projects/catan/?game=GqpQiMyykZIHp26cUs8sSnNiDIA
    this.mapkey = `S(br-S2).S.S(bl-B2).S
      -S.M5.J10.J8.S(bl-*3)
      -S(r-O2).J2.C9.G11.C4.S
      -S.G6.J4.D.F3.F11.S(l-W2)
      +S(r-L2).F3.G5.C6.M12.S
      +S.F8.G10.M9.S(tl-*3)
      +S(tr-*3).S.S(tl-*3).S`
    this.board = new Board(this.mapkey)
    this.start()
  }

  start() {
    // each turn, check player for actions (after roll)
    // 1st,2nd turn, they can place house and road free
    // if their total points == victory, End
  }

  place(player, item, location) {
    //
  }

  roll(player) {
    // roll 1 - 12
    Math.floor(Math.random() * 12) + 1
    // disribute resources to all players
  }

  end() {
    //
  }

}
