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
  $mapkey_textarea; $shuffle_tiles; $shuffle_numbers; $shuffle_ports; $tile_selector
  $el = $('#shuffler')
  $tile_selection_container = $('#tile-selection-container')

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
      <div class="shuffler-section">
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
        <div class="button text reset">Reset Map</div>
        <div class="button text copy"></div>
      </div>
      <hr/>
      <label class="edit-section">
        <input type="checkbox" name="edit-map" id="toggle-edit-input"/>
        <div class="button open-edit-text">Edit Map</div>
        <div class="button text close-edit-text">Close Editor</div>
      </label>
      <hr/>
      <div class="mapkey-section">
        <div class="title">Map Key:</div>
        <textarea name="mapkey" id="mapkey">${this.board.mapkey}</textarea>
        <div class="button render secondary">Render</div>
      </div>
    `

    this.$tile_selection_container.innerHTML = `
      <div id="tile-selector"
        data-mode="start"
        data-tile="J"
        data-trade-type="*"
        ${Object.values(CONST.DIR_HELPER.KEYS).map(dir =>
          `data-land-${dir}="true"`
        ).join('')}
      >
        <!-- modes = start|tiles|number|trade|trade-direction -->
        <div class="title">
          <div>Click on the tiles to edit.</div>
          <span class="button text">Clean Start</span>
        </div>
        <div class="select-tiles">
          ${Object.entries(CONST.TILES).map(([t_key, t_name]) => `
            <div class="tile-container ${t_key}" data-type="${t_key}">
              <div class="tile ${t_key}">
                ${t_key === 'S' ? `
                  <div class="sea-hexagon"></div>
                  <div class="beaches">
                    ${Object.values(CONST.DIR_HELPER.KEYS).map((beach_dir, i) => `
                      <div class="beach beach-${i % 3 + 1} beach-${beach_dir}"></div>
                    `).join('')}
                  </div>
                ` : ''}
                <div class="background"></div>
              </div>
              <div class="tile-text">${t_name}</div>
            </div>
          `).join('')}
          <div class="cancel-container"><div class="button text">Close</div></div>
        </div>
        <div class="select-number">
          <div class="number-slider-container">
            <div class="number-slider-line">
              ${Array.from({ length: 10 }).map((_, i) =>
                `<div style="left: ${i * 100 / 9}%"></div>`
              ).join('')}
            </div>
            <div class="number-slider-thumb" data-num="6"></div>
            <input class="number-slider-input" type="range" value="6" min="2" max="11" step="1">
          </div>
          <div class="tile-container">
            <div class="tile">
              <div class="background"></div>
              <div class="number" data-num="6" data-dots="....."></div>
            </div>
            <div class="tile-text">Pick</div>
          </div>
        </div>
        <div class="select-trade">
          ${Object.entries(CONST.TRADE_OFFERS).map(([t_key, t_name]) => ['Px', '*4'].includes(t_key)  ? '' : `
            <div class="trade-container ${t_key}" data-type="${t_key}">
              <div class="trade-type ${t_key.replace(/\*/, '_')}" data-type="${t_key}"></div>
              <div class="trade-text">${t_name}</div>
            </div>
          `).join('')}
          <div class="trade-container" data-type="--">
            <div class="tile S">
              <div class="background"></div>
              <div class="sea-hexagon"></div>
              <div class="beaches">
                ${Object.values(CONST.DIR_HELPER.KEYS).map((beach_dir, i) => `
                  <div class="beach beach-${i % 3 + 1} beach-${beach_dir}"></div>
                `).join('')}
              </div>
              <div class="no-trade-text">No<br/>Trade</div>
            </div>
          </div>
          <div class="cancel-container"><div class="button text">Close</div></div>
        </div>
        <div class="select-trade-direction">
          ${Object.values(CONST.DIR_HELPER.KEYS).map(trade_dir => `
            <div class="trade-direction-container" data-trade-dir="${trade_dir}">
              <div class="tile S" data-trade="*" data-trade-dir="${trade_dir}">
                <div class="sea-hexagon"></div>
                <div class="background"></div>
                ${CONST.DIR_HELPER.EDGE_TO_CORNERS[trade_dir].map(trade_post_dir =>
                  `<div class="trade-post p-${trade_post_dir}"></div>`
                ).join('')}
                <div class="beaches">
                  ${Object.values(CONST.DIR_HELPER.KEYS).map((beach_dir, i) => `
                    <div class="beach beach-${i%3 + 1} beach-${beach_dir}"></div>
                  `).join('')}
                </div>
              </div>
              <div class="trade-dir-text">${trade_dir.replace('_', ' ')}</div>
            </div>
          `).join('')}
          <div class="cancel-container"><div class="button text">Close</div></div>
        </div>
      </div>
    `

    this.$tile_selector = this.$tile_selection_container.querySelector('#tile-selector')
    this.$mapkey_textarea = this.$el.querySelector('textarea')
    this.$shuffle_tiles = this.$el.querySelector('#shuffle-tiles')
    this.$shuffle_numbers = this.$el.querySelector('#shuffle-numbers')
    this.$shuffle_ports = this.$el.querySelector('#shuffle-ports')
    this.#setupEvents()
    this.#setupBoardClickEvent()
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
      $('#game').classList.toggle('board--editing')
      this.$tile_selector.classList.toggle('open')
      this.board_ui.$el.querySelector('.tile.picked')?.classList.remove('picked')
      this.$tile_selector.dataset.mode = "start"
    })

    this.$tile_selector.querySelectorAll('.select-tiles .tile-container').forEach($tile => {
      $tile.addEventListener('click', e => {
        this.onTileSelection(e.currentTarget.dataset.type)
      })
    })

    this.$tile_selector.querySelector('.select-number .number-slider-input').addEventListener('input', e => {
      this.onNumberSlider(e.currentTarget.value)
    }, false)

    this.$tile_selector.querySelectorAll('.select-trade .trade-container').forEach($tile => {
      $tile.addEventListener('click', e => {
        this.onTradeSelection(e.currentTarget.dataset.type)
      })
    })

    // this.$tile_selector.querySelectorAll('.select-trade-direction .trade-container').forEach($tile => {
    //   $tile.addEventListener('click', e => {
    //     this.onTradeSelection(e.currentTarget.dataset.type)
    //   })
    // })

    this.$tile_selector.querySelectorAll('.cancel-container .button').forEach($cancel => {
      $cancel.addEventListener('click', e => {
        $('#game').classList.remove('board--editing')
        this.$tile_selector.classList.remove('open')
        this.$el.querySelector('#toggle-edit-input').checked = false
        this.board_ui.$el.querySelector('.tile.picked')?.classList.remove('picked')
        this.$tile_selector.dataset.mode = "start"
      })
    })
  }

  #setupBoardClickEvent() {
    this.board_ui.$el.querySelectorAll('.tile').forEach($tile => {
      $tile.addEventListener('click', e => {
        if (!$('#game').classList.contains('board--editing')) return
        this.onBoardClick(+e.currentTarget.dataset.id)
      })
    })
  }

  onBoardClick(id) {
    this.board_ui.$el.querySelector('.tile.picked')?.classList.remove('picked')
    this.board_ui.$el.querySelector(`.tile[data-id="${id}"]`).classList.add('picked')
    this.$tile_selector.dataset.mode = "tiles"
    console.log(id)
  }

  onTileSelection(type) {
    if (type === 'S') {
      this.$tile_selector.dataset.mode = "trade"
    } else if(type === 'D') {
      //
    } else {
      this.$tile_selector.dataset.mode = "number"
      this.$tile_selector.dataset.tile = type
    }
  }

  onNumberSlider(value) {
    const num = value > 6 ? +value + 1 : value
    const $slider_thumb = this.$tile_selector.querySelector('.select-number .number-slider-thumb')
    const $tile_num = this.$tile_selector.querySelector('.select-number .tile .number')
    $tile_num.dataset.num = $slider_thumb.dataset.num = num
    $slider_thumb.style.left = `${(value - 2) * 100 / 9}%`
    $tile_num.dataset.dots = '.'.repeat(6 - Math.abs(7 - num))
  }

  onTradeSelection(type) {
    if (type === '--') { return }
    this.$tile_selector.dataset.mode = "trade-direction"
    this.$tile_selector.dataset.tradeType = type
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
    this.#setupBoardClickEvent()
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
