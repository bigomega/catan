import Board from "../board/board.js"
import * as CONST from "../const.js"
const $ = document.querySelector.bind(document)
const oKeys = Object.keys

export default class BoardUI {
  #board; #onClick;
  #size = { MIN: -7, MAX: 2 }
  #renderedCorners = []
  #renderedEdges = []
  $el = $('#game .board')

  /** @param {Board} board  */
  constructor(board, onClick, size) {
    this.#board = board
    this.#onClick = onClick
    this.#size = size || this.#size
  }

  toggleBlur(bool) { this.$el.classList[bool ? 'add' : 'remove']('blur') }

  render() {
    /** @todo fix the variable names base on convention */
    let startDiff = 0
    let maxLeft = 0
    let maxLength = 0

    this.$el.innerHTML = this.#board.tile_rows.map((row, i) => {
      startDiff += (row.diff || 0)
      if (startDiff < maxLeft) { maxLeft = startDiff }
      if (row.length > maxLength) { maxLength = row.length }

      return `
        <div class="row row-${i + 1}"
          style="left:calc(${startDiff} * var(--tile-width)/2 + ${startDiff * -1}px);
            width: calc(var(--tile-width) * ${row.length})"
        >
          ${this.renderRow(row)}
        </div>
      `
    }).join('')

    this.$el.style.paddingLeft = `calc(var(--tile-width) / 2 * ${maxLeft * -1})`
    this.$el.style.width = `calc(var(--tile-width) * ${maxLength})`
    const size = localStorage.getItem('board-size')
    this.$el.dataset.size = (size >= this.#size.MIN && size <= this.#size.MAX) ? size : 0
    this.#setupEvents()
  }

  renderRow(row) {
    return row.map((tile, j) =>
      `<div
        class="tile ${tile.type} ${tile.robbed ? 'robbed' : ''}"
        data-id="${tile.id}"
        ${(tile.type === 'S' && tile.trade_edge)
        ? `data-trade="${tile.trade_type}" data-trade-dir="${tile.trade_edge}"`
        : ''
      }
      >
        <div class="background"></div>
        <div class="corners">${this.renderCorners(tile)}</div>
        <div class="edges">${this.renderEdges(tile)}</div>
        ${tile.type === 'S' ? `<div class="beaches">${this.renderBeaches(tile)}</div>` : ''}
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

  renderCorners(tile) {
    return oKeys(tile.corners).map(dir => {
      const corner = tile.corners[dir]
      // if (corner.id == 4) {debugger}
      let $_trade = ''
      if (tile.type === 'S' && tile.trade_edge && corner.trade
        && CONST.DIR_HELPER.EDGE_TO_CORNERS[tile.trade_edge].includes(dir)) {
        $_trade = `<div class="trade-post p-${dir}"></div>`
      }
      if (this.#renderedCorners.includes(corner.id)) { return $_trade }
      this.#renderedCorners.push(corner.id)
      return `<div class="corner" data-id="${corner.id}" data-dir="${dir}"></div>
        ${$_trade}
      `
    }).join('')
  }

  renderEdges(tile) {
    return oKeys(tile.corners).map(dir => {
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
        if (!edge || this.#renderedEdges.includes(edge.id)) { return '' }
        this.#renderedEdges.push(edge.id)
        let css_dir = dir + '-' + e_dir
        if (e_dir === 'bottom') {
          css_dir = {
            'top_left': 'left',
            'top_right': 'right',
          }[dir]
        }
        return `<div class="edge" data-id="${edge.id}" data-dir="${css_dir}"></div>`
      }).join('')
    }).join('')
  }

  renderBeaches(tile) {
    return oKeys(tile.adjacent_tiles).map(dir =>
      (tile.adjacent_tiles[dir] && tile.adjacent_tiles[dir].type !== 'S')
        ? `<div class="beach beach-${Math.floor(Math.random() * 3) + 1} beach-${dir}"></div>`
        : ''
    ).join('')
  }

  #setupEvents() {
    this.$el.querySelectorAll('.corner').forEach($corner => {
      $corner.addEventListener('click', e => {
        if (!e.target.classList.contains('shown')) return
        this.#onClick(CONST.LOCS.CORNER, +e.target.dataset.id)
      })
    })
    this.$el.querySelectorAll('.edge').forEach($edge => {
      $edge.addEventListener('click', e => {
        if (!e.target.classList.contains('shown')) return
        this.#onClick(CONST.LOCS.EDGE, +e.target.dataset.id)
      })
    })
    this.$el.querySelectorAll('.background, .number').forEach($tile => {
      $tile.addEventListener('click', e => {
        if (!e.target.parentElement.classList.contains('shown')) return
        this.#onClick(CONST.LOCS.TILE, +e.target.parentElement.dataset.id)
      })
    })
  }

  build(pid, piece, location) {
    if (piece === 'S' || piece === 'C') {
      const $corner = this.#$getCorner(location)
      if (!$corner) return
      $corner.classList.remove('shown')
      piece === 'S' && $corner.classList.add('taken', `p${pid}`)
      setTimeout(_ => { $corner.dataset.taken = piece }, 200) // For animation
    } else if (piece === 'R') {
      const $edge = this.#$getEdge(location)
      $edge?.classList.remove('shown')
      $edge?.classList.add('taken')
      setTimeout(_ => $edge?.classList.add('p' + pid), 100) // For animation
    }
  }

  moveRobber(id) {
    this.$el.querySelector('.tile.robbed')?.classList.remove('robbed')
    this.$el.querySelector('.tile.robber-animate')?.classList.remove('robber-animate')
    this.#$getTile(id)?.classList.add('robbed', 'robber-animate')
    setTimeout(_ => this.$el.querySelector('.tile.robber-animate')?.classList.remove('robber-animate'), 200)
  }

  toggleZoom(out) {
    const size = (+this.$el.dataset.size || 0) + (out ? -1 : 1)
    if (size >= this.#size.MIN && size <= this.#size.MAX) {
      this.$el.dataset.size = size
      localStorage.setItem('board-size', size)
    }
  }

  #$getCorner(id) { return this.$el.querySelector(`.corner[data-id="${id}"]`) }
  #$getEdge(id) { return this.$el.querySelector(`.edge[data-id="${id}"]`) }
  #$getTile(id) { return this.$el.querySelector(`.tile[data-id="${id}"]`) }

  showCorners(ids = []) { ids.forEach(id => this.#$getCorner(id)?.classList.add('shown')) }
  showEdges(ids = []) { ids.forEach(id => this.#$getEdge(id)?.classList.add('shown')) }
  showTiles(ids = []) { ids.forEach(id => this.#$getTile(id)?.classList.add('shown')) }

  showLongestEdges(ids = []) { ids.forEach(id => this.#$getEdge(id)?.classList.add('longest')) }

  animateRobber() {
    this.$el.querySelector('.tile.robbed')?.classList.add('robber-animate')
  }

  hideAllShown() {
    this.$el.querySelectorAll('.corner.shown, .edge.shown, .tile.shown').forEach($el => {
      $el.classList.remove('shown')
    })
    this.hideLongestRoads()
  }
  hideLongestRoads() {
    this.$el.querySelectorAll('.edge.longest').forEach($el => $el.classList.remove('longest'))
  }
}
