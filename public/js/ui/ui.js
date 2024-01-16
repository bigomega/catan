import Board from "../board/board.js"
import Game from "../game.js"
import Player from "../player/player.js"
import BoardUI from "./board_ui.js"
import PlayerUI from "./player_ui.js"
import AlertUI from "./alert_ui.js"
const $ = document.querySelector.bind(document)

export default class UI {
  #game; #board; #player;
  #temp;
  board_ui; player_ui; alert_ui;
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
      onEndTurnClick: _ => game.onEndTurn(),
      onCardClick: _ => _,
      getPossibleLocations: p => game.getPossibleLocations(p),
    })
    this.alert_ui = new AlertUI(player, st => this.#game.saveStatus(st), game.config.alert.time)
    // this.all_players_ui = new AllPlayersUI(player, opponents, this)
  }

  render() {
    this.board_ui.render()
    this.player_ui.render()
    this.alert_ui.render()
    this.$splash.classList.add('hide')
  }

  showDiceValue() {
    // Animation + Visuals
  }

  /**----------------
   * --- Board UI ---*/
  //#region

  //#endregion


  /**----------------
   * --- Player UI ---*/
  //#region

  toggleActions(bool) {
    bool && this.#game.updateAllPossibleLocations()
    this.player_ui.checkAndToggleActions(bool)
  }

  build(pid, piece, loc) {
    this.hideAllShown()
    this.board_ui.build(pid, piece, loc)
  }

  setTimer(t, pid) { this.player_ui.resetRenderTimer(t, pid) }
  //#endregion

  //   MISC
  //----------

  showCorners(ids) { this.player_ui.toggleHandBlur(1); this.board_ui.showCorners(ids) }
  showEdges(ids) { this.player_ui.toggleHandBlur(1); this.board_ui.showEdges(ids) }
  showTiles(ids) { this.player_ui.toggleHandBlur(1); this.board_ui.showTiles(ids) }
  hideAllShown() { this.player_ui.toggleHandBlur(); this.board_ui.hideAllShown() }
}
