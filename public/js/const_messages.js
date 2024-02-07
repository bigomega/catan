import * as CONST from "./const.js"

export const getName = player => player ? `<span class="p-name p${player.id}">${player.name}</span>` : 'You'

export const resToText = obj => Object.keys(obj).filter(k => obj[k])
  .map(k => `<span class="res-count" data-count="${obj[k]}">${obj[k]}</span><div class="res-icon ${k}"></div>`).join('')

const GAME_MESSAGES = {
  STRATEGIZE: { all: t => `You have <b>${t}</b> seconds to Strategize!` },
  FULL_SCREEN: { all: _ => `Press (f) or <b style="cursor: pointer;">Click Here</b> to go Full Screen 📺.` },
  INITIAL_BUILD: {
    self: _ => `Build your first Settlement and Road.`,
    other: p => `${getName(p)} is building their first Settlement and Road.`,
  },
  INITIAL_BUILD_2: {
    self: _ => `Build your second Settlement and Road. You get the surrounding resources this time.`,
    other: p => `${getName(p)} is building their second Settlement and Road.`,
  },
  ROLL_TURN: {
    self: _ => `Roll your Dice 🎲🎲<br><small>You are allowed to play a development card before and after rolling.</small>`,
    other: p => `${getName(p)} is rolling 🎲🎲`,
  },
  // PLAYER_TURN: {
  //   self: _ => `It's your turn to take actions. "End Turn" when you're done.`,
  //   other: pname => `It's ${pname}'s turn to act.`,
  // },
  DICE_VALUE: { all: (n, m, p, res) => `🎲 ${getName(p)} rolled a <b>${n + m}</b><small>(${n}+${m})</small>${res ? ` - 🥷 blocking <div class="res-icon ${res}"></div>` : ''}.` },
  RES_TAKEN: {
    all: res_obj => {
      if (!Object.keys(res_obj).length) { return '' }
      return ' :: you took→ ' + resToText(res_obj)
    }
  },
  BUILDING: { all: (piece, p) => `${getName(p)} built a ${CONST.PIECES[piece]}.` },
  DEVELOPMENT_CARD_BUY: { all: (p, c) => `${getName(p)} bought a Development Card${c ? ` (${CONST.DEVELOPMENT_CARDS[c]})` : ''}.` },
  DEVELOPMENT_CARD_USE: {
    self: d => `You used a Development Card - ${CONST.DEVELOPMENT_CARDS[d]}.`,
    other: (d, p) => `${getName(p)} used a Development Card - ${CONST.DEVELOPMENT_CARDS[d]}.`,
  },
  KNIGHT: {
    self: _ => `You is Robbed.`,
    other: p => `${getName(p)} is Robbed.`,
  },
  ROBBER: {
    self: drop_count => ` You have been GREEEEDY!<br><b>Give ${drop_count} resources</b> to the activated Robber 🥷.`,
    other: _ => ` 🥷 Robber is actived. Opponents are dropping resources.`,
  },
  ROBBER_MOVE: {
    self: _ => `Move the Robber 🥷 and steal.`,
    other: p => `${getName(p)} is moving the Robber 🥷 and stealing.`,
  },
  ROBBER_MOVED_TILE: {
    all: (tile, num, p) => {
      const t_emoji = CONST.TILE_RES[tile] ? `<div class="res-icon ${CONST.TILE_RES[tile]}"></div>` : CONST.TILE_EMOJIS[tile]
      return `${getName(p)} moved the 🥷 Robber to ${t_emoji}${CONST.TILES[tile]} @ <b>${num}</b>.`
    },
  },
  PLAYER_STOLE_RES: { all: (p2, res) => ` Stole ${res ? `1<div class="res-icon ${res}"></div>` : 'a resource '}from ${getName(p2)}.` },
  PLAYER_TRADE_INFO: { all: ({ p1, p2, board }, given, taken) => `<b>Trade:</b> ${getName(p1)} gave ${resToText(given)} to ${board ? 'the board' : getName(p2)} and took ${resToText(taken)}.` },
  KNIGHT_USED_APPEND: { all: _ => ' - Using ⚔️ "Knight" card.' },
  ROAD_BUILDING_USED: { all: p => `${getName(p)} used "Road Building" and built 2 roads.` },
  MONOPOLY_USED: { all: (p, res, total, self_c) => `${getName(p)} used "Monopoly" and collected ${total ? resToText({ [res]: total }) + 'from everyone.' + (p ? ` (${self_c} from you).` : '') : 'NOTHING from anyone.'}` },
  YEAR_OF_PLENTY_USED: { all: (p, res_obj) => `${getName(p)} used "Year of Plenty" and took ${p ? '2 resources' : resToText(res_obj)}.` },
  LARGEST_ARMY: { all: (p, c) => `⚔️ ${getName(p)} took over the "Largest Army" with <b>${c} Knights</b> ⚔️` },
  LONGEST_ROAD: { all: (p, l) => `👣 ${getName(p)} took over the "Longest Road" with <b>${l} Roads</b> 🐾` },
  PLAYER_QUIT: { all: (p, end) => `🏃 ${getName(p)} has QUIT the game!!!${end ? ' The game has ended. <a href="/">New Game</a>' : ''}` },
  END_STATUS: { all: (p, pt) => `🏆 ${getName(p)} won with <b>${pt} V</b>ictory <b>P</b>oints.` },
}

export default GAME_MESSAGES
