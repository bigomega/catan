import * as CONST from "./const.js"
const AUDIO = CONST.AUDIO_FILES

export default class AudioManager {
  #au_card_delay = 0

  play(file, volume = 1) {
    if (file === AUDIO.CARD) {
      if (new Date - this.#au_card_delay < 200) {
        return setTimeout(_ => this.play(AUDIO.CARD), 200)
      }
      this.#au_card_delay = new Date
    }
    try {
      const audio = new Audio('/sounds/' + file)
      audio.volume = volume
      audio.play()
    } catch (e) {
      // console.warn(e)
    }
  }
}
