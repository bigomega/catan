import * as CONST from "./const.js"
const AUDIO = CONST.AUDIO_FILES

export default class AudioManager {
  #au_bop_delay = 0

  play(file, volume = 1) {
    if (file === AUDIO.BOP) {
      if (new Date - this.#au_bop_delay < 200) {
        return setTimeout(_ => this.play(AUDIO.BOP), 200)
      }
      this.#au_bop_delay = new Date
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
