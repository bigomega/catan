import * as CONST from "./const.js"
import AllPlayersUI from "./ui/all_players_ui.js"
import BoardUI from "./ui/board_ui.js"
import PlayerUI from "./ui/player_ui.js";
const $ = document.querySelector.bind(document)

export default class UI {
  #socket_actions; board; player; opponents;
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
    setTimeout(_ => {
      this.$alert.classList.remove('show')
    }, 3000)
    this.setStatus(message)
  }

  // Player & AllPlayers UI
  setStatus(message) { this.player_ui.setStatus(message) }
  setTimer(t) { this.player_ui.setTimer(t) }
  updatePlayer(update_player, key) {
    console.log(update_player, key)
    this.all_players_ui.updatePlayer(update_player, key)
    if (this.player === update_player.id) {
      // this.player_ui.
    }
  }

  // Board UI
  showCorners(ids) { this.board_ui.showCorners(ids) }
  showEdges(ids) { this.board_ui.showEdges(ids) }
  showTiles(ids) {}
  hideAllShown() { this.board_ui.hideAllShown() }
  build(obj) { this.board_ui.build(obj) }
}
