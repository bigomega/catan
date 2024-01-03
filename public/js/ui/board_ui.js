import * as CONST from "../const.js"
const $ = document.querySelector.bind(document)

export default class BoardUI {
  #socket_actions; board;
  $el = $('#game > .board')

  constructor(board) { this.board = board }

  setSocketActions(sa) {
    this.#socket_actions = sa
  }

  render() {
    let startDiff = 0
    let maxLeft = 0
    let maxLength = 0
    const renderedCorners = []
    const renderedEdges = []

    function _renderCorners(tile) {
      return Object.keys(tile.corners).map(dir => {
        const corner = tile.corners[dir]
        // if (corner.id == 4) {debugger}
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
          ${(tile.type === 'S' && tile.trade_edge)
          ? `data-trade="${tile.trade_type}" data-trade-dir="${tile.trade_edge}"`
          : ''
        }
        >
          <div class="corners">${_renderCorners(tile)}</div>
          <div class="edges">${_renderEdges(tile)}</div>
          ${tile.type === 'S' ? `<div class="beaches">${_renderBeaches(tile)}</div>` : ''}
          ${tile.num
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

    this.$el.innerHTML = this.board.tiles.map((row, i) => {
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

    this.$el.style.paddingLeft = `calc(var(--tile-width) / 2 * ${maxLeft * -1})`
    this.$el.style.width = `calc(var(--tile-width) * ${maxLength})`
    this.#setupEvents()
  }

  #setupEvents() {
    this.$el.querySelectorAll('.corner').forEach($corner => {
      $corner.addEventListener('click', e => {
        if (e.target.classList.contains('shown')) {
          const id = e.target.dataset.id?.replace(/^C/, '')
          this.#socket_actions.sendLocationClick(CONST.LOCS.CORNER, id)
        }
      })
    })
    this.$el.querySelectorAll('.edge').forEach($edge => {
      $edge.addEventListener('click', e => {
        if (e.target.classList.contains('shown')) {
          const id = e.target.dataset.id?.replace(/^E/, '')
          this.#socket_actions.sendLocationClick(CONST.LOCS.EDGE, id)
        }
      })
    })
  }

  #getCorner(id) { return this.$el.querySelector(`.corner[data-id=C${id}]`) }
  #getEdge(id) { return this.$el.querySelector(`.edge[data-id=E${id}]`) }

  showCorners(ids = []) {
    ids.forEach(id => this.#getCorner(id)?.classList.add('shown'))
  }
  showEdges(ids = []) {
    ids.forEach(id => this.#getEdge(id)?.classList.add('shown'))
  }
  showTiles(ids) { }

  hideAllShown() {
    this.$el.querySelectorAll('.corner.shown, .edge.shown').forEach($el => {
      $el.classList.remove('shown')
    })
  }

  build({ type, pid, piece, loc }) {
    if (type === CONST.LOCS.CORNER) {
      const $corner = this.#getCorner(loc)
      if (!$corner) return
      $corner.classList.remove('shown')
      $corner.dataset.taken = piece
      piece === 'S' && $corner.classList.add('taken', `p${pid}`)
    } else if (type === CONST.LOCS.EDGE) {
      const $edge = this.#getEdge(loc)
      if (!$edge) return
      $edge.classList.remove('shown')
      $edge.classList.add('taken', 'p' + pid)
    }
  }
}
