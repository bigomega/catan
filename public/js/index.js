import Game from "./game.js"

const socket = io()
window.game_obj = new Game(window.game, window.player, window.opponents, socket)
