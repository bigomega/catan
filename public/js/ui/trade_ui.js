import * as CONST from "../const.js"
import { newObject } from "../utils.js";

export default class TradeUI {
  #giving_res; #taking_res; #trade_type; #counter_id
  #player; #onTradeProposal; #onTradeResponse
  $el = document.querySelector('#game > .trade-zone')
  $notifications = this.$el.querySelector('.trade-notifications')
  $type_selection = this.$el.querySelector('.trade-type-selection')
  $card_selection = this.$el.querySelector('.trade-card-selection')

  constructor(player, { onTradeProposal, onTradeResponse }) {
    this.#player = player
    this.#onTradeProposal = onTradeProposal
    this.#onTradeResponse = onTradeResponse
  }

  render() {
    this.$card_selection.innerHTML = `
      <div class="card-section">${Object.keys(CONST.RESOURCES).map(res => `
        <div class="card-container" data-type="${res}">
          <div class="card giving-card" data-count="0"></div>
          <div class="card taking-card" data-count="0"></div>
        </div>`).join('')}
      </div>
      <div class="info-section">
        <div class="giving-text"></div>
        <div class="action-container">
          <div class="reset">↺</div>
          <div class="submit">Trade</div>
        </div>
        <div class="taking-text"></div>
      </div>
    `
    this.$type_selection.innerHTML = Object.entries(CONST.TRADE_OFFERS).map(([type, txt]) =>
      `<div class="trade-type ${type.replace(/\*/, '_')}" data-type="${type}">${type == 'Px' ? txt : ''}</div>`
    ).join('')
    this.$type_selection.innerHTML += `<div class="cancel" title="Cancel (Esc)">x</div>`
    this.#setupEvents()
  }

  #setupEvents() {
    this.$type_selection.querySelector('.cancel')
    this.$type_selection.querySelectorAll('.trade-type').forEach($el => {
      $el.addEventListener('click', e => {
        const type = e.target.dataset.type
      })
    })
  }

  renderTradeTypes() {}

  renderTrade(counter_id) {
    this.#giving_res = newObject(0); this.#taking_res = newObject(0)
    if (counter_id) {
      this.$card_selection.classList.remove('hide')
    } else {
      this.$type_selection.classList.remove('hide')
      Object.entries(this.#player.trade_offers).forEach(([type, allowed]) => {
        if (type === '*4' && this.#player.trade_offers['*3']) { return }
        const $el = this.$type_selection.querySelector(`.trade-type[data-type="${type}"]`)
        $el.classList[allowed ? 'add' : 'remove']('hide')
      })
    }
  }

  clearSelections() {
    this.$card_selection.classList.add('hide')
    this.$type_selection.classList.add('hide')
  }

  renderNewNotification() {}

  clearNotifications() { this.$notifications.innerHTML = '' }
}
