class PlayerUI {
  roll(){}

  build(location){}

  useDevelopmentCard(type, attr){}
}

function renderBoard(board) {
  let startDiff = 0
  const renderedCorners = []
  const renderedEdges = []
  document.querySelector('.board .render').innerHTML = board.tiles.map((row, i) => {
    startDiff += (row.diff || 0)

    return `
      <div class="row row-${i + 1}" style="left:calc(${startDiff} * var(--tile-width)/2)">
        ${row.map((tile, j) =>
          `<div
            class="tile ${tile.type}"
            data-id="T${tile.id}"
            ${
              (tile.type === 'S' && tile.trade_edge)
              ? `data-trade="${tile.trade_type}" data-trade-dir="${tile.trade_edge}"`
              : ''
            }
            style="background-image:url('/images/tiles/${TILES[tile.type]}.png')"
          >
            <div class="corners">
            ${
              Object.keys(tile.corners).map(dir => {
                const corner = tile.corners[dir]
                // if(corner.id == 4) {debugger}
                if (renderedCorners.includes(corner.id)) { return '' }
                renderedCorners.push(corner.id)
                return `<div class="corner" data-id="C${corner.id}" data-dir="${dir}"></div>`
              }).join('')
            }
            </div>
            <div class="edges">
            ${
              Object.keys(tile.corners).map(dir => {
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
                  return `<div class="edge" data-id="E${edge.id}" data-dir="${dir+'-'+e_dir}"></div>`
                }).join('')
              }).join('')
            }
            </div>
          </div>`
        ).join('')}
      </div>
    `
  }).join('')
}
