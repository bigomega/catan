import { DEVELOPMENT_CARDS } from "../const.js"
import GAME_MESSAGES from "../const_messages.js"

export default class AnimationUI {
  $el = document.querySelector('#game > .animation-zone')
  $res_el = document.querySelector('#game > .resource-animation-zone')

  constructor() {}

  animateResourcesTaken(cards) {
    if (Object.values(cards).reduce((mem, v) => mem + v, 0) <= 0) return
    this.$res_el.className = `resource-animation-zone ready resources-animation`
    this.$res_el.innerHTML = `
      <div class="container">${Object.entries(cards).map(([k, v]) => v ? `
        <div class="res-circle" data-count="${v}">
          <div class="res-icon ${k}"></div>
        </div>` : '').join('')}
      </div>
    `
    setTimeout(_ => this.$res_el.classList.add('start'), 200)
  }

  animateDiceRoll(d1, d2) {
    this.$el.className = `animation-zone ready dice-roll-animation`
    this.$el.innerHTML = `
      <div class="dice-animation"></div>
      <div class="dice d1">${Array(d1).fill(0).map(_ => `<span class="pip"></span>`).join('')}</div>
      <div class="dice d2">${Array(d2).fill(0).map(_ => `<span class="pip"></span>`).join('')}</div>
    `
    setTimeout(_ => this.$el.classList.add('start'), 250)
  }

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

  animateLongestRoad(pid, p, locs) {
    if (!locs?.length) return
    const $board = document.querySelector('#game .board')
    $board.classList.add('darken')
    const ids = locs.slice()
    const timer = setInterval(_ => {
      if (!ids.length) { return clearInterval(timer) }
      const { id, type } = ids.pop()
      $board.querySelector(`.${type == 'e' ? 'edge' : 'corner'}[data-id="${id}"]`)?.classList.add('longest')
    }, 2000 / locs.length)
    setTimeout(_ => {
      this.$el.className = `animation-zone ready longest-road-animation`
      this.$el.innerHTML = `
        <div class="title p${pid}">${GAME_MESSAGES.LONGEST_ROAD.all(p, locs.filter(_ => _.type == 'e').length)}</div>
        <div class="container">
        <div class="longest-road-card"></div>
        </div>
      `
    }, 4000)
    setTimeout(_ => {
      this.$el.classList.add('start')
      $board.classList.remove('darken')
      $board.querySelectorAll('.longest').forEach(_ => _.classList.remove('longest'))
    }, 6000)
  }
}
