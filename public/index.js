import Game from "./js/game.js"
import UI from "./js/ui.js"
import SocketActions from "./js/socket_actions.js"
import Player from "./js/player.js"

// window.COOKIE = (str =>
//   str
//     .split(';')
//     .map(v => v.split('='))
//     .reduce((acc, v) => {
//       acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim())
//       return acc
//     }, {})
// )(document.cookie)

const socket = io()
const player = new Player(window.player)
const opponents = window.opponents
const game = new Game(window.game)
console.log(game)
console.log(player)
console.log(opponents)
const ui = new UI(game.board, player, opponents)
ui.render()
const socket_actions = new SocketActions({ socket, player, game, ui })
ui.setSocketActions(socket_actions)
