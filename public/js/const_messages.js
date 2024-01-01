import * as CONST from "./const.js"

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
  ROLL_VALUE: {
    self: (n, m) => `You rolled a <b>${n + m}</b> (${n} and ${m}).`,
    other: (n, m, pname) => `${pname} rolled a <b>${n + m}</b> (${n} and ${m}).`,
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
    self: _ => `The Robber 🥷 is awake. Drop half your cards if you have more than 7`,
    other: _ => `The Robber 🥷 is awake. Drop half your cards if you have more than 7`,
  },
}

export default GAME_MESSAGES
