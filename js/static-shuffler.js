import * as CONST from "./const.js"
import Board from "./board/board.js"
import BoardShuffler from "./board/board_shuffler.js"
import BoardUI from "./ui/board_ui.js"
import AccessibilityUI from "./ui/accessibility_ui.js"

const dummyFn = _ => _
const PROD_URL = 'https://catan-qvig.onrender.com/'

class Shuffler {
  board; board_ui; accessibility_ui
  $textarea; $tiles; $numbers; $ports
  $el = document.querySelector('#shuffler')

  constructor() {
    const mapkey = (new URLSearchParams(window.location.search)).get('mapkey')
    this.board = new Board(mapkey || CONST.GAME_CONFIG.mapkey)
    this.board_ui = new BoardUI(this.board, dummyFn)

    this.accessibility_ui = new AccessibilityUI({
      toggleBoardZoom: out => this.board_ui.toggleZoom(out),
      icons: {
        fullscreen: false, bgm: false, notifcation_sounds: false,
        shorcuts: false, quit: false,
      },
    })

    this.board_ui.render()
    this.accessibility_ui.render()
    this.injectGameLinkInInfo()
    this.render()
  }

  render() {
    this.$el.innerHTML = `
      <div class="title">Shuffle Options:</div>
      <label>
        <input type="checkbox" name="shuffle" id="shuffle-tiles" checked>
        <span>Shuffle Locations</span>
      </label>
      <label>
        <input type="checkbox" name="shuffle" id="shuffle-numbers" checked>
        <span>Shuffle Numbers</span>
        <div><small>(Will keep the 6 & 8 apart)</small></div>
      </label>
      <label>
        <input type="checkbox" name="shuffle" id="shuffle-ports" checked>
        <span>Shuffle Ports</span>
      </label>
      <button class="shuffle">Shuffle</button>
      <button class="reset secondary">Reset</button>
      <button class="copy secondary"></button>
      <div class="title">Map Key:</div>
      <textarea name="mapkey" id="mapkey">${this.board.mapkey}</textarea>
      <button class="render secondary">Render</button>
    `
    this.$textarea = this.$el.querySelector('textarea')
    this.$tiles = this.$el.querySelector('#shuffle-tiles')
    this.$numbers = this.$el.querySelector('#shuffle-numbers')
    this.$ports = this.$el.querySelector('#shuffle-ports')
    this.#setupEvents()
  }

  #setupEvents() {
    this.$el.querySelector('button.shuffle').addEventListener('click', e => {
      this.shuffle({
        mapkey: this.$textarea.value,
        tile: this.$tiles.checked,
        number: this.$numbers.checked,
        port: this.$ports.checked,
      })
    })

    this.$el.querySelector('button.reset').addEventListener('click', e => {
      this.updateBoard(CONST.GAME_CONFIG.mapkey)
      this.updateURL('')
    })

    this.$el.querySelector('button.copy').addEventListener('click', e => {
      window.navigator.clipboard.writeText(window.location.href)
      e.target.classList.add('copied')
    })
    this.$el.querySelector('button.copy').addEventListener('mouseout', e => {
      e.target.classList.remove('copied')
    })

    this.$el.querySelector('button.render').addEventListener('click', e => {
      try { this.updateBoard(this.$textarea.value) }
      catch(e) { window.alert(e) }
    })
  }

  shuffle({ mapkey, tile, number, port }) {
    let shuffle_options = []
    tile && shuffle_options.push('tile')
    number && shuffle_options.push('number')
    port && shuffle_options.push('port')
    const shuffled_mapkey = (new BoardShuffler(mapkey)).shuffle(shuffle_options.join('-'))
    this.updateBoard(shuffled_mapkey.replace(/([+|-])/g, '\n$1'))
  }

  updateBoard(mapkey) {
    this.$textarea.value = mapkey
    this.updateURL(mapkey)
    this.board = new Board(mapkey)
    this.board_ui = new BoardUI(this.board, dummyFn)
    this.board_ui.render()
  }

  updateURL(mapkey) {
    const url = new URL(window.location.href)
    url.searchParams.set('mapkey', mapkey)
    window.history.replaceState({}, null, url.href)
  }

  injectGameLinkInInfo() {
    const div = document.createElement('div')
    div.innerHTML = `<a href="${PROD_URL}" target="_blank">Play the Full Game.</a>`
    div.className = 'play-full-game'
    this.accessibility_ui.$el.querySelector('.info-zone').prepend(div)
    this.accessibility_ui.$el.querySelectorAll('img').forEach($_ => {
      $_.src = '/catan' + (new URL($_.src)).pathname
    })
    // this.accessibility_ui.$el.querySelector('.info-zone').innerHTML = `
    //   <div class="play-full-game">
    //     <a href="${PROD_URL}" target="_blank">Play the Full Game.</a>
    //   </div>
    // ` + this.accessibility_ui.$el.querySelector('.info-zone').innerHTML
  }
}

new Shuffler()
