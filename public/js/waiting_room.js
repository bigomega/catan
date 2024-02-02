import * as CONST from "./const.js"

window.player_count > 2 && document.querySelector('.player-3').classList.remove('hide')
window.player_count > 3 && document.querySelector('.player-4').classList.remove('hide')

// const tile_keys = Object.keys(CONST.TILES).filter(_ => !['S', 'D'].includes(_))
const tile_keys = Object.keys(CONST.TILES).filter(_ => _ !== 'S' && _ !== 'D')

function getRandomTile() {
  return CONST.TILES[tile_keys[Math.floor(Math.random() * tile_keys.length)]]
}

function addPlayer({ id, name }) {
  document.querySelector('.player-' + id).innerHTML = `<div class="name">${name}</div>`
  const tile_img = `url('/images/tiles/${getRandomTile()}.png')`
  document.querySelector('.player-' + id).style.backgroundImage = tile_img
  document.querySelector('.player-' + id).style.animation = 'none'
  document.querySelector('.title span').innerHTML = +document.querySelector('.title span').innerHTML + 1
}

function changeBackground(players_joined) {
  const blur_val = Math.round((window.player_count - players_joined) * 30 / (window.player_count - 1))
  const gray_val = Math.round((window.player_count - players_joined) * 100 / (window.player_count - 1))/100
  document.querySelector('body').style.backdropFilter = `blur(${blur_val}px) grayscale(${gray_val})`
}

let joined_count = 0
window.players.forEach(p => p && (joined_count++, addPlayer(p)))
changeBackground(joined_count)

const socket = io()
socket.on(CONST.SOCKET_EVENTS.JOINED_WAITING_ROOM, function(player) {
  addPlayer(player)
  changeBackground(++joined_count)
  if (joined_count === window.player_count) {
    document.querySelector('.container').classList.add('hide')
    setTimeout(_ => window.location.reload(), 1000)
  }
})
