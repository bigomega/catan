import * as CONST from "../const.js"
import UI from "../ui.js"
const $ = document.querySelector.bind(document)
const oKeys = Object.keys

export default class PlayerUI {
  player; timer; hand;
  $timer; $dice; $build_road; $build_settlement; $build_city; $buy_dev_card; $end_turn;
  $el = $('#game > .current-player')
  $hand = this.$el.querySelector('.hand')
  $action_bar = this.$el.querySelector('.actions')
  $status_bar = this.$el.querySelector('.status-bar')

  /** @param {UI} ui  */
  constructor(player, ui) {
    this.player = player
    this.ui = ui
    this.hand = this.#cleanHandData(this.player.closed_cards)
  }

  render() {
    this.renderActionBar()
    // this.hand.S = 8
    // this.hand.L = 7
    // this.hand.B = 6
    // this.hand.dK = 3
    // // delete this.hand.O
    // this.hand.dM = 1
    // this.hand.dR = 1
    // this.hand.dY = 1
    // this.hand.dVps = 2
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
      <div class="build-road disabled" title="Build Road (R)"></div>
      <div class="build-settlement disabled" title="Build Settlement (S)"></div>
      <div class="build-city disabled" title="Build City (C)"></div>
      <div class="dev-card disabled" title="Buy Development Card (D)">
        <img src="/images/dc-back.png"/>
      </div>
      <div class="trade disabled">Trade</div>
      <div class="end-turn disabled" title="End Turn (E)">End Turn</div>
    `
    this.#setRefs()
    this.#setupActionEvents()
  }
  #setRefs() {
    this.$timer = this.$action_bar.querySelector('.timer')
    this.$dice = this.$action_bar.querySelector('.roll-dice')
    this.$build_road = this.$action_bar.querySelector('.build-road')
    this.$build_settlement = this.$action_bar.querySelector('.build-settlement')
    this.$build_city = this.$action_bar.querySelector('.build-city')
    this.$buy_dev_card = this.$action_bar.querySelector('.dev-card')
    this.$end_turn = this.$action_bar.querySelector('.end-turn')
  }
  #setupActionEvents() {
    // Dice Click
    this.$dice.addEventListener('click', e => {
      if(e.target.classList.contains('disabled')) return
      this.ui.onDiceClick()
      e.target.classList.add('disabled')
    })
    // Road, Settlement & City Click
    const getEventCb = piece => e => {
      const classList = e.target.classList
      if (classList.contains('disabled')) return
      this.ui.onPieceClick(piece, classList.contains('active'))
      classList.toggle('active')
    }
    this.$build_road.addEventListener('click', getEventCb('R'))
    this.$build_settlement.addEventListener('click', getEventCb('S'))
    this.$build_city.addEventListener('click', getEventCb('C'))
    this.$buy_dev_card.addEventListener('click', e => {
      if (e.target.classList.contains('disabled')) return
      this.ui.onBuyDevCardClick()
    })
  }

  keyTo$El(key) {
    return ({
      R: this.$build_road, S: this.$build_settlement,
      C: this.$build_city, DEV_C: this.$buy_dev_card,
    })[key]
  }

  canIBuy(type) {
    const costs = CONST.COST[type]
    return oKeys(costs).reduce((mem, res_key) => {
      return mem && (this.hand[res_key] >= costs[res_key])
    }, true)
  }

  checkAndToggleActions(toggle) {
    this.removeActiveActions()
    if (toggle) {
      this.toggleAction(this.$end_turn, true)
      oKeys(CONST.COST).forEach(key => {
        const can_act = this.canIBuy(key)
          && (key == 'DEV_C' || this.ui.getPossibleLocations(key).length)
        this.toggleAction(this.keyTo$El(key), can_act)
      })
    } else {
      for (const $el of this.$action_bar.children) {
        this.toggleAction($el)
      }
    }
  }

  removeActiveActions() {
    for (const $el of this.$action_bar.children) {
      $el.classList.remove('active')
    }
  }

  resetRenderTimer(time_in_seconds, pid) {
    this.timer && clearInterval(this.timer)
    this.toggleAction(this.$timer, this.player.id === pid)
    time_in_seconds--
    this.timer = setInterval(_ => {
      const seconds = time_in_seconds % 60
      const minutes = Math.floor(time_in_seconds / 60)
      const time_text = minutes + ':' + ('0' + seconds).slice(-2)
      this.$timer.innerHTML = time_text
      --time_in_seconds < 0 && clearInterval(this.timer)
    }, 1000)
  }

  toggleDice(active) { this.toggleAction(this.$dice, active) }
  toggleAction($el, toggle) {
    $el?.classList[toggle ? 'remove' : 'add']('disabled')
  }

  build(location) { }
  useDevelopmentCard(type, attr) { }

  /**
   * ------------
   *   HAND UI
   * ------------
   */

  renderHand() {
    const hand_groups = oKeys(this.hand)
      .reduce((mem, key) => (mem.push([key, this.hand[key]]), mem), [])
      .sort((a, b) => a[0].length - b[0].length)
    ;
    const group_size = hand_groups.length // cannot be more than 10
    const CURVE_TRANSLATE = [
      [0], [0,0], [10,0,20], [20,0,0,30], [30,5,0,9,40],
      [40,10,0,0,18,50], [50,15,3,0,6,27,60], [55,20,6,0,0,12,36,65],
      [55,20,6,0,-5,0,12,36,65], [55,20,6,0,-5,-5,0,12,36,65],
    ][group_size - 1]

    this.$hand.innerHTML = hand_groups.map(([type, count], i) => {
      const group_rotation = -15 + (30 / ( group_size - 1 )) * i
      const group_translate = CURVE_TRANSLATE[i]
      let group_margin = group_size < 4
        ? 50 : (group_size > 6 ? (group_size > 8 ? -50 : -30) : -10)
      return `
        <div
          class="card-group" data-type="${type}" data-count="${count}"
          style="margin-right:${group_margin}px;
            transform:rotate(${group_rotation}deg) translateY(${group_translate}px);"
        >
        ${[...Array(count)].map((_, j) => {
          if (count > 7 && j < count - 7) return '' // Max 7 cards rendered
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
    oKeys(clean_obj).forEach(key => {
      if (!clean_obj[key]) { delete clean_obj[key] }
    })
    return this.#combineVps(clean_obj)
  }

  #combineVps(cards_obj) {
    let vps = 0
    oKeys(CONST.DC_VICTORY_POINTS).forEach(vp_key => {
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
  }

  /**
   * -----------------
   *   STATUS BAR UI
   * -----------------
   */
  setStatus(message) {
    this.$status_bar.innerHTML = message.replace(/<br\/?>/g, '. ')
    this.ui.saveStatus(this.$status_bar.innerHTML)
  }
  appendStatus(message) {
    this.$status_bar.innerHTML += message.replace(/<br\/?>/g, '. ')
    this.ui.saveStatus(this.$status_bar.innerHTML)
  }
}
