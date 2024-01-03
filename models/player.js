import * as CONST from "../public/js/const.js"
import * as Helper from "../shuffler/helper.js"

export default class Player {
  id; name; socket_id; onChange; last_status;
  static #names = ['Cheran(சே)', 'Cholan(ழ)', 'Paandian(பா)', 'Karikalan(க)']
  public_vps = 0
  pieces = Object.keys(CONST.PIECES).reduce((mem, p_k) => (mem[p_k] = [], mem), {})
  closed_cards = {
    ...Helper.newObject(CONST.RESOURCES, 0),
    ...Helper.newObject(CONST.DEVELOPMENT_CARDS, 0),
  }
  open_dev_cards = {}
  trade_offers = Helper.newObject(CONST.TRADE_OFFERS)

  constructor(name, id, onChange) {
    this.id = id
    this.name = name || Player.#names[this.id - 1]
    this.onChange = onChange
    this.trade_offers['*4'] = 1
  }

  getSocket() { return this.socket_id }
  setSocket(sid) { this.socket_id = sid }
  deleteSocket() { delete this.socket_id }

  giveCard(card_type, count) {
    this.closed_cards[card_type] += count
    this.onChange(this.id, 'closed_cards', { card_type, count })
  }

  takeCard(card_type, count) {
    if (this.closed_cards[card_type] - count < 0) { throw "Cannot take more" }
    this.closed_cards[card_type] -= count
    this.onChange(this.id, 'closed_cards', { card_type, count, taken: true })
  }

  build(location, piece) {
    if (!(piece in CONST.PIECES)) return
    if (piece === 'C') {
      this.pieces[piece] = this.pieces[piece].filter(l => l !== location)
    }
    this.pieces[piece].push(location)
    if (piece === 'C' || piece === 'S') {
      this.public_vps++
      this.onChange(this.id, 'public_vps')
    }
  }

  openDevelopmentCard(card_type) {
    //
  }

  pickRandomResource() {
    const avail_res = Object.keys(CONST.RESOURCES).filter(k => this.closed_cards[k] > 0)
    const picked_res = avail_res[Math.floor(Math.random() * avail_res.length)]
    this.closed_cards[picked_res] -= 1
    return picked_res
  }

  setLastStatus(message) { this.last_status = message }

  toJSON(get_private) {
    const playerJSON = {
      id: this.id,
      name: this.name,
      public_vps: this.public_vps,
      resource_count: Object.keys(CONST.RESOURCES).reduce((mem, k) => mem + this.closed_cards[k], 0),
      dev_card_count: Object.keys(CONST.DEVELOPMENT_CARDS).reduce((mem, k) => mem + this.closed_cards[k], 0),
      open_dev_cards: this.open_dev_cards,
      trade_offers: this.trade_offers,
      last_status: this.last_status,
      ...(get_private ? {
        private_vps: 0,
        closed_cards: this.closed_cards,
      } : {})
    }
    return playerJSON
  }
}
