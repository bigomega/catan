import * as CONST from "../const.js"
const $ = document.querySelector.bind(document)
const oKeys = Object.keys

export default class PlayerUI {
  #ui; #onDiceClick; #onPieceClick; #onBuyDevCardClick; #onTradeClick; #onExitTrade;
  #onEndTurnClick; #onCardClick; #getPossibleLocations; #toggleBoardBlur; #onDevCardActivate
  #canPlayDevCard
  player; timer; hand

  $timer; $dice; $build_road; $build_settlement; $build_city; $buy_dev_card; $trade_btn; $end_turn
  $el = $('#game > .current-player')
  $hand = this.$el.querySelector('.hand')
  $action_bar = this.$el.querySelector('.actions')
  $card_preview = $('#game > .card-preview-zone')

  constructor(player, { onDiceClick, onPieceClick, onBuyDevCardClick, onTradeClick,
    onExitTrade, onEndTurnClick, onCardClick, getPossibleLocations, toggleBoardBlur,
    onDevCardActivate, canPlayDevCard }) {
    this.player = player
    this.#onDiceClick = onDiceClick
    this.#onPieceClick = onPieceClick
    this.#onBuyDevCardClick = onBuyDevCardClick
    this.#onTradeClick = onTradeClick
    this.#onExitTrade = onExitTrade
    this.#onEndTurnClick = onEndTurnClick
    this.#onCardClick = onCardClick
    this.#onDevCardActivate = onDevCardActivate
    this.#canPlayDevCard = canPlayDevCard
    this.#getPossibleLocations = getPossibleLocations
    this.#toggleBoardBlur = toggleBoardBlur
    this.hand = this.#cleanHandData(this.player.closed_cards)
  }

  render() {
    this.renderActionBar()
    // this.hand.S = 3
    // this.hand.L = 7
    // this.hand.B = 2
    // this.hand.dK = 3
    // this.hand.O = 3
    // this.hand.dM = 1
    // this.hand.dR = 1
    // this.hand.dY = 1
    // this.hand.dVp = 2
    this.renderHand()
    this.#setupCardPreviewEvents()
  }

