import * as CONST from "/js/const.js"

class PlayerUI {
  roll() { }

  build(location) { }

  useDevelopmentCard(type, attr) { }
}

class UI {
  constructor(board) {
    this.board = board
  }

  render() {
    this.renderBoard()
    this.renderPlayers()
  }

  renderBoard() {
    let startDiff = 0
    let maxLeft = 0
    let maxLength = 0
    const renderedCorners = []
    const renderedEdges = []
    const $board = document.querySelector('.board')

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
        const relevant_edges = ({
          top: ['left', 'right'],
          top_left: ['right', 'bottom'],
          top_right: ['left', 'bottom'],
          bottom_left: ['top', 'right'],
          bottom_right: ['top', 'left'],
          bottom: ['left', 'right'],
        })[dir]
        return relevant_edges.map(e_dir => {
          const edge = corner.edges[e_dir]
          if (!edge || renderedEdges.includes(edge.id)) { return '' }
          renderedEdges.push(edge.id)
          return `<div class="edge" data-id="E${edge.id}" data-dir="${dir + '-' + e_dir}"></div>`
        }).join('')
      }).join('')
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

    $board.innerHTML = this.board.tiles.map((row, i) => {
      startDiff += (row.diff || 0)
      if (startDiff < maxLeft) { maxLeft = startDiff }
      if (row.length > maxLength) { maxLength = row.length }

      return `
        <div class="row row-${i + 1}"
          style="left:calc(${startDiff} * var(--tile-width)/2 + ${startDiff * -1}px); width: calc(var(--tile-width) * ${row.length})"
        >
          ${_renderRow(row)}
        </div>
      `
    }).join('')

    $board.style.paddingLeft = `calc(var(--tile-width) / 2 * ${maxLeft * -1})`
    $board.style.width = `calc(var(--tile-width) * ${maxLength})`
  }

  renderPlayers() {
    const $players = document.querySelector('.player')
    $players.innerHTML = `
      <div class="">${window.player.name}</div>
    `
  }
}
export default UI
