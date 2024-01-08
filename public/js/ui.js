import Board from "./board/board.js"
import * as CONST from "./const.js"
import AllPlayersUI from "./ui/all_players_ui.js"
import BoardUI from "./ui/board_ui.js"
import PlayerUI from "./ui/player_ui.js";
const $ = document.querySelector.bind(document)

export default class UI {
  #initial_setup; #socket_actions; board; player; opponents; alert_timer;
  player_ui; board_ui;
  #temp = {}
  possible_locations = { R: [], S: [], C: [] }
  $splash = $('.splash')
  $alert = $('#game > .alert')
  $alert_parchment = $('#game > .alert .parchment')
  $alert_text = $('#game > .alert .text')

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

    this.updateExistingBoard()
    this.$splash.classList.add('hide')
  }

  alert(message) {
    this.$alert.classList.add('show')
    this.$alert_parchment.innerHTML = message
    this.$alert_text.innerHTML = message
    clearTimeout(this.alert_timer)
    this.alert_timer = setTimeout(_ => {
      this.$alert.classList.remove('show')
    }, CONST.GAME_CONFIG.alert.time * 1000)
    this.setStatus(message)
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

  /**------------------------------
   * --- Player & AllPlayers UI ---
   */
  setStatus(message) { this.player_ui.setStatus(message) }
  appendStatus(message) { this.player_ui.appendStatus(message) }
  setTimer(t, pid) { this.player_ui.resetRenderTimer(t, pid) }
  updatePlayer(update_player, key, context) {
    this.all_players_ui.updatePlayer(update_player, key)
    if (key === 'closed_cards' && context) {
      this.player_ui.updateHand(update_player, context)
    }
    this.player.id === update_player.id && this.player.update(update_player)
  }
  toggleDice(bool) { this.player_ui.toggleDice(bool) }
  toggleActions(bool) {
    bool && this.updateAllPossibleLocations()
    this.player_ui.checkAndToggleActions(bool)
  }

  onDiceClick() { this.#socket_actions.sendDiceClick() }

  onPieceClick(piece) {
    this.hideAllShown()
    const locs = this.getPossibleLocations(piece)
    piece === 'R' ? this.showEdges(locs) : this.showCorners(locs)
  }

  saveStatus(text) { this.#socket_actions.saveStatus(text) }

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

  build(pid, piece, loc) {
    this.hideAllShown()
    this.board.build(pid, piece, loc)
    this.board_ui.build(pid, piece, loc)
    if (pid === this.player.id && this.#socket_actions?.state === CONST.GAME_STATES.PLAYER_ACTIONS) {
      this.toggleActions(true)
    }
  }

  #onBoardClick(location_type, id) {
    this.hideAllShown()
    if (this.#initial_setup) {
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
    this.#socket_actions.sendLocationClick(location_type, id)
  }

  showCorners(ids) { this.board_ui.showCorners(ids) }
  showEdges(ids) { this.board_ui.showEdges(ids) }
  showTiles(ids) {}
  hideAllShown() { this.board_ui.hideAllShown() }
}
