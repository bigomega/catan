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

export const ROLL = _ => Math.ceil(Math.random() * 6)

export const GAME_CONFIG = {
  strategize: { time: 120 },
  initial_build: { time: 60 },
  roll: { time: 15 },
  player_turn: {},
  win_points: 10,
}

export const GAME_STATES = {
  STRATEGIZE: 'strategize',
  INITIAL_BUILD: 'initial_build',
  PLAYER_ROLL: 'player_roll',
  PLAYER_ACTIONS: 'player_actions',
  END: 'end',
}

export const GAME_MESSAGES = {
  strategize: t => `You have ${t} seconds to Strategize!`,
  initial_build: `Build a house and then a Road next to it`,
  initial_build_2: `Build a house and then a Road next to it. You get the surrounding resources this time.`,
}

export const SOCKET_EVENTS = {
  JOINED_WAITING_ROOM: 'joined_waiting_room',
  PLAYER_ONLINE: 'player_online',
  ALERT: 'alert',
  STATUS_BAR: 'status_bar',
  STATE_CHANGE: 'state_change',
  SET_TIMER: 'set_timer',
}
