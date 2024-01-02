import * as CONST from "../public/js/const.js"
import * as Helper from "../shuffler/helper.js"

export default class Player {
  static #names = ['Cheran(சே)', 'Cholan(ழ)', 'Paandian(பா)', 'Karikalan(க)']
  closed_cards = {
    ...Helper.newObject(CONST.RESOURCES, 0),
    ...Helper.newObject(CONST.DEVELOPMENT_CARDS, 0),
  }
  open_dev_cards = {}
  trade_offers = Helper.newObject(CONST.TRADE_OFFERS)
  id; name; socket_id;

  constructor(name, id) {
    this.id = id
    this.name = name || Player.#names[this.id - 1]
    this.trade_offers['*4'] = 1
  }

  giveCard(card_type, count) {
    this.closed_cards[card_type] += count
  }

  takeCard(card_type, count) {
    this.closed_cards[card_type] -= count
    if (this.closed_cards[card_type] < 0) { throw "Cannot take more" }
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

  toJSON(get_private) {
    const playerJSON = {
      id: this.id,
      name: this.name,
      public_vps: 0,
      resource_count: Object.keys(CONST.RESOURCES).reduce((mem, k) => mem + this.closed_cards[k], 0),
      dev_card_count: Object.keys(CONST.RESOURCES).reduce((mem, k) => mem + this.closed_cards[k], 0),
      open_dev_cards: this.open_dev_cards,
      trade_offers: this.trade_offers,
      ...(get_private ? {
        vps: 0,
        closed_cards: this.closed_cards,
      } : {})
    }
    return playerJSON
  }
}
