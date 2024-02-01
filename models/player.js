import * as CONST from "../public/js/const.js"
import { newObject } from "../public/js/utils.js"

export default class Player {
  #onChange; #onVpChange
  id; name; socket; last_status
  static #names = ['Cheran(சே)', 'Cholan(ழ)', 'Paandian(பா)', 'Karikalan(க)']
  resource_count = 0
  dev_card_count = 0
  public_vps = 0
  private_vps = 0
  pieces = { R: [], S: [], C: [] }
  closed_cards = {
    ...newObject(CONST.RESOURCES, 0),
    ...newObject(CONST.DEVELOPMENT_CARDS, 0),
  }
  open_dev_cards = newObject(CONST.DEVELOPMENT_CARDS, 0)
  trade_offers = newObject(CONST.TRADE_OFFERS, false)
  can_play_dc = false
  turn_bought_dc = {}
  largest_army = false
  longest_road = false
  longest_road_list = []

  constructor(name, id, { onChange, onVpChange }) {
    this.id = id
    this.name = name || Player.#names[this.id - 1]
    this.#onChange = onChange
    this.#onVpChange = onVpChange
    this.trade_offers.Px = true
    this.trade_offers['*4'] = true
  }

  getSocket() { return this.socket }
  setSocket(socket) { this.socket = socket }
  deleteSocket() { delete this.socket }

  giveCards(cards = {}) {
    const _give = (type, count) => {
      if (!count) return
      this.closed_cards[type] += count
      const change_type = (type in CONST.RESOURCES) ? 'res' : 'dc'
      if (change_type === 'res') { this.resource_count += count }
      else { this.dev_card_count += count }
    }
    Object.entries(cards).forEach(([k, v]) => _give(k, v))
    this.#onChange(this.id, `closed_cards`, cards)
  }

  takeCards(cards = {}) {
    const _take = (type, count) => {
      if (!count) return
      if (this.closed_cards[type] - count < 0) {
        console.warn("Cannot take more", JSON.stringify(cards))
        return
      }
      this.closed_cards[type] -= count
      if (type in CONST.RESOURCES) { this.resource_count -= count }
      else { this.dev_card_count -= count }
    }
    Object.entries(cards).forEach(([k, v]) => _take(k, v))
    this.#onChange(this.id, 'closed_cards.taken', cards)
  }

  bought(type, dev_c_key) {
    if (!this.canBuy(type)) { console.warn(`Cannot buy: ${type}`); return }
    if (!CONST.COST[type]) return
    this.takeCards(CONST.COST[type])
    if (type === 'DEV_C') {
      this.turn_bought_dc[dev_c_key] = (this.turn_bought_dc[dev_c_key] || 0) + 1
      dev_c_key === 'dVp' && this.changeVp(0, 1)
      this.giveCards({ [dev_c_key]: 1 })
    }
  }

  addPiece(location, piece) {
    if (!(piece in CONST.PIECES)) return
    if (piece === 'C') {
      const i = this.pieces.S.indexOf(location)
      if (i >= 0) { this.pieces.S.splice(i, 1) }
      else { console.warn(`Cannot build city without settlement. pid:${this.id}, loc: ${location}`); return  }
    }
    this.pieces[piece].push(location)
    piece !== 'R' && this.changeVp()
    this.#onChange(this.id, 'pieces', { piece, location })
  }

  changeVp(value = 1, is_private) {
    this.public_vps += value
    this.private_vps += is_private ? is_private : 0
    this.#onVpChange(this.id, this.public_vps + this.private_vps)
  }

  addPort(type) {
    if (!CONST.TRADE_OFFERS[type]) { return }
    this.trade_offers[type] = true
  }

  resetDevCard(allowed) {
    this.can_play_dc = !!allowed
    if (allowed) { this.turn_bought_dc = {} }
    this.#onChange(this.id, 'dc_update', { can_play_dc: this.can_play_dc, turn_bought_dc: {} })
  }

  canPlayDevCard(type) {
    return this.can_play_dc && this.closed_cards[type]
      && this.closed_cards[type] > (this.turn_bought_dc[type] || 0)
  }

  playedDevCard(type) {
    if (!this.canPlayDevCard(type)) return
    this.can_play_dc = false
    this.open_dev_cards[type] += 1
    this.takeCards({ [type]: 1 })
  }

  /** @returns {[res, val][]} */
  takeRandomResources(count = 1) {
    const all_picked_res = newObject(CONST.RESOURCES, 0)
    for (let i = 0; i < count; i++) {
      const avail_res = Object.keys(CONST.RESOURCES).filter(k => {
        return this.closed_cards[k] > all_picked_res[k]
      })
      if (!avail_res.length) { break }
      const picked_res = avail_res[Math.floor(Math.random() * avail_res.length)]
      all_picked_res[picked_res] += 1
    }
    this.takeCards(all_picked_res)
    return Object.entries(all_picked_res).filter(([k, v]) => v)
  }

  canBuy(type) {
    if (!(type in CONST.COST)) return
    if (CONST.PIECES[type] && CONST.PIECES_COUNT[type] <= this.pieces[type].length) return
    return Object.keys(CONST.COST[type]).reduce((mem, res_key) => {
      return mem && (this.closed_cards[res_key] >= CONST.COST[type][res_key])
    }, true)
  }

  hasAllResources(res = {}) {
    return this.closed_cards && Object.entries(res).reduce((mem, [k, v]) => {
      return mem && (this.closed_cards[k] >= v)
    }, true)
  }

  toggleLargestArmy(given) {
    if (given && !this.largest_army) {
      this.largest_army = true
      this.changeVp(2)
      this.#onChange(this.id, 'largest_army', { largest_army: true })
    } else if (!given && this.largest_army) {
      this.largest_army = false
      this.changeVp(-2)
      this.#onChange(this.id, 'largest_army', { largest_army: false })
    }
  }

  toggleLongestRoad(given) {
    if (given && !this.longest_road) {
      this.longest_road = true
      this.changeVp(2)
      this.#onChange(this.id, 'longest_road', { longest_road: true })
    } else if (!given && this.longest_road) {
      this.longest_road = false
      this.changeVp(-2)
      this.#onChange(this.id, 'longest_road', { longest_road: false })
    }
  }

  setLongestRoadPath(locs) {
    this.longest_road_list = locs
    this.#onChange(this.id, 'longest_road_list', { longest_road_list: locs })
  }

  setLastStatus(message) { this.last_status = message }

  toJSON(get_private) {
    const playerJSON = {
      id: this.id,
      name: this.name,
      pieces: this.pieces,
      public_vps: this.public_vps,
      resource_count: this.resource_count,
      dev_card_count: this.dev_card_count,
      open_dev_cards: this.open_dev_cards,
      trade_offers: this.trade_offers,
      last_status: this.last_status,
      can_play_dc: this.can_play_dc,
      largest_army: this.largest_army,
      longest_road: this.longest_road,
      longest_road_list: this.longest_road_list,
      ...(get_private ? {
        turn_bought_dc: this.turn_bought_dc,
        private_vps: this.private_vps,
        closed_cards: this.closed_cards,
      } : {})
    }
    return playerJSON
  }
}
