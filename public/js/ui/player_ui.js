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
    // delete this.hand.O
    // this.hand.dM = 1
    // this.hand.dR = 1
    // this.hand.dY = 1
    // this.hand.dVp = 2
    this.renderHand()
    this.$status_bar.innerHTML = this.player.last_status || '...'
  }

  /**
   * -----------------
   *   ACTION BAR UI
   * -----------------
   */
  //#region
  renderActionBar() {
    this.$el.classList.add('id-' + this.player.id)
    this.$action_bar.innerHTML = `
      <div class="timer disabled">0:00</div>
      <div class="roll-dice disabled" title="Roll Dice (SPACE)">🎲🎲</div>
      <div class="build-road disabled" title="Build Road (R)"></div>
      <div class="build-settlement disabled" title="Build Settlement (S)"></div>
      <div class="build-city disabled" title="Build City (C)"></div>
      <div class="dev-card disabled" title="Buy Development Card (D)" data-count="-">
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
    // Buy Development Card
    this.$buy_dev_card.addEventListener('click', e => {
      if (e.target.classList.contains('disabled')) return
      this.ui.onBuyDevCardClick()
    })
    // End Turn
    this.$end_turn.addEventListener('click', e => {
      if (e.target.classList.contains('disabled')) return
      this.ui.endTurn()
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

  setDevCardCount(n) { this.$buy_dev_card.dataset.count = n }
  build(location) { }
  useDevelopmentCard(type, attr) { }
  //#endregion

  /**
   * ------------
   *   HAND UI
   * ------------
   */
  //#region
  renderHand() {
    const hand_groups = Object.entries(this.hand).sort((a, b) => a[0].length - b[0].length)
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
        <div class="card-count ${count<2 ?'hide':''}">${count}</div>
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
        </div>
      `
    }).join('')
    this.#setupHandEvents()
  }
  #setupHandEvents() {
    this.$hand.querySelectorAll('.card, .card-count').forEach($el => {
      $el.addEventListener('click', e => {
        const $card_group = e.target.parentElement
        if (!$card_group.classList.contains('active')) return
        this.ui.onCardClick($card_group.dataset.type)
      })
    })
  }

  #cleanHandData(cards_obj) {
    return Object.fromEntries(Object.entries(cards_obj).filter(([_, v]) => v))
  }

  updateHand(player, { card_type: type, count, taken }) {
    this.hand = this.#cleanHandData(player.closed_cards)
    this.renderHand()
  }

  activateResourceCards() {
    const res_selector = oKeys(CONST.RESOURCES).map(k => `.card-group[data-type="${k}"]`).join(',')
    this.$hand.querySelectorAll(res_selector).forEach($el => $el.classList.add('active'))
  }

  toggleHandResource(type, show) {
    if (show) {
      const count = +this.$hand.querySelector(`.card-group[data-type="${type}"] .card-count`).innerHTML
      this.$hand.querySelector(`.card-group[data-type="${type}"] .card-count`).innerHTML = count+1
      this.$hand.querySelector(`.card-group[data-type="${type}"]`).classList.remove('disabled')
      const hidden_list = this.$hand.querySelectorAll(`.card-group[data-type="${type}"] .card.hide`)
      if (hidden_list.length) hidden_list[hidden_list.length - 1].classList.remove('hide')
    } else {
      const count = +this.$hand.querySelector(`.card-group[data-type="${type}"] .card-count`).innerHTML
      if (!count) return
      this.$hand.querySelector(`.card-group[data-type="${type}"] .card:not(.hide)`)?.classList.add('hide')
      this.$hand.querySelector(`.card-group[data-type="${type}"] .card-count`).innerHTML = count - 1
      if (count === 1) this.$hand.querySelector(`.card-group[data-type="${type}"]`).classList.add('disabled')
    }
    return 1
  }
  //#endregion

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
