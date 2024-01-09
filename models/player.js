import * as CONST from "../public/js/const.js"
import * as Helper from "../shuffler/helper.js"

export default class Player {
  id; name; socket_id; onChange; last_status;
  static #names = ['Cheran(சே)', 'Cholan(ழ)', 'Paandian(பா)', 'Karikalan(க)']
  public_vps = 0
  /** @example { R: [12, 5, 56], S: [2, 8], C: [] } */
  // pieces = Object.keys(CONST.PIECES).reduce((mem, p_k) => (mem[p_k] = [], mem), {})
  pieces = { R: [], S: [], C: [] }
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
  deleteSocket(sid) { if (sid == this.socket_id) { delete this.socket_id } }

  giveCard(card_type, count) {
    this.closed_cards[card_type] += count
    this.onChange(this.id, 'closed_cards', { card_type, count })
  }

  takeCard(card_type, count) {
    if (this.closed_cards[card_type] - count < 0) { throw "Cannot take more" }
    this.closed_cards[card_type] -= count
    this.onChange(this.id, 'closed_cards', { card_type, count, taken: true })
  }

  bought(type, dev_c_key) {
    if (!this.canBuy(type)) throw `Cannot buy: ${type}`
    for (const res_key in CONST.COST[type]) {
      this.takeCard(res_key, CONST.COST[type][res_key])
    }
    type === 'DEV_C' && this.giveCard(dev_c_key, 1)
  }

  addPiece(location, piece) {
    if (!(piece in CONST.PIECES)) return
    if (piece === 'C') {
      const i = this.pieces.S.indexOf(location)
      if (i >= 0) { this.pieces.S.splice(i, 1) }
      else { throw `Cannot build city without settlement. pid:${this.id}, loc: ${location}`  }
    }
    this.pieces[piece].push(location)
    this.onChange(this.id, 'pieces', { piece, location })
    if (piece !== 'R') {
      this.public_vps++
    }
    this.onChange(this.id, 'public_vps', { public_vps: this.public_vps })
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

  canBuy(type) {
    if (!(type in CONST.COST)) return
    return Object.keys(CONST.COST[type]).reduce((mem, res_key) => {
      return mem && (this.closed_cards[res_key] >= CONST.COST[type][res_key])
    }, true)
  }

  setLastStatus(message) { this.last_status = message }

  toJSON(get_private) {
    const playerJSON = {
      id: this.id,
      name: this.name,
      pieces: this.pieces,
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
