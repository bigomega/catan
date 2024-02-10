import * as CONST from "./const.js"
import AudioManager from "./audio_manager.js"
import AccessibilityUI from "./ui/accessibility_ui.js"
const $ = document.querySelector.bind(document)

// const tile_keys = Object.keys(CONST.TILES).filter(_ => !['S', 'D'].includes(_))
const tile_keys = Object.keys(CONST.TILES).filter(_ => _ !== 'S' && _ !== 'D')

class WaitingRoomUI {
  player_count = window.player_count
  joined_count = 0
  $joined_count = $('.title small .p-count')
  $game_key = $('.title .text')

  constructor() {
    this.audio_manager = new AudioManager()
    this.accessibility_ui = new AccessibilityUI({
      toggleBgm: allow => this.audio_manager.toggleBgm(allow),
      icons: { zoom: false, notifcation_sounds: false, shorcuts: false }
    })
    this.accessibility_ui.render()

    this.player_count > 2 && $('.player-3').classList.remove('hide')
    this.player_count > 3 && $('.player-4').classList.remove('hide')
    window.players.forEach(p => p && this.addPlayer(p))
    this.changeBackground()
    this.checkAndEnd()

    /** @event Player-Join */
    window.io().on(CONST.SOCKET_EVENTS.JOINED_WAITING_ROOM, player => {
      this.addPlayer(player)
      this.changeBackground()
      this.checkAndEnd()
    })

    /** @event Player-Quit */
    window.io().on(CONST.SOCKET_EVENTS.PLAYER_QUIT, pid => {
      this.removePlayer(pid)
      this.changeBackground()
    })

    this.$game_key.addEventListener('click', e => {
      window.navigator.clipboard.writeText(window.game_id)
      this.$game_key.classList.add('copied')
    })
    this.$game_key.addEventListener('mouseout', e => this.$game_key.classList.remove('copied'))
  }

  checkAndEnd() {
    if (this.joined_count === this.player_count) {
      $('.title small').innerHTML = `Starting the game…`
      $('#waiting-room').classList.add('hide')
      setTimeout(_ => window.location.reload(), 2000)
    }
  }

  getRandomTile() {
    return CONST.TILES[tile_keys[Math.floor(Math.random() * tile_keys.length)]]
  }

  addPlayer({ id, name }) {
    const $player = $('.player-' + id)
    if (!$player) return
    this.$joined_count.innerHTML = this.player_count - ++this.joined_count
    $player.innerHTML = `<div class="name">${name}</div>`
    $player.style.backgroundImage = `url('/images/tiles/${this.getRandomTile()}.png')`
    $player.classList.add('joined')
  }

  removePlayer(pid) {
    const $player = $('.player-' + pid)
    if (!$player) return
    this.$joined_count.innerHTML = this.player_count - --this.joined_count
    $player.innerHTML = $player.style.backgroundImage = $player.style.animation = ''
  }

  changeBackground() {
    const blur_val = Math.round((this.player_count - this.joined_count) * 30 / (this.player_count - 1))
    const gray_val = Math.round((this.player_count - this.joined_count) * 100 / (this.player_count - 1))/100
    $('body').style.backdropFilter = `blur(${blur_val}px) grayscale(${gray_val})`
  }
}

new WaitingRoomUI()
