export default class Player {
  constructor(player_obj) {
    Object.assign(this, player_obj)
  }

  update(updated_obj) {
    Object.assign(this, updated_obj)
    return this
  }
}
