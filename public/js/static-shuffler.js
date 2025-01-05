import * as CONST from "./const.js"
import Board from "./board/board.js"
import BoardShuffler from "./board/board_shuffler.js"
import MapBuilderBoardUI from "./ui/map_builder_board_ui.js"
import AccessibilityUI from "./ui/accessibility_ui.js"
const $ = document.querySelector.bind(document)

const dummyFn = _ => _
const PROD_URL = 'https://catan-qvig.onrender.com/'

class Shuffler {
  board; board_ui; accessibility_ui
  $mapkey_textarea; $shuffle_tiles; $shuffle_numbers; $shuffle_ports
  $el = $('#shuffler')
  $tile_selector = $('#tile-selector')

  constructor() {
    const mapkey = (new URLSearchParams(window.location.search)).get('mapkey')
    this.board = new Board(mapkey || CONST.GAME_CONFIG.mapkey)
    this.board_ui = new MapBuilderBoardUI(this.board, dummyFn)

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
      <div class="shuffler-options">
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
        <div class="button shuffle">Shuffle</div>
        <div class="button reset secondary">Reset Map</div>
        <div class="button copy secondary"></div>
      </div>
      <hr/>
      <label class="toggle-edit">
        <input type="checkbox" name="edit-map" id="toggle-edit-input"/>
        <div class="button open-edit-text">Edit Map</div>
        <div class="button secondary close-edit-text">Close Editor</div>
      </label>
      <div class="edit-options">
        <div class="title">Map Key:</div>
        <textarea name="mapkey" id="mapkey">${this.board.mapkey}</textarea>
        <div class="button render secondary">Render</div>
      </div>
    `

    this.$tile_selector.innerHTML = `
      <div class="title">Click on the tiles to edit.</div>
      <div class="all-tiles">
        ${
          Object.keys(CONST.TILES).map(t => `
            <div class="tile-container ${t}">
              <div class="tile ${t}"><div class="background"></div></div>
              <div class="tile-text">${CONST.TILES[t]}</div>
            </div>
          `).join('')
        }
      </div>
    `

    this.$mapkey_textarea = this.$el.querySelector('textarea')
    this.$shuffle_tiles = this.$el.querySelector('#shuffle-tiles')
    this.$shuffle_numbers = this.$el.querySelector('#shuffle-numbers')
    this.$shuffle_ports = this.$el.querySelector('#shuffle-ports')
    this.#setupEvents()
  }

  #setupEvents() {
    this.$el.querySelector('.button.shuffle').addEventListener('click', e => {
      this.shuffle({
        mapkey: this.$mapkey_textarea.value,
        tile: this.$shuffle_tiles.checked,
        number: this.$shuffle_numbers.checked,
        port: this.$shuffle_ports.checked,
      })
    })

    this.$el.querySelector('.button.reset').addEventListener('click', e => {
      this.updateBoard(CONST.GAME_CONFIG.mapkey)
      this.updateURL('')
    })

    this.$el.querySelector('.button.copy').addEventListener('click', e => {
      window.navigator.clipboard.writeText(window.location.href)
      e.target.classList.add('copied')
    })
    this.$el.querySelector('.button.copy').addEventListener('mouseout', e => {
      e.target.classList.remove('copied')
    })

    this.$el.querySelector('.button.render').addEventListener('click', e => {
      try { this.updateBoard(this.$mapkey_textarea.value) }
      catch(e) { window.alert(e) }
    })

    this.$el.querySelector('#toggle-edit-input').addEventListener('change', e => {
      $('#game').classList.toggle('editing-board')
      this.$tile_selector.classList.toggle('open')
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
    this.$mapkey_textarea.value = mapkey
    this.updateURL(mapkey)
    this.board = new Board(mapkey)
    this.board_ui = new MapBuilderBoardUI(this.board, dummyFn)
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
