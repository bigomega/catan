import * as CONST from "../const.js"

export default class ResSelectionUI {
  type; #onSubmit; #onDevCardClick
  selected = []
  $el = document.querySelector('#game > .resouce-selection-zone')

  constructor({ onSubmit, onDevCardClick }) {
    this.#onSubmit = onSubmit
    this.#onDevCardClick = onDevCardClick
  }

  render() {
    this.$el.innerHTML = `
      <div class="title">Select Resource</div>
      <div class="content">
        <div class="card-area">${Object.entries(CONST.RESOURCES).map(([k, txt]) =>
          `<div class="card" data-type="${k}" data-text="${txt}" data-count="0"></div>`).join('')}
        </div>
        <div class="actions">
          <div class="dev-card"></div>
          <div class="submit">Take</div>
        </div>
      </div>
    `
    this.#setupEvents()
  }
  #setupEvents() {
    this.$el.querySelectorAll('.card').forEach($el => $el.addEventListener('click', e => {
      const count = +e.target.dataset.count
      const res = e.target.dataset.type
      const max_count = this.type === 'dM' ? 1 : 2
      if (this.selected.length < max_count) {
        this.selected.push(res)
        e.target.dataset.count = count + 1
      } else if (count) {
        e.target.dataset.count = count - 1
        this.selected.indexOf(res) > -1 && this.selected.splice(this.selected.indexOf(res), 1)
      }
      const can_submit = this.selected.length >= max_count
      this.$el.querySelector('.submit').classList[can_submit ? 'add' : 'remove']('active')
      this.$el.querySelector('.card-area').classList[can_submit ? 'add' : 'remove']('inactive')
    }))
    this.$el.querySelector('.dev-card').addEventListener('click', e => this.#onDevCardClick(this.type))
    this.$el.querySelector('.submit').addEventListener('click', e => {
      if (!e.target.classList.contains('active')) { return }
      this.#onSubmit(this.type, this.selected[0], this.selected[1])
      this.hide()
    })
  }

  show(type) {
    let title, submit_text
    if (type === 'dM') {
      title = 'Select a Resource to collect from Everyone'
      submit_text = 'Collect'
    } else if (type === 'dY') {
      title = 'Select 2 Resources to take'
      submit_text = 'Take'
    } else { return }
    this.type = type
    this.selected = []
    this.$el.querySelector('.title').innerText = title
    this.$el.querySelector('.dev-card').dataset.type = type
    this.$el.querySelector('.submit').innerText = submit_text
    this.$el.querySelector('.submit').classList.remove('active')
    this.$el.querySelectorAll('.card').forEach($el => $el.dataset.count = 0)
    this.$el.classList.remove('hide')
  }

  hide() { this.$el.classList.add('hide') }
}
