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
    const all_players = [this.player, ...this.opponents]
    this.$el.innerHTML = all_players.map(player => `
      <div class="player p${player.id}" data-id="${player.id}">
        <div class="basic-info">
          <div class="name">${player.name}</div>
          <div class="hand-vp">
            <div class="victory-points"><span>${player.public_vps + (player.private_vps || 0)}</span></div>
            <div class="resources" data-count="${player.resource_count}"></div>
            <div class="development-cards" data-count="${player.dev_card_count}"></div>
          </div>
        </div>
        <div class="advanced-info">
          <div class="largest-army" data-count="${player.open_dev_cards.dK}"></div>
          <div class="longest-road" data-count="${player.longest_road_list.length}"></div>
        </div>
      </div>
    `).join('')
    this.$el.dataset.road = all_players.find(_ => _.longest_road)?.id || '-'
    this.$el.dataset.army = all_players.find(_ => _.largest_army)?.id || '-'
    this.#setRefs()
  }

  #setRefs() {
    this.$el.querySelectorAll('.player').forEach($player => {
      this.player_refs[$player.dataset.id] = {
        $p: $player,
        $vps: $player.querySelector('.victory-points span'),
        $res: $player.querySelector('.resources'),
        $dc: $player.querySelector('.development-cards'),
        $army: $player.querySelector('.largest-army'),
        $road: $player.querySelector('.longest-road'),
      }
    })
  }

  updateActive(pid) { this.$el.dataset.active = pid }

  updatePlayer(player, key) {
    const { $p, $vps, $res, $dc, $army, $road } = this.player_refs[player.id]
    if (!$p) return
    $vps.innerHTML = player.public_vps + (player.private_vps || 0)
    $res.dataset.count = player.resource_count
    $dc.dataset.count = player.dev_card_count
    $army.dataset.count = player.open_dev_cards.dK
    $road.dataset.count = player.longest_road_list.length

    console.log(player.id);
    if (player.longest_road) this.$el.dataset.road = player.id
    if (player.largest_army) this.$el.dataset.army = player.id
    // switch (key) {
    //   case 'closed_cards': break
    //   case 'closed_cards.taken': break
    //   case 'pieces': break
    //   case 'largest_army': break
    //   case 'longest_road': break
    //   case 'longest_road_list': break
    //   case 'dc_update': break
    // }
  }
}
