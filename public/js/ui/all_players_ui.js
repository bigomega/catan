import * as CONST from "../const.js"
const $ = document.querySelector.bind(document)

export default class AllPlayersUI {
  player; opponents
  $el = $('#game > .all-players')
  player_refs = []

  constructor(player, opponents) {
    this.player = player
    this.opponents = opponents
  }

  toggleBlur(bool) { this.$el.classList[bool ? 'add' : 'remove']('blur') }

  render() {
    this.$el.innerHTML = [this.player, ...this.opponents].map(player => `
      <div class="player id-${player.id}" data-id="${player.id}">
        <div class="name">${player.name}</div>
        <div class="victory-points"><span>${player.public_vps}</span></div>
        <!--<div class="open-dev-cards"></div>
        <div class="extra-vps"></div>
        <div class="hand">
          <div class="header">HAND</div>
          <div class="resources">
            <div class="count">${player.resource_count}</div>
          </div>
          <div class="development-cards">
            <div class="count">${player.dev_card_count}</div>
          </div>
        </div>-->
      </div>
    `).join('')
    this.#setRefs()
  }

  #setRefs() {
    this.$el.querySelectorAll('.player').forEach($player => {
      this.player_refs[$player.dataset.id] = {
        $el: $player,
        $vps: $player.querySelector('.victory-points span'),
      }
    })
  }

  updatePlayer(player, key) {
    const { $el, $vps } = this.player_refs[player.id]
    if (!$el) return
    switch (key) {
      case 'public_vps': $vps.innerHTML = player[key]; break
      case 'closed_cards.res': break
      case 'closed_cards.dc': break
      case 'closed_cards': break
      case 'pieces': break
      case 'trade_offers': break
    }
  }
}
