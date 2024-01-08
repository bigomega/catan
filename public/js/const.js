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

export const COST = {
  R: { L: 1, B: 1 },
  S: { L: 1, B: 1, W: 1, S: 1 },
  C: { W: 2, O: 3 },
  DEV_C: { W: 1, S: 1, O: 1 },
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
  INITIAL_SETUP: 'INITIAL_SETUP',
  // STRATEGIZE: 'strategize',
  // INITIAL_BUILD: 'initial_build',
  // INITIAL_BUILD_2: 'initial_build_2',
  PLAYER_ROLL: 'player_roll',
  PLAYER_ACTIONS: 'player_actions',
  ROBBER: 'moving_robber',
  END: 'end',
}

export const SOCKET_EVENTS = {
  // Client Sends…
  PLAYER_ONLINE: 'player_online',
  ROLL_DICE: 'roll_the_dice',
  SAVE_STATUS: 'save_last_status',
  CLICK_LOC: 'clicked_location',
  // Both
  INITIAL_SETUP: 'ask/return_initial_setup',
  // Server Sends…
  JOINED_WAITING_ROOM: 'joined_waiting_room',
  STATE_CHANGE: 'state_change',
  SET_TIMER: 'set_timer',
  DICE_VALUE: 'value_of_rolled_dice',
  RES_RECEIVED: 'total_resources_received', // Private



  ALERT_ALL: 'alert_all',
  ALERT_PLAYER: 'alert_player',
  STATUS_ONLY: 'update_status_only',
  APPEND_STATUS: 'append_to_status',
  SHOW_LOCS: 'show_actionable_locations', // sent privately
  BUILD: 'build',
  HIDE_LOCS: 'hide_all_shown_locations',
  UPDATE_PLAYER: 'update_player_data',
}

export const AUDIO_FILES = {
  START_END: 'start-end.mp3',
  BUILD_ROAD: 'build-road.mp3',
  BUILD_SETTLEMENT: 'build-settlement.mp3',
  BUILD_CITY: 'build-city.mp3',
  BOP: 'bop.mp3',
  DICE: 'dice.mp3',
  PLAYER_TURN: 'player-turn.mp3',
}
