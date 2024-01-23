export default class Player {
  constructor(player_obj) {
    Object.assign(this, player_obj)
  }

  update(updated_obj) {
    Object.assign(this, updated_obj)
    return this
  }

  hasAllResources(res_obj = {}) {
    return this.closed_cards && Object.entries(res_obj).reduce((mem, [k, v]) => {
      return mem && (this.closed_cards[k] >= v)
    }, true)
  }
}