  toggleShow(bool) { this.$el.classList[bool ? 'add' : 'remove']('show') }
  toggleHandBlur(bool) { this.$hand.classList[bool ? 'add' : 'remove']('blur') }
  togglePlayerBlur(bool) { this.$el.classList[bool ? 'add' : 'remove']('blur') }

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
      <div class="build-road disabled" title="Build Road (r)"></div>
      <div class="build-settlement disabled" title="Build Settlement (s)"></div>
      <div class="build-city disabled" title="Build City (c)"></div>
      <div class="dev-card disabled" title="Buy Development Card (d)" data-count="-">
        <img src="/images/dc-back.png"/>
      </div>
      <div class="trade disabled" title="Trade (t/Esc)">Trade</div>
      <div class="end-turn disabled" title="End Turn (e)">End Turn</div>
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
    this.$trade_btn = this.$action_bar.querySelector('.trade')
    this.$end_turn = this.$action_bar.querySelector('.end-turn')
  }

  #$keyToEl(key) {
    return ({
      R: this.$build_road, S: this.$build_settlement,
      C: this.$build_city, DEV_C: this.$buy_dev_card,
    })[key]
  }

  #setupActionEvents() {
    // Dice Click
    this.$dice.addEventListener('click', e => {
      if (e.target.classList.contains('disabled')) return
      this.#onDiceClick()
      e.target.classList.add('disabled')
    })
    // Road, Settlement & City Click
    const getEventCb = piece => e => {
      const classList = this.#$keyToEl(piece).classList
      if (classList.contains('disabled')) return
      this.#onPieceClick(piece, classList.contains('active'))
      classList.toggle('active')
    }
    this.$build_road.addEventListener('click', getEventCb('R'))
    this.$build_settlement.addEventListener('click', getEventCb('S'))
    this.$build_city.addEventListener('click', getEventCb('C'))
    // Buy Development Card
    this.$buy_dev_card.addEventListener('click', e => {
      if (e.target.classList.contains('disabled')) return
      this.#onBuyDevCardClick()
    })
    // Trade
    this.$trade_btn.addEventListener('click', e => {
      if (this.$trade_btn.classList.contains('disabled')) return
      this.#onTradeClick()
    })
    // End Turn
    this.$end_turn.addEventListener('click', e => {
      if (e.target.classList.contains('disabled')) return
      this.#onEndTurnClick()
    })
    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      switch (e.code) {
        case 'KeyR': getEventCb('R')(); break
        case 'KeyS': getEventCb('S')(); break
        case 'KeyC': getEventCb('C')(); break
        case 'KeyD':
          !this.$buy_dev_card.classList.contains('disabled') && this.#onBuyDevCardClick()
          break
        case 'KeyE':
          !this.$end_turn.classList.contains('disabled') && this.#onEndTurnClick()
          break
        case 'KeyT':
          if (this.$trade_btn.classList.contains('disabled')) { break }
          this.#onTradeClick()
          break
        case 'Space':
          e.target === document.body && e.preventDefault()
          if (this.$dice.classList.contains('disabled')) { break }
          this.#onDiceClick()
          e.target.classList.add('disabled')
          break
        case 'Escape':
          if (this.isAnyActionActive()) {
            this.removeActiveActions()
            this.#onPieceClick('', true)
          }
          this.#onExitTrade()
          break
      }
    })
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
      this.toggleAction(this.$trade_btn, true)
      oKeys(CONST.COST).forEach(key => {
        const can_act = this.canIBuy(key)
          && (key == 'DEV_C' || this.#getPossibleLocations(key).length)
        this.toggleAction(this.#$keyToEl(key), can_act)
      })
    } else {
      for (const $el of this.$action_bar.children) {
        this.toggleAction($el)
      }
    }
  }

  isAnyActionActive() {
    let active = false
    for (const $el of this.$action_bar.children) {
      if ($el.classList.contains('active')) { active = true; break }
    }
    return active
  }

  removeActiveActions() {
    for (const $el of this.$action_bar.children) {
      $el.classList.remove('active')
    }
  }

  resetTimer(time_in_seconds, isCurrentPlayer) {
    this.timer && clearInterval(this.timer)
    this.toggleAction(this.$timer, isCurrentPlayer)
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
      const group_rotation = -15 + (30 / (group_size - 1)) * i
      const group_translate = CURVE_TRANSLATE[i]
      let group_margin = group_size < 4
        ? 50 : (group_size > 6 ? (group_size > 8 ? -50 : -30) : -10)
      return `
        <div
          class="card-group ${type}" data-type="${type}" data-count="${count}"
          ${type === 'dK' ? ' title="Knight (k)" ' : ''}
          style="margin-right:${group_margin}px;
            transform:rotate(${group_rotation}deg) translateY(${group_translate}px);"
        >
        <div class="card-count ${count < 2 ? 'hide' : ''}">${count}</div>
        ${[...Array(count)].map((_, j) => {
        if (count > 7 && j < count - 7) return '' // Max 7 cards rendered
        const c_rot = 15 * (count - j - 1) / (count - j)
        const c_mv = 15 * (count - j - 2) / (count - j)
        return `
            <div class="card ${type}" data-type="${type}"
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
        const type = $card_group.dataset.type
        const is_active = $card_group.classList.contains('active')
        const is_dc = CONST.DEVELOPMENT_CARDS[type] && type !== 'dVp'
        if (is_dc || !is_active) {
          this.showCardPreview(type, is_dc, is_dc && this.#canPlayDevCard(type))
        }
        else { this.#onCardClick(type) }
      })
    })
  }

  #setupCardPreviewEvents() {
    this.$card_preview.addEventListener('click', e => {
      if (e.target.classList.contains('activate')) {
        if (e.target.classList.contains('hide')) { return }
        const type = this.$card_preview.querySelector('.card').dataset.type
        if (!CONST.DEVELOPMENT_CARDS[type] || type === 'dVp') { return }
        this.#onDevCardActivate(type)
      }
      if (['card', 'card-front', 'card-back'].includes(e.target.className)) { return }
      this.closeCardPreview()
    })
    document.addEventListener('keydown', e => {
      e.code === 'Escape' && this.closeCardPreview()
      e.code === 'KeyK' && this.$hand.querySelector('.card.dK')?.click()
    })
  }

  showCardPreview(type, show_info, show_activate) {
    this.#toggleBoardBlur(true); this.togglePlayerBlur(true)
    this.$card_preview.classList.remove('hide')
    this.$card_preview.querySelector('.card').dataset.type = type
    show_activate && this.$card_preview.querySelector('.activate').classList.remove('hide')
    show_info && this.$card_preview.querySelector('.info').classList.remove('hide')
  }

  closeCardPreview() {
    this.#toggleBoardBlur(false); this.togglePlayerBlur(false)
    this.$card_preview.classList.add('hide')
    this.$card_preview.querySelector('.activate').classList.add('hide')
    this.$card_preview.querySelector('.info').classList.add('hide')
  }

  #cleanHandData(cards_obj) {
    return Object.fromEntries(Object.entries(cards_obj).filter(([_, v]) => v))
  }

  updateHand(player, { type, count, taken }) {
    this.hand = this.#cleanHandData(player.closed_cards)
    this.renderHand()
  }

  activateResourceCards() {
    oKeys(CONST.DEVELOPMENT_CARDS).forEach(k => delete this.hand[k])
    this.renderHand()
    const res_selector = oKeys(CONST.RESOURCES).map(k => `.card-group[data-type="${k}"]`).join(',')
    this.$hand.querySelectorAll(res_selector).forEach($el => $el.classList.add('active'))
  }

  /** During Robber Drop */
  toggleHandResource(type, add) {
    if (add) {
      const count = +this.$hand.querySelector(`.card-group[data-type="${type}"] .card-count`).innerHTML
      this.$hand.querySelector(`.card-group[data-type="${type}"] .card-count`).innerHTML = count + 1
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
}
