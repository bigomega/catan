import Board from "../board/board.js"
import Game from "../game.js"
import Player from "../player/player.js"
import BoardUI from "./board_ui.js"
import PlayerUI from "./player_ui.js"
import AlertUI from "./alert_ui.js"
import RobberDropUI from "./robber_drop_ui.js"
import AllPlayersUI from "./all_players_ui.js"
import TradeUI from "./trade_ui.js"
const $ = document.querySelector.bind(document)

export default class UI {
  #game; #board; #player
  board_ui; player_ui; alert_ui; trade_ui
  #temp = {}
  $splash = $('.splash')

  /** @param {Game} game, @param {Board} board, @param {Player} player  */
  constructor(game, board, player, opponents) {
    this.#game = game
    this.#board = board
    this.#player = player
    this.board_ui = new BoardUI(board, (loc, id) => game.onBoardClick(loc, id))
    this.player_ui = new PlayerUI(player, {
      onDiceClick: _ => game.onDiceClick(),
      onPieceClick: (piece, is_active) => game.onPieceClick(piece, is_active),
      onBuyDevCardClick: _ => game.onBuyDevCardClick(),
      onTradeClick: hide => hide ? this.trade_ui.clearSelections() : this.trade_ui.renderTrade(),
      onEndTurnClick: _ => game.onEndTurn(),
      onCardClick: type => game.onCardClick(type),
      getPossibleLocations: p => game.getPossibleLocations(p),
    })
    this.alert_ui = new AlertUI(player, st => this.#game.saveStatus(st), game.config.alert.time)
    this.robber_drop_ui = new RobberDropUI({
      onDropSubmit: res => game.onGiveToRobber(res),
      onTakenBack: type => this.player_ui.toggleHandResource(type, true),
      playRobberAudio: _ => game.playRobberAudio(),
    })
    this.all_players_ui = new AllPlayersUI(player, opponents)
    this.trade_ui = new TradeUI(player, {
      onTradeProposal: (...params) => game.onTradeProposal(...params),
      onTradeResponse: (id, resp) => game.onTradeResponse(id, resp),
    })
  }

  render() {
    this.board_ui.render()
    this.player_ui.render()
    this.all_players_ui.render()
    this.alert_ui.render()
    this.trade_ui.render()
    this.$splash.classList.add('hide')
  }

  showDiceValue() {
    // Animation + Visuals
  }

  robberDrop(count) {
    this.board_ui.toggleHide(true)
    this.robber_drop_ui.render(count, this.#player.closed_cards)
    this.player_ui.activateResourceCards()
  }

  build(pid, piece, loc) {
    this.hideAllShown()
    this.board_ui.build(pid, piece, loc)
  }

  moveRobber(id) {
    this.hideAllShown()
    this.board_ui.moveRobber(id)
  }

  toggleActions(bool) {
    bool && this.#game.updateAllPossibleLocations()
    this.player_ui.checkAndToggleActions(bool)
  }

  setTimer(t, pid) { this.player_ui.resetRenderTimer(t, pid) }
  showCorners(ids) { this.player_ui.toggleHandBlur(1); this.board_ui.showCorners(ids) }
  showEdges(ids) { this.player_ui.toggleHandBlur(1); this.board_ui.showEdges(ids) }
  showTiles(ids) { this.player_ui.toggleHandBlur(1); this.board_ui.showTiles(ids) }
  hideAllShown() { this.player_ui.toggleHandBlur(); this.board_ui.hideAllShown() }
}
