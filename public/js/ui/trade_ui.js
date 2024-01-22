import * as CONST from "../const.js"
import { newObject } from "../utils.js";

export default class TradeUI {
  #giving_res; #taking_res; #trade_type; #counter_id
  #player; #onTradeProposal; #onTradeResponse; #toggleHandRes; #resetHand; #toggleBoardHide
  $submit; $giving_text; $taking_text;
  $el = document.querySelector('#game > .trade-zone')
  $notifications = this.$el.querySelector('.trade-notifications')
  $type_selection = this.$el.querySelector('.trade-type-selection')
  $card_selection = this.$el.querySelector('.trade-card-selection')

  constructor(player, { onTradeProposal, onTradeResponse, toggleHandRes, resetHand, toggleBoardHide }) {
    this.#player = player
    this.#onTradeProposal = onTradeProposal
    this.#onTradeResponse = onTradeResponse
    this.#toggleHandRes = toggleHandRes
    this.#resetHand = resetHand
    this.#toggleBoardHide = toggleBoardHide
  }

  render() {
    this.$type_selection.innerHTML = Object.entries(CONST.TRADE_OFFERS).map(([type, txt]) =>
      `<div class="trade-type ${type.replace(/\*/, '_')}" data-type="${type}">${type == 'Px' ? txt : ''}</div>`
    ).join('')
    this.$type_selection.innerHTML += `<div class="cancel" title="Cancel (Esc)">x</div>`
    this.$card_selection.innerHTML = `
      <div class="card-section">${Object.keys(CONST.RESOURCES).map(res => `
        <div class="card-container">
          <div class="card giving-card" data-count="0" data-type="${res}"></div>
          <div class="card taking-card" data-count="0" data-type="${res}"></div>
        </div>`).join('')}
      </div>
      <div class="info-section">
        <div class="giving-text"></div>
        <div class="action-container">
          <div class="reset">↺</div>
          <div class="submit"></div>
        </div>
        <div class="taking-text"></div>
      </div>
    `
    this.#setRefs()
    this.#setupEvents()
  }

