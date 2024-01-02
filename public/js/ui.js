import * as CONST from "./const.js"
const $ = document.querySelector.bind(document)

class PlayerUI {
  roll() { }

  build(location) { }

  useDevelopmentCard(type, attr) { }
}

class UI {
  board; player; opponents; timer; socket_actions;
  $board = $('#game > .board')

  constructor(board, player, opponents) {
    this.board = board
    this.player = player
    this.opponents = opponents
  }

  setSocketActions(sa) { this.socket_actions = sa }

  render() {
    this.renderBoard()
    this.renderAllPlayers()
    this.renderCurrentPlayer()
    $('.splash').classList.add('hide')
  }

  renderBoard() {
    let startDiff = 0
    let maxLeft = 0
    let maxLength = 0
    const renderedCorners = []
    const renderedEdges = []

    function _renderCorners(tile) {
      return Object.keys(tile.corners).map(dir => {
        const corner = tile.corners[dir]
        // if(corner.id == 4) {debugger}
        let $_trade = ''
        if (tile.type === 'S' && tile.trade_edge && corner.trade) {
          $_trade = `<div class="trade-post p-${dir}"></div>`
        }
        if (renderedCorners.includes(corner.id)) { return $_trade }
        renderedCorners.push(corner.id)
        return `<div class="corner" data-id="C${corner.id}" data-dir="${dir}"></div>
          ${$_trade}
        `
      }).join('')
    }

    function _renderEdges(tile) {
      return Object.keys(tile.corners).map(dir => {
        const corner = tile.corners[dir]
        const relevant_edges = {
          top: ['left', 'right'],
          top_left: ['bottom'],
          top_right: ['bottom'],
          // bottom_left: ['top', 'right'],
          // bottom_right: ['top', 'left'],
          bottom: ['left', 'right'],
        }[dir]
        return relevant_edges?.map(e_dir => {
          const edge = corner.edges[e_dir]
          if (!edge || renderedEdges.includes(edge.id)) { return '' }
          renderedEdges.push(edge.id)
          let css_dir = dir + '-' + e_dir
          if (e_dir === 'bottom') {
            css_dir = {
              'top_left': 'left',
              'top_right': 'right',
            }[dir]
          }
          return `<div class="edge" data-id="E${edge.id}" data-dir="${css_dir}"></div>`
        }).join('')
      }).join('')
    }

    function _renderBeaches(tile) {
      return Object.keys(tile.adjacent_tiles).map(dir =>
        (tile.adjacent_tiles[dir] && tile.adjacent_tiles[dir].type !== 'S')
          ? `<div class="beach beach-${Math.floor(Math.random() * 3) + 1} beach-${dir}"></div>`
          : ''
      ).join('')
    }

    function _renderRow(row) {
      return row.map((tile, j) =>
        `<div
          class="tile ${tile.type}"
          data-id="T${tile.id}"
          ${
            (tile.type === 'S' && tile.trade_edge)
            ? `data-trade="${tile.trade_type}" data-trade-dir="${tile.trade_edge}"`
            : ''
          }
        >
          <div class="corners">${_renderCorners(tile)}</div>
          <div class="edges">${_renderEdges(tile)}</div>
          ${tile.type === 'S' ? `<div class="beaches">${_renderBeaches(tile)}</div>` : ''}
          ${
            tile.num
            ? `<div
                class="number ${tile.num > 5 && tile.num < 9 ? 'red' : ''}"
                num="${tile.num}"
                dots="${'.'.repeat(6 - Math.abs(7 - tile.num))}">
              </div>`
            : ''
          }
        </div>`
      ).join('')
    }

    this.$board.innerHTML = this.board.tiles.map((row, i) => {
      startDiff += (row.diff || 0)
      if (startDiff < maxLeft) { maxLeft = startDiff }
      if (row.length > maxLength) { maxLength = row.length }

      return `
        <div class="row row-${i + 1}"
          style="left:calc(${startDiff} * var(--tile-width)/2 + ${startDiff * -1}px);
            width: calc(var(--tile-width) * ${row.length})"
        >
          ${_renderRow(row)}
        </div>
      `
    }).join('')

    this.$board.style.paddingLeft = `calc(var(--tile-width) / 2 * ${maxLeft * -1})`
    this.$board.style.width = `calc(var(--tile-width) * ${maxLength})`
    this.setupEvents()
  }

