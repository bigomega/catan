import * as CONST from "./const.js"
import AllPlayersUI from "./ui/all_players_ui.js"
import BoardUI from "./ui/board_ui.js"
import PlayerUI from "./ui/player_ui.js";
const $ = document.querySelector.bind(document)

export default class UI {
  #socket_actions; board; player; opponents; alert_timer;
  player_ui; board_ui;
  $splash = $('.splash')
  $alert = $('#game > .alert')
  $alert_parchment = $('#game > .alert .parchment')
  $alert_text = $('#game > .alert .text')

  constructor(board, player, opponents) {
    this.board = board
    this.player = player
    this.opponents = opponents
    this.board_ui = new BoardUI(board)
    this.player_ui = new PlayerUI(player)
    this.all_players_ui = new AllPlayersUI(player, opponents)
  }

  setSocketActions(sa) {
    this.#socket_actions = sa
    this.player_ui.setSocketActions(sa)
    this.board_ui.setSocketActions(sa)
  }

  render() {
    this.board_ui.render()
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

  // Player & AllPlayers UI
  setStatus(message) { this.player_ui.setStatus(message) }
  appendStatus(message) { this.player_ui.appendStatus(message) }
  setTimer(t) { this.player_ui.setTimer(t) }
  updatePlayer(update_player, key, context) {
    this.all_players_ui.updatePlayer(update_player, key, context)
    if (this.player.id === update_player.id && key === 'closed_cards') {
      this.player_ui.updateHand(update_player, context)
    }
  }
  toggleDice(bool) { this.player_ui.toggleDice(bool) }

  // Board UI
  showCorners(ids) { this.board_ui.showCorners(ids) }
  showEdges(ids) { this.board_ui.showEdges(ids) }
  showTiles(ids) {}
  hideAllShown() { this.board_ui.hideAllShown() }
  build(obj) { this.board_ui.build(obj) }
}