  #setRefs() {
    this.$submit = this.$card_selection.querySelector('.info-section .submit')
    this.$giving_text = this.$card_selection.querySelector('.info-section .giving-text')
    this.$taking_text = this.$card_selection.querySelector('.info-section .taking-text')
  }

  #setupEvents() {
    this.$type_selection.querySelector('.cancel').addEventListener('click', e => {
      this.clearSelections()
    })
    // Trade Type selection
    this.$type_selection.querySelectorAll('.trade-type').forEach($el => {
      $el.addEventListener('click', e => {
        if (e.target.classList.contains('disabled')) return
        if (e.target.classList.contains('hide')) return
        const type = e.target.dataset.type
        if (!this.#player.trade_offers[type]) return
        this.$type_selection.querySelectorAll('.trade-type').forEach($el2 => $el2.classList.remove('active'))
        e.target.classList.add('active')
        this.renderCardSelection(type)
      })
    })
    // Giving & Taking Card (addition only)
    this.$card_selection.querySelectorAll('.card').forEach($el => {
      $el.addEventListener('click', e => {
        if (e.target.classList.contains('disabled')) return
        if (e.target.classList.contains('full')) return
        const res = e.target.dataset.type
        const is_giving = e.target.classList.contains('giving-card')
        const res_obj = is_giving ? this.#giving_res : this.#taking_res
        let res_change_count = 1
        if (is_giving) {
          if (['S2','L2','B2','O2','W2'].includes(this.#trade_type)) { res_change_count = 2 }
          else if (this.#trade_type === '*3') { res_change_count = 3 }
          else if (this.#trade_type === '*4') { res_change_count = 4 }
        }
        res_obj[res] += res_change_count
        e.target.dataset.count = res_obj[res]
        this.$card_selection
          .querySelector(`.${is_giving ? 'giving' : 'taking'}-card[data-type="${res}"]`)
          ?.classList.add('disabled')
        this.renderGivingTakingText()
        // this.#toggleHandRes(res, !is_giving, res_change_count)
        this.validateAndUpdateTrade()
      })
    })
    this.$card_selection.querySelector('.info-section .reset').addEventListener('click', e => {
      this.renderCardSelection(this.#trade_type)
      this.#resetHand()
    })
  }

  renderTradeSelection() {
    this.$type_selection.classList.remove('hide')
    Object.entries(this.#player.trade_offers).forEach(([type, allowed]) => {
      const $el = this.$type_selection.querySelector(`.trade-type[data-type="${type}"]`)
      $el.classList[allowed ? 'remove' : 'add']('hide')
      const player_res = Object.entries(this.#player.closed_cards).filter(([k]) => !!CONST.RESOURCES[k])
      const player_res_obj = Object.fromEntries(player_res)
      switch (type) {
        case 'S2': player_res_obj.S < 2 && $el.classList.add('disabled'); break
        case 'L2': player_res_obj.L < 2 && $el.classList.add('disabled'); break
        case 'B2': player_res_obj.B < 2 && $el.classList.add('disabled'); break
        case 'O2': player_res_obj.O < 2 && $el.classList.add('disabled'); break
        case 'W2': player_res_obj.W < 2 && $el.classList.add('disabled'); break
        case '*3':
          !player_res.filter(([k, v]) => v > 2).length && $el.classList.add('disabled')
          break
        case '*4':
          // if (this.#player.trade_offers['*3']) { $el.classList.add('hide'); break }
          !player_res.filter(([k, v]) => v > 3).length && $el.classList.add('disabled')
          break
        case 'Px':
          !player_res.filter(([k, v]) => v > 0).length && $el.classList.add('disabled')
          break
      }
      $el.classList.remove('active')
    })
  }

  renderCardSelection(trade_type) {
    this.#giving_res = newObject(CONST.RESOURCES, 0)
    this.#taking_res = newObject(CONST.RESOURCES, 0)
    this.#trade_type = trade_type
    this.validateAndUpdateTrade()
    this.#toggleBoardHide(true)
    this.$card_selection.classList.remove('hide')
    this.$card_selection.dataset.trade_type = trade_type
    this.$giving_text.innerHTML = ''
    this.$taking_text.innerHTML = ''
    this.$submit.classList.remove('active')
  }

  renderGivingTakingText() {
    const getText = obj => Object.entries(obj).filter(([k,v]) => v)
      .map(([res, v]) => v ? `${v}<div class="res-icon ${res}"></div>` : '')
      .join(' ')
    this.$giving_text.innerHTML = getText(this.#giving_res)
    this.$taking_text.innerHTML = getText(this.#taking_res)
  }

  validateAndUpdateTrade() {
    // Clean and Disable ALL cards
    this.$card_selection.querySelectorAll('.card').forEach($el => {
      const is_giving = $el.classList.contains('giving-card')
      $el.dataset.count = is_giving ? this.#giving_res[$el.dataset.type] : this.#taking_res[$el.dataset.type]
      $el.classList.remove('full'); $el.classList.add('disabled')
    })

    const giving_total = Object.values(this.#giving_res).reduce((m, v) => m + v, 0)
    const taking_total = Object.values(this.#taking_res).reduce((m, v) => m + v, 0)

    const _calculateAndUpdate = (count, ...res_list) => {
      res_list.forEach(res => {
        const player_res_count = this.#player.closed_cards[res]
        const $el_g = this.$card_selection.querySelector(`.giving-card[data-type="${res}"]`)
        if (this.#taking_res[res]) { return }
        player_res_count >= count && $el_g.classList.remove('disabled')
        player_res_count < (this.#giving_res[res] + count) && $el_g.classList.add('full')
      })
      const can_take_more = giving_total >= ((taking_total * count) + count)
      // Show takable cards
      this.$card_selection.querySelectorAll(`.taking-card`).forEach($el => {
        if (this.#giving_res[$el.dataset.type]) { return }
        if (can_take_more) {
          $el.classList.remove('disabled')
        } else if ($el.dataset.count) {
          $el.classList.add('full'); $el.classList.remove('disabled')
        }
      })
      // Submit validation
      this.$submit.classList[(giving_total === taking_total * count) ? 'add' : 'remove']('active')
    }

    if (['S2','L2','B2','O2','W2'].includes(this.#trade_type)) {
      const res = this.#trade_type[0]
      _calculateAndUpdate(2, res)
    } else if (this.#trade_type === '*3') {
      _calculateAndUpdate(3, ...Object.keys(CONST.RESOURCES))
    } else if (this.#trade_type === '*4') {
      _calculateAndUpdate(4, ...Object.keys(CONST.RESOURCES))
    } else if (this.#trade_type === 'Px') {
      this.$card_selection.querySelectorAll('.card').forEach($el => {
        const res = $el.dataset.type
        const is_giving = $el.classList.contains('giving-card')
        if (is_giving) {
          if (this.#taking_res[res]) { return }
          this.#player.closed_cards[res] && $el.classList.remove('disabled')
          this.#player.closed_cards[res] <= this.#giving_res[res] && $el.classList.add('full')
        } else {
          if (this.#giving_res[res]) { return }
          $el.classList.remove('disabled')
        }
      })
      this.$submit.classList[(giving_total && taking_total) ? 'add' : 'remove']('active')
    }
  }

  clearSelections() {
    this.$type_selection.classList.add('hide')
    this.$card_selection.classList.add('hide')
    this.#toggleBoardHide()
    this.#resetHand()
  }

  renderNewNotification() {}

  clearNotifications() { this.$notifications.innerHTML = '' }
}
