import { AUDIO_FILES as AUDIO } from "./const.js"

export default class AudioManager {
  #au_card_delay = 0

  play(file, volume = 1) {
    try {
      const audio = new Audio('/sounds/' + file)
      audio.volume = volume
      audio.play()
    } catch (e) {
      // console.warn(e)
    }
  }

  playStart() { this.play(AUDIO.START) }
  playTurnNotification() { this.play(AUDIO.PLAYER_TURN) }
  playBuild(piece, is_me) {
    const aud_file = ({ S: AUDIO.BUILD_SETTLEMENT, C: AUDIO.BUILD_CITY, R: AUDIO.BUILD_ROAD })[piece]
    aud_file && this.play(aud_file, is_me ? 1 : .5)
  }
  playCardTake(count = 1) {
    ;[...Array(count)].forEach(_ => {
      if (new Date - this.#au_card_delay < 200) {
        return setTimeout(_ => this.play(AUDIO.CARD), 200)
      }
      this.#au_card_delay = new Date
      this.play(AUDIO.CARD)
    })
  }
  playDice(is_me) { this.play(AUDIO.DICE, is_me ? 1 : 0.1) }
  playRobber() { this.play(AUDIO.ROBBER) }
  playTradeRequest() { this.play(AUDIO.TRADE_REQUEST) }
  playKnight() { this.play(AUDIO.KNIGHT) }
  playRoadBuilding() { this.play(AUDIO.ROAD_BUILDING) }
  playMonopoly() { this.play(AUDIO.MONOPOLY) }
  playYearOfPlenty() { this.play(AUDIO.YEAR_OF_PLENTY, .3) }
  playFail() { this.play(AUDIO.FAIL) }
  playLargestArmy() { this.play(AUDIO.LARGEST_ARMY) }
}
