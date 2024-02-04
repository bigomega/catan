import * as CONST from "./const.js"
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
      icons: { zoom: false, notifcation_sounds: false, shorcuts: false, quit: false }
    })
    localStorage.setItem('status_history', '[]')
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
    console.log('%c🛠 Advanced Game Configurations 🪚', 'border-radius: 100px; padding: 10px 25px; font: 2em EagleLake, fantasy, cursive; background: #e8d49c; color: #9c5e15;')
    console.log('%c→ Edit %cwindow.config', 'font-size: 1.2em', 'font-size: 1.2em; background: #eee; color: #333; padding: 2px 5px')
    console.log(CONST.GAME_CONFIG)
    window.config = CONST.GAME_CONFIG
    console.log('%c→ Send it as a query param to "/game/new" (everything is optional including name)', 'font-size: 1.2em')
    console.log(`%cExample: %cwindow.location.href = '/game/new?name=Mr.Robot&config=' +
      encodeURIComponent(JSON.stringify(Object.assign(window.config, {
        player_count: 2, win_points: 5, map_shuffle: false,
        mapkey: \`S.S(bl_O2).S(br_O2).S-S.M8.D.M8.S-S.G9.S.S.G9.S-S.F10.S.S.S.F10.S-S.S.C11.S.S.C12.S.S-S.S.S.C2.S.C3.S.S.S-S(r_L2).J6.J5.J4.S.S.J4.J5.J6.S(l_L2)+S.S.S.S.S.S.S.S.S\`,
      })))`, 'font-size: 1em', 'font-size: 1em; background: #eee; color: #333; padding: 2px 5px')
    console.log('%c→ Have Fun Playing Around. Come say Hi here https://github.com/bigomega/catan when you break things badly!\nThe README.md has the rules for writing your own mapkeys.\n%cCheers%c🍻', 'font-size: 1.2em', 'font-size: 3em', 'font-size: 6em')
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

    this.$container.querySelector('.join-section input.game-key').addEventListener('keydown', e => {
      if (e.code === 'Space') {
        e.target.value += '-'
        e.preventDefault()
      }
    })
  }
}

;(new LoginUI()).render()
