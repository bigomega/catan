export const TILES = {
  G: 'Grassland',
  J: 'Jungle',
  C: 'Clay Pit',
  M: 'Mountain',
  F: 'Fields',
  S: 'Sea',
  D: 'Desert',
}

export const RESOURCES = { S: 'Sheep', L: 'Lumber', B: 'Brick', O: 'Ore', W: 'Wheat'}

export const RESOURCE_EMOJIS = { S: '🐑', L: '🪵', B: '🧱', O: '🏔', W: '🌾' }

export const SEA_REGEX = `S\\((?<dir>tl|tr|l|r|bl|br)-(?<res>${Object.keys(RESOURCES).join('|')}|\\*)(?<num>\\d*)\\)`

export const RESOURCE_REGEX = `(?<tile_type>[${Object.keys(TILES).join('|')}])(?<num>\\d*)`

export const TILE_RES = { G: 'S',  J: 'L',  C: 'B',  M: 'O',  F: 'W'}

export const DEVELOPMENT_CARDS = {
  dK: 'Knight',
  dR: 'Road building', dY: 'Year of plenty', dM: 'Monopoly',
  dL: 'Library', dMr: 'Market', dG: 'Great Hall', dC: 'Chapel', dU: 'University',
}

export const DEVELOPMENT_CARDS_DECK = []
DEVELOPMENT_CARDS_DECK.push(...[...Array(14)].map(_ => 'dK')) // 14 Knights
DEVELOPMENT_CARDS_DECK.push('dR','dR', 'dY','dY', 'dM','dM') // 2 of each power cards
DEVELOPMENT_CARDS_DECK.push('dL', 'dMr', 'dG', 'dC', 'dU') // 5 victory points

export const DC_VICTORY_POINTS = { dL: 1, dMr: 1, dG: 1, dC: 1, dU: 1 }

export const LOCS = { CORNER: 'C', EDGE: 'E', TILE: 'T' }

export const PIECES = { S: 'Settlement', C: 'City', R: 'Road' }

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
  INITIAL_BUILD_2: 'initial_build_2',
  PLAYER_ROLL: 'player_roll',
  PLAYER_ACTIONS: 'player_actions',
  END: 'end',
}

export const SOCKET_EVENTS = {
  // Client Sends…
  JOINED_WAITING_ROOM: 'joined_waiting_room',
  PLAYER_ONLINE: 'player_online',
  CLICK_LOC: 'clicked_location',
  // Server Sends…
  ALERT_ALL: 'alert_all',
  ALERT_PLAYER: 'alert_player',
  STATUS_ONLY: 'update_status_only',
  STATE_CHANGE: 'state_change',
  SET_TIMER: 'set_timer',
  SHOW_LOCS: 'show_actionable_locations',
  BUILD: 'build',
  HIDE_LOCS: 'hide_all_shown_locations',
  UPDATE_PLAYER: 'update_player_data',
}

export const AUDIO_FILES = {
  START_END: 'start-end.mp3',
  BOP: 'bop.mp3',
  DICE: 'dice.mp3',
  PLAYER_TURN: 'player-turn.mp3',
}
