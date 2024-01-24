import * as CONST from "./const.js"

export const getName = player => player ? `<span class="p-name p${player.id}">${player.name}</span>` : 'You'

export const resToText = obj => Object.keys(obj).filter(k => obj[k])
  .map(k => `<span class="res-count">${obj[k]}</span><div class="res-icon ${k}"></div>`).join('')

const GAME_MESSAGES = {
  STRATEGIZE: { all: t => `You have <b>${t}</b> seconds to Strategize!` },//----
  INITIAL_BUILD: {//---
    self: _ => `Build your first Settlement and Road.`,
    other: p => `${getName(p)} is building their first Settlement and Road.`,
  },
  INITIAL_BUILD_2: {//----
    self: _ => `Build your second Settlement and Road. You get the surrounding resources this time.`,
    other: p => `${getName(p)} is building their second Settlement and Road.`,
  },
  ROLL_TURN: {//----
    self: _ => `Roll your Dice 🎲🎲<br><small>You can optionally play a development card before.</small>`,
    other: p => `${getName(p)} is rolling 🎲🎲`,
  },
  // PLAYER_TURN: {
  //   self: _ => `It's your turn to take actions. "End Turn" when you're done.`,
  //   other: pname => `It's ${pname}'s turn to act.`,
  // },
  KNIGHT_ARMY: {
    self: _ => `You now own the Knight Army ⚔️`,
    other: p => `${getName(p)} now owns the Knight Army ⚔️`,
  },
  LONGEST_ROAD: {
    self: _ => `You now own the Longest Road 👣`,
    other: p => `${getName(p)} now owns the Longest Road 👣`,
  },
  MONOPOLY: {
    self: n => `You took ${n} TK`,
    other: n => `You took ${n} TK`,
  },
  END: {
    self: _ => `🎖 You Won the game 🎖`,
    others: p => `${getName(p)} won the game.`,
  },
  DICE_VALUE: { all: (n, m, p) => `🎲 ${getName(p)} rolled a <b>${n + m}</b><small>(${n}+${m})</small>.` },
  RES_TAKEN: {//---
    all: res_obj => {
      if (!Object.keys(res_obj).length) { return '' }
      return ' :: took→ ' + resToText(res_obj)
    }
  },
  BUILDING: { all: (piece, p) => `${getName(p)} built a ${CONST.PIECES[piece]}.` }, //----
  DEVELOPMENT_CARD_BUY: { all: (p, c) => `${getName(p)} bought a Development Card${c ? ` (${CONST.DEVELOPMENT_CARDS[c]})` : ''}.` }, //---
  DEVELOPMENT_CARD_USE: {
    self: d => `You used a Development Card - ${CONST.DEVELOPMENT_CARDS[d]}.`,
    other: (d, p) => `${getName(p)} used a Development Card - ${CONST.DEVELOPMENT_CARDS[d]}.`,
  },
  KNIGHT: {
    self: _ => `You is Robbed.`,
    other: p => `${getName(p)} is Robbed.`,
  },
  ROBBER: {//----
    self: drop_count => ` You have been GREEEEDY.<br><b>Give ${drop_count} resources</b> to the activated Robber 🥷.`,
    other: _ => ` 🥷 Robber is actived. Opponents are dropping resources.`,
  },
  ROBBER_MOVE: {//----
    self: _ => `Move the Robber 🥷 and steal.`,
    other: p => `${getName(p)} is moving the Robber 🥷 and stealing.`,
  },
  ROBBER_MOVED_TILE: {//---
    all: (tile, num, p) => {
      const t_emoji = CONST.TILE_RES[tile] ? `<div class="res-icon ${CONST.TILE_RES[tile]}"></div>` : CONST.TILE_EMOJIS[tile]
      return `${getName(p)} moved the 🥷 Robber to ${t_emoji}${CONST.TILES[tile]} @ <b>${num}</b>.`
    },
  },
  PLAYER_STOLE_RES: { all: (p2, res) => ` Stole ${res ? `1<div class="res-icon ${res}"></div>` : 'a resource '}from ${getName(p2)}.` },//---
  PLAYER_TRADE_INFO: { all: ({ p1, p2, board }, given, taken) => `<b>Trade:</b> ${getName(p1)} gave ${resToText(given)} to ${board ? 'the board' : getName(p2)} and took ${resToText(taken)}.` }, //----
}

export default GAME_MESSAGES
