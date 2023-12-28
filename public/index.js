import Game from "./js/game.js"
import UI from "./js/ui.js"
import * as CONST from "./js/const.js"
const SOC = CONST.SOCKET_EVENTS

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
const player = window.player
const opponents = window.opponents
const game = new Game(window.game)
console.log(game)
console.log(player)
console.log(opponents)
const ui = new UI(game.board, player, opponents)
ui.render()

// Notify you're online
socket.emit(SOC.PLAYER_ONLINE, player.id, game.id)
socket.on(SOC.STATE_CHANGE, function(state) {
  if(state === CONST.GAME_STATES.STRATEGIZE) {
    ;(new Audio('/sounds/start-end.mp3')).play()
  }
})
socket.on(SOC.SET_TIMER, t => ui.setTimer(t))
socket.on(SOC.ALERT, message => ui.alert(message))
socket.on(SOC.STATUS_BAR, (message, player_id) => {
  ui.setStatus(message)
  if(player_id === player.id) {
    ui.alert(message)
  }
})
