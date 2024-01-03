import * as CONST from "../const.js"
const $ = document.querySelector.bind(document)

export default class PlayerUI {
  #socket_actions; player; timer; hand;
  $timer; $dice;
  $el = $('#game > .current-player')
  $hand = this.$el.querySelector('.hand')
  $action_bar = this.$el.querySelector('.actions')
  $status_bar = this.$el.querySelector('.status-bar')

  constructor(player) {
    this.player = player
    this.hand = this.#cleanHandData(this.player.closed_cards)
  }

  setSocketActions(sa) {
    this.#socket_actions = sa
  }

  render() {
    this.renderActionBar()
    this.renderHand()
    this.$status_bar.innerHTML = this.player.last_status || '...'
  }

  /**
   * -----------------
   *   ACTION BAR UI
   * -----------------
   */
  renderActionBar() {
    this.$el.classList.add('id-' + this.player.id)
    this.$action_bar.innerHTML = `
      <div class="timer disabled">0:00</div>
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
      <div class="end-turn disabled" title="End Turn (E)">End Turn</div>
    `
    this.#setRefs()
    this.#setupActionEvents()
  }
  #setRefs() {
    this.$timer = this.$action_bar.querySelector('.timer')
    this.$dice = this.$action_bar.querySelector('.roll-dice')
  }
  #setupActionEvents() {
    this.$dice.addEventListener('click', e => {
      if(e.target.classList.contains('disabled')) return
      this.#socket_actions.sendDiceClick()
      e.target.classList.add('disabled')
    })
  }

  toggleDice(active) {
    this.$dice.classList[active ? 'remove' : 'add']('disabled')
  }

  resetRenderTimer(pid, time_in_seconds) {
    this.timer && clearInterval(this.timer)
    this.$timer.classList[this.player.id === pid ? 'remove' : 'add']('disabled')
    time_in_seconds--
    this.timer = setInterval(_ => {
      const seconds = time_in_seconds % 60
      const minutes = Math.floor(time_in_seconds / 60)
      const time_text = minutes + ':' + ('0' + seconds).slice(-2)
      this.$timer.innerHTML = time_text
      --time_in_seconds < 0 && clearInterval(this.timer)
    }, 1000)
  }

  build(location) { }
  useDevelopmentCard(type, attr) { }

  /**
   * ------------
   *   HAND UI
   * ------------
   */

  renderHand() {
    const hand_groups = Object.keys(this.hand)
      .reduce((mem, key) => (mem.push([key, this.hand[key]]), mem), [])
      .sort((a, b) => a[0].length - b[0].length)
    ;
    const group_size = hand_groups.length
    const CURVE_TRANSLATE = [
      [0], [0,0], [10,0,20], [20,0,0,30], [30,5,0,9,40],
      [40,10,0,0,18,50], [50,15,3,0,6,27,60], [55,20,6,0,0,12,36,65],
      [55,20,6,0,-5,0,12,36,65], [55,20,6,0,-5,-5,0,12,36,65],
    ][group_size - 1]

    this.$hand.innerHTML = hand_groups.map(([type, count], i) => {
      const group_rotation = -15 + (30 / ( group_size - 1 )) * i
      const group_translate = CURVE_TRANSLATE[i]
      let group_margin = group_size < 4
        ? 50 : (group_size > 6 ? (group_size > 8 ? -50 : -30) : 0)
      return `
        <div
          class="card-group" data-type="${type}" data-count="${count}"
          style="margin-right:${group_margin}px;
            transform:rotate(${group_rotation}deg) translateY(${group_translate}px);"
        >
        ${[...Array(count)].map((_, j) => {
          const c_rot = 15 * (count - j - 1) / (count - j)
          const c_mv = 15 * (count - j - 2) / (count - j)
          return `
            <div class="card" data-type="${type}"
              style="transform:rotate(${c_rot}deg) translate(${c_mv}px, 0px);"
            ></div>
          `
        }).join('')}
        ${count > 1 ? `<div class="card-count">${count}</div>` : ''}
        </div>
      `
    }).join('')
    this.#setupHandEvents()
  }
  #setupHandEvents() {
    // this.$hand
  }

  #cleanHandData(cards_obj) {
    const clean_obj = Object.assign({}, cards_obj)
    Object.keys(clean_obj).forEach(key => {
      if (!clean_obj[key]) { delete clean_obj[key] }
    })
    return this.#combineVps(clean_obj)
  }

  #combineVps(cards_obj) {
    let vps = 0
    Object.keys(CONST.DC_VICTORY_POINTS).forEach(vp_key => {
      if (cards_obj[vp_key]) {
        vps += cards_obj[vp_key]
        delete cards_obj[vp_key]
      }
    })
    if (vps) { cards_obj.dVps = vps }
    return cards_obj
  }

  updateHand(player, { card_type, count, taken }) {
    if (!count) return
    let type = card_type
    if (card_type in CONST.DC_VICTORY_POINTS) { type = 'dVps' }
    if (taken && this.hand[type]) {
      if (this.hand[type] - count > -1) { this.hand[type] -= count }
      if (!this.hand[type]) { delete this.hand[type] }
    } else if (!taken) {
      if (this.hand[type]) { this.hand[type] += count }
      else { this.hand[type] = count }
    }
    this.renderHand()
    // this.updateHandUI()
  }

  /**
   * -----------------
   *   STATUS BAR UI
   * -----------------
   */
  setStatus(message) {
    this.$status_bar.innerHTML = message.replace(/<br\/?>/g, '. ')
    this.#socket_actions.saveStatus(this.$status_bar.innerHTML)
  }
  appendStatus(message) {
    this.$status_bar.innerHTML += message.replace(/<br\/?>/g, '. ')
    this.#socket_actions.saveStatus(this.$status_bar.innerHTML)
  }
}
