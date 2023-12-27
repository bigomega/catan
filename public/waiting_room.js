import * as CONST from "./js/const.js"

window.player_count > 2 && document.querySelector('.player-3').classList.remove('hide')
window.player_count > 3 && document.querySelector('.player-4').classList.remove('hide')

function getRandomTile() {
  // const keys = Object.keys(CONST.TILES).filter(_ => !['S', 'D'].includes(_))
  const keys = Object.keys(CONST.TILES).filter(_ => _ !== 'S' && _ !== 'D')
  return CONST.TILES[keys[Math.floor(Math.random() * keys.length)]]
}

function addPlayer(id, name) {
  document.querySelector('.player-' + id).innerHTML = `<div class="name">${name}</div>`
  const tile_img = `url('/images/tiles/${getRandomTile()}.png')`
  document.querySelector('.player-' + id).style.backgroundImage = tile_img
  document.querySelector('.player-' + id).style.animation = 'none'
  document.querySelector('.title span').innerHTML = +document.querySelector('.title span').innerHTML + 1
}

function blurBody(players_joined) {
  const blur_val = Math.round((window.player_count - players_joined) * 50 / (window.player_count - 1))
  document.querySelector('body').style.backdropFilter = `blur(${blur_val}px)`
}

for (let i = 0; i < window.players.length; i++) {
  const player = window.players[i]
  addPlayer(player.id, player.name)
}
blurBody(window.players.length)

const socket = io()
socket.on(CONST.SOCKET_EVENTS.JOINED_WAITING_ROOM, function(player) {
  addPlayer(player.id, player.name)
  blurBody(player.id)
  if(player.id === window.player_count) {
    document.querySelector('.container').classList.add('hide')
    setTimeout(_ => {
      window.location.reload()
    }, 1000)
  }
})
