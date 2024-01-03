import * as CONST from "../const.js"
const $ = document.querySelector.bind(document)

export default class PlayerUI {
  #socket_actions; player; timer;
  $timer;
  $el = $('#game > .current-player')
  $status_bar = this.$el.querySelector('.status-bar')

  constructor(player) { this.player = player }

  setSocketActions(sa) {
    this.#socket_actions = sa
  }

  render() {
    this.$el.classList.add('id-' + this.player.id)
    this.$el.querySelector('.actions').innerHTML = `
      <div class="timer">0:00</div>
      <div class="roll-dice disabled" title="Roll Dice (SPACE)">🎲🎲</div>
      <div class="build-road disabled" title="Build Road (R)"><div></div></div>
      <div class="build-settlement disabled" title="Build Settlement (S)">
        <img src="/images/pieces/settlement-${this.player.id}.png"/>
      </div>
      <div class="build-city disabled" title="Build City (C)">
        <img src="/images/pieces/city-${this.player.id}.png"/>
      </div>
      <div class="dev-card disabled" title="Buy Development Card (D)">
        <img src="/images/dc-back.png"/>
      </div>
      <div class="trade">Trade</div>
      <div class="end-turn" title="End Turn (E)">End Turn</div>
    `
    this.#setRefs()
  }

  #setRefs() {
    this.$timer = this.$el.querySelector('.timer')
  }

  setStatus(message) {
    this.$status_bar.innerHTML = message.replace(/<br\/?>/g, '. ')
  }

  setTimer(time_in_seconds) {
    this.timer && clearInterval(this.timer)
    time_in_seconds--
    this.timer = setInterval(_ => {
      const seconds = time_in_seconds % 60
      const minutes = Math.floor(time_in_seconds / 60)
      const time_text = minutes + ':' + ('0' + seconds).slice(-2)
      this.$timer.innerHTML = time_text
      --time_in_seconds < 0 && clearInterval(this.timer)
    }, 1000)
  }

  roll() { }

  build(location) { }

  useDevelopmentCard(type, attr) { }
}
