export default class Player {
  constructor(player_obj) {
    Object.assign(player_obj, {
      update: this.update.bind(player_obj),
    })
    return player_obj
  }

  update(updated_obj) {
    Object.assign(this, updated_obj)
    return this
  }
}
