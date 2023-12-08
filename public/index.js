import Game from "/js/game.js"
import UI from "/js/ui.js"

// window.COOKIE = (str =>
//   str
//     .split(';')
//     .map(v => v.split('='))
//     .reduce((acc, v) => {
//       acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim())
//       return acc
//     }, {})
// )(document.cookie)

var socket = io()
socket.emit('joined', window.game.id)
const game = new Game(window.game)
console.log(game)
console.log(window.player)
console.log(window.opponents)
const ui = new UI(game.board, window.player, window.opponents)
ui.render()
// UI.renderPlayers()
