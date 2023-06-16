class PlayerUI {
  roll(){}

  build(location){}

  useDevelopmentCard(type, attr){}
}

function render(board) {
  let startDiff = 0
  document.querySelector('.board .render').innerHTML = board.tiles.map((row, i) => {
    startDiff += (row.diff || 0)

    return `
      <div class="row row-${i + 1}" style="left:calc(${startDiff} * var(--tile-width)/2)">
        ${row.map(tile =>
          `<div
            class="tile ${tile.type}"
            data-id="${tile.id}"
            ${
              (tile.type === 'S' && tile.trade_edge)
              ? `data-trade="${tile.trade_type}" data-trade-dir="${tile.trade_edge}"`
              : ''
            }
            style="background-image:url('/images/tiles/${TILES[tile.type]}.png')"
          ></div>`
        ).join('')}
      </div>
    `
  }).join('')
}
