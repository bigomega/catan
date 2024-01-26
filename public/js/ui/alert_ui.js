import GAME_MESSAGES from "../const_messages.js"
const $ = document.querySelector.bind(document)
const MSG = GAME_MESSAGES

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

  alertStrategy(t) { this.alert(MSG.STRATEGIZE.all(t)) }
  alertInitialSetup(p, turn) {
    const msg = turn < 2 ? MSG.INITIAL_BUILD : MSG.INITIAL_BUILD_2
    if (this.#isMe(p)) this.alert(msg.self())
    else this.setStatus(msg.other(p))
  }
  alertRollTurn(p) {
    if (this.#isMe(p)) {
      if (this._has_shown_roll_alert) { this.setStatus(MSG.ROLL_TURN.self()) }
      else { this._has_shown_roll_alert = true; this.alert(MSG.ROLL_TURN.self()) }
    }
    else { this.setStatus(MSG.ROLL_TURN.other(p)) }
  }
  alertDiceValue(p, d1, d2, rob_res) { this.setStatus(MSG.DICE_VALUE.all(d1, d2, this.#isNotMe(p), rob_res)) }
  alertBuild(p, piece) { this.setStatus(MSG.BUILDING.all(piece, this.#isNotMe(p))) }
  alertResTaken(res) { this.appendStatus(MSG.RES_TAKEN.all(res)) }
  alertDevCardTaken(p, card) { this.setStatus(MSG.DEVELOPMENT_CARD_BUY.all(this.#isNotMe(p), card)) }
  alertRobberDrop(drop_count) {
    if (drop_count) this.alert(MSG.ROBBER.self(drop_count))
    else this.appendStatus(MSG.ROBBER.other())
  }
  alertRobberDropDone() { this.setStatus(MSG.ROBBER.other()) }
  alertRobberMove(p) {
    if (this.#isMe(p)) this.alert(MSG.ROBBER_MOVE.self())
    else this.setStatus(MSG.ROBBER_MOVE.other(p))
  }
  alertRobberMoveDone(p, tile, num) { this.setStatus(MSG.ROBBER_MOVED_TILE.all(tile, num, this.#isNotMe(p))) }
  alertStolenInfo(p, res) { this.appendStatus(MSG.PLAYER_STOLE_RES.all(this.#isNotMe(p), res)) }
  alertTradedInfo(p1, p2, given, taken) {
    this.setStatus(MSG.PLAYER_TRADE_INFO.all({
      p1: this.#isNotMe(p1), p2: this.#isNotMe(p2), board: !p2
    }, given, taken))
  }
  alertKnightUsed() { this.appendStatus(MSG.KNIGHT_USED_APPEND.all()) }
  alertRoadBuildingUsed(p) { this.setStatus(MSG.ROAD_BUILDING_USED.all(p)) }

  // getMessage(alert_player, msg_key, ...data) {
  //   if (alert_player.id === this.#player.id)
  //     return GAME_MESSAGES[msg_key]?.self(...data)
  //   return GAME_MESSAGES[msg_key]?.other(...data, alert_player)
  // }

  #isMe(p) { return p?.id === this.#player.id }
  #isNotMe(p) { return p?.id !== this.#player.id && p }
}
