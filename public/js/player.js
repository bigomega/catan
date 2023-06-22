class Player {
  constructor() {
    this.hand_resources = { ...RESOURCES }
    Object.keys(RESOURCES).map(r => this.hand_resources[r] = 0)

    this.hand_development_cards = { ...DEVELOPMENT_CARDS }
    Object.keys(DEVELOPMENT_CARDS).map(r => this.hand_development_cards[r] = 0)
  }

  addResource(resource, count = 1) {
    this[resource] += count
  }
  hasResource(resource, count = 1) { }
  removeResource(resource, count = 1) { }

  addPiece(type) { }
  hasPiece(type) { }
  removePiece(type) { }
}
