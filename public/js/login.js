// import * as CONST from "./const.js"
import AudioManager from "./audio_manager.js"
import AccessibilityUI from "./ui/accessibility_ui.js"
const $ = document.querySelector.bind(document)

class LoginUI {
  $el = $('#login')
  $container = $('#login .container')
  audio_manager; accessibility_ui

  constructor() {
    this.audio_manager = new AudioManager()
    this.accessibility_ui = new AccessibilityUI({
      toggleBgm: allow => this.audio_manager.toggleBgm(allow),
      icons: { zoom: false, notifcation_sounds: false, shorcuts: false }
    })
  }

  render() {
    this.accessibility_ui.render()
    this.$container.innerHTML = `
      <div class="action-types">
        <label><span>Host</span><input type="radio" name="action_type" value="host" checked="checked"/></label>
        <label><span>Join</span><input type="radio" name="action_type" value="join"/></label>
        <label><span>Watch</span><input type="radio" name="action_type" value="watch"/></label>
      </div>
      <div class="action-container">
        <div class="section host-section">
          <input type="text" class="name" name="name" placeholder="Your Name"/>
          <div class="players-count-container">${[...Array(3).keys()].map(i => `
            <label class="player-count-${i + 2}" title="${i + 2} players">
              <div class="text">${i + 2}</div>
              ${[...Array(i + 2)].map((_, j) => `<div class="p${j + 1}"></div>`).join('')}
              <input type="radio" name="player_count" value="${i + 2}" ${i === 1 ? 'checked="checked"' : ''}/>
            </label>`).join('')}
          </div>
          <label class="advaced-options disabled">
            <div class="text">Advanced Options ⇳⌄⌃</div>
            <input type="checkbox" name="advanced">
          </label>
          <button class="submit host">Start Game</button>
        </div>
        <div class="section join-section">
          <input type="text" class="name" name="name" placeholder="Your Name"/>
          <input type="text" class="game-key" name="game_id" placeholder="Game Key"/>
          <button class="submit join">Join Game</button>
        </div>
        <div class="section watch-section">
          <div class="text">Coming Soon!</div>
        </div>
      </div>
    `
    this.#setupEvents()
    setTimeout(_ => $('.notice')?.classList.add('hide'), 5000)
  }

  #setupEvents() {
    this.$container.querySelector('.host-section .submit').addEventListener('click', e => {
      const host_name = this.$container.querySelector('.host-section input.name').value
      const player_count = +this.$container.querySelector('.host-section input[name="player_count"]:checked').value
      window.location.href = `/game/new?name=${encodeURIComponent(host_name)}&players=${encodeURIComponent(player_count)}`
    })

    this.$container.querySelector('.join-section .submit').addEventListener('click', e => {
      const name = this.$container.querySelector('.join-section input.name').value
      const game_key = this.$container.querySelector('.join-section input.game-key').value
      window.location.href = `/login?name=${encodeURIComponent(name)}&game_id=${encodeURIComponent(game_key)}`
    })
  }
}

;(new LoginUI()).render()
