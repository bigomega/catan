export const TILES = {
  G: 'Grassland',
  J: 'Jungle',
  C: 'Clay Pit',
  M: 'Mountain',
  F: 'Fields',
  S: 'Sea',
  D: 'Desert',
}

export const RESOURCES = {
  S: 'Sheep',
  L: 'Lumber',
  B: 'Brick',
  O: 'Ore',
  W: 'Wheat',
}

export const SEA_REGEX = `S\\((?<dir>tl|tr|l|r|bl|br)-(?<res>${Object.keys(RESOURCES).join('|')}|\\*)(?<num>\\d*)\\)`

export const RESOURCE_REGEX = `(?<tile_type>[${Object.keys(TILES).join('|')}])(?<num>\\d*)`

export const TILE_RES = {
  G: 'S',
  J: 'L',
  C: 'B',
  M: 'O',
  F: 'W',
}

export const DEVELOPMENT_CARDS = {
  dK: 'Knight',
  dR: 'Road building', dY: 'Year of plenty', dM: 'Monopoly',
  dL: 'Library', dMr: 'Market', dG: 'Great Hall', dC: 'Chapel', dU: 'University',
}

export const VICTORY_POINTS = {
  dL: 1, dMr: 1, dG: 1, dC: 1, dU: 1,
}

export const PIECES = {
  S: 'Settlement', C: 'City', R: 'Road',
}

export const TRADE_OFFERS = {
  '*4': '4:1',
  '*3': '3:1',
  S2: 'Sheep 2:1',
  L2: 'Lumber 2:1',
  B2: 'Brick 2:1',
  O2: 'Ore 2:1',
  W2: 'Wheat 2:1',
}
