import * as CONST from "./const.js"
import AllPlayersUI from "./ui/all_players_ui.js"
import BoardUI from "./ui/board_ui.js"
import PlayerUI from "./ui/player_ui.js";
const $ = document.querySelector.bind(document)

export default class UI {
  #initial_setup; #socket_actions; board; player; opponents; alert_timer;
  player_ui; board_ui;
  #temp = {}
  $splash = $('.splash')
  $alert = $('#game > .alert')
  $alert_parchment = $('#game > .alert .parchment')
  $alert_text = $('#game > .alert .text')

  constructor(board, player, opponents) {
    this.board = board
    this.player = player
    this.opponents = opponents
    this.board_ui = new BoardUI(board, this.#onBoardClick.bind(this))
    this.player_ui = new PlayerUI(player, this)
    this.all_players_ui = new AllPlayersUI(player, opponents, this)
  }

  setSocketActions(sa) {
    this.#socket_actions = sa
    this.player_ui.setSocketActions(sa)
  }

  render() {
    this.board_ui.render()
    this.updateExistingBoard()
    this.player_ui.render()
    this.all_players_ui.render()
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


  /**------------------------------
   * --- Player & AllPlayers UI ---
   */
  setStatus(message) { this.player_ui.setStatus(message) }
  appendStatus(message) { this.player_ui.appendStatus(message) }
  setTimer(t, pid) { this.player_ui.resetRenderTimer(t, pid) }
  updatePlayer(update_player, key, context) {
    this.all_players_ui.updatePlayer(update_player, key)
    if (context && key === 'closed_cards') {
      this.player_ui.updateHand(update_player, context)
    }
  }
  toggleDice(bool) { this.player_ui.toggleDice(bool) }
  toggleActions(bool) { this.player_ui.checkAndToggleActions(bool) }

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
    // update player data
  }

  #onBoardClick(location_type, id) {
    if (this.#initial_setup) {
      this.hideAllShown()
      if (location_type === 'C') {
        this.showCorners([id])
        this.#temp.settlement_loc = id
        this.showEdges(this.board.findCorner(id)?.getEdges(-1).map(e => e.id))
      } else if (location_type === 'E') {
        this.#temp.road_loc = id
        this.#socket_actions.sendInitialSetup(this.#temp)
        this.#initial_setup = false
      }
    }
  }

  showCorners(ids) { this.board_ui.showCorners(ids) }
  showEdges(ids) { this.board_ui.showEdges(ids) }
  showTiles(ids) {}
  hideAllShown() { this.board_ui.hideAllShown() }
}
