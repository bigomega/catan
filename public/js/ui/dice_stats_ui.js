import * as CONST from "../const.js"
const $ = document.querySelector.bind(document)

const NUMBERS = [...Array(11)].map((_, i) => i + 2)
const waysToRoll = n => 6 - Math.abs(7 - n)
const niceStep = x => {
  const mag = Math.pow(10, Math.floor(Math.log10(x)))
  return Math.max(1, [1, 2, 5, 10].map(m => m * mag).find(s => s >= x))
}

export default class DiceStatsUI {
  #board; #getPlayers
  /** @type {{ pid, d1, d2 }[]} */ rolls = []
  $zone = $('#game > .status-history-zone')
  $el = $('#game > .status-history-zone > .dice-stats')
  $toggle = $('#game > .status-history-zone .view-toggle')

  constructor(board, getPlayers) {
    this.#board = board
    this.#getPlayers = getPlayers
  }

  render() {
    this.$toggle.addEventListener('click', e => this.toggle())
  }

  get shown() { return this.$zone.classList.contains('dice-stats-mode') }

  toggle(show = !this.shown) {
    this.$zone.classList[show ? 'add' : 'remove']('dice-stats-mode')
    this.$toggle.setAttribute('title', `Switch to ${show ? 'Status History' : 'Dice Stats'}`)
    this.update()
  }

  setRolls(rolls = []) { this.rolls = rolls.slice(); this.update() }
  addRoll(pid, d1, d2) { this.rolls.push({ pid, d1, d2 }); this.update() }
  update() { this.shown && this.renderChart() }

  renderChart() {
    const players = this.#getPlayers().filter(p => p?.id).sort((a, b) => a.id - b.id)
    const total_rolls = this.rolls.length
    const counts = Object.fromEntries(NUMBERS.map(n => [n, {}]))
    const rolls_by_pid = {}
    this.rolls.forEach(({ pid, d1, d2 }) => {
      counts[d1 + d2][pid] = (counts[d1 + d2][pid] || 0) + 1
      rolls_by_pid[pid] = (rolls_by_pid[pid] || 0) + 1
    })
    const totalOf = n => Object.values(counts[n]).reduce((mem, v) => mem + v, 0)
    const expectedOf = n => total_rolls * waysToRoll(n) / 36

    const peak = Math.max(4, ...NUMBERS.map(n => Math.max(totalOf(n), expectedOf(n))))
    const step = niceStep(peak / 4)
    const y_max = Math.ceil(peak / step) * step
    const ticks = [...Array(y_max / step + 1)].map((_, i) => i * step)
    const pct = v => `${v / y_max * 100}%`

    this.$el.innerHTML = `
      <div class="legend">
        ${players.map(p => `
          <span class="legend-item"><i class="swatch p${p.id}"></i>${p.name} <small>(${rolls_by_pid[p.id] || 0})</small></span>
        `).join('')}
        <span class="legend-item"><i class="swatch expected"></i>Expected</span>
        <span class="legend-item total">Total Rolls: <b>${total_rolls}</b></span>
      </div>
      <div class="chart">
        <div class="y-title">Occurrences</div>
        <div class="y-axis">
          ${ticks.map(t => `<span class="tick" style="bottom: ${pct(t)}">${t}</span>`).join('')}
        </div>
        <div class="plot">
          ${ticks.map(t => `<div class="grid-line" style="bottom: ${pct(t)}"></div>`).join('')}
          ${NUMBERS.map(n => {
            const total = totalOf(n), expected = expectedOf(n)
            return `
              <div class="column" data-num="${n}">
                <div class="bar" style="height: ${pct(total)}">
                  ${players.filter(p => counts[n][p.id]).map(p => `
                    <div class="segment p${p.id}" style="flex-grow: ${counts[n][p.id]}"
                      title="${p.name}: ${counts[n][p.id]}"></div>
                  `).join('')}
                </div>
                ${total_rolls ? `<div class="expected-bar" style="height: ${pct(expected)}"></div>` : ''}
                <span class="count" style="bottom: ${pct(Math.max(total, expected))}"
                  title="Rolled ${total} · Expected ${expected.toFixed(1)}">${total || ''}</span>
              </div>
            `
          }).join('')}
        </div>
        <div class="x-axis">
          ${NUMBERS.map(n => `
            <div class="x-label">
              <div><b class="${n === 6 || n === 8 ? 'hot' : ''}">${n}</b> <small>(${(waysToRoll(n) / 36 * 100).toFixed(1)}%)</small></div>
              <div class="x-res">${this.#resourcesFor(n)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  #resourcesFor(n) {
    if (n === 7) return `<span title="Robber">🥷</span>`
    const tiles = this.#board.numbers[n] || []
    if (!tiles.length) return `<span class="none">-</span>`
    return tiles.map(tile => {
      const res = CONST.TILE_RES[tile.type]
      const robbed = tile.id === this.#board.robber_loc
      return `<div class="res-icon ${res} ${robbed ? 'robbed' : ''}"
        title="${CONST.RESOURCES[res]}${robbed ? ' (blocked by Robber)' : ''}"></div>`
    }).join('')
  }
}
