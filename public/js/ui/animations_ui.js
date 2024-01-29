import { DEVELOPMENT_CARDS } from "../const.js"

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
}
