import * as CONST from "../const.js"
const $ = document.querySelector.bind(document)

export default class PlayerUI {
  #socket_actions; player; timer;
  $timer;
  $el = $('#game > .current-player')
  $hand = this.$el.querySelector('.hand')
  $action_bar = this.$el.querySelector('.actions')
  $status_bar = this.$el.querySelector('.status-bar')
  hand = {}

  constructor(player) { this.player = player }

  setSocketActions(sa) {
    this.#socket_actions = sa
  }

  render() {
    // this.renderHand({closed_cards:{S:3,L:9,B:2,O:2,W:2,dK:2,dR:1,dY:1,dM:1,dL:0,dMr:0,dG:1,dC:0,dU:1}})
    // this.renderHand({closed_cards:{S:2,L:1,B:7,O:0,W:2,dK:3,dR:0,dY:0,dM:2,dL:0,dMr:0,dG:0,dC:0,dU:1}})
    // this.renderHand({closed_cards:{S:1,L:1,B:2,O:0,W:4,dK:0,dR:0,dY:0,dM:0,dL:0,dMr:0,dG:0,dC:0,dU:0}})
    this.renderActionBar()
  }

  renderActionBar() {
    this.$el.classList.add('id-' + this.player.id)
    this.$action_bar.innerHTML = `
      <div class="timer">0:00</div>
      <div class="roll-dice disabled" title="Roll Dice (SPACE)">🎲🎲</div>
      <div class="build-road disabled" title="Build Road (R)"><div></div></div>
      <div class="build-settlement disabled" title="Build Settlement (S)">
        <img src="/images/pieces/settlement-${this.player.id}.png"/>
      </div>
      <div class="build-city disabled" title="Build City (C)">
        <img src="/images/pieces/city-${this.player.id}.png"/>
      </div>
      <div class="dev-card disabled" title="Buy Development Card (D)">
        <img src="/images/dc-back.png"/>
      </div>
      <div class="trade">Trade</div>
      <div class="end-turn" title="End Turn (E)">End Turn</div>
    `
    this.#setRefs()
    this.#setupActionEvents()
  }
  #setRefs() {
    this.$timer = this.$el.querySelector('.timer')
  }
  #setupActionEvents() {
    //
  }

  updateHand(player, { card_type, count, taken }) {
    if (taken) {
      //
    } else {
      if (this.hand[card_type]) { this.hand[card_type] += count }
      else { this.hand[card_type] = count }
    }
    this.renderHand()
  }

  #getHandGroups(card_obj) {
    /**
     * @todo Move this logic to updateHand()
     * Keep your hand clean there
     */
    // const groups_obj = Object.assign({}, card_obj)
    // let VPS = 0
    // // VPs Grouping and Cleaning empty
    // Object.keys(groups_obj).forEach(key => {
    //   if (!groups_obj[key]) {
    //     delete groups_obj[key]
    //   } else if (key in CONST.DC_VICTORY_POINTS) {
    //     VPS += groups_obj[key]
    //     delete groups_obj[key]
    //   }
    // })
    // if (VPS) groups_obj.VPS = VPS

    return Object.keys(card_obj)
      .reduce((mem, key) => (mem.push([key, card_obj[key]]), mem), [])
      .sort((a, b) => a[0].length - b[0].length)
  }

  renderHand(given_hand = this.hand) {
    const hand_groups = this.#getHandGroups(given_hand)
    const group_length = hand_groups.length
    const hardcorded_curve_translate = [
      [0], [0,0], [10,0,20], [20,0,0,30], [30,5,0,9,40],
      [40,10,0,0,18,50], [50,15,3,0,6,27,60], [55,20,6,0,0,12,36,65],
      [55,20,6,0,-5,0,12,36,65], [55,20,6,0,-5,-5,0,12,36,65],
    ][group_length - 1]

    this.$hand.innerHTML = hand_groups.map(([type, count], i) => {
      const group_rotation = -15 + (30 / ( group_length - 1 )) * i
      const group_translate = hardcorded_curve_translate[i]
      let group_margin = group_length < 4
        ? 50 : (group_length > 6 ? (group_length > 8 ? -50 : -30) : 0)
      return `
        <div
          class="card-group" data-type="${type}" data-count="${count}"
          style="margin-right:${group_margin}px;
            transform:rotate(${group_rotation}deg) translateY(${group_translate}px);"
        >
        ${[...Array(count)].map((_, j) => {
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

  setStatus(message) {
    this.$status_bar.innerHTML = message.replace(/<br\/?>/g, '. ')
  }

  setTimer(time_in_seconds) {
    this.timer && clearInterval(this.timer)
    time_in_seconds--
    this.timer = setInterval(_ => {
      const seconds = time_in_seconds % 60
      const minutes = Math.floor(time_in_seconds / 60)
      const time_text = minutes + ':' + ('0' + seconds).slice(-2)
      this.$timer.innerHTML = time_text
      --time_in_seconds < 0 && clearInterval(this.timer)
    }, 1000)
  }

  roll() { }

  build(location) { }

  useDevelopmentCard(type, attr) { }
}
