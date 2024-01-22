import * as CONST from "./const.js"

const resToText = obj => Object.keys(obj).filter(k => obj[k])
  .map(k => `${obj[k]}<div class="res-icon ${k}"></div>`).join(' ')

const GAME_MESSAGES = {
  // --- ALERTS ---
  STRATEGIZE: {
    self: t => `You have <b>${t}</b> seconds to Strategize!`,
    other: t => `You have <b>${t}</b> seconds to Strategize!`,
  },
  INITIAL_BUILD: {
    self: _ => `Build your first Settlement and Road.`,
    other: pname => `${pname} is building their first Settlement and Road.`,
  },
  INITIAL_BUILD_2: {
    self: _ => `Build your second Settlement and Road. You get the surrounding resources this time.`,
    other: pname => `${pname} is building their second Settlement and Road.`,
  },
  ROLL_TURN: {
    self: _ => `Roll your Dice 🎲🎲<br><small>You can optionally play a development card before.</small>`,
    other: pname => `${pname} is rolling 🎲🎲`,
  },
  PLAYER_TURN: {
    self: _ => `It's your turn to take actions. "End Turn" when you're done.`,
    other: pname => `It's ${pname}'s turn to act.`,
  },
  KNIGHT_ARMY: {
    self: _ => `You now own the Knight Army ⚔️`,
    other: pname => `${pname} now owns the Knight Army ⚔️`,
  },
  LONGEST_ROAD: {
    self: _ => `You now own the Longest Road 👣`,
    other: pname => `${pname} now owns the Longest Road 👣`,
  },
  MONOPOLY: {
    self: n => `You took ${n} TK`,
    other: n => `You took ${n} TK`,
  },
  END: {
    self: _ => `🎖 You have Won the game 🎖`,
    others: pname => `${pname} has won the game.`,
  },
  // --- STATUS UPDATES ---
  ROLL_VALUE: {
    self: (n, m) => `🎲 You rolled a <b>${n + m}</b><small>(${n}+${m})</small>.`,
    other: (n, m, pname) => `🎲 ${pname} rolled a <b>${n + m}</b><small>(${n}+${m})</small>.`,
  },
  RES_TO_EMOJI: {
    self: res_obj => {
      if (!Object.keys(res_obj).length) { return '' }
      return ' :: took→ ' + resToText(res_obj)
    },
    other: _ => '',
  },
  _PROXY: {
    self: _ => _,
    other: _ => _,
  },
  RESOURCE_COLLECTION: {
    self: _ => `You have receieved ${'TK'}.`,
    other: pname => `${pname} has receieved ${'TK'}.`,
  },
  BUILDING: {
    self: piece => `You have built a ${CONST.PIECES[piece]}.`,
    other: (piece, pname) => `${pname} has built a ${CONST.PIECES[piece]}.`,
  },
  DEVELOPMENT_CARD_BUY: {
    self: _ => `You have bought a Development Card.`,
    other: pname => `${pname} has bought a Development Card.`,
  },
  DEVELOPMENT_CARD_USE: {
    self: d => `You have used a Development Card - ${CONST.DEVELOPMENT_CARDS[d]}.`,
    other: (d, pname) => `${pname} has used a Development Card - ${CONST.DEVELOPMENT_CARDS[d]}.`,
  },
  TRADE: {
    self: 'TK',
    other: pname => '',
  },
  KNIGHT: {
    self: _ => `You have been Robbed.`,
    other: pname => `${pname} has been Robbed.`,
  },
  ROBBER: {
    self: drop => ` You have been GREEEEDY.<br><b>Give ${drop} resources</b> to the activated Robber 🥷.`,
    other: _ => ` 🥷 Robber is actived. Opponents are dropping resources.`,
  },
  ROBBER_MOVE: {
    self: _ => `Move the Robber 🥷 and steal.`,
    other: (pname) => `${pname} is moving the Robber 🥷 and stealing.`,
  },
  ROBBER_MOVED_TILE: {
    self: (tile, num) => {
      const t_emoji = CONST.TILE_RES[tile] ? `<div class="res-icon ${CONST.TILE_RES[tile]}"></div>` : CONST.TILE_EMOJIS[tile]
      return `You have moved the 🥷 Robber to ${t_emoji}${CONST.TILES[tile]} @ <b>${num}</b>.`
    },
    other: (tile, num, pname) => {
      const t_emoji = CONST.TILE_RES[tile] ? `<div class="res-icon ${CONST.TILE_RES[tile]}"></div>` : CONST.TILE_EMOJIS[tile]
      return `${pname} has moved the 🥷 Robber to ${t_emoji}${CONST.TILES[tile]} @ <b>${num}</b>.`
    },
  },
  PLAYER_STOLE_RES: {
    self: ({ p1, p2 }, res) => ` Stole 1<div class="res-icon ${res}"></div> from ${p2 || 'you'}.`,
    other: ({ p1, p2 }) => ` Stole a resource from ${p2}.`,
  },
  PLAYER_TRADE_INFO: {
    self: ({ p1, p2, board }, given, taken) => `<b>Trade:</b> ${p1 || 'You'} gave ${resToText(given)} to ${board ? 'the board' : (p2 || 'you')} and took ${resToText(taken)}.`,
    other: _ => '',
  },
}

export default GAME_MESSAGES
