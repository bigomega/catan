import Game from "./game.js"

const socket = io()
const game = new Game(window.game_obj, window.player_obj, window.opponents_obj, socket)

window.game = game
