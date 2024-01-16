import GAME_MESSAGES from "../const_messages.js"
const $ = document.querySelector.bind(document)

export default class AlertUI {
  #player; #onStatusUpdate; #alert_time
  alert_timer;
  $alert = $('#game > .alert')
  $alert_parchment = $('#game > .alert .parchment')
  $alert_text = $('#game > .alert .text')
  $status_bar = document.querySelector('#game > .current-player .status-bar')

  constructor(player, onStatusUpdate, alert_time = 3){
    this.#player = player
    this.#onStatusUpdate = onStatusUpdate
    this.#alert_time = alert_time
  }

  render() {
    this.$status_bar.innerHTML = this.#player.last_status || '...'
  }

  alert(message, no_status) {
    this.$alert.classList.add('show')
    this.$alert_parchment.innerHTML = this.$alert_text.innerHTML = message
    clearTimeout(this.alert_timer)
    this.alert_timer = setTimeout(_ => {
      this.$alert.classList.remove('show')
    }, this.#alert_time * 1000)
    no_status || this.setStatus(message)
  }

  setStatus(message = '...') {
    this.$status_bar.innerHTML = message.replace(/<br\/?>/g, '. ')
    this.#onStatusUpdate(this.$status_bar.innerHTML)
  }

  appendStatus(message = '...') {
    this.$status_bar.innerHTML += message.replace(/<br\/?>/g, '. ')
    this.#onStatusUpdate(this.$status_bar.innerHTML)
  }

  getMessage(alert_player, msg_key, ...data) {
    if (alert_player.id === this.#player.id)
      return GAME_MESSAGES[msg_key]?.self(...data)
    return GAME_MESSAGES[msg_key]?.other(...data, alert_player.name)
  }
}
