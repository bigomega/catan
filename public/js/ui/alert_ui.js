import { default as MSG, getName } from "../const_messages.js"
const $ = document.querySelector.bind(document)

export default class AlertUI {
  #player; #alert_time; #alert_timer
  #onStatusUpdate; #showCard
  $alert = $('#game > .alert')
  $status_bar = document.querySelector('#game > .current-player .status-bar')

  constructor(player, alert_time = 3, { onStatusUpdate, showCard }){
    this.#player = player
    this.#onStatusUpdate = onStatusUpdate
    this.#showCard = showCard
    this.#alert_time = alert_time
  }

  render() {
    this.$status_bar.innerHTML = this.#player.last_status || '...'
    this.$alert.querySelector('.close').addEventListener('click', e => this.closeBigAlert())
    document.addEventListener('keydown', e => {
      e.code === 'Backquote' && this.closeBigAlert()
    })
  }

  closeBigAlert() {
    clearTimeout(this.#alert_timer); this.$alert.classList.remove('show', 'animate')
  }

  bigAlert(message, no_status) {
    const $alert_parchment = this.$alert.querySelector('.parchment')
    const $alert_text = this.$alert.querySelector('.text')
    this.$alert.classList.add('show')
    $alert_parchment.innerHTML = $alert_text.innerHTML = message
    clearTimeout(this.#alert_timer)
    this.#alert_timer = setTimeout(_ => this.closeBigAlert(), this.#alert_time * 1000)
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

  alertStrategy(t) { this.bigAlert(MSG.STRATEGIZE.all(t)) }
  alertInitialSetup(p, turn) {
    const msg = turn < 2 ? MSG.INITIAL_BUILD : MSG.INITIAL_BUILD_2
    if (this.#isMe(p)) this.bigAlert(msg.self())
    else this.setStatus(msg.other(p))
  }
  alertRollTurn(p) {
    if (this.#isMe(p)) {
      if (this._has_shown_roll_alert) { this.setStatus(MSG.ROLL_TURN.self()) }
      else { this._has_shown_roll_alert = true; this.bigAlert(MSG.ROLL_TURN.self()) }
    }
    else { this.setStatus(MSG.ROLL_TURN.other(p)) }
  }
  alertDiceValue(p, d1, d2, rob_res) { this.setStatus(MSG.DICE_VALUE.all(d1, d2, this.#isNotMe(p), rob_res)) }
  alertBuild(p, piece) { this.setStatus(MSG.BUILDING.all(piece, this.#isNotMe(p))) }
  alertResTaken(res) { this.appendStatus(MSG.RES_TAKEN.all(res)) }
  alertDevCardTaken(p, card) { this.setStatus(MSG.DEVELOPMENT_CARD_BUY.all(this.#isNotMe(p), card)) }
  alertRobberDrop(drop_count) {
    if (drop_count) this.bigAlert(MSG.ROBBER.self(drop_count))
    else this.appendStatus(MSG.ROBBER.other())
  }
  alertRobberDropDone() { this.setStatus(MSG.ROBBER.other()) }
  alertRobberMove(p) {
    if (this.#isMe(p)) this.bigAlert(MSG.ROBBER_MOVE.self())
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
  alertRoadBuildingUsed(p) { this.setStatus(MSG.ROAD_BUILDING_USED.all(this.#isNotMe(p))) }
  alertMonopolyUsed(p, res, total, self) { this.setStatus(MSG.MONOPOLY_USED.all(this.#isNotMe(p), res, total, self)) }
  alertYearOfPlentyUsed(p, res_obj) { this.setStatus(MSG.YEAR_OF_PLENTY_USED.all(this.#isNotMe(p), res_obj)) }
  alertLargestArmy(p, count) { this.setStatus(MSG.LARGEST_ARMY.all(this.#isNotMe(p), count)) }
  alertLongestRoad(p, len) { this.setStatus(MSG.LONGEST_ROAD.all(this.#isNotMe(p), len)) }
  alertPlayerQuit(p, end) { this.bigAlert(MSG.PLAYER_QUIT.all(p, end)) }
  alertGameEnd(p, context) {
    this.setStatus(MSG.END_STATUS.all(this.#isNotMe(p), context.vps))
    this.renderEndGameAlert(this.#isNotMe(p), context)
  }

  renderEndGameAlert(p, { pid, S, C, dVp, largest_army, longest_road }) {
    this.$alert.querySelector('.parchment').innerHTML = this.$alert.querySelector('.text').innerHTML = `
      <div class="game-ended p${pid}">
        <div class="title-emoji">🏆</div>
        <div class="player-name">🎖 ${getName(p)} Won 🎖</div>
        <small>
          ${S ? `<div class="pts S"><b>${S} VP:</b> ${S} Settlement</div>` : ''}
          ${C ? `<div class="pts C"><b>${C * 2} VP:</b> ${C} City</div>` : ''}
          ${dVp ? `<div class="pts dVp" data-type="dVp"><b>${dVp} VP:</b> ${dVp} Development Card</div>` : ''}
          ${largest_army ? `<div class="pts army" data-type="lArmy"><b>2 VP:</b> Largest Army with ${largest_army} Knights</div>` : ''}
          ${longest_road ? `<div class="pts road" data-type="lRoad"><b>2 VP:</b> Longest Road with ${longest_road} roads</div>` : ''}
        </small>
        <div class="bg"></div>
      </div>
    `
    this.$alert.classList.add('show')
    setTimeout(_ => this.$alert.classList.add('animate'), 200)
    this.$alert.querySelectorAll('.dVp, .army, .road').forEach($_ => $_.addEventListener('click', e => {
      this.#showCard(e.target.dataset.type || e.target.parentElement.dataset.type)
    }))
  }

  #isMe(p) { return p?.id === this.#player.id }
  #isNotMe(p) { return p?.id !== this.#player.id && p }
}