  setupEvents() {
    this.$board.querySelectorAll('.corner').forEach($corner => {
      $corner.addEventListener('click', e => {
        if (e.target.classList.contains('shown')) {
          const id = e.target.dataset.id?.replace(/^C/, '')
          this.socket_actions.sendLocationClick(CONST.LOCS.CORNER, id)
        }
      })
    })
    this.$board.querySelectorAll('.edge').forEach($edge => {
      $edge.addEventListener('click', e => {
        if (e.target.classList.contains('shown')) {
          const id = e.target.dataset.id?.replace(/^E/, '')
          this.socket_actions.sendLocationClick(CONST.LOCS.EDGE, id)
        }
      })
    })
  }

  renderAllPlayers() {
    $('#game > .all-players').innerHTML = [this.player, ...this.opponents].map(opp => `
      <div class="player id-${opp.id}">
        <div class="name">${opp.name}</div>
        <div class="victory-points"><span>${opp.public_vps}</span></div>
        <!--<div class="open-dev-cards"></div>
        <div class="extra-vps"></div>
        <div class="hand">
          <div class="header">HAND</div>
          <div class="resources">
            <div class="count">${opp.resource_count}</div>
          </div>
          <div class="development-cards">
            <div class="count">${opp.dev_card_count}</div>
          </div>
        </div>-->
      </div>
    `).join('')
  }

  renderCurrentPlayer() {
    $('#game > .current-player').classList.add('id-'+this.player.id)
    $('#game > .current-player .actions').innerHTML = `
      <div class="timer">0:00</div>
      <div class="roll-dice disabled" title="Roll Dice (SPACE)">🎲🎲</div>
      <div class="build-road disabled" title="Build Road (R)"><div></div></div>
      <div class="build-settlement disabled" title="Build Settlement (S)">
        <img src="/images/pieces/settlement-${this.player.id}.png"/>
      </div>
      <div class="build-city disabled" title="Build City (C)">
        <img src="/images/pieces/city-${this.player.id}.png"/>
      </div>
      <div class="dev-card disabled" title="Buy Development Card (D)">
        <img src="/images/dc-back.png"/>
      </div>
      <div class="trade">Trade</div>
      <div class="end-turn" title="End Turn (E)">End Turn</div>
    `
  }

  setStatus(message) {
    $('#game .current-player .status-bar').innerHTML = message.replace(/<br\/?>/g, '. ')
  }

  alert(message) {
    $('#game > .alert').classList.add('show')
    $('#game > .alert .parchment').innerHTML = message
    $('#game > .alert .text').innerHTML = message
    setTimeout(_ => {
      $('#game > .alert').classList.remove('show')
    }, 3000)
    this.setStatus(message)
  }

  setTimer(time_in_seconds) {
    this.timer && clearInterval(this.timer)
    time_in_seconds--
    this.timer = setInterval(_ => {
      const seconds = time_in_seconds % 60
      const minutes = Math.floor(time_in_seconds / 60)
      const time_text = minutes + ':' + ('0' + seconds).slice(-2)
      $('#game .current-player .timer').innerHTML = time_text
      --time_in_seconds < 0 && clearInterval(this.timer)
    }, 1000)
  }

  showCorners(ids = []) {
    ids.forEach(id => {
      $(`.corner[data-id=C${id}]`)?.classList.add('shown')
    })
  }

  showEdges(ids = []) {
    ids.forEach(id => {
      $(`.edge[data-id=E${id}]`)?.classList.add('shown')
    })
  }

  showTiles(ids) {}

  hideAllShown() {
    this.$board.querySelectorAll('.corner.shown, .edge.shown').forEach($el => {
      $el.classList.remove('shown')
    })
  }

  build({ type, pid, piece, loc }) {
    if (type === CONST.LOCS.CORNER) {
      const $corner = $(`.corner[data-id=C${loc}]`)
      if(!$corner) return
      $corner.classList.remove('shown')
      $corner.dataset.taken = piece
      piece === 'S' && $corner.classList.add('taken', `p${pid}`)
    } else if (type === CONST.LOCS.EDGE) {
      const $edge = $(`.edge[data-id=E${loc}]`)
      if(!$edge) return
      $edge.classList.remove('shown')
      $edge.classList.add('taken', 'p' + pid)
    }
  }
}
export default UI
