import { AUDIO_FILES as AUDIO } from "./const.js"

export default class AudioManager {
  #bgm; #bgm_wait;
  #muted = true
  #notif_muted = !!+localStorage.getItem('mute-notifications')
  #au_card_delay = 0

  constructor() {
    this.#bgm = new Audio('/sounds/' + AUDIO.BGM)
    this.#bgm.volume = .7
    this.#bgm.loop = true
    !this.#muted && this.#bgm.play()
  }

  play(file, volume = 1, keep_bg) {
    if (this.#notif_muted) return
    try {
      const audio = new Audio('/sounds/' + file)
      audio.volume = volume
      audio.play()
      if (!keep_bg && this.#bgm && !this.#muted) {
        this.#bgm.volume = .2
        audio.addEventListener('ended', _ => {
          clearInterval(this.#bgm_wait)
          this.#bgm_wait = setTimeout(_ => this.#bgm.volume = .7, 1000)
        })
      }
    } catch (e) {
      // console.warn(e)
    }
  }

  toggleBgm(allow) { allow ? this.#bgm?.play() : this.#bgm?.pause() }
  toggleNotifications(allow) { this.#notif_muted = !allow }

  playStart() { this.play(AUDIO.START) }
  playTurnNotification() { this.play(AUDIO.PLAYER_TURN, 1, true) }
  playBuild(piece, is_me) {
    const aud_file = ({ S: AUDIO.BUILD_SETTLEMENT, C: AUDIO.BUILD_CITY, R: AUDIO.BUILD_ROAD })[piece]
    aud_file && this.play(aud_file, is_me ? 1 : .5, true)
  }
  playCardTake(count = 1) {
    if (this.#notif_muted) return
    ;[...Array(count)].forEach(_ => {
      if (new Date - this.#au_card_delay < 200) {
        return setTimeout(_ => this.play(AUDIO.CARD, 1, true), 200)
      }
      this.#au_card_delay = new Date
      this.play(AUDIO.CARD)
    })
  }
  playDice(is_me) { this.play(AUDIO.DICE, is_me ? 1 : 0.1, true) }
  playRobber() { this.play(AUDIO.ROBBER) }
  playTradeRequest() { this.play(AUDIO.TRADE_REQUEST, 1, true) }
  playKnight() { this.play(AUDIO.KNIGHT) }
  playRoadBuilding() { this.play(AUDIO.ROAD_BUILDING) }
  playMonopoly() { this.play(AUDIO.MONOPOLY) }
  playYearOfPlenty() { this.play(AUDIO.YEAR_OF_PLENTY, .3) }
  playFail() { this.play(AUDIO.FAIL) }
  playLargestArmy() { this.play(AUDIO.LARGEST_ARMY) }
  playLongestRoad() { this.play(AUDIO.LONGEST_ROAD) }
  playGameEnd() { this.play(AUDIO.END); this.toggleBgm(false) }
  playPlayerQuit() { this.play(AUDIO.PLAYER_QUIT) }
}
