import * as CONST from "/js/const.js"

document.querySelector('.players').innerHTML = [...Array(window.player_count)].map((_, i) => {
  return `<div class="player" id="p${i+1}">
    <div class="dummy-image"></div>
    <div class="dummy-name"></div>
  </div>`
}).join('')

function getRandomTile() {
  const keys = Object.keys(CONST.TILES).filter(_ => _ !== 'S')
  return CONST.TILES[keys[Math.floor(Math.random() * keys.length)]]
}

function addPlayer(id, name) {
  document.querySelector('#p' + id).innerHTML = `
    <img src="/images/tiles/${getRandomTile()}.png"/>
    <div class="name">${name}</div>
  `

  document.querySelector('.title span').innerHTML = +document.querySelector('.title span').innerHTML + 1
}

for (let i = 0; i < window.players.length; i++) {
  const player = window.players[i];
  addPlayer(player.id, player.name)
}

// TODO: SOCKET IO WAIT FOR PLAYERS
