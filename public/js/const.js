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

const TILE_RES = {
  G: 'S',
  J: 'L',
  C: 'B',
  M: 'O',
  F: 'W',
}

const DEVELOPMENT_CARDS = {
  K: 'Knight',
  R: 'Road building', Y: 'Year of plenty', M: 'Monopoly',
  V: 'Victory point',
}

const PIECES = {
  S: 'Settlement', C: 'City', R: 'Road',
}
