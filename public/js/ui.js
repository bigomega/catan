import Board from "./board/board.js"
import * as CONST from "./const.js"
import SocketActions from "./socket_actions.js"
import AllPlayersUI from "./ui/all_players_ui.js"
import BoardUI from "./ui/board_ui.js"
import PlayerUI from "./ui/player_ui.js";
const $ = document.querySelector.bind(document)
const ST = CONST.GAME_STATES

export default class UI {
  /** @type {SocketActions} */
  #socket_actions;
  #initial_setup; board; player; opponents; alert_timer;
  active_player_id;
  player_ui; board_ui; game_state;
  #temp = {}
  #robber_drop_res = {}
  possible_locations = { R: [], S: [], C: [] }
  $splash = $('.splash')
  $alert = $('#game > .alert')
  $alert_parchment = $('#game > .alert .parchment')
  $alert_text = $('#game > .alert .text')
  $robber_drop = $('#game > .robber-drop-zone')

  /** @param {Board} board  */
  constructor(board, player, opponents) {
    this.board = board
    this.player = player
    this.opponents = opponents
    this.board_ui = new BoardUI(board, this.#onBoardClick.bind(this))
    this.player_ui = new PlayerUI(player, this)
    this.all_players_ui = new AllPlayersUI(player, opponents, this)
  }

  setSocketActions(sa) { this.#socket_actions = sa }

  render() {
    this.board_ui.render()
    this.player_ui.render()
    this.all_players_ui.render()
    this.$splash.classList.add('hide')
  }

  alert(message, no_status) {
    this.$alert.classList.add('show')
    this.$alert_parchment.innerHTML = message
    this.$alert_text.innerHTML = message
    clearTimeout(this.alert_timer)
    this.alert_timer = setTimeout(_ => {
      this.$alert.classList.remove('show')
    }, CONST.GAME_CONFIG.alert.time * 1000)
    no_status || this.setStatus(message)
  }

  showDiceValue() {
    // Animation + Visuals
  }

  updateAllPossibleLocations() {
    // Roads
    this.possible_locations.R = this.board.getRoadLocationsFromRoads(this.player.pieces.R)
    // Settlements
    this.possible_locations.S = this.board.getSettlementLocationsFromRoads(this.player.pieces.R)
    // Cities
    this.possible_locations.C = this.player.pieces.S.slice(0)
  }

  getPossibleLocations(piece) {
    if (!CONST.PIECES[piece]) return []
    return this.possible_locations[piece]
  }

  isCurrentPlayerInvolvedAndActing(pid) {
    return pid === this.player.id
      && pid === this.active_player_id
      && this.game_state === ST.PLAYER_ACTIONS
  }

  renderRobberDrop(count) {
    const holding_res = Object.entries(this.player.closed_cards).filter(([k, v]) => v).map(([k]) => k)
    this.#robber_drop_res = Object.fromEntries(holding_res.map(k => [k,0]))
    this.#robber_drop_res._total = 0
    this.#robber_drop_res._goal = count
    this.$robber_drop.innerHTML = `
      <div class="drop-zone">
        ${holding_res.map(k => `
          <div class="drop-card" data-type="${k}" data-count="0"></div>
        `).join('')}
        <div class="drop-actions">
          <div class="drop-emoji">🥷</div>
          <div class="dropped-count" data-count="0">
            ${[...Array(count)].map((_, i) => `
              <div class="dropped-count-light l-${i}"
                style="transform:rotate(${((360)*i/count)}deg)"></div>
            `).join('')}
          </div>
          <div class="drop-give-button">Let Go!</div>
        </div>
      </div>
    `
    this.$robber_drop.querySelector('.drop-emoji').addEventListener('click', e => {
      this.#socket_actions.playAudio(CONST.AUDIO_FILES.ROBBER)
    })
    this.$robber_drop.querySelector('.drop-give-button').addEventListener('click', e => {
      if (!e.target.classList.contains('active')) return
      const clean_obj = Object.fromEntries(Object.entries(this.#robber_drop_res)
        .filter(([k]) => CONST.RESOURCES[k]))
      this.#socket_actions.sendRobberDrop(clean_obj)
    })
    this.$robber_drop.querySelectorAll('.drop-card').forEach($el => {
      $el.addEventListener('click', e => {
        if (!+$el.dataset.count) return
        const type = $el.dataset.type
        if (this.#robber_drop_res[type] === undefined) return
        this.#robber_drop_res[type] -= 1
        this.#robber_drop_res._total -= 1
        this.updateRobberDropCount()
        this.player_ui.toggleHandResource(type, true)
      })
    })
  }

  updateRobberDropCount() {
    Object.entries(this.#robber_drop_res).forEach(([key, value]) => {
      if (key === '_goal') {
        const goal_reached = value == this.#robber_drop_res._total
        this.$robber_drop.querySelector('.drop-give-button').classList[goal_reached?'add':'remove']('active')
      } else if (key === '_total') {
        this.$robber_drop.querySelector(`.dropped-count`).dataset.count = value
        this.$robber_drop.querySelectorAll(`.dropped-count .dropped-count-light`).forEach(($el, i) => {
          if (i < value) $el.classList.add('on')
          else $el.classList.remove('on')
        })
      } else {
        const $drop = this.$robber_drop.querySelector(`.drop-card[data-type="${key}"]`)
        $drop.dataset.count = value
        $drop.classList[value?'add':'remove']('valued')
      }
    })
  }

  /**------------------------------
   * --- Player & AllPlayers UI ---
   */
  // To UI
  updatePlayer(update_player, key, context) {
    this.all_players_ui.updatePlayer(update_player, key)
    if (key.includes('closed_cards') && context && this.player.id == update_player.id) {
      this.player_ui.updateHand(update_player, context)
    }
    this.player.id === update_player.id && this.player.update(update_player)
    if (this.isCurrentPlayerInvolvedAndActing(update_player.id)) {
      this.player_ui.checkAndToggleActions(true)
    }
  }

  toggleActions(bool) {
    bool && this.updateAllPossibleLocations()
    this.player_ui.checkAndToggleActions(bool)
  }

  robberDrop(count) {
    this.renderRobberDrop(count)
    this.player_ui.activateResourceCards()
  }

  hideRobberDrop() { this.$robber_drop.innerHTML = "" }

  setStatus(message) { this.player_ui.setStatus(message) }
  appendStatus(message) { this.player_ui.appendStatus(message) }
  setTimer(t, pid) { this.player_ui.resetRenderTimer(t, pid) }
  setDevCardCount(n) { this.player_ui.setDevCardCount(n) }
  toggleDice(bool) { this.player_ui.toggleDice(bool) }

  // From UI
  onPieceClick(piece, is_active) {
    this.hideAllShown()
    if (is_active) return
    const locs = this.getPossibleLocations(piece)
    piece === 'R' ? this.showEdges(locs) : this.showCorners(locs)
  }

  onCardClick(type) {
    if (this.game_state === ST.ROBBER_DROP) {
      if (this.#robber_drop_res._total >= this.#robber_drop_res._goal) return
      if (this.#robber_drop_res[type] === undefined) return
      if (!this.player_ui.toggleHandResource(type)) return
      this.#robber_drop_res[type] += 1
      this.#robber_drop_res._total += 1
      this.updateRobberDropCount()
    }
  }

  onDiceClick() { this.#socket_actions.sendDiceClick() }
  onBuyDevCardClick() { this.#socket_actions.buyDevCard() }
  saveStatus(text) { this.#socket_actions.saveStatus(text) }
  endTurn() { this.#socket_actions.endTurn() }

  /**----------------
   * --- Board UI ---
   */
  updateExistingBoard() {
    this.board.existing_changes.forEach(({ pid, piece, loc }) => {
      this.build(pid, piece, loc)
    })
  }

  showInitialBuild() {
    this.#temp = {}
    this.#initial_setup = true
    this.showCorners(this.board.getSettlementLocations(-1).map(s => s.id))
  }

  showRobberMovement() { this.showTiles(this.board.getRobbableTiles()) }

  build(pid, piece, loc) {
    this.hideAllShown()
    this.board.build(pid, piece, loc)
    this.board_ui.build(pid, piece, loc)

    if (this.isCurrentPlayerInvolvedAndActing(pid)) {
      this.updateAllPossibleLocations()
    }
  }

  moveRobber(id) {
    this.board.moveRobber(id)
    this.board_ui.moveRobber(id)
  }

  #onBoardClick(location_type, id) {
    this.hideAllShown()
    if (this.#initial_setup && this.game_state === ST.INITIAL_SETUP) {
      if (location_type === 'C') {
        this.showCorners([id])
        this.#temp.settlement_loc = id
        this.showEdges(this.board.findCorner(id)?.getEdges(-1).map(e => e.id))
      } else if (location_type === 'E') {
        this.#temp.road_loc = id
        this.#socket_actions.sendInitialSetup(this.#temp)
        this.#initial_setup = false
      }
      return
    }
    if (this.game_state === ST.ROBBER_MOVE) {
      if (location_type === 'T') {
        const opp_taken_corners = this.board.findTile(id)?.getAllCorners()
          .filter(c => c.piece && (c.player_id !== this.player.id))
        const taken_oppponents_count = [...new Set(opp_taken_corners.map(_ => _.player_id))].length
        if (taken_oppponents_count > 1) {
          this.#temp = { _robber_tile: id }
          this.showCorners(opp_taken_corners.map(_ => _.id))
        } else {
          this.#socket_actions.sendRobberMove(id)
        }
      } else if (location_type === 'C') {
        const stolen_pid = this.board.findCorner(id).player_id
        this.#socket_actions.sendRobberMove(this.#temp._robber_tile, stolen_pid)
      }
      return
    }
    // Normal Actions
    this.#socket_actions.sendLocationClick(location_type, id)
  }

  showCorners(ids) { this.board_ui.showCorners(ids) }
  showEdges(ids) { this.board_ui.showEdges(ids) }
  showTiles(ids) { this.board_ui.showTiles(ids) }
  hideAllShown() { this.board_ui.hideAllShown() }
}
