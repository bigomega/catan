import * as CONST from "../const.js"

export default class RobberDropUI {
  #res; #total; #goal
  #onDropSubmit; #onTakenBack
  $el = document.querySelector('#game > .robber-drop-zone')
  $card_area = this.$el.querySelector('.card-area')
  $dropped_count = this.$el.querySelector('.dropped-count')
  $robber_emoji = this.$el.querySelector('.drop-emoji')
  $drop_submit = this.$el.querySelector('.drop-give-button')

  constructor({ onDropSubmit, onTakenBack, playRobberAudio }) {
    this.#onDropSubmit = onDropSubmit
    this.#onTakenBack = onTakenBack
    this.$robber_emoji.addEventListener('click', e => playRobberAudio())
  }

  hide() { this.$el.classList.remove('show') }

  render(count, hand_cards) {
    const holding_res = Object.entries(hand_cards)
      .filter(([k, v]) => v && CONST.RESOURCES[k]).map(([k]) => k)
    this.#res = Object.fromEntries(holding_res.map(k => [k, 0]))
    this.#total = 0
    this.#goal = count
    this.$card_area.innerHTML = holding_res.map(k => `
      <div class="drop-card" data-type="${k}" data-count="0"></div>
    `).join('')
    this.$dropped_count.innerHTML = [...Array(count)].map((_, i) => `
      <div class="dropped-count-light l-${i}" style="transform:rotate(${((360) * i / count)}deg)"></div>
    `).join('')
    this.$el.classList.add('show')
    this.#addEventListeners()
  }

  #addEventListeners() {
    this.$drop_submit.addEventListener('click', e => {
      if (!e.target.classList.contains('active')) return
      const clean_obj = Object.fromEntries(Object.entries(this.#res)
        .filter(([k]) => CONST.RESOURCES[k]))
      this.#onDropSubmit(clean_obj)
    })
    this.$card_area.querySelectorAll('.drop-card').forEach($el => {
      $el.addEventListener('click', e => {
        if (!+$el.dataset.count) return
        const type = $el.dataset.type
        if (this.#res[type] === undefined) return
        this.#res[type] -= 1
        this.#total -= 1
        this.updateCount()
        this.#onTakenBack(type)
      })
    })
  }

  updateCount() {
    // Goal Update
    const goal_reached = this.#goal === this.#total
    this.$drop_submit.classList[goal_reached ? 'add' : 'remove']('active')
    // Total Update
    this.$dropped_count.dataset.count = this.#total
    this.$dropped_count.querySelectorAll(`.dropped-count .dropped-count-light`).forEach(($el, i) => {
      if (i < this.#total) $el.classList.add('on')
      else $el.classList.remove('on')
    })
    // Resource Update
    Object.entries(this.#res).forEach(([key, value]) => {
      const $drop = this.$card_area.querySelector(`.drop-card[data-type="${key}"]`)
      $drop.dataset.count = value
      $drop.classList[value ? 'add' : 'remove']('valued')
    })
  }

  give(res_type) {
    this.#res[res_type] += 1
    this.#total += 1
    this.updateCount()
  }

  hasReachedGoal() { return this.#total >= this.#goal }
  isResourceSlotAvailable(res_type) { return this.#res[res_type] !== undefined }
}
