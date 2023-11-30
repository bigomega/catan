import * as CONST from "../public/js/const.js"
import * as Helper from "../shuffler/helper.js"

export default class Player {
  static #names = ['Farmer', 'Builder', 'Trader', 'Blacksmith', 'Knight']
  constructor(name, id) {
    this.id = id
    this.name = name || Player.#names[this.id % Player.#names.length]
    this.open_dev_cards = {}
    this.closed_cards = {
      ...Helper.newObject(CONST.RESOURCES),
      ...Helper.newObject(CONST.DEVELOPMENT_CARDS),
    }
    this.trade_offers = Helper.newObject(CONST.TRADE_OFFERS)
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
      resource_count: Object.keys(CONST.RESOURCES).reduce((mem, k) => mem + this.closed_cards[k], 0),
      dev_card_count: Object.keys(CONST.RESOURCES).reduce((mem, k) => mem + this.closed_cards[k], 0),
      open_dev_cards: this.open_dev_cards,
      trade_offers: this.trade_offers,
      ...(get_private ? {
        closed_cards: this.closed_cards,
      } : {})
    }
    return playerJSON
  }
}