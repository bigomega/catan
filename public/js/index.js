import Game from "./game.js"

const socket = io()
const game = new Game(window.game, window.player, window.opponents, socket)
game.start()

window.game_obj = game
