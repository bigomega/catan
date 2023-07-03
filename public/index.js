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

const game = new Game(window.game.mapkey)
console.log(game)
UI.renderBoard(game.board)
// UI.renderPlayers()
// var socket = io()
// socket.emit('chat message', 'test')
