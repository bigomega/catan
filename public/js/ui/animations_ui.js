import { DEVELOPMENT_CARDS } from "../const.js"
import GAME_MESSAGES from "../const_messages.js"

export default class AnimationUI {
  $el = document.querySelector('#game > .animation-zone')

  constructor() {}

  animateDevelopmentCard(type, out) {
    if (!DEVELOPMENT_CARDS[type]) return
    this.$el.className = `animation-zone ready dev-c-animation ${out ? 'out' : 'in'} ${type}`
    this.$el.innerHTML = `
      <div class="card-container">
        <div class="card ${type}"></div>
      </div>
    `
    setTimeout(_ => this.$el.classList.add('start'), out ? 100 : 300)
  }

  animateLargestArmy(pid, p, count) {
    this.$el.className = `animation-zone ready largest-army-animation`
    this.$el.innerHTML = `
      <div class="title p${pid}">${GAME_MESSAGES.LARGEST_ARMY.all(p, count)}</div>
      <div class="container">
        <div class="largest-army-card"></div>
        <div class="knight second"></div>
        <div class="knight first"></div>
        <div class="knight third"></div>
      </div>
    `
    setTimeout(_ => this.$el.classList.add('start'), 200)
    setTimeout(_ => this.$el.classList.add('finish'), 950)
  }
}
